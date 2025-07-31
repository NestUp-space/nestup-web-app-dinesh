"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Wrench } from "lucide-react"
import Link from "next/link"

export default function MaterialConfiguratorTool() {
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
            <Wrench className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-orange-500 mb-6">Material Configurator</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Visualize NestUp components with different finishes and materials in real-time. Perfect for client
            presentations and design exploration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border-0 rounded-none">
              <CardContent className="p-8">
                <div className="bg-gray-200 h-96 flex items-center justify-center mb-6">
                  <p className="text-gray-500 text-lg">3D Configurator Interface</p>
                </div>
                <div className="flex justify-center space-x-4">
                  <Button className="bg-orange-500 hover:bg-orange-600 rounded-none">Reset View</Button>
                  <Button variant="outline" className="rounded-none border-orange-500 text-orange-500 bg-transparent">
                    Save Configuration
                  </Button>
                  <Button variant="outline" className="rounded-none border-orange-500 text-orange-500 bg-transparent">
                    Export Image
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-0 rounded-none">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Material Options</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Wood Type</label>
                    <select className="w-full p-2 border border-gray-300 rounded-none">
                      <option>Oak</option>
                      <option>Maple</option>
                      <option>Walnut</option>
                      <option>Cherry</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Finish</label>
                    <select className="w-full p-2 border border-gray-300 rounded-none">
                      <option>Natural</option>
                      <option>Stained</option>
                      <option>Painted</option>
                      <option>Laminate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Hardware</label>
                    <select className="w-full p-2 border border-gray-300 rounded-none">
                      <option>Brushed Steel</option>
                      <option>Matte Black</option>
                      <option>Brass</option>
                      <option>Chrome</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 rounded-none mt-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Configuration Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Material:</span>
                    <span className="font-medium">Oak Natural</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dimensions:</span>
                    <span className="font-medium">120 x 80 x 40 cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Cost:</span>
                    <span className="font-medium text-orange-500">₹45,000</span>
                  </div>
                </div>
                <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 rounded-none">Request Quote</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
