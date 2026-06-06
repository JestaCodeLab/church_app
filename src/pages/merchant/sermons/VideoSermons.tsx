import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader, Video, Play, Share2, RefreshCw } from 'lucide-react';
import { sermonAPI, preacherAPI } from '../../../services/api';
import B2FileUploader from '../../../components/ui/B2FileUploader';
import VideoPlayer from '../../../components/ui/VideoPlayer';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import { showToast } from '../../../utils/toasts';
import SermonShareModal from './SermonShareModal';

interface Preacher {
  _id: string;
  name: string;
  title?: string;
}

interface Sermon {
  _id: string;
  title: string;
  preacher?: Preacher | null;
  preacherLegacy?: string;
  series?: string;
  videoUrl?: string;
  videoSize?: number;
  thumbnailUrl?: string;
  visibility: 'public' | 'members-only' | 'premium-only';
  duration?: number;
  stats?: { plays: number; downloads: number };
  createdAt: string;
}

const VideoSermons: React.FC = () => {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [preachers, setPreachers] = useState<Preacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [vaultUsage, setVaultUsage] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ url: string; size: number } | null>(null);
  const [newSermonData, setNewSermonData] = useState({
    title: '',
    description: '',
    preacher: '',
    series: '',
    visibility: 'public' as const
  });
  const [creatingSermon, setCreatingSermon] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sermonToDelete, setSermonToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewSermon, setPreviewSermon] = useState<Sermon | null>(null);
  const [shareSermon, setShareSermon] = useState<Sermon | null>(null);

  const fetchSermons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await sermonAPI.getSermons();
      const all: Sermon[] = res.data.data || [];
      setSermons(all.filter(s => !!s.videoUrl));
    } catch {
      showToast.error('Failed to load video sermons');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshVault = () =>
    sermonAPI.getVaultUsage().then(r => setVaultUsage(r.data.data)).catch(() => {});

  useEffect(() => {
    fetchSermons();
    refreshVault();
    preacherAPI.getPreachers().then(r => setPreachers(r.data.data || [])).catch(() => {});
  }, [fetchSermons]);

  const handleCreateSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSermonData.title) return showToast.error('Title is required');
    if (!selectedFile) return showToast.error('Please upload a video file');
    try {
      setCreatingSermon(true);
      await sermonAPI.createSermon({
        title: newSermonData.title,
        description: newSermonData.description || undefined,
        preacher: newSermonData.preacher || undefined,
        series: newSermonData.series || undefined,
        visibility: newSermonData.visibility,
        videoUrl: selectedFile.url,
        videoSize: selectedFile.size
      });
      showToast.success('Video sermon created');
      setNewSermonData({ title: '', description: '', preacher: '', series: '', visibility: 'public' });
      setSelectedFile(null);
      setShowUploadModal(false);
      fetchSermons();
      refreshVault();
    } catch {
      showToast.error('Failed to create sermon');
    } finally {
      setCreatingSermon(false);
    }
  };

  const confirmDelete = async () => {
    if (!sermonToDelete) return;
    try {
      setDeleting(true);
      await sermonAPI.deleteSermon(sermonToDelete);
      setShowDeleteModal(false);
      setSermonToDelete(null);
      fetchSermons();
      refreshVault();
      showToast.success('Sermon deleted');
    } catch {
      showToast.error('Failed to delete sermon');
    } finally {
      setDeleting(false);
    }
  };

  const preacherName = (s: Sermon) =>
    (s.preacher as Preacher)?.name || s.preacherLegacy || '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-600 rounded-xl">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Video Sermons</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage video sermon recordings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchSermons(); refreshVault(); }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
            <Plus className="w-5 h-5" />
            Upload Video
          </button>
        </div>
      </div>

      {/* Vault Storage */}
      {vaultUsage && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sermon Vault Storage</p>
            <span className="text-xs font-semibold px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
              {vaultUsage.percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all ${
                vaultUsage.percentage < 50 ? 'bg-green-500' :
                vaultUsage.percentage < 80 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(vaultUsage.percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {vaultUsage.formattedCurrent} of {vaultUsage.formattedLimit} used · {vaultUsage.sermonCount} total sermons
          </p>
        </div>
      )}

      {/* Sermons Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : sermons.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Video className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">No video sermons yet.</p>
          <button onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
            <Plus className="w-5 h-5" />
            Upload First Video
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Preacher</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Series</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Plays</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Visibility</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sermons.map(sermon => (
                <tr key={sermon._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{sermon.title}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{preacherName(sermon)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{sermon.series || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{sermon.stats?.plays ?? 0}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      sermon.visibility === 'public' ? 'bg-green-100 text-green-800' :
                      sermon.visibility === 'members-only' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-purple-100 text-purple-800'}`}>
                      {sermon.visibility}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                    <button onClick={() => setPreviewSermon(sermon)} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded" title="Play">
                      <Play className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShareSermon(sermon)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded" title="Share">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setSermonToDelete(sermon._id); setShowDeleteModal(true); }} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Video Sermon</h2>
              <button onClick={() => { setShowUploadModal(false); setSelectedFile(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreateSermon} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input type="text" value={newSermonData.title} onChange={e => setNewSermonData({...newSermonData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preacher</label>
                <select value={newSermonData.preacher} onChange={e => setNewSermonData({...newSermonData, preacher: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500">
                  <option value="">Select preacher…</option>
                  {preachers.map(p => <option key={p._id} value={p._id}>{p.name}{p.title ? ` (${p.title})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Series</label>
                <input type="text" value={newSermonData.series} onChange={e => setNewSermonData({...newSermonData, series: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibility</label>
                <select value={newSermonData.visibility} onChange={e => setNewSermonData({...newSermonData, visibility: e.target.value as any})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500">
                  <option value="public">Public</option>
                  <option value="members-only">Members Only</option>
                  <option value="premium-only">Premium Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video File *</label>
                <B2FileUploader
                  sermonType="video"
                  accept=".mp4,.mov,.avi,.webm"
                  maxSizeMb={200}
                  onUploadComplete={f => setSelectedFile({ url: f.url, size: f.size })}
                  onClear={() => setSelectedFile(null)}
                  disabled={creatingSermon}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowUploadModal(false); setSelectedFile(null); }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={creatingSermon || !selectedFile}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                  {creatingSermon && <Loader className="w-4 h-4 animate-spin" />}
                  {creatingSermon ? 'Creating…' : 'Create Sermon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewSermon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">{previewSermon.title}</p>
              <button onClick={() => setPreviewSermon(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <VideoPlayer src={previewSermon.videoUrl!} title={previewSermon.title} />
          </div>
        </div>
      )}

      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete} title="Delete Sermon"
        message="This will permanently delete the sermon from your vault."
        type="danger" isLoading={deleting} />

      {shareSermon && <SermonShareModal sermon={shareSermon} onClose={() => setShareSermon(null)} />}
    </div>
  );
};

export default VideoSermons;
