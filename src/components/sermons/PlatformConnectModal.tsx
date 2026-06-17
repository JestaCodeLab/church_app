import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Loader } from 'lucide-react';
import { audioPlatformAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';

interface PlatformConnectModalProps {
  platform: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rssUrl: string;
}

const PLATFORM_CONFIG: Record<string, any> = {
  spotify: {
    name: 'Spotify',
    type: 'rss',
    submitUrl: 'https://podcasters.spotify.com',
    description: 'Submit your podcast to Spotify for Podcasters'
  },
  apple_podcasts: {
    name: 'Apple Podcasts',
    type: 'rss',
    submitUrl: 'https://podcasts.apple.com/podcast/submit',
    description: 'Submit your podcast to Apple Podcasts Connect'
  },
  amazon_music: {
    name: 'Amazon Music',
    type: 'rss',
    submitUrl: 'https://music.amazon.com/podcasters',
    description: 'Submit your podcast to Amazon Music for Podcasters'
  },
  audiomack: {
    name: 'Audiomack',
    type: 'oauth',
    description: 'Connect via Audiomack OAuth'
  }
};

const PlatformConnectModal: React.FC<PlatformConnectModalProps> = ({
  platform,
  isOpen,
  onClose,
  onSuccess,
  rssUrl
}) => {
  const config = PLATFORM_CONFIG[platform];
  const [step, setStep] = useState(1);
  const [copiedRss, setCopiedRss] = useState(false);
  const [showUrl, setShowUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');

  if (!isOpen || !config) return null;

  const handleCopyRss = () => {
    navigator.clipboard.writeText(rssUrl);
    setCopiedRss(true);
    setTimeout(() => setCopiedRss(false), 2000);
  };

  const handleSaveRss = async () => {
    if (!showUrl.trim()) {
      showToast.error(`Please enter your ${config.name} show URL`);
      return;
    }

    try {
      setSaving(true);
      await audioPlatformAPI.createAccount({
        platform,
        connectionMethod: 'rss_verified',
        platformProfileUrl: showUrl,
        platformShowName: ''
      });
      showToast.success(`${config.name} connected successfully!`);
      onSuccess();
      onClose();
    } catch (error) {
      showToast.error(`Failed to connect ${config.name}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      showToast.error('Please enter your API key');
      return;
    }

    try {
      setSaving(true);
      await audioPlatformAPI.createAccount({
        platform,
        connectionMethod: 'api_key',
        apiKey
      });
      showToast.success(`${config.name} connected successfully!`);
      onSuccess();
      onClose();
    } catch (error) {
      showToast.error(`Failed to connect ${config.name}`);
    } finally {
      setSaving(false);
    }
  };

  const handleOAuthConnect = async () => {
    try {
      setSaving(true);
      const res = await audioPlatformAPI.initAudiomackOAuth();
      if (res.data?.authUrl) {
        window.location.href = res.data.authUrl;
      }
    } catch (error) {
      showToast.error('Failed to initiate connection');
      setSaving(false);
    }
  };

  if (config.type === 'rss') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Connect {config.name}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Steps Indicator */}
            <div className="flex justify-between mb-8">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                      s <= step
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {s}
                  </div>
                  <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                    {s === 1 ? 'Copy URL' : s === 2 ? 'Submit' : 'Verify'}
                  </span>
                </div>
              ))}
            </div>

            {/* Step 1: Copy RSS URL */}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Copy your podcast RSS feed URL below:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rssUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    onClick={handleCopyRss}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    {copiedRss ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
                >
                  Next
                </button>
              </div>
            )}

            {/* Step 2: Submit to Platform */}
            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click below to go to {config.name} and submit your RSS feed URL:
                </p>
                <a
                  href={config.submitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
                >
                  Go to {config.name}
                  <ExternalLink className="w-4 h-4" />
                </a>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  It may take 24-72 hours for your podcast to appear
                </p>
                <button
                  onClick={() => setStep(3)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            )}

            {/* Step 3: Verify & Save */}
            {step === 3 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Paste your {config.name} show/podcast URL:
                </p>
                <input
                  type="url"
                  value={showUrl}
                  onChange={e => setShowUrl(e.target.value)}
                  placeholder={`https://${config.name.toLowerCase().replace(' ', '')}.com/...`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleSaveRss}
                  disabled={saving || !showUrl.trim()}
                  className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader className="w-4 h-4 animate-spin" />}
                  {saving ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Audiomack OAuth / API Key
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Connect {config.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose how you'd like to connect {config.name}:
          </p>

          {/* OAuth Option */}
          <button
            onClick={handleOAuthConnect}
            disabled={saving}
            className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader className="w-4 h-4 animate-spin" />}
            {saving ? 'Connecting...' : `Connect with ${config.name}`}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or</span>
            </div>
          </div>

          {/* API Key Option */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              API Key (optional)
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <button
              onClick={handleSaveApiKey}
              disabled={saving || !apiKey.trim()}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium disabled:opacity-50"
            >
              Connect with API Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformConnectModal;
