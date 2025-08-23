"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuoteProgressProps {
  currentStep: number
  className?: string
}

const steps = [
  { id: 1, name: "Society", completed: false },
  { id: 2, name: "Floor Plan", completed: false },
  { id: 3, name: "Design", completed: false },
  { id: 4, name: "Materials & Pricing", completed: false },
  { id: 5, name: "Summary", completed: false },
]

export function QuoteProgress({ currentStep, className }: QuoteProgressProps) {
  return (
    <div className={cn("w-full bg-neutral-light border-b border-neutral-light py-3 md:py-4", className)}>
      <div className="container mx-auto px-2 md:px-4">
        <div className="relative flex items-center justify-between max-w-6xl mx-auto">
          {/* Background connecting line */}
          <div className="absolute top-3 md:top-4 left-3 md:left-4 right-3 md:right-4 h-0.5 bg-neutral-light z-0" />
          
          {/* Progress connecting line */}
          <div 
            className="absolute top-3 md:top-4 left-3 md:left-4 h-0.5 bg-primary-orange z-10 transition-all duration-300"
            style={{
              width: currentStep > 1 ? `${((currentStep - 1) / (steps.length - 1)) * 100}%` : '0%'
            }}
          />

          {steps.map((step, index) => {
            const isCompleted = step.id < currentStep
            const isCurrent = step.id === currentStep
            const isUpcoming = step.id > currentStep

            return (
              <div key={step.id} className="relative z-20">
                <div className="flex flex-col items-center space-y-1 md:space-y-2">
                  <div
                    className={cn(
                      "w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-medium transition-all duration-300 border-2",
                      isCompleted && "bg-primary-orange text-white border-primary-orange",
                      isCurrent && "bg-primary-blue text-white border-primary-blue",
                      isUpcoming && "bg-white text-dark-text border-neutral-light",
                    )}
                  >
                    {isCompleted ? <Check className="h-3 w-3 md:h-4 md:w-4" /> : <span>{step.id}</span>}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors duration-300 whitespace-nowrap hidden sm:block",
                      isCompleted && "text-primary-orange",
                      isCurrent && "text-primary-blue",
                      isUpcoming && "text-dark-text",
                    )}
                  >
                    {step.name}
                  </span>
                  {/* Mobile-only abbreviated labels */}
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors duration-300 whitespace-nowrap sm:hidden",
                      isCompleted && "text-primary-orange",
                      isCurrent && "text-primary-blue",
                      isUpcoming && "text-dark-text",
                    )}
                  >
                    {step.name === "Floor Plan" ? "Plan" : 
                     step.name === "Materials & Pricing" ? "Materials" : 
                     step.name}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}