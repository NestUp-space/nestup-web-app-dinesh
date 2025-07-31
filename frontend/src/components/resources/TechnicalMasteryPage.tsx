"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wrench, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function TechnicalMasteryPage() {
  const articles = [
    {
      title: "Material Specifications Deep Dive",
      description: "Complete guide to wood types, laminates, and hardware specifications",
      readTime: "12 min read",
      category: "Materials",
    },
    {
      title: "Quality Assurance Processes",
      description: "Inside look at our factory QC procedures and precision standards",
      readTime: "8 min read",
      category: "Quality",
    },
    {
      title: "Construction Methods Explained",
      description: "Technical breakdown of joinery techniques and assembly processes",
      readTime: "15 min read",
      category: "Construction",
    },
    {
      title: "Sustainability Certifications",
      description: "Environmental standards and eco-friendly manufacturing practices",
      readTime: "10 min read",
      category: "Sustainability",
    },
    {
      title: "Precision Measurement Techniques",
      description: "Advanced methods for accurate site measurements and documentation",
      readTime: "9 min read",
      category: "Measurement",
    },
    {
      title: "Hardware Selection Guide",
      description: "Choosing the right hardware for durability and functionality",
      readTime: "7 min read",
      category: "Hardware",
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
            <Wrench className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-orange-500 mb-6">Technical Mastery</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Master the technical aspects of modular interior design with comprehensive guides on materials,
            construction methods, and quality assurance processes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {articles.map((article, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-0 rounded-none">
              <div className="h-48 bg-gray-200"></div>
              <CardContent className="p-6">
                <Badge className="mb-3 bg-orange-500 rounded-none">{article.category}</Badge>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
                <p className="text-gray-600 mb-4">{article.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {article.readTime}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white p-12 text-center rounded-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Technical Support?</h2>
          <p className="text-gray-600 mb-6">
            Our technical team is here to help with specifications, materials, and construction questions.
          </p>
          <Button className="bg-orange-500 hover:bg-orange-600 rounded-none">Contact Technical Team</Button>
        </div>
      </main>
    </div>
  )
}
