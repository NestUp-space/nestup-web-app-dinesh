/**
 * Plank Types
 * Types for model and plank definitions used in the model management system
 */

export interface RuntimeInput {
  inputName: string;
  displayLabel: string;
  defaultValue?: string | number;
  value?: string | number;
  type?: 'text' | 'number' | 'select';
  options?: string[];
}

export interface PlankDefinition {
  plankNumber: string;
  plankIdentifier: string;
  displayName: string;
  description?: string;
  order: number;
  widthLogic: string;
  lengthLogic: string;
  materialCode: string;
}

export interface Model {
  id: string;
  name: string;
  description?: string;
  runtimeInputs: RuntimeInput[];
  planks: PlankDefinition[];
}

export interface PlankDetails {
  plankId: string;
  plankNumber?: string;
  plankIdentifier?: string;
  displayName?: string;
  width: number;
  height?: number;
  length?: number;
  material?: string;
  materialCode?: string;
  order?: number;
  holes?: any[];
  grooves?: any[];
}

export interface CalculationResult {
  success: boolean;
  value?: any;
  error?: string;
}

export interface GlobalConstants {
  MATERIAL_THICKNESS: {
    expose: number;
    inner: number;
    back: number;
  };
  EDGE_BANDING: {
    INNER_EDGEBANDING: number;
    COLOR_EDGEBANDING: number;
  };
}

export const DEFAULT_GLOBAL_CONSTANTS: GlobalConstants = {
  MATERIAL_THICKNESS: {
    expose: 18,
    inner: 18,
    back: 6,
  },
  EDGE_BANDING: {
    INNER_EDGEBANDING: 1,
    COLOR_EDGEBANDING: 2,
  },
};
