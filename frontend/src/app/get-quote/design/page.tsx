"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Home, Check, ChevronDown, ChevronUp, Star, Palette } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import Navbar from "@/components/landing-page/Navbar"
import { Footer } from "@/components/landing-page/Footer"
import StickyCTA from "@/components/common/StickyCTA"
import { QuoteProgress } from "@/components/quote/quote-progress"
import { designStyles, type DesignStyle } from "@/data/get-quote/designStyles"

export default function DesignSelectionPage() {
  const [selectedDesign, setSelectedDesign] = useState<DesignStyle | null>(null)
  const [expandedDesigns, setExpandedDesigns] = useState<Set<number>>(new Set())

  const handleDesignSelect = (design: DesignStyle) => {
    setSelectedDesign(design)
  }

  const toggleExpanded = (designId: number) => {
    const newExpanded = new Set(expandedDesigns)
    if (newExpanded.has(designId)) {
      newExpanded.delete(designId)
    } else {
      newExpanded.add(designId)
    }
    setExpandedDesigns(newExpanded)
  }

  return (
    <div className="">
      <div className="fixed top-0 left-0 right-0 w-full h-20 md:h-24 bg-white z-50">
        <Navbar />
      </div>
      <div className="mt-20 md:mt-24 w-full">
        <div className="min-h-screen bg-neutral-light">
          {/* Progress Bar */}
          <QuoteProgress currentStep={3} />

          {/* Main Content */}
          <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
            <div className="space-y-6 md:space-y-8">
              {/* Step Header */}
              <div className="text-center space-y-3 md:space-y-4">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-sans font-bold text-primary-blue">Choose your design style</h1>
                <p className="text-base md:text-lg text-dark-text">Select the interior design that reflects your personality</p>
              </div>

              {/* Design Style Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {designStyles.map((design) => (
                  <Card
                    key={design.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-lg bg-white border border-neutral-light",
                      selectedDesign?.id === design.id
                        ? "ring-2 ring-primary-orange border-primary-orange shadow-lg"
                        : "hover:border-primary-orange/50",
                    )}
                    onClick={() => handleDesignSelect(design)}
                  >
                    <CardContent className="p-0">
                      {/* Design Images */}
                      <div className="relative">
                        <div className="grid grid-cols-3 gap-1">
                          {design.images.map((image, index) => (
                            <Image
                              key={index}
                              src={image || "/placeholder.svg"}
                              alt={`${design.name} room ${index + 1}`}
                              width={400}
                              height={300}
                              className={cn(
                                "h-24 md:h-32 object-cover",
                                index === 0 ? "rounded-tl-lg" : "",
                                index === design.images.length - 1 ? "rounded-tr-lg" : "",
                              )}
                            />
                          ))}
                        </div>

                        {/* Badges */}
                        <div className="absolute top-2 md:top-3 left-2 md:left-3 flex gap-1 md:gap-2">
                          {design.recommended && (
                            <Badge className="bg-primary-orange text-white text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Recommended
                            </Badge>
                          )}
                          {design.popular && <Badge variant="secondary" className="bg-primary-blue text-white text-xs">Popular</Badge>}
                        </div>

                        {/* Selection Indicator */}
                        {selectedDesign?.id === design.id && (
                          <div className="absolute top-2 md:top-3 right-2 md:right-3 w-6 h-6 bg-primary-orange rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Design Info */}
                      <div className="p-4 md:p-6">
                        <div className="flex items-start justify-between mb-3 md:mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg md:text-xl font-bold text-primary-blue mb-2 truncate">{design.name}</h3>
                            <p className="text-dark-text text-sm leading-relaxed">{design.shortDescription}</p>
                          </div>
                          <Palette className="h-5 md:h-6 w-5 md:w-6 text-primary-orange flex-shrink-0 ml-3 md:ml-4" />
                        </div>

                        {/* Features */}
                        <div className="space-y-2 mb-3 md:mb-4">
                          <h4 className="font-medium text-primary-blue text-xs md:text-sm">Key Features:</h4>
                          <ul className="text-dark-text text-xs md:text-sm space-y-1">
                            {design.features.slice(0, 3).map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <div className="w-1.5 h-1.5 bg-primary-orange rounded-full mr-2 flex-shrink-0"></div>
                                <span className="truncate">{feature}</span>
                              </li>
                            ))}
                            {design.features.length > 3 && (
                              <li className="flex items-center">
                                <div className="w-1.5 h-1.5 bg-primary-orange rounded-full mr-2 flex-shrink-0"></div>
                                <span className="text-primary-orange">+{design.features.length - 3} more features</span>
                              </li>
                            )}
                          </ul>
                        </div>

                        {/* Expandable Details */}
                        <Collapsible open={expandedDesigns.has(design.id)} onOpenChange={() => toggleExpanded(design.id)}>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-between p-0 h-auto text-primary-blue hover:text-primary-orange hover:bg-transparent text-xs md:text-sm">
                              <span>View more details</span>
                              {expandedDesigns.has(design.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3 md:mt-4 space-y-3 md:space-y-4">
                            <div className="border-t border-neutral-light pt-3 md:pt-4">
                              <h4 className="font-medium text-primary-blue text-xs md:text-sm mb-2">Design Philosophy:</h4>
                              <p className="text-dark-text text-xs md:text-sm leading-relaxed">{design.fullDescription}</p>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Selected Design Summary */}
              {selectedDesign && (
                <Card className="p-4 md:p-6 bg-primary-orange/5 border-primary-orange/20">
                  <CardContent className="p-0">
                    <div className="flex items-center space-x-3 md:space-x-4">
                      <div className="w-10 md:w-12 h-10 md:h-12 bg-primary-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Palette className="h-5 md:h-6 w-5 md:w-6 text-primary-orange" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-primary-blue truncate">{selectedDesign.name}</h3>
                        <p className="text-sm text-dark-text truncate">{selectedDesign.shortDescription}</p>
                      </div>
                      <Check className="h-5 md:h-6 w-5 md:w-6 text-primary-orange flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sticky CTA */}
          <StickyCTA
            backHref="/get-quote/floor-plan"
            continueHref="/get-quote/materials"
            continueText="Continue to Materials"
            disabled={!selectedDesign}
          />
        </div>
      </div>
      {/* Add margin to prevent content from appearing below sticky CTA */}
      <div className="h-32"></div>
    </div>
  )
}
