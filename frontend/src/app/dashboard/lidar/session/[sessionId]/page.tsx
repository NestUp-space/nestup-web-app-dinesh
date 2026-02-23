"use client";

/**
 * LiDAR Session Detail Page
 * View and interact with a specific LiDAR scanning session
 */

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  useLidarSession,
  useSessionLayout,
  useLidarSessionMutations,
} from "@/hooks/lidar/useLidarSession";

const Room3DViewer = dynamic(
  () => import("@/components/lidar/Room3DViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px] bg-muted rounded-lg">
        <p className="text-muted-foreground">Loading 3D viewer...</p>
      </div>
    ),
  }
);

const FloorPlanViewer = dynamic(
  () => import("@/components/lidar/FloorPlanViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px] bg-muted rounded-lg">
        <p className="text-muted-foreground">Loading floor plan...</p>
      </div>
    ),
  }
);
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LidarSessionStatus } from "@/types/lidar";

// Status color mapping
const statusColors: Record<LidarSessionStatus, string> = {
  CREATED: "bg-gray-100 text-gray-800",
  UPLOADING: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  PROCESSED: "bg-green-100 text-green-800",
  DESIGNING: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
};

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const { session, isLoading, error, refresh } = useLidarSession(sessionId);
  const { layout, isLoading: layoutLoading } = useSessionLayout(sessionId);
  const { triggerProcessing, isLoading: isProcessing } = useLidarSessionMutations();

  const [activeTab, setActiveTab] = useState<"3d" | "2d" | "modules" | "bom">("3d");
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const handleTriggerProcessing = useCallback(async () => {
    try {
      await triggerProcessing(sessionId);
      refresh();
    } catch (err) {
      console.error("Failed to trigger processing:", err);
    }
  }, [sessionId, triggerProcessing, refresh]);

  const handleWallSelect = useCallback((wallId: string | null) => {
    setSelectedWallId(wallId);
    setSelectedModuleId(null);
  }, []);

  const handleModuleSelect = useCallback((moduleId: string | null) => {
    setSelectedModuleId(moduleId);
    setSelectedWallId(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Session Not Found
          </h2>
          <p className="text-gray-500 mb-4">
            {error?.message || "The session you're looking for doesn't exist."}
          </p>
          <Button onClick={() => router.push("/dashboard/lidar")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const canProcess = session.status === "CREATED" && session.scanData?.uploadStatus === "UPLOADED";
  const hasLayout = session.status === "PROCESSED" || session.status === "DESIGNING" || session.status === "COMPLETED";

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/lidar")}
          >
            ← Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {session.name || `Session ${session.id.slice(0, 8)}...`}
            </h1>
            <p className="text-sm text-gray-500">
              Created {new Date(session.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={statusColors[session.status]}>
            {session.status.toLowerCase()}
          </Badge>
          {canProcess && (
            <Button
              onClick={handleTriggerProcessing}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Process Scan"}
            </Button>
          )}
          {session.status === "PROCESSING" && (
            <Button variant="outline" onClick={refresh}>
              Refresh Status
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Session States */}
        {session.status === "CREATED" && !session.scanData?.fileUrl && (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>📤 Upload Scan Data</CardTitle>
                <CardDescription>
                  Upload your LiDAR scan data to start processing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Supported formats: CSV (2D scans), PLY, PCD (3D scans)
                </p>
                <Button className="w-full">
                  Select Scan File
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {session.status === "PROCESSING" && (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Processing
                </CardTitle>
                <CardDescription>
                  Your scan data is being processed. This may take a few minutes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-blue-500 h-2 rounded-full animate-pulse"
                    style={{ width: "60%" }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  Detecting walls and generating floor plan...
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {session.status === "FAILED" && (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <Card className="max-w-md border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700">❌ Processing Failed</CardTitle>
                <CardDescription>
                  {session.processedData?.errorMessage ||
                    "An error occurred during processing."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleTriggerProcessing} className="w-full">
                  Retry Processing
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Layout View */}
        {hasLayout && (
          <div className="flex-1 flex flex-col">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
              className="flex-1 flex flex-col"
            >
              <div className="border-b bg-white px-4">
                <TabsList className="h-12">
                  <TabsTrigger value="3d" className="px-4">
                    🏠 3D View
                  </TabsTrigger>
                  <TabsTrigger value="2d" className="px-4">
                    📐 Floor Plan
                  </TabsTrigger>
                  <TabsTrigger value="modules" className="px-4">
                    📦 Modules ({session.moduleCount || 0})
                  </TabsTrigger>
                  <TabsTrigger value="bom" className="px-4">
                    📋 BOM
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="3d" className="flex-1 m-0">
                {layoutLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : layout ? (
                  <Room3DViewer
                    walls={layout.walls}
                    placedModules={[]}
                    roomDimensions={layout.roomDimensions}
                    floorPlan={layout.floorPlan}
                    onWallSelect={handleWallSelect}
                    onModuleSelect={handleModuleSelect}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No layout data available</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="2d" className="flex-1 m-0">
                {layoutLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : layout ? (
                  <FloorPlanViewer
                    floorPlan={layout.floorPlan}
                    walls={layout.walls}
                    placedModules={[]}
                    roomDimensions={layout.roomDimensions}
                    selectedWallId={selectedWallId}
                    selectedModuleId={selectedModuleId}
                    onWallSelect={handleWallSelect}
                    onModuleSelect={handleModuleSelect}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No floor plan available</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="modules" className="flex-1 m-0 overflow-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Placed Modules</h2>
                    <Button>+ Add Module</Button>
                  </div>

                  {session.moduleCount === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="text-4xl mb-4">📦</div>
                        <h3 className="text-lg font-medium mb-2">
                          No modules placed yet
                        </h3>
                        <p className="text-gray-500 text-center mb-4">
                          Select a module from the library and place it against
                          a wall to start designing.
                        </p>
                        <Button>Browse Module Library</Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {/* Module list would go here */}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="bom" className="flex-1 m-0 overflow-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Bill of Materials</h2>
                    <div className="flex gap-2">
                      <Button variant="outline">Export PDF</Button>
                      <Button variant="outline">Export Excel</Button>
                      <Button>Generate BOM</Button>
                    </div>
                  </div>

                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="text-4xl mb-4">📋</div>
                      <h3 className="text-lg font-medium mb-2">
                        BOM not generated
                      </h3>
                      <p className="text-gray-500 text-center mb-4">
                        Place modules and click &quot;Generate BOM&quot; to create the
                        bill of materials.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
