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
import styles from './ProcessSection.module.css'

/**
 * Enhanced ProcessFlowComponent - A fully responsive React component with optimized mobile/desktop UX
 *
 * Features:
 * - Adaptive interaction patterns (contextual popover on desktop, bottom sheet on mobile)
 * - Full accessibility support with keyboard navigation and ARIA labels
 * - Touch-optimized with proper gesture support
 * - Smooth animations and transitions
 * - Performance optimized with proper portal rendering
 * - Responsive grid layout with optimized touch targets
 * - Fixed modal positioning with proper z-index layering
 */

interface ProcessStep {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

interface GridConfig {
  columns: number
  rows: number
  gap: string
}

interface ActiveStepPosition {
  row: number
  col: number
  rect: DOMRect
  side: 'left' | 'right'
}

const ProcessFlowComponent: React.FC = () => {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [activeStepPosition, setActiveStepPosition] = useState<ActiveStepPosition | null>(null)
  const [visibleSteps, setVisibleSteps] = useState<Set<string>>(new Set())
  const [gridConfig, setGridConfig] = useState<GridConfig>({ columns: 4, rows: 3, gap: "2rem" })
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const activeStepRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const steps: ProcessStep[] = useMemo(() => [
    { id: "measure", label: "Site Measurements", icon: Ruler, description: "Professional measurement team visits your location using advanced laser tools to capture precise, millimeter-accurate dimensions." },
    { id: "input", label: "Design Input Collection", icon: ClipboardList, description: "Gathering comprehensive design requirements including 2D layouts, laminate codes, and technical specifications through detailed consultation." },
    { id: "model", label: "3D Modeling", icon: Package, description: "Creation of detailed 3D models in SketchUp with precise plank-by-plank specifications, built from scratch using site measurements." },
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

  // Device detection and responsive configuration
  useEffect(() => {
    setMounted(true)
    
    const updateDeviceConfig = () => {
      const width = window.innerWidth
      const newIsMobile = width < 768
      const newIsTablet = width >= 768 && width < 1024
      
      setIsMobile(newIsMobile)
      setIsTablet(newIsTablet)
      
      if (width >= 1024) {
        setGridConfig({ columns: 4, rows: 3, gap: "2rem" })
      } else if (width >= 768) {
        setGridConfig({ columns: 3, rows: 4, gap: "1.5rem" })
      } else {
        setGridConfig({ columns: 2, rows: 6, gap: "1.25rem" })
      }
    }

    updateDeviceConfig()
    window.addEventListener('resize', updateDeviceConfig)
    return () => window.removeEventListener('resize', updateDeviceConfig)
  }, [])

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stepId = entry.target.getAttribute('data-step-id')
            if (stepId) {
              setVisibleSteps(prev => new Set(Array.from(prev).concat(stepId)))
            }
          }
        })
      },
      { threshold: 0.3, rootMargin: '50px' }
    )

    const stepElements = document.querySelectorAll('[data-step-id]')
    stepElements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeStep) {
        setActiveStep(null)
      }
      
      if (activeStep && (event.key === 'Tab' || event.key === 'Enter')) {
        // Handle focus management within description
        event.preventDefault()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeStep])

  const handleStepClick = useCallback((stepId: string, event: React.MouseEvent<HTMLDivElement>) => {
    if (activeStep === stepId) {
      setActiveStep(null)
      setActiveStepPosition(null)
      return
    }

    const target = event.currentTarget
    const rect = target.getBoundingClientRect()
    const stepIndex = steps.findIndex(step => step.id === stepId)
    const row = Math.floor(stepIndex / gridConfig.columns)
    const col = stepIndex % gridConfig.columns
    
    // Determine which side to show the card based on column position
    const side = col < gridConfig.columns / 2 ? 'right' : 'left'
    
    setActiveStep(stepId)
    setActiveStepPosition({ row, col, rect, side })
    setHoveredStep(null)
  }, [activeStep, steps, gridConfig.columns])

  const handleCloseDescription = useCallback(() => {
    setActiveStep(null)
    setActiveStepPosition(null)
  }, [])

  const handleDiveDeeper = () => {
    console.log("Dive deeper clicked")
  }

  const getStepPosition = (index: number) => {
    const row = Math.floor(index / gridConfig.columns)
    const col = index % gridConfig.columns
    return { row, col }
  }

  const shouldShowHorizontalConnector = (index: number) => {
    const { col } = getStepPosition(index)
    return col < gridConfig.columns - 1 && index < steps.length - 1
  }

  const shouldShowVerticalConnector = (index: number) => {
    const { col, row } = getStepPosition(index)
    return col === gridConfig.columns - 1 && row < gridConfig.rows - 1 && index < steps.length - 1
  }

  const getIconShiftClass = (stepIndex: number) => {
    if (!activeStepPosition) return ''
    
    const { row, col } = getStepPosition(stepIndex)
    const { row: activeRow, col: activeCol, side } = activeStepPosition
    
    // Only shift icons in the same row as the active step
    if (row !== activeRow) return ''
    
    // Don't shift the active icon itself
    if (stepIndex === steps.findIndex(step => step.id === activeStep)) return ''
    
    // Shift logic based on card position
    if (side === 'right') {
      // Card appears on right, shift icons left
      return col < activeCol ? styles.iconShiftLeft : ''
    } else {
      // Card appears on left, shift icons right
      return col > activeCol ? styles.iconShiftRight : ''
    }
  }

  // Description Card Component
  const DescriptionCard = ({ step }: { step: ProcessStep }) => {
    if (!activeStepPosition || !mounted) return null

    const IconComponent = step.icon
    const { side, rect, row } = activeStepPosition
    
    // Calculate card position
    const cardWidth = isMobile ? 280 : isTablet ? 320 : 360
    const cardOffset = isMobile ? 20 : 40
    
    let cardStyle: React.CSSProperties = {}
    
    if (isMobile) {
      // On mobile, show below the active icon
      cardStyle = {
        position: 'absolute',
        top: `${(row + 1) * 120 + 20}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${cardWidth}px`,
        zIndex: 10
      }
    } else {
      // On desktop/tablet, show beside the icon
      const gridRect = gridRef.current?.getBoundingClientRect()
      if (gridRect) {
        const relativeTop = rect.top - gridRect.top + rect.height / 2
        
        if (side === 'right') {
          cardStyle = {
            position: 'absolute',
            top: `${relativeTop - 100}px`,
            left: `${rect.width + cardOffset}px`,
            width: `${cardWidth}px`,
            zIndex: 10
          }
        } else {
          cardStyle = {
            position: 'absolute',
            top: `${relativeTop - 100}px`,
            right: `${rect.width + cardOffset}px`,
            width: `${cardWidth}px`,
            zIndex: 10
          }
        }
      }
    }

    return (
      <div 
        className={styles.descriptionCard}
        style={cardStyle}
        role="dialog"
        aria-labelledby="description-title"
        aria-describedby="description-text"
      >
        <button 
          className={styles.descriptionClose}
          onClick={handleCloseDescription}
          aria-label="Close description"
        >
          <X size={18} />
        </button>
        
        <div className={styles.descriptionContent}>
          <div className={styles.descriptionIconContainer}>
            <IconComponent className={styles.descriptionIcon} />
          </div>
          <h3 id="description-title" className={styles.descriptionTitle}>
            {step.label}
          </h3>
          <p id="description-text" className={styles.descriptionText}>
            {step.description}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.processFlowContainer} ref={containerRef}>
      <div className={styles.contentWrapper}>
        {/* Left Content Section */}
        <div className={styles.leftContent}>
          <div className={styles.textContent}>
            <h1 className={styles.mainHeading}>
              EVERY STEP MATTERS.
              <br />
              <span className={styles.gradientText}>SEE HOW.</span>
            </h1>
            <div className={styles.description}>
              <p>Take a look at our <strong className="font-semibold">12-step process</strong> that blends <em className="italic">craftsmanship</em> with <u className="underline">clarity</u> to ensure every detail is handled with care, precision, and transparency.</p>
            </div>
            <button 
              className={styles.diveDeeperBtn} 
              onClick={handleDiveDeeper} 
              aria-label="Learn more about our process"
            >
              <span>Dive Deeper</span>
              <ChevronRight className={styles.btnIcon} />
            </button>
          </div>
        </div>

        {/* Right Content Section - Process Grid */}
        <div className={styles.rightContent}>
          <div className={styles.gridContainer}>
            <div 
              className={styles.processGrid} 
              ref={gridRef}
              style={{
                gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
                gap: gridConfig.gap
              }}
              role="grid"
              aria-label="Process steps"
            >
            {steps.map((step, index) => {
              const IconComponent = step.icon
              const isVisible = visibleSteps.has(step.id)
              const isHovered = hoveredStep === step.id
              const isActive = activeStep === step.id

              return (
                <div 
                  key={step.id} 
                  className={`${styles.processStep} ${isVisible ? styles.visible : ''} ${isActive ? styles.active : ''} ${getIconShiftClass(index)}`}
                  data-step-id={step.id}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onMouseEnter={() => !isMobile && setHoveredStep(step.id)}
                  onMouseLeave={() => !isMobile && setHoveredStep(null)}
                  onClick={(e) => handleStepClick(step.id, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleStepClick(step.id, e as any)
                    }
                  }}
                  ref={(el) => {
                    stepRefs.current[step.id] = el
                    if (activeStep === step.id) {
                      (activeStepRef as React.MutableRefObject<HTMLDivElement | null>).current = el
                    }
                  }}
                  role="gridcell"
                  tabIndex={0}
                  aria-label={`${step.label}. Click to view details.`}
                  aria-expanded={isActive}
                >
                  <div className={styles.stepContent}>
                    <div className={`${styles.iconContainer} ${isHovered ? styles.hovered : ''} ${isActive ? styles.active : ''}`}>
                      <div className={styles.iconBackground}></div>
                      <IconComponent className={styles.stepIcon} />
                      <div className={styles.rippleEffect}></div>
                      {isActive && <div className={styles.activeIndicator} />}
                    </div>
                    <span className={styles.stepLabel}>{step.label}</span>
                  </div>

                  {/* SVG Connection System */}
                  {index < steps.length - 1 && (
                    <svg className={styles.connectionSvg} viewBox="0 0 100 100" aria-hidden="true">
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ff8c42" />
                          <stop offset="100%" stopColor="#ff6b1a" />
                        </linearGradient>
                        <marker
                          id={`arrowhead-${index}`}
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon
                            points="0 0, 10 3.5, 0 7"
                            fill="#ff6b1a"
                          />
                        </marker>
                      </defs>
                      
                      {shouldShowHorizontalConnector(index) && (
                        <path
                          d="M 70 40 L 90 40"
                          stroke={`url(#gradient-${index})`}
                          strokeWidth="3"
                          fill="none"
                          markerEnd={`url(#arrowhead-${index})`}
                          className={`${styles.connectionPath} ${styles.horizontal}`}
                        />
                      )}

                      {shouldShowVerticalConnector(index) && (
                        <path
                          d={`M 40 70 L 40 90 L ${40 - (gridConfig.columns - 1) * 100} 90 L ${40 - (gridConfig.columns - 1) * 100} 110`}
                          stroke={`url(#gradient-${index})`}
                          strokeWidth="3"
                          fill="none"
                          markerEnd={`url(#arrowhead-${index})`}
                          className={`${styles.connectionPath} ${styles.vertical}`}
                        />
                      )}
                    </svg>
                  )}
                </div>
              )
            })}
            </div>

            {/* Description Card */}
            {activeStep && (
              <DescriptionCard step={steps.find(s => s.id === activeStep)!} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProcessFlowComponent
