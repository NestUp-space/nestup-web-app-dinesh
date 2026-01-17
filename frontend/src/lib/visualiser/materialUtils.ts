/**
 * Material Utilities
 * Functions for computing material strings and handling material assignments
 */

import type { PlywoodMaterial, Laminate, PlankRole } from "@/types/visualiser";

// ============================================
// Core Type Prefixes
// ============================================

const CORE_PREFIXES: Record<string, string> = {
  'Plywood': '',
  'plywood': '',
  'MDF': 'MDF',
  'mdf': 'MDF',
  'HDHMR': 'HDHMR',
  'hdhmr': 'HDHMR',
  'Block Board': 'BB',
  'block board': 'BB',
  'BB': 'BB',
  'Particle Board': 'PB',
  'particle board': 'PB',
};

// ============================================
// Material String Computation
// ============================================

/**
 * Computes the material string from core and laminate codes
 * 
 * Patterns:
 * - Single laminate: "OAK-055"
 * - Both sides same: "BSL OAK-055"
 * - Different laminates: "OAK-055 & WHT-001"
 * - With core prefix: "HDHMR BSL OAK-055"
 */
export function computeMaterialString(
  coreType: string,
  outerLaminateCode: string,
  innerLaminateCode?: string | null
): string {
  if (!outerLaminateCode) return '';
  
  const corePrefix = getCorePrefix(coreType);
  let result = '';
  
  // Determine laminate pattern
  if (innerLaminateCode && innerLaminateCode === outerLaminateCode) {
    // Same laminate both sides: BSL
    result = `BSL ${outerLaminateCode}`;
  } else if (innerLaminateCode && innerLaminateCode !== outerLaminateCode) {
    // Different laminates: outer & inner
    result = `${outerLaminateCode} & ${innerLaminateCode}`;
  } else {
    // Outer only
    result = outerLaminateCode;
  }
  
  // Add core prefix if not standard plywood
  if (corePrefix) {
    result = `${corePrefix} ${result}`;
  }
  
  return result;
}

/**
 * Gets the core prefix for a material type
 */
export function getCorePrefix(coreType: string): string {
  if (!coreType) return '';
  return CORE_PREFIXES[coreType] || '';
}

/**
 * Extracts core material type from a plywood display name
 */
export function getCoreMaterialFromPly(plySelection: string): string {
  if (!plySelection) return 'Plywood';
  
  const ply = plySelection.toLowerCase();
  
  if (ply.includes('hdhmr')) return 'HDHMR';
  if (ply.includes('mdf')) return 'MDF';
  if (ply.includes('block board') || ply.includes('bb ')) return 'Block Board';
  if (ply.includes('particle')) return 'Particle Board';
  
  return 'Plywood';
}

/**
 * Extracts thickness from a plywood display name
 * e.g., "Austin MR Plywood 18mm" → 18
 */
export function extractThicknessFromPly(plySelection: string): number {
  if (!plySelection) return 18;
  
  const match = plySelection.match(/(\d+)\s*mm/i);
  return match ? parseInt(match[1], 10) : 18;
}

// ============================================
// Material String Parsing
// ============================================

interface ParsedMaterial {
  coreType: string;
  outerCode: string;
  innerCode: string | null;
  isBSL: boolean;
}

/**
 * Parses a material string back into components
 */
export function parseMaterialString(materialString: string): ParsedMaterial {
  if (!materialString) {
    return { coreType: 'Plywood', outerCode: '', innerCode: null, isBSL: false };
  }
  
  let remaining = materialString.trim();
  let coreType = 'Plywood';
  
  // Check for core prefixes
  for (const [key, prefix] of Object.entries(CORE_PREFIXES)) {
    if (prefix && remaining.startsWith(prefix + ' ')) {
      coreType = key;
      remaining = remaining.slice(prefix.length + 1).trim();
      break;
    }
  }
  
  // Check for BSL
  const isBSL = remaining.startsWith('BSL ');
  if (isBSL) {
    remaining = remaining.slice(4).trim();
  }
  
  // Check for double laminate (outer & inner)
  if (remaining.includes(' & ')) {
    const [outer, inner] = remaining.split(' & ');
    return { coreType, outerCode: outer.trim(), innerCode: inner.trim(), isBSL: false };
  }
  
  // Single laminate
  return { 
    coreType, 
    outerCode: remaining, 
    innerCode: isBSL ? remaining : null, 
    isBSL 
  };
}

// ============================================
// Plank Category Detection
// ============================================

/**
 * Determines plank category for material assignment
 */
export function determinePlankCategory(
  plankRole: PlankRole | string
): 'carcass' | 'door' | 'back' {
  const role = (plankRole || '').toLowerCase();
  
  // Door/Drawer fronts
  if (
    role === 'door' || 
    role === 'drawer_front' || 
    role.includes('door') || 
    role.includes('shutter') ||
    role.includes('flap')
  ) {
    return 'door';
  }
  
  // Back panels
  if (
    role === 'back' || 
    role.includes('back') || 
    role.includes('rear')
  ) {
    return 'back';
  }
  
  // Default: carcass (sides, top, bottom, shelves, partitions, rails)
  return 'carcass';
}

