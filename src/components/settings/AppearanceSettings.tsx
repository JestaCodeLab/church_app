import React, { useState, useEffect } from 'react';
import { Upload, X, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toasts';
import axios from 'axios';

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

   // Load merchant branding data on mount
  useEffect(() => {
    const loadBranding = async () => {
      try {
        setLoadingData(true);
        
        // Get merchant branding from user context
        if (user?.merchant?.branding) {
          const branding = user.merchant.branding;
          
          setFormData({
            logo: branding.logo || '',
            primaryColor: branding.primaryColor || '#4F46E5',
            secondaryColor: branding.secondaryColor || '#10B981',
            tagline: branding.tagline || '',
          });
          
          setPreviewUrl(branding.logo || '');
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

    const token = localStorage.getItem('accessToken');
    
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