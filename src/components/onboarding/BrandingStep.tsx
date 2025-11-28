import React, { useRef } from 'react';
import { ArrowRight, ArrowLeft, Upload, X } from 'lucide-react';
import { showToast } from '../../utils/toasts';

interface BrandingStepProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const BrandingStep: React.FC<BrandingStepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
  onSkip,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showToast.error('File size must be less than 2MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast.error('Please upload an image file');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          logo: file, // Store actual file
          logoPreview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData({
      ...formData,
      logo: null,
      logoPreview: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors">
      {/* Progress */}
      <div className="mb-8">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Step 3 of 4
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: '75%' }} />
        </div>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Add Your Church Branding
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Customize your dashboard with your church's logo and colors. You can always update this later from settings.
        </p>
      </div>

      {/* Logo Upload */}
      <div className="mb-5">    
        {formData.logoPreview ? (
            <>     
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selected Logo
            </label>    
            <div className="relative inline-block">
                <img
                src={formData.logoPreview}
                alt="Logo preview"
                className="w-40 h-20 object-contain rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-2"
                />
                <button
                onClick={removeLogo}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors shadow-lg"
                >
                <X className="w-5 h-5" />
                </button>
            </div>
            </>
        ) : (
          <div 
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-900"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-300 font-bold mb-1 text-lg">
              Upload your Church Logo
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Drag and drop or click to browse files
            </p>
            <button
              type="button"
              className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
            >
              Browse Files
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              PNG, JPG or SVG • Max 2MB
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />
      </div>

      {/* Color Pickers */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Primary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="w-11 h-11 rounded-lg cursor-pointer border-1 border-gray-300 dark:border-gray-600 p-0"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
                  placeholder="#4F46E5"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Secondary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="w-11 h-11 rounded-lg cursor-pointer border-1 border-gray-300 dark:border-gray-600 p-0"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
                  placeholder="#10B981"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 mb-3">
          Preview
        </span>
        <div className="flex items-center space-x-4">
          {formData.logoPreview && (
            <img
              src={formData.logoPreview}
              alt="Logo"
              className="w-12 h-12 object-contain"
            />
          )}
          <div>
            <div 
              className="text-xl font-bold mb-1"
              style={{ color: formData.primaryColor }}
            >
              {formData.churchName || 'Your Church Name'}
            </div>
            <div 
              className="text-sm"
              style={{ color: formData.secondaryColor }}
            >
              Building faith communities together
            </div>
          </div>
        </div>
      </div>

      {/* Navigation - Single Line */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-6 py-3 text-gray-600 rounded-lg border border-gray-300 dark:border-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={onSkip}
            className="px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={onNext}
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition duration-200 flex items-center"
          >
            Continue
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandingStep;
