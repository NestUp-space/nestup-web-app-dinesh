"use client";

import React from 'react';
import { DashboardBreadcrumb } from '@/components/dashboard/dashboardBreadcrumb'; // Import DashboardBreadcrumb

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      <DashboardBreadcrumb /> 
      <div>
        <h1 className="text-3xl font-semibold text-dark-text-bw">Dashboard Overview</h1>
        <p className="text-dark-text-bw/80 mt-1">Welcome to your dashboard. Overview of activities and key metrics.</p>
      </div>
      
      {/* Placeholder content - to be expanded later */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-lightest-bw border border-light-bw shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-dark-text-bw mb-2">Active Projects</h2>
          <p className="text-theme-color text-4xl font-bold">0</p> {/* Placeholder value */}
        </div>
        <div className="bg-lightest-bw border border-light-bw shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-dark-text-bw mb-2">Tasks Due Today</h2>
          <p className="text-theme-color text-4xl font-bold">0</p> {/* Placeholder value */}
        </div>
        <div className="bg-lightest-bw border border-light-bw shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-dark-text-bw mb-2">Recent Notifications</h2>
          <p className="text-dark-text-bw/80">No new notifications.</p> {/* Placeholder value */}
        </div>
      </div>
    </div>
  );
}
