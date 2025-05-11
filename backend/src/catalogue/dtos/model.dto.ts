import { z } from 'zod';
import { BomItemType } from '@prisma/client';

// --- ModelInputParameter DTOs (used in ModelDefinition DTOs) ---
export const ModelInputParameterDTOSchema = z.object({
  inputName: z.string().min(1, "Parameter name is required"),
  displayLabel: z.string().min(1, "Display label is required").optional().nullable(),
  inputType: z.enum(['NUMBER', 'TEXT', 'BOOLEAN', 'SELECT']),
  defaultValue: z.string().optional().nullable(),
  options: z.string().optional().nullable(), // Comma-separated string for SELECT options
  unit: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});
export type ModelInputParameterDto = z.infer<typeof ModelInputParameterDTOSchema>;

// --- ModelBomItem DTOs (used in ModelDefinition DTOs) ---
export const ModelBomItemDTOSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  itemType: z.nativeEnum(BomItemType),
  itemDescription: z.string().optional().nullable(),
  details: z.any().optional().nullable(), // To store type-specific details for PLANK and HARDWARE
  itemLogicScript: z.string().optional().nullable(), // Field for the JS function string
  addonModelId: z.string().optional().nullable(),
});
export type ModelBomItemDto = z.infer<typeof ModelBomItemDTOSchema>;

// --- ModelDefinition DTOs ---
export const CreateModelDefinitionSchema = z.object({
  name: z.string().min(1, 'Model name/type is required'),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url("Invalid URL format").optional().nullable(),
  sampleRuntimeInputsJson: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    try {
      JSON.parse(val);
      return true;
    } catch (e) {
      return false;
    }
  }, { message: "Sample Runtime Inputs must be a valid JSON string" }).nullable(),
  inputParameters: z.array(ModelInputParameterDTOSchema).optional(),
  bomItems: z.array(ModelBomItemDTOSchema).optional(),
});
export type CreateModelDefinitionDto = z.infer<typeof CreateModelDefinitionSchema>;

export const UpdateModelDefinitionSchema = CreateModelDefinitionSchema.deepPartial();
export type UpdateModelDefinitionDto = z.infer<typeof UpdateModelDefinitionSchema>;

// --- Standalone DTOs for sub-entity CRUD ---
export const CreateModelInputParameterSchema = ModelInputParameterDTOSchema;
export type CreateModelInputParameterDto = z.infer<typeof CreateModelInputParameterSchema>;

export const UpdateModelInputParameterSchema = ModelInputParameterDTOSchema.partial();
export type UpdateModelInputParameterDto = z.infer<typeof UpdateModelInputParameterSchema>;

export const CreateModelBomItemSchema = ModelBomItemDTOSchema;
export type CreateModelBomItemDto = z.infer<typeof CreateModelBomItemSchema>;

export const UpdateModelBomItemSchema = ModelBomItemDTOSchema.partial();
export type UpdateModelBomItemDto = z.infer<typeof UpdateModelBomItemSchema>;

// --- ProjectModelInstance DTOs ---
export const CreateProjectModelInstanceSchema = z.object({
  projectId: z.number(),
  modelDefinitionId: z.string(),
  runtimeInputsJson: z.any(), // JSON object for runtime inputs
});
export type CreateProjectModelInstanceDto = z.infer<typeof CreateProjectModelInstanceSchema>;

export const UpdateProjectModelInstanceSchema = CreateProjectModelInstanceSchema.pick({
  runtimeInputsJson: true,
}).partial();
export type UpdateProjectModelInstanceDto = z.infer<typeof UpdateProjectModelInstanceSchema>;

// --- Generation DTOs ---
export const GeneratePlankListSchema = z.object({
  projectModelInstanceId: z.string(),
});
export type GeneratePlankListDto = z.infer<typeof GeneratePlankListSchema>;

export const GenerateMaterialEstimateSchema = z.object({
  projectModelInstanceId: z.string(),
});
export type GenerateMaterialEstimateDto = z.infer<typeof GenerateMaterialEstimateSchema>;

// --- Test Script DTOs ---
export const TestItemScriptDtoSchema = z.object({
  itemLogicScript: z.string().min(1, "Script content is required."),
  sampleRuntimeInputs: z.record(z.any(), { description: "Sample runtime inputs for testing the script" }), // Expects a JSON object
});
export type TestItemScriptDto = z.infer<typeof TestItemScriptDtoSchema>;

// --- Project Aggregated Plank List DTO ---
export const GenerateProjectPlankListSchema = z.object({
  projectId: z.number().int().positive("Project ID must be a positive integer"),
});
export type GenerateProjectPlankListDto = z.infer<typeof GenerateProjectPlankListSchema>;
