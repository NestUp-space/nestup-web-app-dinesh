"use client"

import { useState } from "react"
import Image from "next/legacy/image"
import { ChevronDown, ChevronUp, Ruler, ClipboardList, Package, FileText, CreditCard, Receipt, CheckSquare, Calculator, Factory, PackageOpen, Truck, Wrench } from "lucide-react"

const processSteps = [
  {
    id: "measure",
    icon: Ruler,
    imgSrc: "/img/measure.png",
    imgAlt: "laser measurement tools",
    title: "Site Measurements",
    shortDescription: "Professional measurement team visits your location using advanced laser tools to capture precise, millimeter-accurate dimensions.",
    details: {
      overview: "Our site measurement team conducts thorough on-site assessments to capture accurate, millimeter-precise measurements that form the foundation for all subsequent design and production stages.",
      keyActivities: [
        "Comprehensive measurement of heights, widths, and depths using laser measurement tools",
        "Documentation of electrical switchboard positions, windows, doors, beams, and columns",
        "Recording of surface undulations and structural anomalies",
        "Collection of project-level inputs including client details and basic project information",
      ],
      technicalSpecs: [
        "Material ID configuration with ply thickness, laminate codes, and edge banding specifications",
        "Grain direction mapping for specific planks",
        "Overall material thickness calculations (Outer Laminate + Ply Thickness + Inner Laminate)",
        "Establishment of material codes that remain consistent throughout the project",
      ],
      deliverables: [
        "Detailed site measurement report with mm-level accuracy",
        "Material specification database",
        "Technical drawings with all structural elements marked",
        "Project-level configuration setup",
      ],
      timeline: "Same day completion for standard residential projects",
    },
  },
  {
    id: "input",
    icon: ClipboardList,
    imgSrc: "/img/checklist.png",
    imgAlt: "data input and requirements",
    title: "Design Input Collection",
    shortDescription: "Gathering comprehensive design requirements including 2D layouts, laminate codes, and technical specifications through detailed consultation.",
    details: {
      overview: "We collect all necessary design inputs from you including 2D furniture layouts, laminate preferences, and technical specifications through a structured consultation process.",
      keyActivities: [
        "Collection of 2D furniture layout designs from client",
        "Laminate code selection and specification",
        "Detailed consultation call for technical requirements",
        "Kitchen appliance specifications and integration planning",
      ],
      technicalProcess: [
        "Ply thickness determination based on application",
        "Edge banding material selection (1mm inner, 2mm exposed)",
        "Hardware and fitting specifications",
        "Special requirements documentation (sliding doors, profile lights, etc.)",
      ],
      qualityControls: [
        "Design feasibility assessment",
        "Material compatibility verification",
        "Structural integrity evaluation",
        "Cost optimization recommendations",
      ],
      deliverables: [
        "Comprehensive design brief document",
        "Material specification sheet",
        "Technical requirements checklist",
        "Project timeline and milestones",
      ],
      timeline: "2-3 days for requirement finalization",
    },
  },
  {
    id: "model",
    icon: Package,
    imgSrc: "/img/automation.png",
    imgAlt: "3D modeling process",
    title: "3D Modeling",
    shortDescription: "Creation of detailed 3D models in SketchUp with precise plank-by-plank specifications, built from scratch using site measurements.",
    details: {
      overview: "Using site measurements and design inputs, we create detailed 3D models of all modular elements in SketchUp, representing the final layout plank by plank with complete technical specifications.",
      keyActivities: [
        "3D modeling of furniture layouts plank by plank using SketchUp",
        "Component creation with precise dimensions and specifications",
        "Material assignment for each surface and edge",
        "Hardware placement and hole specifications",
      ],
      technicalProcess: [
        "Adjacency condition analysis (exposed sides, box sides, wall sides)",
        "Application of edge banding rules based on exposure",
        "VB fitting and screw hole positioning for assembly",
        "Hinge hole standards based on door dimensions and ply thickness",
      ],
      qualityFeatures: [
        "Plank-level detail with exact dimensions",
        "Material code assignment for each component",
        "Hole specifications for all hardware",
        "Assembly sequence planning",
      ],
      deliverables: [
        "Complete 3D SketchUp model with all components",
        "Individual plank specifications",
        "Material assignment documentation",
        "Hardware placement drawings",
      ],
      timeline: "3-5 days depending on project complexity",
    },
  },
  {
    id: "design",
    icon: FileText,
    imgSrc: "/img/checklist.png",
    imgAlt: "design documentation",
    title: "Design Finalization",
    shortDescription: "Final design review and approval process with detailed documentation and client confirmation before production begins.",
    details: {
      overview: "We present the complete 3D model and technical specifications for your review and approval, ensuring every detail meets your requirements before moving to production.",
      keyActivities: [
        "3D model presentation and walkthrough",
        "Design review and feedback incorporation",
        "Final specification confirmation",
        "Client approval and sign-off process",
      ],
      reviewProcess: [
        "Virtual model presentation with detailed explanations",
        "Modification requests handling and implementation",
        "Material and finish confirmation",
        "Final cost and timeline confirmation",
      ],
      qualityAssurance: [
        "Design compliance with structural requirements",
        "Material availability verification",
        "Production feasibility confirmation",
        "Installation sequence validation",
      ],
      deliverables: [
        "Approved 3D model with all specifications",
        "Final design documentation package",
        "Signed client approval forms",
        "Production-ready technical drawings",
      ],
      timeline: "1-2 days for review and approval",
    },
  },
  {
    id: "payment",
    icon: CreditCard,
    imgSrc: "/img/checklist.png",
    imgAlt: "payment processing",
    title: "Payment Processing",
    shortDescription: "Transparent payment structure with token advance for measurements and staged payments aligned with production milestones.",
    details: {
      overview: "Our transparent payment structure ensures you pay only as work progresses, with clear milestones and no hidden costs.",
      paymentStructure: [
        "₹5,000 token advance for site measurements and pre-production documentation",
        "₹110 per sq ft when material reaches factory for production start",
        "₹110 per sq ft when material is ready for dispatch",
        "Total rate: ₹220 per sq ft (excluding material, transportation, and GST)",
      ],
      included: [
        "Site measurements with laser precision",
        "Complete pre-production documentation",
        "3D modeling and design services",
        "Factory production and quality control",
      ],
      transparency: [
        "No hidden charges or surprise costs",
        "Clear breakdown of all expenses",
        "Flexible payment options available",
        "GST invoicing for business clients",
      ],
      deliverables: [
        "Detailed cost breakdown and invoice",
        "Payment schedule documentation",
        "Receipt and payment confirmations",
        "GST compliance documentation",
      ],
      timeline: "Immediate processing upon approval",
    },
  },
  {
    id: "invoice",
    icon: Receipt,
    imgSrc: "/img/checklist.png",
    imgAlt: "invoice generation",
    title: "Invoice Generation",
    shortDescription: "Detailed invoice generation with complete breakdown of costs, materials, and services for transparent billing.",
    details: {
      overview: "We provide comprehensive invoicing with detailed breakdowns of all costs, ensuring complete transparency in billing and compliance with tax requirements.",
      invoiceComponents: [
        "Detailed service breakdown with quantities",
        "Material specifications and costs (if applicable)",
        "Labor and processing charges",
        "GST calculations and tax compliance",
      ],
      documentation: [
        "Itemized service descriptions",
        "Square footage calculations",
        "Payment milestone tracking",
        "Tax registration and compliance details",
      ],
      qualityFeatures: [
        "Professional invoice formatting",
        "Digital and physical copy provision",
        "Payment tracking and reminders",
        "Accounting software integration ready",
      ],
      deliverables: [
        "Professional invoice with all details",
        "Payment tracking documentation",
        "GST compliance certificates",
        "Digital receipt management",
      ],
      timeline: "Same day invoice generation",
    },
  },
  {
    id: "check",
    icon: CheckSquare,
    imgSrc: "/img/checklist.png",
    imgAlt: "quality check process",
    title: "Pre-Production Check",
    shortDescription: "Comprehensive quality assurance checks before production begins, including material verification and design validation.",
    details: {
      overview: "Before production begins, we conduct thorough checks to ensure all specifications are correct, materials are available, and the design is production-ready.",
      qualityChecks: [
        "Design specification verification against client requirements",
        "Material availability and quality confirmation",
        "Production feasibility assessment",
        "Timeline and resource allocation validation",
      ],
      technicalValidation: [
        "Structural integrity analysis",
        "Hardware compatibility verification",
        "Assembly sequence optimization",
        "Installation requirements confirmation",
      ],
      materialVerification: [
        "Laminate code accuracy and availability",
        "Ply thickness and quality standards",
        "Edge banding material specifications",
        "Hardware and fitting compatibility",
      ],
      deliverables: [
        "Pre-production quality report",
        "Material verification certificate",
        "Production readiness confirmation",
        "Final specification sign-off",
      ],
      timeline: "1 day for comprehensive verification",
    },
  },
  {
    id: "estimate",
    icon: Calculator,
    imgSrc: "/img/checklist.png",
    imgAlt: "material estimation",
    title: "Material Estimation",
    shortDescription: "Precise material estimates with detailed cut lists, optimized sheet utilization, and waste minimization calculations.",
    details: {
      overview: "We generate detailed material estimates with precise cut lists that optimize sheet utilization and minimize waste, providing complete transparency in material requirements.",
      estimationProcess: [
        "Plank-by-plank material calculation",
        "Cut list generation with sheet optimization",
        "Waste minimization through nesting algorithms",
        "Material quantity verification and buffer calculations",
      ],
      technicalDetails: [
        "Sheet utilization optimization (8x4 feet standard sheets)",
        "Cutting tool diameter compensation (8mm kerf allowance)",
        "Grain direction considerations for aesthetic panels",
        "Edge banding length calculations",
      ],
      qualityFeatures: [
        "Detailed breakdown showing plank placement on each sheet",
        "Material code tracking for each component",
        "Waste percentage calculations and optimization",
        "Alternative material suggestions for cost optimization",
      ],
      deliverables: [
        "Comprehensive material estimate with quantities",
        "Detailed cut list with sheet layouts",
        "Material procurement guidelines",
        "Cost optimization recommendations",
      ],
      timeline: "2-3 days for detailed estimation",
    },
  },
  {
    id: "factory",
    icon: Factory,
    imgSrc: "/img/automation.png",
    imgAlt: "factory production",
    title: "Factory Production",
    shortDescription: "State-of-the-art CNC manufacturing with automated cutting, precision hole drilling, and quality control processes.",
    details: {
      overview: "Once materials arrive at our factory, we conduct thorough input QA before beginning our automated production process using advanced CNC machinery and strict quality control systems.",
      productionStages: [
        "Input Quality Assurance: Checking for undulations and material anomalies",
        "Pressing Operations: Cold press, hot press, or rolling press based on material type",
        "Automated CNC Cutting: Precise cutting with guaranteed hole placement accuracy",
        "Edge Banding: Application of 1mm or 2mm edge banding as specified",
      ],
      technicalCapabilities: [
        "CNC machines with 12-tool capacity for various operations",
        "Automated hole drilling for hinges, screws, and VB fittings",
        "Profile light cutting and specialized groove creation",
        "Nesting optimization for maximum sheet utilization",
      ],
      qualityAssurance: [
        "Automated machinery ensures no misplaced holes",
        "Continuous quality monitoring throughout production",
        "Dimensional accuracy verification at each stage",
        "Surface finish quality control",
      ],
      deliverables: [
        "Precision-cut components with all specifications",
        "Quality control certificates",
        "Production progress reports",
        "Component identification and labeling",
      ],
      timeline: "14 working days from material receipt to completion",
    },
  },
  {
    id: "packing",
    icon: PackageOpen,
    imgSrc: "/img/installation.png",
    imgAlt: "packaging process",
    title: "Quality Packing",
    shortDescription: "Systematic unit-wise packaging with installation-optimized organization and comprehensive quality checks.",
    details: {
      overview: "After production, all components undergo final quality checks and are systematically packed unit-wise for easy installation, with each package clearly labeled and organized.",
      packagingProcess: [
        "Final quality inspection of all components",
        "Unit-wise segregation and organization",
        "Installation-sequence based packaging",
        "Protective packaging for transportation",
      ],
      qualityFeatures: [
        "Each package contains all components for one unit",
        "Clear labeling with component identification",
        "Installation guide inclusion in each package",
        "Protective materials to prevent damage during transport",
      ],
      organizationSystem: [
        "Component identification labels on each piece",
        "Installation sequence numbering",
        "Hardware and fittings separately packed and labeled",
        "Assembly instruction cards for each unit",
      ],
      deliverables: [
        "Installation-ready packaged units",
        "Component identification documentation",
        "Packaging list with contents verification",
        "Transportation and handling guidelines",
      ],
      timeline: "1-2 days for complete packaging",
    },
  },
  {
    id: "dispatch",
    icon: Truck,
    imgSrc: "/img/installation.png",
    imgAlt: "dispatch and logistics",
    title: "Dispatch & Logistics",
    shortDescription: "Coordinated dispatch with transportation arrangements and delivery scheduling to ensure safe arrival at your site.",
    details: {
      overview: "We coordinate the dispatch of your packaged units with proper transportation arrangements, ensuring safe delivery to your site with all necessary documentation.",
      logisticsProcess: [
        "Transportation arrangement and vehicle selection",
        "Loading supervision with proper handling protocols",
        "Delivery scheduling coordination with client",
        "Transportation insurance and safety measures",
      ],
      documentation: [
        "Dispatch documentation with complete inventory",
        "Transportation receipts and tracking information",
        "Delivery confirmation and sign-off procedures",
        "Insurance coverage documentation",
      ],
      qualityAssurance: [
        "Proper loading techniques to prevent damage",
        "Transportation route optimization",
        "Delivery time coordination with installation team",
        "Condition verification upon delivery",
      ],
      deliverables: [
        "Complete packaged units delivered to site",
        "Dispatch and delivery documentation",
        "Transportation insurance certificates",
        "Delivery confirmation receipts",
      ],
      timeline: "1-3 days depending on location and logistics",
    },
  },
  {
    id: "install",
    icon: Wrench,
    imgSrc: "/img/installation.png",
    imgAlt: "professional installation",
    title: "Professional Installation",
    shortDescription: "Expert installation support with detailed guides, on-site engineering assistance, and professional carpentry teams available.",
    details: {
      overview: "Our installation phase ensures seamless assembly of your modular furniture with professional support, detailed guides, and quality assurance throughout the process.",
      installationOptions: [
        "Detailed installation guides for teams with basic carpentry skills",
        "On-site engineer training and supervision available",
        "Professional carpentry teams available for hire",
        "Hybrid fitting approach combining screw and minifix systems for optimal results",
      ],
      supportServices: [
        "Site engineer deployment for team training and guidance",
        "Step-by-step installation documentation with illustrations",
        "Quality control monitoring during installation process",
        "Post-installation support and troubleshooting",
      ],
      qualityFeatures: [
        "Installation-optimized packaging for easy site handling",
        "Component identification system for efficient assembly",
        "Precision-cut components requiring minimal on-site adjustments",
        "Professional finishing with attention to detail",
      ],
      transparency: [
        "Open factory policy for existing customers to visit anytime",
        "Material tracking and verification system throughout process",
        "Regular progress updates during production and installation",
        "Direct customer supervision opportunities at every stage",
      ],
      deliverables: [
        "Fully installed modular furniture units",
        "Installation completion certificates",
        "Maintenance and care instructions",
        "Warranty documentation and support contacts",
      ],
      timeline: "Varies based on project size and complexity",
    },
  },
]

