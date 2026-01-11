"use client";

import React, { useState, useCallback } from "react";
import { useGCodeStore, useAppStore } from "@/store/visualiserStore";
import {
  generateGCodeForProject,
  generateGCodeZip,
  DEFAULT_CONFIG,
  type ProjectGCodeResult,
} from "@/lib/visualiser/gcodeGenerator";
import type { GCodePlank, GCodeConfig } from "@/types/visualiser";

// Demo data
const DEMO_PLANKS: Record<string, GCodePlank[]> = {
  "Sheet_1": [
    {
      id: "P001",
      name: "Left Side",
      material: "White MDF",
      thickness: 18,
      sheet: "Sheet_1",
      x: 10,
      y: 10,
      placedWidth: 720,
      placedHeight: 560,
      rotated: false,
      features: {
        screws: [
          { x: 50, y: 50, z: 12, diameter: 4 },
          { x: 670, y: 50, z: 12, diameter: 4 },
          { x: 50, y: 510, z: 12, diameter: 4 },
          { x: 670, y: 510, z: 12, diameter: 4 },
        ],
        vb_main: [
          { x: 100, y: 280, z: 13, diameter: 20 },
          { x: 620, y: 280, z: 13, diameter: 20 },
        ],
      },
    },
    {
      id: "P002",
      name: "Right Side",
      material: "White MDF",
      thickness: 18,
      sheet: "Sheet_1",
      x: 740,
      y: 10,
      placedWidth: 720,
      placedHeight: 560,
      rotated: false,
      features: {
        screws: [
          { x: 50, y: 50, z: 12, diameter: 4 },
          { x: 670, y: 50, z: 12, diameter: 4 },
        ],
        hinges: [
          { x: 100, y: 100, z: 12, diameter: 35 },
          { x: 620, y: 100, z: 12, diameter: 35 },
        ],
      },
    },
    {
      id: "P003",
      name: "Bottom Panel",
      material: "White MDF",
      thickness: 18,
      sheet: "Sheet_1",
      x: 10,
      y: 580,
      placedWidth: 564,
      placedHeight: 560,
      rotated: false,
      features: {
        slots: [
          { x: 10, y: 275, length: 544, width: 10, depth: 8, type: "groove" },
        ],
      },
    },
  ],
  "Sheet_2": [
    {
      id: "P004",
      name: "Back Panel",
      material: "White MDF",
      thickness: 8,
      sheet: "Sheet_2",
      x: 10,
      y: 10,
      placedWidth: 684,
      placedHeight: 564,
      rotated: false,
      features: {},
    },
  ],
};

export default function GCodeGenerator() {
  const { results, isGenerating, progress, setResults, setIsGenerating, setProgress } = useGCodeStore();
  const { spreadsheetName } = useAppStore();

  const [config, setConfig] = useState<GCodeConfig>(DEFAULT_CONFIG);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev: number) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result = generateGCodeForProject(DEMO_PLANKS, { config });
      setResults(result.files);
      setProgress(100);
    } catch (error) {
      console.error("G-Code generation failed:", error);
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  }, [config, setIsGenerating, setProgress, setResults]);

  const handleDownloadZip = useCallback(async () => {
    if (results.length === 0) return;

    const projectResult: ProjectGCodeResult = {
      files: results,
      totalFiles: results.length,
      totalPlanks: results.reduce((sum, r) => sum + r.plankCount, 0),
      byMaterial: {},
    };

    const blob = await generateGCodeZip(projectResult, spreadsheetName || "Nestup_Project");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${spreadsheetName || "Nestup_Project"}_GCode.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, spreadsheetName]);

  const handlePreview = useCallback((content: string) => {
    setPreviewContent(content);
  }, []);

  const totalPlanks = Object.values(DEMO_PLANKS).flat().length;
  const totalSheets = Object.keys(DEMO_PLANKS).length;

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">⚙️ G-Code Generator</h1>
            <p className="text-sm text-emerald-100">Generate CNC machine code for manufacturing</p>
          </div>
          
          <div className="flex gap-8 text-sm">
            <div className="text-center">
              <span className="text-2xl font-bold block">{totalPlanks}</span>
              <span className="text-emerald-200">Planks</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold block">{totalSheets}</span>
              <span className="text-emerald-200">Sheets</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold block">{results.length}</span>
              <span className="text-emerald-200">Files</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Configuration Sidebar */}
        <aside className="w-80 bg-slate-800 border-r border-slate-700 p-5 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Machine Settings</h2>
          
          {/* Config Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Safe Z Height (mm)</label>
              <input
                type="number"
                value={config.Z_SAFE}
                onChange={(e) => setConfig({ ...config, Z_SAFE: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">Spindle Speed (RPM)</label>
              <input
                type="number"
                value={config.SPINDLE_SPEED}
                onChange={(e) => setConfig({ ...config, SPINDLE_SPEED: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">Cutting Feed Rate (mm/min)</label>
              <input
                type="number"
                value={config.CUTTING_FEED_RATE}
                onChange={(e) => setConfig({ ...config, CUTTING_FEED_RATE: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">Plunge Feed Rate (mm/min)</label>
              <input
                type="number"
                value={config.PLUNGE_FEED_RATE}
                onChange={(e) => setConfig({ ...config, PLUNGE_FEED_RATE: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Tool Legend */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Tool Configuration</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg">
                <span className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold">T1</span>
                <div>
                  <div className="font-medium">6mm End Mill</div>
                  <div className="text-xs text-slate-500">Profile cuts, slots</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg">
                <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">T2</span>
                <div>
                  <div className="font-medium">4mm Drill</div>
                  <div className="text-xs text-slate-500">Screw holes</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg">
                <span className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold">T5</span>
                <div>
                  <div className="font-medium">35mm Hinge Boring</div>
                  <div className="text-xs text-slate-500">Hinge cups</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg">
                <span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">T6</span>
                <div>
                  <div className="font-medium">20mm VB Bore</div>
                  <div className="text-xs text-slate-500">Connecting bolts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating... {progress}%
                </span>
              ) : (
                "⚡ Generate G-Code"
              )}
            </button>
            
            {results.length > 0 && (
              <button
                onClick={handleDownloadZip}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors"
              >
                📦 Download ZIP ({results.length} files)
              </button>
            )}
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="mt-4">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {results.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <div className="text-6xl mb-4">⚙️</div>
                <p className="text-lg">Click &quot;Generate G-Code&quot; to start</p>
                <p className="text-sm mt-2">G-Code files will be organized by material and thickness</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex">
              {/* File List */}
              <div className="w-80 border-r border-slate-700 overflow-y-auto">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="font-semibold">Generated Files ({results.length})</h3>
                </div>
                <div className="divide-y divide-slate-700">
                  {results.map((file, index) => (
                    <button
                      key={index}
                      onClick={() => handlePreview(file.content)}
                      className={`w-full p-4 text-left hover:bg-slate-800 transition-colors ${
                        previewContent === file.content ? "bg-slate-800 border-l-2 border-emerald-500" : ""
                      }`}
                    >
                      <div className="font-medium text-sm truncate">{file.fileName}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {file.materialFolder} • {file.thicknessFolder}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {file.plankCount} planks
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                  <h3 className="font-semibold">G-Code Preview</h3>
                  {previewContent && (
                    <button
                      onClick={() => {
                        const blob = new Blob([previewContent], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "preview.nc";
                        a.click();
                      }}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                    >
                      Download File
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {previewContent ? (
                    <pre className="text-xs font-mono text-emerald-400 bg-slate-950 p-4 rounded-lg whitespace-pre-wrap">
                      {previewContent}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-600">
                      Select a file to preview
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
