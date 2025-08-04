import { useQuery } from '@apollo/client';
import { GET_BLOG_CATEGORIES } from '../lib/api/blogQueries';

export const useBlogCategories = () => {
  return useQuery(GET_BLOG_CATEGORIES);
};
