import { useQuery } from '@apollo/client';
import { GET_BLOG_POSTS } from '../lib/api/blogQueries';
import { BlogPostsResponse } from '../types/strapi';

interface UsePostsOptions {
  limit?: number;
  featured?: boolean;
  categorySlug?: string;
}

export const usePosts = (options: UsePostsOptions = {}) => {
  const { limit = 6, featured, categorySlug } = options;
  
  return useQuery<BlogPostsResponse>(GET_BLOG_POSTS, {
    variables: {
      limit,
      featured,
      categorySlug,
    },
  });
};
