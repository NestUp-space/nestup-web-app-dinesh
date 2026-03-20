"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Clock, Shield } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/layout/Footer"
import { QuoteProgress } from "@/components/quote/quote-progress"
import FAQ from "@/components/landing-page/Faq"

export default function LandingPage() {
  const containerRef = useRef()
  return (
    <div className="">
      <div className="mt-24 w-screen" >
        {/* Progress indicator */}
        <QuoteProgress currentStep={1} />
        
        {/* Main content */}
        <div className="min-h-screen bg-neutral-light">

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-sans font-bold text-primary-blue leading-tight">
              Get a quick ballpark quote for your home interiors
            </h1>
            <p className="text-xl md:text-2xl text-dark-text max-w-3xl mx-auto leading-relaxed">
              Select your apartment, floor plan, and design to see a pre-tax estimate in minutes
            </p>
          </div>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex flex-col items-center space-y-2 p-4">
              <Clock className="h-8 w-8 text-primary-orange" />
              <span className="font-medium text-primary-blue">Under 3 minutes</span>
              <span className="text-sm text-dark-text text-center">Quick estimate process</span>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4">
              <Shield className="h-8 w-8 text-primary-orange" />
              <span className="font-medium text-primary-blue">No login required</span>
              <span className="text-sm text-dark-text text-center">Start immediately</span>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4">
              <Star className="h-8 w-8 text-primary-orange" />
              <span className="font-medium text-primary-blue">Premium designs</span>
              <span className="text-sm text-dark-text text-center">Curated collections</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="space-y-4">
            <Link href="/get-quote/society">
              <Button
                size="lg"
                className="text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 bg-primary-orange hover:bg-orange-500 text-white"
              >
                Start Your Estimate
              </Button>
            </Link>
            <p className="text-sm text-dark-text">
              <span className="inline-flex items-center space-x-1">
                <Shield className="h-4 w-4 text-primary-orange" />
                <span>Estimates are indicative and exclude taxes</span>
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-sans font-bold text-center text-primary-blue mb-8">
            Trusted by Hyderabad homeowners
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 shadow-sm bg-white border border-neutral-light">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary-orange text-primary-orange" />
                  ))}
                </div>
                <p className="text-dark-text">
                  &quot;The estimate was spot-on and the design team understood exactly what we wanted for our 3BHK in
                  Gachibowli.&quot;
                </p>
                <div className="text-sm text-dark-text">
                  <span className="font-medium">Priya S.</span> • Gachibowli
                </div>
              </CardContent>
            </Card>
            <Card className="p-6 shadow-sm bg-white border border-neutral-light">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary-orange text-primary-orange" />
                  ))}
                </div>
                <p className="text-dark-text">
                  &quot;Professional service from start to finish. The modular kitchen design exceeded our expectations.&quot;
                </p>
                <div className="text-sm text-dark-text">
                  <span className="font-medium">Rajesh K.</span> • Kondapur
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-sans font-bold text-center text-primary-blue mb-8">
          </h2>
          <FAQ />
        </div>
      </section>
        </div>
      </div>
      <div>
        <Footer />
      </div>
    </div>
  )
}
