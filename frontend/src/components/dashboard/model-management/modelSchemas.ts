import { z } from 'zod';

// This file centralizes shared Zod schemas and enums for model management
// to prevent circular dependencies and improve organization.

// Define Zod Schemas for sub-structures
export const ModelInputParameterSchema = z.object({
  id: z.string().optional(),
  inputName: z.string().min(1, "Parameter name is required"),
  displayLabel: z.string().min(1, "Display label is required").optional().nullable(),
  inputType: z.enum(['NUMBER', 'TEXT', 'BOOLEAN', 'SELECT', 'SELECT_MATERIAL']),
  defaultValue: z.string().optional().nullable(),
  options: z.string().optional().nullable(), 
  unit: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

// Define BomItemType locally for frontend use, matching Prisma's enum values
export enum BomItemType {
  PLANK = 'PLANK',
  HARDWARE = 'HARDWARE',
  ADDON = 'ADDON',
}

export const BillOfMaterialItemSchema = z.object({
  id: z.string().optional(),
  itemName: z.string().min(1, "Item name is required"),
  itemType: z.nativeEnum(BomItemType),
  itemDescription: z.string().optional().nullable(),
  itemLogicScript: z.string().optional().nullable(),
  addonModelId: z.string().optional().nullable(),
  // details field will be handled by the discriminated union below
});

// Define schemas for each BOM item type's details
export const PlankDetailsSchemaFrontend = z.object({
  edgeBanding: z.object({
    top: z.object({ thickness: z.union([z.literal(1), z.literal(2)]), materialCode: z.string() }).optional(),
    bottom: z.object({ thickness: z.union([z.literal(1), z.literal(2)]), materialCode: z.string() }).optional(),
    left: z.object({ thickness: z.union([z.literal(1), z.literal(2)]), materialCode: z.string() }).optional(),
    right: z.object({ thickness: z.union([z.literal(1), z.literal(2)]), materialCode: z.string() }).optional(),
  }).optional().nullable(),
  name: z.string().optional().nullable(), 
  widthLogic: z.string().optional().nullable(), 
  lengthLogic: z.string().optional().nullable(), 
  materialCode: z.string().optional().nullable(), 
  grainDirection: z.string().optional().nullable(), 
  packetNumber: z.number().optional().nullable(), 
  plankLocationIdentifier: z.string().optional().nullable(), 
  edgeBandingType: z.string().optional().nullable(), 
}).nullable();

export const HardwareDetailsSchemaFrontend = z.any().optional().nullable();
export const AddonDetailsSchemaFrontend = z.any().optional().nullable();

// Create specific schemas for each item type by extending the base and adding the correct details schema
export const PlankBomItemSchemaFrontend = BillOfMaterialItemSchema.extend({
  itemType: z.literal(BomItemType.PLANK),
  details: PlankDetailsSchemaFrontend,
});

export const HardwareBomItemSchemaFrontend = BillOfMaterialItemSchema.extend({
  itemType: z.literal(BomItemType.HARDWARE),
  details: HardwareDetailsSchemaFrontend,
});

export const AddonBomItemSchemaFrontend = BillOfMaterialItemSchema.extend({
  itemType: z.literal(BomItemType.ADDON),
  details: AddonDetailsSchemaFrontend,
});

// Create the discriminated union for bomItems
export const DiscriminatedBomItemSchema = z.discriminatedUnion("itemType", [
  PlankBomItemSchemaFrontend,
  HardwareBomItemSchemaFrontend,
  AddonBomItemSchemaFrontend,
]);
