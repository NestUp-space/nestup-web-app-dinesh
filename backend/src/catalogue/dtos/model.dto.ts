import { z } from 'zod';
import { BomItemType } from '@prisma/client';

// --- ModelInputParameter DTOs (used in ModelDefinition DTOs) ---
export const ModelInputParameterDTOSchema = z.object({
  inputName: z.string().min(1, "Parameter name is required"),
  displayLabel: z.string().min(1, "Display label is required").optional().nullable(),
  inputType: z.enum(['NUMBER', 'TEXT', 'BOOLEAN', 'SELECT', 'SELECT_MATERIAL']),
  defaultValue: z.string().optional().nullable(),
  options: z.string().optional().nullable(), // Comma-separated string for SELECT options
  unit: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});
export type ModelInputParameterDto = z.infer<typeof ModelInputParameterDTOSchema>;

// --- ModelBomItem DTOs (used in ModelDefinition DTOs) ---

// Schema for individual edge banding configuration
const PlankEdgeDetailSchema = z.object({
  thickness: z.union([z.literal(1), z.literal(2)], {
    errorMap: () => ({ message: "Edge banding thickness must be 1 or 2." })
  }).optional(), // Made optional for partial updates
  materialCode: z.string().min(1, "Edge banding material code is required.").optional(), // Made optional
});

// Schema for PLANK type item details, including edge banding
const PlankDetailsSchema = z.object({
  // Fields from PlankLogicEditor that are part of 'details'
  name: z.string().optional().nullable(),
  widthLogic: z.string().optional().nullable(),
  lengthLogic: z.string().optional().nullable(),
  materialCode: z.string().optional().nullable(), // This is for the plank itself
  grainDirection: z.string().optional().nullable(),
  packetNumber: z.number().optional().nullable(),
  plankLocationIdentifier: z.string().optional().nullable(),
  edgeBandingType: z.string().optional().nullable(), // e.g., 'CEB', 'IEB'

  edgeBanding: z.object({
    top: PlankEdgeDetailSchema.optional(),
    bottom: PlankEdgeDetailSchema.optional(),
    left: PlankEdgeDetailSchema.optional(),
    right: PlankEdgeDetailSchema.optional(),
  }).optional().default({}), // Default to an empty object if edgeBanding is undefined
  // Other plank-specific details can be added here in the future
}).nullable(); // Allow details to be null

// Base schema for common BOM item properties
const BaseBomItemSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  itemDescription: z.string().optional().nullable(),
  itemLogicScript: z.string().optional().nullable(),
  addonModelId: z.string().optional().nullable(),
});

// Specific schema for PLANK items
const PlankBomItemSchema = BaseBomItemSchema.extend({
  itemType: z.literal(BomItemType.PLANK),
  details: PlankDetailsSchema, // Use the specific PlankDetailsSchema
});

// Specific schema for HARDWARE items
const HardwareBomItemSchema = BaseBomItemSchema.extend({
  itemType: z.literal(BomItemType.HARDWARE),
  details: z.any().optional().nullable(), // Keep as z.any() for now, or define specific hardware details schema
});

// Specific schema for ADDON items
const AddonBomItemSchema = BaseBomItemSchema.extend({
  itemType: z.literal(BomItemType.ADDON),
  details: z.any().optional().nullable(), // Keep as z.any() for now
});

// Discriminated union for ModelBomItemDTOSchema
export const ModelBomItemDTOSchema = z.discriminatedUnion("itemType", [
  PlankBomItemSchema,
  HardwareBomItemSchema,
  AddonBomItemSchema,
]);

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

// --- Standalone DTOs for sub-entity CRUD (Moved Up) ---
export const CreateModelInputParameterSchema = ModelInputParameterDTOSchema;
export type CreateModelInputParameterDto = z.infer<typeof CreateModelInputParameterSchema>;

export const UpdateModelInputParameterSchema = ModelInputParameterDTOSchema.partial();
export type UpdateModelInputParameterDto = z.infer<typeof UpdateModelInputParameterSchema>;

export const CreateModelBomItemSchema = ModelBomItemDTOSchema;
export type CreateModelBomItemDto = z.infer<typeof CreateModelBomItemSchema>;

// For UpdateModelBomItemSchema, we need to ensure 'itemType' is always present
// and other fields are optional. 'details' should also be optional and its internal
// structure should be partial. (Moved Up)
const PartialBaseBomItemSchema = BaseBomItemSchema.partial({
  itemName: true,
  itemDescription: true,
  itemLogicScript: true,
  addonModelId: true,
});

// Partial schema for PLANK items for update (Moved Up)
const UpdatePlankBomItemSchema = PartialBaseBomItemSchema.extend({
  itemType: z.literal(BomItemType.PLANK),
  // Make the details field a partial version of the original PlankDetailsSchema,
  // and also optional and nullable for updates.
  details: PlankDetailsSchema.unwrap().deepPartial().optional().nullable(),
});

// Partial schema for HARDWARE items for update (Moved Up)
const UpdateHardwareBomItemSchema = PartialBaseBomItemSchema.extend({
  itemType: z.literal(BomItemType.HARDWARE),
  details: z.any().optional().nullable(), // Hardware details can be anything or null
});

// Partial schema for ADDON items for update (Moved Up)
const UpdateAddonBomItemSchema = PartialBaseBomItemSchema.extend({
  itemType: z.literal(BomItemType.ADDON),
  details: z.any().optional().nullable(), // Addon details can be anything or null
});

export const UpdateModelBomItemSchema = z.discriminatedUnion("itemType", [
  UpdatePlankBomItemSchema,
  UpdateHardwareBomItemSchema,
  UpdateAddonBomItemSchema,
]);
export type UpdateModelBomItemDto = z.infer<typeof UpdateModelBomItemSchema>;

// Custom UpdateModelDefinitionSchema to ensure bomItems use UpdateModelBomItemSchema (Moved Up)
export const UpdateModelDefinitionSchema = z.object({
  name: z.string().min(1, 'Model name/type is required').optional(),
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
  }, { message: "Sample Runtime Inputs must be a valid JSON string" }).nullable().optional(),
  inputParameters: z.array(UpdateModelInputParameterSchema).optional(), // Each input param is partial
  bomItems: z.array(UpdateModelBomItemSchema).optional(), // Each bomItem conforms to UpdateModelBomItemSchema
});
export type UpdateModelDefinitionDto = z.infer<typeof UpdateModelDefinitionSchema>;

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
