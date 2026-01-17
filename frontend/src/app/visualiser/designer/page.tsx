"use client";

import dynamic from "next/dynamic";

const CabinetDesignerV2 = dynamic(
  () => import("@/components/visualiser/designer/CabinetDesignerV2"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-300 to-slate-400">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading 3D Cabinet Designer...</p>
        </div>
      </div>
    )
  }
);

export default function DesignerPage() {
  return <CabinetDesignerV2 />;
}
