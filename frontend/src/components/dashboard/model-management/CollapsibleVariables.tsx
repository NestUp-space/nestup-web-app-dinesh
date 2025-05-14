"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Save } from 'lucide-react';

interface RuntimeInput {
  inputName: string;
  displayLabel?: string | null;
  description?: string | null;
  inputType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT';
  options?: string | null;
  defaultValue?: string | null;
  unit?: string | null;
}

interface MaterialConfig {
  innerMaterial: {
    thickness: number; // IT
    laminateCode: string; // IC
    hasGrain: boolean;
    plyType: string;
  };
  exposeMaterial: {
    thickness: number; // ET
    laminateCode: string; // EC
    hasGrain: boolean;
    plyType: string;
  };
  backMaterial: {
    thickness: number; // BackPlankThickness
    laminateCode: string; // BC
    hasGrain: boolean;
    plyType: string;
  };
}

interface CollapsibleVariablesProps {
  runtimeInputs: RuntimeInput[];
  globalConstants: Record<string, any>;
  materialConfig?: MaterialConfig;
}

export default function CollapsibleVariables({
  runtimeInputs,
  globalConstants,
  materialConfig
}: CollapsibleVariablesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleToggle = () => {
    if (!isEditing) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setIsExpanded(true);
  };

  const renderVariableCard = (name: string, details: Record<string, unknown>, type: string, bgClass: string) => (
    <div className={`p-3 ${bgClass} rounded-md shadow-sm`}>
      <p className="font-mono text-sm font-semibold mb-1 text-indigo-800">{name}</p>
      {details && typeof details === 'object' && (
        <div className="text-xs space-y-1.5 ml-2">
          {Object.entries(details).map(([key, value]) => (
            <p key={key} className="text-gray-700">
              <span className="font-medium">{key}:</span> {typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : JSON.stringify(value)}
            </p>
          ))}
        </div>
      )}
      {type && <p className="text-xs text-indigo-600 mt-2 font-medium">Type: {type}</p>}
    </div>
  );

  return (
    <div className="border border-indigo-100 rounded-md bg-white shadow-sm">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-indigo-50"
        onClick={handleToggle}
      >
        <div className="flex items-center space-x-2">
          {isExpanded ? 
            <ChevronDown className="h-4 w-4 text-indigo-600" /> : 
            <ChevronRight className="h-4 w-4 text-indigo-600" />
          }
          <h4 className="text-sm font-semibold text-indigo-900">Available Variables</h4>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleEditToggle();
          }}
          className="text-indigo-600 hover:text-indigo-800"
        >
          {isEditing ? (
            <Save className="h-4 w-4" />
          ) : (
            <Edit3 className="h-4 w-4" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-indigo-100 space-y-6">
          {/* Runtime Inputs */}
          <div className="space-y-4">
            <h5 className="text-base font-semibold text-indigo-900">Runtime Inputs</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {runtimeInputs.map(input => (
                <div 
                  key={input.inputName}
                  className="p-3 bg-indigo-50 rounded-md text-xs border border-indigo-100"
                  title={input.description || undefined}
                >
                  <span className="font-mono text-indigo-800 font-semibold block mb-2">
                    {input.inputName}
                  </span>
                  <div className="space-y-1.5 text-gray-700">
                    {input.displayLabel && (
                      <p className="flex justify-between">
                        <span className="font-medium">Label:</span> {input.displayLabel}
                      </p>
                    )}
                    <p className="flex justify-between">
                      <span className="font-medium">Type:</span> {input.inputType}
                    </p>
                    {input.unit && (
                      <p className="flex justify-between">
                        <span className="font-medium">Unit:</span> {input.unit}
                      </p>
                    )}
                    {input.options && (
                      <p className="flex justify-between">
                        <span className="font-medium">Options:</span> {input.options}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Material Configuration */}
          {materialConfig && (
            <div className="space-y-4">
              <h5 className="text-base font-semibold text-indigo-900">Material Properties</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {renderVariableCard("Inner Material", materialConfig.innerMaterial, "MaterialConfig", "bg-green-50 border border-green-100")}
                {renderVariableCard("Expose Material", materialConfig.exposeMaterial, "MaterialConfig", "bg-green-50 border border-green-100")}
                {renderVariableCard("Back Material", materialConfig.backMaterial, "MaterialConfig", "bg-green-50 border border-green-100")}
              </div>
            </div>
          )}

          {/* Global Constants */}
          <div className="space-y-4">
            <h5 className="text-base font-semibold text-indigo-900">Global Constants</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(globalConstants).map(([category, values]) => {
                if (typeof values !== 'object' || values === null) return null;
                return (
                  <div 
                    key={category}
                    className="p-3 bg-purple-50 rounded-md text-xs border border-purple-100"
                  >
                    <div className="font-mono text-purple-800 font-semibold mb-2">
                      {category}
                    </div>
                    <div className="space-y-1.5">
                      {Object.entries(values as Record<string, unknown>).map(([key, value]) => (
                        <div key={key} className="text-gray-700">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
