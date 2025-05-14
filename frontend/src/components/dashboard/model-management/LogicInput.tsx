"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Info } from 'lucide-react';

interface LogicInputProps {
  label: string;
  name: string; // Form field name
  placeholder?: string;
  defaultValue?: string;
  tooltip?: string;
  runtimeInputs?: Array<{ inputName: string; displayLabel?: string | null; description?: string | null }>;
  globalConstants?: Record<string, any>;
  onValidate?: (value: string) => Promise<{ isValid: boolean; result?: any; error?: string }>;
  onChange?: (value: string) => void;
  className?: string;
}

export default function LogicInput({
  label,
  name,
  placeholder = 'Enter logic expression...',
  defaultValue = '',
  tooltip,
  runtimeInputs = [],
  globalConstants = {},
  onValidate,
  onChange,
  className = '',
}: LogicInputProps) {
  const { register, setValue, getValues, formState: { errors } } = useFormContext();
  const [value, setLocalValue] = useState(defaultValue);
  const [highlightedValue, setHighlightedValue] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [validationState, setValidationState] = useState<{ isValid: boolean | null; message: string | null }>({
    isValid: null,
    message: null,
  });
  const [isValidating, setIsValidating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Initialize with form value if available
  useEffect(() => {
    const formValue = getValues(name);
    if (formValue !== undefined && formValue !== value) {
      setLocalValue(formValue);
    }
  }, [getValues, name, value]);

  // Apply syntax highlighting
  useEffect(() => {
    let highlighted = value;

    // Highlight JavaScript keywords
    const jsKeywords = [
      'function', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 
      'continue', 'default', 'try', 'catch', 'throw', 'new', 'delete', 'typeof', 'instanceof',
      'var', 'let', 'const', 'true', 'false', 'null', 'undefined', 'this', 'class', 'extends',
      'super', 'import', 'export', 'from', 'as', 'async', 'await', 'yield'
    ];
    
    // Create a regex pattern for JavaScript keywords with word boundaries
    const jsKeywordPattern = new RegExp(`\\b(${jsKeywords.join('|')})\\b`, 'g');
    highlighted = highlighted.replace(jsKeywordPattern, '<span class="syntax-keyword">$1</span>');

    // Highlight runtimeInputs variables
    runtimeInputs.forEach(input => {
      const pattern = new RegExp(`(runtimeInputs\\.${input.inputName})`, 'g');
      highlighted = highlighted.replace(pattern, '<span class="syntax-variable">$1</span>');
    });

    // Highlight globalConstants variables
    Object.keys(globalConstants).forEach(key => {
      // First level constants
      const pattern = new RegExp(`(globalConstants\\.${key})`, 'g');
      highlighted = highlighted.replace(pattern, '<span class="syntax-constant">$1</span>');
      
      // Second level constants (if the constant is an object)
      if (typeof globalConstants[key] === 'object' && globalConstants[key] !== null) {
        Object.keys(globalConstants[key]).forEach(subKey => {
          const nestedPattern = new RegExp(`(globalConstants\\.${key}\\.${subKey})`, 'g');
          highlighted = highlighted.replace(nestedPattern, '<span class="syntax-constant">$1</span>');
        });
      }
    });

    // Highlight strings
    highlighted = highlighted.replace(/(["'`])(.*?)\1/g, '<span class="syntax-string">$1$2$1</span>');

    // Highlight numbers
    highlighted = highlighted.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="syntax-number">$1</span>');

    // Highlight comments
    highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="syntax-comment">$1</span>');
    
    // Set the highlighted value
    setHighlightedValue(highlighted);
  }, [value, runtimeInputs, globalConstants]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setValue(name, newValue, { shouldValidate: true });
    
    // Reset validation state when input changes
    setValidationState({ isValid: null, message: null });
    
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleValidate = async () => {
    if (!onValidate) return;
    
    setIsValidating(true);
    try {
      const result = await onValidate(value);
      setValidationState({
        isValid: result.isValid,
        message: result.isValid 
          ? `Valid! Result: ${JSON.stringify(result.result)}` 
          : `Error: ${result.error || 'Invalid logic'}`
      });
    } catch (error) {
      setValidationState({
        isValid: false,
        message: `Validation error: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Handle click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center mb-1">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {tooltip && (
          <div className="relative ml-2" ref={tooltipRef}>
            <button
              type="button"
              onClick={() => setShowTooltip(!showTooltip)}
              className="text-gray-400 hover:text-gray-500"
            >
              <Info size={16} />
            </button>
            {showTooltip && (
              <div className="absolute z-10 w-64 p-2 mt-2 text-sm text-gray-600 bg-white border rounded shadow-lg">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="code-editor">
        <pre
          className="absolute top-0 left-0 right-0 bottom-0 p-2 font-mono text-sm whitespace-pre-wrap overflow-auto bg-white pointer-events-none"
          dangerouslySetInnerHTML={{ __html: highlightedValue || '&nbsp;' }}
        />
        <textarea
          {...register(name)}
          ref={textareaRef}
          id={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="code-editor-textarea"
          style={{ caretColor: 'black', color: 'transparent' }}
        />
      </div>

      {errors[name] && (
        <p className="mt-1 text-sm text-red-600">
          {errors[name]?.message?.toString() || 'This field is required'}
        </p>
      )}

      <div className="flex justify-between mt-2">
        {onValidate && (
          <button
            type="button"
            onClick={handleValidate}
            disabled={isValidating}
            className="btn-secondary text-xs px-3 py-1"
          >
            {isValidating ? 'Validating...' : 'Validate Logic'}
          </button>
        )}
        
        {validationState.isValid !== null && (
          <div className={`text-xs p-1 rounded ${validationState.isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {validationState.message}
          </div>
        )}
      </div>

    </div>
  );
}
