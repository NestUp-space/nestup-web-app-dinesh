"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CutListsPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <div className="mb-6">
        <Link href="/dashboard/bimProcess" legacyBehavior>
          <a className="inline-flex items-center text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to BIM Process Tools
          </a>
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-2 text-foreground">Cut List Management</h1>
      <p className="text-muted-foreground mb-8">
        This page will display generated cut lists, allow for new generations, and show sheet-wise grouping.
      </p>
      {/* Placeholder for actual content */}
      <div className="p-6 bg-card border border-border rounded-lg shadow">
        <p className="text-muted-foreground">Cut list content will appear here.</p>
      </div>
    </div>
  );
}
