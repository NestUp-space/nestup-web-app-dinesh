import fs from "fs";
import path from "path";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";

export default function PrivacyPolicyPage() {
  const markdown = fs.readFileSync(
    path.join(process.cwd(), "src/app/privacypolicy/privacypolicy.md"),
    "utf-8"
  );
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
      </main>
    </div>
  );
}
