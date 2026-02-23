"use client";

import React, { useState } from 'react';
import { CheckCircle, Wand2, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { safeEvaluateExpression, validateExpressionCode, SAMPLE_CONTEXT } from '@/utils/safeExpressionEvaluator';

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
    // Determine expected variable
    const expectedVar = label.toLowerCase().includes('width') ? 'Width'
      : label.toLowerCase().includes('length') || label.toLowerCase().includes('height') ? 'Height'
      : label.toLowerCase().includes('material') ? 'Material'
      : 'Width';

    // First validate the code structure
    const structureValidation = validateExpressionCode(code, expectedVar);
    if (!structureValidation.isValid) {
      return { isValid: false, error: structureValidation.error };
    }

    // Create safe evaluation context using sample data
    const evalContext = {
      runtimeInputs: { ...SAMPLE_INPUTS },
      globalConstants: globalConstants || DEFAULT_GLOBAL_CONSTANTS
    };

    // Use safe evaluator
    const result = safeEvaluateExpression(code, evalContext, expectedVar);
    
    if (!result.success) {
      return { isValid: false, error: result.error };
    }

    return { isValid: true, value: result.value as string | number | undefined };
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-dark-text-bw font-medium">{label}</Label>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFormat}
            title="Format code"
            className="text-xs"
          >
            <Wand2 className="h-3.5 w-3.5 mr-1.5" />
            Format
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleValidate}
            title="Check if code works correctly"
            className="text-xs"
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Check
          </Button>
        </div>
      </div>

      <div className="relative border border-light-bw rounded-md overflow-hidden bg-lightest-bw">
        <textarea
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setValidationResult(null);
          }}
          onPaste={handlePaste}
          className="w-full p-3 font-mono text-sm bg-transparent text-dark-text-bw placeholder:text-dark-text-bw/60 focus:outline-none focus:ring-1 focus:ring-theme-color"
          style={{ 
            resize: 'vertical',
            minHeight: '120px', // Adjusted min height
            lineHeight: '1.6',  // Slightly increased line height
            tabSize: 2
          }}
          placeholder={
            label.toLowerCase().includes('width') ? 'Enter width calculation (e.g., Width = boxDepth - 20;)'
            : label.toLowerCase().includes('length') || label.toLowerCase().includes('height') ? 'Enter height calculation (e.g., Height = boxHeight - 40;)'
            : label.toLowerCase().includes('material') ? 'Enter material selection (e.g., Material = innerMaterialCode;)'
            : 'Enter calculation logic...'
          }
        />
      </div>

      {validationResult && (
        <div 
          className={cn(
            "text-xs p-2.5 rounded-md flex items-start gap-2",
            validationResult.isValid && !validationResult.error && "bg-green-100 text-green-700 border border-green-200",
            validationResult.isValid && validationResult.error && "bg-yellow-100 text-yellow-700 border border-yellow-200",
            !validationResult.isValid && "bg-red-100 text-red-600 border border-red-200"
          )}
        >
          {validationResult.isValid && !validationResult.error && <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
          {validationResult.isValid && validationResult.error && <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
          {!validationResult.isValid && <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
          <span>
            {validationResult.isValid 
              ? validationResult.error
                ? `Code works but: ${validationResult.error}`
                : `Valid code (Sample output: ${
                    typeof validationResult.value === 'string' 
                      ? `"${validationResult.value}"` 
                      : validationResult.value
                  })`
              : `Error: ${validationResult.error}`}
          </span>
        </div>
      )}
    </div>
  );
}
