import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { settingsAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { User, Upload, X } from 'lucide-react';

const ProfileSettings = () => {
  const { user, checkAuth } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
      if (user.photo) {
        setPhotoPreview(user.photo);
      }
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast.error('Please select an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showToast.error('Image must be less than 2MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    // Here you might want to call an API to remove the photo from the server
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('photo', photoFile);
        await settingsAPI.updateProfilePhoto(photoFormData);
      }

      await settingsAPI.updateProfile(formData);
      await checkAuth(); // Re-fetch user data to update context
      showToast.success('Profile updated successfully!');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Profile Picture Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile Picture</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Update your photo for a more personal experience.
            </p>
            <div className="flex items-center space-x-6 mt-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {photoPreview ? 'Change' : 'Upload'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                {photoPreview && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="px-4 py-2 bg-transparent border border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ProfileSettings;
