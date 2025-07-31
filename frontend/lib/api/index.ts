import { Post } from "@lib/post";
import fs from "fs";
import matter from "gray-matter";
import { join } from "path";
import { readdirSync, readFileSync } from "fs";

const postsDirectory = join(process.cwd(), "./src/app/resources/blog/posts");

// Category mapping from directory names to display names
const categoryMap: Record<string, string> = {
  "business-marketing": "Business Growth",
  "case-studies": "Case Studies",
  "design-trends-inspiration": "Design Trends",
  "how-to-technical": "Technical Mastery",
  "tech-tools-workflow": "Design Workflow",
  "sustainability-materials": "Sustainability",
};

// Calculate reading time based on content
function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Get category from directory path
function getCategoryFromSlug(slug: string): string {
  const directory = slug.split("/")[0];
  return categoryMap[directory] || "Uncategorized";
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
  // Convert absolute paths to slugs relative to postsDirectory
  return markdownFiles.map((file) =>
    file.replace(postsDirectory + "/", "").replace(/\.md$/, "")
  );
}

export function getPostBySlug(slug: string): Post {
  const realSlug = slug.replace(/\.md$/, "");
  // Find the actual file path based on the slug, which might include subdirectories
  const markdownFiles = getMarkdownFiles(postsDirectory);
  const fullPath = markdownFiles.find((file) =>
    file.endsWith(`${realSlug}.md`)
  );

  if (!fullPath) {
    throw new Error(`Markdown file not found for slug: ${slug}`);
  }

  const fileContents = readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  // Auto-derive category from directory structure if not provided
  const category = data.category || getCategoryFromSlug(realSlug);
  
  // Calculate reading time if not provided
  const readTime = data.readTime || calculateReadTime(content);

  // Provide default values for required fields
  const post: Post = {
    slug: realSlug,
    title: data.title || "Untitled",
    date: data.date || new Date().toISOString().split('T')[0],
    coverImage: data.coverImage || "/placeholder.svg",
    author: data.author || { name: "NestUp Team", picture: "/authors/nestup-team.jpg" },
    excerpt: data.excerpt || "",
    ogImage: data.ogImage || { url: "/placeholder.svg" },
    content,
    preview: data.preview || false,
    category,
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
  
  // Initialize all known categories
  Object.values(categoryMap).forEach(category => {
    stats[category] = 0;
  });
  
  // Count posts in each category
  posts.forEach(post => {
    if (stats[post.category] !== undefined) {
      stats[post.category]++;
    } else {
      stats[post.category] = 1;
    }
  });
  
  return stats;
}

export function getRecentPosts(limit: number = 6): Post[] {
  return getAllPosts().slice(0, limit);
}
