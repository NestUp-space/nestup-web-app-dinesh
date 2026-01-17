/**
 * Formula Engine
 * Evaluates dimension formulas for cabinet plank calculations
 * 
 * Formulas start with "=" and use variables like:
 * - boxWidth, boxDepth, boxHeight
 * - skirtingHeight
 * - carcassThickness, doorThickness, backplankThickness
 * 
 * Example: "=boxWidth - 2*carcassThickness" → 600 - 2*18 = 564
 */

import type { 
  FormulaContext, 
  PlankTemplate, 
  CalculatedPlank,
  DesignerPlank,
  DesignerBox,
  Position3D,
  Dimensions,
  PlankRole,
} from '@/types/visualiser';

// ============================================
// Formula Evaluation
// ============================================

/**
 * Evaluates a single formula string with the given context
 */
export function evaluateFormula(formula: string, context: FormulaContext): number {
  if (!formula || formula.trim() === '') return 0;
  
  // If it's just a number, return it
  const numericValue = parseFloat(formula);
  if (!isNaN(numericValue) && !formula.startsWith('=')) {
    return numericValue;
  }
  
  // Remove the leading "=" if present
  let expression = formula.startsWith('=') ? formula.substring(1).trim() : formula.trim();
  
  // Build variable replacements
  const variables: Record<string, number> = {
    // Primary variable names (camelCase)
    boxWidth: context.boxWidth,
    boxDepth: context.boxDepth,
    boxHeight: context.boxHeight,
    skirtingHeight: context.skirtingHeight,
    carcassThickness: context.carcassThickness,
    doorThickness: context.doorThickness,
    backplankThickness: context.backplankThickness,
    
    // Aliases (snake_case for backward compatibility)
    box_width: context.boxWidth,
    box_depth: context.boxDepth,
    box_height: context.boxHeight,
    skirting: context.skirtingHeight,
    carcus_thickness: context.carcassThickness,
    carcuss_thickness: context.carcassThickness,
    door_thickness: context.doorThickness,
    backplank_thickness: context.backplankThickness,
    back_thickness: context.backplankThickness,
    
    // Short aliases
    W: context.boxWidth,
    D: context.boxDepth,
    H: context.boxHeight,
    SK: context.skirtingHeight,
    CT: context.carcassThickness,
    DT: context.doorThickness,
    BT: context.backplankThickness,
  };
  
  // Replace all variable references with their values
  // Sort by length descending to avoid partial matches (e.g., "box_width" before "box")
  const sortedVarNames = Object.keys(variables).sort((a, b) => b.length - a.length);
  
  for (const varName of sortedVarNames) {
    // Use word boundary matching to avoid partial replacements
    const regex = new RegExp(`\\b${varName}\\b`, 'gi');
    expression = expression.replace(regex, String(variables[varName]));
  }
  
  // Safety check: only allow numbers, operators, parentheses, and whitespace
  const safePattern = /^[\d\s+\-*/().]+$/;
  if (!safePattern.test(expression)) {
    console.warn('Formula contains invalid characters:', formula, '→', expression);
    return 0;
  }
  
  // Evaluate the expression
  try {
    // Use Function constructor for evaluation (safer than eval)
    const result = Function(`"use strict"; return (${expression})`)();
    
    if (typeof result !== 'number' || isNaN(result)) {
      console.warn('Formula evaluation resulted in non-number:', formula, '→', result);
      return 0;
    }
    
    // Round to avoid floating point precision issues
    return Math.round(result * 100) / 100;
  } catch (error) {
    console.error('Formula evaluation error:', formula, error);
    return 0;
  }
}

/**
 * Validates a formula without evaluating it
 */
