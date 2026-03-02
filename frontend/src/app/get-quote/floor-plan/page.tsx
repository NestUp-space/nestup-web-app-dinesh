"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Home, Check, Maximize2, Search, Filter, MapPin } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import Navbar from "@/components/landing-page/Navbar"
import StickyCTA from "@/components/common/StickyCTA"
import { QuoteProgress } from "@/components/quote/quote-progress"
import { floorPlans, type FloorPlan } from "@/data/get-quote/floorPlans"

export default function FloorPlanSelectionPage() {
  const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(null)
  const [previewPlan, setPreviewPlan] = useState<FloorPlan | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBHK, setSelectedBHK] = useState<string>("all")

  const handlePlanSelect = (plan: FloorPlan) => {
    setSelectedPlan(plan)
  }

  // Filter floor plans based on search and BHK selection
  const filteredPlans = useMemo(() => {
    return floorPlans.filter((plan) => {
      const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           plan.features.some(feature => 
                             feature.toLowerCase().includes(searchQuery.toLowerCase())
                           )
      const matchesBHK = selectedBHK === "all" || plan.bhk === selectedBHK
      return matchesSearch && matchesBHK
    })
  }, [searchQuery, selectedBHK])

  const bhkOptions = ["all", "1BHK", "2BHK", "3BHK", "4BHK"]

  return (
    <div className="min-h-screen bg-neutral-light">
      <div className="fixed top-0 left-0 right-0 w-full h-20 md:h-24 bg-white z-50">
        <Navbar />
      </div>
      <div className="mt-20 md:mt-24 w-full">
        {/* Progress Bar */}
        <QuoteProgress currentStep={2} />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
          <div className="space-y-6 md:space-y-8">
            {/* Step Header */}
            <div className="text-center space-y-3 md:space-y-4">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-sans font-bold text-primary-blue">Choose your floor plan</h1>
              <p className="text-base md:text-lg text-dark-text">Select the perfect layout that matches your apartment and lifestyle needs</p>
            </div>
            
            {/* Search and Filter Section */}
            <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dark-text" />
                <Input
                  type="text"
                  placeholder="Search floor plans by name or features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 text-base border border-neutral-light focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all duration-200 bg-white"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                {bhkOptions.map((bhk) => (
                  <Button
                    key={bhk}
                    variant={selectedBHK === bhk ? "default" : "outline"}
                    onClick={() => setSelectedBHK(bhk)}
                    className={cn(
                      "px-3 md:px-6 py-2 rounded-lg font-medium transition-all duration-200 text-sm md:text-base",
                      selectedBHK === bhk
                        ? "bg-primary-orange text-white hover:bg-primary-orange/90"
                        : "border border-neutral-light text-dark-text hover:border-primary-blue/50 hover:text-primary-blue bg-white"
                    )}
                  >
                    {bhk === "all" ? "All Plans" : bhk}
                  </Button>
                ))}
              </div>

              {/* Results Count */}
              <div className="text-center">
                <p className="text-dark-text text-sm md:text-base">
                  Showing <span className="font-semibold text-primary-blue">{filteredPlans.length}</span> of{" "}
                  <span className="font-semibold">{floorPlans.length}</span> floor plans
                </p>
              </div>
            </div>

            {/* Floor Plan Grid */}
            {filteredPlans.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-lg bg-white border border-neutral-light",
                      selectedPlan?.id === plan.id
                        ? "ring-2 ring-primary-orange border-primary-orange shadow-lg"
                        : "hover:border-primary-orange/50"
                    )}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    <CardContent className="p-0 overflow-hidden">
                      {/* Plan Image */}
                      <div className="relative group">
                        <Image
                          src={plan.thumbnail}
                          alt={plan.name}
                          width={400}
                          height={300}
                          className="w-full h-40 md:h-48 object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 space-y-2">
                          {plan.popular && (
                            <Badge className="bg-primary-orange text-white font-medium px-2 md:px-3 py-1 text-xs">
                              ⭐ Popular
                            </Badge>
                          )}
                        </div>
                        
                        {selectedPlan?.id === plan.id && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-primary-orange rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Plan Details */}
                      <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                        <div className="space-y-2 md:space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg md:text-xl text-primary-blue truncate">{plan.name}</h3>
                            <Badge className="bg-primary-blue text-white font-medium px-2 md:px-3 py-1 text-xs flex-shrink-0">
                              {plan.bhk}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 text-dark-text">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <p className="text-sm md:text-base font-medium">{plan.area} sq.ft</p>
                          </div>
                          <p className="text-primary-orange font-semibold text-base md:text-lg">{plan.price}</p>
                        </div>

                        {/* Features */}
                        <div className="space-y-2 md:space-y-3">
                          <h4 className="text-xs md:text-sm font-semibold text-primary-blue uppercase tracking-wide">Key Features:</h4>
                          <div className="flex flex-wrap gap-1 md:gap-2">
                            {plan.features.slice(0, 3).map((feature, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs border-primary-orange/20 text-primary-orange bg-primary-orange/5 px-2 md:px-3 py-1 font-medium"
                              >
                                {feature}
                              </Badge>
                            ))}
                            {plan.features.length > 3 && (
                              <Badge 
                                variant="outline" 
                                className="text-xs border-primary-orange/20 text-primary-orange bg-primary-orange/5 px-2 md:px-3 py-1 font-medium"
                              >
                                +{plan.features.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Preview Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border border-neutral-light text-primary-blue hover:bg-primary-orange/5 hover:border-primary-orange/50 font-medium transition-all duration-200 text-sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPreviewPlan(plan)
                              }}
                            >
                              <Maximize2 className="h-4 w-4 mr-2" />
                              Preview Layout
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold text-primary-blue">{plan.name} - Floor Plan</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6">
                              <Image
                                src={plan.thumbnail}
                                alt={plan.name}
                                width={800}
                                height={600}
                                className="w-full rounded-lg shadow-md"
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-lg text-primary-blue">Specifications:</h4>
                                  <div className="space-y-3 text-dark-text">
                                    <div className="flex justify-between py-2 border-b border-neutral-light">
                                      <span>Area:</span>
                                      <span className="font-medium">{plan.area} sq.ft</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-neutral-light">
                                      <span>Type:</span>
                                      <span className="font-medium">{plan.bhk}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-neutral-light">
                                      <span>Price:</span>
                                      <span className="font-medium text-primary-orange">{plan.price}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-lg text-primary-blue">Features:</h4>
                                  <ul className="space-y-2 text-dark-text">
                                    {plan.features.map((feature, index) => (
                                      <li key={index} className="flex items-center space-x-2">
                                        <div className="w-1.5 h-1.5 bg-primary-orange rounded-full" />
                                        <span>{feature}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 md:py-16">
                <div className="max-w-md mx-auto space-y-4">
                  <Search className="h-12 md:h-16 w-12 md:w-16 text-dark-text/30 mx-auto" />
                  <h3 className="text-lg md:text-xl font-semibold text-dark-text">No floor plans found</h3>
                  <p className="text-dark-text/70 text-sm md:text-base">
                    Try adjusting your search criteria or BHK filter to find more options.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedBHK("all")
                    }}
                    className="mt-4 border-neutral-light text-primary-blue hover:border-primary-orange/50"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}

            {/* Selected Plan Summary */}
            {selectedPlan && (
              <Card className="p-4 md:p-6 bg-primary-orange/5 border-primary-orange/20">
                <CardContent className="p-0">
                  <div className="flex items-center space-x-3 md:space-x-4">
                    <div className="w-10 md:w-12 h-10 md:h-12 bg-primary-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Home className="h-5 md:h-6 w-5 md:w-6 text-primary-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-xl font-bold text-primary-blue truncate">{selectedPlan.name}</h3>
                      <p className="text-sm md:text-base text-dark-text truncate">
                        {selectedPlan.area} sq.ft • {selectedPlan.bhk} • {selectedPlan.price}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Check className="h-5 md:h-6 w-5 md:w-6 text-primary-orange" />
                      <span className="text-sm md:text-base font-semibold text-primary-orange hidden sm:inline">Selected</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sticky CTA */}
        <StickyCTA
          backHref="/get-quote/society"
          continueHref={selectedPlan ? "/get-quote/design" : undefined}
          continueText="Continue to Design"
          disabled={!selectedPlan}
          showBackButton={true}
          fullWidth={false}
        />
      </div>
      {/* Add margin to prevent content from appearing below sticky CTA */}
      <div className="h-32"></div>
    </div>
  )
}
