"use client";

import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import BlogResourcesClient from "@/components/resources/BlogResourcesClient";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ResourcesHeroSection } from "@/components/resources/ResourcesHeroSection";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Calculator, Download } from "lucide-react";

export default function ResourcesPage() {
  // Fetch featured posts and regular posts from Strapi
  const { loading: featuredLoading, error: featuredError, data: featuredData } = useBlogPosts({ 
    featured: true, 
    limit: 3 
  });
  
  const { loading: recentLoading, error: recentError, data: recentData } = useBlogPosts({ 
    limit: 9 // Get 9 total, will skip first 3 if they're featured
  });
  
  const { loading: categoriesLoading, error: categoriesError, data: categoriesData } = useBlogCategories();

  // Show loading state
  if (featuredLoading || recentLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-6">
                <Skeleton className="h-48 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show error state for blog content
  const blogError = featuredError || recentError || categoriesError;
  if (blogError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <ResourcesHeroSection />
        
        {/* Show tools section even when blog fails */}
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

        {/* Blog error message */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-orange-500 mb-4">Blog.</h1>
            <p className="text-red-500 mb-8">
              Failed to load blog content. Please try again later.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Transform Strapi data for BlogResourcesClient
  const featuredPosts = featuredData?.blogPosts || [];
  const allPosts = recentData?.blogPosts || [];
  const categories = categoriesData?.blogCategories || [];

  // Get recent posts (exclude featured posts to avoid duplicates)
  const featuredSlugs = featuredPosts.map(post => post.slug);
  const recentPosts = allPosts
    .filter(post => !featuredSlugs.includes(post.slug))
    .slice(0, 3);

  // Transform featured articles
  const featuredArticles = featuredPosts.map((post) => ({
    id: post.documentId,
    title: post.title,
    excerpt: post.excerpt || "No excerpt available",
    category: post.category?.name || "General",
    readTime: `${post.readTime || 5} min read`,
    date: post.publishedAt ? 
      new Date(post.publishedAt).toLocaleDateString() : 
      new Date().toLocaleDateString(),
    author: post.author?.name || "NestUp Team",
    image: post.featuredImage?.url || "/placeholder.svg",
    slug: post.slug,
  }));

  // Transform recent articles
  const recentArticles = recentPosts.map((post) => ({
    id: post.documentId,
    title: post.title,
    excerpt: post.excerpt || "No excerpt available",
    category: post.category?.name || "General",
    readTime: `${post.readTime || 5} min read`,
    date: post.publishedAt ? 
      new Date(post.publishedAt).toLocaleDateString() : 
      new Date().toLocaleDateString(),
    author: post.author?.name || "NestUp Team",
    image: post.featuredImage?.url || "/placeholder.svg",
    slug: post.slug,
  }));

  // Create category stats (count posts per category)
  const categoryStats: Record<string, number> = {};
  categories.forEach((category: any) => {
    const categoryName = category.name;
    // Count posts in this category
    const postCount = allPosts.filter(post => 
      post.category?.name === categoryName
    ).length;
    categoryStats[categoryName] = postCount;
  });

  const blogData = {
    featuredArticles,
    recentArticles,
    categoryStats,
  };

  return <BlogResourcesClient blogData={blogData} />;
}
