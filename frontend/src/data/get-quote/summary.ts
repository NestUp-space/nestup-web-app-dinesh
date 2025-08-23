export interface SummaryMaterialItem {
  type: string;
  quantity: number;
  unit: string;
  brand: string;
  subtype: string;
  unitPrice: number;
  total: number;
}

export interface MaterialSelections {
  plywoods: SummaryMaterialItem[];
  laminates: SummaryMaterialItem[];
  hardware: SummaryMaterialItem[];
  [key: string]: SummaryMaterialItem[]; // Index signature for string access
}

export interface MultiplierObject {
  [key: string]: number;
}

export interface SubtypesObject {
  [key: string]: string[];
}

export interface SummaryMaterialOptions {
  plywood: {
    brands: string[];
    subtypes: SubtypesObject;
  };
  laminate: {
    brands: string[];
    subtypes: SubtypesObject;
  };
  hardware: {
    brands: string[];
    subtypes: SubtypesObject;
  };
}

export const defaultMaterials: MaterialSelections = {
  plywoods: [
    {
      type: "BWP Ply - 16mm",
      quantity: 28,
      unit: "8ftx4ft Sheets",
      brand: "Century",
      subtype: "Marine Grade",
      unitPrice: 2850,
      total: 79800,
    },
    {
      type: "BWP Ply - 8mm",
      quantity: 8,
      unit: "8ftx4ft Sheets",
      brand: "Century",
      subtype: "Marine Grade",
      unitPrice: 1650,
      total: 13200,
    },
    {
      type: "Plywood - 16mm",
      quantity: 29,
      unit: "8ftx4ft Sheets",
      brand: "Greenply",
      subtype: "Commercial",
      unitPrice: 2200,
      total: 63800,
    },
    {
      type: "Block Board - 18mm",
      quantity: 12,
      unit: "8ftx4ft Sheets",
      brand: "Century",
      subtype: "Standard",
      unitPrice: 2950,
      total: 35400,
    },
  ],
  laminates: [
    {
      type: "Kitchen Laminate",
      quantity: 10,
      unit: "Sheets",
      brand: "Merino",
      subtype: "Cappuccino Matt",
      unitPrice: 1850,
      total: 18500,
    },
    {
      type: "Bedroom Laminate",
      quantity: 15,
      unit: "Sheets",
      brand: "Greenlam",
      subtype: "Ideal Oak",
      unitPrice: 1650,
      total: 24750,
    },
  ],
  hardware: [
    {
      type: "Hinges Soft Close",
      quantity: 93,
      unit: "Sets",
      brand: "Hettich",
      subtype: "Standard",
      unitPrice: 450,
      total: 41850,
    },
    {
      type: "Drawer Channels",
      quantity: 22,
      unit: "Sets",
      brand: "Hettich",
      subtype: "Full Extension",
      unitPrice: 850,
      total: 18700,
    },
  ],
};

export const summaryMaterialOptions: SummaryMaterialOptions = {
  plywood: {
    brands: ["Century", "Greenply", "Kitply", "Action Tesa"],
    subtypes: {
      Century: ["Marine Grade", "Commercial", "Standard"],
      Greenply: ["Marine Grade", "Commercial", "Standard", "Premium"],
      Kitply: ["Marine Grade", "Commercial"],
      "Action Tesa": ["Marine Grade", "Standard"],
    },
  },
  laminate: {
    brands: ["Merino", "Greenlam", "Formica", "Sunmica"],
    subtypes: {
      Merino: ["Matt Finish", "Glossy Finish", "Textured"],
      Greenlam: ["Matt Finish", "Glossy Finish", "Suede Finish"],
      Formica: ["Matt Finish", "Glossy Finish"],
      Sunmica: ["Matt Finish", "Glossy Finish"],
    },
  },
  hardware: {
    brands: ["Hettich", "Blum", "Hafele", "Ebco"],
    subtypes: {
      Hettich: ["Standard", "Premium", "Soft Close"],
      Blum: ["Standard", "Premium", "Soft Close"],
      Hafele: ["Standard", "Premium"],
      Ebco: ["Standard", "Premium"],
    },
  },
};

// Mock data representing user's selections throughout the flow
export const userSelections = {
  society: "Prestige Lakeside Habitat, Varthur",
  floorPlan: "Classic 2BHK - 1050 sq.ft",
  design: "Modern Minimalist",
};
