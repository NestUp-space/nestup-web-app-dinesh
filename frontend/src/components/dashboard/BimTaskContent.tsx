"use client";

import React from 'react';
import MaterialManagement from './MaterialManagement';
import BoxConfiguration from './BoxConfiguration';
import { Download } from 'lucide-react';
import { usePlankListDownloadUrl } from '@/hooks';

interface BimTaskContentProps {
  taskId: number;
  projectId: number;
  taskName: string;
}

const BimTaskContent: React.FC<BimTaskContentProps> = ({ taskId, projectId, taskName }) => {
  const plankListDownloadUrl = usePlankListDownloadUrl(taskId);
  
  // Only show the BIM UI for the "Site Visit" task
  const isSiteVisitTask = taskName === 'Site Visit';
  
  // Check if this is the "Output QA" task where we should show the plank list download
  const isOutputQaTask = taskName === 'Output QA';
  
  if (!isSiteVisitTask && !isOutputQaTask) {
    return null;
  }
  
  return (
    <div className="mt-4">
      {isSiteVisitTask && (
        <>
          <MaterialManagement projectId={projectId} />
          <BoxConfiguration taskId={taskId} projectId={projectId} />
        </>
      )}
      
      {isOutputQaTask && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Generated Files</h3>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex-grow">
              <p className="font-medium">Plank List</p>
              <p className="text-sm text-gray-500">Download the generated plank list as CSV</p>
            </div>
            <a 
              href={plankListDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Download size={16} className="mr-1" /> Download CSV
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default BimTaskContent;
