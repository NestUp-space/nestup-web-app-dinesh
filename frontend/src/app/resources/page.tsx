import { getFeaturedPosts, getRecentPosts, getCategoryStats } from "@lib/api";
import BlogResourcesClient from "@/components/resources/BlogResourcesClient";

export default function ResourcesPage() {
  // Get dynamic content from API (server-side)
  const featuredPosts = getFeaturedPosts(3);
  const recentPosts = getRecentPosts(6).slice(3, 6); // Skip featured posts
  const categoryStats = getCategoryStats();

  // Transform posts for display
  const featuredArticles = featuredPosts.map((post, index) => ({
    id: index + 1,
    title: post.title,
    excerpt: post.excerpt || "",
    category: post.category,
    readTime: `${post.readTime || 5} min read`,
    date: post.date,
    author: post.author?.name || "NestUp Team",
    image: post.coverImage || "/placeholder.svg",
    slug: post.slug,
  }));

  const recentArticles = recentPosts.map((post, index) => ({
    id: index + 4,
    title: post.title,
    excerpt: post.excerpt || "",
    category: post.category,
    readTime: `${post.readTime || 5} min read`,
    date: post.date,
    author: post.author?.name || "NestUp Team",
    image: post.coverImage || "/placeholder.svg",
    slug: post.slug,
  }));

  const blogData = {
    featuredArticles,
    recentArticles,
    categoryStats,
  };

  return <BlogResourcesClient blogData={blogData} />;
}
