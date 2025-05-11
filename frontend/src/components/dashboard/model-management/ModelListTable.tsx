"use client";

"use client";

import React from 'react'; // Removed useState, useEffect as SWR handles this
import Link from 'next/link';
import useSWR from 'swr'; // Changed to SWR
import { Eye, Edit3, Trash2, AlertCircle } from 'lucide-react';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Button } from '@/components/ui/button'; // Assuming shadcn/ui button
// import { Badge } from '@/components/ui/badge'; // Assuming shadcn/ui badge
import { apiClient } from '@/lib/api/client'; // Assuming an API client setup

// Define the expected shape of a ModelDefinition from the API
interface ModelDefinition { // This interface can be moved to a types file later
  id: string;
  name: string;
  description?: string | null;
  updatedAt: string; // Assuming string date from API
  // Add other fields as necessary, e.g., imageUrl
}

// SWR fetcher function
const fetcher = (url: string) => apiClient.get(url).then(res => res.data);

export default function ModelListTable() {
  // const queryClient = useQueryClient(); // Not used with SWR directly like this

  const { data: models, error, isLoading } = useSWR<ModelDefinition[]>('/model-definitions', fetcher);

  // Delete functionality would be handled differently with SWR, e.g., using mutate from useSWRConfig
  // For now, keeping it commented out to focus on displaying data.

  // const handleDelete = (modelId: string) => {
  //   if (window.confirm('Are you sure you want to delete this model?')) {
  //     deleteMutation.mutate(modelId);
  //   }
  // };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <p>Loading models...</p> {/* Replace with a spinner component if available */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-red-600">
        <AlertCircle className="h-12 w-12 mb-2" />
        <p className="text-lg">Error fetching model definitions:</p>
        <p className="text-sm">{error.message || 'An unknown error occurred.'}</p>
      </div>
    );
  }

  if (!models && !isLoading) { // Check if models is undefined and not loading
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No models found. Get started by creating a new model.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      {/* Using basic HTML table for now. Replace with <Table> component if available from shadcn/ui or similar */}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {models && models.map((model: ModelDefinition) => ( // Added type for model
            <tr key={model.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{model.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={model.description || ''}>
                {model.description || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(model.updatedAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <Link href={`/dashboard/catalogue/${model.id}/edit`} passHref legacyBehavior>
                  <a className="text-indigo-600 hover:text-indigo-900" title="Edit">
                    <Edit3 className="h-5 w-5" />
                  </a>
                </Link>
                {/* Delete button placeholder - SWR mutation needed */}
                {/* <button 
                  // onClick={() => handleDelete(model.id)} 
                  className="text-red-600 hover:text-red-900"
                  title="Delete"
                >
                  <Trash2 className="h-5 w-5" />
                </button> */}
                <Link href={`/dashboard/catalogue/${model.id}`} passHref legacyBehavior>
                   <a className="text-gray-600 hover:text-gray-900" title="View Details">
                    <Eye className="h-5 w-5" />
                  </a>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
