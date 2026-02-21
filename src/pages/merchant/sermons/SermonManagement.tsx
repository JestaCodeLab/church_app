import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader, Music, CheckCircle, Play, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sermonAPI } from '../../../services/api';
import BytescaleUploader from '../../../components/ui/BytescaleUploader';
import AudioPlayer from '../../../components/ui/AudioPlayer';
import VideoPlayer from '../../../components/ui/VideoPlayer';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import { showToast } from '../../../utils/toasts';

interface Sermon {
  _id: string;
  title: string;
  preacher?: string;
  series?: string;
  audioUrl?: string;
  videoUrl?: string;
  visibility: 'public' | 'members-only' | 'premium-only';
  duration?: number;
  createdAt: string;
}

/**
 * Sermon Management Page
 * Allows merchants to manage their sermon vault
 */
const SermonManagement: React.FC = () => {
  const navigate = useNavigate();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vaultUsage, setVaultUsage] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fileType, setFileType] = useState<'audio' | 'video'>('audio');
  const [selectedFile, setSelectedFile] = useState<{
    type: 'audio' | 'video';
    url: string;
    size: number;
  } | null>(null);
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

  // Fetch sermons and vault usage on mount
  useEffect(() => {
    fetchSermons();
    fetchVaultUsage();
  }, []);

  const fetchSermons = async () => {
    try {
      setLoading(true);
      const response = await sermonAPI.getSermons();
      setSermons(response.data.data || []);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load sermons';
      setError(errorMsg);
      showToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchVaultUsage = async () => {
    try {
      const response = await sermonAPI.getVaultUsage();
      setVaultUsage(response.data.data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load vault usage';
      console.error(errorMsg, err);
      showToast.error(errorMsg);
    }
  };

  const handleUploadComplete = (fileData: { type: 'audio' | 'video'; url: string; size: number }) => {
    setSelectedFile(fileData);
  };

  const handleCreateSermon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSermonData.title) {
      setError('Sermon title is required');
      return;
    }

    if (!selectedFile) {
      setError('Please upload an audio or video file');
      return;
    }

    try {
      setCreatingSermon(true);
      setError(null);

      // Create sermon with metadata
      const sermonPayload = {
        title: newSermonData.title,
        description: newSermonData.description || undefined,
        preacher: newSermonData.preacher || undefined,
        series: newSermonData.series || undefined,
        visibility: newSermonData.visibility,
        [selectedFile.type === 'audio' ? 'audioUrl' : 'videoUrl']: selectedFile.url,
        [selectedFile.type === 'audio' ? 'audioSize' : 'videoSize']: selectedFile.size
      };

      await sermonAPI.createSermon(sermonPayload as any);
      showToast.success('Sermon created successfully');

      // Reset form and close modal
      setNewSermonData({
        title: '',
        description: '',
        preacher: '',
        series: '',
        visibility: 'public'
      });
      setSelectedFile(null);
      setShowUploadModal(false);

      // Refresh list
      await fetchSermons();
      await fetchVaultUsage();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create sermon';
      setError(errorMsg);
      showToast.error(errorMsg);
    } finally {
      setCreatingSermon(false);
    }
  };

  const handleDeleteSermon = (id: string) => {
    setSermonToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!sermonToDelete) return;

    try {
      setDeleting(true);
      await sermonAPI.deleteSermon(sermonToDelete);
      setShowDeleteModal(false);
      setSermonToDelete(null);
      await fetchSermons();
      await fetchVaultUsage();
      showToast.success('Sermon deleted successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete sermon';
      setError(errorMsg);
      showToast.error(errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStorageColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-600 rounded-xl">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sermon Vault</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage and organize your sermons</p>
          </div>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          New Sermon
        </button>
      </div>

      {/* Vault Usage Card */}
      {vaultUsage && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Storage Usage</h2>
            <span className="text-xs font-semibold px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
              {vaultUsage.percentage}%
            </span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {vaultUsage.formattedCurrent} of {vaultUsage.formattedLimit}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{vaultUsage.formattedAvailable} available</span>
              </div>
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`${getStorageColor(vaultUsage.percentage)} h-3 rounded-full transition-all`}
                  style={{ width: `${vaultUsage.percentage}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 text-xs">Used</p>
                <p className="font-bold text-gray-900 dark:text-white mt-1">{vaultUsage.formattedCurrent}</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 text-xs">Available</p>
                <p className="font-bold text-gray-900 dark:text-white mt-1">{vaultUsage.formattedAvailable}</p>
              </div>
              <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg border border-primary-200 dark:border-primary-700/50">
                <p className="text-primary-600 dark:text-primary-400 text-xs font-medium">Sermons</p>
                <p className="font-bold text-primary-900 dark:text-primary-300 mt-1">{vaultUsage.sermonCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Sermons List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Loading sermons...</p>
          </div>
        </div>
      ) : sermons.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Music className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4 font-medium">No sermons yet. Create your first one!</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Upload First Sermon
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Preacher</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Visibility</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sermons.map((sermon) => (
                <tr key={sermon._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{sermon.title}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{sermon.preacher || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs font-medium">
                      {sermon.audioUrl ? 'Audio' : 'Video'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${sermon.visibility === 'public'
                        ? 'bg-green-100 text-green-800'
                        : sermon.visibility === 'members-only'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-purple-100 text-purple-800'
                        }`}
                    >
                      {sermon.visibility}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(sermon.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => setPreviewSermon(sermon)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Preview sermon"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/sermons/${sermon._id}/edit`)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSermon(sermon._id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-primary-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upload New Sermon</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setError(null);
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSermon} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-0">Title *</label>
                <input
                  type="text"
                  value={newSermonData.title}
                  onChange={(e) => setNewSermonData({ ...newSermonData, title: e.target.value })}
                  placeholder="Sermon title"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={creatingSermon}
                />
              </div>

              {/* Preacher */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-0">Preacher</label>
                <input
                  type="text"
                  value={newSermonData.preacher}
                  onChange={(e) => setNewSermonData({ ...newSermonData, preacher: e.target.value })}
                  placeholder="Preacher name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={creatingSermon}
                />
              </div>

              {/* Series */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-0">Series</label>
                <input
                  type="text"
                  value={newSermonData.series}
                  onChange={(e) => setNewSermonData({ ...newSermonData, series: e.target.value })}
                  placeholder="Sermon series (optional)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={creatingSermon}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-0">Description</label>
                <textarea
                  value={newSermonData.description}
                  onChange={(e) => setNewSermonData({ ...newSermonData, description: e.target.value })}
                  placeholder="Sermon description (optional)"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={creatingSermon}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-0">Upload File *</label>
                <div className="space-y-4">
                  <div className="flex gap-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-700/50">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="radio"
                        name="fileType"
                        value="audio"
                        checked={fileType === 'audio'}
                        onChange={() => {
                          setFileType('audio');
                          setSelectedFile(null);
                        }}
                        className="w-4 h-4 accent-primary-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Audio File</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="radio"
                        name="fileType"
                        value="video"
                        checked={fileType === 'video'}
                        onChange={() => {
                          setFileType('video');
                          setSelectedFile(null);
                        }}
                        className="w-4 h-4 accent-primary-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Video File</span>
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="p-3 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg border border-secondary-200 dark:border-secondary-700/50 flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-secondary-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-secondary-800 dark:text-secondary-300">File uploaded</p>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                          {selectedFile.type === 'audio' ? 'Audio File' : 'Video File'} {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                  )}

                  <BytescaleUploader
                    acceptType={fileType}
                    maxFileSize={fileType === 'audio' ? 52428800 : 524288000}
                    onUploadComplete={handleUploadComplete}
                    onError={(error) => showToast.error(error)}
                    disabled={creatingSermon}
                  />
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visibility</label>
                <select
                  value={newSermonData.visibility}
                  onChange={(e) => setNewSermonData({ ...newSermonData, visibility: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={creatingSermon}
                >
                  <option value="public">Public</option>
                  <option value="members-only">Members Only</option>
                  <option value="premium-only">Premium Only</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  disabled={creatingSermon}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={creatingSermon || !selectedFile}
                >
                  {creatingSermon && <Loader className="w-4 h-4 animate-spin" />}
                  {creatingSermon ? 'Creating...' : 'Create Sermon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Sermon"
        message="This action will delete this sermon from your vault. This cannot be undone."
        type="danger"
        isLoading={deleting}
      />

      {/* Preview Sermon Modal */}
      {previewSermon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

            {/* Media Player */}
            <div>
              {previewSermon.audioUrl ? (
                <AudioPlayer
                  src={previewSermon.audioUrl}
                  title={previewSermon.title}
                  preacher={previewSermon.preacher}
                  series={previewSermon.series}
                  date={new Date(previewSermon.createdAt).toLocaleDateString()}
                  onClose={() => setPreviewSermon(null)}
                />
              ) : previewSermon.videoUrl ? (
                <VideoPlayer src={previewSermon.videoUrl} title={previewSermon.title} />
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No media available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SermonManagement;
