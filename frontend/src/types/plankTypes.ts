export interface Hole {
  x: number;
  y: number;
  z: number;
  t: number;  // thickness/diameter
}

export interface Groove {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  z: number;
  t: number;  // depth
}

export interface PlankDetails {
  width: number;      // W - from width calculation
  length: number;     // L - from length calculation
  materialCode: string; // MC - from material calculation
  plankId: string;    // e.g., "01P1LT"
  holes: Hole[];      // placeholder for future
  grooves: Groove[];  // placeholder for future
}

export interface RuntimeInput {
  inputName: string;
  displayLabel?: string | null;
  value: string | number;
}

export interface ModelPlank {
  plankNumber: string;     // e.g., "P1"
  plankIdentifier: string; // e.g., "LT"
  widthLogic: string;      // JavaScript logic for width calculation
  lengthLogic: string;     // JavaScript logic for length calculation
  materialCode: string;    // JavaScript logic for material code selection
  displayName?: string;    // Optional display name for the plank
  description?: string;    // Optional description of the plank's purpose
  order?: number;          // Optional display/processing order
}

export interface Model {
  id: string;
  name: string;
  planks: ModelPlank[];
  runtimeInputs: Array<{
    inputName: string;
    displayLabel?: string | null;
  }>;
}
