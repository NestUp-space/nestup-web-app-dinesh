'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

/** NestUp brand colors for reports (matches tailwind nestup.* and orange-500) */
const THEME = {
  primary: '#F97316',       // orange-500 / nestup.accent
  primaryDark: '#EA580C',    // orange-600
  charcoal: '#111827',       // nestup.charcoal / gray-900
  charcoalLight: '#6B7280',  // gray-500
  white: '#FFFFFF',
  warm: '#FFF7ED',           // nestup.beige
  border: '#E5E7EB',        // gray-200
};

interface ReportLayoutProps {
  title: string;
  subtitle?: string;
  projectName?: string;
  children: React.ReactNode;
  /** Show back link and download/print buttons in the on-screen header (hidden when printing) */
  showActions?: boolean;
  /** Callback when user clicks Download (e.g. trigger print or generate PDF) */
  onDownload?: () => void;
  downloadLabel?: string;
}

/**
 * Wraps report content with NestUp logo at top and NestUp color theme.
 * Used for all downloadables except G-code. Print styles hide nav/buttons and show only branded content.
 */
export function ReportLayout({
  title,
  subtitle,
  projectName,
  children,
  showActions = true,
  onDownload,
  downloadLabel = 'Download / Print',
}: ReportLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* NestUp branded header - always visible on screen and in print */}
      <header
        className="border-b-2 border-orange-500 bg-white print:border-b-2 print:border-orange-500"
        style={{ borderColor: THEME.primary }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Logo at top - NestUp branding */}
              <div className="flex-shrink-0">
                <Image
                  src="/img/NestupLogoText.svg"
                  alt="NestUp"
                  width={140}
                  height={40}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </div>
              <div className="border-l border-gray-200 pl-4">
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-500">{subtitle}</p>
                )}
                {projectName && (
                  <p className="text-sm font-medium text-orange-600 mt-0.5">{projectName}</p>
                )}
              </div>
            </div>
            {/* Actions - hidden in print */}
            {showActions && (
              <div className="flex items-center gap-3 print:hidden">
                <Link
                  href="/visualiser/generate"
                  className="text-sm text-gray-500 hover:text-orange-600 transition-colors flex items-center gap-1"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Link>
                <button
                  type="button"
                  onClick={onDownload ?? (() => window.print())}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-colors"
                  style={{ backgroundColor: THEME.primary }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = THEME.primaryDark;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = THEME.primary;
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {downloadLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {children}
      </main>

      {/* Print styles: hide back button and extra UI, show only report */}
      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}

export default ReportLayout;
