"use client";

import React, { useState } from 'react';
import { Model, PlankDetails, RuntimeInput } from '@/types/plankTypes';

interface ModelPlankListProps {
  models: Model[];
  globalConstants: Record<string, any>;
}

const SAMPLE_INPUTS = {
  boxDepth: 560,
  boxHeight: 720,
  leftAdjacency: 'Expose',
  rightAdjacency: 'Wall',
  skirting: 100,
  outerMaterialCode: 'OUT001',
  innerMaterialCode: 'IN001'
} as const;

export default function ModelPlankList({ models, globalConstants }: ModelPlankListProps) {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [boxNumber, setBoxNumber] = useState('');
  const [runtimeInputs, setRuntimeInputs] = useState<RuntimeInput[]>([]);
  const [plankList, setPlankList] = useState<PlankDetails[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Execute a calculation with given inputs and logic
  const executeCalculation = (
    logic: string, 
    inputs: Record<string, any>, 
    expectedVar: 'Width' | 'Height' | 'Material'
  ): any => {
    try {
      const fn = new Function('runtimeInputs', 'globalConstants', `
        // Runtime inputs
        const {
          boxDepth, boxHeight, leftAdjacency, rightAdjacency,
          skirting, outerMaterialCode, innerMaterialCode,
          ...otherInputs
        } = runtimeInputs;

        // Global constants
        const {
          MATERIAL_THICKNESS,
          EDGE_BANDING
        } = globalConstants;

        // Variable declaration
        let ${expectedVar};

        // User's core logic
        ${logic}

        // Return value
        return ${expectedVar};
      `);

      return fn(inputs, globalConstants);
    } catch (err) {
      console.error('Calculation error:', err);
      throw new Error(`Failed to execute ${expectedVar.toLowerCase()} calculation`);
    }
  };

  // Generate plank list for selected model and inputs
  const generatePlankList = () => {
    if (!selectedModel) {
      setError('Please select a model');
      return;
    }

    if (!boxNumber || !/^\d{2}$/.test(boxNumber)) {
      setError('Box number must be a 2-digit number');
      return;
    }

    try {
      const inputs = runtimeInputs.reduce((acc, input) => ({
        ...acc,
        [input.inputName]: input.value
      }), {});

      const planks = selectedModel.planks.map(plank => {
        // Calculate width
        const width = executeCalculation(plank.widthLogic, inputs, 'Width');
        if (typeof width !== 'number' || width <= 0) {
          throw new Error(`Invalid width (${width}) for plank ${plank.plankNumber}${plank.plankIdentifier}`);
        }

        // Calculate length
        const length = executeCalculation(plank.lengthLogic, inputs, 'Height');
        if (typeof length !== 'number' || length <= 0) {
          throw new Error(`Invalid length (${length}) for plank ${plank.plankNumber}${plank.plankIdentifier}`);
        }

        // Calculate material code
        const materialCode = executeCalculation(plank.materialCode, inputs, 'Material');
        if (typeof materialCode !== 'string' || !materialCode) {
          throw new Error(`Invalid material code (${materialCode}) for plank ${plank.plankNumber}${plank.plankIdentifier}`);
        }

        return {
          width,
          length,
          materialCode,
          plankId: `${boxNumber}${plank.plankNumber}${plank.plankIdentifier}`,
          holes: [], // Placeholder for future implementation
          grooves: [] // Placeholder for future implementation
        } as PlankDetails;
      });

      setPlankList(planks);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to generate plank list');
      }
      setPlankList([]);
    }
  };

  // Download plank list as CSV
  const downloadCsv = () => {
    if (!plankList.length) return;

    const headers = ['PlankID', 'Width', 'Length', 'MaterialCode', 'Holes', 'Grooves'];
    const rows = plankList.map(plank => [
      plank.plankId,
      plank.width,
      plank.length,
      plank.materialCode,
      JSON.stringify(plank.holes),
      JSON.stringify(plank.grooves)
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `plank_list_${selectedModel?.name}_${boxNumber}.csv`;
    link.click();
  };

  // Handle model selection
  const handleModelSelect = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (model) {
      setSelectedModel(model);
      // Initialize runtime inputs with sample values
      setRuntimeInputs(
        model.runtimeInputs.map(input => ({
          ...input,
          value: SAMPLE_INPUTS[input.inputName as keyof typeof SAMPLE_INPUTS] ?? ''
        }))
      );
      setPlankList([]);
      setError(null);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Model Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Model
        </label>
        <select
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={selectedModel?.id || ''}
          onChange={(e) => handleModelSelect(e.target.value)}
        >
          <option value="">Select a model...</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      {selectedModel && (
        <>
          {/* Box Number Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Box Number (2 digits)
            </label>
            <input
              type="text"
              maxLength={2}
              pattern="[0-9]{2}"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={boxNumber}
              onChange={(e) => setBoxNumber(e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="01"
            />
          </div>

          {/* Runtime Inputs */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Runtime Inputs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {runtimeInputs.map((input) => (
                <div key={input.inputName} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {input.displayLabel || input.inputName}
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={input.value}
                    onChange={(e) => {
                      const newInputs = runtimeInputs.map(ri =>
                        ri.inputName === input.inputName
                          ? { ...ri, value: e.target.value }
                          : ri
                      );
                      setRuntimeInputs(newInputs);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={generatePlankList}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Generate Plank List
            </button>
            {plankList.length > 0 && (
              <button
                type="button"
                onClick={downloadCsv}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Download CSV
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          )}

          {/* Results Preview */}
          {plankList.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Plank List</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plank ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Width
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Length
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material Code
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {plankList.map((plank) => (
                      <tr key={plank.plankId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {plank.plankId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {plank.width}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {plank.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {plank.materialCode}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
