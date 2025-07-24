import { Button } from "@/components/ui/button";
import { promises as fs } from "fs";
import path from "path";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";

export default async function PrivacyPolicyPage() {
  const markdownPath = path.join(
    process.cwd(),
    "src/app/privacypolicy/privacypolicy.md"
  );
  const markdown = await fs.readFile(markdownPath, "utf-8");

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500 mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your privacy is important to us. This policy outlines how we
            collect, use, and protect your information.
          </p>
          <div className="mt-6 text-sm text-gray-500">
            Last updated: 24th July 2025
          </div>
        </div>

        <div className="prose prose-lg max-w-none">
          <Markdown
            rehypePlugins={[rehypeRaw, rehypeStringify]}
            remarkPlugins={[remarkParse, remarkRehype]}
          >
            {markdown}
          </Markdown>
        </div>

        <div className="mt-16 text-center bg-gradient-to-r from-orange-50 to-yellow-50 p-8 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Ready to Build Smarter with Modular?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Contact us today to learn more about our modular building solutions
            and schedule your free site visit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3">
              Book a Free Site Visit
            </Button>
            <Button
              variant="outline"
              className="border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white px-8 py-3 bg-transparent"
            >
              Call us
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
