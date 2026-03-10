import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Send,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Bookmark,
  MousePointer,
  Loader2,
  Facebook,
  Instagram,
  Clock,
  XCircle,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import { socialMediaAPI } from '../../../services/api';
import { SocialPost, PLATFORM_INFO, Platform } from '../../../types/socialMedia';
import PostStatusBadge from '../../../components/social-media/PostStatusBadge';
import toast from 'react-hot-toast';

const PLATFORM_ICONS: Record<string, React.FC<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-600',
  instagram: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
  whatsapp: 'bg-green-500',
  tiktok: 'bg-gray-900',
  youtube: 'bg-red-600',
  telegram: 'bg-blue-500',
};

const PostDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<SocialPost | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) fetchPost(id);
  }, [id]);

  const fetchPost = async (postId: string) => {
    try {
      setLoading(true);
      const response = await socialMediaAPI.getPost(postId);
      setPost(response.data.data);
    } catch (error) {
      toast.error('Failed to load post');
      navigate('/social-media');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!post) return;
    try {
      setPublishing(true);
      await socialMediaAPI.publishPost(post._id);
      toast.success('Post published!');
      fetchPost(post._id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !window.confirm('Delete this post?')) return;
    try {
      setDeleting(true);
      await socialMediaAPI.deletePost(post._id);
      toast.success('Post deleted');
      navigate('/social-media');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = async () => {
    if (!post) return;
    try {
      await socialMediaAPI.cancelPost(post._id);
      toast.success('Scheduled post cancelled');
      fetchPost(post._id);
    } catch (error) {
      toast.error('Failed to cancel');
    }
  };

  if (loading || !post) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Aggregate engagement across all platforms
  const totalReach = post.platforms.reduce((sum, p) => sum + (p.engagement?.reach || 0), 0);
  const totalEngagement = post.platforms.reduce((sum, p) => {
    const e = p.engagement;
    return sum + (e?.likes || 0) + (e?.comments || 0) + (e?.shares || 0);
  }, 0);
  const totalClicks = post.platforms.reduce((sum, p) => sum + (p.engagement?.clicks || 0), 0);
  const totalSaves = post.platforms.reduce((sum, p) => sum + (p.engagement?.saves || 0), 0);
  const totalComments = post.platforms.reduce((sum, p) => sum + (p.engagement?.comments || 0), 0);

  const isPublished = post.status === 'published' || post.status === 'partially_published';
  const platformCount = post.platforms.length;

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0) return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
    if (value < 0) return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
    return <Minus className="w-3.5 h-3.5 text-gray-400" />;
  };

  const getPlatformStatusIcon = (status: string) => {
    if (status === 'published') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === 'failed') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (status === 'publishing') return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getPlatformStatusLabel = (status: string) => {
    if (status === 'published') return 'Live';
    if (status === 'failed') return 'Failed';
    if (status === 'publishing') return 'Publishing';
    if (status === 'scheduled') return 'Scheduled';
    return 'Draft';
  };

  // Extract first line as title-like heading (or use first 60 chars)
  const contentLines = (post.content || '').split('\n').filter(Boolean);
  const postTitle = contentLines[0]?.length > 80 ? contentLines[0].slice(0, 80) + '...' : contentLines[0] || 'Untitled Post';
  const postBody = contentLines.length > 1 ? contentLines.slice(1).join('\n') : post.content;

  return (
    <div className="max-w-8xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/social-media/posts/${post._id}`)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Post Details</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <PostStatusBadge status={post.status} size="sm" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Created {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ========== LEFT COLUMN ========== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Media */}
          {post.media.length > 0 ? (
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              {post.media[0].type === 'video' ? (
                <video
                  src={post.media[0].url}
                  controls
                  className="w-full max-h-[420px] object-cover"
                />
              ) : (
                <img
                  src={post.media[0].url}
                  alt={post.media[0].altText || 'Post media'}
                  className="w-full max-h-[420px] object-cover"
                />
              )}
              {post.media.length > 1 && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 text-white text-xs rounded-full backdrop-blur-sm">
                  <ImageIcon className="w-3.5 h-3.5" />
                  +{post.media.length - 1} more
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl">
              <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            </div>
          )}

          {/* Additional media thumbnails */}
          {post.media.length > 1 && (
            <div className="flex gap-2 -mt-3">
              {post.media.slice(1, 5).map((m, i) => (
                <img
                  key={i}
                  src={m.thumbnailUrl || m.url}
                  alt={m.altText || ''}
                  className="w-20 h-20 rounded-lg object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                />
              ))}
              {post.media.length > 5 && (
                <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm">
                  <span className="text-sm font-medium text-gray-500">+{post.media.length - 5}</span>
                </div>
              )}
            </div>
          )}

          {/* Platform Icons + Count */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1">
              {post.platforms.map((p, i) => {
                const Icon = PLATFORM_ICONS[p.platform];
                return (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${PLATFORM_COLORS[p.platform] || 'bg-gray-500'} ring-2 ring-white dark:ring-gray-900`}
                  >
                    {Icon ? <Icon className="w-4 h-4" /> : p.platform === 'whatsapp' ? <img src="/images/whatsapp-logo.webp" alt="WhatsApp" className="w-5 h-5" /> : <span className="text-xs font-bold">{p.platform[0].toUpperCase()}</span>}
                  </div>
                );
              })}
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Across {platformCount} platform{platformCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Post Content Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              {postTitle}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {postBody}
            </p>

            {post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.hashtags.map(tag => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Scheduled Info */}
          {post.scheduledAt && post.status === 'scheduled' && (
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  Scheduled for {new Date(post.scheduledAt).toLocaleString()}
                </p>
                <p className="text-xs text-primary-500 dark:text-primary-400 mt-0.5">
                  Will be published automatically
                </p>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          {isPublished && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Performance Metrics</h3>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  Detailed Report <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Reach', value: totalReach, icon: Eye, trend: 12 },
                  { label: 'Engagement', value: totalEngagement, icon: Heart, trend: 5.4 },
                  { label: 'Clicks', value: totalClicks, icon: MousePointer, trend: 0 },
                  { label: 'Saves', value: totalSaves, icon: Bookmark, trend: -2 },
                ].map(({ label, value, icon: Icon, trend }) => (
                  <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                        <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {value.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                      <div className="flex items-center gap-1">
                        <TrendIcon value={trend} />
                        <span className={`text-xs font-medium ${
                          trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'
                        }`}>
                          {trend > 0 ? '+' : ''}{trend}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========== RIGHT COLUMN ========== */}
        <div className="space-y-5">
          {/* Action Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-2.5">
            {['draft', 'failed'].includes(post.status) && (
              <>
                <button
                  onClick={() => navigate(`/social-media/posts/${post._id}/edit`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Post
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publish Now
                </button>
              </>
            )}

            {post.status === 'scheduled' && (
              <button
                onClick={handleCancel}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-yellow-300 dark:border-yellow-700 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-xl text-sm font-medium transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Cancel Schedule
              </button>
            )}

            {isPublished && (
              <button
                onClick={() => navigate(`/social-media/posts/${post._id}/edit`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit Post
              </button>
            )}

            {['draft', 'scheduled', 'failed'].includes(post.status) && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Post
              </button>
            )}
          </div>

          {/* Platform Status Cards */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Platform Status</h3>
            <div className="space-y-2.5">
              {post.platforms.map((p, i) => {
                const platformInfo = PLATFORM_INFO[p.platform];
                const account = typeof p.accountId === 'object' ? p.accountId : null;
                const Icon = PLATFORM_ICONS[p.platform];
                const statusLabel = getPlatformStatusLabel(p.status);
                const isLive = p.status === 'published';

                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${PLATFORM_COLORS[p.platform] || 'bg-gray-500'}`}>
                      {Icon ? <Icon className="w-4.5 h-4.5" /> : p.platform === 'whatsapp' ? <img src="/images/whatsapp-logo.webp" alt="WhatsApp" className="w-5 h-5" /> : <span className="text-xs font-bold">{p.platform[0].toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {account ? (account as any).platformAccountName : platformInfo.name}
                      </p>
                      {p.publishedAt && (
                        <p className="text-xs text-gray-400 truncate">
                          {new Date(p.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {getPlatformStatusIcon(p.status)}
                      <span className={`text-xs font-semibold ${
                        isLive ? 'text-green-600 dark:text-green-400' :
                        p.status === 'failed' ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Per-platform errors */}
            {post.platforms.some(p => p.error) && (
              <div className="mt-3 space-y-1.5">
                {post.platforms.filter(p => p.error).map((p, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">{p.error}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Engagement Per Platform */}
          {isPublished && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Engagement by Platform</h3>
              <div className="space-y-3">
                {post.platforms.filter(p => p.status === 'published').map((p, i) => {
                  const Icon = PLATFORM_ICONS[p.platform];
                  const platformInfo = PLATFORM_INFO[p.platform];
                  const e = p.engagement;
                  const platformTotal = (e?.likes || 0) + (e?.comments || 0) + (e?.shares || 0);

                  return (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-white ${PLATFORM_COLORS[p.platform] || 'bg-gray-500'}`}>
                          {Icon ? <Icon className="w-3 h-3" /> : p.platform === 'whatsapp' ? <img src="/images/whatsapp-logo.webp" alt="WhatsApp" className="w-4 h-4" /> : <span className="text-[10px] font-bold">{p.platform[0].toUpperCase()}</span>}
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{platformInfo.name}</span>
                        <span className="text-xs text-gray-400 ml-auto">{platformTotal.toLocaleString()} total</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { icon: Heart, val: e?.likes || 0 },
                          { icon: MessageCircle, val: e?.comments || 0 },
                          { icon: Share2, val: e?.shares || 0 },
                        ].map(({ icon: MetricIcon, val }, j) => (
                          <div key={j} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <MetricIcon className="w-3 h-3" />
                            {val.toLocaleString()}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Comments Placeholder */}
          {isPublished && totalComments > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Recent Comments</h3>
                <span className="text-xs text-gray-400">{totalComments} total</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    ?
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Comments will appear here once synced from platforms.
                    </p>
                  </div>
                </div>
              </div>
              <button className="mt-3 w-full text-center text-xs text-primary-600 hover:text-primary-700 font-medium py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                View all {totalComments} comments
              </button>
            </div>
          )}

          {/* Post Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Post Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Type</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium capitalize">{post.postType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Media</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">{post.media.length} file{post.media.length !== 1 ? 's' : ''}</span>
              </div>
              {post.createdBy && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Created by</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {post.createdBy.firstName} {post.createdBy.lastName}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Last updated</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {new Date(post.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {post.aiGenerated && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">AI Generated</span>
                  <span className="text-primary-600 font-medium">Yes</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
