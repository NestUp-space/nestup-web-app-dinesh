"use client";

import { notFound, useParams } from "next/navigation";
import { useBlogPost } from "../../../../hooks/useBlogPost";
import Container from "@components/landing-page/container";
import BlogHeader from "@components/landing-page/blogHeader";
import { Skeleton } from "../../../../components/ui/skeleton";
import { Badge } from "../../../../components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";
import Image from "next/image";
import RichTextRenderer from "../../../../components/RichTextRenderer";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { loading, error, data } = useBlogPost(slug);

  if (!slug) {
    return notFound();
  }

  if (loading) {
    return (
      <main>
        <Container>
          <BlogHeader />
          <article className="mb-32">
            <Skeleton className="h-12 w-2/3 mb-4" />
            <Skeleton className="h-6 w-1/3 mb-8" />
            <Skeleton className="h-96 w-full" />
          </article>
        </Container>
      </main>
    );
  }

  if (error || !data?.blogPosts[0]) {
    return notFound();
  }

  const post = data.blogPosts[0];


  return (
    <main>
      <Container>
        <BlogHeader />
        <article className="mb-32">
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mb-8">
              <Image
                src={post.featuredImage.url}
                alt={post.featuredImage.alternativeText || post.title}
                width={1200}
                height={600}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Category Badge */}
          {post.category && (
            <div className="mb-4">
              <Badge 
                style={{ backgroundColor: post.category.color }}
                className="text-white"
              >
                {post.category.name}
              </Badge>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl font-bold mb-6 text-gray-900">
            {post.title}
          </h1>

          {/* Meta Information */}
          <div className="flex items-center gap-6 mb-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readTime} min read</span>
            </div>
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <div className="text-xl text-gray-600 mb-8 italic border-l-4 border-orange-500 pl-4">
              {post.excerpt}
            </div>
          )}

          {/* Content */}
          <RichTextRenderer content={post.content} />

          {/* Project Details (for case studies) */}
          {post.projectDetails && (
            <div className="mt-12 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Project Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {post.projectDetails.client && (
                  <div>
                    <strong>Client:</strong> {post.projectDetails.client}
                  </div>
                )}
                {post.projectDetails.location && (
                  <div>
                    <strong>Location:</strong> {post.projectDetails.location}
                  </div>
                )}
                {post.projectDetails.duration && (
                  <div>
                    <strong>Duration:</strong> {post.projectDetails.duration}
                  </div>
                )}
                {post.projectDetails.projectValue && (
                  <div>
                    <strong>Project Value:</strong> {post.projectDetails.projectValue}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-8">
              <h4 className="font-semibold mb-3">Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {post.cta && (
            <div className="mt-12 p-6 bg-orange-50 rounded-lg text-center">
              <p className="text-lg font-medium text-orange-800">{post.cta}</p>
            </div>
          )}

          {/* Related Posts */}
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <div className="mt-16">
              <h3 className="text-2xl font-bold mb-8">Related Posts</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {post.relatedPosts.map((relatedPost) => (
                  <div key={relatedPost.documentId} className="border rounded-lg p-4">
                    {relatedPost.featuredImage && (
                      <Image
                        src={relatedPost.featuredImage.url}
                        alt={relatedPost.featuredImage.alternativeText || relatedPost.title}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover rounded mb-4"
                      />
                    )}
                    <h4 className="font-semibold mb-2">
                      <a 
                        href={`/resources/blog/${relatedPost.slug}`}
                        className="hover:text-orange-600"
                      >
                        {relatedPost.title}
                      </a>
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {relatedPost.excerpt}
                    </p>
                    <div className="text-xs text-gray-500">
                      {relatedPost.readTime} min read
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </Container>
    </main>
  );
}
