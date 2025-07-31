"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Wrench, Calculator, Download, FileText, Lightbulb } from "lucide-react"
import Link from "next/link"

export default function ResourcesHubPage() {
  const resources = [
    {
      title: "Material Configurator",
      description: "Interactive tool to visualize components with different finishes",
      icon: Wrench,
      page: "/resources/tools/material-configurator",
    },
    {
      title: "Cost Calculator",
      description: "Accurate project cost estimation tool",
      icon: Calculator,
      page: "/resources/tools/cost-calculator",
    },
    {
      title: "CAD Library",
      description: "Downloadable CAD blocks and 3D models",
      icon: Download,
      page: "/resources/tools/cad-library",
    },
    {
      title: "Templates",
      description: "Project templates and documentation",
      icon: FileText,
      page: "/resources/tools/templates",
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
            <Lightbulb className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-orange-500 mb-6">Resources</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access our comprehensive library of tools, templates, and resources designed to streamline your modular
            interior design workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {resources.map((resource, index) => (
            <Link href={resource.page} key={index}>
              <Card className="text-center hover:shadow-lg transition-shadow border-0 rounded-none cursor-pointer">
                <CardContent className="p-8">
                  <div className="bg-orange-500 w-16 h-16 flex items-center justify-center mx-auto mb-4 rounded-none">
                    <resource.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{resource.title}</h3>
                  <p className="text-gray-600 mb-6">{resource.description}</p>
                  <Button className="bg-orange-500 hover:bg-orange-600 rounded-none">Access Tool</Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
