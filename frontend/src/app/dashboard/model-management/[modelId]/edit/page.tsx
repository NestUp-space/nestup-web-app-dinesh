"use client";

import React from 'react';
import ModelBuilderForm from '@/components/dashboard/model-management/ModelBuilderForm'; // Uncommented
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useParams } from 'next/navigation'; // To get modelId from URL

export default function EditModelPage() {
  const params = useParams();
  const modelId = params.modelId as string; // Or handle array/undefined if necessary

  // TODO: Fetch existing model data using modelId to pass to ModelBuilderForm

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/model-management" passHref>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 hover:bg-accent hover:text-accent-foreground">
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Model {modelId && `(${modelId})`}</h1>
          <p className="text-muted-foreground">
            Modify the details of your furniture model.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {/* <p className="text-muted-foreground">
          Model builder form for editing model ID: {modelId} will be here. 
          (ModelBuilderForm component to be implemented and pre-filled with model data)
        </p> */}
        <ModelBuilderForm modelId={modelId} /> {/* Render the form and pass modelId */}
      </div>
    </div>
  );
}
