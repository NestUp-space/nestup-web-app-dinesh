import { type Author } from "@lib/author";

export type Post = {
  slug: string;
  title: string;
  date: string;
  coverImage: string;
  author: Author;
  excerpt: string;
  ogImage: {
    url: string;
  };
  content: string;
  preview?: boolean;
  // New dynamic fields
  category: string;
  pillar?: string;
  featured?: boolean;
  priority?: number;
  readTime?: number;
  keywords?: {
    primary?: string;
    secondary?: string[];
  };
  cta?: string;
  tags?: string[];
};