/**
 * Gets the appropriate plywood selection for a plank based on box materials
 */
export function getPlywoodForPlank(
  plankRole: PlankRole | string,
  carcassPly?: string,
  doorPly?: string,
  backPly?: string
): string | undefined {
  const category = determinePlankCategory(plankRole);
  
  switch (category) {
    case 'door':
      return doorPly || carcassPly;
    case 'back':
      return backPly || carcassPly;
    default:
      return carcassPly;
  }
}

// ============================================
// Default Material Data
// ============================================

export const DEFAULT_PLYWOOD_OPTIONS: PlywoodMaterial[] = [
  {
    id: 'ply-1',
    brand: 'Austin',
    gradeType: 'MR',
    material: 'Plywood',
    thickness: 18,
    pricePerSqft: 85,
    displayName: 'Austin MR Plywood 18mm',
    isActive: true,
  },
  {
    id: 'ply-2',
    brand: 'Austin',
    gradeType: 'BWR',
    material: 'Plywood',
    thickness: 18,
    pricePerSqft: 95,
    displayName: 'Austin BWR Plywood 18mm',
    isActive: true,
  },
  {
    id: 'ply-3',
    brand: 'Action',
    gradeType: 'MR',
    material: 'HDHMR',
    thickness: 18,
    pricePerSqft: 75,
    displayName: 'Action MR HDHMR 18mm',
    isActive: true,
  },
  {
    id: 'ply-4',
    brand: 'Action',
    gradeType: 'MR',
    material: 'MDF',
    thickness: 18,
    pricePerSqft: 55,
    displayName: 'Action MR MDF 18mm',
    isActive: true,
  },
  {
    id: 'ply-5',
    brand: 'Austin',
    gradeType: 'MR',
    material: 'Plywood',
    thickness: 6,
    pricePerSqft: 45,
    displayName: 'Austin MR Plywood 6mm',
    isActive: true,
  },
  {
    id: 'ply-6',
    brand: 'Action',
    gradeType: '',
    material: 'HDHMR',
    thickness: 6,
    pricePerSqft: 35,
    displayName: 'Action HDHMR 6mm',
    isActive: true,
  },
];

export const DEFAULT_LAMINATE_OPTIONS: Laminate[] = [
  {
    id: 'lam-1',
    code: 'OAK-055',
    brand: 'Merino',
    colour: 'Natural Oak',
    thickness: 1,
    pricePerSqft: 45,
    previewColor: '#A67C52',
    isActive: true,
    category: 'Wood',
  },
  {
    id: 'lam-2',
    code: 'WHT-001',
    brand: 'Merino',
    colour: 'Arctic White',
    thickness: 1,
    pricePerSqft: 35,
    previewColor: '#FFFFFF',
    isActive: true,
    category: 'Solid',
  },
  {
    id: 'lam-3',
    code: 'GRY-022',
    brand: 'Greenlam',
    colour: 'Slate Grey',
    thickness: 1,
    pricePerSqft: 40,
    previewColor: '#5A5A5A',
    isActive: true,
    category: 'Solid',
  },
  {
    id: 'lam-4',
    code: 'WAL-033',
    brand: 'Merino',
    colour: 'Dark Walnut',
    thickness: 1,
    pricePerSqft: 48,
    previewColor: '#4A3728',
    isActive: true,
    category: 'Wood',
  },
  {
    id: 'lam-5',
    code: 'BLK-002',
    brand: 'Greenlam',
    colour: 'Jet Black',
    thickness: 1,
    pricePerSqft: 38,
    previewColor: '#1A1A1A',
    isActive: true,
    category: 'Solid',
  },
  {
    id: 'lam-6',
    code: 'TEK-044',
    brand: 'Merino',
    colour: 'Teak',
    thickness: 1,
    pricePerSqft: 42,
    previewColor: '#C69C6D',
    isActive: true,
    category: 'Wood',
  },
  {
    id: 'lam-7',
    code: 'MAP-066',
    brand: 'Century',
    colour: 'Maple',
    thickness: 1,
    pricePerSqft: 44,
    previewColor: '#E8D4B8',
    isActive: true,
    category: 'Wood',
  },
  {
    id: 'lam-8',
    code: 'CRM-011',
    brand: 'Greenlam',
    colour: 'Cream',
    thickness: 1,
    pricePerSqft: 36,
    previewColor: '#FFFDD0',
    isActive: true,
    category: 'Solid',
  },
];

export default {
  computeMaterialString,
  getCorePrefix,
  getCoreMaterialFromPly,
  extractThicknessFromPly,
  parseMaterialString,
  determinePlankCategory,
  getPlywoodForPlank,
  DEFAULT_PLYWOOD_OPTIONS,
  DEFAULT_LAMINATE_OPTIONS,
};
