"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useAppStore, useProcessedDataStore, useReportsStore } from "@/store/visualiserStore";
import { processRawData, type ProcessingOptions } from "@/lib/visualiser/rawDataProcessor";

interface FeatureCard {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

const features: FeatureCard[] = [
  {
    title: "3D Installation Guide",
    description: "Step-by-step cabinet assembly visualization with interactive 3D viewer",
    icon: "🔧",
    href: "/visualiser/installation-guide",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Cutlist Visualization",
    description: "View and export 2D sheet layouts with material optimization",
    icon: "📐",
    href: "/visualiser/cutlist",
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "3D Cabinet Designer",
    description: "Full 3D design tool for creating and editing cabinet layouts",
    icon: "🎨",
    href: "/visualiser/designer",
    color: "from-orange-500 to-red-500",
  },
  {
    title: "G-Code Generator",
    description: "Generate CNC machine code for automated manufacturing",
    icon: "⚙️",
    href: "/visualiser/gcode",
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Reports",
    description: "Material estimates, invoices, QA sheets, and pressing lists",
    icon: "📋",
    href: "/visualiser/reports",
    color: "from-amber-500 to-yellow-500",
  },
];

interface UploadedFile {
  name: string;
  data: string[][];
  headers: string[];
}

export default function VisualiserDashboard() {
  const { projectName, isConnected, setProject, disconnect, setCSVData } = useAppStore();
  const { 
    processedData, 
    isProcessing: isPipelineProcessing, 
    setProcessedData, 
    setIsProcessing: setPipelineProcessing,
    setProcessingProgress,
    processingProgress,
    reset: resetProcessedData 
  } = useProcessedDataStore();
  const { 
    setMaterialEstimates, 
    setQaInputData, 
    setQaOutputData, 
    setPressingList, 
    setInvoiceData,
    reset: resetReports 
  } = useReportsStore();
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (content: string): { headers: string[]; data: string[][] } => {
    const lines = content.trim().split(/\r?\n/);
    if (lines.length === 0) return { headers: [], data: [] };
    
    const parseRow = (row: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseRow(lines[0]);
    const data = lines.slice(1).map(parseRow).filter(row => row.some(cell => cell !== ""));
    
    return { headers, data };
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const newFiles: UploadedFile[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.name.endsWith('.csv')) {
          setError(`File "${file.name}" is not a CSV file`);
          continue;
        }
        
        const content = await file.text();
        const { headers, data } = parseCSV(content);
        
        newFiles.push({
          name: file.name.replace('.csv', ''),
          headers,
          data,
        });
      }
      
      if (newFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (err) {
      setError("Failed to process CSV file(s)");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleLoadData = async () => {
    if (uploadedFiles.length === 0) {
      setError("Please upload at least one CSV file");
      return;
    }
    
    setIsProcessing(true);
    setPipelineProcessing(true);
    setProcessingProgress(0);
    setError(null);
    
    try {
      // Store CSV data in app state
      const csvDataMap: Record<string, { headers: string[]; data: string[][] }> = {};
      uploadedFiles.forEach(file => {
        csvDataMap[file.name] = { headers: file.headers, data: file.data };
      });
      setCSVData(csvDataMap);
      setProcessingProgress(20);
      
      // Process the first file through the pipeline (main data file)
      const mainFile = uploadedFiles[0];
      const options: ProcessingOptions = {
        nestingAlgorithm: 'maxrects',
        customerName: customerName || mainFile.name,
        projectId: `PRJ-${Date.now()}`,
      };
      
      setProcessingProgress(40);
      
      // Process raw data through the complete pipeline
      const processed = processRawData(mainFile.headers, mainFile.data, options);
      
      setProcessingProgress(80);
      
      // Store processed data
      setProcessedData(processed);
      
      // Also populate reports store for backward compatibility
      setMaterialEstimates(processed.materialEstimate);
      setQaInputData(processed.inputQA);
      setQaOutputData(processed.outputQA);
      setPressingList(processed.pressingList);
      setInvoiceData(processed.invoice);
      
      setProcessingProgress(100);
      
      // Set project info
      setProject(
        processed.customerName,
        `${processed.summary.totalPlanks} planks • ${processed.summary.totalSheets} sheets • ${processed.summary.totalBoxes} boxes`
      );
      
    } catch (err) {
      console.error("Processing error:", err);
      setError(`Failed to process data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setPipelineProcessing(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold">Visualiser Dashboard</h1>
          <p className="text-xs text-slate-400">Cabinet Manufacturing Tools</p>
        </div>
        {isConnected && (
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-slate-400">Project: </span>
              <span className="text-emerald-400 font-medium">{projectName}</span>
            </div>
            <button
              onClick={() => {
                disconnect();
                resetProcessedData();
                resetReports();
                setUploadedFiles([]);
                setCustomerName("");
              }}
              className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Clear Data
            </button>
          </div>
        )}
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* CSV Upload Panel */}
        {!isConnected && (
          <div className="mb-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-2">📁 Import CSV Data</h2>
            <p className="text-slate-400 text-sm mb-4">
              Upload your CSV file(s) to start visualizing cabinet data. Multiple sheets supported.
            </p>
            
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive 
                  ? "border-orange-500 bg-orange-500/10" 
                  : "border-slate-600 hover:border-slate-500 hover:bg-slate-800/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              
              <div className="text-4xl mb-3">📄</div>
              <p className="text-slate-300 font-medium">
                {dragActive ? "Drop files here..." : "Drag & drop CSV files here"}
              </p>
              <p className="text-slate-500 text-sm mt-1">or click to browse</p>
              
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-900/80 rounded-xl flex items-center justify-center">
                  <svg className="animate-spin h-8 w-8 text-orange-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-4">
                <p className="text-sm font-medium text-slate-400">Uploaded Files ({uploadedFiles.length})</p>
                {uploadedFiles.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📊</span>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{file.name}.csv</p>
                        <p className="text-xs text-slate-500">{file.data.length} rows × {file.headers.length} columns</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="w-8 h-8 rounded-full bg-slate-800 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                {/* Customer Name Input */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Customer Name (Optional)</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name..."
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                
                {/* Processing Progress */}
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Processing data...</span>
                      <span className="text-orange-400">{processingProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-500">
                      {processingProgress < 20 && "Preparing data..."}
                      {processingProgress >= 20 && processingProgress < 40 && "Parsing CSV data..."}
                      {processingProgress >= 40 && processingProgress < 80 && "Running nesting algorithm..."}
                      {processingProgress >= 80 && processingProgress < 100 && "Generating reports..."}
                      {processingProgress === 100 && "Complete!"}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleLoadData}
                  disabled={isProcessing}
                  className="w-full mt-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>🚀 Process Data & Start</>
                  )}
                </button>
              </div>
            )}
            
            {error && (
              <p className="mt-3 text-red-400 text-sm">{error}</p>
            )}

            <div className="mt-4 p-4 bg-slate-900/50 rounded-xl">
              <p className="text-xs text-slate-500 mb-2">Demo Mode Available</p>
              <button
                onClick={() => setProject("Demo Project", "Demo data loaded")}
                className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
              >
                → Load demo data instead
              </button>
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group relative p-6 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 rounded-2xl transition-all duration-300"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`} />
              
              <div className="relative">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-orange-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
                
                <div className="mt-4 flex items-center text-sm text-slate-500 group-hover:text-orange-400 transition-colors">
                  <span>Open</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        {isConnected && processedData && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-slate-300">📊 Project Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <p className="text-2xl font-bold text-blue-400">{processedData.summary.totalWalls}</p>
                <p className="text-sm text-slate-400">Walls/Rooms</p>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <p className="text-2xl font-bold text-emerald-400">{processedData.summary.totalBoxes}</p>
                <p className="text-sm text-slate-400">Boxes</p>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <p className="text-2xl font-bold text-purple-400">{processedData.summary.totalPlanks}</p>
                <p className="text-sm text-slate-400">Planks</p>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <p className="text-2xl font-bold text-amber-400">{processedData.summary.totalSheets}</p>
                <p className="text-sm text-slate-400">Sheets Used</p>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <p className="text-2xl font-bold text-pink-400">{processedData.summary.totalEdgeBanding}m</p>
                <p className="text-sm text-slate-400">Edge Banding</p>
              </div>
            </div>
            
            {/* Materials breakdown */}
            <div className="mt-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <p className="text-sm text-slate-400 mb-2">Materials Used:</p>
              <div className="flex flex-wrap gap-2">
                {processedData.summary.materials.map((mat, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-700/50 rounded-full text-sm text-slate-300">
                    {mat}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Nesting stats */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20">
                <p className="text-sm text-emerald-400 mb-1">Average Utilization</p>
                <p className="text-2xl font-bold text-emerald-300">{processedData.nestStats.avgUtilization.toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
                <p className="text-sm text-blue-400 mb-1">Material Groups</p>
                <p className="text-2xl font-bold text-blue-300">{Object.keys(processedData.nestStats.byMaterial).length}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                <p className="text-sm text-purple-400 mb-1">Invoice Total</p>
                <p className="text-2xl font-bold text-purple-300">₹{processedData.invoice.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
