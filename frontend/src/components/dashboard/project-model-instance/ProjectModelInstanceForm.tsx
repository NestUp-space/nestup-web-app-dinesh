"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR from 'swr';
import { apiClient } from '@/lib/api/client';
// import { Button } from '@/components/ui/button';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';

// Define the shape of ModelDefinition fetched for selection
interface ModelDefinitionOption {
  id: string;
  name: string;
  inputParameters?: Array<{
    inputName: string;
    displayLabel?: string | null;
    inputType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT';
    defaultValue?: string | null;
    options?: string | null; // Comma-separated string for SELECT options
    unit?: string | null;
    description?: string | null;
  }>;
}

// Define the form schema for creating a ProjectModelInstance
const projectModelInstanceFormSchema = z.object({
  modelDefinitionId: z.string().min(1, "Model definition is required"),
  runtimeInputs: z.record(z.any()), // Will be dynamically built
});
type ProjectModelInstanceFormData = z.infer<typeof projectModelInstanceFormSchema>;

interface ProjectModelInstanceFormProps {
  projectId: string; // To associate the instance with a project
  onSaveSuccess?: (instanceId: string) => void;
  onCancel?: () => void;
}

const fetcher = (url: string) => apiClient.get(url).then(res => res.data);

export default function ProjectModelInstanceForm({
  projectId,
  onSaveSuccess,
  onCancel,
}: ProjectModelInstanceFormProps) {
  const { data: modelDefinitions, error: modelDefinitionsError } = useSWR<ModelDefinitionOption[]>('/model-definitions', fetcher);
  
  const [selectedModel, setSelectedModel] = useState<ModelDefinitionOption | null>(null);

  const { control, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm<ProjectModelInstanceFormData>({
    resolver: zodResolver(projectModelInstanceFormSchema),
    defaultValues: {
      modelDefinitionId: '',
      runtimeInputs: {},
    },
  });

  const selectedModelId = watch('modelDefinitionId');

  useEffect(() => {
    if (selectedModelId && modelDefinitions) {
      const model = modelDefinitions.find(m => m.id === selectedModelId);
      setSelectedModel(model || null);
      // Reset runtimeInputs when model changes
      const defaultRuntimeInputs: Record<string, any> = {};
      model?.inputParameters?.forEach(param => {
        defaultRuntimeInputs[param.inputName] = param.defaultValue ?? '';
      });
      setValue('runtimeInputs', defaultRuntimeInputs);
    } else {
      setSelectedModel(null);
      setValue('runtimeInputs', {});
    }
  }, [selectedModelId, modelDefinitions, setValue]);

  const onSubmit: SubmitHandler<ProjectModelInstanceFormData> = async (data) => {
    console.log("Submitting ProjectModelInstance:", data);
    try {
      const payload = {
        projectId,
        modelDefinitionId: data.modelDefinitionId,
        runtimeInputsJson: data.runtimeInputs, // Send as JSON object
      };
      const response = await apiClient.post('/model-management/project-instances', payload);
      alert('Project Model Instance created successfully!');
      if (onSaveSuccess) onSaveSuccess(response.data.id);
      reset(); // Reset form after successful submission
      setSelectedModel(null);
    } catch (error: any) {
      console.error("Error creating project model instance:", error);
      alert(`Error: ${error.response?.data?.message || error.message || 'Failed to create instance.'}`);
    }
  };

  if (modelDefinitionsError) return <p>Error loading model definitions.</p>;
  if (!modelDefinitions) return <p>Loading model definitions...</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 border rounded-md">
      <div>
        <label htmlFor="modelDefinitionId" className="block text-sm font-medium text-gray-700 mb-1">Select Model</label>
        <Controller
          name="modelDefinitionId"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              id="modelDefinitionId"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">-- Select a Model --</option>
              {modelDefinitions.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          )}
        />
        {errors.modelDefinitionId && <p className="text-sm text-red-500 mt-1">{errors.modelDefinitionId.message}</p>}
      </div>

      {selectedModel && selectedModel.inputParameters && selectedModel.inputParameters.length > 0 && (
        <div className="space-y-4 pt-4 border-t mt-4">
          <h3 className="text-md font-semibold">Runtime Inputs for {selectedModel.name}</h3>
          {selectedModel.inputParameters.map(param => (
            <div key={param.inputName}>
              <label htmlFor={`runtimeInputs.${param.inputName}`} className="block text-sm font-medium text-gray-700 mb-1">
                {param.displayLabel || param.inputName} {param.unit ? `(${param.unit})` : ''}
              </label>
              {param.description && <p className="text-xs text-gray-500 mb-1">{param.description}</p>}
              
              <Controller
                name={`runtimeInputs.${param.inputName}`}
                control={control}
                defaultValue={param.defaultValue ?? ''}
                render={({ field }) => {
                  if (param.inputType === 'BOOLEAN') {
                    return (
                      <select {...field} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm">
                        <option value="">Select...</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    );
                  }
                  if (param.inputType === 'SELECT' && param.options) {
                    const optionsArray = param.options.split(',').map(opt => opt.trim());
                    return (
                      <select {...field} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm">
                        <option value="">-- Select {param.displayLabel || param.inputName} --</option>
                        {optionsArray.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    );
                  }
                  return (
                    <input
                      type={param.inputType === 'NUMBER' ? 'number' : 'text'}
                      {...field}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  );
                }}
              />
              {/* TODO: Add specific error display for runtimeInputs if Zod schema is enhanced */}
            </div>
          ))}
        </div>
      )}
      {errors.runtimeInputs && <p className="text-sm text-red-500 mt-1">{typeof errors.runtimeInputs.message === 'string' ? errors.runtimeInputs.message : 'Invalid runtime inputs.'}</p>}


      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !selectedModelId}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Add Model to Project'}
        </button>
      </div>
    </form>
  );
}
