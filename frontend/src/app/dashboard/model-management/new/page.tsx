"use client";

import React from 'react';
import ModelBuilderForm from '@/components/dashboard/model-management/ModelBuilderForm'; // Uncommented
// import { DashboardShell } from '@/components/dashboard/dashboard-shell';
// import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function CreateModelPage() {
  return (
    <div className="flex flex-col gap-4"> {/* Replaced DashboardShell */}
      {/* Replaced DashboardHeader */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/model-management" passHref>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 hover:bg-accent hover:text-accent-foreground">
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Model</h1>
          <p className="text-muted-foreground">
            Define the details of your new furniture model.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {/* <p className="text-muted-foreground">
          Model builder form will be here. (ModelBuilderForm component to be implemented)
        </p> */}
        <ModelBuilderForm /> {/* Render the form */}
      </div>
    </div>
  );
}
