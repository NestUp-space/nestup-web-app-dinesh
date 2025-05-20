"use client";

import React from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Eye } from 'lucide-react'; 
import { DashboardBreadcrumb } from '@/components/dashboard/dashboardBreadcrumb'; // Import DashboardBreadcrumb
import useSWR from 'swr';
import { apiClient } from '@/lib/api/client';
import Image from 'next/image'; // For displaying images
import ModelCatalogueCard, { ListedModelData } from '@/components/dashboard/catalogue/ModelCatalogueCard'; // Import the new component and its type

const fetcher = (url: string) => apiClient.get(url); // Corrected: apiClient.get already returns the data

export default function ModelManagementPage() {
  const { data: models, error, isLoading } = useSWR<ListedModelData[]>('/v1/catalogue', fetcher); 

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6"> {/* Adjusted gap for breadcrumb */}
      <DashboardBreadcrumb /> {/* Add breadcrumb here */}
      <div className="flex items-center justify-between mt-2"> {/* Added mt-2 for spacing */}
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
            <ModelCatalogueCard key={model.id} model={model} />
          ))}
        </div>
      )}
    </div> 
  );
}
