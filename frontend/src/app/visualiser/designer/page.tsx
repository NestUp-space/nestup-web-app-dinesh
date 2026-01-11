"use client";

import dynamic from "next/dynamic";

const CabinetDesigner = dynamic(
  () => import("@/components/visualiser/CabinetDesigner"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading 3D Designer...</p>
        </div>
      </div>
    )
  }
);

export default function DesignerPage() {
  return <CabinetDesigner />;
}
