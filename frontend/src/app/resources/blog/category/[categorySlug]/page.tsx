import { getPostsByCategory, getCategoryStats } from "@lib/api";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Clock } from "lucide-react";
import Navbar from "@/components/landing-page/Navbar";
import { Footer } from "@/components/landing-page/Footer";
import { notFound } from "next/navigation";

// Map category slugs to display names
const categoryMap: Record<string, string> = {
  "technical-mastery": "Technical Mastery",
  "design-workflow": "Design Workflow",
  "project-management": "Project Management",
  "business-growth": "Business Growth",
  "case-studies": "Case Studies",
  "sustainability": "Sustainability",
  "design-trends": "Design Trends",
};

type Params = {
  params: {
    categorySlug: string;
  };
};

export default function CategoryPage({ params }: Params) {
  const categoryName = categoryMap[params.categorySlug];
  
  if (!categoryName) {
    return notFound();
  }

  const posts = getPostsByCategory(categoryName);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-orange-500 mb-4">{categoryName}</h1>
          <p className="text-xl text-gray-600">
            {posts.length} articles in this category
          </p>
        </div>
        
        {posts.length === 0 ? (
          <div className="text-center text-gray-500">
            <p>No articles found in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link key={post.slug} href={`/resources/blog/${post.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow border-0 rounded-none">
                  <Image
                    src={post.coverImage || "/placeholder.svg"}
                    alt={post.title}
                    width={300}
                    height={200}
                    className="w-full h-40 object-cover"
                  />
                  <CardContent className="p-6">
                    <Badge variant="outline" className="mb-3 text-orange-600 border-orange-200 rounded-none">
                      {post.category}
                    </Badge>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {post.readTime || 5} min read
                      </span>
                      <span>{post.date}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export async function generateStaticParams() {
  return Object.keys(categoryMap).map((categorySlug) => ({
    categorySlug,
  }));
}

export function generateMetadata({ params }: Params) {
  const categoryName = categoryMap[params.categorySlug];
  
  if (!categoryName) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${categoryName} - NestUp Blog`,
    description: `Browse all articles in the ${categoryName} category`,
  };
}
