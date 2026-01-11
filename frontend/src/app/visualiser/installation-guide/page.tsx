"use client";

import dynamic from "next/dynamic";

// Dynamically import the 3D viewer to avoid SSR issues with Three.js
const InstallationGuideViewer = dynamic(
  () => import("@/components/visualiser/InstallationGuideViewer"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading 3D Viewer...</p>
        </div>
      </div>
    )
  }
);

export default function InstallationGuidePage() {
  return <InstallationGuideViewer />;
}
