import React from 'react';
import { X, Image as ImageIcon, Upload } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  preview: string;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  accept?: string;
  maxSize?: number; // in MB
  helperText?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  preview,
  onImageSelect,
  onImageRemove,
  accept = 'image/*',
  maxSize = 5,
  helperText
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    onImageSelect(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
            <button
              type="button"
              onClick={onImageRemove}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            id={`image-upload-${label}`}
          />
          <label
            htmlFor={`image-upload-${label}`}
            className="cursor-pointer flex flex-col items-center"
          >
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-primary-600 dark:text-primary-400 font-medium mb-1">
              Click to upload
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {helperText || `PNG, JPG, GIF up to ${maxSize}MB`}
            </p>
          </label>
        </div>
      )}
    </div>
  );
};

interface GalleryUploaderProps {
  label: string;
  previews: string[];
  onImagesSelect: (files: File[]) => void;
  onImageRemove: (index: number) => void;
  maxImages?: number;
  maxSize?: number; // in MB
}

export const GalleryUploader: React.FC<GalleryUploaderProps> = ({
  label,
  previews,
  onImagesSelect,
  onImageRemove,
  maxImages = 10,
  maxSize = 5
}) => {
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check max images
    if (previews.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate each file
    const validFiles = files.filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`${file.name} is too large (max ${maxSize}MB)`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      onImagesSelect(validFiles);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Gallery ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => onImageRemove(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {previews.length < maxImages && (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            className="hidden"
            id="gallery-upload"
          />
          <label
            htmlFor="gallery-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-primary-600 dark:text-primary-400 font-medium mb-1">
              Add Images
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {previews.length}/{maxImages} images • PNG, JPG, GIF up to {maxSize}MB each
            </p>
          </label>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;