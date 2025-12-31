// client/src/pages/admin/logs/index.tsx

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import { Loader, FileText, Download, Search, RefreshCcw } from 'lucide-react';

const AdminLogs: React.FC = () => {
  const [logFiles, setLogFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [logContent, setLogContent] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContent, setFilteredContent] = useState<string | null>(null);

  useEffect(() => {
    fetchLogFiles();
  }, []);

  useEffect(() => {
    if (logContent) {
      setFilteredContent(
        logContent
          .split('\n')
          .filter(line => line.toLowerCase().includes(searchTerm.toLowerCase()))
          .join('\n')
      );
    } else {
      setFilteredContent(null);
    }
  }, [logContent, searchTerm]);

  const fetchLogFiles = async () => {
    setLoadingFiles(true);
    setError(null);
    try {
      const response = await api.get('/admin/logs');
      setLogFiles(response.data.data.logFiles);
      if (response.data.data.logFiles.length > 0 && !selectedFile) {
        setSelectedFile(response.data.data.logFiles[0]); // Auto-select the first log file
        fetchLogContent(response.data.data.logFiles[0]);
      }
    } catch (err: any) {
      console.error('Failed to fetch log files:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load log files.';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchLogContent = async (filename: string) => {
    setSelectedFile(filename);
    setLoadingContent(true);
    setLogContent(null);
    setFilteredContent(null);
    setError(null);
    setSearchTerm(''); // Clear search term when a new file is selected
    try {
      const response = await api.get(`/admin/logs/${filename}`);
      setLogContent(response.data.data.content);
    } catch (err: any) {
      console.error(`Failed to fetch content for ${filename}:`, err);
      const errorMessage = err.response?.data?.message || `Failed to load content for ${filename}.`;
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleDownloadLog = () => {
    if (logContent && selectedFile) {
      const blob = new Blob([logContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedFile;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <FileText className="w-7 h-7 mr-3 text-primary-500" />
            System Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage application system logs.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchLogFiles}
            disabled={loadingFiles}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {loadingFiles ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCcw className="w-4 h-4 mr-2" />
            )}
            Refresh Files
          </button>
          <button
            onClick={handleDownloadLog}
            disabled={!logContent || loadingContent}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Log File List */}
        {/* // set the height to content-fit */}
        <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 max-h-[calc(100vh-200px)]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available Log Files
          </h3>
          {loadingFiles ? (
            <div className="flex items-center justify-center h-24">
              <Loader className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          ) : error && !logFiles.length ? (
            <div className="text-red-500 text-sm">{error}</div>
          ) : (
            <ul className="space-y-2">
              {logFiles.map(file => (
          <li key={file}>
            <button
              onClick={() => fetchLogContent(file)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${selectedFile === file
            ? 'bg-primary-100 dark:bg-primary-700 text-primary-800 dark:text-white'
            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
              disabled={loadingContent}
            >
              <FileText className="w-4 h-4" />
              <span>{file}</span>
            </button>
          </li>
              ))}
            </ul>
          )}
        </div>

        {/* Log Content Viewer */}
        <div className="md:col-span-3 bg-gray-900 rounded-xl shadow-sm border border-gray-700 flex flex-col max-h-[calc(100vh-200px)]">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Log Content: {selectedFile || 'Select a file'}
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
          type="text"
          placeholder="Search log content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-48 pl-9 pr-3 py-1.5 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          disabled={!logContent}
              />
            </div>
          </div>
          <div className="flex-1 p-4 overflow-auto font-mono text-sm text-gray-200 whitespace-pre-wrap">
            {loadingContent ? (
              <div className="flex items-center justify-center h-full">
          <Loader className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : error ? (
              <div className="text-red-400">{error}</div>
            ) : filteredContent ? (
              filteredContent
            ) : (
              <div className="text-gray-400">Select a log file to view its content.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;
