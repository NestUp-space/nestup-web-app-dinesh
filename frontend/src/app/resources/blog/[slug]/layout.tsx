import { Metadata } from 'next';
import { client } from '../../../../lib/api/graphqlClient';
import { GET_BLOG_POST_BY_SLUG } from '../../../../lib/api/blogQueries';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { data } = await client.query({
      query: GET_BLOG_POST_BY_SLUG,
      variables: { slug: params.slug },
    });

    const post = data?.blogPosts?.data[0]?.attributes;

    if (!post) {
      return {
        title: 'Post Not Found | NestUp Blog',
      };
    }

    const seo = post.seoMeta;
    
    return {
      title: seo?.metaTitle || `${post.title} | NestUp Blog`,
      description: seo?.metaDescription || post.excerpt,
      keywords: seo?.keywords,
      alternates: {
        canonical: seo?.canonicalUrl,
      },
      openGraph: {
        title: post.title,
        description: post.excerpt,
        images: [
          {
            url: seo?.ogImage?.data.attributes.url || post.featuredImage?.data.attributes.url || '',
            alt: post.title,
          },
        ],
        type: 'article',
        publishedTime: post.publishedAt,
        authors: [post.author.name],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt,
        images: [seo?.ogImage?.data.attributes.url || post.featuredImage?.data.attributes.url || ''],
      },
    };
  } catch (error) {
    return {
      title: 'Blog | NestUp',
    };
  }
}

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
