"use client";

import React from 'react';
import { DashboardBreadcrumb } from '@/components/dashboard/dashboardBreadcrumb'; // Import DashboardBreadcrumb

export default function DashboardOverviewPage() {
  return (
    <div>
      <DashboardBreadcrumb /> {/* Add breadcrumb here */}
      <h1 className="text-2xl font-semibold my-4">Dashboard Overview</h1> {/* Added my-4 for spacing */}
      <p>Welcome to your dashboard. This page will provide an overview of your activities and key metrics.</p>
      {/* Placeholder content - to be expanded later */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Active Projects</h2>
          <p className="text-gray-600 text-3xl font-bold">0</p> {/* Placeholder value */}
        </div>
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Tasks Due Today</h2>
          <p className="text-gray-600 text-3xl font-bold">0</p> {/* Placeholder value */}
        </div>
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Recent Notifications</h2>
          <p className="text-gray-600">No new notifications.</p> {/* Placeholder value */}
        </div>
      </div>
    </div>
  );
}
