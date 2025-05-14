"use client";

import React, { useState } from 'react';
import { CheckCircle, Wand2 } from 'lucide-react';

interface ExpressionInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  runtimeInputs: Array<{
    inputName: string;
    displayLabel?: string | null;
  }>;
  globalConstants: Record<string, any>;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  value?: number | string;
}

// Sample values for validation and tooltips
const SAMPLE_INPUTS = {
  boxDepth: 560,
  boxHeight: 720,
  leftAdjacency: 'Expose',
  rightAdjacency: 'Wall',
  skirting: 100,
  outerMaterialCode: 'OUT001',
  innerMaterialCode: 'IN001'
} as const;

const DEFAULT_GLOBAL_CONSTANTS = {
  MATERIAL_THICKNESS: {
    expose: 18,
    inner: 18,
    back: 6
  },
  EDGE_BANDING: {
    INNER_EDGEBANDING: 1,
    COLOR_EDGEBANDING: 2
  }
} as const;

export default function ExpressionInput({
  label,
  value,
  onChange,
  runtimeInputs,
  globalConstants
}: ExpressionInputProps): JSX.Element {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Code formatting logic
  const formatCode = (code: string): string => {
    // First, handle destructuring blocks
    const formatDestructuring = (code: string) => {
      return code.replace(
        /const\s*{([^}]+)}\s*=\s*(runtimeInputs|globalConstants);/g,
        (match, vars, source) => {
          const formattedVars = vars
            .split(',')
            .map((v: string) => v.trim())
            .join(',\n  ');
          return `const {\n  ${formattedVars}\n} = ${source};`;
        }
      );
    };

    // Format assignments
    const formatAssignments = (code: string) => {
      let formatted = code.replace(
        /let\s+(Width|Height|Material)\s*;/g,
        '\nlet $1;'
      );
      
      formatted = formatted.replace(
        /(\w+)\s*=\s*(.*?);/g,
        (match, variable, value) => {
          if (['Width', 'Height', 'Material'].includes(variable)) {
            return `${variable} = ${value.trim()};`;
          }
          return match;
        }
      );

      return formatted;
    };

    // Basic cleanup
    let formatted = code.replace(/\s+/g, ' ').trim();
    formatted = formatDestructuring(formatted);
    formatted = formatAssignments(formatted);

    // Format operators and structure
    formatted = formatted
      .replace(/\s*([+\-*\/(),])\s*/g, ' $1 ')    // Space around operators
      .replace(/\s+/g, ' ')                        // Clean double spaces
      .replace(/{\s+/g, '{\n  ')                  // Newline after opening brace
      .replace(/;\s+/g, ';\n  ')                  // Newline after semicolon
      .replace(/}\s+/g, '\n}')                    // Newline before closing brace
      .replace(/}\s*else\s*{/g, '} else {')       // Format else
      .replace(/if\s*\((.*?)\)\s*{/g, 'if ($1) {')// Format if
      .replace(/const\s+/g, '\nconst ')           // Newline before const
      .replace(/\/\/.*$/gm, '\n$&')               // Newline before comments
      .replace(/\n\s*\n/g, '\n')                  // Remove double newlines
      .replace(/^\s+/gm, '')                      // Remove leading spaces
      .split('\n')                                
      .map(line => line.trim())                   
      .join('\n')                                 
      .trim();                                    

    // Add proper indentation
    const lines = formatted.split('\n');
    let indent = 0;
    formatted = lines
      .map(line => {
        if (line.includes('}')) indent = Math.max(0, indent - 1);
        const indented = '  '.repeat(indent) + line;
        if (line.includes('{')) indent++;
        return indented;
      })
      .join('\n');

    return formatted;
  };

  const validateCode = (code: string): ValidationResult => {
    try {
      // Create safe evaluation context
      const evalContext = {
        runtimeInputs: { ...SAMPLE_INPUTS },
        globalConstants: DEFAULT_GLOBAL_CONSTANTS,
        Width: undefined as any
      };

      // Determine expected variable
      const expectedVar = label.toLowerCase().includes('width') ? 'Width'
        : label.toLowerCase().includes('length') || label.toLowerCase().includes('height') ? 'Height'
        : label.toLowerCase().includes('material') ? 'Material'
        : 'Width';

      // Construct the complete code with boilerplate
      const wrapped = `
        // Runtime inputs
        const {
          boxDepth, boxHeight, leftAdjacency, rightAdjacency,
          skirting, outerMaterialCode, innerMaterialCode
        } = runtimeInputs;

        // Global constants
        const {
          MATERIAL_THICKNESS,
          EDGE_BANDING
        } = globalConstants;

        // Variable declaration
        let ${expectedVar};

        // User's core logic
        ${code}

        // Return value
        return ${expectedVar};
      `;

      // Execute the complete code
      const fn = new Function('runtimeInputs', 'globalConstants', wrapped);
      const result = fn(evalContext.runtimeInputs, evalContext.globalConstants);

      // Validate result based on type
      if (expectedVar === 'Material') {
        if (typeof result !== 'string') {
          return { isValid: false, error: 'Material code must return a string value' };
        }
        if (!result) {
          return { isValid: false, error: 'Material code cannot be empty' };
        }
      } else {
        if (typeof result !== 'number') {
          return { isValid: false, error: `${expectedVar} must be a numeric value` };
        }
        if (result <= 0) {
          return { isValid: false, error: `${expectedVar} must be greater than 0` };
        }
      }

      // Check if code uses correct variable name
      if (!code.includes(`${expectedVar} =`)) {
        return { 
          isValid: false, 
          error: `Code must use '${expectedVar} =' to assign the ${label.toLowerCase()} value`
        };
      }

      return { isValid: true, value: result };
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { isValid: false, error: err.message };
      }
      return { isValid: false, error: 'An unknown error occurred' };
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const formatted = formatCode(pastedText);
    onChange(formatted);
  };

  const handleFormat = () => {
    const formatted = formatCode(value);
    onChange(formatted);
  };

  const handleValidate = () => {
    const result = validateCode(value);
    setValidationResult(result);

    if (result.isValid && value !== formatCode(value)) {
      const formattedResult = validateCode(formatCode(value));
      if (formattedResult.isValid && formattedResult.value === result.value) {
        setValidationResult({
          ...result,
          error: 'Code works but could be better formatted. Try using the Format button!'
        });
      }
    }
  };


  return (
    <div className="space-y-3">
      {/* Label and Buttons */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleFormat}
            className="flex items-center space-x-1 text-xs text-indigo-500 hover:text-indigo-700 px-2 py-1 border border-indigo-200 rounded-md"
            title="Format code"
          >
            <Wand2 className="h-3 w-3" />
            <span>Format</span>
          </button>
          <button
            type="button"
            onClick={handleValidate}
            className="flex items-center space-x-1 text-xs text-green-500 hover:text-green-700 px-2 py-1 border border-green-200 rounded-md"
            title="Check if code works correctly"
          >
            <CheckCircle className="h-3 w-3" />
            <span>Check</span>
          </button>
        </div>
      </div>

      {/* Main Input Area */}
      <div className="relative border rounded-md overflow-hidden bg-white">
        <div className="code-editor relative">
          <textarea
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setValidationResult(null);
            }}
            onPaste={handlePaste}
            className="w-full p-3 font-mono text-sm"
            style={{ 
              resize: 'vertical',
              minHeight: '120px',
              lineHeight: '1.5',
              tabSize: 2
            }}
            placeholder={
              label.toLowerCase().includes('width') ? 'Enter width calculation (use "Width =" to assign value)'
              : label.toLowerCase().includes('length') || label.toLowerCase().includes('height') ? 'Enter height calculation (use "Height =" to assign value)'
              : label.toLowerCase().includes('material') ? 'Enter material selection (use "Material =" to assign value)'
              : 'Enter calculation logic...'
            }
          />
        </div>
      </div>

      {/* Validation Result */}
      {validationResult && (
        <div 
          className={`text-sm p-2 rounded ${
            validationResult.isValid 
              ? validationResult.error 
                ? 'bg-yellow-50 text-yellow-700'
                : 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}
        >
          {validationResult.isValid 
            ? validationResult.error
              ? `✓ Code works but: ${validationResult.error}`
              : `✓ Valid code (Sample output: ${
                  typeof validationResult.value === 'string' 
                    ? `"${validationResult.value}"` 
                    : validationResult.value
                })`
            : `✗ Error: ${validationResult.error}`}
        </div>
      )}

      {/* Helper text and Variable Reference */}
      <div className="text-xs text-gray-500 mt-1 space-y-2">
        {/* Used variables section */}
        <div>
          <span className="font-medium">Used variables:</span>{' '}
          {value ? (
            <span>
              <div className="space-y-1">
                {/* Runtime Inputs */}
                {Array.from(new Set(
                  [
                    ...Array.from(value.matchAll(/\bruntimeInputs\.(\w+)/g)).map(m => m[1]),
                    ...Array.from(value.matchAll(/(?:const\s*{[^}]*\b(\w+)\b[^}]*}\s*=\s*runtimeInputs)/g)).map(m => m[1])
                  ]
                )).sort().map((v) => (
                  <span key={v} className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded mr-1 mb-1">
                    {v}
                  </span>
                ))}
                {/* Global Constants */}
                {Array.from(new Set(
                  [
                    ...Array.from(value.matchAll(/\bglobalConstants\.([A-Z_]+(?:\.[A-Z_]+)*)\b/g)).map(m => m[1]),
                    ...Array.from(value.matchAll(/(?:const\s*{[^}]*\b([A-Z_]+(?:\.[A-Z_]+)*)\b[^}]*}\s*=\s*globalConstants)/g)).map(m => m[1])
                  ]
                )).sort().map((v) => (
                  <span key={v} className="inline-block px-1.5 py-0.5 bg-green-50 text-green-600 rounded mr-1 mb-1">
                    {v}
                  </span>
                ))}
              </div>
            </span>
          ) : (
            <span className="text-gray-400 italic">No variables used yet</span>
          )}
        </div>

        {/* Available variables section */}
        <div className="space-y-2">
          <div>
            <span className="font-medium">Runtime inputs:</span>
            <div className="mt-1">
              {runtimeInputs.slice(0, 5).map((input) => (
                <span 
                  key={input.inputName} 
                  className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded mr-1 mb-1 cursor-pointer hover:bg-blue-100"
                  onClick={() => {
                    if (value.includes('const {') && !value.includes('}') && value.includes('runtimeInputs')) {
                      onChange(value + `\n  ${input.inputName},`);
                    } else {
                      onChange(value + ` ${input.inputName}`);
                    }
                  }}
                  title={`${input.inputName}: ${
                    typeof SAMPLE_INPUTS[input.inputName as keyof typeof SAMPLE_INPUTS] === 'string'
                      ? `"${SAMPLE_INPUTS[input.inputName as keyof typeof SAMPLE_INPUTS]}"`
                      : SAMPLE_INPUTS[input.inputName as keyof typeof SAMPLE_INPUTS]
                  }\n\nClick to insert`}
                >
                  {input.inputName}
                </span>
              ))}
              {runtimeInputs.length > 5 && <span>...</span>}
            </div>
          </div>

          <div>
            <span className="font-medium">Constants:</span>
            <div className="mt-1">
              {['MATERIAL_THICKNESS', 'EDGE_BANDING'].map((group) => {
                const tooltip = Object.entries(DEFAULT_GLOBAL_CONSTANTS[group as keyof typeof DEFAULT_GLOBAL_CONSTANTS])
                  .map(([key, value]) => `${key}: ${value}${
                    group === 'MATERIAL_THICKNESS' ? ' mm' : 
                    group === 'EDGE_BANDING' ? ' mm' : ''
                  }`)
                  .join('\n');

                return (
                  <span 
                    key={group}
                    className="inline-block px-1.5 py-0.5 bg-green-50 text-green-700 rounded mr-1 mb-1 cursor-pointer hover:bg-green-100"
                    onClick={() => {
                      if (value.includes('const {') && !value.includes('}') && value.includes('globalConstants')) {
                        onChange(value + `\n  ${group},`);
                      } else {
                        onChange(value + ` ${group}`);
                      }
                    }}
                    title={`${group}:\n${tooltip}\n\nClick to insert`}
                  >
                    {group}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Code Format Info */}
        <div className="mt-4 text-gray-500">
          <p>Write only the core logic for {label.toLowerCase()}. The system will automatically handle:</p>
          <ul className="list-disc ml-4 mt-1">
            <li>Variable declarations and imports</li>
            <li>Return statement</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
