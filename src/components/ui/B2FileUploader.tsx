import React, { useRef, useState } from 'react';
import { Upload, X, FileAudio, FileVideo, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { sermonAPI } from '../../services/api';
import { getSecureItem } from '../../utils/encryption';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

interface UploadResult {
  url: string;
  size: number;
  fileName: string;
}

interface Props {
  sermonType: 'audio' | 'video';
  accept: string;
  maxSizeMb: number;
  onUploadComplete: (result: UploadResult) => void;
  onClear?: () => void;
  disabled?: boolean;
  label?: string;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

const B2FileUploader: React.FC<Props> = ({
  sermonType,
  accept,
  maxSizeMb,
  onUploadComplete,
  onClear,
  disabled = false,
  label,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const maxBytes = maxSizeMb * 1024 * 1024;
  const FileIcon = sermonType === 'audio' ? FileAudio : FileVideo;

  const handleFileSelect = async (file: File) => {
    // Client-side size guard
    if (file.size > maxBytes) {
      toast.error(`File exceeds the ${maxSizeMb} MB limit. Please choose a smaller file.`);
      return;
    }

    setState('uploading');
    setProgress(0);
    setFileName(file.name);

    try {
      // Get auth token
      const token = await getSecureItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated. Please login first.');
      }

      // Upload file to backend (server-side upload to B2, avoiding CORS)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sermonType', sermonType);

      let uploadedUrl: string;

      // Use XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success && response.data?.url) {
                uploadedUrl = response.data.url;
                resolve();
              } else {
                reject(new Error(response.message || 'Upload failed'));
              }
            } catch (e) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            reject(new Error(`Upload failed: HTTP ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        xhr.open('POST', `${API_BASE_URL}/sermons/upload-file`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      setState('done');
      setProgress(100);
      onUploadComplete({ url: uploadedUrl!, size: file.size, fileName: file.name });
    } catch (err: any) {
      if (err.message === 'Upload cancelled') {
        setState('idle');
        setProgress(0);
        setFileName('');
        return;
      }
      setState('error');
      toast.error(err?.message || 'Upload failed');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // reset input so the same file can be reselected after a clear
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || state === 'uploading') return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleClear = () => {
    if (xhrRef.current && state === 'uploading') {
      xhrRef.current.abort();
    }
    setState('idle');
    setProgress(0);
    setFileName('');
    onClear?.();
  };

  if (state === 'done') {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-800 dark:text-green-300 truncate">{fileName}</p>
          <p className="text-xs text-green-600 dark:text-green-400">Upload complete</p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="p-1 text-green-500 hover:text-green-700 dark:hover:text-green-300 transition-colors"
          title="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (state === 'uploading') {
    return (
      <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <Loader2 className="w-5 h-5 text-primary-600 animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{fileName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Uploading... {progress}%</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Cancel upload"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
          <div
            className="bg-primary-600 h-1.5 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">Upload failed</p>
          <p className="text-xs text-red-600 dark:text-red-400">Please try again</p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // Idle drop zone
  return (
    <div
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
        disabled
          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60'
          : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 bg-gray-50 dark:bg-gray-700/50 hover:bg-primary-50 dark:hover:bg-primary-900/10'
      }`}
    >
      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-600">
        <FileIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label || `Click or drag to upload ${sermonType}`}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          Max {maxSizeMb} MB · {accept.split(',').join(', ')}
        </p>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg">
        <Upload className="w-3.5 h-3.5" />
        Browse file
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
};

export default B2FileUploader;
