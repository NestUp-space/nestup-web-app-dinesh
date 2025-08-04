import { useQuery } from '@apollo/client';
import { GET_BLOG_POST_BY_SLUG } from '../lib/api/blogQueries';
import { BlogPostResponse } from '../types/strapi';

export const useBlogPost = (slug: string) => {
  return useQuery<BlogPostResponse>(GET_BLOG_POST_BY_SLUG, {
    variables: { slug },
    skip: !slug,
  });
};