export function validateFormula(formula: string): { valid: boolean; error?: string } {
  if (!formula || formula.trim() === '') {
    return { valid: true }; // Empty formulas are valid (will return 0)
  }
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    /eval\s*\(/i,
    /Function\s*\(/i,
    /setTimeout/i,
    /setInterval/i,
    /document\./i,
    /window\./i,
    /global\./i,
    /process\./i,
    /require\s*\(/i,
    /import\s+/i,
    /__proto__/i,
    /constructor/i,
    /prototype/i,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(formula)) {
      return { valid: false, error: `Formula contains forbidden pattern: ${pattern.source}` };
    }
  }
  
  return { valid: true };
}

// ============================================
// Context Building
// ============================================

/**
 * Builds a FormulaContext from a DesignerBox
 */
export function buildFormulaContext(box: DesignerBox): FormulaContext {
  return {
    boxWidth: box.dimensions.boxWidth || box.dimensions.lenX || 600,
    boxDepth: box.dimensions.boxDepth || box.dimensions.lenY || 550,
    boxHeight: box.dimensions.boxHeight || box.dimensions.lenZ || 800,
    skirtingHeight: box.dimensions.skirtingHeight || 100,
    carcassThickness: box.carcassThickness || 18,
    doorThickness: box.doorThickness || 18,
    backplankThickness: box.backplankThickness || 6,
  };
}

/**
 * Builds a FormulaContext from individual parameters
 */
export function createFormulaContext(params: {
  boxWidth: number;
  boxDepth: number;
  boxHeight: number;
  skirtingHeight?: number;
  carcassThickness?: number;
  doorThickness?: number;
  backplankThickness?: number;
}): FormulaContext {
  return {
    boxWidth: params.boxWidth,
    boxDepth: params.boxDepth,
    boxHeight: params.boxHeight,
    skirtingHeight: params.skirtingHeight ?? 100,
    carcassThickness: params.carcassThickness ?? 18,
    doorThickness: params.doorThickness ?? 18,
    backplankThickness: params.backplankThickness ?? 6,
  };
}

// ============================================
// Plank Calculation
// ============================================

/**
 * Calculates all planks from templates using the formula context
 */
export function calculateAllPlanks(
  templates: PlankTemplate[],
  context: FormulaContext
): CalculatedPlank[] {
  return templates.map((template) => ({
    entityName: template.entityName,
    plankRole: template.plankRole,
    lenX: evaluateFormula(template.lenXFormula, context),
    lenY: evaluateFormula(template.lenYFormula, context),
    lenZ: evaluateFormula(template.lenZFormula, context),
    positionX: evaluateFormula(template.posXFormula, context),
    positionY: evaluateFormula(template.posYFormula, context),
    positionZ: evaluateFormula(template.posZFormula, context),
  }));
}

/**
 * Creates DesignerPlank array from calculated planks
 */
export function createPlanksFromCalculated(
  calculatedPlanks: CalculatedPlank[],
  boxId: string,
  templates: PlankTemplate[],
  defaultColor: string = '#9CA3AF'
): DesignerPlank[] {
  return calculatedPlanks.map((calc, index) => {
    const template = templates[index];
    
    return {
      id: `${boxId}-plank-${index}`,
      name: calc.entityName,
      plankRole: calc.plankRole,
      sortOrder: index,
      parentBoxId: boxId,
      position: {
        x: calc.positionX,
        y: calc.positionY,
        z: calc.positionZ,
      },
      dimensions: {
        lenX: calc.lenX,
        lenY: calc.lenY,
        lenZ: calc.lenZ,
      },
      color: template?.defaultColor || defaultColor,
      material: template?.defaultMaterial,
      dimensionFormulas: {
        lenX: template?.lenXFormula,
        lenY: template?.lenYFormula,
        lenZ: template?.lenZFormula,
      },
      positionFormulas: {
        x: template?.posXFormula,
        y: template?.posYFormula,
        z: template?.posZFormula,
      },
    };
  });
}

/**
 * Recalculates all planks for a box when dimensions change
 */
export function recalculatePlanks(
  box: DesignerBox,
  templates: PlankTemplate[]
): DesignerPlank[] {
  const context = buildFormulaContext(box);
  const calculated = calculateAllPlanks(templates, context);
  
  // Preserve existing plank properties (colors, materials) while updating dimensions
  return calculated.map((calc, index) => {
    const existingPlank = box.planks[index];
    const template = templates[index];
    
    return {
      ...(existingPlank || {}),
      id: existingPlank?.id || `${box.id}-plank-${index}`,
      name: calc.entityName,
      plankRole: calc.plankRole,
      sortOrder: index,
      parentBoxId: box.id,
      position: {
        x: calc.positionX,
        y: calc.positionY,
        z: calc.positionZ,
      },
      dimensions: {
        lenX: calc.lenX,
        lenY: calc.lenY,
        lenZ: calc.lenZ,
      },
      color: existingPlank?.color || template?.defaultColor || '#9CA3AF',
      dimensionFormulas: {
        lenX: template?.lenXFormula,
        lenY: template?.lenYFormula,
        lenZ: template?.lenZFormula,
      },
      positionFormulas: {
        x: template?.posXFormula,
        y: template?.posYFormula,
        z: template?.posZFormula,
      },
    };
  });
}

// ============================================
// Plank Role Detection
// ============================================

/**
 * Detects plank role from entity name
 */
export function detectPlankRole(entityName: string): PlankRole {
  const name = entityName.toLowerCase();
  
  if (name.includes('left') && name.includes('side')) return 'left';
  if (name.includes('right') && name.includes('side')) return 'right';
  if (name.includes('top') && !name.includes('rail')) return 'top';
  if (name.includes('bottom') && !name.includes('rail')) return 'bottom';
  if (name.includes('back') || name.includes('rear')) return 'back';
  if (name.includes('shelf')) return 'shelf';
  if (name.includes('door') || name.includes('shutter')) return 'door';
  if (name.includes('drawer') && name.includes('front')) return 'drawer_front';
  if (name.includes('partition') || name.includes('divider')) return 'partition';
  if (name.includes('rail')) return 'rail';
  
  // Generic detection
  if (name.includes('side')) {
    // Try to determine left vs right from context
    return 'left'; // Default to left
  }
  
  return 'other';
}

/**
 * Determines plank category (for material assignment)
 */
export function determinePlankCategory(
  plankRole: PlankRole | string
): 'carcass' | 'door' | 'back' {
  const role = plankRole.toLowerCase();
  
  if (role === 'door' || role === 'drawer_front' || role.includes('door') || role.includes('shutter')) {
    return 'door';
  }
  
  if (role === 'back' || role.includes('back') || role.includes('rear')) {
    return 'back';
  }
  
  // Default: carcass (sides, top, bottom, shelves, partitions, rails)
  return 'carcass';
}

// ============================================
// Standard Cabinet Formulas
// ============================================

/**
 * Standard formulas for common cabinet plank types
 */
export const STANDARD_FORMULAS: Record<PlankRole, {
  lenX: string;
  lenY: string;
  lenZ: string;
  posX: string;
  posY: string;
  posZ: string;
}> = {
  left: {
    lenX: '=carcassThickness',
    lenY: '=boxDepth - backplankThickness',
    lenZ: '=boxHeight - skirtingHeight',
    posX: '=0',
    posY: '=0',
    posZ: '=skirtingHeight',
  },
  right: {
    lenX: '=carcassThickness',
    lenY: '=boxDepth - backplankThickness',
    lenZ: '=boxHeight - skirtingHeight',
    posX: '=boxWidth - carcassThickness',
    posY: '=0',
    posZ: '=skirtingHeight',
  },
  top: {
    lenX: '=boxWidth - 2*carcassThickness',
    lenY: '=boxDepth - backplankThickness',
    lenZ: '=carcassThickness',
    posX: '=carcassThickness',
    posY: '=0',
    posZ: '=boxHeight - carcassThickness',
  },
  bottom: {
    lenX: '=boxWidth - 2*carcassThickness',
    lenY: '=boxDepth - backplankThickness',
    lenZ: '=carcassThickness',
    posX: '=carcassThickness',
    posY: '=0',
    posZ: '=skirtingHeight',
  },
  back: {
    lenX: '=boxWidth - 2*carcassThickness + 12',
    lenY: '=backplankThickness',
    lenZ: '=boxHeight - skirtingHeight - 12',
    posX: '=carcassThickness - 6',
    posY: '=boxDepth - backplankThickness',
    posZ: '=skirtingHeight + 6',
  },
  shelf: {
    lenX: '=boxWidth - 2*carcassThickness - 6',
    lenY: '=boxDepth - backplankThickness - 20',
    lenZ: '=carcassThickness',
    posX: '=carcassThickness + 3',
    posY: '=10',
    posZ: '=skirtingHeight + (boxHeight - skirtingHeight) / 2',
  },
  door: {
    lenX: '=boxWidth - 3',
    lenY: '=doorThickness',
    lenZ: '=boxHeight - skirtingHeight - 3',
    posX: '=1.5',
    posY: '=-doorThickness',
    posZ: '=skirtingHeight + 1.5',
  },
  drawer_front: {
    lenX: '=boxWidth - 3',
    lenY: '=doorThickness',
    lenZ: '=150',
    posX: '=1.5',
    posY: '=-doorThickness',
    posZ: '=skirtingHeight + 1.5',
  },
  partition: {
    lenX: '=carcassThickness',
    lenY: '=boxDepth - backplankThickness',
    lenZ: '=boxHeight - skirtingHeight - 2*carcassThickness',
    posX: '=boxWidth / 2 - carcassThickness / 2',
    posY: '=0',
    posZ: '=skirtingHeight + carcassThickness',
  },
  rail: {
    lenX: '=boxWidth - 2*carcassThickness',
    lenY: '=100',
    lenZ: '=carcassThickness',
    posX: '=carcassThickness',
    posY: '=0',
    posZ: '=boxHeight - 100',
  },
  other: {
    lenX: '=100',
    lenY: '=100',
    lenZ: '=carcassThickness',
    posX: '=0',
    posY: '=0',
    posZ: '=0',
  },
};

/**
 * Gets standard formulas for a plank role
 */
export function getStandardFormulas(role: PlankRole) {
  return STANDARD_FORMULAS[role] || STANDARD_FORMULAS.other;
}

/**
 * Creates a standard plank template
 */
export function createStandardPlankTemplate(
  entityName: string,
  role: PlankRole,
  sortOrder: number = 0
): PlankTemplate {
  const formulas = getStandardFormulas(role);
  
  return {
    id: `template-${role}-${sortOrder}`,
    entityName,
    plankRole: role,
    sortOrder,
    lenXFormula: formulas.lenX,
    lenYFormula: formulas.lenY,
    lenZFormula: formulas.lenZ,
    posXFormula: formulas.posX,
    posYFormula: formulas.posY,
    posZFormula: formulas.posZ,
  };
}

// ============================================
// Default Templates
// ============================================

/**
 * Creates a standard base unit template
 */
export function createBaseUnitTemplate(width: number = 600): PlankTemplate[] {
  return [
    createStandardPlankTemplate('Left Side', 'left', 0),
    createStandardPlankTemplate('Right Side', 'right', 1),
    createStandardPlankTemplate('Bottom', 'bottom', 2),
    createStandardPlankTemplate('Top Rail', 'rail', 3),
    createStandardPlankTemplate('Back Panel', 'back', 4),
    createStandardPlankTemplate('Shelf', 'shelf', 5),
    createStandardPlankTemplate('Door', 'door', 6),
  ];
}

/**
 * Creates a standard wall unit template
 */
export function createWallUnitTemplate(width: number = 600): PlankTemplate[] {
  return [
    createStandardPlankTemplate('Left Side', 'left', 0),
    createStandardPlankTemplate('Right Side', 'right', 1),
    createStandardPlankTemplate('Top', 'top', 2),
    createStandardPlankTemplate('Bottom', 'bottom', 3),
    createStandardPlankTemplate('Back Panel', 'back', 4),
    createStandardPlankTemplate('Shelf', 'shelf', 5),
    createStandardPlankTemplate('Door', 'door', 6),
  ];
}

/**
 * Creates a standard tall unit template
 */
export function createTallUnitTemplate(width: number = 600): PlankTemplate[] {
  return [
    createStandardPlankTemplate('Left Side', 'left', 0),
    createStandardPlankTemplate('Right Side', 'right', 1),
    createStandardPlankTemplate('Top', 'top', 2),
    createStandardPlankTemplate('Bottom', 'bottom', 3),
    createStandardPlankTemplate('Back Panel', 'back', 4),
    createStandardPlankTemplate('Shelf 1', 'shelf', 5),
    createStandardPlankTemplate('Shelf 2', 'shelf', 6),
    createStandardPlankTemplate('Shelf 3', 'shelf', 7),
    createStandardPlankTemplate('Door', 'door', 8),
  ];
}

export default {
  evaluateFormula,
  validateFormula,
  buildFormulaContext,
  createFormulaContext,
  calculateAllPlanks,
  createPlanksFromCalculated,
  recalculatePlanks,
  detectPlankRole,
  determinePlankCategory,
  getStandardFormulas,
  createStandardPlankTemplate,
  createBaseUnitTemplate,
  createWallUnitTemplate,
  createTallUnitTemplate,
  STANDARD_FORMULAS,
};
