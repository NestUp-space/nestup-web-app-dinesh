const matter = require('gray-matter');

/**
 * Convert markdown content to Strapi rich text blocks
 */
class MarkdownConverter {
  /**
   * Convert markdown content to Strapi blocks array
   * @param {string} markdownContent - Raw markdown content
   * @returns {Array} Array of Strapi blocks
   */
  convertToBlocks(markdownContent) {
    const blocks = [];
    const lines = markdownContent.split('\n');
    let currentParagraph = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines but process accumulated paragraph
      if (line === '') {
        if (currentParagraph.length > 0) {
          blocks.push(this.createParagraphBlock(currentParagraph.join(' ')));
          currentParagraph = [];
        }
        continue;
      }
      
      // Handle headings
      if (line.startsWith('#')) {
        // Process any accumulated paragraph first
        if (currentParagraph.length > 0) {
          blocks.push(this.createParagraphBlock(currentParagraph.join(' ')));
          currentParagraph = [];
        }
        
        blocks.push(this.createHeadingBlock(line));
        continue;
      }
      
      // Handle unordered lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        // Process any accumulated paragraph first
        if (currentParagraph.length > 0) {
          blocks.push(this.createParagraphBlock(currentParagraph.join(' ')));
          currentParagraph = [];
        }
        
        // Collect list items
        const listItems = [line];
        while (i + 1 < lines.length && (lines[i + 1].trim().startsWith('- ') || lines[i + 1].trim().startsWith('* '))) {
          i++;
          listItems.push(lines[i].trim());
        }
        
        blocks.push(this.createListBlock(listItems, 'unordered'));
        continue;
      }
      
      // Handle ordered lists
      if (/^\d+\.\s/.test(line)) {
        // Process any accumulated paragraph first
        if (currentParagraph.length > 0) {
          blocks.push(this.createParagraphBlock(currentParagraph.join(' ')));
          currentParagraph = [];
        }
        
        // Collect list items
        const listItems = [line];
        while (i + 1 < lines.length && /^\d+\.\s/.test(lines[i + 1].trim())) {
          i++;
          listItems.push(lines[i].trim());
        }
        
        blocks.push(this.createListBlock(listItems, 'ordered'));
        continue;
      }
      
      // Handle code blocks
      if (line.startsWith('```')) {
        // Process any accumulated paragraph first
        if (currentParagraph.length > 0) {
          blocks.push(this.createParagraphBlock(currentParagraph.join(' ')));
          currentParagraph = [];
        }
        
        const language = line.substring(3);
        const codeLines = [];
        i++; // Skip the opening ```
        
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        
        blocks.push(this.createCodeBlock(codeLines.join('\n'), language));
        continue;
      }
      
      // Handle HTML comments (skip them)
      if (line.startsWith('<!--') && line.endsWith('-->')) {
        continue;
      }
      
      // Handle blockquotes
      if (line.startsWith('> ')) {
        // Process any accumulated paragraph first
        if (currentParagraph.length > 0) {
          blocks.push(this.createParagraphBlock(currentParagraph.join(' ')));
          currentParagraph = [];
        }
        
        blocks.push(this.createQuoteBlock(line.substring(2)));
        continue;
      }
      
      // Regular content - accumulate for paragraph
      if (line.length > 0) {
        currentParagraph.push(line);
      }
    }
    
    // Process any remaining paragraph
    if (currentParagraph.length > 0) {
      blocks.push(this.createParagraphBlock(currentParagraph.join(' ')));
    }
    
    return blocks.filter(block => block !== null);
  }
  
  /**
   * Create a heading block
   */
  createHeadingBlock(line) {
    const level = (line.match(/^#+/) || [''])[0].length;
    const text = line.replace(/^#+\s*/, '').trim();
    
    if (!text || text === 'Header' || text.includes('placeholder')) {
      return null; // Skip placeholder headings
    }
    
    return {
      __component: 'shared.rich-text',
      body: [
        {
          type: 'heading',
          level: Math.min(level, 6),
          children: [
            {
              type: 'text',
              text: text
            }
          ]
        }
      ]
    };
  }
  
  /**
   * Create a paragraph block
   */
  createParagraphBlock(text) {
    // Skip placeholder content
    if (!text || text.includes('placeholder') || text.includes('Content placeholder')) {
      return null;
    }
    
    return {
      __component: 'shared.rich-text',
      body: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: text.trim()
            }
          ]
        }
      ]
    };
  }
  
  /**
   * Create a list block
   */
  createListBlock(items, type = 'unordered') {
    const listItems = items.map(item => {
      const text = item.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
      return {
        type: 'list-item',
        children: [
          {
            type: 'text',
            text: text
          }
        ]
      };
    });
    
    return {
      __component: 'shared.rich-text',
      body: [
        {
          type: type === 'ordered' ? 'ordered-list' : 'unordered-list',
          children: listItems
        }
      ]
    };
  }
  
  /**
   * Create a code block
   */
  createCodeBlock(code, language = '') {
    return {
      __component: 'shared.rich-text',
      body: [
        {
          type: 'code',
          language: language || 'text',
          children: [
            {
              type: 'text',
              text: code
            }
          ]
        }
      ]
    };
  }
  
  /**
   * Create a quote block
   */
  createQuoteBlock(text) {
    return {
      __component: 'shared.rich-text',
      body: [
        {
          type: 'quote',
          children: [
            {
              type: 'text',
              text: text.trim()
            }
          ]
        }
      ]
    };
  }
  
  /**
   * Process inline formatting (bold, italic, links)
   */
  processInlineFormatting(text) {
    // Handle bold text **text**
    text = text.replace(/\*\*(.*?)\*\*/g, (match, content) => {
      return content; // For now, just return the content
      // In a full implementation, you'd mark it as bold in the rich text structure
    });
    
    // Handle italic text *text*
    text = text.replace(/\*(.*?)\*/g, (match, content) => {
      return content; // For now, just return the content
    });
    
    // Handle links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      return linkText; // For now, just return the link text
      // In a full implementation, you'd create a link node
    });
    
    return text;
  }
  
  /**
   * Parse markdown file and extract frontmatter + content
   */
  parseMarkdownFile(filePath) {
    const fs = require('fs');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter, content } = matter(fileContent);
    
    return {
      frontmatter,
      content,
      blocks: this.convertToBlocks(content)
    };
  }
}

module.exports = MarkdownConverter;
