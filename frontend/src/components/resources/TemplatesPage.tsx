"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import Link from "next/link"

export default function TemplatesPage() {
  const templates = [
    {
      title: "Project Proposal Template",
      description: "Comprehensive proposal template for modular interior projects",
      type: "Document",
      format: "DOCX, PDF",
    },
    {
      title: "Client Brief Questionnaire",
      description: "Structured questionnaire to capture client requirements",
      type: "Form",
      format: "PDF, DOCX",
    },
    {
      title: "Material Specification Sheet",
      description: "Detailed specification template for materials and finishes",
      type: "Specification",
      format: "XLSX, PDF",
    },
    {
      title: "Project Timeline Template",
      description: "Gantt chart template for modular project scheduling",
      type: "Schedule",
      format: "XLSX, MPP",
    },
    {
      title: "Installation Checklist",
      description: "Step-by-step checklist for modular component installation",
      type: "Checklist",
      format: "PDF, DOCX",
    },
    {
      title: "Quality Control Form",
      description: "QC inspection form for modular installations",
      type: "Form",
      format: "PDF, DOCX",
    },
    {
      title: "Client Handover Document",
      description: "Complete handover documentation template",
      type: "Document",
      format: "DOCX, PDF",
    },
    {
      title: "Maintenance Guide Template",
      description: "Care and maintenance instructions for clients",
      type: "Guide",
      format: "PDF, DOCX",
    },
    {
      title: "Change Request Form",
      description: "Structured form for handling project modifications",
      type: "Form",
      format: "PDF, DOCX",
    },
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
            <FileText className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-orange-500 mb-6">Templates</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional templates and documentation to streamline your project workflow and client communication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-0 rounded-none">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 mb-4 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <Badge className="mb-3 bg-orange-100 text-orange-600 rounded-none">{template.type}</Badge>
                <h3 className="font-semibold text-gray-900 mb-2">{template.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                <p className="text-xs text-orange-500 mb-4">{template.format}</p>
                <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 rounded-none">
                  Download Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white p-12 mt-16 rounded-none">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Custom Template Request</h2>
            <p className="text-gray-600 mb-6">
              Need a specific template for your workflow? Our team can create custom templates tailored to your
              business needs.
            </p>
            <Button className="bg-gray-800 hover:bg-gray-900 text-white rounded-none">Request Custom Template</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
