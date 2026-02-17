import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Link2,
  RefreshCw,
  Trash2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Facebook,
  Instagram
} from 'lucide-react';
import { socialMediaAPI } from '../../../services/api';
import { SocialAccount, PLATFORM_INFO } from '../../../types/socialMedia';
import toast from 'react-hot-toast';

const SocialAccounts: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();

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
        no_pages: 'No Facebook Pages found. You need a Facebook Page to connect.',
        server_error: 'Something went wrong. Please try again.',
        invalid_request: 'Invalid request. Please try again.'
      };
      toast.error(errorMessages[error] || 'Failed to connect account.');
    }
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await socialMediaAPI.getAccounts();
      setAccounts(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const response = await socialMediaAPI.initOAuth('facebook');
      const { authUrl } = response.data.data;
      window.location.href = authUrl;
    } catch (error) {
      toast.error('Failed to initiate connection');
      setConnecting(false);
    }
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
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to refresh token. You may need to reconnect.');
    } finally {
      setRefreshing(null);
    }
  };

  const facebookAccounts = accounts.filter(a => a.platform === 'facebook');
  const instagramAccounts = accounts.filter(a => a.platform === 'instagram');

  if (loading) {
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
          Connect your Facebook Page and Instagram Business account to start posting
        </p>
      </div>

      {/* Connect New Account */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Facebook */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Facebook className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Facebook</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Connect a Facebook Page to publish posts
              </p>
            </div>
          </div>

          {facebookAccounts.length > 0 ? (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              {facebookAccounts.length} page(s) connected
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Connect Facebook
            </button>
          )}
        </div>

        {/* Instagram */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
              <Instagram className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Instagram</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Auto-detected from connected Facebook Pages
              </p>
            </div>
          </div>

          {instagramAccounts.length > 0 ? (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              {instagramAccounts.length} account(s) connected
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Connect a Facebook Page with a linked Instagram Business account to enable Instagram posting.
            </p>
          )}
        </div>
      </div>

      {/* Account List */}
      {accounts.length > 0 && (
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
                      {account.platform === 'facebook' ? (
                        <Facebook className={`w-6 h-6 ${platformInfo.color}`} />
                      ) : (
                        <Instagram className={`w-6 h-6 ${platformInfo.color}`} />
                      )}
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
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Connect Another Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialAccounts;
