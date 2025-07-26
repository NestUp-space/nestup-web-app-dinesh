"use client"

import { useState } from "react"
import Image from "next/legacy/image"
import { ChevronDown, ChevronUp } from "lucide-react"
import { processSteps, pricingInfo } from "@/constants/processSteps";

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
        <p className="text-lg md:text-xl font-normal text-gray-600 mt-4 leading-relaxed tracking-wider">
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
                <h4 className="font-bold text-lg text-theme-color mb-3">What&apos;s Included</h4>
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
