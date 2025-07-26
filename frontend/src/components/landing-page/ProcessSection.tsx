"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
  ArrowRight,
} from "lucide-react"

/**
 * Enhanced ProcessFlowComponent - A responsive React component that displays a 12-step process flow
 *
 * Features:
 * - Adaptive responsive grid layout (4×3 → 3×4 → 2×6 based on screen size)
 * - Interactive and animated icons with hover effects
 * - Smart SVG connection system with directional arrows
 * - Rich text formatting with highlighted key phrases
 * - Scroll-triggered animations
 * - Touch-optimized mobile experience
 * - Accessibility features
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

const ProcessFlowComponent: React.FC = () => {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null)
  const [visibleSteps, setVisibleSteps] = useState<Set<string>>(new Set())
  const [gridConfig, setGridConfig] = useState<GridConfig>({ columns: 4, rows: 3, gap: "2rem" })
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const steps: ProcessStep[] = [
    { id: "measure", label: "Measure", icon: Ruler, description: "Precise measurements of your space" },
    { id: "input", label: "Input", icon: ClipboardList, description: "Data entry and requirements gathering" },
    { id: "model", label: "Model", icon: Package, description: "3D modeling and visualization" },
    { id: "design", label: "Design", icon: FileText, description: "Custom design creation" },
    { id: "payment", label: "Payment", icon: CreditCard, description: "Secure payment processing" },
    { id: "invoice", label: "Invoice", icon: Receipt, description: "Detailed invoice generation" },
    { id: "check", label: "Check", icon: CheckSquare, description: "Quality assurance checks" },
    { id: "estimate", label: "Estimate", icon: Calculator, description: "Accurate cost estimation" },
    { id: "factory", label: "Factory", icon: Factory, description: "Manufacturing process" },
    { id: "packing", label: "Packing", icon: PackageOpen, description: "Careful packaging" },
    { id: "dispatch", label: "Dispatch", icon: Truck, description: "Logistics and shipping" },
    { id: "install", label: "Install", icon: Wrench, description: "Professional installation" },
  ]

  // Responsive grid configuration
  useEffect(() => {
    const updateGridConfig = () => {
      const width = window.innerWidth
      if (width >= 1024) {
        setGridConfig({ columns: 4, rows: 3, gap: "2rem" })
      } else if (width >= 768) {
        setGridConfig({ columns: 3, rows: 4, gap: "1.5rem" })
      } else {
        setGridConfig({ columns: 2, rows: 6, gap: "1.25rem" })
      }
    }

    updateGridConfig()
    window.addEventListener('resize', updateGridConfig)
    return () => window.removeEventListener('resize', updateGridConfig)
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

  const handleDiveDeeper = () => {
    // Navigate to detailed process page or show modal
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

  const getConnectionPath = (index: number) => {
    if (index >= steps.length - 1) return null
    
    const { row, col } = getStepPosition(index)
    const nextIndex = index + 1
    const nextPos = getStepPosition(nextIndex)
    
    if (shouldShowHorizontalConnector(index)) {
      return `M 60 30 L 80 30`
    } else if (shouldShowVerticalConnector(index)) {
      return `M 30 60 L 30 80 L -${(gridConfig.columns - 1) * 100 - 30} 80 L -${(gridConfig.columns - 1) * 100 - 30} 100`
    }
    return null
  }

  return (
    <div className="process-flow-container" ref={containerRef}>
      <div className="content-wrapper">
        {/* Left Content Section */}
        <div className="left-content">
          <div className="text-content">
            <h1 className="main-heading">
              EVERY STEP MATTERS.
              <br />
              <span className="gradient-text">SEE HOW.</span>
            </h1>
            <div className="description">
              <p>Take a look at our <strong className="font-semibold">12-step process</strong> that blends <em className="italic">craftsmanship</em> with <u className="underline">clarity</u> to ensure every detail is handled with care, precision, and transparency.</p>
            </div>
            <button 
              className="dive-deeper-btn" 
              onClick={handleDiveDeeper} 
              aria-label="Learn more about our process"
            >
              <span>Dive Deeper</span>
              <ChevronRight className="btn-icon" />
            </button>
          </div>
        </div>

        {/* Right Content Section - Process Grid */}
        <div className="right-content">
          <div 
            className="process-grid" 
            ref={gridRef}
            style={{
              gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
              gap: gridConfig.gap
            }}
          >
            {steps.map((step, index) => {
              const IconComponent = step.icon
              const isVisible = visibleSteps.has(step.id)
              const isHovered = hoveredStep === step.id

              return (
                <div 
                  key={step.id} 
                  className={`process-step ${isVisible ? 'visible' : ''}`}
                  data-step-id={step.id}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onMouseEnter={() => setHoveredStep(step.id)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  <div className="step-content">
                    <div className={`icon-container ${isHovered ? 'hovered' : ''}`}>
                      <div className="icon-background"></div>
                      <IconComponent className="step-icon" />
                      <div className="ripple-effect"></div>
                    </div>
                    <span className="step-label">{step.label}</span>
                    
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="tooltip">
                        {step.description}
                      </div>
                    )}
                  </div>

                  {/* SVG Connection System */}
                  {index < steps.length - 1 && (
                    <svg className="connection-svg" viewBox="0 0 100 100">
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
                          d="M 70 40 L 90 40" /* Adjusted horizontal path */
                          stroke={`url(#gradient-${index})`}
                          strokeWidth="3"
                          fill="none"
                          markerEnd={`url(#arrowhead-${index})`}
                          className="connection-path horizontal"
                        />
                      )}

                      {shouldShowVerticalConnector(index) && (
                        <path
                          d={`M 40 70 L 40 90 L ${40 - (gridConfig.columns - 1) * 100} 90 L ${40 - (gridConfig.columns - 1) * 100} 110`} /* Adjusted vertical path */
                          stroke={`url(#gradient-${index})`}
                          strokeWidth="3"
                          fill="none"
                          markerEnd={`url(#arrowhead-${index})`}
                          className="connection-path vertical"
                        />
                      )}
                    </svg>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .process-flow-container {
          width: 100%;
          min-height: 600px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 3rem 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .process-flow-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 80%, rgba(255, 140, 66, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(255, 107, 26, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 5rem;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .left-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .text-content {
          max-width: 500px;
        }

        .main-heading {
          font-size: 3rem;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1.1;
          margin: 0 0 2rem 0;
          letter-spacing: -0.03em;
        }

        .gradient-text {
          background: linear-gradient(135deg, #ff8c42 0%, #ff6b1a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .description {
          font-size: 1.125rem;
          color: #4a5568;
          line-height: 1.7;
          margin: 0 0 2.5rem 0;
        }

        .highlight-text {
          color: #ff6b1a;
          font-weight: 600;
          position: relative;
        }

        .highlight-text::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #ff8c42, #ff6b1a);
          border-radius: 1px;
          opacity: 0.6;
        }

        .dive-deeper-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: linear-gradient(135deg, #ff8c42 0%, #ff6b1a 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 3rem;
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(255, 140, 66, 0.3);
          position: relative;
          overflow: hidden;
        }

        .dive-deeper-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .dive-deeper-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 140, 66, 0.4);
        }

        .dive-deeper-btn:hover::before {
          left: 100%;
        }

        .btn-icon {
          width: 1.25rem;
          height: 1.25rem;
          transition: transform 0.3s ease;
        }

        .dive-deeper-btn:hover .btn-icon {
          transform: translateX(4px);
        }

        .right-content {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .process-grid {
          display: grid;
          position: relative;
          max-width: 600px;
          width: 100%;
        }

        .process-step {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          opacity: 0;
          transform: translateY(30px) scale(0.8);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .process-step.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .step-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          z-index: 2;
          position: relative;
        }

        .icon-container {
          width: 6rem; /* Increased size */
          height: 6rem; /* Increased size */
          position: relative;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .icon-background {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 1.25rem; /* Adjusted for larger size */
          box-shadow: 
            0 6px 20px rgba(0, 0, 0, 0.15), /* Adjusted shadow */
            0 3px 6px rgba(0, 0, 0, 0.08); /* Adjusted shadow */
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .icon-container.hovered .icon-background {
          background: linear-gradient(135deg, #ff8c42 0%, #ff6b1a 100%);
          transform: scale(1.1);
          box-shadow: 
            0 10px 30px rgba(255, 140, 66, 0.4), /* Adjusted shadow */
            0 5px 10px rgba(255, 107, 26, 0.3); /* Adjusted shadow */
        }

        .step-icon {
          width: 3.5rem; /* Increased size */
          height: 3.5rem; /* Increased size */
          color: #ff6b1a;
          stroke-width: 2.5;
          position: relative;
          z-index: 2;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .icon-container.hovered .step-icon {
          color: white;
          transform: scale(1.2); /* Slightly larger hover scale */
        }

        .ripple-effect {
          position: absolute;
          inset: 0;
          border-radius: 1.25rem; /* Adjusted for larger size */
          background: radial-gradient(circle, rgba(255, 140, 66, 0.4) 0%, transparent 70%); /* Adjusted ripple color */
          opacity: 0;
          transform: scale(0);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .icon-container.hovered .ripple-effect {
          opacity: 1;
          transform: scale(1.6); /* Slightly larger ripple scale */
        }

        .step-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #2d3748;
          text-align: center;
          transition: color 0.3s ease;
        }

        .process-step:hover .step-label {
          color: #ff6b1a;
        }

        .tooltip {
          position: absolute;
          top: -3rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(26, 26, 26, 0.9);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          white-space: nowrap;
          z-index: 10;
          animation: tooltipFadeIn 0.3s ease;
        }

        .tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: rgba(26, 26, 26, 0.9);
        }

        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-5px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .connection-svg {
          position: absolute;
          width: 100px;
          height: 100px;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 1;
        }

        .connection-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: drawPath 2s ease-in-out forwards;
        }

        .connection-path.horizontal {
          animation-delay: 0.5s;
        }

        .connection-path.vertical {
          animation-delay: 0.7s;
        }

        @keyframes drawPath {
          to {
            stroke-dashoffset: 0;
          }
        }

        /* Responsive Design */
        @media (max-width: 1023px) {
          .content-wrapper {
            grid-template-columns: 1fr;
            gap: 3rem;
            text-align: center;
          }

          .main-heading {
            font-size: 2.2rem;
          }

          .description {
            font-size: 1rem;
          }

          .process-grid {
            max-width: 450px;
            gap: 1.25rem;
          }

          .icon-container {
            width: 4rem;
            height: 4rem;
          }

          .step-icon {
            width: 2rem;
            height: 2rem;
          }
        }

        @media (max-width: 767px) {
          .process-flow-container {
            padding: 2rem 1rem;
          }

          .main-heading {
            font-size: 1.8rem;
          }

          .description {
            font-size: 0.9rem;
          }

          .process-grid {
            max-width: 350px;
            gap: 1rem;
          }

          .icon-container {
            width: 3.5rem;
            height: 3.5rem;
          }

          .step-icon {
            width: 1.75rem;
            height: 1.75rem;
          }

          .step-label {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  )
}

export default ProcessFlowComponent
