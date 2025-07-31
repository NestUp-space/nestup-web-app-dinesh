"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Download, Layers } from "lucide-react"
import Link from "next/link"

export default function DesignWorkflowPage() {
  const softwareIntegrations = [
    "SketchUp Component Library",
    "AutoCAD Block Integration",
    "Revit Family Files",
    "3ds Max Material Libraries",
  ]

  const renderingResources = [
    "High-Resolution Texture Packs",
    "Lighting Setup Guides",
    "Material Property Settings",
    "Scene Composition Templates",
  ]

  const resources = [
    {
      title: "SketchUp Integration Tutorial",
      description: "Complete step-by-step guide to importing and using NestUp components",
      duration: "Video: 25 min",
    },
    {
      title: "Photorealistic Rendering Guide",
      description: "Master lighting and materials for stunning project presentations",
      duration: "Tutorial: 18 min",
    },
    {
      title: "CAD Workflow Optimization",
      description: "Streamline your drafting process with modular-specific techniques",
      duration: "Guide: 12 min",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <Link href="/resources/blog" className="text-orange-500 hover:text-orange-600 flex items-center mb-8">
            ← Back to Blog
          </Link>
        </div>

        <div className="text-center mb-16">
          <div className="bg-orange-500 w-20 h-20 flex items-center justify-center mx-auto mb-6 rounded-none">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-orange-500 mb-6">Design Workflow</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your design process with software integrations, 3D rendering techniques, and CAD resources
            specifically optimized for modular solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Software Integration</h2>
            <div className="space-y-4">
              {softwareIntegrations.map((item, index) => (
                <Card key={index} className="p-4 border-0 rounded-none hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <Download className="h-5 w-5 text-orange-500 mr-3" />
                    <span className="font-medium">{item}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Rendering Resources</h2>
            <div className="space-y-4">
              {renderingResources.map((item, index) => (
                <Card key={index} className="p-4 border-0 rounded-none hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <Layers className="h-5 w-5 text-orange-500 mr-3" />
                    <span className="font-medium">{item}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {resources.map((resource, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-0 rounded-none">
              <div className="h-48 bg-gray-200"></div>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h3>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-orange-500">{resource.duration}</span>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 rounded-none">
                    Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
