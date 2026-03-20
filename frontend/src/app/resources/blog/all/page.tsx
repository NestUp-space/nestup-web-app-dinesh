"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Clock, User, Calendar } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { Skeleton } from "@/components/ui/skeleton";

export default function AllPosts() {
  const { loading, error, data } = useBlogPosts({ limit: 50 }); // Show more posts on this page

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-5xl font-bold text-orange-500 mb-12 text-center">All Articles</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-0 rounded-none">
                <Skeleton className="h-40 w-full" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-20 mb-3" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-5xl font-bold text-orange-500 mb-12 text-center">All Articles</h1>
          <div className="text-center text-red-500">
            <p>Failed to load blog posts. Please try again later.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const posts = data?.blogPosts || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-5xl font-bold text-orange-500 mb-12 text-center">All Articles</h1>
        
        {posts.length === 0 ? (
          <div className="text-center text-gray-500">
            <p>No blog posts available yet. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center text-gray-600">
              {data?.blogPosts && (
                <p>Showing {posts.length} of {data.blogPosts.length} articles</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link key={post.documentId} href={`/resources/blog/${post.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow border-0 rounded-none">
                    {post.featuredImage?.url ? (
                      <Image
                        src={post.featuredImage.url}
                        alt={post.featuredImage.alternativeText || post.title}
                        width={300}
                        height={200}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">No image</span>
                      </div>
                    )}
                    
                    <CardContent className="p-6">
                      {/* Category Badge */}
                      {post.category && (
                        <Badge 
                          variant="outline" 
                          className="mb-3 text-white border-0 rounded-none"
                          style={{ backgroundColor: post.category.color }}
                        >
                          {post.category.name}
                        </Badge>
                      )}
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {post.excerpt || "No excerpt available"}
                      </p>
                      
                      {/* Meta Information */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {post.readTime || 5} min read
                        </span>
                        
                        <div className="flex items-center space-x-3">
                          {post.author?.name && (
                            <span className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {post.author.name}
                            </span>
                          )}
                          
                          {post.publishedAt && (
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(post.publishedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
