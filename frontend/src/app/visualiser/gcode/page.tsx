"use client";

import dynamic from "next/dynamic";

const GCodeGenerator = dynamic(
  () => import("@/components/visualiser/GCodeGenerator"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading G-Code Generator...</p>
        </div>
      </div>
    )
  }
);

export default function GCodePage() {
  return <GCodeGenerator />;
}
