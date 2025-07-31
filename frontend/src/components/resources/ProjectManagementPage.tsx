"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, FileText } from "lucide-react"
import Link from "next/link"

export default function ProjectManagementPage() {
  const projectTimelineTemplates = [
    { phase: "Discovery & Planning", duration: "Week 1-2" },
    { phase: "Design Development", duration: "Week 3-4" },
    { phase: "Manufacturing", duration: "Week 5-8" },
    { phase: "Installation", duration: "Week 9-10" },
  ]

  const clientCommunicationTools = [
    "Project Status Dashboard",
    "Client Approval Forms",
    "Change Request Templates",
    "Installation Checklists",
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
            <Users className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-orange-500 mb-6">Project Management</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Master the art of managing modular interior projects with proven strategies for client collaboration,
            timeline management, and seamless installation coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <Card className="p-8 border-0 rounded-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Timeline Templates</h2>
            <div className="space-y-4">
              {projectTimelineTemplates.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50">
                  <span className="font-medium">{item.phase}</span>
                  <span className="text-orange-500">{item.duration}</span>
                </div>
              ))}
            </div>
            <Button className="w-full mt-6 bg-orange-500 hover:bg-orange-600 rounded-none">Download Template</Button>
          </Card>

          <Card className="p-8 border-0 rounded-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Client Communication Tools</h2>
            <div className="space-y-4">
              {clientCommunicationTools.map((tool, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50">
                  <FileText className="h-5 w-5 text-orange-500 mr-3" />
                  <span className="font-medium">{tool}</span>
                </div>
              ))}
            </div>
            <Button className="w-full mt-6 bg-orange-500 hover:bg-orange-600 rounded-none">Access Tools</Button>
          </Card>
        </div>

        <div className="bg-white p-12 text-center rounded-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Master Class: Project Management</h2>
          <p className="text-gray-600 mb-6">
            Join our comprehensive course on managing modular interior projects from start to finish.
          </p>
          <Button className="bg-gray-800 hover:bg-gray-900 text-white rounded-none">Enroll Now</Button>
        </div>
      </main>
    </div>
  )
}
