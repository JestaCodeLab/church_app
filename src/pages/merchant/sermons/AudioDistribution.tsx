import React, { useState, useEffect } from 'react';
import { Music, Music2, Apple, Radio, Volume2, Copy, Check, Settings, Trash2, ExternalLink } from 'lucide-react';
import { audioPlatformAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import Loader from '../../../components/ui/Loader';
import PlatformConnectModal from '../../../components/sermons/PlatformConnectModal';
import ConfirmModal from '../../../components/modals/ConfirmModal';

interface AudioPlatformAccount {
  _id: string;
  platform: string;
  status: string;
  platformProfileUrl?: string;
  platformShowName?: string;
  connectedAt: string;
}

const PLATFORMS = [
  {
    id: 'spotify',
    name: 'Spotify',
    icon: Music2,
    color: '#1DB954',
    description: 'Distribute to Spotify for Podcasters',
    url: 'https://podcasters.spotify.com'
  },
  {
    id: 'apple_podcasts',
    name: 'Apple Podcasts',
    icon: Apple,
    color: '#555555',
    description: 'Distribute to Apple Podcasts',
    url: 'https://podcasts.apple.com'
  },
  {
    id: 'amazon_music',
    name: 'Amazon Music',
    icon: Radio,
    color: '#FF9900',
    description: 'Distribute to Amazon Music for Podcasters',
    url: 'https://music.amazon.com/podcasters'
  },
  {
    id: 'audiomack',
    name: 'Audiomack',
    icon: Volume2,
    color: '#FF6B00',
    description: 'Connect via OAuth or API key',
    url: 'https://www.audiomack.com'
  }
];

const AudioDistribution: React.FC = () => {
  const [accounts, setAccounts] = useState<AudioPlatformAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rssUrl, setRssUrl] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await audioPlatformAPI.getAccounts();
      setAccounts(res.data?.data || []);

      // Build RSS URL from merchant subdomain
      const subdomain = window.location.hostname.split('.')[0];
      setRssUrl(`${window.location.protocol}//api.${window.location.hostname}/api/v1/public/podcast/${subdomain}`);
    } catch (error) {
      showToast.error('Failed to load platform accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (platformId: string) => {
    setSelectedPlatform(platformId);
    setShowConnectModal(true);
  };

  const handleDisconnect = (accountId: string) => {
    setDeleteTargetId(accountId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setDeleting(true);
      await audioPlatformAPI.deleteAccount(deleteTargetId);
      showToast.success('Platform disconnected');
      fetchAccounts();
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    } catch (error) {
      showToast.error('Failed to disconnect platform');
    } finally {
      setDeleting(false);
    }
  };

  const copyRssUrl = () => {
    navigator.clipboard.writeText(rssUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPlatformAccount = (platformId: string) => {
    return accounts.find(a => a.platform === platformId);
  };

  const getStatusBadge = (account: AudioPlatformAccount) => {
    if (account.status === 'active') {
      return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Connected</span>;
    }
    return <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"><span className="w-2 h-2 bg-gray-400 rounded-full"></span>Not Connected</span>;
  };

  if (loading) {
    return <Loader variant="skeleton-dashboard" />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-600 rounded-xl">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audio Distribution</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Connect your podcast to streaming platforms</p>
          </div>
        </div>
      </div>

      {/* RSS Feed URL Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Podcast RSS Feed</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Copy this URL and submit it to each platform's podcast directory. It may take 24-72 hours for your podcast to appear.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={rssUrl}
            readOnly
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm rounded-lg border border-gray-300 dark:border-gray-600"
          />
          <button
            onClick={copyRssUrl}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Platforms Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Podcast Platforms</h2>
        <div className="space-y-3">
          {PLATFORMS.map(platform => {
            const Icon = platform.icon;
            const account = getPlatformAccount(platform.id);
            return (
              <div
                key={platform.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" style={{ color: platform.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{platform.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{platform.description}</p>
                      {account?.status === 'active' && account?.platformProfileUrl && (
                        <a
                          href={account.platformProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 mt-1"
                        >
                          View on {platform.name}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>{getStatusBadge(account || { status: 'disconnected', _id: '', platform: platform.id, connectedAt: '' })}</div>
                    {account?.status === 'active' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConnect(platform.id)}
                          className="px-4 py-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors font-medium"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDisconnect(account._id)}
                          className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnect(platform.id)}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {showConnectModal && selectedPlatform && (
        <PlatformConnectModal
          platform={selectedPlatform}
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          onSuccess={() => {
            setShowConnectModal(false);
            fetchAccounts();
          }}
          rssUrl={rssUrl}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Disconnect Platform"
        message="This platform will be disconnected. You can reconnect anytime."
        type="warning"
        isLoading={deleting}
      />
    </div>
  );
};

export default AudioDistribution;
