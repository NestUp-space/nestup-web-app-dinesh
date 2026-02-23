"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Home, Download, CheckCircle, User, FileText, Calculator, Palette, Building } from "lucide-react"
import Link from "next/link"
import { QuoteProgress } from "@/components/quote/quote-progress"
import Navbar from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import StickyCTA from "@/components/common/StickyCTA"
import { 
  defaultMaterials, 
  summaryMaterialOptions, 
  userSelections,
  type MaterialSelections,
  type SummaryMaterialItem 
} from "@/data/get-quote/summary"
import { trackQuoteSubmission, trackEvent } from "@/lib/analytics"
import { useEventTracking } from "@/hooks/useAnalytics"

interface MultiplierObject {
  [key: string]: number;
}

export default function SummaryPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    society: userSelections.society,
    notes: "",
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [materialSelections, setMaterialSelections] = useState<MaterialSelections>(defaultMaterials)
  const { trackFormSubmission } = useEventTracking()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMaterialChange = (category: keyof MaterialSelections, index: number, field: keyof SummaryMaterialItem, value: string) => {
    setMaterialSelections((prev) => ({
      ...prev,
      [category]: prev[category].map((item: SummaryMaterialItem, i: number) => {
        if (i === index) {
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
    }))
  }

  const getBrandMultiplier = (value: string, field: string): number => {
    if (field === "brand") {
      const multipliers: MultiplierObject = {
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
      const multipliers: MultiplierObject = {
        "Marine Grade": 1.2,
        Commercial: 1.0,
        Standard: 0.9,
        Premium: 1.3,
        "Matt Finish": 1.0,
        "Glossy Finish": 1.1,
        Textured: 1.15,
        "Suede Finish": 1.05,
        "Soft Close": 1.3,
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

  const calculateCategoryTotal = (items: SummaryMaterialItem[]) => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const calculateTotal = () => {
    return Object.values(materialSelections).reduce((sum, category) => sum + calculateCategoryTotal(category), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Track the quote submission
      trackQuoteSubmission({
        society: formData.society,
        floorPlan: "Classic 2BHK",
        design: "Modern Minimalist",
        totalAmount: calculateTotal(),
      })

      // Track form submission
      trackFormSubmission("quote_summary", true, {
        value: calculateTotal(),
        hasNotes: !!formData.notes,
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setIsSubmitted(true)
    } catch (error) {
      console.error("Error submitting quote:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="">
        <div className="h-20 md:h-24 top-0 fixed bg-white z-50">
          <Navbar />
        </div>
        <div className="mt-20 md:mt-24 w-screen">
          <div className="min-h-screen bg-neutral-light">
            <div className="container mx-auto px-4 py-12 md:py-16 max-w-2xl">
              <div className="text-center space-y-6 md:space-y-8">
                <div className="w-16 md:w-20 h-16 md:h-20 bg-primary-orange/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 md:h-10 w-8 md:w-10 text-primary-orange" />
                </div>
                <div className="space-y-3 md:space-y-4">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-sans font-bold text-primary-blue">Quote Submitted Successfully!</h1>
                  <p className="text-base md:text-lg text-dark-text">
                    Thank you for your interest. Our team will review your requirements and get back to you within 24 hours.
                  </p>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <p className="text-sm text-dark-text">
                    A copy of your quote has been sent to <span className="font-medium text-primary-blue">{formData.email}</span>
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                    <Button
                      onClick={() => window.print()}
                      variant="outline"
                      className="border-primary-blue text-primary-blue hover:bg-primary-blue/10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Link href="/">
                      <Button className="bg-primary-orange hover:bg-orange-500 text-white">
                        Back to Home
                      </Button>
                    </Link>
                  </div>
                </div>
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

  return (
    <div className="">
      <div className="h-20 md:h-24 top-0 fixed bg-white z-50">
        <Navbar />
      </div>
      <div className="mt-20 md:mt-24 w-screen">
        <div className="min-h-screen bg-neutral-light">
          {/* Progress Bar */}
          <QuoteProgress currentStep={5} />

          {/* Main Content */}
          <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
            <div className="space-y-6 md:space-y-8">
              {/* Step Header */}
              <div className="text-center space-y-3 md:space-y-4">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-sans font-bold text-primary-blue">Review Your Quote</h1>
                <p className="text-base md:text-lg text-dark-text">Review your selections and provide contact details to receive your quote</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left Column - Contact Form */}
                <div className="lg:col-span-1 space-y-4 md:space-y-6">
                  <Card className="bg-white border border-neutral-light">
                    <CardHeader>
                      <CardTitle className="text-primary-blue flex items-center text-base md:text-lg">
                        <User className="h-4 md:h-5 w-4 md:w-5 mr-2" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-primary-blue text-sm">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Enter your full name"
                          className="mt-1 border-primary-blue/20 focus:border-primary-blue"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-primary-blue text-sm">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="Enter your email"
                          className="mt-1 border-primary-blue/20 focus:border-primary-blue"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-primary-blue text-sm">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder="Enter your phone number"
                          className="mt-1 border-primary-blue/20 focus:border-primary-blue"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes" className="text-primary-blue text-sm">Additional Notes</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => handleInputChange("notes", e.target.value)}
                          placeholder="Any special requirements or questions..."
                          className="mt-1 border-primary-blue/20 focus:border-primary-blue"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Project Summary */}
                  <Card className="bg-white border border-neutral-light">
                    <CardHeader>
                      <CardTitle className="text-primary-blue flex items-center text-base md:text-lg">
                        <Building className="h-4 md:h-5 w-4 md:w-5 mr-2" />
                        Project Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 md:space-y-3">
                      <div className="flex justify-between">
                        <span className="text-dark-text text-sm">Society:</span>
                        <span className="font-medium text-primary-blue text-sm truncate ml-2">{formData.society}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-text text-sm">Design Style:</span>
                        <span className="font-medium text-primary-blue text-sm">Modern Minimalist</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-text text-sm">Floor Plan:</span>
                        <span className="font-medium text-primary-blue text-sm">Classic 2BHK</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Material Summary */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                  <Card className="bg-white border border-neutral-light">
                    <CardHeader>
                      <CardTitle className="text-primary-blue flex items-center text-base md:text-lg">
                        <Palette className="h-4 md:h-5 w-4 md:w-5 mr-2" />
                        Material Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 md:space-y-6">
                      {Object.entries(materialSelections).map(([category, items]) => (
                        <div key={category} className="space-y-2 md:space-y-3">
                          <h3 className="font-medium text-primary-blue capitalize text-sm md:text-base">{category}</h3>
                          <div className="space-y-2">
                            {items.map((item, index) => (
                              <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-neutral-light rounded-lg gap-2 sm:gap-0">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-primary-blue text-sm">{item.type}</div>
                                  <div className="text-xs md:text-sm text-dark-text truncate">
                                    {item.brand} • {item.subtype} • {item.quantity} {item.unit}
                                  </div>
                                </div>
                                <div className="text-left sm:text-right flex-shrink-0">
                                  <div className="font-medium text-primary-blue text-sm">{formatCurrency(item.total)}</div>
                                  <div className="text-xs text-dark-text">{formatCurrency(item.unitPrice)} each</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-neutral-light">
                            <span className="font-medium text-primary-blue text-sm md:text-base">Subtotal</span>
                            <span className="font-bold text-primary-blue text-sm md:text-base">{formatCurrency(calculateCategoryTotal(items))}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Total Summary */}
                  <Card className="bg-primary-orange/5 border-primary-orange/20">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        <div>
                          <h3 className="text-lg md:text-xl font-bold text-primary-blue">Total Estimate</h3>
                          <p className="text-xs md:text-sm text-dark-text">Excluding taxes and installation</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-2xl md:text-3xl font-bold text-primary-blue">{formatCurrency(calculateTotal())}</div>
                          <p className="text-xs md:text-sm text-dark-text">Indicative pricing</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky CTA */}
          <StickyCTA
            backHref="/get-quote/materials"
            continueText="Submit Quote"
            onContinueClick={() => {
              const fakeEvent = {} as React.FormEvent
              handleSubmit(fakeEvent)
            }}
            disabled={isSubmitting || !formData.name || !formData.email || !formData.phone}
            loading={isSubmitting}
          />
        </div>
      </div>
      {/* Add margin to prevent content from appearing below sticky CTA */}
      <div className="h-32"></div>
    </div>
  )
}
