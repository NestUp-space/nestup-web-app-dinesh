"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Home, ArrowLeft, Check, FileText, Maximize2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Navbar from "@/components/landing-page/Navbar"
import { Footer } from "@/components/landing-page/Footer"

// Mock floor plan data
const floorPlans = [
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
]

export default function FloorPlanSelectionPage() {
  const [selectedPlan, setSelectedPlan] = useState<(typeof floorPlans)[0] | null>(null)
  const [previewPlan, setPreviewPlan] = useState<(typeof floorPlans)[0] | null>(null)

  const handlePlanSelect = (plan: (typeof floorPlans)[0]) => {
    setSelectedPlan(plan)
  }

  return (
    <div className="">
      <div className="h-24 top-0 fixed bg-white z-50">
        <Navbar />
      </div>
      <div className="mt-24 w-screen">
        <div className="min-h-screen bg-background">
          {/* Progress Bar */}
          <div className="w-full bg-muted h-1">
            <div className="bg-primary h-1 transition-all duration-300" style={{ width: "42.8%" }}></div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="space-y-8">
              {/* Step Header */}
              <div className="text-center space-y-4">
                <h1 className="text-3xl md:text-4xl font-sans font-bold text-foreground">Choose your floor plan</h1>
                <p className="text-lg text-muted-foreground">Select the layout that matches your apartment</p>
              </div>

              {/* Floor Plan Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {floorPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-lg",
                      selectedPlan?.id === plan.id
                        ? "ring-2 ring-primary border-primary shadow-lg"
                        : "hover:border-primary/50",
                    )}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    <CardContent className="p-0">
                      {/* Plan Image */}
                      <div className="relative">
                        <img
                          src={plan.thumbnail}
                          alt={plan.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        {plan.popular && (
                          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
                            Popular
                          </Badge>
                        )}
                        {selectedPlan?.id === plan.id && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Plan Details */}
                      <div className="p-6 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-sans font-bold text-xl text-foreground">{plan.name}</h3>
                            <Badge variant="secondary">{plan.bhk}</Badge>
                          </div>
                          <p className="text-muted-foreground">{plan.area} sq.ft</p>
                        </div>

                        {/* Features */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-foreground">Key Features:</h4>
                          <div className="flex flex-wrap gap-1">
                            {plan.features.map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="pt-2 border-t border-border">
                          <p className="text-lg font-semibold text-foreground">{plan.price}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Maximize2 className="h-4 w-4 mr-2" />
                                Preview
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>{plan.name} - Floor Plan</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <img
                                  src={plan.thumbnail}
                                  alt={plan.name}
                                  className="w-full h-96 object-contain rounded-lg"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium text-foreground">Specifications</h4>
                                    <p className="text-sm text-muted-foreground">Area: {plan.area} sq.ft</p>
                                    <p className="text-sm text-muted-foreground">Type: {plan.bhk}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-foreground">Features</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                      {plan.features.map((feature, index) => (
                                        <li key={index}>• {feature}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Selected Plan Summary */}
              {selectedPlan && (
                <Card className="p-6 bg-primary/5 border-primary/20">
                  <CardContent className="p-0">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-sans font-bold text-lg text-foreground">{selectedPlan.name}</h3>
                          <Badge variant="secondary">{selectedPlan.bhk}</Badge>
                        </div>
                        <p className="text-muted-foreground">{selectedPlan.area} sq.ft • {selectedPlan.price}</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedPlan.features.slice(0, 3).map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {selectedPlan.features.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{selectedPlan.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sticky CTA */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
            <div className="container mx-auto max-w-6xl">
              <div className="flex items-center justify-between">
                <Link href="/get-quote/society">
                  <Button variant="outline" size="lg">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <Link href={selectedPlan ? "/get-quote/design" : "#"}>
                  <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg" disabled={!selectedPlan}>
                    Continue to Design Selection
                  </Button>
                </Link>
              </div>
              {!selectedPlan && (
                <p className="text-center text-sm text-muted-foreground mt-2">Please select a floor plan to continue</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  )
}
