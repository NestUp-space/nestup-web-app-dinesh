"use client";

import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import ModelBuilderForm from '@/components/dashboard/model-management/ModelBuilderForm'; 
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardBreadcrumb } from '@/components/layout/dashboardBreadcrumb'; // Import DashboardBreadcrumb

export default function EditModelPage() {
  const params = useParams();
  const router = useRouter();
  const modelId = params.modelId as string;
  const [modelNameForBreadcrumb, setModelNameForBreadcrumb] = useState<string | null>(null);

  const handleModelDataFetched = (name: string) => {
    setModelNameForBreadcrumb(name);
  };

  const handleSaveSuccess = (updatedModelId: string) => {
    console.log(`Model ${updatedModelId} updated successfully, redirecting...`);
    router.push('/dashboard/catalogue');
  };

  const handleCancel = () => {
    router.push('/dashboard/catalogue');
  };

  
  const nameMap = {
    'catalogue': 'Catalogue',
    [modelId]: modelNameForBreadcrumb || modelId, // Use fetched name, fallback to ID
    'edit': 'Edit'
  };

  return (
    <div className="flex flex-col gap-4">
      <DashboardBreadcrumb nameMap={nameMap} />
      <div className="flex items-center gap-4 mt-2"> {/* Added mt-2 for spacing after breadcrumb */}
        <Link href="/dashboard/catalogue" passHref legacyBehavior>
          <a className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 hover:bg-accent hover:text-accent-foreground">
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </a>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Model: {modelNameForBreadcrumb || modelId}
          </h1>
          <p className="text-muted-foreground">
            Modify the details of your furniture model.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <ModelBuilderForm 
          modelId={modelId} 
          onSaveSuccess={handleSaveSuccess}
          onCancel={handleCancel}
          onDataFetched={handleModelDataFetched} // Pass the callback
        />
      </div>
    </div>
  );
}
