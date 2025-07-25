"use client"

import type React from "react"
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
} from "lucide-react"

/**
 * ProcessFlowComponent - A responsive React component that displays a 12-step process flow
 *
 * This component replicates a visual process workflow showing the journey from measurement
 * to installation. It features:
 * - Responsive grid layout that adapts to different screen sizes
 * - Interactive "Dive Deeper" button
 * - Clean, modern design with orange accent color
 * - Icon-based step visualization with connecting flow lines
 *
 * Usage:
 * <ProcessFlowComponent />
 *
 * Customization:
 * - Modify the `steps` array to change process steps
 * - Update CSS custom properties for color theming
 * - Adjust grid layout in responsive breakpoints
 */

interface ProcessStep {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const ProcessFlowComponent: React.FC = () => {
  const steps: ProcessStep[] = [
    { id: "measure", label: "Measure", icon: Ruler },
    { id: "input", label: "Input", icon: ClipboardList },
    { id: "model", label: "Model", icon: Package },
    { id: "design", label: "Design", icon: FileText },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "invoice", label: "Invoice", icon: Receipt },
    { id: "check", label: "Check", icon: CheckSquare },
    { id: "estimate", label: "Estimate", icon: Calculator },
    { id: "factory", label: "Factory", icon: Factory },
    { id: "packing", label: "Packing", icon: PackageOpen },
    { id: "dispatch", label: "Dispatch", icon: Truck },
    { id: "install", label: "Install", icon: Wrench },
  ]

  const handleDiveDeeper = () => {
    // Placeholder for dive deeper functionality
    console.log("Dive deeper clicked")
  }

  return (
    <div className="process-flow-container">
      <div className="content-wrapper">
        {/* Left Content Section */}
        <div className="left-content">
          <div className="text-content">
            <h1 className="main-heading">
              EVERY STEP MATTERS.
              <br />
              SEE HOW.
            </h1>
            <p className="description">
              Take a look at our 12-step process that blends craftsmanship with clarity to ensure every detail is
              handled with care, precision, and transparency.
            </p>
            <button className="dive-deeper-btn" onClick={handleDiveDeeper} aria-label="Learn more about our process">
              Dive Deeper
              <ChevronRight className="btn-icon" />
            </button>
          </div>
        </div>

        {/* Right Content Section - Process Grid */}
        <div className="right-content">
          <div className="process-grid">
            {steps.map((step, index) => {
              const IconComponent = step.icon
              const isLastInRow = (index + 1) % 4 === 0
              const isLastStep = index === steps.length - 1

              return (
                <div key={step.id} className="process-step">
                  <div className="step-content">
                    <div className="icon-container">
                      <IconComponent className="step-icon" />
                    </div>
                    <span className="step-label">{step.label}</span>
                  </div>

                  {/* Horizontal connector line */}
                  {!isLastInRow && !isLastStep && <div className="connector-horizontal" />}

                  {/* Vertical connector line for end of row */}
                  {isLastInRow && !isLastStep && <div className="connector-vertical" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .process-flow-container {
          width: 100%;
          min-height: 500px;
          background-color: #f8f9fa;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .left-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .text-content {
          max-width: 400px;
        }

        .main-heading {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.2;
          margin: 0 0 1.5rem 0;
          letter-spacing: -0.02em;
        }

        .description {
          font-size: 1rem;
          color: #666;
          line-height: 1.6;
          margin: 0 0 2rem 0;
        }

        .dive-deeper-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #ff8c42;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dive-deeper-btn:hover {
          background-color: #e67a35;
          transform: translateY(-1px);
        }

        .btn-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .right-content {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .process-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem 1.5rem;
          position: relative;
          max-width: 500px;
        }

        .process-step {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .step-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          z-index: 2;
          position: relative;
        }

        .icon-container {
          width: 3rem;
          height: 3rem;
          background-color: white;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .step-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: #ff8c42;
          stroke-width: 2;
        }

        .step-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1a1a1a;
          text-align: center;
        }

        .connector-horizontal {
          position: absolute;
          top: 1.5rem;
          left: calc(100% + 0.75rem);
          width: 1.5rem;
          height: 2px;
          background-color: #ff8c42;
          z-index: 1;
        }

        .connector-vertical {
          position: absolute;
          top: calc(100% + 1rem);
          left: 1.5rem;
          width: 2px;
          height: 2rem;
          background-color: #ff8c42;
          z-index: 1;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .content-wrapper {
            grid-template-columns: 1fr;
            gap: 3rem;
            text-align: center;
          }

          .main-heading {
            font-size: 2rem;
          }

          .process-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem 1rem;
            max-width: 300px;
          }

          .connector-horizontal {
            display: none;
          }

          .connector-vertical {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .process-flow-container {
            padding: 1rem;
          }

          .main-heading {
            font-size: 1.75rem;
          }

          .process-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            max-width: 200px;
          }
        }
      `}</style>
    </div>
  )
}

export default ProcessFlowComponent
