import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Link2,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Facebook,
  Instagram,
  Lock,
  Music,
  Play,
  Send,
  GitBranch,
  Building2
} from 'lucide-react';
import { socialMediaAPI, settingsAPI } from '../../../services/api';
import { SocialAccount, PLATFORM_INFO } from '../../../types/socialMedia';
import WhatsAppQRModal from '../../../components/social-media/WhatsAppQRModal';
import BranchSelectionModal from '../../../components/social-media/BranchSelectionModal';
import { useSocialBranchSelection } from '../../../hooks/useSocialBranchSelection';
import toast from 'react-hot-toast';

const SocialAccounts: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  // Start with empty array - only set to actual allowed platforms from subscription
  const [allowedPlatforms, setAllowedPlatforms] = useState<string[]>([]);
  const [showWhatsAppQR, setShowWhatsAppQR] = useState(false);
  
  // Use shared branch selection hook
  const { branches, selectedBranch, showBranchModal, loadingBranches, setShowBranchModal, selectBranch } = useSocialBranchSelection();

  useEffect(() => {
    // Handle OAuth redirect params
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    const count = searchParams.get('count');

    if (connected === 'true') {
      toast.success(`Successfully connected ${count || ''} account(s)!`);
    }
    if (error) {
      const errorMessages: Record<string, string> = {
        denied: 'You declined the connection request.',
        invalid_state: 'Connection expired. Please try again.',
        expired: 'Connection session expired. Please try again.',
        no_pages: 'No Pages found. You need a Page to connect.',
        server_error: 'Something went wrong. Please try again.',
        invalid_request: 'Invalid request. Please try again.'
      };
      toast.error(errorMessages[error] || 'Failed to connect account.');
    }
  }, [searchParams]);

  // Fetch accounts when branch changes
  useEffect(() => {
    if (selectedBranch) {
      fetchAccountsAndLimits();
    }
  }, [selectedBranch]);

  const fetchAccountsAndLimits = async () => {
    if (!selectedBranch) return;
    
    try {
      setLoading(true);
      
      // Fetch social accounts for selected branch
      const accountsResponse = await socialMediaAPI.getAccounts({ branchId: selectedBranch });
      setAccounts(accountsResponse.data.data || []);

      // Fetch current subscription plan to get allowed platforms
      try {
        const planResponse = await settingsAPI.getSubscription();
        const subscription = planResponse.data.data.subscription;
        const planDetails = subscription.planDetails;
        
        // Get allowed platforms from plan limits (already cleaned by backend)
        const allowedPlatformsLimit = planDetails?.limits?.socialMediaAllowedPlatforms || 
                                      subscription.limits?.socialMediaAllowedPlatforms;

        // Only set platforms if we have valid data from subscription
        if (Array.isArray(allowedPlatformsLimit) && allowedPlatformsLimit.length > 0) {
          setAllowedPlatforms(allowedPlatformsLimit);
        } else {
          // No platforms in plan - keep array empty (all locked)
          setAllowedPlatforms([]);
        }
      } catch (error) {
        // If plan fetch fails, keep platforms locked (empty array)
        console.error('Failed to fetch plan limits:', error);
        setAllowedPlatforms([]);
      }
    } catch (error) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    if (!selectedBranch) {
      toast.error('Please select a branch first');
      return;
    }

    // Check if platform is allowed in their plan
    if (!allowedPlatforms.includes(platform)) {
      toast.error(`${getPlatformDisplayName(platform)} is not available in your current plan. Please upgrade.`);
      return;
    }

    if (platform === 'whatsapp') {
      setShowWhatsAppQR(true);
      return;
    }

    // OAuth-based platforms (facebook handles instagram too via Meta)
    if (platform === 'facebook' || platform === 'instagram') {
      try {
        setConnecting(true);
        const response = await socialMediaAPI.initOAuth(platform, { branchId: selectedBranch });
        const { authUrl } = response.data.data;
        window.location.href = authUrl;
      } catch (error) {
        toast.error('Failed to initiate connection');
        setConnecting(false);
      }
      return;
    }

    // Platforms not yet implemented
    toast.error(`${getPlatformDisplayName(platform)} integration is coming soon!`);
  };

  const handleDisconnect = async (accountId: string) => {
    if (!window.confirm('Are you sure you want to disconnect this account?')) return;

    try {
      setDisconnecting(accountId);
      await socialMediaAPI.disconnectAccount(accountId);
      toast.success('Account disconnected');
      setAccounts(prev => prev.filter(a => a._id !== accountId));
    } catch (error) {
      toast.error('Failed to disconnect account');
    } finally {
      setDisconnecting(null);
    }
  };

  const handleRefreshToken = async (accountId: string) => {
    try {
      setRefreshing(accountId);
      await socialMediaAPI.refreshToken(accountId);
      toast.success('Token refreshed successfully');
      fetchAccountsAndLimits();
    } catch (error) {
      toast.error('Failed to refresh token. You may need to reconnect.');
    } finally {
      setRefreshing(null);
    }
  };

  // Helper function to get icon for platform
  const getPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'facebook':
        return <Facebook className={`w-6 h-6 ${allowedPlatforms.includes(platform) ? 'text-blue-600' : 'text-gray-400'}`} />;
      case 'instagram':
        return <Instagram className={`w-6 h-6 ${allowedPlatforms.includes(platform) ? 'text-pink-600' : 'text-gray-400'}`} />;
      case 'whatsapp':
        return <img src="/images/whatsapp-logo.webp" alt="WhatsApp" className={`w-6 h-6 ${allowedPlatforms.includes(platform) ? '' : 'opacity-40 grayscale'}`} />;
      case 'tiktok':
        return <Music className={`w-6 h-6 ${allowedPlatforms.includes(platform) ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} />;
      case 'youtube':
        return <Play className={`w-6 h-6 ${allowedPlatforms.includes(platform) ? 'text-red-600' : 'text-gray-400'}`} />;
      case 'telegram':
        return <Send className={`w-6 h-6 ${allowedPlatforms.includes(platform) ? 'text-blue-500' : 'text-gray-400'}`} />;
      default:
        return null;
    }
  };

  const getPlatformDisplayName = (platform: string) => {
    switch(platform) {
      case 'facebook': return 'Facebook';
      case 'instagram': return 'Instagram';
      case 'whatsapp': return 'WhatsApp';
      case 'tiktok': return 'TikTok';
      case 'youtube': return 'YouTube';
      case 'telegram': return 'Telegram';
      default: return platform;
    }
  };


  if (loadingBranches) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Connected Accounts
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Connect your social media accounts to start posting and messaging
        </p>
      </div>

      {/* Loading state for accounts */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      )}

      {/* Connect New Account */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(['whatsapp', 'facebook', 'instagram', 'tiktok', 'youtube', 'telegram'] as const).map((platform) => {
          const platformAccounts = accounts.filter(a => a.platform === platform);
          const isAllowed = allowedPlatforms.includes(platform);
          const displayName = getPlatformDisplayName(platform);
          
          return (
            <div
              key={platform}
              className={`rounded-xl shadow-sm border p-6 transition-all ${
                isAllowed 
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isAllowed 
                    ? 'bg-gray-100 dark:bg-gray-700' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {getPlatformIcon(platform)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold ${
                      isAllowed 
                        ? 'text-gray-900 dark:text-gray-100' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {displayName}
                    </h3>
                    {!isAllowed && (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p className={`text-xs ${
                    isAllowed 
                      ? 'text-gray-500 dark:text-gray-400' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {isAllowed
                      ? `Connect your ${displayName} account`
                      : 'Not available in your current plan'}
                  </p>
                </div>
              </div>

              {isAllowed ? (
                <>
                  {platformAccounts.length > 0 ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      {platformAccounts.length} account(s) connected
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(platform)}
                      disabled={connecting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {connecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Link2 className="w-4 h-4" />
                      )}
                      Connect {displayName}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Upgrade your plan to connect {displayName}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Account List */}
      {!loading && accounts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              All Accounts ({accounts.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {accounts.map((account) => {
              const platformInfo = PLATFORM_INFO[account.platform];
              const isExpired = account.status === 'token_expired';
              const hasError = account.status === 'error';

              return (
                <div key={account._id} className="p-4 flex items-center gap-4">
                  {/* Avatar */}
                  {account.profilePictureUrl ? (
                    <img
                      src={account.profilePictureUrl}
                      alt={account.platformAccountName}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full ${platformInfo.bgColor} flex items-center justify-center`}>
                      {getPlatformIcon(account.platform)}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {account.platformAccountName}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${platformInfo.bgColor} ${platformInfo.color}`}>
                        {platformInfo.name}
                      </span>
                    </div>
                    {account.platformUsername && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{account.platformUsername}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>{account.stats.followersCount.toLocaleString()} followers</span>
                      <span>{account.stats.postsCount.toLocaleString()} posts</span>
                      <span>Connected {new Date(account.connectedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {(isExpired || hasError) && (
                      <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {isExpired ? 'Token expired' : 'Error'}
                      </div>
                    )}
                    {account.status === 'active' && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Active
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {(isExpired || hasError) && (
                      <button
                        onClick={() => handleRefreshToken(account._id)}
                        disabled={refreshing === account._id}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Refresh token"
                      >
                        {refreshing === account._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDisconnect(account._id)}
                      disabled={disconnecting === account._id}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Disconnect account"
                    >
                      {disconnecting === account._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reconnect button at bottom */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {allowedPlatforms.length > 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Connect more accounts from the platform cards above.
              </p>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Lock className="w-4 h-4" />
                <span>Social media connections limited by your plan. Upgrade to add more accounts.</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Branch Selection Modal */}
      <BranchSelectionModal
        isOpen={showBranchModal}
        branches={branches}
        onSelect={selectBranch}
      />
      
      {/* WhatsApp QR Modal */}
      <WhatsAppQRModal
        isOpen={showWhatsAppQR}
        onClose={() => setShowWhatsAppQR(false)}
        onConnected={() => fetchAccountsAndLimits()}
        branchId={selectedBranch || undefined}
      />
    </div>
  );
};

export default SocialAccounts;
