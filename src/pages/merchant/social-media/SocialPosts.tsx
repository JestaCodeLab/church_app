import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PenSquare,
  Eye,
  Loader2,
  Calendar,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Facebook,
  Instagram,
  Send,
  Paperclip,
  Image as ImageIcon,
  Copy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { socialMediaAPI, settingsAPI } from '../../../services/api';
import { SocialPost, SocialAccount, PLATFORM_INFO, Platform } from '../../../types/socialMedia';
import PostStatusBadge from '../../../components/social-media/PostStatusBadge';
import BranchSelectionModal from '../../../components/social-media/BranchSelectionModal';
import { useSocialBranchSelection } from '../../../hooks/useSocialBranchSelection';
import toast from 'react-hot-toast';

type PostStatusFilter = 'all' | 'draft' | 'scheduled' | 'published' | 'failed';
type DateRange = 'all' | '7' | '30' | '90';

const PLATFORM_ICONS: Record<string, React.FC<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'bg-blue-600',
  instagram: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
  whatsapp: 'bg-green-500',
  tiktok: 'bg-gray-900 dark:bg-white',
  youtube: 'bg-red-600',
  telegram: 'bg-blue-500',
};

const SocialPosts: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [statusFilter, setStatusFilter] = useState<PostStatusFilter>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const limit = 10;

  const { branches, selectedBranch, showBranchModal, loadingBranches, selectBranch } = useSocialBranchSelection();

  // Close action menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setOpenActionId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (selectedBranch) fetchAllowedPlatformsAndAccounts();
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedBranch) fetchPosts();
  }, [selectedBranch, statusFilter, platformFilter, dateRange, page]);

  const fetchAllowedPlatformsAndAccounts = async () => {
    try {
      const planResponse = await settingsAPI.getSubscription();
      const subscription = planResponse.data.data.subscription;
      const planDetails = subscription.planDetails;
      const platforms: Platform[] = planDetails?.limits?.socialMediaAllowedPlatforms ||
        subscription.limits?.socialMediaAllowedPlatforms || [];

      const accountsResponse = await socialMediaAPI.getAccounts({ branchId: selectedBranch });
      const allAccounts = accountsResponse.data.data || [];
      const filteredAccounts = allAccounts.filter((acc: SocialAccount) => platforms.includes(acc.platform));
      setAccounts(filteredAccounts);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      toast.error('Failed to load accounts');
    }
  };

  const fetchPosts = async () => {
    if (!selectedBranch) return;
    try {
      setLoading(true);
      const params: any = { page, limit, branchId: selectedBranch };

      if (statusFilter !== 'all') params.status = statusFilter;
      if (platformFilter !== 'all') params.platform = platformFilter;
      if (searchQuery) params.search = searchQuery;
      if (dateRange !== 'all') {
        const d = new Date();
        d.setDate(d.getDate() - parseInt(dateRange));
        params.startDate = d.toISOString();
      }

      const response = await socialMediaAPI.getPosts(params);
      setPosts(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalPosts(response.data.pagination?.total || response.data.data?.length || 0);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchPosts();
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await socialMediaAPI.deletePost(postId);
      toast.success('Post deleted successfully');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  // Unique platforms across all accounts for filter
  const uniquePlatforms = Array.from(new Set(accounts.map(a => a.platform)));

  const getPostMediaLabel = (post: SocialPost) => {
    if (post.media.length === 0) return 'No media attached yet';
    const imageCount = post.media.filter(m => m.type === 'image').length;
    const videoCount = post.media.filter(m => m.type === 'video').length;
    const parts: string[] = [];
    if (imageCount > 0) parts.push(`${imageCount} attachment${imageCount > 1 ? 's' : ''}`);
    if (videoCount > 0) parts.push(`${videoCount} video${videoCount > 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  const getPostMediaIcon = (post: SocialPost) => {
    if (post.media.length === 0) return <ImageIcon className="w-3.5 h-3.5 text-gray-400" />;
    if (post.postType === 'carousel') return <Copy className="w-3.5 h-3.5 text-primary-500" />;
    return <Paperclip className="w-3.5 h-3.5 text-primary-500" />;
  };

  const formatDateTime = (post: SocialPost) => {
    if (post.status === 'scheduled' && post.scheduledAt) {
      const date = new Date(post.scheduledAt);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let dateLabel: string;
      if (diffDays === 0) dateLabel = 'Today';
      else if (diffDays === 1) dateLabel = 'Tomorrow';
      else dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

      const timeLabel = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      return { date: dateLabel, time: timeLabel };
    }

    if (post.status === 'published' && post.platforms[0]?.publishedAt) {
      const date = new Date(post.platforms[0].publishedAt);
      return {
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      };
    }

    if (post.status === 'draft') {
      return { date: 'Not set', time: 'Unscheduled' };
    }

    const date = new Date(post.createdAt);
    return {
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    };
  };

  // Pagination range
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalPosts);

  if (loadingBranches) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BranchSelectionModal isOpen={showBranchModal} branches={branches} onSelect={selectBranch} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Posts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all your social media posts</p>
        </div>
        <button
          onClick={() => navigate('/social-media/create')}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium text-sm"
        >
          <PenSquare className="w-4 h-4" />
          Create Post
        </button>
      </div>

      {/* Filters Row */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Content */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Search Content
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as PostStatusFilter); setPage(1); }}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Platform */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Platform
            </label>
            <select
              value={platformFilter}
              onChange={(e) => { setPlatformFilter(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer"
            >
              <option value="all">All Platforms</option>
              {uniquePlatforms.map(p => (
                <option key={p} value={p}>{PLATFORM_INFO[p].name}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Date Range
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={dateRange}
                onChange={(e) => { setDateRange(e.target.value as DateRange); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <>
          {posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                  <PenSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No posts found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery ? 'Try adjusting your search or filters' : 'Get started by creating your first post'}
                </p>
                <button
                  onClick={() => navigate('/social-media/create')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <PenSquare className="w-4 h-4" />
                  Create Post
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                <div className="col-span-5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Post Content
                </div>
                <div className="col-span-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Platforms
                </div>
                <div className="col-span-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </div>
                <div className="col-span-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date & Time
                </div>
                <div className="col-span-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {posts.map((post) => {
                  const firstImage = post.media.length > 0 ? post.media[0] : null;
                  const mediaLabel = getPostMediaLabel(post);
                  const mediaIcon = getPostMediaIcon(post);
                  const { date, time } = formatDateTime(post);

                  return (
                    <div
                      key={post._id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/social-media/posts/${post._id}`)}
                    >
                      {/* Post Content Cell */}
                      <div className="col-span-5 flex items-center gap-4 min-w-0">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                          {firstImage ? (
                            <img
                              src={firstImage.thumbnailUrl || firstImage.url}
                              alt={firstImage.altText || ''}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                            </div>
                          )}
                        </div>

                        {/* Text */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
                            {post.content || <span className="text-gray-400 italic">No caption</span>}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {mediaIcon}
                            <span className="text-xs text-gray-400 dark:text-gray-500">{mediaLabel}</span>
                          </div>
                        </div>
                      </div>

                      {/* Platforms Cell */}
                      <div className="col-span-2">
                        <div className="flex items-center -space-x-1">
                          {post.platforms.map((p, idx) => {
                            const Icon = PLATFORM_ICONS[p.platform];
                            return (
                              <div
                                key={idx}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${PLATFORM_COLORS[p.platform] || 'bg-gray-500'} ring-2 ring-white dark:ring-gray-800`}
                                title={PLATFORM_INFO[p.platform].name}
                              >
                                {Icon ? (
                                  <Icon className="w-4 h-4" />
                                ) : p.platform === 'whatsapp' ? (
                                  <img src="/images/whatsapp-logo.webp" alt="WhatsApp" className="w-5 h-5" />
                                ) : (
                                  <span className="text-[10px] font-bold">{p.platform[0].toUpperCase()}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Status Cell */}
                      <div className="col-span-2">
                        <PostStatusBadge status={post.status} size="md" />
                      </div>

                      {/* Date & Time Cell */}
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{date}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{time}</p>
                      </div>

                      {/* Actions Cell */}
                      <div className="col-span-1 flex justify-end" ref={openActionId === post._id ? actionRef : undefined}>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionId(openActionId === post._id ? null : post._id);
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>

                          {openActionId === post._id && (
                            <div
                              className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1.5 z-20"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => { navigate(`/social-media/posts/${post._id}`); setOpenActionId(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => { navigate(`/social-media/posts/${post._id}/edit`); setOpenActionId(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit Post
                              </button>
                              {['draft', 'failed'].includes(post.status) && (
                                <button
                                  onClick={() => { setOpenActionId(null); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <Send className="w-4 h-4" />
                                  Publish Now
                                </button>
                              )}
                              <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                              <button
                                onClick={() => { handleDelete(post._id); setOpenActionId(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing <span className="font-semibold text-gray-700 dark:text-gray-200">{startItem}-{endItem}</span> of{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{totalPosts}</span> posts
                </p>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>

                  {getPageNumbers().map((pg, idx) =>
                    pg === '...' ? (
                      <span key={`dots-${idx}`} className="px-2 text-gray-400 text-sm">...</span>
                    ) : (
                      <button
                        key={pg}
                        onClick={() => setPage(pg as number)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          page === pg
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pg}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SocialPosts;
