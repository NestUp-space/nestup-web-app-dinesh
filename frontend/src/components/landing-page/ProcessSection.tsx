"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Ruler,
  ClipboardList,
  Package,
  FileText,
  CreditCard,
  Receipt,
  CheckSquare,
  Calculator,
  Factory,
  PackageOpen,
  Truck,
  Wrench,
  ChevronRight,
  X,
} from "lucide-react"

/**
 * Enhanced ProcessFlowComponent - Circular Interactive Diagram
 * Preserves all existing text content while implementing a professional circular UI
 */

interface ProcessStep {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const ProcessFlowComponent: React.FC = () => {
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [hoveredStep, setHoveredStep] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)

  const steps: ProcessStep[] = useMemo(() => [
    { id: "measure", label: "Site Measurements", icon: Ruler, description: "Professional measurement team visits your location using advanced laser tools to capture precise, millimeter-accurate dimensions." },
    { id: "input", label: "Design Input Collection", icon: ClipboardList, description: "Gathering comprehensive design requirements including 2D layouts, laminate codes, and technical specifications through detailed consultation." },
    { id: "model", label: "3D Modeling", icon: Package, description: "Creation of detailed 3D models in a 3D-software with precise plank-by-plank specifications, built from scratch using site measurements." },
    { id: "design", label: "Design Finalization", icon: FileText, description: "Final design review and approval process with detailed documentation and client confirmation before production begins." },
    { id: "payment", label: "Payment Processing", icon: CreditCard, description: "Transparent payment structure with token advance for measurements and staged payments aligned with production milestones." },
    { id: "invoice", label: "Invoice Generation", icon: Receipt, description: "Detailed invoice generation with complete breakdown of costs, materials, and services for transparent billing." },
    { id: "check", label: "Pre-Production Check", icon: CheckSquare, description: "Comprehensive quality assurance checks before production begins, including material verification and design validation." },
    { id: "estimate", label: "Material Estimation", icon: Calculator, description: "Precise material estimates with detailed cut lists, optimized sheet utilization, and waste minimization calculations." },
    { id: "factory", label: "Factory Production", icon: Factory, description: "State-of-the-art CNC manufacturing with automated cutting, precision hole drilling, and quality control processes." },
    { id: "packing", label: "Quality Packing", icon: PackageOpen, description: "Systematic unit-wise packaging with installation-optimized organization and comprehensive quality checks." },
    { id: "dispatch", label: "Dispatch & Logistics", icon: Truck, description: "Coordinated dispatch with transportation arrangements and delivery scheduling to ensure safe arrival at your site." },
    { id: "install", label: "Professional Installation", icon: Wrench, description: "Expert installation support with detailed guides, on-site engineering assistance, and professional carpentry teams available." },
  ], [])

