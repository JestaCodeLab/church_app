import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import TextareaAutosize from 'react-textarea-autosize';
import {
  ArrowLeft,
  Upload,
  X,
  Hash,
  Calendar,
  Send,
  Save,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Facebook,
  Instagram,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Smile,
  Clock,
  MessageSquare,
  Heart,
  Share2,
  Bookmark,
  BarChart3,
  Eye
} from 'lucide-react';
import { socialMediaAPI } from '../../../services/api';
import { SocialAccount, SocialPost, PLATFORM_INFO, Platform } from '../../../types/socialMedia';
import FacebookPreview from '../../../components/social-media/FacebookPreview';
import InstagramPreview from '../../../components/social-media/InstagramPreview';
import toast from 'react-hot-toast';

const IG_CHAR_LIMIT = 2200;
const FB_CHAR_LIMIT = 63206;

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hashtagInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Form state
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // AI state
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ content: string; description: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([]);
  const [hashtagsLoading, setHashtagsLoading] = useState(false);

  // Preview state
  const [previewTab, setPreviewTab] = useState<string>('');

  useEffect(() => {
    fetchAccounts();
    if (editId) {
      fetchPost(editId);
    }
  }, [editId]);

  // Pre-fill from template navigation state
  useEffect(() => {
    const state = location.state as { templateId?: string; content?: string; hashtags?: string[] } | null;
    if (state?.content) {
      setContent(state.content);
    }
    if (state?.hashtags && state.hashtags.length > 0) {
      setHashtags(state.hashtags);
    }
  }, [location.state]);

  // Auto-select first preview tab when platforms change
  useEffect(() => {
    if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(previewTab as Platform)) {
      setPreviewTab(selectedPlatforms[0]);
    }
  }, [selectedAccounts]);

  const fetchAccounts = async () => {
    try {
      const response = await socialMediaAPI.getAccounts();
      setAccounts((response.data.data || []).filter((a: SocialAccount) => a.status === 'active'));
    } catch (error) {
      toast.error('Failed to load accounts');
    }
  };

  const fetchPost = async (postId: string) => {
    try {
      setLoading(true);
      const response = await socialMediaAPI.getPost(postId);
      const post: SocialPost = response.data.data;
      setContent(post.content);
      setHashtags(post.hashtags);
      setSelectedAccounts(post.platforms.map(p =>
        typeof p.accountId === 'string' ? p.accountId : p.accountId._id
      ));
      if (post.scheduledAt) {
        const date = new Date(post.scheduledAt);
        setScheduledAt(date.toISOString().split('T')[0]);
        setScheduledTime(date.toTimeString().slice(0, 5));
        setIsScheduling(true);
      }
      if (post.media.length > 0) {
        setMediaPreviews(post.media.map(m => m.url));
      }
      setDraftSaved(true);
    } catch (error) {
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlatforms = accounts
    .filter(a => selectedAccounts.includes(a._id))
    .map(a => a.platform);

  const hasInstagram = selectedPlatforms.includes('instagram');
  const charLimit = hasInstagram ? IG_CHAR_LIMIT : FB_CHAR_LIMIT;

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleAddHashtag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = hashtagInput.trim().replace(/^#/, '').toLowerCase();
      if (tag && !hashtags.includes(tag)) {
        setHashtags(prev => [...prev, tag]);
      }
      setHashtagInput('');
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(prev => prev.filter(t => t !== tag));
  };

  const handleGenerateSuggestions = async () => {
    try {
      setAiLoading(true);
      const platform = hasInstagram ? 'instagram' : 'facebook';
      const response = await socialMediaAPI.suggestContent({
        topic: aiTopic || undefined,
        platform
      });
      setAiSuggestions(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate suggestions');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSuggestHashtags = async () => {
    if (!content.trim()) {
      toast.error('Write some content first to get hashtag suggestions');
      return;
    }
    try {
      setHashtagsLoading(true);
      const platform = hasInstagram ? 'instagram' : 'facebook';
      const response = await socialMediaAPI.suggestHashtags({ content, platform });
      setHashtagSuggestions(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to suggest hashtags');
    } finally {
      setHashtagsLoading(false);
    }
  };

  const applySuggestion = (suggestionContent: string) => {
    setContent(suggestionContent);
    toast.success('Content applied');
  };

  const addSuggestedHashtag = (tag: string) => {
    const normalizedTag = tag.replace(/^#/, '').toLowerCase();
    if (!hashtags.includes(normalizedTag)) {
      setHashtags(prev => [...prev, normalizedTag]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalFiles = mediaFiles.length + files.length;
    if (totalFiles > 10) {
      toast.error('Maximum 10 media files allowed');
      return;
    }

    setMediaFiles(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const buildFormData = (): FormData => {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('hashtags', JSON.stringify(hashtags));

    const platformsPayload = selectedAccounts.map(accountId => {
      const account = accounts.find(a => a._id === accountId);
      return {
        platform: account?.platform,
        accountId
      };
    });
    formData.append('platforms', JSON.stringify(platformsPayload));

    mediaFiles.forEach(file => {
      formData.append('media', file);
    });

    if (isScheduling && scheduledAt && scheduledTime) {
      const dateTime = new Date(`${scheduledAt}T${scheduledTime}`);
      formData.append('scheduledAt', dateTime.toISOString());
    }

    return formData;
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const formData = buildFormData();

      if (editId) {
        await socialMediaAPI.updatePost(editId, formData);
        toast.success('Draft updated');
      } else {
        await socialMediaAPI.createPost(formData);
        toast.success('Draft saved');
      }
      setDraftSaved(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (selectedAccounts.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }
    if (!content.trim() && mediaPreviews.length === 0) {
      toast.error('Add some content or media to publish');
      return;
    }

    try {
      setPublishing(true);
      const formData = buildFormData();

      let postId = editId;
      if (!postId) {
        const response = await socialMediaAPI.createPost(formData);
        postId = response.data.data._id;
      } else {
        await socialMediaAPI.updatePost(postId, formData);
      }

      if (isScheduling && scheduledAt && scheduledTime) {
        toast.success('Post scheduled successfully!');
      } else {
        await socialMediaAPI.publishPost(postId!);
        toast.success('Post published successfully!');
      }

      navigate('/social-media');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  // Build preview content with hashtags
  const previewContent = content + (hashtags.length > 0 ? '\n\n' + hashtags.map(t => `#${t}`).join(' ') : '');

  // Get account data for previews
  const fbAccount = accounts.find(a => selectedAccounts.includes(a._id) && a.platform === 'facebook');
  const igAccount = accounts.find(a => selectedAccounts.includes(a._id) && a.platform === 'instagram');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/social-media/posts')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {editId ? 'Edit Post' : 'Create Post'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Compose and publish to your social accounts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || selectedAccounts.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isScheduling ? (
              <Calendar className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isScheduling ? 'Schedule' : 'Publish Now'}
          </button>
        </div>
      </div>

      {/* Main Grid: Editor (left) + Preview (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ===== LEFT COLUMN: Editor ===== */}
        <div className="lg:col-span-3 space-y-5">

          {/* Draft Post Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Draft Post</h2>
              {draftSaved && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                  DRAFT SAVED
                </span>
              )}
            </div>

            {/* Textarea */}
            <div className="px-5 pb-2">
              <TextareaAutosize
                value={content}
                onChange={(e) => { setContent(e.target.value); setDraftSaved(false); }}
                minRows={6}
                maxRows={14}
                placeholder="What's happening? Write your masterpiece here..."
                className="w-full px-0 py-2 border-0 focus:ring-0 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none text-[15px] leading-relaxed"
              />
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Add image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  onClick={() => hashtagInputRef.current?.focus()}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Add hashtag"
                >
                  <Hash className="w-5 h-5" />
                </button>
              </div>
              <span className={`text-xs tabular-nums ${content.length > charLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {content.length} / {charLimit.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Media Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {mediaPreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {mediaPreviews.map((preview, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden">
                    <img src={preview} alt="" className="w-full aspect-square object-cover" />
                    <button
                      onClick={() => removeMedia(i)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary-400 dark:hover:border-primary-500 transition-colors text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <Upload className="w-8 h-8" />
              <div className="text-center">
                <p className="text-sm font-medium">Upload media</p>
                <p className="text-xs text-gray-400">Drag and drop photos or videos here</p>
              </div>
            </button>

            {mediaPreviews.length > 0 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 mx-auto flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-600 dark:text-gray-400 transition-colors"
              >
                Browse Files
              </button>
            )}

            {hasInstagram && mediaPreviews.length === 0 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-3 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Instagram posts require at least one image
              </p>
            )}
          </div>

          {/* AI Content Assistant */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Content Assistant</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Generate content ideas and suggestions</p>
                </div>
              </div>
              {showAiPanel ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {showAiPanel && (
              <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Topic (e.g. 'Sunday service', 'Easter', 'Youth camp')"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                  <button
                    onClick={handleGenerateSuggestions}
                    disabled={aiLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all text-sm disabled:opacity-50 whitespace-nowrap shadow-sm"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Generate
                  </button>
                </div>

                {aiSuggestions.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {aiSuggestions.map((suggestion, i) => (
                      <div
                        key={i}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:border-purple-300 dark:hover:border-purple-600 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                            {suggestion.description}
                          </span>
                          <button
                            onClick={() => applySuggestion(suggestion.content)}
                            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap opacity-70 group-hover:opacity-100"
                          >
                            <Copy className="w-3 h-3" />
                            Use this
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line line-clamp-3">
                          {suggestion.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Hashtags</h3>
              <button
                onClick={handleSuggestHashtags}
                disabled={hashtagsLoading || !content.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors text-xs font-medium disabled:opacity-50"
                title="Get AI hashtag suggestions"
              >
                {hashtagsLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                AI Suggest
              </button>
            </div>

            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {hashtags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-sm border border-primary-200 dark:border-primary-800"
                  >
                    #{tag}
                    <button onClick={() => removeHashtag(tag)} className="hover:text-red-500 ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                ref={hashtagInputRef}
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={handleAddHashtag}
                placeholder="Type a hashtag and press Enter"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>

            {/* AI Hashtag Suggestions */}
            {hashtagSuggestions.length > 0 && (
              <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/30">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-2">
                  Suggested hashtags (click to add):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {hashtagSuggestions.map(tag => (
                    <button
                      key={tag}
                      onClick={() => addSuggestedHashtag(tag)}
                      disabled={hashtags.includes(tag.toLowerCase())}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                        hashtags.includes(tag.toLowerCase())
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 cursor-default'
                          : 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-800/30 border border-purple-200 dark:border-purple-700'
                      }`}
                    >
                      {hashtags.includes(tag.toLowerCase()) ? '✓' : '+'} #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Select Platforms */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Select Platforms</h3>

            {accounts.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No connected accounts</p>
                <button
                  onClick={() => navigate('/social-media/accounts')}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Connect an account
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {accounts.map((account) => {
                  const selected = selectedAccounts.includes(account._id);
                  const platformInfo = PLATFORM_INFO[account.platform];

                  return (
                    <button
                      key={account._id}
                      onClick={() => toggleAccount(account._id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        selected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full ${platformInfo.bgColor} flex items-center justify-center relative`}>
                        {account.profilePictureUrl ? (
                          <img src={account.profilePictureUrl} alt="" className="w-12 h-12 rounded-full" />
                        ) : account.platform === 'whatsapp' ? (
                          <img src="/images/whatsapp-logo.webp" alt="WhatsApp" className="w-6 h-6" />
                        ) : account.platform === 'facebook' ? (
                          <Facebook className={`w-6 h-6 ${platformInfo.color}`} />
                        ) : account.platform === 'instagram' ? (
                          <Instagram className={`w-6 h-6 ${platformInfo.color}`} />
                        ) : (
                          <MessageSquare className={`w-6 h-6 ${platformInfo.color}`} />
                        )}
                        {selected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                        {platformInfo.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Schedule Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Schedule</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {isScheduling ? 'Scheduled' : 'Publish now'}
                </span>
                <button
                  onClick={() => {
                    setIsScheduling(!isScheduling);
                    if (!isScheduling) {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setScheduledAt(tomorrow.toISOString().split('T')[0]);
                      setScheduledTime('09:00');
                    } else {
                      setScheduledAt('');
                      setScheduledTime('');
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isScheduling ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isScheduling ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>

            {isScheduling && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="date"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT COLUMN: Live Preview ===== */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6 space-y-5">

            {/* Live Preview Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Live Preview</h3>

                {/* Platform Tabs */}
                {selectedPlatforms.length > 0 && (
                  <div className="flex items-center gap-1">
                    {selectedPlatforms.includes('facebook') && (
                      <button
                        onClick={() => setPreviewTab('facebook')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          previewTab === 'facebook'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        FB
                      </button>
                    )}
                    {selectedPlatforms.includes('instagram') && (
                      <button
                        onClick={() => setPreviewTab('instagram')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          previewTab === 'instagram'
                            ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        IG
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4">
                {selectedPlatforms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Eye className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Select a platform to see a live preview
                    </p>
                  </div>
                ) : (
                  <>
                    {previewTab === 'facebook' && fbAccount && (
                      <FacebookPreview
                        content={previewContent}
                        mediaUrls={mediaPreviews}
                        pageName={fbAccount.platformAccountName}
                        pageImage={fbAccount.profilePictureUrl}
                      />
                    )}
                    {previewTab === 'instagram' && igAccount && (
                      <InstagramPreview
                        content={previewContent}
                        mediaUrls={mediaPreviews}
                        username={igAccount.platformUsername || igAccount.platformAccountName}
                        profileImage={igAccount.profilePictureUrl}
                      />
                    )}
                    {/* Fallback if no matching preview for the tab */}
                    {previewTab !== 'facebook' && previewTab !== 'instagram' && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Eye className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          Preview not available for this platform
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Audience Insights */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-3">
                Audience Insights
              </h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Reach</span>
                <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                  {selectedAccounts.length > 0 ? '12.5k - 45k' : '—'}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: selectedAccounts.length > 0 ? '65%' : '0%' }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {selectedAccounts.length > 0
                  ? 'Post performance is expected to be 24% higher during your scheduled time at 6:00 PM.'
                  : 'Select platforms to see estimated reach.'}
              </p>
            </div>

            {/* Post Summary */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Summary</h3>
              <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${selectedAccounts.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  {selectedAccounts.length} platform(s) selected
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${mediaPreviews.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  {mediaPreviews.length} media file(s)
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${hashtags.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  {hashtags.length} hashtag(s)
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${content.trim() ? 'bg-green-500' : 'bg-gray-300'}`} />
                  {content.length} characters
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
