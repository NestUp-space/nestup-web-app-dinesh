"use client";

import Link from "next/link";

interface ReportCard {
  title: string;
  description: string;
  icon: string;
  href: string;
}

const reports: ReportCard[] = [
  {
    title: "Material Estimate",
    description: "Material summary by type and thickness with edge binding calculations",
    icon: "📦",
    href: "/visualiser/reports/material-estimate",
  },
  {
    title: "Invoice",
    description: "Generate customer invoices from project data",
    icon: "🧾",
    href: "/visualiser/reports/invoice",
  },
  {
    title: "Input QA Sheet",
    description: "Quality assurance checklist for input verification",
    icon: "✅",
    href: "/visualiser/reports/qa-input",
  },
  {
    title: "Output QA Sheet",
    description: "Quality assurance checklist for output verification",
    icon: "☑️",
    href: "/visualiser/reports/qa-output",
  },
  {
    title: "Pressing List",
    description: "Manufacturing pressing list organized by sheet",
    icon: "🔨",
    href: "/visualiser/reports/pressing-list",
  },
  {
    title: "SFT Results",
    description: "Square footage calculations for all boxes",
    icon: "📏",
    href: "/visualiser/reports/sft-results",
  },
];

export default function ReportsPage() {
  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 flex items-center px-6 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold">Reports</h1>
          <p className="text-xs text-slate-400">Generate manufacturing reports and documentation</p>
        </div>
      </header>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <Link
              key={report.href}
              href={report.href}
              className="group p-6 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 hover:border-amber-500/30 rounded-xl transition-all duration-300"
            >
              <div className="text-3xl mb-3">{report.icon}</div>
              <h3 className="text-base font-semibold mb-1 group-hover:text-amber-400 transition-colors">
                {report.title}
              </h3>
              <p className="text-sm text-slate-400">{report.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