const pricingInfo = {
  rate: "₹220 per sq ft",
  includes: ["Site measurements", "Pre-production documentation", "Factory production"],
  excludes: ["Material costs", "Transportation", "GST"],
  paymentStructure: [
    "₹5,000 token advance for site measurements and pre-production",
    "₹110 per sq ft when material reaches factory",
    "₹110 per sq ft when material is ready for dispatch",
  ],
}

export function DetailedProcess() {
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [showPricing, setShowPricing] = useState(false)

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId)
  }

  return (
    <section className="w-screen p-5 md:px-20 lg:px-40 bg-gradient-to-b from-white to-gray-50" id="detailed-process">
      <div className="text-theme-color text-3xl md:text-5xl font-bold tracking-tight md:tracking-tighter leading-tight mb-8 mt-8">
        <h1>Our Comprehensive 12-Step Process</h1>
        <p className="text-lg md:text-xl font-normal text-gray-600 mt-4 leading-relaxed">
          7+ years of industry experience refined into a streamlined, error-free process for faster turnaround,
          cost-effective production, and meticulous attention to detail.
        </p>
      </div>

      {/* Process Steps */}
      <div className="space-y-4 mb-12">
        {processSteps.map((step, index) => {
          const IconComponent = step.icon
          return (
            <div key={step.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300">
              {/* Step Header */}
              <div
                className="grid grid-cols-1 md:grid-cols-6 gap-6 p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleStep(step.id)}
              >
                <div className="md:col-span-1 flex justify-center md:justify-start">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-theme-color to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <IconComponent className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -left-2 bg-theme-color text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-md">
                      {index + 1}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-5 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-theme-color mb-2">{step.title}</h3>
                    <p className="text-gray-700 leading-relaxed">{step.shortDescription}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {expandedStep === step.id ? (
                      <ChevronUp className="w-6 h-6 text-theme-color" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-theme-color" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedStep === step.id && (
                <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-blue-50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-bold text-lg text-theme-color mb-3 flex items-center">
                        <div className="w-2 h-2 bg-theme-color rounded-full mr-2"></div>
                        Overview
                      </h4>
                      <p className="text-gray-700 mb-6 leading-relaxed">{step.details.overview}</p>

                      {step.details.keyActivities && (
                        <>
                          <h4 className="font-bold text-lg text-theme-color mb-3 flex items-center">
                            <div className="w-2 h-2 bg-theme-color rounded-full mr-2"></div>
                            Key Activities
                          </h4>
                          <ul className="space-y-3 mb-6">
                            {step.details.keyActivities.map((activity, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-2 h-2 bg-theme-color rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-gray-700">{activity}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {step.details.productionStages && (
                        <>
                          <h4 className="font-bold text-lg text-theme-color mb-3 flex items-center">
                            <div className="w-2 h-2 bg-theme-color rounded-full mr-2"></div>
                            Production Stages
                          </h4>
                          <ul className="space-y-3 mb-6">
                            {step.details.productionStages.map((stage, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-2 h-2 bg-theme-color rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-gray-700">{stage}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {step.details.installationOptions && (
                        <>
                          <h4 className="font-bold text-lg text-theme-color mb-3 flex items-center">
                            <div className="w-2 h-2 bg-theme-color rounded-full mr-2"></div>
                            Installation Options
                          </h4>
                          <ul className="space-y-3 mb-6">
                            {step.details.installationOptions.map((option, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-2 h-2 bg-theme-color rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-gray-700">{option}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {step.details.paymentStructure && (
                        <>
                          <h4 className="font-bold text-lg text-theme-color mb-3 flex items-center">
                            <div className="w-2 h-2 bg-theme-color rounded-full mr-2"></div>
                            Payment Structure
                          </h4>
                          <div className="space-y-3 mb-6">
                            {step.details.paymentStructure.map((payment, idx) => (
                              <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-blue-800 font-medium">{payment}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      {step.details.technicalSpecs && (
                        <>
                          <h4 className="font-bold text-lg text-orange-600 mb-3 flex items-center">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                            Technical Specifications
                          </h4>
                          <ul className="space-y-3 mb-6">
                            {step.details.technicalSpecs.map((spec, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-gray-700">{spec}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {step.details.technicalProcess && (
                        <>
                          <h4 className="font-bold text-lg text-orange-600 mb-3 flex items-center">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                            Technical Process
                          </h4>
                          <ul className="space-y-3 mb-6">
                            {step.details.technicalProcess.map((process, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-gray-700">{process}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {step.details.technicalCapabilities && (
                        <>
                          <h4 className="font-bold text-lg text-orange-600 mb-3 flex items-center">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                            Technical Capabilities
                          </h4>
                          <ul className="space-y-3 mb-6">
                            {step.details.technicalCapabilities.map((capability, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-gray-700">{capability}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {step.details.supportServices && (
                        <>
                          <h4 className="font-bold text-lg text-purple-600 mb-3 flex items-center">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                            Support Services
                          </h4>
                          <ul className="space-y-3 mb-6">
                            {step.details.supportServices.map((service, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-gray-700">{service}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {step.details.qualityChecks && (
                        <>
                          <h4 className="font-bold text-lg text-green-600 mb-3 flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            Quality Checks
                          </h4>
                          <ul className="space-y-3 mb-6">
                            {step.details.qualityChecks.map((check, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-gray-700">{check}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {step.details.qualityControls && (
                        <>
                          <h4 className="font-bold text-lg text-green-600 mb-3 flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            Quality Controls
                          </h4>
                          <ul className="space-y-3 mb-6">
                            {step.details.qualityControls.map((control, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-gray-700">{control}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {step.details.qualityAssurance && (
                        <>
                          <h4 className="font-bold text-lg text-green-600 mb-3 flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            Quality Assurance
                          </h4>
                          <ul className="space-y-3 mb-6">
                            {step.details.qualityAssurance.map((qa, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-gray-700">{qa}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {step.details.qualityFeatures && (
                        <>
                          <h4 className="font-bold text-lg text-green-600 mb-3 flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            Quality Features
                          </h4>
                          <ul className="space-y-3 mb-6">
                            {step.details.qualityFeatures.map((feature, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {step.details.transparency && (
                        <>
                          <h4 className="font-bold text-lg text-blue-600 mb-3 flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            Transparency & Trust
                          </h4>
                          <ul className="space-y-3 mb-6">
                            {step.details.transparency.map((item, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {step.details.deliverables && (
                        <>
                          <h4 className="font-bold text-lg text-blue-600 mb-3 flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            Deliverables
                          </h4>
                          <ul className="space-y-3 mb-6">
                            {step.details.deliverables.map((deliverable, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-gray-700">{deliverable}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {step.details.timeline && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-bold text-lg text-blue-800 mb-2">Timeline</h4>
                          <p className="text-blue-700">{step.details.timeline}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pricing Information */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-12">
        <div
          className="p-6 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
          onClick={() => setShowPricing(!showPricing)}
        >
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-theme-color mb-2">Pricing & Payment Structure</h3>
            <p className="text-gray-700">Transparent pricing at {pricingInfo.rate} with flexible payment options</p>
          </div>
          {showPricing ? (
            <ChevronUp className="w-6 h-6 text-theme-color" />
          ) : (
            <ChevronDown className="w-6 h-6 text-theme-color" />
          )}
        </div>

        {showPricing && (
          <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-lg text-theme-color mb-3">What's Included</h4>
                <ul className="space-y-2 mb-6">
                  {pricingInfo.includes.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>

                <h4 className="font-bold text-lg text-theme-color mb-3">Additional Costs</h4>
                <ul className="space-y-2">
                  {pricingInfo.excludes.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-lg text-theme-color mb-3">Payment Schedule</h4>
                <div className="space-y-4">
                  {pricingInfo.paymentStructure.map((payment, idx) => (
                    <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-blue-800 font-medium">{payment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="mt-12 text-center">
        <div className="bg-gradient-to-r from-theme-color to-orange-600 text-white p-8 rounded-xl shadow-lg">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to Experience Our Process?</h3>
          <p className="text-lg mb-6 opacity-90">
            Visit our factory Monday to Saturday, 10 AM to 6 PM for new designers. Existing customers welcome anytime!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-theme-color px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md">
              Schedule Site Measurement
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-theme-color transition-colors">
              Visit Our Factory
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
