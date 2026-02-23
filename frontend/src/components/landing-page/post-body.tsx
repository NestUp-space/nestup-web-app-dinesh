"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";
import markdownStyles from "../markdown-styles.module.css";

type Props = {
  content: string;
};

export function PostBody({ content }: Props) {
  const sanitizedContent = useMemo(
    () => DOMPurify.sanitize(content),
    [content]
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={markdownStyles["markdown"]}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </div>
  );
}
