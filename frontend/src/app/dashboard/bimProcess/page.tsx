"use client";

import React from 'react';
import Link from 'next/link';
import { ListChecks, Scissors, Calculator, ChevronRight } from 'lucide-react';
import { DashboardBreadcrumb } from '@/components/layout/dashboardBreadcrumb'; // Import DashboardBreadcrumb

interface BimOptionCardProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const BimOptionCard: React.FC<BimOptionCardProps> = ({ href, icon: Icon, title, description }) => {
  return (
    <Link href={href} legacyBehavior>
      <a className="block p-6 bg-card border border-border rounded-lg shadow hover:shadow-md transition-shadow group">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Icon className="h-8 w-8 text-primary mr-4" />
            <h2 className="text-xl font-semibold text-card-foreground">{title}</h2>
          </div>
          <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <p className="mt-2 text-muted-foreground text-sm">{description}</p>
      </a>
    </Link>
  );
};

export default function BimProcessPage() {
  const bimOptions = [
    {
      href: '/dashboard/bimProcess/plank-lists',
      icon: ListChecks,
      title: 'Plank List Generator',
      description: 'Generate, view, and manage plank lists. Includes input parameters (JSON) and output (CSV).',
    },
    {
      href: '/dashboard/bimProcess/cut-lists',
      icon: Scissors,
      title: 'Cut List Generator',
      description: 'Create optimized cut lists from plank lists, featuring sheet-wise grouping and visualization.',
    },
    {
      href: '/dashboard/bimProcess/material-estimates',
      icon: Calculator,
      title: 'Material Estimator (BOM)',
      description: 'Generate and review detailed Bill of Materials for projects based on catalogue items.',
    },
    // Add more options here as needed
  ];

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <DashboardBreadcrumb /> {/* Add breadcrumb here */}
      <h1 className="text-3xl font-bold mt-4 mb-2 text-foreground">BIM Process Tools</h1> {/* Added mt-4 for spacing */}
      <p className="text-muted-foreground mb-8">
        Select a tool below to manage different aspects of the BIM workflow, from generation to estimation.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bimOptions.map((option) => (
          <BimOptionCard
            key={option.title}
            href={option.href}
            icon={option.icon}
            title={option.title}
            description={option.description}
          />
        ))}
      </div>

      {/* Placeholder pages for sub-routes - these should be actual page files */}
      {/* For example, create frontend/src/app/dashboard/bimProcess/plank-lists/page.tsx */}
      {/* You can add simple placeholder content to these new page files for now. */}
    </div>
  );
}
