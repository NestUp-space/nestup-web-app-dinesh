"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import MaterialCodeSelector from './MaterialCodeSelector';
import { useMaterialContext } from '@/context/MaterialContext';

interface CustomInputParameterListProps {
  inputParameters: any[]; // Replace 'any' with the correct type if available
}

const CustomInputParameterList: React.FC<CustomInputParameterListProps> = ({ inputParameters }) => {
  const { register, setValue, watch } = useFormContext();
  const { materials } = useMaterialContext();

  return (
    <div>
      {inputParameters.map((param, index) => (
        <div key={index} className="mb-4">
          <label htmlFor={`inputParameters[${index}].defaultValue`} className="block text-sm font-medium text-gray-700">
            {param.displayLabel}
          </label>
          {param.inputName === 'outerMaterialCode' || param.inputName === 'innerMaterialCode' ? (
            <MaterialCodeSelector
              name={`inputParameters[${index}].defaultValue`}
              label={param.displayLabel || ''}
              value={watch(`inputParameters[${index}].defaultValue`) || ''}
              onChange={(value: string) => setValue(`inputParameters[${index}].defaultValue`, value)}
            />
          ) : (
            <input
              type="text"
              id={`inputParameters[${index}].defaultValue`}
              {...register(`inputParameters[${index}].defaultValue`)}
              defaultValue={param.defaultValue || ''}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default CustomInputParameterList;
