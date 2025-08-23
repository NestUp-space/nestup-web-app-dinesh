export interface FloorPlan {
  id: number;
  name: string;
  bhk: string;
  area: number;
  features: string[];
  thumbnail: string;
  pdfUrl: string;
  price: string;
  popular: boolean;
}

export const floorPlans: FloorPlan[] = [
  {
    id: 1,
    name: "Compact 1BHK",
    bhk: "1BHK",
    area: 650,
    features: ["1 Bathroom", "Balcony", "Open Kitchen"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    pdfUrl: "#",
    price: "Starting ₹8.5L",
    popular: false,
  },
  {
    id: 2,
    name: "Classic 2BHK",
    bhk: "2BHK",
    area: 1050,
    features: ["2 Bathrooms", "2 Balconies", "Separate Kitchen"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    pdfUrl: "#",
    price: "Starting ₹12.8L",
    popular: true,
  },
  {
    id: 3,
    name: "Premium 2BHK",
    bhk: "2BHK",
    area: 1250,
    features: ["2 Bathrooms", "Utility Area", "Large Living Room"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    pdfUrl: "#",
    price: "Starting ₹15.2L",
    popular: false,
  },
  {
    id: 4,
    name: "Spacious 3BHK",
    bhk: "3BHK",
    area: 1450,
    features: ["3 Bathrooms", "Master Bedroom", "Dining Area"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    pdfUrl: "#",
    price: "Starting ₹18.5L",
    popular: true,
  },
  {
    id: 5,
    name: "Luxury 3BHK",
    bhk: "3BHK",
    area: 1650,
    features: ["3 Bathrooms", "Walk-in Closet", "Powder Room"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    pdfUrl: "#",
    price: "Starting ₹22.3L",
    popular: false,
  },
  {
    id: 6,
    name: "Grand 4BHK",
    bhk: "4BHK",
    area: 2100,
    features: ["4 Bathrooms", "Study Room", "Servant Quarter"],
    thumbnail: "/placeholder.svg?height=200&width=300",
    pdfUrl: "#",
    price: "Starting ₹28.7L",
    popular: false,
  },
];
