import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { sermonAPI, audioPlatformAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';

interface DistributeSermonModalProps {
  sermon: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PLATFORMS = [
  { id: 'spotify', name: 'Spotify' },
  { id: 'apple_podcasts', name: 'Apple Podcasts' },
  { id: 'amazon_music', name: 'Amazon Music' },
  { id: 'audiomack', name: 'Audiomack' }
];

const DistributeSermonModal: React.FC<DistributeSermonModalProps> = ({
  sermon,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await audioPlatformAPI.getAccounts();
      const activeAccounts = (res.data || []).filter((a: any) => a.status === 'active');
      setAccounts(activeAccounts);

      // Pre-select platforms already distributed
      const distributed = sermon.distributedTo?.map((d: any) => d.platform) || [];
      setSelectedPlatforms(distributed);
    } catch (error) {
      showToast.error('Failed to load platforms');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(p => p !== platformId);
      }
      return [...prev, platformId];
    });
  };

  const handleSave = async () => {
    if (selectedPlatforms.length === 0) {
      showToast.error('Select at least one platform');
      return;
    }

    try {
      setSaving(true);

      // Build distributedTo array
      const distributedTo = selectedPlatforms.map(platformId => ({
        platform: platformId,
        distributedAt: new Date().toISOString(),
        status: 'distributed'
      }));

      await sermonAPI.updateSermon(sermon._id, {
        distributedTo
      });

      showToast.success('Sermon distributed successfully');
      onSuccess();
      onClose();
    } catch (error) {
      showToast.error('Failed to distribute sermon');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Distribute Sermon</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{sermon.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                No platforms connected yet.{' '}
                <a
                  href="/sermons/distribution"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                  onClick={onClose}
                >
                  Set up platforms
                </a>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select which platforms to distribute this sermon to:
              </p>

              <div className="space-y-3">
                {accounts.map(account => (
                  <label
                    key={account._id}
                    className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(account.platform)}
                      onChange={() => handleTogglePlatform(account.platform)}
                      className="w-5 h-5 rounded text-primary-600 border-gray-300 dark:border-gray-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {PLATFORMS.find(p => p.id === account.platform)?.name}
                      </p>
                      {selectedPlatforms.includes(account.platform) && (
                        <p className="text-xs text-green-600 dark:text-green-400">Will be distributed</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || selectedPlatforms.length === 0}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader className="w-4 h-4 animate-spin" />}
                  {saving ? 'Distributing...' : 'Distribute'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DistributeSermonModal;
