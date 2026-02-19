/**
 * Material Constants
 * Plywood thickness values and other material-related constants
 */

// Standard plywood thickness values in mm
export const PLY_THICKNESS_VALUES = [
  6,
  8,
  12,
  15,
  18,
  19,
  25,
] as const;

export type PlyThickness = (typeof PLY_THICKNESS_VALUES)[number];

// Standard sheet dimensions in mm
export const SHEET_DIMENSIONS = {
  width: 1220,
  height: 2440,
} as const;

// Edge banding widths
export const EDGE_BANDING_WIDTHS = [
  '22',
  '35',
  '45',
] as const;

// Plywood types
export const PLY_TYPES = [
  'Plywood',
  'HDHMR',
  'MDF',
  'Block Board',
] as const;

export type PlyType = (typeof PLY_TYPES)[number];

// Grain direction options
export const GRAIN_DIRECTIONS = ['Y', 'N'] as const;

export type GrainDirection = (typeof GRAIN_DIRECTIONS)[number];
