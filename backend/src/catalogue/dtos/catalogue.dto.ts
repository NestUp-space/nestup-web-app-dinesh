import { z } from 'zod';
import { BomItemType } from '@prisma/client';

// --- CatalogueItemInputParameter DTOs (used in CatalogueItemDefinition DTOs) ---
export const CatalogueItemInputParameterDTOSchema = z.object({
  // id: z.string().optional(), // Not needed for create, handled by DB
  inputName: z.string().min(1, "Parameter name is required"),
  displayLabel: z.string().min(1, "Display label is required").optional().nullable(),
  inputType: z.enum(['NUMBER', 'TEXT', 'BOOLEAN', 'SELECT']),
  defaultValue: z.string().optional().nullable(),
  options: z.string().optional().nullable(), // Comma-separated string for SELECT options
  unit: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});
export type CatalogueItemInputParameterDto = z.infer<typeof CatalogueItemInputParameterDTOSchema>;

// --- CatalogueItemBomItem DTOs (used in CatalogueItemDefinition DTOs) ---
export const CatalogueItemBomItemDTOSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  itemType: z.nativeEnum(BomItemType),
  itemDescription: z.string().optional().nullable(),
  itemLogicScript: z.string().optional().nullable(), // Field for the JS function string
  addonModelId: z.string().optional().nullable(), // Should this be addonCatalogueItemId?
});
export type CatalogueItemBomItemDto = z.infer<typeof CatalogueItemBomItemDTOSchema>;


// --- CatalogueItemDefinition DTOs ---
export const CreateCatalogueItemDefinitionSchema = z.object({
  name: z.string().min(1, 'Catalogue item name/type is required'), // Renamed from modelType
  description: z.string().optional().nullable(),
  imageUrl: z.string().url("Invalid URL format").optional().nullable(), // Renamed from screenshotUrl
  sampleRuntimeInputsJson: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    try {
      JSON.parse(val);
      return true;
    } catch (e) {
      return false;
    }
  }, { message: "Sample Runtime Inputs must be a valid JSON string" }).nullable(),
  // expectedOutputSchemaJson: z.string().optional().refine(...),
  inputParameters: z.array(CatalogueItemInputParameterDTOSchema).optional(),
  bomItems: z.array(CatalogueItemBomItemDTOSchema).optional(),
  // siteEngineerInstructions: z.array(z.object({ text: z.string().min(1) })).optional(), // This seems specific, review if needed for generic catalogue item
  // sampleOnsiteInputs: z.string().optional().refine((val) => { // This seems specific, review if needed for generic catalogue item
  //   if (!val || val.trim() === "") return true;
  //   try {
  //     JSON.parse(val);
  //     return true;
  //   } catch (e) {
  //     return false;
  //   }
  // }, { message: "Invalid JSON format for Sample Onsite Inputs" }).nullable(),
});
export type CreateCatalogueItemDefinitionDto = z.infer<typeof CreateCatalogueItemDefinitionSchema>;

export const UpdateCatalogueItemDefinitionSchema = CreateCatalogueItemDefinitionSchema.deepPartial();
export type UpdateCatalogueItemDefinitionDto = z.infer<typeof UpdateCatalogueItemDefinitionSchema>;


// --- Standalone DTOs for sub-entity CRUD ---
export const CreateCatalogueItemInputParameterSchema = CatalogueItemInputParameterDTOSchema;
export type CreateCatalogueItemInputParameterDto = z.infer<typeof CreateCatalogueItemInputParameterSchema>;

export const UpdateCatalogueItemInputParameterSchema = CatalogueItemInputParameterDTOSchema.partial();
export type UpdateCatalogueItemInputParameterDto = z.infer<typeof UpdateCatalogueItemInputParameterSchema>;

export const CreateCatalogueItemBomItemSchema = CatalogueItemBomItemDTOSchema;
export type CreateCatalogueItemBomItemDto = z.infer<typeof CreateCatalogueItemBomItemSchema>;

export const UpdateCatalogueItemBomItemSchema = CatalogueItemBomItemDTOSchema.partial();
export type UpdateCatalogueItemBomItemDto = z.infer<typeof UpdateCatalogueItemBomItemSchema>;


// --- ProjectCatalogueItemInstance DTOs ---
export const CreateProjectCatalogueItemInstanceSchema = z.object({
  projectId: z.number(), // Changed from string to number to match Project.id
  catalogueItemDefinitionId: z.string(), // Renamed from modelDefinitionId
  runtimeInputsJson: z.any(), // JSON object for runtime inputs
});
export type CreateProjectCatalogueItemInstanceDto = z.infer<typeof CreateProjectCatalogueItemInstanceSchema>;

export const UpdateProjectCatalogueItemInstanceSchema = CreateProjectCatalogueItemInstanceSchema.pick({
  runtimeInputsJson: true,
}).partial();
export type UpdateProjectCatalogueItemInstanceDto = z.infer<typeof UpdateProjectCatalogueItemInstanceSchema>;


// --- Generation DTOs ---
export const GeneratePlankListSchema = z.object({
  projectCatalogueItemInstanceId: z.string(), // Renamed from projectModelInstanceId
});
export type GeneratePlankListDto = z.infer<typeof GeneratePlankListSchema>;

export const GenerateMaterialEstimateSchema = z.object({
  projectCatalogueItemInstanceId: z.string(), // Renamed from projectModelInstanceId
});
export type GenerateMaterialEstimateDto = z.infer<typeof GenerateMaterialEstimateSchema>;


// --- Test Script DTOs ---
export const TestItemScriptDtoSchema = z.object({
  itemLogicScript: z.string().min(1, "Script content is required."),
  sampleRuntimeInputs: z.record(z.any(), { description: "Sample runtime inputs for testing the script" }), // Expects a JSON object
});
export type TestItemScriptDto = z.infer<typeof TestItemScriptDtoSchema>;


// Response DTOs can also be defined here if needed, e.g., for generated plank lists or estimates.
