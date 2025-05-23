"use client";

import React, { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/dashboard/button';
import { Subtask, Project } from '@/types';

interface DataCollectionSubtaskProps {
  subtask: Subtask;
  project: Project;
  onDataSaved: () => void;
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'date';
  options?: string[];
  required?: boolean;
  placeholder?: string;
  description?: string;
}

export const DataCollectionSubtask: React.FC<DataCollectionSubtaskProps> = ({
  subtask,
  project,
  onDataSaved
}) => {
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Parse metadata to get form configuration
    if (subtask.metadataJson) {
      try {
        const metadata = JSON.parse(subtask.metadataJson);
        if (metadata.formFields) {
          setFormFields(metadata.formFields);
          // Initialize form data with any existing values
          const initialData = metadata.savedData || {};
          setFormData(initialData);
        }
      } catch (e) {
        console.error('Error parsing subtask metadata:', e);
        setError('Failed to load form configuration');
      }
    }
  }, [subtask.metadataJson]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    setSaveSuccess(false); // Reset success state on any change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/${project.id}/tasks/${subtask.id}/data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ data: formData }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save data');
      }

      setSaveSuccess(true);
      onDataSaved();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save data');
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field: FormField) => {
    const commonProps = {
      id: field.id,
      value: formData[field.id] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        handleInputChange(field.id, e.target.value),
      required: field.required,
      placeholder: field.placeholder,
      className: `
        w-full p-3 border border-gray-200 rounded-lg
        focus:ring-2 focus:ring-blue-500 focus:border-blue-300
        disabled:bg-gray-50 disabled:cursor-not-allowed
        text-sm text-gray-900 placeholder-gray-400
        transition-colors duration-200
        hover:border-gray-300
      `
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={4}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select an option</option>
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
          />
        );

      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
          />
        );

      default:
        return (
          <input
            {...commonProps}
            type="text"
          />
        );
    }
  };

  if (!formFields.length) {
    return (
      <div className="h-full">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
            <AlertCircle className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No Form Configuration</h3>
          <p className="text-gray-500 text-sm">No form fields have been configured for this task.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="h-full">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 space-y-6">
          {formFields.map(field => (
            <div key={field.id} className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label
                  htmlFor={field.id}
                  className="block text-sm font-medium text-gray-700"
                >
                  {field.label}
                  {field.required && (
                    <span className="ml-1 text-red-500" title="Required field">*</span>
                  )}
                </label>
                {field.required && (
                  <span className="text-xs text-gray-400">Required</span>
                )}
              </div>
              <div className="relative">
                {renderField(field)}
                {field.type === 'select' && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              {error && (
                <div className="flex items-center text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              {saveSuccess && (
                <div className="flex items-center text-green-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm">Data saved successfully</span>
                </div>
              )}
            </div>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 shadow-sm transition-all duration-200"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Data</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default DataCollectionSubtask;
