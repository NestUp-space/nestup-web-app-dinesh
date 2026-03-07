/**
 * Plank Formula System - EXACT PORT from Central_Catalogue formulas
 * 
 * This system replicates the Google Sheets formula behavior:
 * When box dimensions change, all plank dimensions are recalculated.
 * 
 * Formula derivations based on analyzing the Central Catalogue CSV:
 * 
 * For a box with:
 * - boxWidth (N), boxDepth (O), boxHeight (P)
 * - skirting (Q), skirtingWidth (R)
 * - carcassThickness (S), doorThickness (T), backplankThickness (U)
 * 
 * Plank formulas:
 * - left plank:   lenX = S, lenY = O - S - U, lenZ = P, X = 0, Y = S, Z = 0
 * - right plank:  lenX = S, lenY = O - S - U, lenZ = P, X = N - S, Y = S, Z = 0
 * - top plank:    lenX = N - 2*S, lenY = O - S - U, lenZ = S, X = S, Y = S, Z = P - S
 * - bottom plank: lenX = N - 2*S, lenY = O - S - U, lenZ = S, X = S, Y = S, Z = Q
 * - back plank:   lenX = N - 2*S, lenY = U, lenZ = P - Q - S, X = S, Y = O - U, Z = Q
 * - skirting:     lenX = R, lenY = S, lenZ = Q, X = S, Y = S, Z = 0
 * - shelf:        lenX = N - 2*S, lenY = O - S - U, lenZ = S, X = S, Y = S, Z = calculated
 * - door:         lenX = (N/2) - 1, lenY = T, lenZ = P - Q - 2, X = 0, Y = 0, Z = Q
 */

import { Plank, Position, Dimensions, PlankRole } from '@/types/visualiser';

export interface BoxDimensions {
  boxWidth: number;       // N - width along X axis
  boxDepth: number;       // O - depth along Y axis
  boxHeight: number;      // P - height along Z axis
  skirting: number;       // Q - skirting height
  skirtingWidth: number;  // R - skirting plank width
  carcusThickness: number;   // S - carcass plywood thickness
  doorThickness: number;     // T - door plywood thickness
  backplankThickness: number; // U - back panel thickness
}

export interface PlankFormula {
  entityName: string;
  role: PlankRole;
  material: 'carcus' | 'door' | 'back';
  isDoor: boolean;
  // Dimension formulas - functions that take box dimensions and return the value
  lenX: (box: BoxDimensions) => number;
  lenY: (box: BoxDimensions) => number;
  lenZ: (box: BoxDimensions) => number;
  // Position formulas
  posX: (box: BoxDimensions) => number;
  posY: (box: BoxDimensions) => number;
  posZ: (box: BoxDimensions) => number;
}

/**
 * Standard plank formulas for a 2-door base cabinet
 * Derived from analyzing the Central_Catalogue data
 */
