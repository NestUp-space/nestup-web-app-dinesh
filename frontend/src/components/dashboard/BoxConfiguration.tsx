"use client";

import React, { useState, useEffect } from 'react';
import { 
  useTaskSiteVisitBoxes, 
  useCreateSiteVisitBox, 
  useUpdateSiteVisitBox, 
  useDeleteSiteVisitBox,
  useAvailableBimModels,
  useBimModelInfo,
  useValidateModelInputs,
  useGeneratePlankList,
  usePlankListDownloadUrl,
  SiteVisitBox,
  ModelInfo,
  CreateSiteVisitBoxData
} from '@/hooks';
import Image from "next/legacy/image";
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Save, X, Download, Info, Box, ArrowRight } from 'lucide-react';

interface BoxConfigurationProps {
  taskId: number;
  projectId: number;
}

const BoxConfiguration: React.FC<BoxConfigurationProps> = ({ taskId, projectId }) => {
  const { boxes, loading: boxesLoading, refetch: refetchBoxes } = useTaskSiteVisitBoxes(taskId);
  const { createSiteVisitBox, loading: createLoading } = useCreateSiteVisitBox(taskId);
  const { deleteSiteVisitBox, loading: deleteLoading } = useDeleteSiteVisitBox();
  const [editingBoxId, setEditingBoxId] = useState<number | null>(null); // Moved earlier for hook dependency
  const { updateSiteVisitBox, loading: updateLoading } = useUpdateSiteVisitBox(editingBoxId ?? -1); // Provide -1 if null
  const { models, loading: modelsLoading } = useAvailableBimModels();
  const { validateInputs } = useValidateModelInputs();
  const { generatePlankList, loading: generateLoading } = useGeneratePlankList(taskId);
  const plankListDownloadUrl = usePlankListDownloadUrl(taskId);
  
  const [isAddingBox, setIsAddingBox] = useState(false);
  // const [editingBoxId, setEditingBoxId] = useState<number | null>(null); // Moved earlier
  const [selectedModelType, setSelectedModelType] = useState<string | null>(null);
  const [modelInputs, setModelInputs] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [plankListGenerated, setPlankListGenerated] = useState(false);
  
  // Fetch model info when a model type is selected
  const { modelInfo, loading: modelInfoLoading } = useBimModelInfo(selectedModelType);
  
  // Reset form when adding new box
  useEffect(() => {
    if (isAddingBox) {
      setSelectedModelType(null);
      setModelInputs({});
      setValidationErrors([]);
    }
  }, [isAddingBox]);
  
  // Set form data when editing a box
  useEffect(() => {
    if (editingBoxId !== null) {
      const boxToEdit = boxes.find(b => b.id === editingBoxId);
      if (boxToEdit) {
        setSelectedModelType(boxToEdit.modelType);
        setModelInputs(boxToEdit.inputs);
      }
    }
  }, [editingBoxId, boxes]);
  
  // Initialize inputs when model info is loaded
  useEffect(() => {
    if (modelInfo && !editingBoxId) {
      // Initialize inputs with default values or empty strings
      const initialInputs: Record<string, any> = {};
      Object.entries(modelInfo.runtimeInputs).forEach(([key, value]) => {
        initialInputs[key] = value !== null ? value : '';
      });
      setModelInputs(initialInputs);
    }
  }, [modelInfo, editingBoxId]);
  
  const handleModelSelect = (modelType: string) => {
    setSelectedModelType(modelType);
    setModelInputs({});
    setValidationErrors([]);
  };
  
  const handleInputChange = (name: string, value: any) => {
    setModelInputs(prev => ({ ...prev, [name]: value }));
  };
  
  const validateForm = async (): Promise<boolean> => {
    if (!selectedModelType) {
      setValidationErrors(['Please select a model type.']);
      return false;
    }
    
    try {
      const result = await validateInputs(selectedModelType, modelInputs);
      if (result && !result.valid && result.errors) {
        setValidationErrors(result.errors);
        return false;
      }
      
      setValidationErrors([]);
      return true;
    } catch (error) {
      console.error('Validation error:', error);
      setValidationErrors(['An error occurred during validation.']);
      return false;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) return;
    
    try {
      if (editingBoxId !== null) {
        // Update existing box
        await updateSiteVisitBox({ // updateSiteVisitBox is now from the top-level hook
          modelType: selectedModelType!,
          inputs: modelInputs
        });
        setEditingBoxId(null);
      } else {
        // Create new box
        await createSiteVisitBox({
          modelType: selectedModelType!,
          inputs: modelInputs,
          order: boxes.length + 1
        });
        setIsAddingBox(false);
      }
      
      // Refresh boxes list
      refetchBoxes();
      // Reset plank list generated flag
      setPlankListGenerated(false);
    } catch (error) {
      console.error('Error saving box:', error);
      alert('Failed to save box. Please try again.');
    }
  };
  
  const handleDelete = async (boxId: number) => {
    if (window.confirm('Are you sure you want to delete this box?')) {
      try {
        await deleteSiteVisitBox(boxId);
        refetchBoxes();
        // Reset plank list generated flag
        setPlankListGenerated(false);
      } catch (error) {
        console.error('Error deleting box:', error);
        alert('Failed to delete box. Please try again.');
      }
    }
  };
  
  const handleGeneratePlankList = async () => {
    try {
      await generatePlankList();
      setPlankListGenerated(true);
      alert('Plank list generated successfully!');
    } catch (error) {
      console.error('Error generating plank list:', error);
      alert('Failed to generate plank list. Please try again.');
    }
  };
  
  // Render input field based on type
  const renderInputField = (name: string, value: any) => {
    // Determine input type based on value or name
    let inputType = 'text';
    if (typeof value === 'number') {
      inputType = 'number';
    } else if (name.includes('adjacency')) {
      inputType = 'select';
    } else if (typeof value === 'boolean') {
      inputType = 'checkbox';
    }
    
    switch (inputType) {
      case 'number':
        return (
          <input
            type="number"
            value={modelInputs[name] || ''}
            onChange={(e) => handleInputChange(name, parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        );
      case 'select':
        if (name.includes('adjacency')) {
          return (
            <select
              value={modelInputs[name] || ''}
              onChange={(e) => handleInputChange(name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="">Select...</option>
              <option value="Expose">Expose</option>
              <option value="Box">Box</option>
              <option value="Wall">Wall</option>
            </select>
          );
        }
        return null;
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={modelInputs[name] || false}
            onChange={(e) => handleInputChange(name, e.target.checked)}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
        );
      default:
        return (
          <input
            type="text"
            value={modelInputs[name] || ''}
            onChange={(e) => handleInputChange(name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        );
    }
  };
  
  // Format input name for display
  const formatInputName = (name: string): string => {
    return name
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Box Configuration</h2>
        <div className="flex space-x-2">
          {!isAddingBox && !editingBoxId && boxes.length > 0 && (
            <Button 
              onClick={handleGeneratePlankList} 
              size="sm"
              disabled={generateLoading}
              variant="outline"
            >
              <ArrowRight size={16} className="mr-1" /> Generate Plank List
            </Button>
          )}
          {!isAddingBox && !editingBoxId && plankListGenerated && (
            <a 
              href={plankListDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Download size={16} className="mr-1" /> Download CSV
            </a>
          )}
          {!isAddingBox && !editingBoxId && (
            <Button onClick={() => setIsAddingBox(true)} size="sm">
              <Plus size={16} className="mr-1" /> Add Box
            </Button>
          )}
        </div>
      </div>
      
      {boxesLoading || modelsLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          {/* Box Form */}
          {(isAddingBox || editingBoxId !== null) && (
            <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-200">
              <h3 className="text-lg font-medium mb-3">
                {editingBoxId !== null ? 'Edit Box' : 'Add New Box'}
              </h3>
              
              {/* Model Selection */}
              {!editingBoxId && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Box Model
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {models.map((model) => (
                      <div 
                        key={model.modelType}
                        className={`border rounded-md p-3 cursor-pointer transition-colors ${
                          selectedModelType === model.modelType 
                            ? 'border-primary bg-primary-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleModelSelect(model.modelType)}
                      >
                        <div className="flex items-center mb-2">
                          <Box size={20} className="mr-2 text-gray-600" />
                          <h4 className="font-medium">{model.modelType}</h4>
                        </div>
                        {model.screenshotUrl && (
                          <div className="relative mb-2 h-32 bg-gray-100 rounded overflow-hidden">
                            <Image
                              src={model.screenshotUrl}
                              alt={model.modelType}
                              layout="fill"
                              objectFit="cover"
                            />
                          </div>
                        )}
                        <p className="text-sm text-gray-600">{model.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Model Inputs */}
              {selectedModelType && (
                <div className="mt-4">
                  <h4 className="text-md font-medium mb-3 flex items-center">
                    <Info size={16} className="mr-1 text-gray-500" />
                    Configure {selectedModelType} Parameters
                  </h4>
                  
                  {modelInfoLoading ? (
                    <p className="text-gray-500">Loading model parameters...</p>
                  ) : (
                    <>
                      {validationErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                          <h5 className="font-medium">Please fix the following errors:</h5>
                          <ul className="list-disc list-inside text-sm mt-1">
                            {validationErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {modelInfo && Object.keys(modelInfo.runtimeInputs).map((inputName) => (
                          <div key={inputName}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {formatInputName(inputName)}
                            </label>
                            {renderInputField(inputName, modelInfo.runtimeInputs[inputName])}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingBox(false);
                    setEditingBoxId(null);
                    setSelectedModelType(null);
                  }}
                >
                  <X size={16} className="mr-1" /> Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={(editingBoxId !== null ? updateLoading : createLoading) || !selectedModelType || modelInfoLoading}
                >
                  <Save size={16} className="mr-1" /> Save
                </Button>
              </div>
            </form>
          )}
          
          {/* Boxes List */}
          {boxes.length > 0 ? (
            <div className="space-y-4">
              {boxes.map((box) => (
                <div 
                  key={box.id} 
                  className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800">{box.modelType}</h4>
                      <p className="text-sm text-gray-500">Box #{box.order}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setEditingBoxId(box.id)}
                        disabled={isAddingBox || editingBoxId !== null}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(box.id)}
                        disabled={deleteLoading || isAddingBox || editingBoxId !== null}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {Object.entries(box.inputs).map(([key, value]) => (
                      <div key={key} className="bg-gray-100 px-3 py-2 rounded">
                        <span className="font-medium">{formatInputName(key)}:</span>{' '}
                        <span className="text-gray-700">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-4 text-center">
              No boxes configured yet. Add boxes to generate a plank list.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default BoxConfiguration;
