/**
 * Visualiser Validation Schemas
 * Zod schemas for validating Visualiser API requests
 */

import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================

const customerDetailsSchema = z.object({
  customerName: z.string().min(1),
  firmName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  gst: z.string().optional(),
  transportAmount: z.number().optional(),
});

const nestingParamsSchema = z.object({
  algorithm: z.enum(['bfd', 'ga', 'sa', 'pso', 'tournament']).default('tournament'),
  populationSize: z.number().int().positive().optional(),
  generations: z.number().int().positive().optional(),
  mutationRate: z.number().min(0).max(1).optional(),
  temperature: z.number().positive().optional(),
  coolingRate: z.number().min(0).max(1).optional(),
  swarmSize: z.number().int().positive().optional(),
  iterations: z.number().int().positive().optional(),
});

// ============================================
// Generation Schema
// ============================================

export const generateSchema = z.object({
  body: z.object({
    rawValues: z.array(z.array(z.unknown())),
    ebSettings: z.record(z.string(), z.number()),
    customerDetails: customerDetailsSchema.optional(),
    hardwareData: z.array(z.array(z.union([z.string(), z.number()]))).optional(),
    sftData: z.array(z.array(z.union([z.string(), z.number()]))).nullable().optional(),
    nestingParams: nestingParamsSchema.optional(),
  }),
});

export type GenerateInput = z.infer<typeof generateSchema>['body'];

// ============================================
// Nesting Schema
// ============================================

const plankListItemSchema = z.object({
  plankName: z.string(),
  material: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  thickness: z.number().positive(),
  plankId: z.string(),
  grain: z.enum(['Y', 'N', '']),
  edgeBinding: z.number(),
  sheetNumber: z.number().optional(),
});

export const nestSchema = z.object({
  body: z.object({
    plankList: z.array(plankListItemSchema),
    algorithm: z.enum(['bfd', 'ga', 'sa', 'pso', 'tournament']).default('tournament'),
    algorithmParams: nestingParamsSchema.omit({ algorithm: true }).optional(),
  }),
});

export type NestInput = z.infer<typeof nestSchema>['body'];

// ============================================
// G-Code Schema
// ============================================

const nestHoleSchema = z.object({
  x: z.number(),
  y: z.number(),
  type: z.string(),
  isRectangular: z.boolean(),
  description: z.string(),
  diameter: z.number().optional(),
  width: z.number().optional(),
  length: z.number().optional(),
});

const nestResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  material: z.string(),
  thickness: z.number(),
  sheetNum: z.number(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotated: z.boolean(),
  color: z.string(),
  originalWidth: z.number(),
  originalHeight: z.number(),
  ebValue: z.number(),
  holes: z.array(nestHoleSchema),
});

export const gcodeSchema = z.object({
  body: z.object({
    nestResults: z.array(nestResultSchema),
    customerDetails: customerDetailsSchema,
  }),
});

export type GCodeInput = z.infer<typeof gcodeSchema>['body'];

// ============================================
// Catalog Schema
// ============================================

export const getCatalogSchema = z.object({
  query: z.object({
    fresh: z
      .string()
      .transform((v) => v === 'true')
      .optional(),
  }),
});

export type GetCatalogInput = z.infer<typeof getCatalogSchema>['query'];
