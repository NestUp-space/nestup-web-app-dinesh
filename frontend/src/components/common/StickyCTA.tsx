"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface StickyCTAProps {
  backHref?: string
  backText?: string
  continueHref?: string
  continueText: string
  onContinueClick?: () => void
  disabled?: boolean
  loading?: boolean
  showBackButton?: boolean
  fullWidth?: boolean
}

export default function StickyCTA({
  backHref,
  backText = "Back",
  continueHref,
  continueText,
  onContinueClick,
  disabled = false,
  loading = false,
  showBackButton = true,
  fullWidth = false
}: StickyCTAProps) {
  const ContinueButton = () => (
    <Button
      size="lg"
      className="text-base md:text-lg px-4 md:px-8 py-4 md:py-6 rounded-xl shadow-lg bg-primary-orange hover:bg-orange-500 text-white w-full md:w-auto"
      disabled={disabled || loading}
      onClick={onContinueClick}
    >
      {loading ? "Loading..." : continueText}
    </Button>
  )

  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 md:p-4 bg-white/95 backdrop-blur-sm border-t border-neutral-light z-50">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          {showBackButton && backHref ? (
            <Link href={backHref} className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-primary-blue text-primary-blue hover:bg-primary-blue/10 w-full sm:w-auto px-4 md:px-6 py-4 md:py-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backText}
              </Button>
            </Link>
          ) : (
            <div className="w-full sm:w-auto"></div>
          )}
          
          {fullWidth ? (
            <div className="w-full">
              {continueHref ? (
                <Link href={continueHref} className="block">
                  <ContinueButton />
                </Link>
              ) : (
                <ContinueButton />
              )}
            </div>
          ) : (
            <div className="w-full sm:w-auto">
              {continueHref ? (
                <Link href={continueHref} className="block">
                  <ContinueButton />
                </Link>
              ) : (
                <ContinueButton />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
