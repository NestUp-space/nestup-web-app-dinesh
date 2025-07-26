"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/dashboard/button';
import { AlertCircle, Trash2, ArrowUp, ArrowDown, Save, Loader2 } from 'lucide-react';
import MaterialCodeSelector from './MaterialCodeSelector'; // Import MaterialCodeSelector

interface CatalogueModel {
  id: string;
  name: string;
  description: string | null;
  imageUrl?: string | null;
  inputParameters?: Array<{
    id: string;
    inputName: string;
    displayLabel?: string | null;
    inputType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT' | 'SELECT_MATERIAL'; // Added SELECT_MATERIAL
    defaultValue?: string | null;
    options?: string | null;
    unit?: string | null;
    description?: string | null;
  }>;
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

interface BoxComponentProps {
  box: BoxItem;
  index: number;
  boxes: BoxItem[];
  catalogueModels: CatalogueModel[];
  handleMoveBox: (boxId: string, direction: 'up' | 'down') => void;
  handleRemoveBox: (boxIdToRemove: string) => void;
  handleBoxModelSelect: (boxId: string, modelId: string | null) => void;
  handleBoxInputChange: (boxId: string, inputName: string, value: any) => void;
  handleSaveBox?: (boxId: string) => Promise<void>;
  handleDeleteBox?: (boxId: string) => Promise<void>;
  renderInputField: (
    boxId: string,
    key: string,
    inputType?: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT' | 'SELECT_MATERIAL', // Added SELECT_MATERIAL
    options?: string | null,
    displayLabel?: string | null,
    description?: string | null // Added description for prompt
  ) => React.ReactNode;
  projectId?: string | number; // Add projectId for MaterialCodeSelector
}

const BoxComponent: React.FC<BoxComponentProps> = ({
  box,
  index,
  boxes,
  catalogueModels,
  handleMoveBox,
  handleRemoveBox,
  handleBoxModelSelect,
  handleBoxInputChange,
  handleSaveBox,
  handleDeleteBox,
  renderInputField,
  projectId, // Destructure projectId
}) => {
  const currentModel = catalogueModels.find(m => m.id === box.selectedModelId);
  const isNewBox = box.id.startsWith('box-');

  return (
    <div key={box.id} className={`mb-6 p-4 border rounded-lg relative bg-white shadow-sm ${box.isModified ? 'border-amber-400' : 'border-gray-300'}`}>
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
        <h6 className="text-md font-semibold text-gray-700">Box {index + 1}</h6>
        <div className="flex items-center space-x-1">
          <Button
            onClick={() => handleMoveBox(box.id, 'up')}
            disabled={index === 0}
            size="sm"
            variant="ghost"
            className="p-1 disabled:opacity-50 hover:bg-gray-100"
          >
            <ArrowUp className="h-4 w-4 text-gray-600" />
          </Button>
          <Button
            onClick={() => handleMoveBox(box.id, 'down')}
            disabled={index === boxes.length - 1}
            size="sm"
            variant="ghost"
            className="p-1 disabled:opacity-50 hover:bg-gray-100"
          >
            <ArrowDown className="h-4 w-4 text-gray-600" />
          </Button>
          {boxes.length > 1 && (
            <Button
              onClick={() => handleRemoveBox(box.id)}
              variant="ghost"
              size="sm"
              className="ml-2 p-1 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {/* Model selection */}
      <div className="mb-4">
        <label htmlFor={`modelSelect-${box.id}`} className="block text-sm font-medium text-gray-700 mb-1">
          Select Model:
        </label>
        <select
          id={`modelSelect-${box.id}`}
          value={box.selectedModelId || ''}
          onChange={(e) => handleBoxModelSelect(box.id, e.target.value || null)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        >
          <option value="">-- Select a Model --</option>
          {catalogueModels.map(model => (
            <option key={model.id} value={model.id}>
              {model.name} {model.description ? `(${model.description.substring(0, 30)}${model.description.length > 30 ? '...' : ''})` : ''}
            </option>
          ))}
        </select>
      </div>
      {/* Model input parameters */}
      {currentModel && currentModel.inputParameters && currentModel.inputParameters.length > 0 && (
        <div className="space-y-4 mb-4">
          <h6 className="text-sm font-medium text-gray-600">Model Inputs for Box {index + 1}:</h6>
          {currentModel.inputParameters.map((param) => (
            <div key={param.id}>
              <label htmlFor={`${box.id}-${param.inputName}`} className="block text-sm font-medium text-gray-700 capitalize">
                {param.displayLabel || param.inputName.replace(/([A-Z])/g, ' $1').trim()}
                {param.unit ? ` (${param.unit})` : ''}
              </label>
              {param.inputType === 'SELECT_MATERIAL' ? (
                <>
                  <MaterialCodeSelector
                    name={param.inputName}
                    label="" // Label is already rendered above
                    value={box.inputValues[param.inputName] || ''}
                    onChange={(value) => handleBoxInputChange(box.id, param.inputName, value)}
                    projectId={projectId}
                  />
                  {param.description && <p className="text-xs text-gray-500 mt-1">{param.description}</p>}
                </>
              ) : (
                renderInputField(box.id, param.inputName, param.inputType, param.options, param.displayLabel, param.description)
              )}
            </div>
          ))}
        </div>
      )}
      {/* Box actions and status */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex-1">
          {box.isModified && (
            <span className="text-xs text-amber-600 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Unsaved changes
            </span>
          )}
          {box.saveError && (
            <span className="text-xs text-red-600 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {box.saveError}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          {handleSaveBox && (
            <Button
              onClick={() => handleSaveBox(box.id)}
              disabled={!box.isModified || box.isSaving || !box.selectedModelId}
              size="sm"
              variant="outline"
              className="text-xs py-1 px-2 h-8"
            >
              {box.isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Saving...
                </>
              ) : isNewBox ? (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  Create Box
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  Save Changes
                </>
              )}
            </Button>
          )}
          {handleDeleteBox && !isNewBox && (
            <Button
              onClick={() => handleDeleteBox(box.id)}
              disabled={box.isSaving}
              size="sm"
              variant="outline"
              className="text-xs py-1 px-2 h-8 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoxComponent;
