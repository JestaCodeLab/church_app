import React, { useState, useEffect } from 'react';
import { X, Share2, Loader, Calendar, Facebook, Instagram } from 'lucide-react';
import { socialMediaAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';

interface Preacher {
  _id: string;
  name: string;
}

interface Sermon {
  _id: string;
  title: string;
  preacher?: Preacher | null;
  preacherLegacy?: string;
  series?: string;
  description?: string;
  thumbnailUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
}

interface SocialAccount {
  _id: string;
  platform: 'facebook' | 'instagram' | 'whatsapp';
  accountName: string;
  isActive: boolean;
}

interface Props {
  sermon: Sermon;
  onClose: () => void;
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  facebook: <Facebook className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  whatsapp: <span className="text-xs font-bold">WA</span>
};

const SermonShareModal: React.FC<Props> = ({ sermon, onClose }) => {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string>>({});
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('sermon church');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [posting, setPosting] = useState(false);

  const preacherName = sermon.preacher?.name || sermon.preacherLegacy || '';

  useEffect(() => {
    const defaultContent = [
      `🎙️ "${sermon.title}"`,
      preacherName ? `by ${preacherName}` : '',
      sermon.series ? `📖 Series: ${sermon.series}` : '',
      '',
      sermon.description || ''
    ].filter(Boolean).join('\n').trim();

    setContent(defaultContent);
    setHashtags(['sermon', 'church', sermon.series?.toLowerCase().replace(/\s+/g, '') || ''].filter(Boolean).join(' '));

    socialMediaAPI.getAccounts()
      .then(res => setAccounts((res.data.data || []).filter((a: SocialAccount) => a.isActive)))
      .catch(() => showToast.error('Failed to load social accounts'))
      .finally(() => setLoadingAccounts(false));
  }, [sermon, preacherName]);

  const toggleAccount = (account: SocialAccount) => {
    setSelectedAccounts(prev => {
      const next = { ...prev };
      if (next[account.platform]) {
        delete next[account.platform];
      } else {
        next[account.platform] = account._id;
      }
      return next;
    });
  };

  const handlePost = async () => {
    const platformEntries = Object.entries(selectedAccounts);
    if (platformEntries.length === 0) return showToast.error('Select at least one platform');
    if (!content.trim()) return showToast.error('Post content cannot be empty');

    try {
      setPosting(true);
      const fd = new FormData();
      fd.append('content', content.trim());
      fd.append('platforms', JSON.stringify(
        platformEntries.map(([platform, accountId]) => ({ platform, accountId }))
      ));
      fd.append('hashtags', JSON.stringify(hashtags.trim().split(/\s+/).filter(Boolean)));

      if (sermon.thumbnailUrl) {
        fd.append('mediaUrls', JSON.stringify([{ url: sermon.thumbnailUrl, type: 'image' }]));
        fd.append('postType', 'image');
      } else {
        fd.append('postType', 'text');
      }

      if (scheduleEnabled && scheduledAt) {
        fd.append('scheduledAt', new Date(scheduledAt).toISOString());
      }

      await socialMediaAPI.createPost(fd);
      showToast.success(scheduleEnabled ? 'Post scheduled successfully' : 'Post published successfully');
      onClose();
    } catch {
      showToast.error('Failed to publish post');
    } finally {
      setPosting(false);
    }
  };

  const platformGroups = accounts.reduce<Record<string, SocialAccount[]>>((acc, a) => {
    if (!acc[a.platform]) acc[a.platform] = [];
    acc[a.platform].push(a);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Share Sermon</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Sermon title */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Sharing</p>
            <p className="font-medium text-gray-900 dark:text-white">{sermon.title}</p>
            {preacherName && <p className="text-sm text-gray-500 dark:text-gray-400">{preacherName}</p>}
          </div>

          {/* Platform selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Platforms</label>
            {loadingAccounts ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader className="w-4 h-4 animate-spin" /> Loading connected accounts…
              </div>
            ) : accounts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No connected social accounts. Go to Social Media → Accounts to connect one.
              </p>
            ) : (
              <div className="space-y-2">
                {Object.entries(platformGroups).map(([platform, accs]) => (
                  <div key={platform} className="flex items-center gap-3">
                    <div className={`p-1.5 rounded ${
                      platform === 'facebook' ? 'bg-blue-100 text-blue-600' :
                      platform === 'instagram' ? 'bg-pink-100 text-pink-600' :
                      'bg-green-100 text-green-600'}`}>
                      {PLATFORM_ICONS[platform]}
                    </div>
                    <select
                      value={selectedAccounts[platform] || ''}
                      onChange={e => {
                        if (!e.target.value) {
                          setSelectedAccounts(prev => { const n = {...prev}; delete n[platform]; return n; });
                        } else {
                          setSelectedAccounts(prev => ({ ...prev, [platform]: e.target.value }));
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Not selected</option>
                      {accs.map(a => <option key={a._id} value={a._id}>{a.accountName}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Post Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hashtags</label>
            <input
              type="text"
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              placeholder="sermon church faith"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">Space-separated, without #</p>
          </div>

          {/* Schedule toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={scheduleEnabled} onChange={e => setScheduleEnabled(e.target.checked)}
                className="w-4 h-4 accent-primary-600 rounded" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Schedule for later
              </span>
            </label>
            {scheduleEnabled && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="mt-2 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button onClick={handlePost} disabled={posting || Object.keys(selectedAccounts).length === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {posting && <Loader className="w-4 h-4 animate-spin" />}
            {posting ? 'Posting…' : scheduleEnabled ? 'Schedule Post' : 'Post Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SermonShareModal;
