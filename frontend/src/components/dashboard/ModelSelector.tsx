"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/dashboard/button';
import { useGet, usePost } from '@/hooks/useApi';
import { Project, Subtask } from '@/types';
import { AlertCircle, CheckCircle, Loader2, Download } from 'lucide-react';

interface CatalogueModel {
  id: string;
  name: string;
  description: string | null;
  imageUrl?: string | null;
  inputParameters?: Array<{
    id: string;
    inputName: string;
    displayLabel?: string | null;
    inputType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT';
    defaultValue?: string | null;
    options?: string | null;
    unit?: string | null;
    description?: string | null;
  }>;
}

interface ModelSelectorProps {
  subtask?: Subtask;
  project?: Project;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ subtask, project }) => {
  const { data: fetchedCatalogueModels, loading: templatesLoading, error: templatesError } = useGet<CatalogueModel[]>('/v1/catalogue');
  const { execute: generatePlanks, loading: generationLoading, error: generationApiError } = usePost<{ message: string; plankList: any[] }>();

  const [catalogueModels, setCatalogueModels] = useState<CatalogueModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<CatalogueModel | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [boxNumber, setBoxNumber] = useState<string>('1');
  const [packetNumber, setPacketNumber] = useState<string>('1');
  const [generatedPlankList, setGeneratedPlankList] = useState<any[] | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (fetchedCatalogueModels) {
      setCatalogueModels(fetchedCatalogueModels);
    }
  }, [fetchedCatalogueModels]);

  const handleModelSelect = (modelIdOrName: string) => {
    const model = catalogueModels.find(m => m.name === modelIdOrName) || null;
    setSelectedModel(model);
    
    const defaultInputs: Record<string, any> = {};
    if (model?.inputParameters) {
      for (const param of model.inputParameters) {
        let value: any = param.defaultValue ?? '';
        if (param.inputType === 'NUMBER' && param.defaultValue) {
          value = parseFloat(param.defaultValue);
          if (isNaN(value)) value = '';
        } else if (param.inputType === 'BOOLEAN') {
          value = param.defaultValue === 'true';
        }
        defaultInputs[param.inputName] = value;
      }
    }
    setInputValues(defaultInputs);
    setGeneratedPlankList(null);
  };

  const handleInputChange = (inputName: string, value: any) => {
    setInputValues(prev => ({ ...prev, [inputName]: value }));
  };

  const handleGeneratePlanks = async () => {
    if (!selectedModel || !token) {
      alert("Please select a model and ensure you are logged in.");
      return;
    }
    
    setGeneratedPlankList(null); // Reset previous list

    const payload: any = {
      modelName: selectedModel.name,
      inputs: inputValues,
      boxNumber: boxNumber,
      packetNumber: packetNumber,
    };
    if (subtask?.id) {
      // payload.subtaskId = subtask.id; // If needed by backend
    }

    try {
      console.log("Attempting to generate plank list with payload:", payload);
      const result = await generatePlanks('/bim/generate-plank-list', payload);
      
      // Log the raw result and any API error from the hook
      console.log("Raw result from API:", result);
      // The generationApiError is destructured from usePost, so it should reflect the hook's error state.
      // We log it here to see its state after the generatePlanks call.
      console.log("generationApiError from usePost hook (after exec):", generationApiError);

      if (result?.plankList && Array.isArray(result.plankList)) { // Added Array.isArray check
        setGeneratedPlankList(result.plankList);
        console.log("Plank list set successfully:", result.plankList);
      } else {
        const errorMessage = result?.message || 'Failed to generate plank list: API response did not contain a valid plankList array.';
        console.error("Plank generation error (custom logic):", errorMessage, "Full API result:", result);
        // If usePost doesn't set its error state for this kind of "successful HTTP but bad data" scenario,
        // we might need a way to manually trigger an error display.
        // For now, throwing an error will be caught by the catch block.
        throw new Error(errorMessage);
      }
    } catch (error) {
        // This catch block will catch errors from the HTTP request itself (if usePost throws them)
        // or errors thrown manually from the try block.
        console.error("Plank generation error (caught in catch block):", error);
        // If 'error' is the one we threw, generationApiError from the hook might still be null/undefined
        // if the HTTP request itself was successful.
        // The `generationApiError` state from the `usePost` hook should ideally be used for displaying API errors.
        // If the hook doesn't set it for non-2xx responses or network errors, that's a limitation of the hook.
        // The current UI relies on `generationApiError` for display.
    }
  };

  // Utility function to generate CSV content
  const generateCSVContent = (plankData: any[], currentBoxNumber: string, currentPacketNumber: string): string => {
    if (!plankData || plankData.length === 0) return '';

    const headers = ["Width", "Height", "Material Code", "Plank ID", "Hole", "Groove"];
    // Assuming plank item structure:
    // { W: number, H: number, MC: string, plankIdentifier: string, 
    //   holes?: Array<{ x: number; y: number; z: number; t: string | number }>, 
    //   grooves?: Array<{ x1: number; y1: number; x2: number; y2: number; z: number; t: string | number }> }
    // These are assumptions. Actual property names from API response might differ.
    const rows = plankData.map(plank => {
      const plankId = `${currentBoxNumber} - ${currentPacketNumber} - ${plank.plankIdentifier || 'N/A'}`;
      
      const holesString = plank.holes?.map((h: any) => `(${h.x},${h.y},${h.z},${h.t})`).join('; ') || '';
      const groovesString = plank.grooves?.map((g: any) => `(${g.x1},${g.y1},${g.x2},${g.y2},${g.z},${g.t})`).join('; ') || '';

      return [
        plank.W ?? '', // Width
        plank.H ?? '', // Height
        plank.MC ?? '', // Material Code
        plankId,       // Plank ID
        holesString,   // Hole
        groovesString  // Groove
      ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(','); // Escape double quotes and wrap in quotes
    });

    return [headers.join(','), ...rows].join('\n');
  };

  // Utility function to trigger CSV download
  const downloadCSV = (csvContent: string, filename: string) => {
    if (!csvContent) return;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadPlankList = () => {
    if (!generatedPlankList || generatedPlankList.length === 0) {
      alert("No plank list data available to download.");
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `plank-list_${project?.name || 'project'}_${subtask?.name || 'subtask'}_${timestamp}.csv`;
    const csvData = generateCSVContent(generatedPlankList, boxNumber, packetNumber);
    downloadCSV(csvData, filename);
  };

  const renderInputField = (
    key: string, 
    fieldValue: any,
    inputType?: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT', 
    options?: string | null
  ) => {
    const currentValue = inputValues[key] ?? '';

    if (inputType === 'NUMBER') {
      return (
        <input
          type="number"
          id={key}
          value={currentValue}
          onChange={(e) => handleInputChange(key, e.target.value === '' ? null : Number(e.target.value))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      );
    } else if (inputType === 'BOOLEAN') {
      return (
        <input
          type="checkbox"
          id={key}
          checked={!!currentValue}
          onChange={(e) => handleInputChange(key, e.target.checked)}
          className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
        />
      );
    } else if (inputType === 'SELECT' && options) {
      const selectOptions = options.split(',').map(opt => opt.trim());
      return (
        <select
          id={key}
          value={currentValue}
          onChange={(e) => handleInputChange(key, e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        >
          <option value="">-- Select --</option>
          {selectOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    else { 
      return (
         <input
           type="text"
           id={key}
           value={currentValue}
           placeholder={`Enter ${key.replace(/([A-Z])/g, ' $1').trim()}`}
           onChange={(e) => handleInputChange(key, e.target.value)}
           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
         />
       );
    }
  };

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
      <h5 className="text-sm font-semibold text-gray-700 mb-3">Select Model & Enter Dimensions</h5>
      
      <div className="mb-4">
        <label htmlFor="modelSelect" className="block text-xs font-medium text-gray-700 mb-1">
          Select Model Template:
        </label>
        <select
          id="modelSelect"
          value={selectedModel?.name || ''}
          onChange={(e) => handleModelSelect(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        >
          <option value="">-- Select a Model --</option>
          {catalogueModels.map(model => (
            <option key={model.id} value={model.name}>
              {model.name} {model.description ? `(${model.description.substring(0, 50)}${model.description.length > 50 ? '...' : ''})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedModel && selectedModel.inputParameters && selectedModel.inputParameters.length > 0 && (
        <div className="space-y-3 mb-4">
          <h6 className="text-xs font-medium text-gray-600">Model Inputs:</h6>
          {selectedModel.inputParameters.map((param) => (
            <div key={param.inputName}>
              <label htmlFor={param.inputName} className="block text-xs font-medium text-gray-700 capitalize">
                {param.displayLabel || param.inputName.replace(/([A-Z])/g, ' $1').trim()}
                {param.unit ? ` (${param.unit})` : ''}
              </label>
              {renderInputField(param.inputName, inputValues[param.inputName], param.inputType, param.options)}
            </div>
          ))}
          
           <div>
              <label htmlFor="boxNumber" className="block text-xs font-medium text-gray-700">
                Box Number
              </label>
              <input
                type="text"
                id="boxNumber"
                value={boxNumber}
                onChange={(e) => setBoxNumber(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
             <div>
              <label htmlFor="packetNumber" className="block text-xs font-medium text-gray-700">
                Packet Number
              </label>
              <input
                type="text"
                id="packetNumber"
                value={packetNumber}
                onChange={(e) => setPacketNumber(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
        </div>
      )}

      {selectedModel && (
        <Button 
          onClick={handleGeneratePlanks} 
          disabled={generationLoading}
          size="sm"
        >
          {generationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Plank List
        </Button>
      )}

       {generatedPlankList && generatedPlankList.length > 0 && !generationLoading && !generationApiError && (
         <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-md text-green-800 text-xs">
           <div className="flex items-center justify-between mb-2">
             <div className="flex items-center">
               <CheckCircle className="h-4 w-4 mr-1.5" />
               <span className="font-semibold">Plank list generated successfully!</span>
             </div>
             <Button 
                onClick={handleDownloadPlankList} 
                size="sm" 
                variant="outline"
                className="bg-white hover:bg-gray-50 text-green-700 border-green-300 hover:border-green-400 py-1 px-2 text-xs" // Adjusted padding and text size for a smaller feel
              >
                <Download className="mr-1.5 h-3 w-3" />
                Download CSV
              </Button>
           </div>
           {/* Optional: Keep the JSON preview or replace with a more structured display */}
           <details className="mt-2">
            <summary className="text-xs text-gray-600 cursor-pointer hover:underline">View Raw Data</summary>
            <pre className="mt-1 text-xs overflow-x-auto bg-white p-2 rounded">
              {JSON.stringify(generatedPlankList, null, 2)}
            </pre>
           </details>
         </div>
       )}
       {/* Handle case where plank list is generated but empty */}
       {generatedPlankList && generatedPlankList.length === 0 && !generationLoading && !generationApiError && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-200 rounded-md text-yellow-800 text-xs">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-1.5" />
              <span className="font-semibold">Plank list generated, but it is empty.</span>
            </div>
          </div>
       )}
       {generationApiError && (
         <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md text-red-800 text-xs">
           <div className="flex items-center">
             <AlertCircle className="h-4 w-4 mr-1.5" />
             <span className="font-semibold">Error:</span> {generationApiError.message}
           </div>
         </div>
       )}
       {templatesError && (
         <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md text-red-800 text-xs">
           <div className="flex items-center">
             <AlertCircle className="h-4 w-4 mr-1.5" />
             <span className="font-semibold">Error loading templates:</span> {templatesError.message}
           </div>
         </div>
       )}
    </div>
  );
};

export default ModelSelector;
