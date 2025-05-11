"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/dashboard/button';
import { useGet, usePost } from '@/hooks/useApi';
import { Project, Subtask } from '@/types';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

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
    
    setGeneratedPlankList(null);

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
      const result = await generatePlanks('/bim/generate-plank-list', payload);
      if (result?.plankList) {
        setGeneratedPlankList(result.plankList);
      } else {
        throw new Error(result?.message || 'Failed to generate plank list.');
      }
    } catch (error) {
        console.error("Plank generation error:", error);
    }
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
          Generate Plank List & Complete Subtask
        </Button>
      )}

       {generatedPlankList && !generationLoading && !generationApiError && (
         <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-md text-green-800 text-xs">
           <div className="flex items-center mb-2">
             <CheckCircle className="h-4 w-4 mr-1.5" />
             <span className="font-semibold">Plank list generated successfully!</span>
           </div>
           <pre className="mt-2 text-xs overflow-x-auto bg-white p-2 rounded">
             {JSON.stringify(generatedPlankList, null, 2)}
           </pre>
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
