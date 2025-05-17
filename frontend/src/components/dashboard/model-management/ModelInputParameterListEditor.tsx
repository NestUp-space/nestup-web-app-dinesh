"use client";

import React from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/dashboard/button';
import { Input } from '@/components/dashboard/input';
import { Label } from '@/components/dashboard/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/dashboard/select';
import { Trash2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// This type should align with the Zod schema in ModelBuilderForm.tsx
interface ModelInputParameterField {
  id?: string; 
  inputName: string;
  displayLabel: string;
  inputType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'SELECT' | 'SELECT_MATERIAL';
  defaultValue?: string | null;
  options?: string | null; 
  unit?: string | null;
  description?: string | null;
}

interface ModelFormData {
  inputParameters?: ModelInputParameterField[];
  // other fields from the main form schema...
}

export default function ModelInputParameterListEditor() {
  const { control, register, formState: { errors }, watch, setValue, getValues } = useFormContext<ModelFormData>(); 
  const { fields, append, remove } = useFieldArray({
    control,
    name: "inputParameters", 
  });

  const inputTypeOptions: ModelInputParameterField['inputType'][] = ['NUMBER', 'TEXT', 'BOOLEAN', 'SELECT', 'SELECT_MATERIAL'];

  const defaultMaterialDescription = "Users will be able to select the material for this box during run time from the list of materials added to the project.";

  return (
    <div className="space-y-6">
      {fields.map((field, index) => {
        const watchedInputType = watch(`inputParameters.${index}.inputType`);

        React.useEffect(() => {
          if (watchedInputType === 'SELECT_MATERIAL') {
            const currentDescription = getValues(`inputParameters.${index}.description`);
            if (!currentDescription || currentDescription.trim() === '') {
              setValue(`inputParameters.${index}.description`, defaultMaterialDescription, { shouldValidate: true, shouldDirty: true });
            }
          }
        }, [watchedInputType, index, setValue, getValues]);

        return (
          <div key={field.id} className="p-4 border border-light-bw rounded-lg space-y-4 relative bg-lightest-bw/50 shadow-sm">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              className="absolute top-3 right-3 text-red-500 hover:text-red-700 hover:bg-red-100/50"
              title="Remove Parameter"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1.5">
                <Label htmlFor={`inputParameters.${index}.inputName`}>Parameter Name (ID)</Label>
                <Input
                  id={`inputParameters.${index}.inputName`}
                  placeholder="e.g., boxWidth, hasDoor"
                  {...register(`inputParameters.${index}.inputName` as const)}
                  className={cn(errors.inputParameters?.[index]?.inputName && "border-red-500 focus-visible:ring-red-500")}
                />
                {errors.inputParameters?.[index]?.inputName && <p className="text-xs text-red-600 mt-1">{errors.inputParameters[index]?.inputName?.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`inputParameters.${index}.displayLabel`}>Display Label</Label>
                <Input
                  id={`inputParameters.${index}.displayLabel`}
                  placeholder="e.g., Box Width, Has Door?"
                  {...register(`inputParameters.${index}.displayLabel` as const)}
                  className={cn(errors.inputParameters?.[index]?.displayLabel && "border-red-500 focus-visible:ring-red-500")}
                />
                {errors.inputParameters?.[index]?.displayLabel && <p className="text-xs text-red-600 mt-1">{errors.inputParameters[index]?.displayLabel?.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1.5">
                <Label htmlFor={`inputParameters.${index}.inputType`}>Input Type</Label>
                <Controller
                  control={control}
                  name={`inputParameters.${index}.inputType`}
                  render={({ field: { onChange, value } }) => (
                    <Select onValueChange={onChange} value={value}>
                      <SelectTrigger id={`inputParameters.${index}.inputType`} className={cn(errors.inputParameters?.[index]?.inputType && "border-red-500 focus-visible:ring-red-500")}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {inputTypeOptions.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.inputParameters?.[index]?.inputType && <p className="text-xs text-red-600 mt-1">{errors.inputParameters[index]?.inputType?.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`inputParameters.${index}.defaultValue`}>Default Value</Label>
                <Input
                  id={`inputParameters.${index}.defaultValue`}
                  {...register(`inputParameters.${index}.defaultValue` as const)}
                />
              </div>
            </div>
            
            {watchedInputType === 'SELECT' && (
               <div className="space-y-1.5">
                <Label htmlFor={`inputParameters.${index}.options`}>Options (comma-separated)</Label>
                <Input
                  id={`inputParameters.${index}.options`}
                  placeholder="e.g., Option1,Option2,Option3"
                  {...register(`inputParameters.${index}.options` as const)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1.5">
                <Label htmlFor={`inputParameters.${index}.unit`}>Unit (if applicable)</Label>
                <Input
                  id={`inputParameters.${index}.unit`}
                  placeholder="e.g., mm, cm, pcs"
                  {...register(`inputParameters.${index}.unit` as const)}
                />
              </div>
               <div className="space-y-1.5">
                <Label htmlFor={`inputParameters.${index}.description`}>Description / Helper Text</Label>
                <textarea 
                  id={`inputParameters.${index}.description`}
                  rows={2}
                  placeholder="Brief description or helper text for this parameter"
                  {...register(`inputParameters.${index}.description` as const)}
                  className="block w-full rounded-md border border-light-bw bg-lightest-bw px-3 py-2 text-sm text-dark-text-bw ring-offset-lightest-bw placeholder:text-dark-text-bw/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-color focus-visible:ring-offset-2"
                />
              </div>
            </div>
          </div>
        );
      })}
      
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ 
          inputName: '', 
          displayLabel: '', 
          inputType: 'TEXT', 
          defaultValue: '', 
          options: '', 
          unit: '',
          description: '' 
        })}
        className="mt-4"
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Add Input Parameter
      </Button>
    </div>
  );
}
