"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Home, ChevronDown, ChevronUp, FileText, Calendar, MapPin, Phone, Star } from "lucide-react"
import { QuoteProgress } from "@/components/quote/quote-progress"
import Navbar from "@/components/landing-page/Navbar"
import { Footer } from "@/components/landing-page/Footer"
import StickyCTA from "@/components/common/StickyCTA"
import { 
  materialOptions, 
  initialMaterialCategories,
  type MaterialItem 
} from "@/data/get-quote/materials"

// Define recommended options for each category
const recommendedOptions = {
  plywood: {
    brand: "Century",
    subtype: "Marine Grade"
  },
  laminate: {
    brand: "Merino", 
    subtype: "Cappuccino Matt"
  },
  hardware: {
    brand: "Hettich",
    subtype: "Soft Close"
  }
}

export default function MaterialSelectionPage() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["A"]))
  const [materialCategories, setMaterialCategories] = useState(initialMaterialCategories)

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleMaterialChange = (categoryId: string, itemIndex: number, field: keyof MaterialItem, value: string) => {
    setMaterialCategories((prev) =>
      prev.map((category) => {
        if (category.id === categoryId) {
          return {
            ...category,
            items: category.items.map((item, index) => {
              if (index === itemIndex) {
                const updated = { ...item, [field]: value }
                // Recalculate total when brand or subtype changes
                if (field === "brand" || field === "subtype") {
                  // Simple price multiplier based on brand/subtype (in real app, this would come from API)
                  const multiplier = getBrandMultiplier(value, field)
                  updated.unitPrice = Math.round(item.unitPrice * multiplier)
                  updated.total = updated.unitPrice * updated.quantity
                }
                return updated
              }
              return item
            }),
          }
        }
        return category
      }),
    )
  }

  const getBrandMultiplier = (value: string, field: string): number => {
    if (field === "brand") {
      const multipliers: { [key: string]: number } = {
        Century: 1.0,
        Greenply: 0.95,
        Kitply: 1.1,
        "Action Tesa": 0.9,
        Merino: 1.0,
        Greenlam: 0.95,
        Formica: 1.15,
        Sunmica: 0.85,
        Hettich: 1.0,
        Blum: 1.2,
        Hafele: 1.1,
        Ebco: 0.9,
      }
      return multipliers[value] || 1.0
    }
    if (field === "subtype") {
      const multipliers: { [key: string]: number } = {
        "Marine Grade": 1.2,
        Commercial: 1.0,
        Standard: 0.9,
        Premium: 1.3,
        "Matt Finish": 1.0,
        "Glossy Finish": 1.1,
        Textured: 1.15,
        "Suede Finish": 1.05,
        "Soft Close": 1.3,
        "Full Extension": 1.4,
        "Cappuccino Matt": 1.0,
        "Ideal Oak": 1.0,
        "White Matt": 1.0,
        "Walnut Matt": 1.1,
        "Classic Teak": 1.05,
        "Grey Matt": 1.0,
        "Natural Oak": 0.95,
        "Dark Walnut": 1.1,
      }
      return multipliers[value] || 1.0
    }
    return 1.0
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const calculateCategoryTotal = (items: MaterialItem[]) => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const calculateTotal = () => {
    return materialCategories.reduce((sum, category) => sum + calculateCategoryTotal(category.items), 0)
  }

  const isRecommended = (categoryId: string, field: string, value: string) => {
    const categoryMap: { [key: string]: string } = {
      "A": "plywood",
      "B": "laminate", 
      "C": "hardware"
    }
    const category = categoryMap[categoryId]
    return recommendedOptions[category as keyof typeof recommendedOptions]?.[field as keyof typeof recommendedOptions.plywood] === value
  }

  return (
    <div className="">
      <div className="fixed top-0 left-0 right-0 w-full h-20 md:h-24 bg-white z-50">
        <Navbar />
      </div>
      <div className="mt-20 md:mt-24 w-full">
        <div className="min-h-screen bg-neutral-light">
          {/* Progress Bar */}
          <QuoteProgress currentStep={4} />

          {/* Main Content */}
          <div className="container mx-auto px-4 py-4 max-w-5xl">
            <div className="space-y-4">
              {/* Step Header */}
              <div className="text-center space-y-2">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-sans font-bold text-primary-blue">Select your materials</h1>
                <p className="text-sm md:text-base text-dark-text">Choose the quality and brands for your interior</p>
                <div className="flex items-center justify-center space-x-2 text-xs text-dark-text">
                  <Star className="h-3 w-3 text-primary-orange fill-primary-orange" />
                  <span>Recommended options are pre-selected</span>
                </div>
              </div>

              {/* Material Categories */}
              <div className="space-y-3">
                {materialCategories.map((category) => (
                  <Card key={category.id} className="p-3 bg-white border border-neutral-light">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="flex items-center justify-between text-base md:text-lg">
                        <span className="text-primary-blue">{category.name}</span>
                        <Badge variant="secondary" className="text-xs bg-primary-orange text-white">{category.items.length} items</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-2">
                      {category.items.map((item, index) => (
                        <div key={index} className="border rounded-md p-3 border-neutral-light">
                          {/* Mobile Layout */}
                          <div className="block sm:hidden space-y-3">
                            {/* First Row: Material Type + Quantity + Total Price */}
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-primary-blue">{item.type} {item.quantity} {item.unit}</h4>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <p className="font-medium text-sm text-primary-blue">{formatCurrency(item.total)}</p>
                              </div>
                            </div>
                            
                            {/* Second Row: Brand + Subtype + Unit Price */}
                            <div className="flex justify-between items-center">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-dark-text">{item.brand} • {item.subtype}</p>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <p className="text-xs text-dark-text">{formatCurrency(item.unitPrice)} each</p>
                              </div>
                            </div>

                            {/* Third Row: Brand and Subtype Selectors */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-light/50">
                              <div>
                                <Label htmlFor={`brand-${category.id}-${index}`} className="text-xs text-primary-blue">Brand</Label>
                                <Select
                                  value={item.brand}
                                  onValueChange={(value) => handleMaterialChange(category.id, index, "brand", value)}
                                >
                                  <SelectTrigger className="h-8 mt-1 border-primary-blue/20 focus:border-primary-blue text-sm">
                                    <SelectValue placeholder="Select brand" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {materialOptions[category.id === "A" ? "plywood" : category.id === "B" ? "laminate" : "hardware"]?.brands.map((brand) => (
                                      <SelectItem key={brand} value={brand} className="hover:bg-primary-blue/10 focus:bg-primary-blue/10 data-[highlighted]:bg-primary-blue/10">
                                        <div className="flex items-center justify-between w-full">
                                          <span className="text-sm">{brand}</span>
                                          {isRecommended(category.id, "brand", brand) && (
                                            <Star className="h-3 w-3 text-primary-orange fill-primary-orange ml-2" />
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label htmlFor={`subtype-${category.id}-${index}`} className="text-xs text-primary-blue">Subtype</Label>
                                <Select
                                  value={item.subtype}
                                  onValueChange={(value) => handleMaterialChange(category.id, index, "subtype", value)}
                                >
                                  <SelectTrigger className="h-8 mt-1 border-primary-blue/20 focus:border-primary-blue text-sm">
                                    <SelectValue placeholder="Select subtype" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {materialOptions[category.id === "A" ? "plywood" : category.id === "B" ? "laminate" : "hardware"]?.subtypes[item.brand]?.map(
                                      (subtype) => (
                                        <SelectItem key={subtype} value={subtype} className="hover:bg-primary-blue/10 focus:bg-primary-blue/10 data-[highlighted]:bg-primary-blue/10">
                                          <div className="flex items-center justify-between w-full">
                                            <span className="text-sm">{subtype}</span>
                                            {isRecommended(category.id, "subtype", subtype) && (
                                              <Star className="h-3 w-3 text-primary-orange fill-primary-orange ml-2" />
                                            )}
                                          </div>
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:grid sm:grid-cols-12 gap-3 items-center">
                            {/* Material Info - Left */}
                            <div className="col-span-3">
                              <h4 className="font-medium text-sm text-primary-blue">{item.type}</h4>
                              <p className="text-xs text-dark-text">
                                {item.quantity} {item.unit}
                              </p>
                            </div>

                            {/* Brand Selector - Middle Left */}
                            <div className="col-span-3">
                              <Label htmlFor={`brand-${category.id}-${index}`} className="text-xs text-primary-blue">Brand</Label>
                              <Select
                                value={item.brand}
                                onValueChange={(value) => handleMaterialChange(category.id, index, "brand", value)}
                              >
                                <SelectTrigger className="h-8 mt-1 border-primary-blue/20 focus:border-primary-blue text-sm">
                                  <SelectValue placeholder="Select brand" />
                                </SelectTrigger>
                                <SelectContent>
                                  {materialOptions[category.id === "A" ? "plywood" : category.id === "B" ? "laminate" : "hardware"]?.brands.map((brand) => (
                                    <SelectItem key={brand} value={brand} className="hover:bg-primary-blue/10 focus:bg-primary-blue/10 data-[highlighted]:bg-primary-blue/10">
                                      <div className="flex items-center justify-between w-full">
                                        <span className="text-sm">{brand}</span>
                                        {isRecommended(category.id, "brand", brand) && (
                                          <Star className="h-3 w-3 text-primary-orange fill-primary-orange ml-2" />
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Subtype Selector - Middle Right */}
                            <div className="col-span-3">
                              <Label htmlFor={`subtype-${category.id}-${index}`} className="text-xs text-primary-blue">Subtype</Label>
                              <Select
                                value={item.subtype}
                                onValueChange={(value) => handleMaterialChange(category.id, index, "subtype", value)}
                              >
                                <SelectTrigger className="h-8 mt-1 border-primary-blue/20 focus:border-primary-blue text-sm">
                                  <SelectValue placeholder="Select subtype" />
                                </SelectTrigger>
                                <SelectContent>
                                  {materialOptions[category.id === "A" ? "plywood" : category.id === "B" ? "laminate" : "hardware"]?.subtypes[item.brand]?.map(
                                    (subtype) => (
                                      <SelectItem key={subtype} value={subtype} className="hover:bg-primary-blue/10 focus:bg-primary-blue/10 data-[highlighted]:bg-primary-blue/10">
                                        <div className="flex items-center justify-between w-full">
                                          <span className="text-sm">{subtype}</span>
                                          {isRecommended(category.id, "subtype", subtype) && (
                                            <Star className="h-3 w-3 text-primary-orange fill-primary-orange ml-2" />
                                          )}
                                        </div>
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Price Info - Right */}
                            <div className="col-span-3 text-right">
                              <p className="font-medium text-sm text-primary-blue">{formatCurrency(item.total)}</p>
                              <p className="text-xs text-dark-text">{formatCurrency(item.unitPrice)} each</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Total Summary */}
              <Card className="p-3 bg-primary-orange/5 border-primary-orange/20">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <div>
                      <h3 className="text-sm md:text-base font-semibold text-primary-blue">Total Material Cost</h3>
                      <p className="text-xs text-dark-text">Including all selected materials and brands</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-lg md:text-xl font-bold text-primary-blue">{formatCurrency(calculateTotal())}</p>
                      <p className="text-xs text-dark-text">Excluding taxes and installation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sticky CTA */}
          <StickyCTA
            backHref="/get-quote/design"
            continueHref="/get-quote/summary"
            continueText="Get Quote"
          />
        </div>
      </div>
      {/* Add margin to prevent content from appearing below sticky CTA */}
      <div className="h-32"></div>
    </div>
  )
}
