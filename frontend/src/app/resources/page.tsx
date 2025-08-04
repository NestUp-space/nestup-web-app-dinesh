"use client";

import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import BlogResourcesClient from "@/components/resources/BlogResourcesClient";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/landing-page/Navbar";
import { Footer } from "@/components/landing-page/Footer";

export default function ResourcesPage() {
  // Fetch featured posts and regular posts from Strapi
  const { loading: featuredLoading, error: featuredError, data: featuredData } = useBlogPosts({ 
    featured: true, 
    limit: 3 
  });
  
  const { loading: recentLoading, error: recentError, data: recentData } = useBlogPosts({ 
    limit: 9 // Get 9 total, will skip first 3 if they're featured
  });
  
  const { loading: categoriesLoading, data: categoriesData } = useBlogCategories();

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

  // Show error state
  if (featuredError || recentError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
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
