"use client";

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Subtask, Project, User } from '@/types';
import { useGet } from '@/hooks/useApi'; // Import useGet hook
import { useUser } from '@/context/UserContext';
import { PERMISSIONS as FE_PERMISSIONS } from '@/constants/permissions';

interface FileUploadSubtaskProps {
  subtask: Subtask;
  project: Project;
  onUploadComplete: () => void;
  currentUser: User | null;
}

interface UploadedFile {
  id: number;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export const FileUploadSubtask: React.FC<FileUploadSubtaskProps> = ({
  subtask,
  project,
  onUploadComplete,
  currentUser
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { hasPermission: userHasPermission } = useUser();

  // Check if user can update subtask status
  const canUpdateSubtaskStatus = subtask.actionByRole === currentUser?.role?.role && 
                                 currentUser?.role?.role === 'Project Manager' && 
                                 userHasPermission(FE_PERMISSIONS.SUBTASKS.CHANGE_STATUS);

  // Parse metadata for file type restrictions
  const allowedFileTypes = React.useMemo(() => {
    if (subtask.metadataJson) {
      try {
        const metadata = JSON.parse(subtask.metadataJson);
        return metadata.fileTypes || [];
      } catch (e) {
        console.error('Error parsing subtask metadata:', e);
        return [];
      }
    }
    return [];
  }, [subtask.metadataJson]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    setErrorMessage('');
    setUploadStatus('idle');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedFileTypes.length > 0 
      ? allowedFileTypes.reduce((acc: Record<string, string[]>, type: string) => {
          acc[`image/${type.toLowerCase()}`] = [`.${type.toLowerCase()}`];
          acc[`application/${type.toLowerCase()}`] = [`.${type.toLowerCase()}`];
          return acc;
        }, {})
      : undefined,
    multiple: true
  });

  const handleUpload = async () => {
    if (files.length === 0) {
      setErrorMessage('Please select files to upload');
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${project.id}/tasks/${subtask.id}/upload`,
          {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        // Update progress
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      setUploadStatus('success');
      onUploadComplete();
      
      // Clear files after successful upload
      setTimeout(() => {
        setFiles([]);
        setUploadProgress(0);
        setUploadStatus('idle');
      }, 2000);

    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    if (files.length === 1) {
      setUploadStatus('idle');
      setErrorMessage('');
    }
  };

  const { data: uploadedFilesData, loading: loadingFiles, error: filesError, refetch: refetchFiles } = useGet<{ files: UploadedFile[] }>(
    `/projects/${project.id}/tasks/${subtask.id}/files`
  );

  const uploadedFiles = uploadedFilesData?.files || [];

  const isActionByCurrentUser = subtask.actionByRole === currentUser?.role?.role;

  return (
    <div className="h-full">
      {canUpdateSubtaskStatus ? (
        <>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-all duration-200 ease-in-out
              ${isDragActive ? 'border-blue-400 bg-blue-50 scale-[0.99]' : 'border-gray-300 hover:border-gray-400'}
              ${uploadStatus === 'error' ? 'border-red-300 bg-red-50' : ''}
              ${uploadStatus === 'success' ? 'border-green-300 bg-green-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            <Upload className={`mx-auto h-12 w-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive
                ? 'Drop the files here...'
                : 'Drag and drop files here, or click to select files'}
            </p>
            {allowedFileTypes.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Allowed file types: {allowedFileTypes.join(', ')}
              </p>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <ul className="mt-6 space-y-3">
              {files.map((file, index) => (
                <li 
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center space-x-3">
                    <File className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Status Messages */}
          <div className="mt-6 space-y-4">
            {/* Upload Progress */}
            {uploadStatus === 'uploading' && (
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-blue-500 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-700 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-500" />
                  Uploading... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}

            {/* Success Message */}
            {uploadStatus === 'success' && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm">
                <div className="flex items-center justify-center text-green-700">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  <span className="font-medium">Upload completed successfully!</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 shadow-sm">
                <div className="flex items-center justify-center text-red-700">
                  <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {files.length > 0 && !['uploading', 'success'].includes(uploadStatus) && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleUpload}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                disabled={uploadStatus === 'uploading'}
              >
                Upload {files.length} file{files.length !== 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Files</h4>
          {loadingFiles ? (
            <div className="flex items-center text-gray-500">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading files...
            </div>
          ) : filesError ? (
            <div className="flex items-center text-red-700">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">Error loading files: {filesError.message}</span>
            </div>
          ) : uploadedFiles.length > 0 ? (
            <ul className="space-y-2">
              {uploadedFiles.map((file) => (
                <li key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-2">
                    <File className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{file.fileName}</span>
                  </div>
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No files uploaded.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploadSubtask;
