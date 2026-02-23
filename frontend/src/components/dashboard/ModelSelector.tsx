"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useGet, usePost, usePut, useDelete } from '@/hooks/useApi';
import { Project, Subtask } from '@/types';
import { PlankDetails } from '@/types/plankTypes'; // Import PlankDetails
import { AlertCircle, CheckCircle, Loader2, Download, PlusCircle, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import BoxComponent from './BoxComponent';
import MaterialCodeSelector from './MaterialCodeSelector'; // Import MaterialCodeSelector

// Define ProjectModelInstance type based on the Prisma schema
interface ProjectModelInstanceType {
  id: string;
  projectId: number;
  modelDefinitionId: string;
  runtimeInputsJson: Record<string, any>;
  uiDisplayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

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
  projectId?: number | string;
}

interface BoxItem {
  id: string; // Client-side unique ID for new boxes, DB ID for loaded/saved ones
  selectedModelId: string | null;
  inputValues: Record<string, any>;
  dbId?: string;
  isModified?: boolean;
  isSaving?: boolean;
  saveError?: string;
  // uiDisplayOrder is implicit from array index for client-side ops, sent to backend on save
}

// Type for the payload to save box configurations
interface SaveBoxPayload {
  boxes: Array<{
    id?: string;
    modelDefinitionId: string;
    runtimeInputsJson: Record<string, any>;
    uiDisplayOrder: number;
  }>;
}

// Type for the payload to generate plank list
interface GeneratePlanksPayload {
  boxes: Array<{
    modelDefinitionId: string;
    modelName: string;
    inputs: Record<string, any>;
    boxNumber: string;
  }>;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ subtask, project, projectId: projectIdFromProp }) => {
  // Log props to debug
  console.log("ModelSelector props:", { subtask, project, projectIdFromProp });

  // Prioritize projectIdFromProp, then project.id
  const idToUse = projectIdFromProp !== undefined ? projectIdFromProp : project?.id;
  const numericProjectId = typeof idToUse === 'string' ? parseInt(idToUse, 10) : idToUse;

  console.log("Using numericProjectId:", numericProjectId, "From prop:", projectIdFromProp, "From project object:", project?.id);

  const { data: fetchedCatalogueModels, loading: templatesLoading, error: templatesError } = useGet<CatalogueModel[]>('/v1/catalogue');

  // For the project instances API, construct the URL using the numericProjectId
  const projectInstancesUrl = numericProjectId && !isNaN(numericProjectId)
    ? `/api/projects/${numericProjectId}/model-instances` // Changed path
    : '';
  console.log("Project instances URL:", projectInstancesUrl);

  const {
    data: fetchedProjectInstances,
    loading: instancesLoading,
    error: instancesError,
    refetch: refetchProjectInstances
  } = useGet<ProjectModelInstanceType[]>(
    projectInstancesUrl,
    !projectInstancesUrl // Skip the request if the URL is empty (i.e., projectId is invalid or missing)
  );
  
  const { execute: saveBoxConfiguration, loading: savingConfig, error: saveConfigError } = usePost<ProjectModelInstanceType[], SaveBoxPayload>();
  const { execute: saveBoxInstance, loading: savingSingleBox, error: saveSingleBoxError } = usePost<ProjectModelInstanceType, any>();
  const { execute: updateBoxInstance, loading: updatingSingleBox, error: updateSingleBoxError } = usePut<ProjectModelInstanceType, any>();
  const { execute: deleteBoxInstance, loading: deletingSingleBox, error: deleteSingleBoxError } = useDelete<any>();
  const { data: generatedPlanks, loading: generationLoading, error: generationApiError, refetch: refetchPlanks } = useGet<{ message: string; plankList: any[] }>(
    numericProjectId && !isNaN(numericProjectId) ? `/api/bim/plank-generation/projects/${numericProjectId}` : '',
    true // Skip initial fetch
  );

  const [catalogueModels, setCatalogueModels] = useState<CatalogueModel[]>([]);
  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  const [isLoadingBoxes, setIsLoadingBoxes] = useState<boolean>(true);
  const [generatedPlankList, setGeneratedPlankList] = useState<any[] | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Load catalogue models
  useEffect(() => {
    if (fetchedCatalogueModels) {
      setCatalogueModels(fetchedCatalogueModels);
    }
  }, [fetchedCatalogueModels]);
  
  // Update generatedPlankList when generatedPlanks changes
  useEffect(() => {
    if (generatedPlanks?.plankList) {
      setGeneratedPlankList(generatedPlanks.plankList);
    }
  }, [generatedPlanks]);

  // Set loading state when projectId changes
  useEffect(() => {
    if (numericProjectId && !isNaN(numericProjectId)) {
      setIsLoadingBoxes(true);
    }
  }, [numericProjectId]);

  // Load project model instances (boxes)
  useEffect(() => {
    if (instancesLoading) {
      setIsLoadingBoxes(true);
      return;
    }
    
    if (fetchedProjectInstances) {
      const loadedBoxes: BoxItem[] = fetchedProjectInstances.map(instance => ({
        id: instance.id,
        selectedModelId: instance.modelDefinitionId,
        inputValues: (instance.runtimeInputsJson as Record<string, any>) || {},
      }));
      
      // If we have loaded boxes, use them; otherwise create a default empty box
      setBoxes(loadedBoxes.length > 0 ? loadedBoxes : [{ 
        id: `box-${Date.now()}`, 
        selectedModelId: null, 
        inputValues: {} 
      }]);
    } else if (!instancesLoading && numericProjectId && !isNaN(numericProjectId) && !instancesError) {
      // If fetch is done, no instances, and no error, initialize with one empty box
      setBoxes([{ id: `box-${Date.now()}`, selectedModelId: null, inputValues: {} }]);
    }
    
    setIsLoadingBoxes(false);
  }, [fetchedProjectInstances, instancesLoading, numericProjectId, instancesError]);

  // Helper to find model definition by ID
  const findModelDefinitionById = useCallback((modelId: string | null): CatalogueModel | undefined => {
    if (!modelId) return undefined;
    return catalogueModels.find(m => m.id === modelId);
  }, [catalogueModels]);

  // Get default values for a model's input parameters
  const getModelDefaults = useCallback((modelId: string | null): Record<string, any> => {
    const model = findModelDefinitionById(modelId);
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
    
    return defaultInputs;
  }, [findModelDefinitionById]);
  
  // Add a new box
  const handleAddBox = () => {
    setBoxes(prevBoxes => [
      ...prevBoxes,
      { id: `box-${Date.now()}`, selectedModelId: null, inputValues: {}, isModified: true }
    ]);
  };

  // Remove a box
  const handleRemoveBox = (boxIdToRemove: string) => {
    setBoxes(prevBoxes => {
      const newBoxes = prevBoxes.filter(box => box.id !== boxIdToRemove);
      return newBoxes.map(box => ({ ...box, isModified: true }));
    });
  };

  // Move a box up or down in the list
  const handleMoveBox = (boxId: string, direction: 'up' | 'down') => {
    setBoxes(prevBoxes => {
      const index = prevBoxes.findIndex(box => box.id === boxId);
      if (index === -1) return prevBoxes;

      const newBoxes = [...prevBoxes];
      if (direction === 'up' && index > 0) {
        [newBoxes[index - 1], newBoxes[index]] = [{...newBoxes[index], isModified: true}, {...newBoxes[index - 1], isModified: true}];
      } else if (direction === 'down' && index < newBoxes.length - 1) {
        [newBoxes[index + 1], newBoxes[index]] = [{...newBoxes[index], isModified: true}, {...newBoxes[index + 1], isModified: true}];
      }
      
      return newBoxes;
    });
  };

  // Select a model for a box
  const handleBoxModelSelect = (boxId: string, modelId: string | null) => {
    setBoxes(prevBoxes =>
      prevBoxes.map(box =>
        box.id === boxId
          ? { ...box, selectedModelId: modelId, inputValues: getModelDefaults(modelId), isModified: true }
          : box
      )
    );
    
    // Reset generated plank list when model changes
    setGeneratedPlankList(null);
  };

  // Update a box's input value
  const handleBoxInputChange = (boxId: string, inputName: string, value: any) => {
    setBoxes(prevBoxes =>
      prevBoxes.map(box =>
        box.id === boxId
          ? { ...box, inputValues: { ...box.inputValues, [inputName]: value }, isModified: true }
          : box
      )
    );
  };
  
  // Save box configuration to backend
  const handleSaveConfiguration = async () => {
    if (!numericProjectId || isNaN(numericProjectId)) {
      console.error("ProjectID is missing or invalid for save configuration:", numericProjectId);
      alert("Project ID is missing or invalid. Cannot save configuration.");
      return;
    }
    
    // Filter out boxes without a selected model and prepare payload
    const boxesToSave = boxes
      .filter(box => box.selectedModelId !== null)
      .map((box, index) => ({
        id: box.id.startsWith('box-') ? undefined : box.id, // Send DB id if available, else undefined for new
        modelDefinitionId: box.selectedModelId as string, // We filtered out null values above
        runtimeInputsJson: box.inputValues,
        uiDisplayOrder: index,
      }));
    
    if (boxesToSave.length === 0) {
      alert("No boxes with selected models to save.");
      return;
    }
    
    const payload: SaveBoxPayload = { boxes: boxesToSave };

    try {
      const result = await saveBoxConfiguration(`/api/projects/${numericProjectId}/model-instances/batch`, payload); // Corrected path
      
      // Assuming the backend returns the updated list of instances with their DB IDs
      if (result) {
        const updatedBoxesFromDb: BoxItem[] = result.map((instance: ProjectModelInstanceType) => ({
          id: instance.id,
          selectedModelId: instance.modelDefinitionId,
          inputValues: (instance.runtimeInputsJson as Record<string, any>) || {},
        }));
        
        setBoxes(updatedBoxesFromDb);
        alert("Configuration saved successfully!");
      }
    } catch (error) {
      console.error("Error saving box configuration:", error);
      alert(`Failed to save configuration: ${(error as Error).message}`);
    }
  };

  // Generate plank list for all boxes
  const handleGeneratePlanks = async () => {
    if (!token) {
      alert("Please ensure you are logged in.");
      return;
    }
    
    if (boxes.some(box => !box.selectedModelId)) {
      alert("Please select a model for all boxes.");
      return;
    }
    
    // Check if there are any unsaved boxes (either new or modified)
    if (boxes.some(box => box.id.includes('box-') || box.isModified)) {
      alert("Please save all boxes before generating the plank list.");
      return;
    }
    
    setGeneratedPlankList(null);

    // Prepare payload for plank generation
    const boxesForPlanks = boxes.map((box, index) => {
      // We've already checked that all boxes have a selectedModelId
      const modelId = box.selectedModelId as string; // Type assertion is safe here
      const model = findModelDefinitionById(modelId);
      return {
        modelDefinitionId: modelId,
        modelName: model?.name || '',
        inputs: box.inputValues,
        boxNumber: (index + 1).toString(), // Box number is 1-based for user display
      };
    });
    
    const payload: GeneratePlanksPayload = { boxes: boxesForPlanks };

    console.log("Attempting to generate plank list for project:", numericProjectId);
    refetchPlanks();
  };

  // Generate CSV content from plank data
  const generateCSVContent = (plankData: PlankDetails[]): string => { // Use PlankDetails type
    if (!plankData || plankData.length === 0) return '';
    
    // Headers match the PlankDetails interface and user request
    const headers = ["PlankID", "Width", "Length", "MaterialCode", "Holes", "Grooves"];
    
    const rows = plankData.map(plank => {
      // Ensure holes and grooves are stringified, even if empty arrays
      const holesString = JSON.stringify(plank.holes || []); 
      const groovesString = JSON.stringify(plank.grooves || []);
      
      return [
        plank.plankId,
        plank.width,
        plank.length, // Use 'length' as per PlankDetails
        plank.materialCode,
        holesString,
        groovesString
      ].map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','); // Handle null/undefined for safety
    });
    
    return [headers.join(','), ...rows].join('\n');
  };
  
  // Download CSV file
  const downloadCSV = (csvContent: string, filename: string) => {
    if (!csvContent) return;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
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

  // Handle download plank list
  const handleDownloadPlankList = () => {
    if (!generatedPlankList || generatedPlankList.length === 0) {
      alert("No plank list data available to download.");
      return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `plank-list_project-${numericProjectId || project?.id || 'unknown'}_${timestamp}.csv`;
    const csvData = generateCSVContent(generatedPlankList);
    
    downloadCSV(csvData, filename);
  };

  // Render input field based on parameter type
  const renderInputField = (
    boxId: string,
    key: string,
    inputType?: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT' | 'SELECT_MATERIAL', // Added SELECT_MATERIAL
    options?: string | null,
    displayLabel?: string | null,
    description?: string | null // Added description for consistency with BoxComponent
  ) => {
    const box = boxes.find(b => b.id === boxId);
    const currentValue = box?.inputValues[key] ?? '';

    if (inputType === 'NUMBER') {
      return (
        <input
          type="number"
          id={`${boxId}-${key}`}
          value={currentValue}
          onChange={(e) => handleBoxInputChange(boxId, key, e.target.value === '' ? null : Number(e.target.value))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      );
    } else if (inputType === 'BOOLEAN') {
      return (
        <input
          type="checkbox"
          id={`${boxId}-${key}`}
          checked={!!currentValue}
          onChange={(e) => handleBoxInputChange(boxId, key, e.target.checked)}
          className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
        />
      );
    } else if (inputType === 'SELECT' && options) {
      const selectOptions = options.split(',').map(opt => opt.trim());
      return (
        <select
          id={`${boxId}-${key}`}
          value={currentValue}
          onChange={(e) => handleBoxInputChange(boxId, key, e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        >
          <option value="">-- Select {displayLabel || key} --</option>
          {selectOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    } else if (inputType === 'SELECT_MATERIAL') {
      // Ensure numericProjectId is valid before rendering MaterialCodeSelector
      const currentProjectId = numericProjectId && !isNaN(numericProjectId) ? numericProjectId : undefined;
      return (
        <>
          <MaterialCodeSelector
            name={key}
            label="" // Label is handled by the caller or can be omitted if displayLabel is used
            value={currentValue}
            onChange={(value) => handleBoxInputChange(boxId, key, value)}
            projectId={currentProjectId} // Pass the projectId
          />
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </>
      );
    } else {
      return (
        <input
          type="text"
          id={`${boxId}-${key}`}
          value={currentValue}
          placeholder={`Enter ${displayLabel || key.replace(/([A-Z])/g, ' $1').trim()}`}
          onChange={(e) => handleBoxInputChange(boxId, key, e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      );
    }
  };

  // Handle saving a single box
  const handleSaveBox = async (boxId: string) => {
    console.log("handleSaveBox called with boxId:", boxId);
    console.log("Current numericProjectId:", numericProjectId, "Type:", typeof numericProjectId);
    
    if (!numericProjectId || isNaN(numericProjectId)) {
      console.error("ProjectID is missing or invalid:", numericProjectId);
      alert("Project ID is missing or invalid. Cannot save box.");
      return;
    }

    const box = boxes.find(b => b.id === boxId);
    if (!box || !box.selectedModelId) {
      alert("Box not found or no model selected.");
      return;
    }

    // Set saving state
    setBoxes(prevBoxes => 
      prevBoxes.map(b => 
        b.id === boxId ? { ...b, isSaving: true, saveError: undefined } : b
      )
    );

    try {
      const isNewBox = boxId.startsWith('box-');
      const boxIndex = boxes.findIndex(b => b.id === boxId);
      
      const payload = {
        modelDefinitionId: box.selectedModelId,
        runtimeInputsJson: box.inputValues,
        uiDisplayOrder: boxIndex
      };

      let result;
      const endpoint = isNewBox 
        ? `/api/projects/${numericProjectId}/model-instances` // Corrected path
        : `/api/projects/${numericProjectId}/model-instances/${boxId}`; // Corrected path
      
      console.log(`API Endpoint: ${endpoint}`);
      console.log("Payload:", JSON.stringify(payload, null, 2));
      
      try {
        if (isNewBox) {
          // Create new box
          console.log("Creating new box with saveBoxInstance");
          result = await saveBoxInstance(endpoint, payload);
          console.log("saveBoxInstance result:", result);
        } else {
          // Update existing box
          console.log("Updating existing box with updateBoxInstance");
          result = await updateBoxInstance(endpoint, payload);
          console.log("updateBoxInstance result:", result);
        }
      } catch (apiError) {
        console.error("API call failed:", apiError);
        throw apiError;
      }

      if (result) {
        // Update box in state with DB ID and reset modified flag
        setBoxes(prevBoxes => 
          prevBoxes.map(b => 
            b.id === boxId 
              ? { 
                  ...b, 
                  id: result.id, // Use the ID from the server
                  isSaving: false, 
                  isModified: false,
                  saveError: undefined
                } 
              : b
          )
        );
      }
    } catch (error) {
      console.error("Error saving box:", error);
      // Set error state
      setBoxes(prevBoxes => 
        prevBoxes.map(b => 
          b.id === boxId 
            ? { 
                ...b, 
                isSaving: false, 
                saveError: `Failed to save: ${(error as Error).message}` 
              } 
            : b
        )
      );
    }
  };

  // Handle deleting a single box
  const handleDeleteBox = async (boxId: string) => {
    console.log("handleDeleteBox called with boxId:", boxId);
    console.log("Current numericProjectId:", numericProjectId, "Type:", typeof numericProjectId);

    if (!numericProjectId || isNaN(numericProjectId)) {
      console.error("ProjectID is missing or invalid for delete:", numericProjectId);
      // If it's a new box (not saved to DB), just remove it from state locally
      if (boxId.startsWith('box-')) {
        handleRemoveBox(boxId);
      } else {
        alert("Project ID is missing or invalid. Cannot delete box from server.");
      }
      return;
    }
    
    // If it's a new box (not saved to DB), just remove it from state
    if (boxId.startsWith('box-')) {
      handleRemoveBox(boxId);
      return;
    }

    // Set deleting state
    setBoxes(prevBoxes => 
      prevBoxes.map(b => 
        b.id === boxId ? { ...b, isSaving: true, saveError: undefined } : b
      )
    );

    try {
      await deleteBoxInstance(`/api/projects/${numericProjectId}/model-instances/${boxId}`); // Corrected path
      
      // Remove box from state
      setBoxes(prevBoxes => prevBoxes.filter(b => b.id !== boxId));
    } catch (error) {
      console.error("Error deleting box:", error);
      // Set error state
      setBoxes(prevBoxes => 
        prevBoxes.map(b => 
          b.id === boxId 
            ? { 
                ...b, 
                isSaving: false, 
                saveError: `Failed to delete: ${(error as Error).message}` 
              } 
            : b
        )
      );
    }
  };

  // Show loading state
  if (templatesLoading || isLoadingBoxes) {
    return (
      <div className="flex items-center justify-center my-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading configuration...</span>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
      <h5 className="text-lg font-semibold text-gray-800 mb-4">Configure Project Boxes</h5>
      
    

      {/* Box list */}
      {boxes.map((box, index) => (
        <BoxComponent
          key={box.id}
          box={box}
          index={index}
          boxes={boxes}
          catalogueModels={catalogueModels}
          handleMoveBox={handleMoveBox}
          handleRemoveBox={handleRemoveBox}
          handleBoxModelSelect={handleBoxModelSelect}
          handleBoxInputChange={handleBoxInputChange}
          handleSaveBox={handleSaveBox}
          handleDeleteBox={handleDeleteBox}
          renderInputField={renderInputField}
          projectId={numericProjectId} // Add this line
        />
      ))}

      {/* Add new box button */}
      <Button 
        onClick={handleAddBox} 
        variant="outline" 
        className="mb-6 w-full border-dashed hover:border-solid hover:bg-gray-100"
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Add New Box
      </Button>
      
      {/* Save configuration button */}
      <Button 
        onClick={handleSaveConfiguration} 
        disabled={savingConfig || !numericProjectId || isNaN(numericProjectId) || boxes.length === 0}
        size="sm"
        className="w-full mb-2 bg-blue-600 hover:bg-blue-700 text-white"
      >
        {savingConfig && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Box Configuration
      </Button>
      
      {/* Save configuration error */}
      {saveConfigError && (
        <div className="my-2 p-2 bg-red-100 border border-red-200 rounded-md text-red-800 text-xs">
          <AlertCircle className="h-4 w-4 mr-1.5 inline-block" />
          <span className="font-semibold">Save Error:</span> {saveConfigError.message}
        </div>
      )}

      {/* Generate plank list button */}
      {boxes.length > 0 && (
        <Button 
          onClick={handleGeneratePlanks} 
          disabled={generationLoading || boxes.some(b => !b.selectedModelId) || savingConfig}
          size="sm"
          className="w-full mt-2" 
        >
          {generationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Plank List for All Boxes
        </Button>
      )}

      {/* Plank list generation success */}
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
              className="bg-white hover:bg-gray-50 text-green-700 border-green-300 hover:border-green-400 py-1 px-2 text-xs"
            >
              <Download className="mr-1.5 h-3 w-3" />
              Download CSV
            </Button>
          </div>
          <details className="mt-2">
            <summary className="text-xs text-gray-600 cursor-pointer hover:underline">View Raw Data ({generatedPlankList.length} planks)</summary>
            <pre className="mt-1 text-xs overflow-x-auto bg-white p-2 rounded max-h-60">
              {JSON.stringify(generatedPlankList, null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      {/* Empty plank list */}
      {generatedPlankList && generatedPlankList.length === 0 && !generationLoading && !generationApiError && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-200 rounded-md text-yellow-800 text-xs">
          <AlertCircle className="h-4 w-4 mr-1.5 inline-block" />
          <span className="font-semibold">Plank list generated, but it is empty.</span>
        </div>
      )}
      
      {/* Plank list generation error */}
      {generationApiError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md text-red-800 text-xs">
          <AlertCircle className="h-4 w-4 mr-1.5 inline-block" />
          <span className="font-semibold">Plank Generation Error:</span> {generationApiError.message}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
