import React, { useRef, useState, useCallback } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { sermonAPI } from '../../services/api';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface BytescaleUploaderProps {
  onUploadComplete: (data: {
    type: 'audio' | 'video';
    url: string;
    size: number;
  }) => void;
  onError?: (error: string) => void;
  acceptType: 'audio' | 'video';
  maxFileSize?: number; // in bytes, default 5GB
  disabled?: boolean;
  className?: string;
}

/**
 * BytescaleUploader Component
 * Direct browser upload to Bytescale for sermon audio/video files
 * Supports audio and video uploads with progress tracking
 */
const BytescaleUploader: React.FC<BytescaleUploaderProps> = ({
  onUploadComplete,
  onError,
  acceptType,
  maxFileSize = 5368709120, // 5GB default
  disabled = false,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    type: 'audio' | 'video';
    size: number;
    url: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const acceptMimes = {
    audio: 'audio/mpeg,audio/wav,audio/aac,audio/m4a,audio/flac',
    video: 'video/mp4,video/quicktime,video/x-msvideo,video/webm'
  };

  const getUploadToken = useCallback(async () => {
    try {
      const response = await sermonAPI.getUploadToken();
      return response.data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get upload token';
      setError(errorMsg);
      onError?.(errorMsg);
      throw err;
    }
  }, [onError]);

  const uploadToBytescale = useCallback(
    async (file: File, uploadToken: string, accountId: string) => {
      const formData = new FormData();
      formData.append('file', file);

      return new Promise<{
        fileUrl: string;
        fileSize: number;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentage = Math.round((e.loaded / e.total) * 100);
            setProgress({
              loaded: e.loaded,
              total: e.total,
              percentage
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              const fileUrl = `https://cdn.bytescale.com/b/${accountId}/${response.fileUrl}`;
              resolve({
                fileUrl,
                fileSize: file.size
              });
            } catch (err) {
              reject(new Error('Invalid response from Bytescale'));
            }
          } else {
            reject(new Error(`Bytescale upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        const bytescaleUrl = `https://api.bytescale.com/v2/accounts/${accountId}/uploads`;
        xhr.open('POST', bytescaleUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${uploadToken}`);
        xhr.send(formData);
      });
    },
    []
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setError(null);
      setProgress(null);
      setUploadedFile(null);

      // Validate file size
      if (file.size > maxFileSize) {
        const errorMsg = `File size (${(file.size / 1024 / 1024 / 1024).toFixed(2)} GB) exceeds limit (${(maxFileSize / 1024 / 1024 / 1024).toFixed(2)} GB)`;
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      try {
        setUploading(true);

        // Get upload token from backend
        const tokenData = await getUploadToken();
        const { uploadToken, accountId } = tokenData;

        // Upload to Bytescale
        const { fileUrl, fileSize } = await uploadToBytescale(file, uploadToken, accountId);

        // Track uploaded file
        setUploadedFile({
          name: file.name,
          type: acceptType,
          size: fileSize,
          url: fileUrl
        });

        // Call callback with upload result
        onUploadComplete({
          type: acceptType,
          url: fileUrl,
          size: fileSize
        });

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setUploading(false);
        setProgress(null);
      }
    },
    [acceptType, maxFileSize, getUploadToken, uploadToBytescale, onUploadComplete, onError]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (fileInputRef.current) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.current.files = dataTransfer.files;
          handleFileChange({
            target: fileInputRef.current
          } as React.ChangeEvent<HTMLInputElement>);
        }
      }
    },
    [handleFileChange]
  );

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors dark:bg-gray-700/50
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
          ${uploading ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-600' : 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-600 hover:border-primary-400 dark:hover:border-primary-500'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptMimes[acceptType]}
          onChange={handleFileChange}
          disabled={disabled || uploading}
          className="hidden"
        />

        {!uploadedFile ? (
          <>
            {uploading ? (
              <>
                <Loader className="w-12 h-12 mx-auto mb-2 text-primary-600 dark:text-primary-400 animate-spin" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploading...</p>
                {progress && (
                  <>
                    <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2 mt-4 mb-2">
                      <div
                        className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {progress.percentage}% ({formatFileSize(progress.loaded)} / {formatFileSize(progress.total)})
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-2 text-primary-400 dark:text-primary-500" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Drag and drop your {acceptType} file here, or click to select
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum file size: {formatFileSize(maxFileSize)}
                </p>
              </>
            )}
          </>
        ) : (
          <>
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-secondary-600 dark:text-secondary-400" />
            <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">{uploadedFile.name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{formatFileSize(uploadedFile.size)}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setUploadedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mt-2"
            >
              Choose different file
            </button>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Upload failed</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BytescaleUploader;
