"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from 'next/navigation'
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
  type LucideIcon,
} from "lucide-react"
import styles from './ProcessFlow.module.css'
import { useBubblePhysics } from './useBubblePhysics'

interface ProcessStep {
  id: string
  label: string
  icon: LucideIcon
  description: string
}

const ProcessFlowComponent: React.FC = () => {
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [hoveredStep, setHoveredStep] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [jiggleStep, setJiggleStep] = useState<string | null>(null)
  const [isInView, setIsInView] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

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

  // Calculate circular positions for bubbles (tighter radius so less scattered)
  const bubblePositions = useMemo(() => {
    const radius = isMobile ? 120 : 140
    return steps.map((step, index) => {
      const angle = (index * 2 * Math.PI) / steps.length - Math.PI / 2 // Start from top
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      return { id: step.id, x, y }
    })
  }, [steps, isMobile])

  // Initialize bubble physics: only when mounted, desktop, section in view, and user has not requested reduced motion
  const physicsEnabled = mounted && !isMobile && isInView && !prefersReducedMotion
  const { positions, disturbBubble, disturbAllBubbles } = useBubblePhysics({
    bubbles: bubblePositions,
    containerWidth: 500,
    containerHeight: 500,
    enabled: physicsEnabled
  })

  // Pause physics when section is off-screen to reduce main-thread work
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: '50px', threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Respect prefers-reduced-motion for accessibility and performance
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = () => setPrefersReducedMotion(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

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
    
    // Add jiggle effect
    setJiggleStep(stepId)
    setTimeout(() => setJiggleStep(null), 600)
    
    // Disturb the bubble physics
    if (!isMobile) {
      disturbBubble(stepId, 8)
      setTimeout(() => disturbAllBubbles(3), 200)
    }
  }, [activeStep, isMobile, disturbBubble, disturbAllBubbles])

  const handleStepHover = useCallback((stepId: string | null) => {
    if (isMobile) return
    setHoveredStep(stepId)
    
    if (stepId && !activeStep) {
      disturbBubble(stepId, 2)
    }
  }, [isMobile, activeStep, disturbBubble])

  const handleCloseDescription = useCallback(() => {
    setActiveStep(null)
  }, [])

  const router = useRouter()

  const handleDiveDeeper = () => {
    router.push('/process')
    if (!isMobile) {
      disturbAllBubbles(5)
    }
  }

  return (
    <div className={styles.container} ref={sectionRef}>
      <div className={styles.maxWidth}>
        <div className={styles.grid}>
          
          {/* Left Content Section */}
          <div className={styles.leftContent}>
            <div className={styles.textSection}>
              <h1 className={styles.mainHeading}>
                EVERY STEP MATTERS.
                <br />
                <span className={styles.gradientText}>
                  SEE HOW.
                </span>
              </h1>
              
              <div className={styles.description}>
                <p>
                  Take a look at our <strong>12-step process</strong> that blends{" "}
                  <em>craftsmanship</em> with{" "}
                  <u>clarity</u> to ensure every detail is handled with care, precision, and transparency.
                </p>
              </div>
              
              <button 
                onClick={handleDiveDeeper}
                className={styles.diveButton}
                aria-label="Learn more about our process"
              >
                <span>Dive Deeper</span>
                <ChevronRight className={styles.buttonIcon} />
              </button>
            </div>
          </div>

          {/* Right Content Section - Bubble Diagram */}
          <div className={styles.rightContent}>
            <div className={styles.bubbleContainer} ref={containerRef}>
              
              {/* Center Bubble - Always centered at 50%, 50% */}
              <div 
                className={styles.centerBubble}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className={styles.centerNumber}>12</div>
                <div className={styles.centerLabel}>Steps</div>
              </div>

              {/* Process Bubbles */}
              {steps.map((step, index) => {
                const IconComponent = step.icon
                const isActive = activeStep === step.id
                const isHovered = hoveredStep === step.id
                const isJiggling = jiggleStep === step.id
                
                // Use physics positions if available, otherwise fall back to calculated positions
                const position = positions[step.id] || bubblePositions[index]
                
                return (
                  <div key={step.id} style={{ position: 'relative' }}>
                    <div
                      className={`${styles.processBubble} ${isActive ? styles.active : ''} ${isJiggling ? styles.jiggle : styles.floating}`}
                      style={{
                        position: 'absolute',
                        left: `calc(50% + ${position.x}px)`,
                        top: `calc(50% + ${position.y}px)`,
                        transform: 'translate(-50%, -50%)',
                        animationDelay: `${index * 0.1}s`
                      }}
                      onMouseEnter={() => handleStepHover(step.id)}
                      onMouseLeave={() => handleStepHover(null)}
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
                      <div className={styles.bubbleContent}>
                        {/* Bubble Icon */}
                        <div className={`${styles.bubbleIcon} ${isActive ? styles.active : ''} ${isHovered ? styles.hovered : ''}`}>
                          <IconComponent className={styles.iconSvg} />
                          
                          {/* Step Number */}
                          <div className={styles.bubbleNumber}>
                            {index + 1}
                          </div>
                        </div>

                        {/* Step Label */}
                        <div 
                          className={styles.bubbleLabel}
                          style={{
                            opacity: isHovered || isActive ? 1 : 0,
                            transform: isHovered || isActive ? 'translateY(0)' : 'translateY(10px)'
                          }}
                        >
                          {step.label}
                        </div>
                      </div>
                    </div>

                    {/* Hover Tooltip for Desktop */}
                    {isHovered && !isMobile && !activeStep && (
                      <div
                        style={{
                          position: 'fixed',
                          left: `calc(50% + ${position.x}px + 60px)`,
                          top: `calc(50% + ${position.y}px - 20px)`,
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          color: 'white',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          maxWidth: '300px',
                          zIndex: 9998,
                          pointerEvents: 'none',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                          animation: 'fadeIn 0.2s ease-out'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>
                          {step.description}
                        </div>
                        {/* Tooltip Arrow */}
                        <div
                          style={{
                            position: 'absolute',
                            left: '-6px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 0,
                            height: 0,
                            borderTop: '6px solid transparent',
                            borderBottom: '6px solid transparent',
                            borderRight: '6px solid rgba(0, 0, 0, 0.9)'
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Mobile Container */}
        <div className={styles.mobileContainer}>
          <h3 className={styles.mobileTitle}>Process Steps</h3>
          {steps.map((step, index) => {
            const IconComponent = step.icon
            const isActive = activeStep === step.id
            
            return (
              <div key={step.id} className={styles.mobileStep}>
                <button
                  onClick={() => handleStepClick(step.id)}
                  className={styles.mobileStepButton}
                >
                  <div className={`${styles.mobileStepIcon} ${isActive ? styles.active : ''}`}>
                    <IconComponent className={styles.mobileStepIconSvg} />
                  </div>
                  <div className={styles.mobileStepContent}>
                    <div className={styles.mobileStepLabel}>{step.label}</div>
                  </div>
                  <div className={styles.mobileStepNumber}>
                    {index + 1}
                  </div>
                </button>
                
                {isActive && (
                  <div className={styles.mobileStepDescription}>
                    {step.description}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Step Description Overlay */}
      {activeStep && mounted && !isMobile && (
        <div 
          className={styles.descriptionOverlay} 
          onClick={handleCloseDescription}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div 
            className={styles.descriptionCard} 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              transform: 'scale(1)',
              animation: 'fadeInScale 0.3s ease-out'
            }}
          >
            <button 
              onClick={handleCloseDescription}
              className={styles.closeButton}
              aria-label="Close description"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
                zIndex: 10000
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <X size={20} />
            </button>
            
            {(() => {
              const step = steps.find(s => s.id === activeStep)
              if (!step) return null
              const IconComponent = step.icon
              
              return (
                <div className={styles.cardContent}>
                  <div 
                    className={styles.cardIconContainer}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      backgroundColor: '#f3f4f6',
                      marginBottom: '24px'
                    }}
                  >
                    <IconComponent 
                      className={styles.cardIcon}
                      style={{
                        width: '32px',
                        height: '32px',
                        color: '#374151'
                      }}
                    />
                  </div>
                  <h3 
                    className={styles.cardTitle}
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      marginBottom: '16px',
                      color: '#111827',
                      lineHeight: '1.3'
                    }}
                  >
                    {step.label}
                  </h3>
                  <p 
                    className={styles.cardDescription}
                    style={{
                      fontSize: '16px',
                      lineHeight: '1.6',
                      color: '#6b7280',
                      margin: 0
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* CSS Animation for modal */}
      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default ProcessFlowComponent
