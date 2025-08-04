"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Wrench, Calculator, Download, FileText } from "lucide-react"
import Link from "next/link"
import { usePosts } from "@/hooks/usePosts"
import { Skeleton } from "@/components/ui/skeleton"
import { ResourcesHeroSection } from "./ResourcesHeroSection"

export default function ResourcesHubPage() {
  const { loading, error, data } = usePosts()
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

        <ResourcesHeroSection />

        {/* Blog Posts Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-0 rounded-none">
                <CardContent className="p-6">
                  <Skeleton className="h-48 w-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="mb-16 text-center text-red-500">
            Failed to load blog posts. Please try again later.
          </div>
        ) : data?.blogPosts?.data?.length ? (
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Latest Blog Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.blogPosts.data.map((post) => (
                <Link href={`/resources/blog/${post.attributes.slug}`} key={post.id}>
                  <Card className="border-0 rounded-none hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      {/* Featured Image */}
                      {post.attributes.featuredImage?.data && (
                        <div className="mb-4">
                          <img
                            src={post.attributes.featuredImage.data.attributes.url}
                            alt={post.attributes.featuredImage.data.attributes.alternativeText || post.attributes.title}
                            className="w-full h-48 object-cover rounded"
                          />
                        </div>
                      )}
                      
                      {/* Category Badge */}
                      {post.attributes.category?.data && (
                        <div className="mb-3">
                          <span 
                            className="inline-block px-3 py-1 text-xs font-semibold text-white rounded-full"
                            style={{ backgroundColor: post.attributes.category.data.attributes.color }}
                          >
                            {post.attributes.category.data.attributes.name}
                          </span>
                        </div>
                      )}
                      
                      <h3 className="text-xl font-semibold mb-2">{post.attributes.title}</h3>
                      <p className="text-gray-600 line-clamp-3 mb-4">
                        {post.attributes.excerpt || 'No excerpt available'}
                      </p>
                      
                      {/* Meta Information */}
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span>{post.attributes.author?.name || 'NestUp Team'}</span>
                        <span className="mx-2">•</span>
                        <span>{post.attributes.readTime || 5} min read</span>
                        {post.attributes.publishedAt && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{new Date(post.attributes.publishedAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                      
                      <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50 rounded-none">
                        Read More
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            
            {/* Show total count if available */}
            {data.blogPosts.meta?.pagination?.total > data.blogPosts.data.length && (
              <div className="text-center mt-8">
                <Link href="/resources/blog">
                  <Button className="bg-orange-500 hover:bg-orange-600 rounded-none">
                    View All {data.blogPosts.meta.pagination.total} Posts
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : null}

        {/* Resources Tools Section */}
        <h2 className="text-3xl font-bold mb-8">Tools & Resources</h2>
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
