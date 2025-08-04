import { gql } from '@apollo/client';
import { BlogPostResponse, BlogPostsResponse } from '../../types/strapi';

export const GET_BLOG_POSTS = gql`
  query GetBlogPosts($limit: Int, $start: Int, $categorySlug: String, $featured: Boolean) {
    blogPosts(
      pagination: { limit: $limit, start: $start }
      filters: { 
        category: { slug: { eq: $categorySlug } }
        featured: { eq: $featured }
      }
      sort: ["priority:asc", "publishedAt:desc"]
    ) {
      documentId
      title
      slug
      excerpt
      featuredImage {
        url
        alternativeText
      }
      category {
        name
        slug
        color
      }
      tags
      author {
        name
        picture {
          url
          alternativeText
        }
      }
      featured
      readTime
      publishedAt
    }
  }
`;

export const GET_BLOG_POST_BY_SLUG = gql`
  query GetBlogPostBySlug($slug: String!) {
    blogPosts(filters: { slug: { eq: $slug } }) {
      documentId
      title
      slug
      excerpt
      content
      featuredImage {
        url
        alternativeText
      }
      gallery {
        url
        alternativeText
      }
      category {
        name
        slug
        color
      }
      tags
      author {
        name
        picture {
          url
          alternativeText
        }
        bio
        socialLinks
      }
      seoMeta {
        metaTitle
        metaDescription
        keywords
        canonicalUrl
        ogImage {
          url
          alternativeText
        }
      }
      projectDetails {
        client
        location
        duration
        projectValue
        challenges
        results
      }
      featured
      priority
      readTime
      relatedPosts {
        title
        slug
        excerpt
        featuredImage {
          url
          alternativeText
        }
        category {
          name
          slug
          color
        }
        readTime
        publishedAt
      }
      cta
      publishedAt
      lastUpdated
    }
  }
`;

export const GET_BLOG_CATEGORIES = gql`
  query GetBlogCategories {
    blogCategories {
      documentId
      name
      slug
      description
      color
      icon {
        url
        alternativeText
      }
    }
  }
`;

export const GET_FEATURED_POSTS = gql`
  query GetFeaturedPosts($limit: Int = 3) {
    blogPosts(
      filters: { featured: { eq: true } }
      sort: "priority:asc"
      pagination: { limit: $limit }
    ) {
      documentId
      title
      slug
      excerpt
      featuredImage {
        url
        alternativeText
      }
      category {
        name
        slug
        color
      }
      readTime
      publishedAt
    }
  }
`;
