"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/dashboard/input";
import Navbar from "@/components/landing-page/Navbar";
import {
  Calendar,
  Clock,
  User,
  ArrowRight,
  BookOpen,
  Wrench,
  TrendingUp,
  Users,
  Lightbulb,
  Download,
  Calculator,
  FileText,
  Layers,
} from "lucide-react";
import Image from "next/image";
import { Footer } from "@/components/landing-page/Footer";
import Link from "next/link";

interface BlogData {
  featuredArticles: any[];
  recentArticles: any[];
  categoryStats: Record<string, number>;
}

interface BlogResourcesClientProps {
  blogData: BlogData;
}

export default function BlogResourcesClient({ blogData }: BlogResourcesClientProps) {
  const [currentPage, setCurrentPage] = useState("blog");
  const { featuredArticles, recentArticles, categoryStats } = blogData;

  const contentPillars = [
    {
      icon: Wrench,
      title: "Technical Mastery",
      description: "Material specifications, construction methods, and quality assurance",
      count: `${categoryStats["Technical Mastery"] || 0} articles`,
      categorySlug: "technical-mastery",
    },
    {
      icon: BookOpen,
      title: "Design Workflow",
      description: "Software integration, 3D rendering, and CAD resources",
      count: `${categoryStats["Design Workflow"] || 0} articles`,
      categorySlug: "design-workflow",
    },
    {
      icon: Users,
      title: "Project Management",
      description: "Client collaboration, timelines, and installation guides",
      count: `${categoryStats["Project Management"] || 0} articles`,
      categorySlug: "project-management",
    },
    {
      icon: TrendingUp,
      title: "Business Growth",
      description: "Marketing strategies, pricing guides, and partnerships",
      count: `${categoryStats["Business Growth"] || 0} articles`,
      categorySlug: "business-growth",
    },
    {
      icon: Lightbulb,
      title: "Case Studies",
      description: "Real project examples and success stories",
      count: `${categoryStats["Case Studies"] || 0} articles`,
      categorySlug: "case-studies",
    },
  ];

  if (currentPage === "blog") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        {/* Hero Section */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-orange-500 mb-4">Blog.</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                {`Your comprehensive resource hub for modular interior design. From technical specifications to business
              growth strategies, we're here to help interior designers succeed with modular solutions.`}
              </p>
            </div>
          </div>
        </section>

        {/* Content Pillars */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Discover Our Expertise Areas</h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Comprehensive resources organized by specialty to help you excel in every aspect of modular interior
              design
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {contentPillars.map((pillar, index) => (
                <Link key={index} href={`/resources/blog/category/${pillar.categorySlug}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 rounded-none">
                    <CardContent className="p-6 text-center">
                      <pillar.icon className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                      <h3 className="font-semibold text-gray-900 mb-2">{pillar.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{pillar.description}</p>
                      <Badge variant="secondary" className="text-xs rounded-none">
                        {pillar.count}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Articles */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Featured Articles</h2>
              <Link href="/resources/blog/all">
                <Button
                  variant="outline"
                  className="text-orange-500 border-orange-500 hover:bg-orange-50 bg-transparent rounded-none"
                >
                  View All Articles <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {featuredArticles.map((article) => (
                <Link key={article.id} href={`/resources/blog/${article.slug}`}>
                  <Card
                    className="overflow-hidden hover:shadow-xl transition-shadow border-0 rounded-none"
                  >
                    <div className="relative">
                      <Image
                        src={article.image || "/placeholder.svg"}
                        alt={article.title}
                        width={500}
                        height={300}
                        className="w-full h-48 object-cover"
                      />
                      <Badge className="absolute top-4 left-4 bg-orange-500 rounded-none">{article.category}</Badge>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">{article.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">{article.excerpt}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {article.date}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {article.readTime}
                          </span>
                        </div>
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {article.author}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Tools Section */}
        <section className="py-16 bg-orange-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Interactive Design Tools</h2>
              <p className="text-lg text-gray-600">
                Streamline your workflow with our professional tools and resources
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Link href="/resources/material-configurator">
                <Card className="text-center hover:shadow-lg transition-shadow border-0 rounded-none cursor-pointer">
                  <CardContent className="p-8">
                    <div className="bg-orange-500 w-16 h-16 flex items-center justify-center mx-auto mb-4 rounded-none">
                      <Wrench className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Material Configurator</h3>
                    <p className="text-gray-600 mb-6">
                      Visualize NestUp components with different finishes and materials in real-time.
                    </p>
                    <Button className="bg-orange-500 hover:bg-orange-600 rounded-none">Launch Tool</Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/resources/cost-calculator">
                <Card className="text-center hover:shadow-lg transition-shadow border-0 rounded-none cursor-pointer">
                  <CardContent className="p-8">
                    <div className="bg-orange-500 w-16 h-16 flex items-center justify-center mx-auto mb-4 rounded-none">
                      <Calculator className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Project Cost Calculator</h3>
                    <p className="text-gray-600 mb-6">
                      Get accurate cost estimates for your modular interior design projects.
                    </p>
                    <Button className="bg-orange-500 hover:bg-orange-600 rounded-none">Calculate Now</Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/resources/cad-library">
                <Card className="text-center hover:shadow-lg transition-shadow border-0 rounded-none cursor-pointer">
                  <CardContent className="p-8">
                    <div className="bg-orange-500 w-16 h-16 flex items-center justify-center mx-auto mb-4 rounded-none">
                      <Download className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Resource Library</h3>
                    <p className="text-gray-600 mb-6">
                      Access CAD blocks, templates, and specification sheets for your projects.
                    </p>
                    <Button className="bg-orange-500 hover:bg-orange-600 rounded-none">Browse Resources</Button>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* Recent Articles */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">Recent Articles</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentArticles.map((article) => (
                <Link key={article.id} href={`/resources/blog/${article.slug}`}>
                  <Card
                    className="overflow-hidden hover:shadow-lg transition-shadow border-0 rounded-none"
                  >
                    <Image
                      src={article.image || "/placeholder.svg"}
                      alt={article.title}
                      width={300}
                      height={200}
                      className="w-full h-40 object-cover"
                    />
                    <CardContent className="p-6">
                      <Badge variant="outline" className="mb-3 text-orange-600 border-orange-200 rounded-none">
                        {article.category}
                      </Badge>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{article.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{article.excerpt}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {article.readTime}
                        </span>
                        <span>{article.date}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-16 bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Stay Updated with Industry Insights</h2>
            <p className="text-xl text-gray-300 mb-8">
              Get the latest articles, resources, and industry trends delivered to your inbox weekly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input placeholder="Enter your email address" className="flex-1 bg-white rounded-none" />
              <Button className="bg-orange-500 hover:bg-orange-600 px-8 rounded-none">Subscribe</Button>
            </div>

            <p className="text-sm text-gray-400 mt-4">
              Join 1,000+ interior designers who trust NestUp for industry insights.
            </p>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // Return null for other pages for now - these would be separate components in a full implementation
  return null;
}
