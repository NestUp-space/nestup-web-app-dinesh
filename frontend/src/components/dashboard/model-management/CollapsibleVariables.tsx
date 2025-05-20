"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react'; // Removed Edit3, Save as they are not used

interface RuntimeInput {
  inputName: string;
  displayLabel?: string | null;
  description?: string | null;
  inputType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT' | 'SELECT_MATERIAL'; // Added SELECT_MATERIAL
  options?: string | null;
  defaultValue?: string | null;
  unit?: string | null;
}

interface MaterialConfig {
  innerMaterial: {
    thickness: number; 
    laminateCode: string; 
    hasGrain: boolean;
    plyType: string;
  };
  exposeMaterial: {
    thickness: number; 
    laminateCode: string; 
    hasGrain: boolean;
    plyType: string;
  };
  backMaterial: {
    thickness: number; 
    laminateCode: string; 
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

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const renderVariableCard = (name: string, details: Record<string, unknown> | string | number | boolean | null, typeLabel: string, cardBgClass: string, textClass: string, titleClass: string) => (
    <div className={`p-3 ${cardBgClass} rounded-md shadow-sm border border-light-bw`}>
      <p className={`font-mono text-sm font-semibold mb-1 ${titleClass}`}>{name}</p>
      {details && typeof details === 'object' ? (
        <div className={`text-xs space-y-1 ml-2 ${textClass}`}>
          {Object.entries(details).map(([key, value]) => (
            <p key={key}>
              <span className="font-medium">{key}:</span> {typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : JSON.stringify(value)}
            </p>
          ))}
        </div>
      ) : (
        <p className={`text-xs ${textClass}`}>{String(details)}</p>
      )}
      {/* <p className={`text-xs ${titleClass}/70 mt-2 font-medium`}>Type: {typeLabel}</p> */}
    </div>
  );

  return (
    <div className="border border-light-bw rounded-lg bg-lightest-bw shadow-sm">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-lighter-bw/50 transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center space-x-2">
          {isExpanded ? 
            <ChevronDown className="h-5 w-5 text-dark-text-bw/80" /> : 
            <ChevronRight className="h-5 w-5 text-dark-text-bw/80" />
          }
          <h4 className="text-sm font-semibold text-dark-text-bw">Available Variables for Logic</h4>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-light-bw space-y-6">
          <div className="space-y-3">
            <h5 className="text-base font-semibold text-dark-text-bw">Runtime Inputs (from Model Parameters)</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {runtimeInputs.map(input => (
                renderVariableCard(
                  input.inputName, 
                  { 
                    Label: input.displayLabel || 'N/A', 
                    Type: input.inputType, 
                    Unit: input.unit || '-',
                    Options: input.options || '-',
                    Default: input.defaultValue || 'None'
                  },
                  "Runtime Input",
                  "bg-lightest-bw", 
                  "text-dark-text-bw/80",
                  "text-theme-color"
                )
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-base font-semibold text-dark-text-bw">Global Constants (System Defined)</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(globalConstants).map(([category, values]) => {
                if (typeof values !== 'object' || values === null) {
                   return renderVariableCard(category, values, "Global Constant", "bg-lightest-bw", "text-dark-text-bw/80", "text-theme-color");
                }
                return (
                  <div key={category} className="p-3 bg-lightest-bw rounded-md text-xs border border-light-bw shadow-sm">
                    <div className="font-mono text-theme-color font-semibold mb-2">
                      {category}
                    </div>
                    <div className="space-y-1.5">
                      {Object.entries(values as Record<string, unknown>).map(([key, value]) => (
                        <div key={key} className="text-dark-text-bw/80">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
           <p className="text-xs text-dark-text-bw/60 italic">
              Note: These variables can be used in your plank logic scripts. Runtime Inputs are dynamic based on user selection, while Global Constants are fixed system values.
            </p>
        </div>
      )}
    </div>
  );
}
