'use client';

import React from 'react';
import Link from 'next/link';
import { useDesignerStore, useDesignSummary } from '@/store/designerStore';

export default function VisualiserPage() {
  const { projectName, lastSaved, clearDesign } = useDesignerStore();
  const summary = useDesignSummary();

  const handleNewProject = () => {
    if (summary.totalWalls > 0) {
      const confirmed = window.confirm(
        'This will clear your current design. Are you sure?'
      );
      if (!confirmed) return;
    }
    clearDesign();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">NestUp Visualiser</h1>
                <p className="text-sm text-gray-500">3D Cabinet Designer</p>
              </div>
            </div>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-orange-500 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Wall measurement CTA: only shown when NEXT_PUBLIC_SHOW_WALL_MEASURE=true (e.g. localhost or trial). Hidden on main site by default. */}
        {process.env.NEXT_PUBLIC_SHOW_WALL_MEASURE === 'true' && (
          <div className="mb-8 rounded-xl bg-orange-50 border-2 border-orange-300 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-orange-800 mb-2">Measure your wall, then design</h2>
            <p className="text-sm text-orange-700/90 mb-4">
              Use the NestUp wall measurement app to capture your wall and get dimensions. On the results page, click &quot;Continue to design&quot; — the 3D designer will open with a wall already sized to your measurements.
            </p>
            <a
              href={process.env.NEXT_PUBLIC_ARUCO_APP_URL || '/measurements'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg font-semibold text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              Open wall measurement app
            </a>
          </div>
        )}

        {/* Current Project Card — resume existing design (not the same as ArUco "Continue to design") */}
        {summary.totalWalls > 0 && (
          <div className="mb-8 rounded-xl bg-orange-50 border border-orange-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-orange-600">
                  Current Project
                </h2>
                <p className="text-xl font-bold mt-1 text-gray-900">{projectName}</p>
                {lastSaved && (
                  <p className="text-sm text-gray-500 mt-1">
                    Last saved: {new Date(lastSaved).toLocaleString()}
                  </p>
                )}
                <div className="flex gap-6 mt-4 text-sm">
                  <div>
                    <span className="text-gray-500">Walls:</span>{' '}
                    <span className="font-semibold text-gray-900">{summary.totalWalls}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Boxes:</span>{' '}
                    <span className="font-semibold text-gray-900">{summary.totalBoxes}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Planks:</span>{' '}
                    <span className="font-semibold text-gray-900">{summary.totalPlanks}</span>
                  </div>
                </div>
              </div>
              <Link
                href="/visualiser/designer"
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg font-semibold text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25"
              >
                Open designer
              </Link>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New Design Card */}
          <Link
            href="/visualiser/designer"
            onClick={handleNewProject}
            className="group rounded-xl bg-white border border-gray-200 p-6 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100 transition-all"
          >
            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
              <svg
                className="h-6 w-6 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">New Design</h3>
            <p className="text-sm text-gray-500">
              Start a fresh 3D cabinet design from scratch
            </p>
          </Link>

          {/* Open Designer Card */}
          <Link
            href="/visualiser/designer"
            className="group rounded-xl bg-white border border-gray-200 p-6 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100 transition-all"
          >
            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
              <svg
                className="h-6 w-6 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">3D Designer</h3>
            <p className="text-sm text-gray-500">
              Open the full 3D cabinet designer with tools and materials
            </p>
          </Link>

          {/* Generate Files Card */}
          <Link
            href="/visualiser/generate"
            className={`group rounded-xl bg-white border border-gray-200 p-6 transition-all ${
              summary.totalPlanks > 0
                ? 'hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100'
                : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={(e) => {
              if (summary.totalPlanks === 0) {
                e.preventDefault();
                alert('Please create a design first before generating files.');
              }
            }}
          >
            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
              <svg
                className="h-6 w-6 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Generate Files</h3>
            <p className="text-sm text-gray-500">
              Generate cutlist, material estimates, and reports
            </p>
          </Link>

          {/* Reports Card */}
          <Link
            href="/visualiser/reports/cutlist"
            className={`group rounded-xl bg-white border border-gray-200 p-6 transition-all ${
              summary.totalPlanks > 0
                ? 'hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100'
                : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={(e) => {
              if (summary.totalPlanks === 0) {
                e.preventDefault();
              }
            }}
          >
            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
              <svg
                className="h-6 w-6 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">View Reports</h3>
            <p className="text-sm text-gray-500">
              View cutlist visualization and material reports
            </p>
          </Link>

          {/* Import Design Card */}
          <label className="group rounded-xl bg-white border border-gray-200 p-6 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100 transition-all cursor-pointer">
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const data = JSON.parse(event.target?.result as string);
                      if (data.walls) {
                        useDesignerStore.getState().loadDesign(data);
                        alert('Design imported successfully!');
                      } else {
                        alert('Invalid design file format.');
                      }
                    } catch {
                      alert('Error reading file.');
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />
            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
              <svg
                className="h-6 w-6 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Import Design</h3>
            <p className="text-sm text-gray-500">
              Load a previously saved design file (.json)
            </p>
          </label>

          {/* Export Design Card */}
          <button
            onClick={() => {
              if (summary.totalWalls === 0) {
                alert('No design to export.');
                return;
              }
              const data = useDesignerStore.getState().getDesignData();
              const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${projectName.replace(/\s+/g, '_')}_design.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className={`group rounded-xl bg-white border border-gray-200 p-6 text-left transition-all ${
              summary.totalWalls > 0
                ? 'hover:border-orange-400 hover:shadow-lg hover:shadow-orange-100'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
              <svg
                className="h-6 w-6 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Export Design</h3>
            <p className="text-sm text-gray-500">
              Save your current design as a JSON file
            </p>
          </button>
        </div>

        {/* Quick Info */}
        <div className="mt-12 rounded-xl bg-orange-50 border border-orange-100 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">How it works</h3>
          <div className="grid md:grid-cols-4 gap-6 text-sm">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Create Walls</p>
                <p className="text-gray-500">
                  Add walls and define room layout
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Place Cabinets</p>
                <p className="text-gray-500">
                  Add boxes from catalog to walls
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Customize</p>
                <p className="text-gray-500">
                  Adjust dimensions and materials
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">
                4
              </div>
              <div>
                <p className="font-medium text-gray-900">Generate Files</p>
                <p className="text-gray-500">
                  Create cutlist and reports
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
