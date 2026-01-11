"use client";

import dynamic from "next/dynamic";

const CutlistVisualization = dynamic(
  () => import("@/components/visualiser/CutlistVisualization"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading Cutlist Viewer...</p>
        </div>
      </div>
    )
  }
);

export default function CutlistPage() {
  return <CutlistVisualization />;
}