export const STANDARD_PLANK_FORMULAS: PlankFormula[] = [
  // Left vertical panel
  {
    entityName: 'left plank',
    role: 'left',
    material: 'carcus',
    isDoor: false,
    lenX: (box) => box.carcusThickness,
    lenY: (box) => box.boxDepth - box.carcusThickness - box.backplankThickness,
    lenZ: (box) => box.boxHeight,
    posX: () => 0,
    posY: (box) => box.carcusThickness,
    posZ: () => 0,
  },
  // Right vertical panel
  {
    entityName: 'right plank',
    role: 'right',
    material: 'carcus',
    isDoor: false,
    lenX: (box) => box.carcusThickness,
    lenY: (box) => box.boxDepth - box.carcusThickness - box.backplankThickness,
    lenZ: (box) => box.boxHeight,
    posX: (box) => box.boxWidth - box.carcusThickness,
    posY: (box) => box.carcusThickness,
    posZ: () => 0,
  },
  // Top horizontal panel
  {
    entityName: 'top plank',
    role: 'top',
    material: 'carcus',
    isDoor: false,
    lenX: (box) => box.boxWidth - 2 * box.carcusThickness,
    lenY: (box) => box.boxDepth - box.carcusThickness - box.backplankThickness,
    lenZ: (box) => box.carcusThickness,
    posX: (box) => box.carcusThickness,
    posY: (box) => box.carcusThickness,
    posZ: (box) => box.boxHeight - box.carcusThickness,
  },
  // Bottom horizontal panel
  {
    entityName: 'bottom plank',
    role: 'bottom',
    material: 'carcus',
    isDoor: false,
    lenX: (box) => box.boxWidth - 2 * box.carcusThickness,
    lenY: (box) => box.boxDepth - box.carcusThickness - box.backplankThickness,
    lenZ: (box) => box.carcusThickness,
    posX: (box) => box.carcusThickness,
    posY: (box) => box.carcusThickness,
    posZ: (box) => box.skirting,
  },
  // Back panel
  {
    entityName: 'back_plank',
    role: 'back',
    material: 'back',
    isDoor: false,
    lenX: (box) => box.boxWidth - 2 * box.carcusThickness + 4, // +4mm for slot overlap
    lenY: (box) => box.backplankThickness,
    lenZ: (box) => box.boxHeight - box.skirting - box.carcusThickness,
    posX: (box) => box.carcusThickness - 2, // -2mm for slot
    posY: (box) => box.boxDepth - box.backplankThickness,
    posZ: (box) => box.skirting,
  },
  // Skirting plank (front base cover)
  {
    entityName: 'skriting',
    role: 'skirting',
    material: 'carcus',
    isDoor: false,
    lenX: (box) => box.skirtingWidth,
    lenY: (box) => box.carcusThickness,
    lenZ: (box) => box.skirting,
    posX: (box) => box.carcusThickness,
    posY: (box) => box.carcusThickness,
    posZ: () => 0,
  },
  // Shelf plank (middle shelf)
  {
    entityName: 'shelf plank',
    role: 'shelf',
    material: 'carcus',
    isDoor: false,
    lenX: (box) => box.boxWidth - 2 * box.carcusThickness,
    lenY: (box) => box.boxDepth - 2 * box.carcusThickness - box.backplankThickness,
    lenZ: (box) => box.carcusThickness,
    posX: (box) => box.carcusThickness,
    posY: (box) => box.carcusThickness + 20, // Offset from front for notch
    posZ: (box) => box.skirting + Math.floor((box.boxHeight - box.skirting) / 2), // Middle height
  },
  // Door 1 (left door)
  {
    entityName: 'Door 1',
    role: 'door',
    material: 'door',
    isDoor: true,
    lenX: (box) => Math.floor((box.boxWidth - 2) / 2) - 1, // Half width minus gaps
    lenY: (box) => box.doorThickness,
    lenZ: (box) => box.boxHeight - box.skirting - 2, // Height minus skirting and gap
    posX: () => 0,
    posY: () => 0,
    posZ: (box) => box.skirting,
  },
  // Door 2 (right door)
  {
    entityName: 'Door 2',
    role: 'door',
    material: 'door',
    isDoor: true,
    lenX: (box) => Math.floor((box.boxWidth - 2) / 2) - 1,
    lenY: (box) => box.doorThickness,
    lenZ: (box) => box.boxHeight - box.skirting - 2,
    posX: (box) => Math.floor(box.boxWidth / 2) + 1, // Starts at center + gap
    posY: () => 0,
    posZ: (box) => box.skirting,
  },
];

/**
 * Generate a unique ID for planks
 */
let plankIdCounter = 0;
export function generatePlankId(): string {
  return `plank_${Date.now()}_${++plankIdCounter}`;
}

/**
 * Calculate planks for a box using formulas
 * This replaces the Google Sheets formula evaluation
 */
export function calculatePlanksFromFormulas(
  boxDimensions: BoxDimensions,
  formulas: PlankFormula[] = STANDARD_PLANK_FORMULAS
): Plank[] {
  return formulas.map((formula, index) => {
    const dimensions: Dimensions = {
      lenX: Math.max(1, formula.lenX(boxDimensions)),
      lenY: Math.max(1, formula.lenY(boxDimensions)),
      lenZ: Math.max(1, formula.lenZ(boxDimensions)),
    };

    const position: Position = {
      x: formula.posX(boxDimensions),
      y: formula.posY(boxDimensions),
      z: formula.posZ(boxDimensions),
    };

    // Determine thickness based on material type
    let thickness = boxDimensions.carcusThickness;
    if (formula.material === 'door') {
      thickness = boxDimensions.doorThickness;
    } else if (formula.material === 'back') {
      thickness = boxDimensions.backplankThickness;
    }

    return {
      id: generatePlankId(),
      entityName: formula.entityName,
      material: formula.material === 'carcus' ? 'Plywood' : 
                formula.material === 'door' ? 'Door Plywood' : 'Back Plywood',
      materialColor: getMaterialColor(formula.entityName, formula.material),
      thickness,
      position,
      dimensions,
      role: formula.role,
      explodeDirection: getExplodeDirection(formula.role),
      assemblyDirection: { arrow: '', text: '' },
      isDoor: formula.isDoor,
      assemblyOrder: index + 1,
      autoGenerated: true,
      rowIndex: index + 2, // Simulate row index (box is row 1)
    };
  });
}

/**
 * Index of formulas by role so we can assign the correct formula when there are
 * multiple planks with the same role (e.g. Door 1 and Door 2).
 */
const FORMULA_INDICES_BY_ROLE: Record<string, number[]> = (() => {
  const map: Record<string, number[]> = {};
  STANDARD_PLANK_FORMULAS.forEach((f, index) => {
    const r = f.role;
    if (!map[r]) map[r] = [];
    map[r].push(index);
  });
  return map;
})();

