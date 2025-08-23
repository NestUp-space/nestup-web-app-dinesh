export interface BrandOption {
  id: string;
  name: string;
  multiplier: number;
  description: string;
}

export interface BrandOptions {
  plywoods: BrandOption[];
  laminates: BrandOption[];
  edgebanding: BrandOption[];
  hardware: BrandOption[];
}

export const brandOptions: BrandOptions = {
  plywoods: [
    { id: "standard", name: "Standard Plywood", multiplier: 1.0, description: "Good quality commercial grade" },
    { id: "century", name: "Century Ply", multiplier: 1.3, description: "Premium BWP grade plywood" },
    { id: "greenply", name: "Greenply", multiplier: 1.5, description: "Luxury eco-friendly plywood" },
  ],
  laminates: [
    { id: "standard", name: "Standard Laminate", multiplier: 1.0, description: "Basic decorative laminate" },
    { id: "merino", name: "Merino Laminates", multiplier: 1.4, description: "Premium designer collection" },
    { id: "greenlam", name: "Greenlam", multiplier: 1.6, description: "Luxury textured laminates" },
  ],
  edgebanding: [
    { id: "standard", name: "Standard Edge Band", multiplier: 1.0, description: "Basic PVC edge banding" },
    { id: "rehau", name: "Rehau", multiplier: 1.8, description: "Premium German edge banding" },
    { id: "egger", name: "Egger", multiplier: 1.5, description: "European quality edge bands" },
  ],
  hardware: [
    { id: "standard", name: "Standard Hardware", multiplier: 1.0, description: "Good quality fittings" },
    { id: "hettich", name: "Hettich", multiplier: 1.8, description: "Premium German hardware" },
    { id: "blum", name: "Blum", multiplier: 2.0, description: "Luxury Austrian hardware" },
  ],
};

export const baseCosts = {
  plywoods: 185000,
  laminates: 95000,
  edgebanding: 45000,
  hardware: 125000,
};
