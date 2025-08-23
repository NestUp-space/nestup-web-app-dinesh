export interface DesignStyle {
  id: number;
  name: string;
  shortDescription: string;
  fullDescription: string;
  images: string[];
  priceMultiplier: number;
  recommended: boolean;
  features: string[];
  popular: boolean;
}

export const designStyles: DesignStyle[] = [
  {
    id: 1,
    name: "Modern Minimalist",
    shortDescription: "Clean lines, neutral colors, and functional furniture for a clutter-free living space.",
    fullDescription:
      "Our Modern Minimalist design emphasizes simplicity and functionality. Features include sleek furniture with clean geometric lines, a neutral color palette of whites, grays, and blacks, hidden storage solutions, and carefully curated decor pieces. Perfect for those who appreciate understated elegance and organized living spaces.",
    images: [
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
    ],
    priceMultiplier: 1.0,
    recommended: true,
    features: ["Clean geometric lines", "Neutral color palette", "Hidden storage", "Functional furniture"],
    popular: true,
  },
  {
    id: 2,
    name: "Contemporary Chic",
    shortDescription: "Blend of modern and traditional elements with bold accents and luxurious textures.",
    fullDescription:
      "Contemporary Chic combines the best of modern design with timeless traditional elements. This style features a sophisticated color palette with bold accent walls, mixed textures including velvet and leather, statement lighting fixtures, and carefully selected artwork. Ideal for those who want a stylish yet comfortable home.",
    images: [
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
    ],
    priceMultiplier: 1.2,
    recommended: false,
    features: ["Bold accent walls", "Mixed textures", "Statement lighting", "Curated artwork"],
    popular: false,
  },
  {
    id: 3,
    name: "Scandinavian Comfort",
    shortDescription: "Light woods, cozy textiles, and hygge-inspired elements for a warm, inviting atmosphere.",
    fullDescription:
      "Scandinavian Comfort brings the Danish concept of hygge into your home. This design features light wood furniture, cozy textiles in natural fibers, a palette of whites and soft pastels, plenty of natural light, and plants throughout the space. Perfect for creating a warm, inviting atmosphere that promotes relaxation and well-being.",
    images: [
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
    ],
    priceMultiplier: 1.1,
    recommended: true,
    features: ["Light wood furniture", "Cozy textiles", "Natural light focus", "Indoor plants"],
    popular: true,
  },
  {
    id: 4,
    name: "Industrial Loft",
    shortDescription: "Exposed brick, metal accents, and raw materials for an urban, edgy aesthetic.",
    fullDescription:
      "Industrial Loft style embraces the raw beauty of urban living. Features include exposed brick walls, metal and steel accents, concrete floors, vintage leather furniture, and Edison bulb lighting. This design is perfect for those who appreciate the aesthetic of converted warehouses and urban lofts.",
    images: [
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
    ],
    priceMultiplier: 1.3,
    recommended: false,
    features: ["Exposed brick walls", "Metal accents", "Concrete elements", "Vintage leather"],
    popular: false,
  },
  {
    id: 5,
    name: "Classic Traditional",
    shortDescription: "Timeless elegance with rich woods, warm colors, and sophisticated furnishings.",
    fullDescription:
      "Classic Traditional design never goes out of style. This approach features rich wood furniture, warm color palettes with deep reds and golds, elegant fabrics like silk and velvet, traditional patterns, and sophisticated accessories. Ideal for those who appreciate timeless elegance and formal living spaces.",
    images: [
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
    ],
    priceMultiplier: 1.4,
    recommended: false,
    features: ["Rich wood furniture", "Warm color palette", "Elegant fabrics", "Traditional patterns"],
    popular: false,
  },
  {
    id: 6,
    name: "Bohemian Eclectic",
    shortDescription: "Vibrant colors, mixed patterns, and global influences for a free-spirited vibe.",
    fullDescription:
      "Bohemian Eclectic celebrates creativity and individuality. This style features vibrant colors and bold patterns, mixed textures and materials, global-inspired decor, layered rugs and textiles, and an eclectic mix of furniture styles. Perfect for those who want their home to reflect their travels and artistic sensibilities.",
    images: [
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
    ],
    priceMultiplier: 1.15,
    recommended: false,
    features: ["Vibrant colors", "Mixed patterns", "Global influences", "Layered textiles"],
    popular: false,
  },
];
