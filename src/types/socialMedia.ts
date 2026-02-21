export type Platform = 'facebook' | 'instagram';
export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'partially_published' | 'failed';
export type PostType = 'text' | 'image' | 'carousel' | 'video' | 'reel' | 'story';
export type AccountStatus = 'active' | 'token_expired' | 'disconnected' | 'error';
export type AiTone = 'inspirational' | 'formal' | 'casual' | 'warm' | 'energetic';

export interface SocialAccount {
  _id: string;
  merchant: string;
  platform: Platform;
  platformAccountId: string;
  platformAccountName: string;
  platformUsername?: string;
  profilePictureUrl?: string;
  status: AccountStatus;
  connectedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  connectedAt: string;
  lastTokenRefresh?: string;
  lastError?: string;
  lastErrorAt?: string;
  stats: {
    followersCount: number;
    followingCount: number;
    postsCount: number;
    lastSynced?: string;
  };
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PostMedia {
  _id?: string;
  url: string;
  publicId?: string;
  type: 'image' | 'video';
  altText?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  thumbnailUrl?: string;
  fileSize?: number;
}

export interface PlatformEngagement {
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  saves: number;
  clicks: number;
  lastSynced?: string;
}

export interface PlatformTarget {
  _id: string;
  platform: Platform;
  accountId: string | SocialAccount;
  status: string;
  platformPostId?: string;
  publishedAt?: string;
  error?: string;
  retryCount: number;
  engagement: PlatformEngagement;
}

export interface SocialPost {
  _id: string;
  merchant: string;
  content: string;
  media: PostMedia[];
  platforms: PlatformTarget[];
  scheduledAt?: string;
  status: PostStatus;
  template?: string;
  aiGenerated: boolean;
  aiPrompt?: string;
  hashtags: string[];
  postType: PostType;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateCategory {
  value: string;
  label: string;
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { value: 'sunday_service', label: 'Sunday Service' },
  { value: 'midweek_service', label: 'Midweek Service' },
  { value: 'event_promo', label: 'Event Promo' },
  { value: 'scripture', label: 'Scripture' },
  { value: 'devotional', label: 'Devotional' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'testimony', label: 'Testimony' },
  { value: 'prayer', label: 'Prayer' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'youth', label: 'Youth' },
  { value: 'custom', label: 'Custom' },
];

export interface SocialTemplate {
  _id: string;
  merchant: string;
  name: string;
  category: string;
  content: string;
  placeholders: {
    key: string;
    label: string;
    defaultValue?: string;
    required: boolean;
  }[];
  defaultHashtags: string[];
  coverImage?: {
    url: string;
    publicId?: string;
  };
  suggestedPlatforms: Platform[];
  suggestedPostType: PostType;
  isSystem: boolean;
  isActive: boolean;
  usageCount: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialSettings {
  _id: string;
  merchant: string;
  defaultHashtags: string[];
  preferredPostingTimes: {
    dayOfWeek: number;
    time: string;
    timezone: string;
  }[];
  aiSettings: {
    enabled: boolean;
    tone: AiTone;
    includeScripture: boolean;
    includeEmojis: boolean;
    language: string;
  };
  autoPostEvents: {
    enabled: boolean;
    platforms: Platform[];
    template?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Helper to get platform display info
export const PLATFORM_INFO: Record<Platform, { name: string; color: string; bgColor: string }> = {
  facebook: { name: 'Facebook', color: 'text-primary-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  instagram: { name: 'Instagram', color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
};

export const POST_STATUS_INFO: Record<PostStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  scheduled: { label: 'Scheduled', color: 'text-primary-600 dark:text-primary-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  publishing: { label: 'Publishing', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  published: { label: 'Published', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  partially_published: { label: 'Partial', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  failed: { label: 'Failed', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
};
