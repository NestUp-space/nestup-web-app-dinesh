"use client";

import React from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Eye } from 'lucide-react'; // Added Edit and Eye icons
import useSWR from 'swr';
import { apiClient } from '@/lib/api/client';
import Image from 'next/image'; // For displaying images

interface ListedModelData {
  id: string;
  name: string; // Changed from modelType to name, to match backend
  description: string | null;
  imageUrl: string | null;
  // Add other fields if needed for display, e.g., createdAt, updatedAt
}

const fetcher = (url: string) => apiClient.get(url); // Corrected: apiClient.get already returns the data

export default function ModelManagementPage() {
  const { data: models, error, isLoading } = useSWR<ListedModelData[]>('/v1/catalogue', fetcher); // Removed /api prefix

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Model Catalogue</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Browse, define, and manage your furniture models.
          </p>
        </div>
        <Link href="/dashboard/catalogue/new" passHref>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Model
          </button>
        </Link>
      </div>

      {isLoading && <p className="text-center text-muted-foreground">Loading models...</p>}
      {error && <p className="text-center text-red-500">Error loading models: {error.message}</p>}
      
      {!isLoading && !error && models && models.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No models found. Get started by creating a new model.</p>
      )}

      {!isLoading && !error && models && models.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {models.map((model) => (
            <div key={model.id} className="bg-white rounded-lg border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="relative w-full h-48 bg-gray-200">
                {model.imageUrl ? (
                  <Image src={model.imageUrl} alt={model.name} layout="fill" objectFit="cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Eye className="w-12 h-12" /> {/* Placeholder Icon */}
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold mb-1 truncate" title={model.name}>{model.name}</h3> {/* Changed model.modelType to model.name */}
                <p className="text-sm text-muted-foreground mb-3 flex-grow line-clamp-3">
                  {model.description || 'No description available.'}
                </p>
                <Link href={`/dashboard/catalogue/${model.id}/edit`} passHref>
                  <button className="mt-auto w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Model
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div> 
  );
}
