import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { memberAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface ImportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const ImportMembersModal: React.FC<ImportMembersModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setPreviewData(null);
    setImportResults(null);
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      const response = await memberAPI.previewImport(selectedFile);
      setPreviewData(response.data.data);
      
      if (response.data.data.errorRows > 0) {
        toast.error(`Found ${response.data.data.errorRows} rows with errors`);
      } else {
        toast.success(`${response.data.data.validRows} valid rows ready to import`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to preview file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      const response = await memberAPI.importMembers(selectedFile);
      setImportResults(response.data.data);
      toast.success(response.data.message);
      
      if (response.data.data.imported > 0) {
        setTimeout(async () => {
          await onImportComplete();
          handleClose();
        }, 2000);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to import members');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setImportResults(null);
    setIsDragging(false);
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent = `First Name,Last Name,Email,Phone,Date of Birth (YYYY-MM-DD),Gender,Marital Status,Membership Type,Branch,Address,City,Region,Country,Occupation,Emergency Contact Name,Emergency Contact Phone,Notes,Join Date (YYYY-MM-DD)
John,Doe,john.doe@example.com,+1234567890,1990-01-15,Male,Married,Member,Main Branch,123 Main St,Accra,Greater Accra,Ghana,Engineer,Jane Doe,+1234567891,Sample notes,2024-01-01
Jane,Smith,jane.smith@example.com,+1234567892,1985-05-20,Female,Single,Pastor,Youth Branch,456 Oak Ave,Kumasi,Ashanti,Ghana,Teacher,John Smith,+1234567893,,2024-01-15`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  console.log('Preview Data ==>', previewData)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-6 h-6 text-primary-600" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Import Members
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Download Template */}
            <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                    Need a template?
                  </p>
                  <p className="text-xs text-primary-700 dark:text-blue-300 mt-1">
                    Download our CSV template with sample data to get started
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center px-3 py-2 text-sm font-medium text-primary-700 dark:text-blue-300 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-primary-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </button>
              </div>
            </div>

            {/* File Upload */}
            {!importResults && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Drag & drop your CSV or Excel file here, or
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      Browse files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Supports CSV, XLS, XLSX (Max 5MB)
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Preview Results */}
            {previewData && !importResults && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Rows</p>
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {previewData.totalRows}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Valid Rows</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {previewData.validRows}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Errors</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {previewData.errorRows}
                    </p>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="max-h-64 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Row
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Email
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Membership
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {previewData.preview.slice(0, 10).map((row: any) => (
                        <tr key={row.rowNumber}>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                            {row.rowNumber}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                            {row.data.firstName} {row.data.lastName}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                            {row.data.email}
                          </td>

                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                            {row.data.membershipType}
                          </td>
                          <td className="px-4 py-2">
                            {row.isValid ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <span className="text-xs text-red-600">
                                  {row.errors.join(', ')}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import Results */}
            {importResults && (
              <div className="mt-6 space-y-4">
                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                    Import Complete!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Successfully imported {importResults.imported} of {importResults.totalRows} members
                  </p>
                  {importResults.failed > 0 && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      {importResults.failed} rows failed to import
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!importResults && (
            <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              
              {!previewData ? (
                <button
                  onClick={handlePreview}
                  disabled={!selectedFile || isProcessing}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Preview'}
                </button>
              ) : (
                <button
                  onClick={handleImport}
                  disabled={previewData.validRows === 0 || isProcessing}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Importing...' : `Import ${previewData.validRows} Members`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportMembersModal;