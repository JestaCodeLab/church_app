import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TextareaAutosize from 'react-textarea-autosize';
import {
  ArrowLeft,
  ArrowRight,
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
  Instagram
} from 'lucide-react';
import { socialMediaAPI } from '../../../services/api';
import { SocialAccount, SocialPost, PLATFORM_INFO, Platform } from '../../../types/socialMedia';
import FacebookPreview from '../../../components/social-media/FacebookPreview';
import InstagramPreview from '../../../components/social-media/InstagramPreview';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 'platforms', label: 'Select Platforms' },
  { id: 'compose', label: 'Compose' },
  { id: 'preview', label: 'Preview' },
  { id: 'schedule', label: 'Schedule & Publish' }
];

const IG_CHAR_LIMIT = 2200;
const FB_CHAR_LIMIT = 63206;

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    fetchAccounts();
    if (editId) {
      fetchPost(editId);
    }
  }, [editId]);

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
      }
      if (post.media.length > 0) {
        setMediaPreviews(post.media.map(m => m.url));
      }
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalFiles = mediaFiles.length + files.length;
    if (totalFiles > 10) {
      toast.error('Maximum 10 media files allowed');
      return;
    }

    setMediaFiles(prev => [...prev, ...files]);

    // Generate previews
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

    if (scheduledAt && scheduledTime) {
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
      navigate('/social-media');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
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

      if (scheduledAt && scheduledTime) {
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

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedAccounts.length > 0;
      case 1: return content.trim().length > 0 || mediaPreviews.length > 0;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  // Get FB and IG account data for previews
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/social-media')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {editId ? 'Edit Post' : 'Create Post'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {STEPS[currentStep].label}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, i) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => i < currentStep && setCurrentStep(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                i === currentStep
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : i < currentStep
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-pointer'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
              }`}
            >
              {i < currentStep ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">
                  {i + 1}
                </span>
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 ${i < currentStep ? 'bg-green-300 dark:bg-green-700' : 'bg-gray-200 dark:bg-gray-600'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">

        {/* Step 1: Select Platforms */}
        {currentStep === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Choose where to post
            </h2>

            {accounts.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-3">
                  No connected accounts found
                </p>
                <button
                  onClick={() => navigate('/social-media/accounts')}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Connect an account first
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accounts.map((account) => {
                  const selected = selectedAccounts.includes(account._id);
                  const platformInfo = PLATFORM_INFO[account.platform];

                  return (
                    <button
                      key={account._id}
                      onClick={() => toggleAccount(account._id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        selected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      {account.profilePictureUrl ? (
                        <img src={account.profilePictureUrl} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full ${platformInfo.bgColor} flex items-center justify-center`}>
                          {account.platform === 'facebook' ? (
                            <Facebook className={`w-5 h-5 ${platformInfo.color}`} />
                          ) : (
                            <Instagram className={`w-5 h-5 ${platformInfo.color}`} />
                          )}
                        </div>
                      )}
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {account.platformAccountName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {platformInfo.name}
                          {account.platformUsername && ` · @${account.platformUsername}`}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-500'
                      }`}>
                        {selected && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Compose */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Write your post
            </h2>

            {/* Content textarea */}
            <div>
              <TextareaAutosize
                value={content}
                onChange={(e) => setContent(e.target.value)}
                minRows={4}
                maxRows={12}
                placeholder="What would you like to share with your community?"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-400">
                  {hasInstagram && content.length > IG_CHAR_LIMIT && (
                    <span className="text-red-500">Exceeds Instagram's 2,200 character limit</span>
                  )}
                </p>
                <p className={`text-xs ${content.length > charLimit ? 'text-red-500' : 'text-gray-400'}`}>
                  {content.length}/{charLimit.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hashtags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {hashtags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                  >
                    #{tag}
                    <button onClick={() => removeHashtag(tag)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={handleAddHashtag}
                  placeholder="Type a hashtag and press Enter"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Media
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {mediaPreviews.map((preview, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden">
                      <img
                        src={preview}
                        alt=""
                        className="w-full aspect-square object-cover"
                      />
                      <button
                        onClick={() => removeMedia(i)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-400 dark:hover:border-primary-500 transition-colors text-gray-500 dark:text-gray-400 hover:text-primary-600"
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm">
                  {mediaPreviews.length > 0 ? 'Add more media' : 'Upload images or videos'}
                </span>
              </button>
              {hasInstagram && mediaPreviews.length === 0 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Instagram posts require at least one image
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Preview your post
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fbAccount && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    Facebook Preview
                  </h3>
                  <FacebookPreview
                    content={content + (hashtags.length > 0 ? '\n\n' + hashtags.map(t => `#${t}`).join(' ') : '')}
                    mediaUrls={mediaPreviews}
                    pageName={fbAccount.platformAccountName}
                    pageImage={fbAccount.profilePictureUrl}
                  />
                </div>
              )}

              {igAccount && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    Instagram Preview
                  </h3>
                  <InstagramPreview
                    content={content + (hashtags.length > 0 ? '\n\n' + hashtags.map(t => `#${t}`).join(' ') : '')}
                    mediaUrls={mediaPreviews}
                    username={igAccount.platformUsername || igAccount.platformAccountName}
                    profileImage={igAccount.profilePictureUrl}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Schedule & Publish */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              When should this be published?
            </h2>

            <div className="space-y-4">
              {/* Publish Now option */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <input
                  type="radio"
                  name="publishTime"
                  checked={!scheduledAt}
                  onChange={() => { setScheduledAt(''); setScheduledTime(''); }}
                  className="mt-1 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Publish now
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your post will be published immediately to all selected platforms
                  </p>
                </div>
              </label>

              {/* Schedule option */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <input
                  type="radio"
                  name="publishTime"
                  checked={!!scheduledAt}
                  onChange={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setScheduledAt(tomorrow.toISOString().split('T')[0]);
                    setScheduledTime('09:00');
                  }}
                  className="mt-1 text-primary-600 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Schedule for later
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Choose a date and time for your post to be published
                  </p>

                  {scheduledAt && (
                    <div className="flex items-center gap-3">
                      <input
                        type="date"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      />
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Publishing summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Summary</h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Publishing to {selectedAccounts.length} account(s)</li>
                <li>{mediaPreviews.length} media file(s)</li>
                <li>{hashtags.length} hashtag(s)</li>
                <li>
                  {scheduledAt
                    ? `Scheduled for ${new Date(`${scheduledAt}T${scheduledTime}`).toLocaleString()}`
                    : 'Publishing immediately'}
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => currentStep > 0 ? setCurrentStep(prev => prev - 1) : navigate('/social-media')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentStep > 0 ? 'Back' : 'Cancel'}
        </button>

        <div className="flex items-center gap-3">
          {/* Save Draft (visible on step 2+) */}
          {currentStep >= 1 && (
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
          )}

          {/* Next / Publish */}
          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {publishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : scheduledAt ? (
                <Calendar className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {scheduledAt ? 'Schedule Post' : 'Publish Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
