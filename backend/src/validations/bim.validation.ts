import { z } from 'zod';

/**
 * @description Validation schema for creating a plank list
 * This is a generic schema that will be refined based on the model type
 */
export const createPlankListSchema = z.object({
  // Common fields for all models
  // Specific fields will be validated in the service based on the model type
}).passthrough(); // Allow additional properties based on model type

/**
 * @description Validation schema for Simple Box model inputs
 */
export const simpleBoxInputsSchema = z.object({
  boxHeight: z.number().positive('Box height must be a positive number'),
  boxWidth: z.number().positive('Box width must be a positive number'),
  boxDepth: z.number().positive('Box depth must be a positive number'),
  leftAdjacency: z.enum(['Expose', 'Box', 'Wall'], {
    errorMap: () => ({ message: 'Left adjacency must be one of: Expose, Box, Wall' }),
  }),
  rightAdjacency: z.enum(['Expose', 'Box', 'Wall'], {
    errorMap: () => ({ message: 'Right adjacency must be one of: Expose, Box, Wall' }),
  }),
  outerMaterialCode: z.string().min(1, 'Outer material code is required'),
  innerMaterialCode: z.string().min(1, 'Inner material code is required'),
  backMaterialCode: z.string().min(1, 'Back material code is required'),
  door: z
    .object({
      hasDoor: z.boolean(),
      exposedSide: z.enum(['left', 'right', 'top', 'bottom']).optional(),
    })
    .optional(),
  numberOfShelves: z.number().int().min(0, 'Number of shelves must be a non-negative integer'),
});

/**
 * @description Validation schema for L-Shaped Box model inputs
 */
export const lShapedBoxInputsSchema = z.object({
  mainBoxHeight: z.number().positive('Main box height must be a positive number'),
  mainBoxWidth: z.number().positive('Main box width must be a positive number'),
  mainBoxDepth: z.number().positive('Main box depth must be a positive number'),
  secondaryBoxHeight: z.number().positive('Secondary box height must be a positive number'),
  secondaryBoxWidth: z.number().positive('Secondary box width must be a positive number'),
  secondaryBoxDepth: z.number().positive('Secondary box depth must be a positive number'),
  leftAdjacency: z.enum(['Expose', 'Box', 'Wall'], {
    errorMap: () => ({ message: 'Left adjacency must be one of: Expose, Box, Wall' }),
  }),
  rightAdjacency: z.enum(['Expose', 'Box', 'Wall'], {
    errorMap: () => ({ message: 'Right adjacency must be one of: Expose, Box, Wall' }),
  }),
  backAdjacency: z.enum(['Expose', 'Box', 'Wall'], {
    errorMap: () => ({ message: 'Back adjacency must be one of: Expose, Box, Wall' }),
  }),
  outerMaterialCode: z.string().min(1, 'Outer material code is required'),
  innerMaterialCode: z.string().min(1, 'Inner material code is required'),
  backMaterialCode: z.string().min(1, 'Back material code is required'),
  door: z
    .object({
      hasDoor: z.boolean(),
      exposedSide: z.enum(['left', 'right', 'top', 'bottom']).optional(),
    })
    .optional(),
  numberOfShelves: z.number().int().min(0, 'Number of shelves must be a non-negative integer'),
});

/**
 * @description Validation schema for a plank
 */
export const plankSchema = z.object({
  plankId: z.string().min(1, 'Plank ID is required'),
  name: z.string().min(1, 'Plank name is required'),
  width: z.number().positive('Width must be a positive number').nullable(),
  height: z.number().positive('Height must be a positive number').nullable(),
  materialCode: z.string().nullable(),
  grainDirection: z.string().nullable(),
  thickness: z.number().positive('Thickness must be a positive number').optional(),
  edgeBanding: z
    .object({
      top: z.string().optional(),
      right: z.string().optional(),
      bottom: z.string().optional(),
      left: z.string().optional(),
    })
    .optional(),
  sheetAssignment: z.string().optional(),
  sheetPosition: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

/**
 * @description Validation schema for a list of planks
 */
export const plankListSchema = z.array(plankSchema);

/**
 * @description Validation schema for material properties
 */
export const materialPropertiesSchema = z.object({
  innerLaminate: z.string(),
  outerLaminate: z.string(),
  plyThickness_mm: z.number().positive('Ply thickness must be a positive number'),
  overallMaterialThickness_mm: z.number().positive('Overall material thickness must be a positive number'),
  plyType: z.string(),
});

/**
 * @description Validation schema for a cut operation
 */
export const cutOperationSchema = z.object({
  plankId: z.string().min(1, 'Plank ID is required'),
  materialCode: z.string().min(1, 'Material code is required'),
  width: z.number().positive('Width must be a positive number'),
  height: z.number().positive('Height must be a positive number'),
  sheetId: z.string().min(1, 'Sheet ID is required'),
  position: z.object({
    x: z.number().min(0, 'X position must be non-negative'),
    y: z.number().min(0, 'Y position must be non-negative'),
  }),
  rotation: z.boolean(),
});

/**
 * @description Validation schema for a sheet layout
 */
export const sheetLayoutSchema = z.object({
  sheetId: z.string().min(1, 'Sheet ID is required'),
  materialCode: z.string().min(1, 'Material code is required'),
  width: z.number().positive('Width must be a positive number'),
  height: z.number().positive('Height must be a positive number'),
  cuts: z.array(cutOperationSchema),
  wastePercentage: z.number().min(0, 'Waste percentage must be non-negative').max(100, 'Waste percentage must be at most 100'),
});

/**
 * @description Validation schema for a cut list
 */
export const cutListSchema = z.object({
  sheets: z.array(sheetLayoutSchema),
  totalSheets: z.number().int().min(0, 'Total sheets must be a non-negative integer'),
  totalPlanks: z.number().int().min(0, 'Total planks must be a non-negative integer'),
  averageWastePercentage: z.number().min(0, 'Average waste percentage must be non-negative').max(100, 'Average waste percentage must be at most 100'),
});

/**
 * @description Validation schema for generating a cut list
 */
export const generateCutListSchema = z.object({
  plankList: plankListSchema,
  materialProperties: z.record(materialPropertiesSchema).optional(),
});

/**
 * @description Validation schema for downloading a cut list
 */
export const downloadCutListSchema = z.object({
  cutList: cutListSchema,
});

/**
 * @description Validation schema for generating G-code
 */
export const generateGCodeSchema = z.object({
  cutList: cutListSchema,
});

/**
 * @description Validation schema for visualizing planks
 */
export const visualizePlanksSchema = z.object({
  plankList: plankListSchema,
  title: z.string().optional(),
});

/**
 * @description Validation schema for validating model inputs
 * This is a generic schema that will be refined based on the model type
 */
export const validateModelInputsSchema = z.object({
  // Allow any properties, validation will be done in the service based on the model type
}).passthrough();

/**
 * @description Get the appropriate validation schema for a model type
 * @param modelType The type of the model
 * @returns The validation schema for the model type
 */
export function getModelValidationSchema(modelType: string): z.ZodSchema<any> {
  switch (modelType) {
    case 'Simple Box':
      return simpleBoxInputsSchema;
    case 'L-Shaped Box':
      return lShapedBoxInputsSchema;
    default:
      // For unknown model types, use a passthrough schema
      return z.object({}).passthrough();
  }
}
