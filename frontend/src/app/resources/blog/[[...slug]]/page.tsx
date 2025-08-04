"use client";

import { notFound, useParams } from "next/navigation";
import { usePost } from "@/hooks/usePost";
import Container from "@components/landing-page/container";
import BlogHeader from "@components/landing-page/blogHeader";
import { PostBody } from "@components/landing-page/post-body";
import { PostHeader } from "@components/landing-page/post-header";
import { Skeleton } from "@/components/ui/skeleton";
import RichTextRenderer from "@/components/RichTextRenderer";

export default function Post() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug.join("/") : params.slug;
  const { loading, error, data } = usePost(slug || "");

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

  if (error || !data || !data.blogPosts?.data?.length) {
    return notFound();
  }

  const post = data.blogPosts.data[0].attributes;

  return (
    <main>
      <Container>
        <BlogHeader />
        <article className="mb-32">
          <PostHeader
            title={post.title}
            coverImage={post.featuredImage?.data?.attributes?.url || ""}
            date={post.publishedAt}
            author={{ name: post.author?.name || "Nestup", picture: post.author?.picture?.data?.attributes?.url || "" }}
          />
          <div className="max-w-2xl mx-auto">
            <RichTextRenderer content={post.content} />
          </div>
        </article>
      </Container>
    </main>
  );
}