  // Device detection
  useEffect(() => {
    setMounted(true)
    
    const updateDeviceConfig = () => {
      setIsMobile(window.innerWidth < 768)
    }

    updateDeviceConfig()
    window.addEventListener('resize', updateDeviceConfig)
    return () => window.removeEventListener('resize', updateDeviceConfig)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeStep) {
        setActiveStep(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeStep])

  const handleStepClick = useCallback((stepId: string) => {
    if (activeStep === stepId) {
      setActiveStep(null)
      return
    }
    setActiveStep(stepId)
    setHoveredStep(null)
  }, [activeStep])

  const handleCloseDescription = useCallback(() => {
    setActiveStep(null)
  }, [])

  const handleDiveDeeper = () => {
    console.log("Dive deeper clicked")
  }

  // Calculate circular positions for steps
  const getCircularPosition = (index: number, total: number, radius: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2 // Start from top
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    return { x, y, angle }
  }

  const circleRadius = isMobile ? 120 : 180
  const centerX = 0
  const centerY = 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Content Section */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                EVERY STEP MATTERS.
                <br />
                <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                  SEE HOW.
                </span>
              </h1>
              
              <div className="text-lg md:text-xl text-muted-foreground space-y-4">
                <p>
                  Take a look at our <strong className="font-semibold text-primary">12-step process</strong> that blends{" "}
                  <em className="italic text-secondary">craftsmanship</em> with{" "}
                  <u className="underline text-accent">clarity</u> to ensure every detail is handled with care, precision, and transparency.
                </p>
              </div>
              
              <button 
                onClick={handleDiveDeeper}
                className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-300 font-medium text-lg group"
                aria-label="Learn more about our process"
              >
                <span>Dive Deeper</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Right Content Section - Circular Process Diagram */}
          <div className="relative">
            <div 
              className="relative mx-auto"
              style={{ 
                width: `${(circleRadius + 80) * 2}px`, 
                height: `${(circleRadius + 80) * 2}px` 
              }}
              ref={containerRef}
            >
              {/* Center Circle */}
              <div 
                className="absolute bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-2xl"
                style={{
                  width: '120px',
                  height: '120px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="text-white text-center">
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-sm">Steps</div>
                </div>
              </div>

              {/* Process Steps in Circle */}
              {steps.map((step, index) => {
                const IconComponent = step.icon
                const position = getCircularPosition(index, steps.length, circleRadius)
                const isActive = activeStep === step.id
                const isHovered = hoveredStep === step.id
                
                return (
                  <div
                    key={step.id}
                    className="absolute group cursor-pointer"
                    style={{
                      left: `calc(50% + ${position.x}px)`,
                      top: `calc(50% + ${position.y}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onMouseEnter={() => !isMobile && setHoveredStep(step.id)}
                    onMouseLeave={() => !isMobile && setHoveredStep(null)}
                    onClick={() => handleStepClick(step.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${step.label}. Click to view details.`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleStepClick(step.id)
                      }
                    }}
                  >
                    {/* Connection Line to Center */}
                    <div 
                      className="absolute bg-gradient-to-r from-primary/20 to-secondary/20 transition-all duration-300 group-hover:from-primary/40 group-hover:to-secondary/40"
                      style={{
                        width: `${circleRadius - 60}px`,
                        height: '2px',
                        left: '50%',
                        top: '50%',
                        transformOrigin: 'left center',
                        transform: `translateY(-50%) rotate(${position.angle + Math.PI}rad)`,
                        zIndex: 1
                      }}
                    />
                    
                    {/* Step Circle */}
                    <div 
                      className={`
                        relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg z-10
                        ${isActive 
                          ? 'bg-secondary text-white scale-110 shadow-2xl' 
                          : isHovered 
                            ? 'bg-primary text-white scale-105 shadow-xl' 
                            : 'bg-white text-primary hover:bg-primary hover:text-white border-2 border-primary/20'
                        }
                      `}
                    >
                      <IconComponent className="w-6 h-6" />
                      
                      {/* Step Number */}
                      <div 
                        className={`
                          absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
                          ${isActive ? 'bg-accent text-white' : 'bg-secondary text-white'}
                        `}
                      >
                        {index + 1}
                      </div>
                    </div>

                    {/* Step Label */}
                    <div 
                      className={`
                        absolute mt-2 text-center text-sm font-medium transition-all duration-300 whitespace-nowrap
                        ${position.y < 0 ? 'top-full' : 'bottom-full mb-2'}
                        ${isActive ? 'text-secondary' : 'text-primary'}
                      `}
                      style={{
                        left: '50%',
                        transform: 'translateX(-50%)',
                        maxWidth: '120px'
                      }}
                    >
                      {step.label}
                    </div>
                  </div>
                )
              })}

              {/* Active Step Description Card */}
              {activeStep && mounted && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="bg-white rounded-2xl shadow-2xl border border-primary/10 p-6 max-w-sm mx-4 transform transition-all duration-300 scale-100">
                    <button 
                      onClick={handleCloseDescription}
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Close description"
                    >
                      <X size={20} />
                    </button>
                    
                    {(() => {
                      const step = steps.find(s => s.id === activeStep)
                      if (!step) return null
                      const IconComponent = step.icon
                      
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <IconComponent className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold text-primary">
                              {step.label}
                            </h3>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Accordion Fallback */}
            {isMobile && (
              <div className="mt-8 space-y-3">
                <h3 className="text-lg font-semibold text-primary mb-4">Process Steps</h3>
                {steps.map((step, index) => {
                  const IconComponent = step.icon
                  const isActive = activeStep === step.id
                  
                  return (
                    <div 
                      key={step.id}
                      className="bg-white rounded-lg border border-primary/10 overflow-hidden"
                    >
                      <button
                        onClick={() => handleStepClick(step.id)}
                        className="w-full p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-secondary text-white' : 'bg-primary/10 text-primary'}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-primary">{step.label}</div>
                        </div>
                        <div className={`w-6 h-6 rounded-full bg-secondary text-white text-xs flex items-center justify-center font-bold`}>
                          {index + 1}
                        </div>
                      </button>
                      
                      {isActive && (
                        <div className="px-4 pb-4 text-muted-foreground">
                          {step.description}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProcessFlowComponent
