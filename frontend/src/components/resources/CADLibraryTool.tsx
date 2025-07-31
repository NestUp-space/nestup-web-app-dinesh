"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Layers } from "lucide-react"
import Link from "next/link"

export default function CADLibraryTool() {
  const categories = [
    { name: "Kitchen Cabinets", count: "45 files", format: "DWG, 3DS" },
    { name: "Wardrobes", count: "32 files", format: "DWG, SKP" },
    { name: "Storage Units", count: "28 files", format: "DWG, RVT" },
    { name: "Office Furniture", count: "38 files", format: "DWG, 3DS" },
    { name: "Hardware", count: "156 files", format: "DWG, STEP" },
    { name: "Accessories", count: "24 files", format: "DWG, SKP" },
    { name: "Lighting", count: "18 files", format: "DWG, 3DS" },
    { name: "Handles & Knobs", count: "67 files", format: "DWG, STEP" },
  ]

  const softwareCompatibility = [
    { software: "AutoCAD", formats: "DWG, DXF" },
    { software: "SketchUp", formats: "SKP, 3DS" },
    { software: "Revit", formats: "RVT, RFA" },
    { software: "3ds Max", formats: "3DS, MAX" },
    { software: "SolidWorks", formats: "STEP, IGES" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <Link href="/resources/tools" className="text-orange-500 hover:text-orange-600 flex items-center mb-8">
            ← Back to Resources
          </Link>
        </div>

        <div className="text-center mb-16">
          <div className="bg-orange-500 w-20 h-20 flex items-center justify-center mx-auto mb-6 rounded-none">
            <Download className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-orange-500 mb-6">CAD Library</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access our comprehensive library of CAD blocks, 3D models, and technical drawings for all NestUp modular
            components.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((category, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-0 rounded-none">
              <CardContent className="p-6 text-center">
                <div className="h-32 bg-gray-200 mb-4 flex items-center justify-center">
                  <Layers className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{category.count}</p>
                <p className="text-xs text-orange-500">{category.format}</p>
                <Button size="sm" className="mt-4 bg-orange-500 hover:bg-orange-600 rounded-none">
                  Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white p-12 rounded-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Software Compatibility</h2>
              <div className="space-y-4">
                {softwareCompatibility.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50">
                    <span className="font-medium">{item.software}</span>
                    <span className="text-orange-500">{item.formats}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Download Instructions</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-3 mt-1">
                    1
                  </div>
                  <p className="text-gray-600">Select the category and component you need</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-3 mt-1">
                    2
                  </div>
                  <p className="text-gray-600">Choose your preferred file format</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-3 mt-1">
                    3
                  </div>
                  <p className="text-gray-600">Download and import into your CAD software</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-3 mt-1">
                    4
                  </div>
                  <p className="text-gray-600">Scale and position as needed in your project</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
