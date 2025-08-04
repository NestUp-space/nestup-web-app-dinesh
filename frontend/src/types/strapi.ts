export interface BlogCategory {
  documentId: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon?: {
    url: string;
    alternativeText: string;
  };
}

export interface Author {
  name: string;
  picture?: {
    url: string;
    alternativeText: string;
  };
  bio?: string;
  socialLinks?: any;
}

export interface SEOMeta {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: {
    url: string;
    alternativeText: string;
  };
}

export interface ProjectDetails {
  client?: string;
  location?: string;
  duration?: string;
  projectValue?: string;
  challenges?: any;
  results?: any;
}

export interface BlogPost {
  documentId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: any[];
  featuredImage?: {
    url: string;
    alternativeText: string;
  };
  gallery?: {
    url: string;
    alternativeText: string;
  }[];
  category: BlogCategory;
  tags: string[];
  author: Author;
  seoMeta?: SEOMeta;
  projectDetails?: ProjectDetails;
  featured: boolean;
  priority: number;
  readTime: number;
  relatedPosts?: BlogPost[];
  cta?: string;
  publishedAt: string;
  scheduledDate?: string;
  lastUpdated?: string;
}

export interface BlogPostsResponse {
  blogPosts: BlogPost[];
}

export interface BlogPostResponse {
  blogPosts: [BlogPost];
}
