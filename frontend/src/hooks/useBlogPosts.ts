import { useQuery } from '@apollo/client';
import { GET_BLOG_POSTS } from '../lib/api/blogQueries';
import { BlogPostsResponse } from '../types/strapi';

interface UseBlogPostsOptions {
  limit?: number;
  start?: number;
  categorySlug?: string;
  featured?: boolean;
}

export const useBlogPosts = (options: UseBlogPostsOptions = {}) => {
  return useQuery<BlogPostsResponse>(GET_BLOG_POSTS, {
    variables: options,
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
    onError: (error) => {
      console.error('Blog posts query error:', error);
    },
  });
};
