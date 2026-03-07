"use client";

/**
 * LiDAR Dashboard Page
 * Main entry point for LiDAR scanning and room design features
 */

import { useRouter } from "next/navigation";
import SessionDashboard from "@/components/lidar/SessionDashboard";
import { Button } from "@/components/ui/button";

export default function LidarDashboardPage() {
  const router = useRouter();

  const handleSessionSelect = (sessionId: string) => {
    router.push(`/dashboard/lidar/session/${sessionId}`);
  };

  return (
    <div className="h-full">
      {/* Quick Action Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 mb-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">LiDAR Tools</h2>
            <p className="text-blue-100 text-sm">Scan, visualize, and design modular interiors</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push("/dashboard/lidar/pointcloud")}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              ☁️ Point Cloud Viewer
            </Button>
          </div>
        </div>
      </div>
      
      <SessionDashboard onSessionSelect={handleSessionSelect} />
    </div>
  );
}
