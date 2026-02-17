import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Users,
  Clock,
  Loader2,
  PenSquare,
  RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { socialMediaAPI } from '../../../services/api';
import toast from 'react-hot-toast';

interface OverviewData {
  accounts: number;
  posts: {
    total: number;
    published: number;
    scheduled: number;
    drafts: number;
    publishedThisWeek: number;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    impressions: number;
    saves: number;
    clicks: number;
    rate: number;
  };
  topPosts: Array<{
    _id: string;
    content: string;
    postType: string;
    createdAt: string;
    totalEngagement: number;
    totalReach: number;
  }>;
}

interface EngagementDataPoint {
  date: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  posts: number;
}

interface BestTimeSlot {
  dayOfWeek: number;
  hour: number;
  avgEngagement: number;
  postCount: number;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = ['12a', '1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a',
  '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p', '11p'];

const SocialAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [engagementData, setEngagementData] = useState<EngagementDataPoint[]>([]);
  const [bestTimes, setBestTimes] = useState<BestTimeSlot[]>([]);
  const [engagementDays, setEngagementDays] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchEngagement();
  }, [engagementDays]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, bestTimesRes] = await Promise.all([
        socialMediaAPI.getAnalyticsOverview(),
        socialMediaAPI.getBestTimes()
      ]);
      setOverview(overviewRes.data.data);
      setBestTimes(bestTimesRes.data.data || []);
      await fetchEngagement();
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchEngagement = async () => {
    try {
      const res = await socialMediaAPI.getEngagement({ days: engagementDays });
      setEngagementData(res.data.data || []);
    } catch (error) {
      // Silently fail — overview still shows
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Best times heatmap: find the max engagement for normalization
  const maxEngagement = Math.max(...bestTimes.map(s => s.avgEngagement), 1);

  const getHeatmapColor = (value: number): string => {
    if (value === 0) return 'bg-gray-100 dark:bg-gray-700';
    const ratio = value / maxEngagement;
    if (ratio > 0.75) return 'bg-green-500 dark:bg-green-600';
    if (ratio > 0.5) return 'bg-green-400 dark:bg-green-500';
    if (ratio > 0.25) return 'bg-green-300 dark:bg-green-400';
    return 'bg-green-200 dark:bg-green-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const hasData = overview && overview.posts.published > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Social Media Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track engagement, growth, and performance across your accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/social-media/create')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm"
          >
            <PenSquare className="w-4 h-4" />
            Create Post
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Eye className="w-5 h-5 text-blue-600" />}
            label="Total Reach"
            value={formatNumber(overview.engagement.reach)}
            bgColor="bg-blue-50 dark:bg-blue-900/20"
          />
          <StatCard
            icon={<Heart className="w-5 h-5 text-red-500" />}
            label="Total Engagement"
            value={formatNumber(overview.engagement.likes + overview.engagement.comments + overview.engagement.shares)}
            bgColor="bg-red-50 dark:bg-red-900/20"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            label="Engagement Rate"
            value={`${overview.engagement.rate}%`}
            bgColor="bg-green-50 dark:bg-green-900/20"
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
            label="Published This Week"
            value={overview.posts.publishedThisWeek.toString()}
            bgColor="bg-purple-50 dark:bg-purple-900/20"
          />
        </div>
      )}

      {!hasData ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Analytics Data Yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Start publishing posts to collect engagement data. Analytics will populate automatically as your posts receive interactions.
          </p>
          <button
            onClick={() => navigate('/social-media/create')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <PenSquare className="w-4 h-4" />
            Create a Post
          </button>
        </div>
      ) : (
        <>
          {/* Engagement Breakdown */}
          {overview && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Engagement Breakdown
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                <EngagementMetric icon={<Heart className="w-4 h-4" />} label="Likes" value={overview.engagement.likes} />
                <EngagementMetric icon={<MessageCircle className="w-4 h-4" />} label="Comments" value={overview.engagement.comments} />
                <EngagementMetric icon={<Share2 className="w-4 h-4" />} label="Shares" value={overview.engagement.shares} />
                <EngagementMetric icon={<Eye className="w-4 h-4" />} label="Reach" value={overview.engagement.reach} />
                <EngagementMetric icon={<BarChart3 className="w-4 h-4" />} label="Impressions" value={overview.engagement.impressions} />
                <EngagementMetric icon={<Users className="w-4 h-4" />} label="Saves" value={overview.engagement.saves} />
                <EngagementMetric icon={<TrendingUp className="w-4 h-4" />} label="Clicks" value={overview.engagement.clicks} />
              </div>
            </div>
          )}

          {/* Engagement Over Time Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Engagement Over Time
              </h2>
              <select
                value={engagementDays}
                onChange={(e) => setEngagementDays(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>

            {engagementData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => {
                      const date = new Date(val);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="likes" stroke="#ef4444" strokeWidth={2} dot={false} name="Likes" />
                  <Line type="monotone" dataKey="comments" stroke="#3b82f6" strokeWidth={2} dot={false} name="Comments" />
                  <Line type="monotone" dataKey="shares" stroke="#10b981" strokeWidth={2} dot={false} name="Shares" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                No engagement data for this period
              </div>
            )}
          </div>

          {/* Reach & Impressions Chart */}
          {engagementData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Reach & Impressions
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => {
                      const date = new Date(val);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="reach" fill="#8b5cf6" name="Reach" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="impressions" fill="#a78bfa" name="Impressions" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Best Posting Times Heatmap */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Best Posting Times
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Based on engagement data from the last 90 days. Darker cells indicate higher average engagement.
            </p>

            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Hour labels */}
                <div className="flex ml-12 mb-1">
                  {HOUR_LABELS.filter((_, i) => i % 3 === 0).map((label, i) => (
                    <div key={i} className="flex-1 text-center text-xs text-gray-400">
                      {label}
                    </div>
                  ))}
                </div>

                {/* Heatmap rows */}
                {DAY_LABELS.map((day, dayIdx) => (
                  <div key={day} className="flex items-center gap-1 mb-1">
                    <span className="w-10 text-xs text-gray-500 dark:text-gray-400 text-right pr-2">
                      {day}
                    </span>
                    <div className="flex flex-1 gap-[2px]">
                      {Array.from({ length: 24 }, (_, hour) => {
                        const slot = bestTimes.find(s => s.dayOfWeek === dayIdx && s.hour === hour);
                        const value = slot?.avgEngagement || 0;
                        return (
                          <div
                            key={hour}
                            className={`flex-1 h-6 rounded-sm ${getHeatmapColor(value)} cursor-default transition-colors`}
                            title={`${day} ${HOUR_LABELS[hour]}: ${value} avg engagement (${slot?.postCount || 0} posts)`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-3">
                  <span className="text-xs text-gray-400">Less</span>
                  <div className="w-4 h-4 rounded-sm bg-gray-100 dark:bg-gray-700" />
                  <div className="w-4 h-4 rounded-sm bg-green-200 dark:bg-green-300" />
                  <div className="w-4 h-4 rounded-sm bg-green-300 dark:bg-green-400" />
                  <div className="w-4 h-4 rounded-sm bg-green-400 dark:bg-green-500" />
                  <div className="w-4 h-4 rounded-sm bg-green-500 dark:bg-green-600" />
                  <span className="text-xs text-gray-400">More</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performing Posts */}
          {overview && overview.topPosts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Top Performing Posts
              </h2>
              <div className="space-y-3">
                {overview.topPosts.map((post, i) => (
                  <button
                    key={post._id}
                    onClick={() => navigate(`/social-media/posts/${post._id}`)}
                    className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                  >
                    <span className="text-lg font-bold text-gray-300 dark:text-gray-600 w-6 text-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                        {post.content?.slice(0, 80) || 'No content'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatNumber(post.totalEngagement)}
                      </p>
                      <p className="text-xs text-gray-400">engagement</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatNumber(post.totalReach)}
                      </p>
                      <p className="text-xs text-gray-400">reach</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Sub-components
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
}> = ({ icon, label, value, bgColor }) => (
  <div className={`${bgColor} rounded-xl p-4`}>
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
  </div>
);

const EngagementMetric: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
}> = ({ icon, label, value }) => (
  <div className="text-center">
    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
      {icon}
    </div>
    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
      {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
    </p>
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
  </div>
);

export default SocialAnalytics;
