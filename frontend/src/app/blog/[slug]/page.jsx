import fs from 'fs'; // Import the file system module
import path from 'path'; // Import the path module
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { getPostData } from "@lib/posts";

// Define the directory where markdown posts are stored
const postsDirectory = path.join(process.cwd(), 'src/app/blog/posts');

// Function to generate static parameters for dynamic routes
export async function generateStaticParams() {
  // Get all post slugs from markdown files
  const slugs = fs.readdirSync(postsDirectory).map((fileName) => {
    return {
      // Remove the .md extension
      slug: fileName.replace(/\.md$/, ''),
    };
  });
  return slugs;
}

// Default export function for the blog post page
export default async function Post({ params }) {
  const postData = await getPostData(params.slug); // Fetch post data based on slug

  return (
    <section className="mx-auto w-10/12 md:w-1/2 mt-20 flex flex-col gap-5">
      <div className="flex justify-between font-poppins">
        <Link href="/blog" className="flex flex-row gap-1 place-items-center">
          <ArrowLeftIcon width={20} />
          <p>Back</p>
        </Link>
        <p>{postData.date.toString()}</p>
      </div>
      <div
        className="post"
        dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
      />
    </section>
  );
}