/**
 * Find the best matching formula for a plank: by entityName first, then by role + order index.
 * This ensures e.g. two door planks get Door 1 and Door 2 formulas respectively, not both Door 1.
 */
function getFormulaForPlank(
  plank: Plank,
  roleOrderIndex: Record<string, number>
): PlankFormula | undefined {
  const nameLower = (plank.entityName || '').toLowerCase().trim();
  // 1) Exact entityName match (e.g. "Door 1" <-> "Door 1")
  if (nameLower) {
    const byName = STANDARD_PLANK_FORMULAS.find(
      (f) => f.entityName.toLowerCase() === nameLower
    );
    if (byName) return byName;
  }

  // 2) Match by role and order: Nth plank with this role -> Nth formula with this role
  // So first door plank gets Door 1 formula, second gets Door 2, etc.
  const indices = FORMULA_INDICES_BY_ROLE[plank.role];
  if (!indices || indices.length === 0) return undefined;
  const order = roleOrderIndex[plank.role] ?? 0;
  const formulaIndex = indices[Math.min(order, indices.length - 1)];
  return STANDARD_PLANK_FORMULAS[formulaIndex];
}

/**
 * Recalculate all plank dimensions when box dimensions change
 * This is the core function that mimics Google Sheets formula recalculation.
 * Assigns formulas by entityName first, then by role + plank order so multiple
 * doors (Door 1, Door 2) each get the correct position and dimensions.
 */
export function recalculatePlanks(
  existingPlanks: Plank[],
  newBoxDimensions: BoxDimensions
): Plank[] {
  const roleOrderIndex: Record<string, number> = {};
  return existingPlanks.map((plank) => {
    const formula = getFormulaForPlank(plank, roleOrderIndex);
    if (plank.role) {
      roleOrderIndex[plank.role] = (roleOrderIndex[plank.role] ?? 0) + 1;
    }

    if (!formula) {
      return plank;
    }

    return {
      ...plank,
      dimensions: {
        lenX: Math.max(1, formula.lenX(newBoxDimensions)),
        lenY: Math.max(1, formula.lenY(newBoxDimensions)),
        lenZ: Math.max(1, formula.lenZ(newBoxDimensions)),
      },
      position: {
        x: formula.posX(newBoxDimensions),
        y: formula.posY(newBoxDimensions),
        z: formula.posZ(newBoxDimensions),
      },
      thickness: formula.material === 'door' ? newBoxDimensions.doorThickness :
                 formula.material === 'back' ? newBoxDimensions.backplankThickness :
                 newBoxDimensions.carcusThickness,
    };
  });
}

/**
 * Get material color based on plank type
 */
function getMaterialColor(entityName: string, materialType: string): string {
  const name = entityName.toLowerCase();
  
  if (name.includes('door')) {
    return '#D4A574'; // Door color - lighter wood
  }
  if (name.includes('back') || materialType === 'back') {
    return '#8B7355'; // Back panel - darker
  }
  if (name.includes('skirting') || name.includes('skriting')) {
    return '#A0522D'; // Skirting - distinct color
  }
  if (name.includes('shelf')) {
    return '#DEB887'; // Shelf - burlywood
  }
  
  // Default carcass color
  return '#C4A484'; // Standard plywood color
}

/**
 * Get explode direction for animation
 */
function getExplodeDirection(role: PlankRole): Position {
  switch (role) {
    case 'left':
      return { x: -1, y: 0, z: 0 };
    case 'right':
      return { x: 1, y: 0, z: 0 };
    case 'top':
      return { x: 0, y: 0, z: 1 };
    case 'bottom':
      return { x: 0, y: 0, z: -1 };
    case 'back':
      return { x: 0, y: 1, z: 0 };
    case 'door':
      return { x: 0, y: -1, z: 0 };
    case 'skirting':
      return { x: 0, y: -1, z: 0 };
    default:
      return { x: 0, y: 0, z: 0 };
  }
}

/**
 * Parse plank data from CSV row values
 * Used when loading from catalog CSV
 */
export function parsePlankFromCsvRow(
  values: string[],
  columns: Record<string, number>
): Partial<Plank> {
  return {
    entityName: values[columns.entityName] || '',
    material: values[columns.material] || 'Plywood',
    dimensions: {
      lenX: parseFloat(values[columns.lenX]) || 0,
      lenY: parseFloat(values[columns.lenY]) || 0,
      lenZ: parseFloat(values[columns.lenZ]) || 0,
    },
    position: {
      x: parseFloat(values[columns.x]) || 0,
      y: parseFloat(values[columns.y]) || 0,
      z: parseFloat(values[columns.z]) || 0,
    },
  };
}
