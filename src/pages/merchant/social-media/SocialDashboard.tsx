import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Link2,
  CalendarDays,
  PenSquare,
  TrendingUp,
  Eye,
  Heart,
  Users,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { socialMediaAPI } from '../../../services/api';
import { SocialPost, SocialAccount, POST_STATUS_INFO, PLATFORM_INFO } from '../../../types/socialMedia';
import PostStatusBadge from '../../../components/social-media/PostStatusBadge';
import toast from 'react-hot-toast';

const SocialDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([]);
  const [stats, setStats] = useState({
    connectedAccounts: 0,
    scheduledPosts: 0,
    publishedThisWeek: 0,
    totalEngagement: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [accountsRes, postsRes, scheduledRes] = await Promise.all([
        socialMediaAPI.getAccounts(),
        socialMediaAPI.getPosts({ limit: 5, page: 1 }),
        socialMediaAPI.getPosts({ status: 'scheduled', limit: 100 })
      ]);

      const accountsData = accountsRes.data.data || [];
      const postsData = postsRes.data.data || [];
      const scheduledData = scheduledRes.data.data || [];

      setAccounts(accountsData);
      setRecentPosts(postsData);

      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const publishedThisWeek = postsData.filter(
        (p: SocialPost) => p.status === 'published' && new Date(p.createdAt) >= weekAgo
      ).length;

      let totalEngagement = 0;
      postsData.forEach((post: SocialPost) => {
        post.platforms.forEach(p => {
          totalEngagement += (p.engagement?.likes || 0) +
            (p.engagement?.comments || 0) +
            (p.engagement?.shares || 0);
        });
      });

      setStats({
        connectedAccounts: accountsData.length,
        scheduledPosts: scheduledData.length,
        publishedThisWeek,
        totalEngagement
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Connected Accounts',
      value: stats.connectedAccounts,
      icon: Link2,
      color: 'from-blue-500 to-blue-600',
      onClick: () => navigate('/social-media/accounts')
    },
    {
      label: 'Scheduled Posts',
      value: stats.scheduledPosts,
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      onClick: () => navigate('/social-media/calendar')
    },
    {
      label: 'Published This Week',
      value: stats.publishedThisWeek,
      icon: CheckCircle2,
      color: 'from-green-500 to-green-600',
      onClick: () => navigate('/social-media/calendar')
    },
    {
      label: 'Total Engagement',
      value: stats.totalEngagement,
      icon: Heart,
      color: 'from-pink-500 to-pink-600',
      onClick: () => navigate('/social-media/analytics')
    }
  ];

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Social Media
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your church's social media presence
          </p>
        </div>
        <button
          onClick={() => navigate('/social-media/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <PenSquare className="w-4 h-4" />
          Create Post
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <button
            key={card.label}
            onClick={card.onClick}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${card.color}`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {card.value}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {card.label}
            </p>
          </button>
        ))}
      </div>

      {/* Connected Accounts + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connected Accounts */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Connected Accounts
            </h2>
            <button
              onClick={() => navigate('/social-media/accounts')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Manage
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <Link2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-3">
                No accounts connected yet
              </p>
              <button
                onClick={() => navigate('/social-media/accounts')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Connect your first account
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => {
                const platformInfo = PLATFORM_INFO[account.platform];
                return (
                  <div
                    key={account._id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                  >
                    {account.profilePictureUrl ? (
                      <img
                        src={account.profilePictureUrl}
                        alt={account.platformAccountName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full ${platformInfo.bgColor} flex items-center justify-center`}>
                        <span className={`text-sm font-bold ${platformInfo.color}`}>
                          {account.platform === 'facebook' ? 'f' : 'IG'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {account.platformAccountName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {platformInfo.name}
                        {account.platformUsername && ` · @${account.platformUsername}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {account.stats.followersCount.toLocaleString()} followers
                      </span>
                      <span className={`w-2 h-2 rounded-full ${
                        account.status === 'active' ? 'bg-green-500' :
                        account.status === 'token_expired' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2">
            {[
              { label: 'Create Post', icon: PenSquare, href: '/social-media/create', color: 'text-primary-600' },
              { label: 'View Calendar', icon: CalendarDays, href: '/social-media/calendar', color: 'text-primary-600' },
              { label: 'Browse Templates', icon: LayoutDashboard, href: '/social-media/templates', color: 'text-primary-600' },
              { label: 'View Analytics', icon: TrendingUp, href: '/social-media/analytics', color: 'text-green-600' },
              { label: 'Connect Account', icon: Link2, href: '/social-media/accounts', color: 'text-orange-600' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.href)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                <action.icon className={`w-5 h-5 ${action.color}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Posts
          </h2>
          <button
            onClick={() => navigate('/social-media/calendar')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View All
          </button>
        </div>

        {recentPosts.length === 0 ? (
          <div className="text-center py-8">
            <PenSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-3">
              No posts yet
            </p>
            <button
              onClick={() => navigate('/social-media/create')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Create your first post
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <button
                key={post._id}
                onClick={() => navigate(`/social-media/posts/${post._id}`)}
                className="w-full flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                {post.media.length > 0 ? (
                  <img
                    src={post.media[0].url}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <PenSquare className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                    {post.content || 'No content'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <PostStatusBadge status={post.status} />
                    <span className="text-xs text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      {post.platforms.map((p, i) => (
                        <span
                          key={i}
                          className={`text-xs px-1.5 py-0.5 rounded ${PLATFORM_INFO[p.platform]?.bgColor} ${PLATFORM_INFO[p.platform]?.color}`}
                        >
                          {p.platform === 'facebook' ? 'FB' : 'IG'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Heart className="w-3 h-3" />
                    {post.platforms.reduce((sum, p) => sum + (p.engagement?.likes || 0), 0)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <Eye className="w-3 h-3" />
                    {post.platforms.reduce((sum, p) => sum + (p.engagement?.reach || 0), 0)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialDashboard;
