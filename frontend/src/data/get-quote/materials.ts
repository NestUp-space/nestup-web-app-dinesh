export interface MaterialItem {
  type: string;
  quantity: number;
  unit: string;
  brand: string;
  subtype: string;
  unitPrice: number;
  total: number;
}

export interface MaterialCategory {
  id: string;
  name: string;
  description: string;
  items: MaterialItem[];
}

export interface MaterialCategoryOptions {
  brands: string[];
  subtypes: { [key: string]: string[] };
}

export interface MaterialOptions {
  plywood: MaterialCategoryOptions;
  laminate: MaterialCategoryOptions;
  hardware: MaterialCategoryOptions;
}

export const materialOptions: MaterialOptions = {
  plywood: {
    brands: ["Century", "Greenply", "Kitply", "Action Tesa"],
    subtypes: {
      Century: ["Marine Grade", "Commercial", "Standard", "Premium"],
      Greenply: ["Marine Grade", "Commercial", "Standard", "Premium"],
      Kitply: ["Marine Grade", "Commercial", "Standard"],
      "Action Tesa": ["Marine Grade", "Commercial", "Standard"],
    },
  },
  laminate: {
    brands: ["Merino", "Greenlam", "Formica", "Sunmica"],
    subtypes: {
      Merino: ["Matt Finish", "Glossy Finish", "Textured", "Cappuccino Matt", "Walnut Matt"],
      Greenlam: ["Matt Finish", "Glossy Finish", "Suede Finish", "Ideal Oak", "Classic Teak"],
      Formica: ["Matt Finish", "Glossy Finish", "Textured", "White Matt", "Grey Matt"],
      Sunmica: ["Matt Finish", "Glossy Finish", "Textured", "Natural Oak", "Dark Walnut"],
    },
  },
  hardware: {
    brands: ["Hettich", "Blum", "Hafele", "Ebco"],
    subtypes: {
      Hettich: ["Standard", "Premium", "Soft Close", "Full Extension"],
      Blum: ["Standard", "Premium", "Soft Close", "Full Extension"],
      Hafele: ["Standard", "Premium", "Soft Close"],
      Ebco: ["Standard", "Premium", "Soft Close"],
    },
  },
};

export const initialMaterialCategories: MaterialCategory[] = [
  {
    id: "A",
    name: "Plywoods",
    description: "Various plywood sheets and boards",
    items: [
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
  },
  {
    id: "B",
    name: "Laminates",
    description: "Decorative laminate sheets",
    items: [
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
      {
        type: "Wardrobe Laminate",
        quantity: 12,
        unit: "Sheets",
        brand: "Formica",
        subtype: "White Matt",
        unitPrice: 1450,
        total: 17400,
      },
    ],
  },
  {
    id: "C",
    name: "Hardware",
    description: "Cabinet hardware and fittings",
    items: [
      {
        type: "Hinges Soft Close",
        quantity: 93,
        unit: "Sets",
        brand: "Hettich",
        subtype: "Soft Close",
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
      {
        type: "Cabinet Handles",
        quantity: 45,
        unit: "Pieces",
        brand: "Hafele",
        subtype: "Premium",
        unitPrice: 180,
        total: 8100,
      },
    ],
  },
];

