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
  XCircle
} from 'lucide-react';
import { socialMediaAPI } from '../../../services/api';
import { SocialPost, PLATFORM_INFO } from '../../../types/socialMedia';
import PostStatusBadge from '../../../components/social-media/PostStatusBadge';
import toast from 'react-hot-toast';

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

  const totalEngagement = post.platforms.reduce((sum, p) => {
    const e = p.engagement;
    return sum + (e?.likes || 0) + (e?.comments || 0) + (e?.shares || 0);
  }, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/social-media')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Post Details
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <PostStatusBadge status={post.status} size="md" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Created {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {post.status === 'scheduled' && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-3 py-2 text-yellow-600 border border-yellow-300 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-sm"
            >
              <XCircle className="w-4 h-4" />
              Cancel Schedule
            </button>
          )}
          {['draft', 'failed'].includes(post.status) && (
            <>
              <button
                onClick={() => navigate(`/social-media/posts/${post._id}/edit`)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publish Now
              </button>
            </>
          )}
          {['draft', 'scheduled', 'failed'].includes(post.status) && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {post.content || 'No content'}
            </p>

            {post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.hashtags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Media */}
            {post.media.length > 0 && (
              <div className={`grid gap-2 mt-4 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {post.media.map((m, i) => (
                  <img
                    key={i}
                    src={m.url}
                    alt={m.altText || ''}
                    className="w-full rounded-lg object-cover max-h-96"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Scheduled info */}
          {post.scheduledAt && post.status === 'scheduled' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Scheduled for {new Date(post.scheduledAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar - Platform Status & Engagement */}
        <div className="space-y-4">
          {post.platforms.map((p, i) => {
            const platformInfo = PLATFORM_INFO[p.platform];
            const account = typeof p.accountId === 'object' ? p.accountId : null;
            const engagement = p.engagement;

            return (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  {p.platform === 'facebook' ? (
                    <Facebook className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Instagram className="w-4 h-4 text-pink-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {account ? (account as any).platformAccountName : platformInfo.name}
                  </span>
                  <PostStatusBadge status={p.status as any} />
                </div>

                {p.error && (
                  <p className="text-xs text-red-500 mb-2">{p.error}</p>
                )}

                {p.status === 'published' && (
                  <div className="grid grid-cols-2 gap-2 text-center">
                    {[
                      { icon: Heart, label: 'Likes', value: engagement?.likes || 0 },
                      { icon: MessageCircle, label: 'Comments', value: engagement?.comments || 0 },
                      { icon: Share2, label: 'Shares', value: engagement?.shares || 0 },
                      { icon: Eye, label: 'Reach', value: engagement?.reach || 0 },
                      { icon: Eye, label: 'Impressions', value: engagement?.impressions || 0 },
                      { icon: MousePointer, label: 'Clicks', value: engagement?.clicks || 0 },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <Icon className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {p.publishedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    Published {new Date(p.publishedAt).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
