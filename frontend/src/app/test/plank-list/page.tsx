"use client";

import React from 'react';
import ModelPlankList from '@/components/dashboard/model-management/ModelPlankList';
import { EXTENDED_TEST_MODELS } from '@/components/dashboard/model-management/templates/extendedTestModels';

const DEFAULT_GLOBAL_CONSTANTS = {
  MATERIAL_THICKNESS: {
    expose: 18,  // External/exposed plank thickness
    inner: 18,   // Internal plank thickness
    back: 6      // Back panel thickness
  },
  EDGE_BANDING: {
    INNER_EDGEBANDING: 1,  // Internal edge banding thickness
    COLOR_EDGEBANDING: 2   // Exposed/color edge banding thickness
  }
} as const;

export default function TestPlankList() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Test Plank List Generation</h1>
      <div className="bg-white rounded-lg shadow">
        <ModelPlankList 
          models={EXTENDED_TEST_MODELS} 
          globalConstants={DEFAULT_GLOBAL_CONSTANTS} 
        />
      </div>
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Instructions</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Select from available models:
            <ul className="list-circle pl-5 mt-1">
              <li>Simple Box Model - Basic left/right panels</li>
              <li>Complex Box Model - Full box with back panel</li>
              <li>Corner Unit Model - Angled corner panels</li>
              <li>Tall Unit Model - Multiple shelves and drawers</li>
            </ul>
          </li>
          <li>Enter a 2-digit box number (e.g., "01")</li>
          <li>Set runtime inputs:
            <ul className="list-circle pl-5 mt-1">
              <li>Box dimensions (depth, height, width)</li>
              <li>Set adjacency types to "Expose" or "Wall"</li>
              <li>Set skirting height (e.g., 100mm)</li>
              <li>Material codes (e.g., "OUT001", "IN001")</li>
              <li>Model-specific inputs (e.g., corner angle, drawer count)</li>
            </ul>
          </li>
          <li>Click "Generate Plank List" to see the results</li>
          <li>Use "Download CSV" to verify the output format</li>
        </ul>
        <p className="mt-4 text-sm text-gray-600">
          Note: Different models require different input parameters. The form will update to show the relevant inputs for each model.
        </p>
      </div>
    </div>
  );
}
