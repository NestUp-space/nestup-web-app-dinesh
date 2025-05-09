"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/dashboard/button';
import { useGet, usePost } from '@/hooks/useApi'; // Import specialized hooks
import { Project, Subtask } from '@/types';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ModelTemplate {
  name: string;
  description: string;
  inputs: Record<string, any>;
  screenshotUrl?: string;
}

interface ModelSelectorProps {
  subtask?: Subtask; // Made optional
  project?: Project; // Made optional, Needed for context, potentially packet number logic later
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ subtask, project }) => {
  // Use specialized hooks
  const { data: fetchedTemplates, loading: templatesLoading, error: templatesError } = useGet<ModelTemplate[]>('/bim/model-templates');
  const { execute: generatePlanks, loading: generationLoading, error: generationApiError } = usePost<{ message: string; plankList: any[] }>();

  const [modelTemplates, setModelTemplates] = useState<ModelTemplate[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelTemplate | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [boxNumber, setBoxNumber] = useState<string>('1'); // Default or fetch last used?
  const [packetNumber, setPacketNumber] = useState<string>('1'); // Default or fetch last used?
  const [generatedPlankList, setGeneratedPlankList] = useState<any[] | null>(null);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Update state when templates are fetched
  useEffect(() => {
    if (fetchedTemplates) {
      setModelTemplates(fetchedTemplates);
    }
  }, [fetchedTemplates]);

  const handleModelSelect = (templateName: string) => {
    const model = modelTemplates.find(t => t.name === templateName) || null;
    setSelectedModel(model);
    // Reset input values when model changes
    setInputValues(model ? { ...model.inputs } : {}); 
    setGeneratedPlankList(null); // Clear previous results
    setGenerationStatus('idle');
    setGenerationError(null);
  };

  const handleInputChange = (inputName: string, value: any) => {
    setInputValues(prev => ({ ...prev, [inputName]: value }));
  };

  const handleGeneratePlanks = async () => {
    // If project is still needed for other parts of this function (e.g. packetNumber logic),
    // the check for !project should remain or be adapted.
    // For now, assuming project is optional for the core plank generation if subtaskId is removed.
    if (!selectedModel || !token) {
      alert("Please select a model and ensure you are logged in.");
      return;
    }
    
    // If project is used for packetNumber or other logic, ensure it's handled if project is undefined.
    // Example: const currentPacketNumber = project ? project.somePacketInfo : 'defaultPacket';

    // Use generationLoading state from usePost hook
    // setGenerationStatus('loading'); 
    setGenerationError(null);
    setGeneratedPlankList(null);

    const payload: any = { // Use 'any' or a more specific type if subtaskId is truly gone
      modelName: selectedModel.name,
      inputs: inputValues,
      // subtaskId: subtask.id, // Removed as per user request (backend API to be modified)
      boxNumber: boxNumber,
      packetNumber: packetNumber, // This might depend on 'project' if that logic is implemented
    };
    // If subtask is still used for other purposes in this function, ensure subtask?.id is used.
    // For now, assuming subtaskId is completely removed from payload.
    if (subtask?.id) {
      // If backend still accepts subtaskId optionally, it could be added here.
      // payload.subtaskId = subtask.id; 
      // However, user stated "i dont think sub task id is required for plank generation"
      // and "modify the back eng api", implying it should be removed from the payload.
    }


    try {
      // Use the execute function from usePost
      const result = await generatePlanks(
        '/bim/generate-plank-list', 
        payload
        // Auth token should be handled by apiClient interceptor if configured, otherwise add headers here
      );

      if (result?.plankList) {
        setGeneratedPlankList(result.plankList);
        setGenerationStatus('success');
        // Optionally: Trigger a refetch of the task/subtask data in the parent component
        // to show the subtask as completed and potentially display metadata.
      } else {
        throw new Error(result?.message || 'Failed to generate plank list.');
      }
    } catch (error) {
        console.error("Plank generation error:", error);
        setGenerationStatus('error');
        setGenerationError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      // Loading state is handled by usePost hook
      // setGenerationStatus(generationLoading ? 'loading' : generationApiError ? 'error' : 'idle'); // This might cause issues, rely on hook state
    }
  };

  // Function to render input fields based on type
  const renderInputField = (key: string, value: any) => {
    const currentValue = inputValues[key] ?? ''; // Use current value from state or default

    // Basic type inference - enhance as needed
    if (typeof value === 'number' || !isNaN(Number(currentValue))) {
      return (
        <input
          type="number"
          id={key}
          value={currentValue}
          onChange={(e) => handleInputChange(key, e.target.value === '' ? null : Number(e.target.value))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      );
    } else if (typeof value === 'boolean') {
       return (
         <input
           type="checkbox"
           id={key}
           checked={!!currentValue}
           onChange={(e) => handleInputChange(key, e.target.checked)}
           className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
         />
       );
    } else if (key.toLowerCase().includes('materialcode')) {
       // TODO: Replace with a dropdown fetching actual materials from project/global list
       return (
         <input
           type="text"
           id={key}
           value={currentValue}
           placeholder="Enter Material Code"
           onChange={(e) => handleInputChange(key, e.target.value)}
           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
         />
       );
    } else { // Default to text input
      return (
        <input
          type="text"
          id={key}
          value={currentValue}
          onChange={(e) => handleInputChange(key, e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      );
    }
  };

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
      <h5 className="text-sm font-semibold text-gray-700 mb-3">Select Model & Enter Dimensions</h5>
      
      {/* Model Selection Dropdown */}
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
          {modelTemplates.map(template => (
            <option key={template.name} value={template.name}>
              {template.name} ({template.description})
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic Inputs */}
      {selectedModel && (
        <div className="space-y-3 mb-4">
          <h6 className="text-xs font-medium text-gray-600">Model Inputs:</h6>
          {Object.entries(inputValues).map(([key, value]) => (
            <div key={key}>
              <label htmlFor={key} className="block text-xs font-medium text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()} {/* Add spaces before caps */}
              </label>
              {renderInputField(key, value)}
            </div>
          ))}
          
          {/* Box and Packet Number Inputs */}
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

      {/* Action Button */}
      {selectedModel && (
        <Button 
          onClick={handleGeneratePlanks} 
          disabled={generationLoading} // Use loading state from usePost
          size="sm"
        >
          {generationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Plank List & Complete Subtask
        </Button>
      )}

      {/* Status Messages */}
       {/* Use generationApiError and generatedPlankList directly */}
       {generatedPlankList && !generationLoading && !generationApiError && (
         <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-md text-green-800 text-xs">
           <div className="flex items-center mb-2">
             <CheckCircle className="h-4 w-4 mr-1.5" />
             <span className="font-semibold">Plank list generated successfully!</span>
           </div>
           {/* TODO: Display the plank list nicely - maybe a table or downloadable format */}
           <pre className="mt-2 text-xs overflow-x-auto bg-white p-2 rounded">
             {JSON.stringify(generatedPlankList, null, 2)}
           </pre>
         </div>
       )}
       {generationApiError && ( // Use error state from usePost
         <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md text-red-800 text-xs">
           <div className="flex items-center">
             <AlertCircle className="h-4 w-4 mr-1.5" />
             <span className="font-semibold">Error:</span> {generationApiError.message}
           </div>
         </div>
       )}
       {templatesError && ( // Display template fetch errors
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
