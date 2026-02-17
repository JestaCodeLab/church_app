import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Loader, Image, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toasts';
import { getSecureItem } from '../../utils/encryption';
import { merchantAPI } from '../../services/api';
import axios from 'axios';

// Interface for merchant branding with login slides
interface MerchantBranding {
  logo?: string;
  logoPublicId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  tagline?: string;
  loginSlides?: Array<{
    url: string;
    publicId?: string;
    caption?: string;
  }>;
}

const AppearanceSettings = () => {
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  const [formData, setFormData] = useState({
    logo: user?.merchant?.branding?.logo || '',
    primaryColor: user?.merchant?.branding?.primaryColor || '#4F46E5',
    secondaryColor: user?.merchant?.branding?.secondaryColor || '#10B981',
    tagline: user?.merchant?.branding?.tagline || '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(formData.logo);

  // Login slides state
  const [loginSlides, setLoginSlides] = useState<Array<{ url: string; caption?: string }>>([]);
  const [uploadingSlide, setUploadingSlide] = useState(false);
  const [deletingSlideIndex, setDeletingSlideIndex] = useState<number | null>(null);
  const slideInputRef = useRef<HTMLInputElement>(null);

   // Load merchant branding data on mount
  useEffect(() => {
    const loadBranding = async () => {
      try {
        setLoadingData(true);
        
        // Get merchant branding from user context
        if (user?.merchant?.branding) {
          const branding = user.merchant.branding as MerchantBranding;
          
          setFormData({
            logo: branding.logo || '',
            primaryColor: branding.primaryColor || '#4F46E5',
            secondaryColor: branding.secondaryColor || '#10B981',
            tagline: branding.tagline || '',
          });
          
          setPreviewUrl(branding.logo || '');
          setLoginSlides(branding.loginSlides || []);
        }
      } catch (error) {
        console.error('Failed to load branding:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadBranding();
  }, [user]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast.error('Image size must be less than 5MB');
        return;
      }

      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setPreviewUrl('');
    setFormData({ ...formData, logo: '' });
  };

  const handleSlideUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast.error('Image size must be less than 5MB');
      return;
    }
    if (loginSlides.length >= 5) {
      showToast.error('Maximum 5 login slides allowed');
      return;
    }

    setUploadingSlide(true);
    try {
      const data = new FormData();
      data.append('slide', file);
      const response = await merchantAPI.uploadLoginSlide(data);
      if (response.data.success) {
        setLoginSlides(response.data.data.loginSlides);
        showToast.success('Login slide uploaded!');
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to upload slide');
    } finally {
      setUploadingSlide(false);
      if (slideInputRef.current) slideInputRef.current.value = '';
    }
  };

  const handleDeleteSlide = async (index: number) => {
    setDeletingSlideIndex(index);
    try {
      const response = await merchantAPI.deleteLoginSlide(index);
      if (response.data.success) {
        setLoginSlides(response.data.data.loginSlides);
        showToast.success('Slide deleted');
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to delete slide');
    } finally {
      setDeletingSlideIndex(null);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const data = new FormData();
    
    if (logoFile) {
      data.append('logo', logoFile);
    }
    
    data.append('primaryColor', formData.primaryColor);
    data.append('secondaryColor', formData.secondaryColor);
    data.append('tagline', formData.tagline);

    const token = await getSecureItem('accessToken');
    
    const response = await axios.patch(
      `${process.env.REACT_APP_API_URL}/merchants/branding`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    showToast.success('Appearance settings updated successfully!');
    
    // Refresh user data to get new branding
    await checkAuth();
    
    // Update preview URL with new logo
    if (response.data.data?.branding?.logo) {
      setPreviewUrl(response.data.data.branding.logo);
    }
    
    // Small delay then reload to apply new CSS variables
    setTimeout(() => {
      window.location.reload();
    }, 500);
    
  } catch (error: any) {
    console.error('❌ Update error:', error);
    showToast.error(error.response?.data?.message || 'Failed to update settings');
  } finally {
    setLoading(false);
  }
};

  if (loadingData) {
    return (
        <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
        </div>
    );
    }

  return (
    <form onSubmit={handleSubmit} className="max-w-8xl">
        <div className='flex gap-6'>
            {/* Logo Upload */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Church Logo
                </h3>
                
                <div className="space-y-4">
                {previewUrl ? (
                    <div className="relative inline-block">
                    <img
                        src={previewUrl}
                        alt="Logo preview"
                        className="h-24 w-auto object-contain rounded-lg border-2 border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-900"
                    />
                    <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    </div>
                ) : (
                    <div 
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
                    >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-base font-bold text-gray-900 dark:text-gray-400 mb-1">
                        Upload your church logo
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                        PNG, JPG up to 5MB
                    </p>
                    </div>
                )}

                <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-600 file:text-white
                    hover:file:bg-primary-700
                    file:cursor-pointer
                    dark:file:bg-primary-600 dark:file:text-white dark:hover:file:bg-primary-700"
                />
                </div>
            </div>

            <div>
                {/* Colors */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Brand Colors
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Primary Color
                        </label>
                        <div className="flex items-center space-x-3">
                        <input
                            type="color"
                            value={formData.primaryColor}
                            onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                            className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                        <input
                            type="text"
                            value={formData.primaryColor}
                            onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="#4F46E5"
                        />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Secondary Color
                        </label>
                        <div className="flex items-center space-x-3">
                        <input
                            type="color"
                            value={formData.secondaryColor}
                            onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                            className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                        <input
                            type="text"
                            value={formData.secondaryColor}
                            onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="#10B981"
                        />
                        </div>
                    </div>
                    </div>
                </div>

                {/* Tagline */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Tagline
                    </h3>
                    
                    <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Welcome to our church"
                    maxLength={100}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.tagline.length}/100 characters
                    </p>
                </div>
            </div>
        </div>


      {/* Login Screen Slides */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Image className="w-5 h-5" />
              Login Screen Slides
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload images for your login page slideshow (max 5). If none are uploaded, a default image will be shown.
            </p>
          </div>
        </div>

        {/* Slides grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          {loginSlides.map((slide, index) => (
            <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 aspect-[4/3]">
              <img
                src={slide.url}
                alt={slide.caption || `Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleDeleteSlide(index)}
                  disabled={deletingSlideIndex === index}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white rounded-full p-2 disabled:opacity-50"
                  title="Delete slide"
                >
                  {deletingSlideIndex === index ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
              {slide.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                  <p className="text-white text-xs truncate">{slide.caption}</p>
                </div>
              )}
            </div>
          ))}

          {/* Add slide button */}
          {loginSlides.length < 5 && (
            <button
              type="button"
              onClick={() => slideInputRef.current?.click()}
              disabled={uploadingSlide}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg aspect-[4/3] flex flex-col items-center justify-center gap-2 hover:border-primary-500 dark:hover:border-primary-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingSlide ? (
                <Loader className="w-6 h-6 animate-spin text-primary-600" />
              ) : (
                <>
                  <Plus className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Add Slide</span>
                </>
              )}
            </button>
          )}
        </div>

        <input
          ref={slideInputRef}
          type="file"
          accept="image/*"
          onChange={handleSlideUpload}
          className="hidden"
        />

        {loginSlides.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            No slides uploaded yet. Your login page will display a default image.
          </p>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          <span>{loading ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </form>
  );
};

export default AppearanceSettings;