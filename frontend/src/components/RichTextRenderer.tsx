import React from 'react';
import Image from 'next/image';

interface TextNode {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

interface ContentBlock {
  type: string;
  level?: number;
  format?: string;
  children: TextNode[];
  image?: {
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
  };
}

interface RichTextRendererProps {
  content: ContentBlock[];
  className?: string;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ 
  content, 
  className = "prose lg:prose-xl max-w-none" 
}) => {
  if (!content || !Array.isArray(content)) {
    return <div className="text-gray-500 italic">No content available</div>;
  }

  const renderTextNode = (node: TextNode, index: number) => {
    let text = node.text || '';
    
    if (node.code) {
      return <code key={index} className="bg-gray-100 px-1 py-0.5 rounded text-sm">{text}</code>;
    }
    
    if (node.bold && node.italic) {
      return <strong key={index}><em>{text}</em></strong>;
    }
    
    if (node.bold) {
      return <strong key={index}>{text}</strong>;
    }
    
    if (node.italic) {
      return <em key={index}>{text}</em>;
    }
    
    if (node.underline) {
      return <u key={index}>{text}</u>;
    }
    
    if (node.strikethrough) {
      return <s key={index}>{text}</s>;
    }
    
    return text;
  };

  const renderBlock = (block: ContentBlock, index: number) => {
    if (!block.type) {
      return null;
    }

    switch (block.type) {
      case 'paragraph':
        if (!block.children || block.children.length === 0) {
          return <br key={index} />;
        }
        return (
          <p key={index} className="mb-4 text-gray-700 leading-relaxed">
            {block.children.map((child, childIndex) => renderTextNode(child, childIndex))}
          </p>
        );

      case 'heading':
        const level = Math.min(Math.max(block.level || 1, 1), 6);
        type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        const HeadingTag = `h${level}` as HeadingLevel;
        const headingClasses = {
          1: "text-3xl font-bold mb-6 mt-8 text-gray-900",
          2: "text-2xl font-bold mb-4 mt-6 text-gray-900",
          3: "text-xl font-bold mb-3 mt-5 text-gray-900",
          4: "text-lg font-bold mb-2 mt-4 text-gray-900",
          5: "text-base font-bold mb-2 mt-3 text-gray-900",
          6: "text-sm font-bold mb-1 mt-2 text-gray-900"
        };
        const headingText = block.children?.map((child) => child.text).join('') || '';
        
        return React.createElement(
          HeadingTag,
          { key: String(index), className: headingClasses[level as keyof typeof headingClasses] },
          headingText
        );

      case 'list':
        const ListTag = block.format === 'ordered' ? 'ol' : 'ul';
        const listClass = block.format === 'ordered' 
          ? "list-decimal list-inside mb-4 space-y-1" 
          : "list-disc list-inside mb-4 space-y-1";
        
        return (
          <ListTag key={index} className={listClass}>
            {block.children?.map((child, childIndex) => (
              <li key={childIndex} className="text-gray-700">
                {renderTextNode(child, childIndex)}
              </li>
            ))}
          </ListTag>
        );

      case 'quote':
        return (
          <blockquote key={index} className="border-l-4 border-orange-500 pl-4 py-2 mb-4 italic text-gray-600 bg-gray-50">
            {block.children?.map((child, childIndex) => renderTextNode(child, childIndex))}
          </blockquote>
        );

      case 'code':
        return (
          <pre key={index} className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 overflow-x-auto">
            <code>
              {block.children?.map((child) => child.text).join('') || ''}
            </code>
          </pre>
        );

      case 'image':
        if (block.image?.url) {
          return (
            <div key={index} className="mb-6">
              <Image
                src={block.image.url}
                alt={block.image.alternativeText || 'Blog image'}
                width={block.image.width || 800}
                height={block.image.height || 400}
                className="w-full h-auto rounded-lg"
              />
              {block.image.alternativeText && (
                <p className="text-sm text-gray-500 text-center mt-2 italic">
                  {block.image.alternativeText}
                </p>
              )}
            </div>
          );
        }
        break;

      default:
        // Fallback for unknown block types
        if (block.children) {
          return (
            <div key={index} className="mb-4">
              {block.children.map((child, childIndex) => renderTextNode(child, childIndex))}
            </div>
          );
        }
        break;
    }

    return null;
  };

  return (
    <div className={className}>
      {content.map((block, index) => renderBlock(block, index))}
    </div>
  );
};

export default RichTextRenderer;
