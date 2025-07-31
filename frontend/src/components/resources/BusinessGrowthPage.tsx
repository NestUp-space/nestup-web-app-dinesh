"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Calculator, Users } from "lucide-react"
import Link from "next/link"

export default function BusinessGrowthPage() {
  const categories = [
    {
      title: "Marketing Playbook",
      description: "Complete guide to marketing modular interior design services",
      icon: TrendingUp,
      resources: "12 templates",
    },
    {
      title: "Pricing Strategies",
      description: "Optimize your pricing for profitability and competitiveness",
      icon: Calculator,
      resources: "5 calculators",
    },
    {
      title: "Partnership Development",
      description: "Build strategic partnerships with suppliers and contractors",
      icon: Users,
      resources: "8 guides",
    },
  ]

  const successStories = [
    {
      name: "Studio Design Co.",
      growth: "300% revenue increase",
      description: "How they positioned modular as their competitive advantage",
    },
    {
      name: "Modern Interiors",
      growth: "50% faster project delivery",
      description: "Streamlined workflow with modular solutions",
    },
  ]

  const businessResources = [
    "ROI Calculator for Modular Projects",
    "Client Proposal Templates",
    "Competitive Analysis Framework",
    "Digital Marketing Checklist",
    "Partnership Agreement Templates",
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
            <TrendingUp className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-orange-500 mb-6">Business Growth</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Scale your interior design business with proven marketing strategies, pricing optimization, and
            partnership development focused on modular solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {categories.map((category, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow border-0 rounded-none">
              <CardContent className="p-8">
                <div className="bg-orange-500 w-16 h-16 flex items-center justify-center mx-auto mb-4 rounded-none">
                  <category.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{category.title}</h3>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <Badge className="mb-4 bg-orange-100 text-orange-600 rounded-none">{category.resources}</Badge>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 rounded-none">Explore</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white p-12 rounded-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Success Stories</h2>
              <div className="space-y-6">
                {successStories.map((story, index) => (
                  <Card key={index} className="p-6 border-0 rounded-none">
                    <h3 className="font-semibold text-gray-900">{story.name}</h3>
                    <p className="text-orange-500 font-medium">{story.growth}</p>
                    <p className="text-gray-600 text-sm">{story.description}</p>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Resources</h2>
              <div className="space-y-4">
                {businessResources.map((resource, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50">
                    <span className="font-medium">{resource}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-none border-orange-500 text-orange-500 bg-transparent"
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
