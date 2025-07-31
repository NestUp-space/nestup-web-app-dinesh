import { Post } from "@lib/post";
import fs from "fs";
import matter from "gray-matter";
import { join } from "path";
import { readdirSync, readFileSync } from "fs";

const postsDirectory = join(process.cwd(), "./src/app/resources/blog/posts");

// Unified category mapping from directory slugs to display names and route slugs
export const categoryMap: Record<string, { displayName: string; routeSlug: string }> = {
  "business-marketing": { displayName: "Business Growth", routeSlug: "business-growth" },
  "case-studies": { displayName: "Case Studies", routeSlug: "case-studies" },
  "design-trends-inspiration": { displayName: "Design Trends", routeSlug: "design-trends" },
  "how-to-technical": { displayName: "Technical Mastery", routeSlug: "technical-mastery" },
  "tech-tools-workflow": { displayName: "Design Workflow", routeSlug: "design-workflow" },
  "sustainability-materials": { displayName: "Sustainability", routeSlug: "sustainability" },
  // Add more mappings as needed
};

// Calculate reading time based on content
function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Get category display name and route slug from the file path
function getCategoryInfoFromPath(filePath: string): { displayName: string; routeSlug: string } {
  const relativePath = filePath.replace(postsDirectory + "/", "");
  const parts = relativePath.split("/");
  
  // If the post is directly in the posts directory (e.g., posts/my-post.md)
  if (parts.length === 1) {
    return { displayName: "Uncategorized", routeSlug: "uncategorized" };
  }

  // If the post is in a category subdirectory (e.g., posts/category-slug/my-post.md)
  const directorySlug = parts[0];
  const category = categoryMap[directorySlug];
  
  if (category) {
    return category;
  }

  // Fallback for unknown categories or direct posts
  return { displayName: "Uncategorized", routeSlug: "uncategorized" };
}

// Recursively get all markdown files in a directory
function getMarkdownFiles(dir: string, fileList: string[] = []) {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getMarkdownFiles(filePath, fileList);
    } else if (file.endsWith(".md")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

export function getPostSlugs() {
  const markdownFiles = getMarkdownFiles(postsDirectory);
  // Convert absolute paths to slugs relative to postsDirectory, including subdirectories
  return markdownFiles.map((file) =>
    file.replace(postsDirectory + "/", "").replace(/\.md$/, "")
  );
}

export function getPostBySlug(slug: string): Post {
  // The slug can now be hierarchical (e.g., "case-studies/luxury-apartment-transformation")
  // We need to find the corresponding markdown file.
  const markdownFiles = getMarkdownFiles(postsDirectory);
  const fullPath = markdownFiles.find((file) =>
    file.endsWith(`${slug}.md`)
  );

  if (!fullPath) {
    throw new Error(`Markdown file not found for slug: ${slug}`);
  }

  const fileContents = readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  // Derive category and slug from the file path
  const { displayName: derivedCategory, routeSlug: derivedCategorySlug } = getCategoryInfoFromPath(fullPath);
  const derivedSlug = slug; // The input slug is already the derived slug

  // Calculate reading time if not provided
  const readTime = data.readTime || calculateReadTime(content);

  // Provide default values for required fields
  const post: Post = {
    slug: derivedSlug, // Use the derived slug
    title: data.title || "Untitled",
    date: data.date || new Date().toISOString().split('T')[0],
    coverImage: data.coverImage || "/placeholder.svg",
    author: data.author || [{ name: "NestUp Team", picture: "/authors/nestup-team.jpg" }], // Ensure author is an array
    excerpt: data.excerpt || "",
    ogImage: data.ogImage || { url: "/placeholder.svg" },
    content,
    preview: data.preview || false,
    category: data.category || derivedCategory, // Use front matter category if present, else derived
    pillar: data.pillar,
    featured: data.featured || false,
    priority: data.priority || 3,
    readTime,
    keywords: data.keywords,
    cta: data.cta,
    tags: data.tags,
  };

  return post;
}

export function getAllPosts(): Post[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    // sort posts by date in descending order
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}

export function getFeaturedPosts(limit: number = 3): Post[] {
  const allPosts = getAllPosts();
  
  // First get posts marked as featured
  const featuredPosts = allPosts.filter(post => post.featured);
  
  // If we don't have enough featured posts, supplement with recent posts
  if (featuredPosts.length < limit) {
    const recentPosts = allPosts
      .filter(post => !post.featured)
      .slice(0, limit - featuredPosts.length);
    return [...featuredPosts, ...recentPosts];
  }
  
  // Sort featured posts by priority, then by date
  return featuredPosts
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return (a.priority || 3) - (b.priority || 3);
      }
      return b.date.localeCompare(a.date);
    })
    .slice(0, limit);
}

export function getPostsByCategory(category: string): Post[] {
  return getAllPosts().filter(post => post.category === category);
}

export function getCategoryStats(): Record<string, number> {
  const posts = getAllPosts();
  const stats: Record<string, number> = {};
  
  // Initialize all known categories using the new categoryMap structure
  Object.values(categoryMap).forEach(catInfo => {
    stats[catInfo.displayName] = 0;
  });
  
  // Count posts in each category
  posts.forEach(post => {
    // Ensure post.category is a display name, not a slug
    const categoryDisplayName = Object.values(categoryMap).find(
      (cat) => cat.displayName === post.category || cat.routeSlug === post.category.toLowerCase().replace(/\s/g, '-')
    )?.displayName || "Uncategorized";

    if (stats[categoryDisplayName] !== undefined) {
      stats[categoryDisplayName]++;
    } else {
      stats[categoryDisplayName] = 1;
    }
  });
  
  return stats;
}

export function getRecentPosts(limit: number = 6): Post[] {
  return getAllPosts().slice(0, limit);
}
