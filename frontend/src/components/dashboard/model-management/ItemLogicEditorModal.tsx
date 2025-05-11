"use client";

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

interface ItemLogicEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScript?: string | null;
  onSave: (script: string) => void;
  // To display available variables to the user:
  availableRuntimeInputs: Array<{ inputName: string; displayLabel?: string | null; description?: string | null }>;
  // sampleRuntimeInputsJson is needed for testing, should be fetched from the main form's state
  sampleRuntimeInputsJsonString: string | null | undefined; 
  itemName: string; // To display in modal title
}

// Define the expected output structure for a plank for documentation purposes
const EXPECTED_PLANK_OUTPUT_DOC = `
Expected output object for a PLANK item:
{
  plankId: string;       // Unique ID for this plank (e.g., "B1:P1:L")
  name: string;          // User-friendly name (e.g., "Left Plank" - fixed within the specific plank's script)
  width: number;         // Calculated width
  height: number;        // Calculated height
  thickness: number;     // Derived from the chosen material definition's thickness (e.g., runtimeInputs.exposedMaterialDefinition.thickness)
  materialCode: string;  // Derived from the chosen material definition's code (e.g., runtimeInputs.exposedMaterialDefinition.code)
  grainDirection: 'Vertical' | 'Horizontal' | 'N/A'; // Derived from the chosen material definition's grainDirection

  // Processing details (added based on script logic):
  screwHoles: Array<{ x: number, y: number, z: number, type: string }>; // e.g., type: "T3"
  vbScrewHoles: Array<{ x: number, y: number, z: number, type: string }>; // e.g., type: "T6"
  backPanelGroove: { x1: number, y1: number, x2: number, y2: number, depth: number, type: string } | null; // e.g., type: "T7"-"T10"

  // Optional existing fields (not calculated by all plank scripts):
  // edgeBanding?: { top?: string; bottom?: string; left?: string; right?: string };
  // processingDetails?: string;
}
`;

export default function ItemLogicEditorModal({
  isOpen,
  onClose,
  initialScript,
  onSave,
  availableRuntimeInputs,
  sampleRuntimeInputsJsonString,
  itemName,
}: ItemLogicEditorModalProps) {
  const [scriptContent, setScriptContent] = useState(initialScript || '');
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setScriptContent(initialScript || '');
  }, [initialScript]);

  const handleTestScript = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestError(null);
    let sampleInputs;
    try {
      sampleInputs = sampleRuntimeInputsJsonString ? JSON.parse(sampleRuntimeInputsJsonString) : {};
    } catch (e) {
      setTestError("Error: Sample Runtime Inputs is not valid JSON.");
      setIsTesting(false);
      return;
    }

    try {
      const response = await apiClient.post('/catalogue/test-item-script', {
        itemLogicScript: scriptContent,
        sampleRuntimeInputs: sampleInputs,
      });
      setTestResult(response.data);
    } catch (error: any) {
      console.error("Error testing script:", error);
      setTestError(error.response?.data?.message || error.message || "Failed to test script.");
    }
    setIsTesting(false);
  };

  const handleSave = () => {
    onSave(scriptContent);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative mx-auto p-6 border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <h3 className="text-xl leading-6 font-medium text-gray-900 mb-4">
          Edit Logic Script for: {itemName}
        </h3>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2">
            <label htmlFor="itemLogicScript" className="block text-sm font-medium text-gray-700 mb-1">
              JavaScript Function (must define or return `calculateProperties(runtimeInputs, globalConstants)`)
            </label>
            <textarea
              id="itemLogicScript"
              value={scriptContent}
              onChange={(e) => setScriptContent(e.target.value)}
              rows={15}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono text-xs"
              placeholder={`function calculateProperties(runtimeInputs, globalConstants) {\n  // Example: \n  // const width = runtimeInputs.boxWidth - (2 * globalConstants.panelThickness);\n  // return { width, height: runtimeInputs.boxHeight, ... };\n}`}
            />
          </div>
          <div className="col-span-1 space-y-3 text-xs p-2 border rounded-md bg-gray-50 max-h-[350px] overflow-y-auto">
            <div>
              <h4 className="font-semibold mb-1">Available Runtime Inputs (from Model Definition):</h4>
              {availableRuntimeInputs.length > 0 ? (
                <ul className="list-disc list-inside">
                  {availableRuntimeInputs.map(param => (
                    <li key={param.inputName}><code>runtimeInputs.{param.inputName}</code> (e.g., "{param.displayLabel || param.inputName}")</li>
                  ))}
                </ul>
              ) : <p>No input parameters defined for this model yet.</p>}
               <p className="mt-1 text-gray-600">
                If your script uses material definitions (e.g., <code>runtimeInputs.exposedMaterialDefinition</code>),
                you must manually include these full material objects in the "Sample Runtime Inputs" JSON when testing.
                The sample inputs are typically edited on the main model form.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Available Global Constants:</h4>
              <p className="text-gray-600">(e.g., <code>globalConstants.panelThickness</code>, <code>globalConstants.CEBThickness</code>). Refer to documentation for full list.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Expected Output Format (for Planks):</h4>
              <pre className="whitespace-pre-wrap bg-gray-100 p-1 rounded text-gray-700">{EXPECTED_PLANK_OUTPUT_DOC}</pre>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <button
            type="button"
            onClick={handleTestScript}
            disabled={isTesting}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : 'Test Script with Sample Inputs'}
          </button>
        </div>

        {testResult && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-semibold text-green-700">Test Result:</h4>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(testResult, null, 2)}</pre>
          </div>
        )}
        {testError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <h4 className="font-semibold text-red-700">Test Error:</h4>
            <p className="text-xs text-red-600">{testError}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Script
          </button>
        </div>
      </div>
    </div>
  );
}
