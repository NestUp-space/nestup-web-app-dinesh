"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/stores/visualiserStore";

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

export default function VisualiserDashboard() {
  const { spreadsheetId, spreadsheetName, isConnected, setSpreadsheet, disconnect } = useAppStore();
  const [inputUrl, setInputUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractSpreadsheetId = (url: string): string | null => {
    // Handle both full URL and just the ID
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];
    // Check if it's already just an ID
    if (/^[a-zA-Z0-9-_]+$/.test(url.trim())) return url.trim();
    return null;
  };

  const handleConnect = async () => {
    const id = extractSpreadsheetId(inputUrl);
    if (!id) {
      setError("Invalid Google Sheets URL or ID");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // For now, we'll simulate connection - in production this would call the API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSpreadsheet(id, `Project Spreadsheet`);
      setInputUrl("");
    } catch (err) {
      setError("Failed to connect to spreadsheet");
    } finally {
      setIsConnecting(false);
    }
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
              <span className="text-slate-400">Connected to: </span>
              <span className="text-emerald-400 font-medium">{spreadsheetName}</span>
            </div>
            <button
              onClick={disconnect}
              className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Connection Panel */}
        {!isConnected && (
          <div className="mb-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-2">Connect to Google Sheets</h2>
            <p className="text-slate-400 text-sm mb-4">
              Enter your Google Sheets URL or ID to start visualizing your cabinet data
            </p>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/... or spreadsheet ID"
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
              <button
                onClick={handleConnect}
                disabled={!inputUrl.trim() || isConnecting}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  "Connect"
                )}
              </button>
            </div>
            
            {error && (
              <p className="mt-3 text-red-400 text-sm">{error}</p>
            )}

            <div className="mt-4 p-4 bg-slate-900/50 rounded-xl">
              <p className="text-xs text-slate-500 mb-2">Demo Mode Available</p>
              <button
                onClick={() => setSpreadsheet("demo", "Demo Project")}
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
        {isConnected && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <p className="text-2xl font-bold text-blue-400">--</p>
              <p className="text-sm text-slate-400">Total Walls</p>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <p className="text-2xl font-bold text-emerald-400">--</p>
              <p className="text-sm text-slate-400">Total Boxes</p>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <p className="text-2xl font-bold text-purple-400">--</p>
              <p className="text-sm text-slate-400">Total Planks</p>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <p className="text-2xl font-bold text-amber-400">--</p>
              <p className="text-sm text-slate-400">Sheets Used</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
