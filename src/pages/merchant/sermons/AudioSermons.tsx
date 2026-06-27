import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, Headphones, Play, Copy, Check, Share2, RefreshCw, Send, X } from 'lucide-react';
import { useBranch } from '../../../context/BranchContext';
import { sermonAPI, preacherAPI } from '../../../services/api';
import B2FileUploader from '../../../components/ui/B2FileUploader';
import AudioPlayer from '../../../components/ui/AudioPlayer';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import { showToast } from '../../../utils/toasts';
import SermonShareModal from './SermonShareModal';
import DistributeSermonModal from '../../../components/sermons/DistributeSermonModal';
import Loader from '../../../components/ui/Loader';

interface Preacher {
  _id: string;
  name: string;
  title?: string;
  photo?: { url: string };
}

interface Sermon {
  _id: string;
  title: string;
  preacher?: Preacher | null;
  preacherLegacy?: string;
  series?: string;
  audioUrl?: string;
  audioSize?: number;
  thumbnailUrl?: string;
  visibility: 'public' | 'members-only' | 'premium-only';
  duration?: number;
  stats?: { plays: number; downloads: number };
  publishedAt?: string;
  createdAt: string;
}

const AudioSermons: React.FC = () => {
  const navigate = useNavigate();
  const { selectedBranch } = useBranch();
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
    visibility: 'public' as 'public' | 'members-only' | 'premium-only'
  });
  const [creatingSermon, setCreatingSermon] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sermonToDelete, setSermonToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewSermon, setPreviewSermon] = useState<Sermon | null>(null);
  const [shareSermon, setShareSermon] = useState<Sermon | null>(null);
  const [distributeSermon, setDistributeSermon] = useState<Sermon | null>(null);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);

  const fetchSermons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await sermonAPI.getSermons({ type: 'audio' });
      const all: Sermon[] = res.data.data || [];
      setSermons(all.filter(s => !!s.audioUrl));
    } catch {
      showToast.error('Failed to load audio sermons');
    } finally {
      setLoading(false);
    }
  }, [selectedBranch?._id]);

  useEffect(() => {
    fetchSermons();
    sermonAPI.getVaultUsage().then(r => setVaultUsage(r.data.data)).catch(() => {});
    preacherAPI.getPreachers().then(r => setPreachers(r.data.data || [])).catch(() => {});
  }, [fetchSermons]);

  const handleCreateSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSermonData.title) return showToast.error('Title is required');
    if (!editingSermon && !selectedFile) return showToast.error('Please upload an audio file');

    try {
      setCreatingSermon(true);

      if (editingSermon) {
        // Update existing sermon
        await sermonAPI.updateSermon(editingSermon._id, {
          title: newSermonData.title,
          description: newSermonData.description || undefined,
          preacher: newSermonData.preacher || undefined,
          series: newSermonData.series || undefined,
          visibility: newSermonData.visibility
        });
        showToast.success('Audio sermon updated');
      } else {
        // Create new sermon
        await sermonAPI.createSermon({
          title: newSermonData.title,
          description: newSermonData.description || undefined,
          preacher: newSermonData.preacher || undefined,
          series: newSermonData.series || undefined,
          visibility: newSermonData.visibility,
          audioUrl: selectedFile!.url,
          audioSize: selectedFile!.size
        });
        showToast.success('Audio sermon created');
      }

      closeUploadModal();
      fetchSermons();
      sermonAPI.getVaultUsage().then(r => setVaultUsage(r.data.data)).catch(() => {});
    } catch {
      showToast.error(editingSermon ? 'Failed to update sermon' : 'Failed to create sermon');
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
      sermonAPI.getVaultUsage().then(r => setVaultUsage(r.data.data)).catch(() => {});
      showToast.success('Sermon deleted');
    } catch {
      showToast.error('Failed to delete sermon');
    } finally {
      setDeleting(false);
    }
  };

  const getStorageColor = (pct: number) =>
    pct < 50 ? 'bg-green-500' : pct < 80 ? 'bg-yellow-500' : 'bg-red-500';

  const preacherName = (s: Sermon) =>
    (s.preacher as Preacher)?.name || s.preacherLegacy || '—';

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setEditingSermon(null);
    setNewSermonData({ title: '', description: '', preacher: '', series: '', visibility: 'public' });
  };

  const handleEditSermon = (sermon: Sermon) => {
    setEditingSermon(sermon);
    setNewSermonData({
      title: sermon.title,
      description: '',
      preacher: (sermon.preacher as Preacher)?._id || '',
      series: sermon.series || '',
      visibility: sermon.visibility
    });
    setShowUploadModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-600 rounded-xl">
            <Headphones className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audio Sermons</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage audio sermon recordings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchSermons(); sermonAPI.getVaultUsage().then(r => setVaultUsage(r.data.data)).catch(() => {}); }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              setNewSermonData({ title: '', description: '', preacher: '', series: '', visibility: 'public' });
              setSelectedFile(null);
              setShowUploadModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Upload Audio
          </button>
        </div>
      </div>

      {/* Vault + Distribution Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 border border-primary-200 dark:border-primary-800 rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Send className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary-900 dark:text-primary-100">Reach more listeners</p>
              <p className="text-sm text-primary-700 dark:text-primary-300 mb-3">Distribute your sermons to Spotify, Apple Podcasts, Amazon Music, and more</p>
              <button
                onClick={() => navigate('/sermons/distribution')}
                className="px-4 py-2 mb-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors text-sm text-center w-fit"
              >
                Set up distribution
              </button>
            </div>
          </div>
        </div>
        {vaultUsage && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sermon Vault Storage</p>
              <span className="text-xs font-semibold px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                {vaultUsage.percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div className={`${getStorageColor(vaultUsage.percentage)} h-2 rounded-full`} style={{ width: `${vaultUsage.percentage}%` }} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {vaultUsage.formattedCurrent} of {vaultUsage.formattedLimit} used · {vaultUsage.sermonCount} total sermons
            </p>
          </div>
        )}
      </div>

      {/* Sermons Table */}
      {loading ? (
        <Loader variant="skeleton-table" count={4} />
      ) : sermons.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Headphones className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">No audio sermons yet.</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Upload First Audio
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
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
                    {sermon.series && <p className="text-xs text-gray-400">{sermon.series}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{preacherName(sermon)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{sermon.series || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(sermon.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
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
                    <button onClick={() => { setPreviewSermon(sermon); sermonAPI.trackPlay(sermon._id); }} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded" title="Play">
                      <Play className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEditSermon(sermon)} className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShareSermon(sermon)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded" title="Share">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setDistributeSermon(sermon); setShowDistributeModal(true); }} className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded" title="Distribute">
                      <Send className="w-4 h-4" />
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingSermon ? 'Edit Audio Sermon' : 'Upload Audio Sermon'}
              </h2>
              <button onClick={closeUploadModal} className="text-gray-400 hover:text-gray-600">✕</button>
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
              {!editingSermon && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audio File *</label>
                  <B2FileUploader
                    sermonType="audio"
                    accept=".mp3,.wav,.aac,.m4a,.flac"
                    maxSizeMb={50}
                    onUploadComplete={f => setSelectedFile({ url: f.url, size: f.size })}
                    onClear={() => setSelectedFile(null)}
                    disabled={creatingSermon}
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeUploadModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={creatingSermon || (!editingSermon && !selectedFile)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                  {creatingSermon && <Loader variant="inline" size="sm" />}
                  <span>
                    {creatingSermon
                      ? (editingSermon ? 'Updating…' : 'Creating…')
                      : (editingSermon ? 'Update Sermon' : 'Create Sermon')
                    }
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewSermon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full">
            <AudioPlayer
              sermonId={previewSermon._id}
              title={previewSermon.title}
              preacher={preacherName(previewSermon)}
              series={previewSermon.series}
              date={new Date(previewSermon.createdAt).toLocaleDateString()}
              onClose={() => setPreviewSermon(null)}
            />
          </div>
        </div>
      )}

      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete} title="Delete Sermon"
        message="This will permanently delete the sermon from your vault."
        type="danger" isLoading={deleting} />

      {shareSermon && <SermonShareModal sermon={shareSermon} onClose={() => setShareSermon(null)} />}

      {distributeSermon && (
        <DistributeSermonModal
          sermon={distributeSermon}
          isOpen={showDistributeModal}
          onClose={() => {
            setShowDistributeModal(false);
            setDistributeSermon(null);
          }}
          onSuccess={() => {
            fetchSermons();
          }}
        />
      )}
    </div>
  );
};

export default AudioSermons;
