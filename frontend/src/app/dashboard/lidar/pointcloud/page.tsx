"use client";

/**
 * Point Cloud Viewer Page
 * Upload and visualize raw LiDAR point cloud data
 */

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import PointCloudViewer, { ScanPoint } from "@/components/lidar/PointCloudViewer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Sample data URL (for development)
const SAMPLE_DATA_URL = "/api/lidar/sample-pointcloud";

export default function PointCloudPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [points, setPoints] = useState<ScanPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalPoints: number;
    scans: number;
    minRange: number;
    maxRange: number;
  } | null>(null);

  // Parse CSV content
  const parseCSV = useCallback((content: string): ScanPoint[] => {
    const lines = content.trim().split("\n");
    const parsedPoints: ScanPoint[] = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      if (parts.length < 7) continue;

      parsedPoints.push({
        scanSeq: parseInt(parts[0], 10),
        pointIdx: parseInt(parts[1], 10),
        angleRad: parseFloat(parts[2]),
        rangeM: parseFloat(parts[3]),
        intensity: parseInt(parts[4], 10),
        x: parseFloat(parts[5]),
        y: parseFloat(parts[6]),
        z: parts[7] ? parseFloat(parts[7]) : 0,
      });

      // Update progress every 10000 points
      if (i % 10000 === 0) {
        setLoadProgress(Math.round((i / lines.length) * 100));
      }
    }

    return parsedPoints;
  }, []);

  // Calculate statistics
  const calculateStats = useCallback((parsedPoints: ScanPoint[]) => {
    const scans = new Set(parsedPoints.map((p) => p.scanSeq));
    let minRange = Infinity;
    let maxRange = -Infinity;

    for (const p of parsedPoints) {
      minRange = Math.min(minRange, p.rangeM);
      maxRange = Math.max(maxRange, p.rangeM);
    }

    return {
      totalPoints: parsedPoints.length,
      scans: scans.size,
      minRange: Math.round(minRange * 1000) / 1000,
      maxRange: Math.round(maxRange * 1000) / 1000,
    };
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);
      setLoadProgress(0);
      setFileName(file.name);

      try {
        const text = await file.text();
        setLoadProgress(30);

        // Parse in chunks to avoid blocking UI
        const parsed = parseCSV(text);
        setLoadProgress(80);

        // Downsample if too many points for performance
        let displayPoints = parsed;
        if (parsed.length > 500000) {
          // Sample every Nth point
          const sampleRate = Math.ceil(parsed.length / 500000);
          displayPoints = parsed.filter((_, i) => i % sampleRate === 0);
          console.log(
            `Downsampled from ${parsed.length} to ${displayPoints.length} points`
          );
        }

        setPoints(displayPoints);
        setStats(calculateStats(parsed));
        setLoadProgress(100);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse file");
      } finally {
        setIsLoading(false);
      }
    },
    [parseCSV, calculateStats]
  );

  // Load sample data
  const loadSampleData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoadProgress(0);
    setFileName("point_clouds.csv (sample)");

    try {
      // Fetch from local file or API
      const response = await fetch("/Reference/point_clouds.csv");
      if (!response.ok) {
        throw new Error("Failed to load sample data");
      }

      setLoadProgress(20);
      const text = await response.text();
      setLoadProgress(40);

      const parsed = parseCSV(text);
      setLoadProgress(80);

      // Downsample for performance
      let displayPoints = parsed;
      if (parsed.length > 500000) {
        const sampleRate = Math.ceil(parsed.length / 500000);
        displayPoints = parsed.filter((_, i) => i % sampleRate === 0);
      }

      setPoints(displayPoints);
      setStats(calculateStats(parsed));
      setLoadProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sample data");
    } finally {
      setIsLoading(false);
    }
  }, [parseCSV, calculateStats]);

  // Reset view
  const handleReset = useCallback(() => {
    setPoints([]);
    setStats(null);
    setFileName(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between shrink-0">
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
              Point Cloud Viewer
            </h1>
            <p className="text-sm text-gray-500">
              {fileName || "Upload a CSV file to visualize LiDAR scan data"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {points.length > 0 && (
            <Button variant="outline" onClick={handleReset}>
              Clear
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            Upload CSV
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* No data state */}
        {points.length === 0 && !isLoading && (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ☁️ Point Cloud Viewer
                </CardTitle>
                <CardDescription>
                  Upload a CSV file containing LiDAR scan data to visualize it
                  in 3D.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">Expected CSV format:</p>
                  <code className="block bg-gray-100 p-2 rounded text-xs">
                    scan_seq,point_idx,angle_rad,range_m,intensity,x,y
                  </code>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📁 Select CSV File
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={loadSampleData}
                  >
                    📊 Load Sample Data
                  </Button>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Loading Point Cloud...</CardTitle>
                <CardDescription>
                  Parsing and preparing {fileName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={loadProgress} className="mb-2" />
                <p className="text-sm text-gray-500 text-center">
                  {loadProgress}% complete
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Point Cloud View */}
        {points.length > 0 && !isLoading && (
          <div className="flex-1 flex">
            {/* Viewer */}
            <div className="flex-1">
              <PointCloudViewer points={points} />
            </div>

            {/* Stats Sidebar */}
            {stats && (
              <div className="w-64 bg-white border-l p-4 overflow-y-auto">
                <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>

                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-700">
                      {stats.totalPoints.toLocaleString()}
                    </div>
                    <div className="text-xs text-blue-600">Total Points</div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-700">
                      {stats.scans}
                    </div>
                    <div className="text-xs text-purple-600">Scan Sequences</div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-lg font-bold text-green-700">
                      {stats.minRange}m - {stats.maxRange}m
                    </div>
                    <div className="text-xs text-green-600">Range</div>
                  </div>

                  {points.length !== stats.totalPoints && (
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-yellow-700">
                        Showing {points.length.toLocaleString()} points
                      </div>
                      <div className="text-xs text-yellow-600">
                        Downsampled for performance
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium text-gray-700 mb-2">Actions</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        // TODO: Create session and process
                        alert("Create session feature coming soon!");
                      }}
                    >
                      Create LiDAR Session
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        // TODO: Download processed data
                        alert("Export feature coming soon!");
                      }}
                    >
                      Export Points
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
