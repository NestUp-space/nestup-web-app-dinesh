"use client"

import { useState } from "react"
import Image from "next/legacy/image"
import { ChevronDown, ChevronUp } from "lucide-react"
import { processSteps, pricingInfo } from "@/constants/processSteps";
import { Button } from "@/components/ui/button";

export function DetailedProcess() {
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [showPricing, setShowPricing] = useState(false)

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId)
  }

  return (
    <section className="w-screen py-24 bg-neutral-light" id="detailed-process">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-darkest-text mb-4">
            Our Comprehensive 12-Step Process
          </h1>
          <p className="text-lg md:text-xl font-normal text-dark-text max-w-3xl mx-auto leading-relaxed">
            7+ years of industry experience refined into a streamlined, error-free process for faster turnaround,
            cost-effective production, and meticulous attention to detail.
          </p>
        </div>

        {/* Process Steps */}
        <div className="space-y-4 mb-12">
          {processSteps.map((step, index) => {
            const IconComponent = step.icon
            return (
              <div key={step.id} className="bg-white rounded-dls-lg shadow-lg overflow-hidden border border-neutral-light hover:shadow-xl transition-all duration-300">
                {/* Step Header */}
                <div
                  className="grid grid-cols-1 md:grid-cols-6 gap-6 p-6 cursor-pointer hover:bg-neutral-light transition-colors"
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
                      <p className="text-dark-text leading-relaxed">{step.shortDescription}</p>
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
                  <div className="border-t border-neutral-light p-6 bg-lighter-bg">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-bold text-lg text-theme-color mb-3 flex items-center">
                          <div className="w-2 h-2 bg-theme-color rounded-full mr-2"></div>
                          Overview
                        </h4>
                        <p className="text-dark-text mb-6 leading-relaxed">{step.details.overview}</p>

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
                                  <span className="text-dark-text">{activity}</span>
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
                                  <span className="text-dark-text">{stage}</span>
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
                                  <span className="text-dark-text">{option}</span>
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
                                <div key={idx} className="p-3 bg-neutral-light rounded-lg border border-neutral-light">
                                  <p className="text-dark-text font-medium">{payment}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      <div>
                        {step.details.technicalSpecs && (
                          <>
                            <h4 className="font-bold text-lg text-primary-orange mb-3 flex items-center">
                              <div className="w-2 h-2 bg-primary-orange rounded-full mr-2"></div>
                              Technical Specifications
                            </h4>
                            <ul className="space-y-3 mb-6">
                              {step.details.technicalSpecs.map((spec, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="w-2 h-2 bg-primary-orange rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span className="text-dark-text">{spec}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}

                        {step.details.technicalProcess && (
                          <>
                            <h4 className="font-bold text-lg text-primary-orange mb-3 flex items-center">
                              <div className="w-2 h-2 bg-primary-orange rounded-full mr-2"></div>
                              Technical Process
                            </h4>
                            <ul className="space-y-3 mb-6">
                              {step.details.technicalProcess.map((process, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="w-2 h-2 bg-primary-orange rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span className="text-dark-text">{process}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}

                        {step.details.technicalCapabilities && (
                          <>
                            <h4 className="font-bold text-lg text-primary-orange mb-3 flex items-center">
                              <div className="w-2 h-2 bg-primary-orange rounded-full mr-2"></div>
                              Technical Capabilities
                            </h4>
                            <ul className="space-y-3 mb-6">
                              {step.details.technicalCapabilities.map((capability, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="w-2 h-2 bg-primary-orange rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span className="text-dark-text">{capability}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}

                        {step.details.supportServices && (
                          <>
                            <h4 className="font-bold text-lg text-accent mb-3 flex items-center">
                              <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
                              Support Services
                            </h4>
                            <ul className="space-y-3 mb-6">
                              {step.details.supportServices.map((service, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span className="text-dark-text">{service}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}

                        {step.details.qualityChecks && (
                          <>
                            <h4 className="font-bold text-lg text-secondary mb-3 flex items-center">
                              <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
                              Quality Checks
                            </h4>
                            <ul className="space-y-3 mb-6">
                              {step.details.qualityChecks.map((check, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="w-2 h-2 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span className="text-dark-text">{check}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}

                        {step.details.qualityControls && (
                          <>
                            <h4 className="font-bold text-lg text-secondary mb-3 flex items-center">
                              <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
                              Quality Controls
                            </h4>
                            <ul className="space-y-3 mb-6">
                              {step.details.qualityControls.map((control, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="w-2 h-2 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span className="text-dark-text">{control}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}

                        {step.details.qualityAssurance && (
                          <>
                            <h4 className="font-bold text-lg text-secondary mb-3 flex items-center">
                              <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
                              Quality Assurance
                            </h4>
                            <ul className="space-y-3 mb-6">
                              {step.details.qualityAssurance.map((qa, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="w-2 h-2 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span className="text-dark-text">{qa}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}

                        {step.details.qualityFeatures && (
                          <>
                            <h4 className="font-bold text-lg text-secondary mb-3 flex items-center">
                              <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
                              Quality Features
                            </h4>
                            <ul className="space-y-3 mb-6">
                              {step.details.qualityFeatures.map((feature, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="w-2 h-2 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span className="text-dark-text">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}

                        {step.details.transparency && (
                          <>
                            <h4 className="font-bold text-lg text-primary-blue mb-3 flex items-center">
                              <div className="w-2 h-2 bg-primary-blue rounded-full mr-2"></div>
                              Transparency & Trust
                            </h4>
                            <ul className="space-y-3 mb-6">
                              {step.details.transparency.map((item, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="w-2 h-2 bg-primary-blue rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span className="text-dark-text">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}

                        {step.details.deliverables && (
                          <>
                            <h4 className="font-bold text-lg text-primary-blue mb-3 flex items-center">
                              <div className="w-2 h-2 bg-primary-blue rounded-full mr-2"></div>
                              Deliverables
                            </h4>
                            <ul className="space-y-3 mb-6">
                              {step.details.deliverables.map((deliverable, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="w-2 h-2 bg-primary-blue rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                  <span className="text-dark-text">{deliverable}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}

                        {step.details.timeline && (
                          <div className="mt-6 p-4 bg-neutral-light rounded-lg border border-neutral-light">
                            <h4 className="font-bold text-lg text-primary-blue mb-2">Timeline</h4>
                            <p className="text-dark-text">{step.details.timeline}</p>
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
        <div className="bg-white rounded-dls-lg shadow-lg border border-neutral-light overflow-hidden mb-12">
          <div
            className="p-6 cursor-pointer hover:bg-neutral-light transition-colors flex items-center justify-between"
            onClick={() => setShowPricing(!showPricing)}
          >
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-theme-color mb-2">Pricing & Payment Structure</h3>
              <p className="text-dark-text">Transparent pricing at {pricingInfo.rate} with flexible payment options</p>
            </div>
            {showPricing ? (
              <ChevronUp className="w-6 h-6 text-theme-color" />
            ) : (
              <ChevronDown className="w-6 h-6 text-theme-color" />
            )}
          </div>

          {showPricing && (
            <div className="border-t border-neutral-light p-6 bg-lighter-bg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-lg text-theme-color mb-3">What&#39;s Included</h4>
                  <ul className="space-y-2 mb-6">
                    {pricingInfo.includes.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="w-2 h-2 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-dark-text">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <h4 className="font-bold text-lg text-theme-color mb-3">Additional Costs</h4>
                  <ul className="space-y-2">
                    {pricingInfo.excludes.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="w-2 h-2 bg-primary-orange rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-dark-text">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-lg text-theme-color mb-3">Payment Schedule</h4>
                  <div className="space-y-4">
                    {pricingInfo.paymentStructure.map((payment, idx) => (
                      <div key={idx} className="p-4 bg-neutral-light rounded-lg border border-neutral-light">
                        <p className="text-dark-text font-medium">{payment}</p>
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
          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to Experience Our Process?</h3>
            <p className="text-lg mb-6 opacity-90">
            Visit our factory Monday to Saturday, 10 AM to 6 PM for new designers. Existing customers welcome anytime!
          </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-theme-color hover:bg-gray-100 px-8 py-3 text-lg font-semibold rounded-full shadow-lg transform hover:scale-105 transition-transform">
                Schedule Site Measurement
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-orange-500 px-8 py-3 text-lg font-semibold rounded-full shadow-lg transform hover:scale-105 transition-transform"
              >
                Visit Our Factory
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
