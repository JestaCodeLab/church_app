import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader, RotateCcw } from 'lucide-react';
import { sermonAPI } from '../../services/api';
import * as Bytescale from '@bytescale/sdk';

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
 * Direct browser upload to Bytescale using Bytescale SDK
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
  const uploadManagerRef = useRef<Bytescale.UploadManager | null>(null);
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

  // Initialize Bytescale SDK with upload manager
  useEffect(() => {
    const initializeUploadManager = async () => {
      try {
        const response = await sermonAPI.getUploadToken();
        const { publicApiKey, merchantId } = response.data.data;

        uploadManagerRef.current = new Bytescale.UploadManager({
          apiKey: publicApiKey // Public API key for browser uploads
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize upload manager';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    };

    initializeUploadManager();
  }, [onError]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!uploadManagerRef.current) {
        const errorMsg = 'Upload manager not initialized';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

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

        // Upload using Bytescale SDK
        const result = await uploadManagerRef.current.upload({
          data: file,
          mime: file.type,
          originalFileName: file.name,
          onProgress: ({ progress }) => {
            // progress is a number between 0 and 1, cap at 100%
            const percentage = Math.min(Math.round(progress * 100), 100);
            setProgress({
              loaded: Math.round(file.size * progress),
              total: file.size,
              percentage
            });
          }
        });

        // Track uploaded file
        setUploadedFile({
          name: file.name,
          type: acceptType,
          size: file.size,
          url: result.fileUrl
        });

        // Call callback with upload result
        onUploadComplete({
          type: acceptType,
          url: result.fileUrl,
          size: file.size
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
    [acceptType, maxFileSize, onUploadComplete, onError]
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
          <div className="w-full">
            <div className="p-4 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg border border-secondary-200 dark:border-secondary-700/50 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-secondary-600 dark:text-secondary-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-secondary-800 dark:text-secondary-300">File uploaded successfully</p>
                <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                  {uploadedFile.name} • {formatFileSize(uploadedFile.size)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-secondary-600 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 flex-shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
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
