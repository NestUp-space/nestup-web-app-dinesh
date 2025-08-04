"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/dashboard/input"
import { Calculator } from "lucide-react"
import Link from "next/link"

export default function CostCalculatorTool() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <Link href="/resources" className="text-orange-500 hover:text-orange-600 flex items-center mb-8">
            ← Back to Resources
          </Link>
        </div>

        <div className="text-center mb-16">
          <div className="bg-orange-500 w-20 h-20 flex items-center justify-center mx-auto mb-6 rounded-none">
            <Calculator className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-orange-500 mb-6">Project Cost Calculator</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get accurate cost estimates for your modular interior design projects. Input your specifications and
            receive detailed pricing breakdowns.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-0 rounded-none">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Details</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Type</label>
                  <select className="w-full p-3 border border-gray-300 rounded-none">
                    <option>Kitchen</option>
                    <option>Wardrobe</option>
                    <option>Living Room</option>
                    <option>Office</option>
                    <option>Complete Home</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Area (sq ft)</label>
                  <Input placeholder="Enter area in square feet" className="rounded-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Material Grade</label>
                  <select className="w-full p-3 border border-gray-300 rounded-none">
                    <option>Premium</option>
                    <option>Standard</option>
                    <option>Economy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Finish Type</label>
                  <select className="w-full p-3 border border-gray-300 rounded-none">
                    <option>Laminate</option>
                    <option>Veneer</option>
                    <option>Paint</option>
                    <option>Lacquer</option>
                  </select>
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 rounded-none">Calculate Cost</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 rounded-none">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Cost Breakdown</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50">
                  <span>Materials</span>
                  <span className="font-semibold">₹85,000</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50">
                  <span>Hardware</span>
                  <span className="font-semibold">₹15,000</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50">
                  <span>Installation</span>
                  <span className="font-semibold">₹25,000</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50">
                  <span>Design & Planning</span>
                  <span className="font-semibold">₹10,000</span>
                </div>
                <div className="border-t-2 border-orange-500 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total Estimated Cost</span>
                    <span className="text-2xl font-bold text-orange-500">₹1,35,000</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 p-4 bg-orange-50">
                <p className="text-sm text-gray-600 mb-4">
                  This is an estimated cost based on standard specifications. Final pricing may vary based on specific
                  requirements and site conditions.
                </p>
                <Button className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-none">
                  Get Detailed Quote
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
