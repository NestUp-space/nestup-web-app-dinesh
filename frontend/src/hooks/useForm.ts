/**
 * Custom hook for form handling
 * Provides state management, validation, and error handling for forms
 */

import { useState, ChangeEvent } from 'react';

type FormErrors<T> = Partial<Record<keyof T, string>>;
type ValidationSchema<T> = Partial<Record<keyof T, (value: any) => string | null>>;

interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: ValidationSchema<T>;
  onSubmit?: (values: T) => void | Promise<void>;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Handle different input types
    let parsedValue: any = value;
    
    if (type === 'number') {
      parsedValue = value === '' ? undefined : Number(value);
    } else if (type === 'checkbox' && 'checked' in e.target) {
      parsedValue = (e.target as HTMLInputElement).checked;
    }
    
    setValues(prev => ({
      ...prev,
      [name]: parsedValue,
    }));
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
    
    // Validate field if schema exists
    if (validationSchema && validationSchema[name as keyof T]) {
      const validator = validationSchema[name as keyof T];
      const error = validator ? validator(parsedValue) : null;
      
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  };
  
  const setValue = (name: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
    
    // Validate field if schema exists
    if (validationSchema && validationSchema[name]) {
      const validator = validationSchema[name];
      const error = validator ? validator(value) : null;
      
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  };
  
  const validateForm = (): boolean => {
    if (!validationSchema) return true;
    
    const newErrors: FormErrors<T> = {};
    let isValid = true;
    
    // Validate all fields
    Object.keys(validationSchema).forEach(key => {
      const validator = validationSchema[key as keyof T];
      if (validator) {
        const error = validator(values[key as keyof T]);
        if (error) {
          newErrors[key as keyof T] = error;
          isValid = false;
        }
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    setSubmitError(null);
    
    // Mark all fields as touched
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    Object.keys(values).forEach(key => {
      allTouched[key as keyof T] = true;
    });
    setTouched(allTouched);
    
    const isValid = validateForm();
    if (!isValid || !onSubmit) return;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitError(null);
  };
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    setValue,
    handleSubmit,
    resetForm,
    validateForm,
  };
}
