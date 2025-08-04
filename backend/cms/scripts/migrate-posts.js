const fs = require('fs');
const path = require('path');
const MarkdownConverter = require('./markdown-converter');
const CategoryMapper = require('./category-mapper');

/**
 * Blog post migration script for converting markdown files to Strapi posts
 */
class BlogPostMigrator {
  constructor() {
    this.converter = new MarkdownConverter();
    this.categoryMapper = new CategoryMapper();
    this.strapiUrl = 'http://127.0.0.1:1338';
    this.apiToken = 'fcea3056120a439858d07deae4c7cbcd549c8ef0e20c3cf207ade1ab8dfa1a1d8245387438e4c7673578526360a739f41e4989e1b318331c66c620278a41c249a977022e00448a3ac566f4daf4612652913e1e88721bdd893ed69093690522b089e9ded841210110b8af51e1d572847777e46041ee495a5c12d8bb963c7aadfe';
    
    // Define the specific files to migrate
    this.targetFiles = [
      {
        path: '../../frontend/src/app/resources/blog/posts/design-trends-inspiration/2025-interior-design-trends-embracing-the-beautifully-human-with-modular-furniture.md',
        priority: 1
      },
      {
        path: '../../frontend/src/app/resources/blog/posts/case-studies/luxury-apartment-transformation-with-modular-solutions.md',
        priority: 2
      },
      {
        path: '../../frontend/src/app/resources/blog/posts/how-to-technical/site-survey-success-a-step-by-step-guide-to-measuring-for-modular-installations.md',
        priority: 3
      },
      {
        path: '../../frontend/src/app/resources/blog/posts/business-marketing/project-profitability-utilizing-modular-furniture-to-stay-on-budget-and-deliver-on-time.md',
        priority: 4
      },
      {
        path: '../../frontend/src/app/resources/blog/posts/sustainability-materials/green-by-design-understanding-the-sustainability-benefits-of-modular-furniture.md',
        priority: 5
      },
      {
        path: '../../frontend/src/app/resources/blog/posts/tech-tools-workflow/3d-visualization-tools-presenting-modular-concepts-to-clients.md',
        priority: 6
      }
    ];
  }

  /**
   * Initialize the migration process
   */
  async initialize() {
    console.log('🚀 Blog Post Migration Starting...\n');

    const maxRetries = 5;
    let attempt = 0;
    let connected = false;

    while (attempt < maxRetries && !connected) {
      attempt++;
      console.log(`[Attempt ${attempt}/${maxRetries}] Checking Strapi connection...`);
      try {
        const response = await fetch(`${this.strapiUrl}/api/blog-categories`, {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
          },
        });

        if (response.ok) {
          connected = true;
          console.log('✅ Connected to Strapi server');
        } else {
          const errorText = await response.text();
          throw new Error(`Connection failed with status ${response.status}: ${errorText}`);
        }
      } catch (error) {
        console.warn(`   ...connection failed: ${error.message}`);
        if (attempt < maxRetries) {
          const delay = attempt * 2000; // 2s, 4s, 6s, 8s
          console.log(`   Retrying in ${delay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('\n❌ Could not connect to Strapi after multiple attempts.');
          console.error('   Please ensure the Strapi server is running and accessible.');
          process.exit(1);
        }
      }
    }
    
    this.categoryMapper.logMappingInfo();
  }

  /**
   * Generate a URL-friendly slug from title
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Generate author data from frontmatter or use default
   */
  generateAuthorData(frontmatter) {
    if (frontmatter.author) {
      return {
        name: frontmatter.author.name || frontmatter.author,
        bio: frontmatter.author.bio || 'Interior Design Expert',
        picture: frontmatter.author.picture || '/authors/default.jpg'
      };
    }
    
    // Default author
    return {
      name: 'NestUp Team',
      bio: 'Expert interior designers specializing in modular solutions',
      picture: '/authors/nestup-team.jpg'
    };
  }

  /**
   * Generate SEO metadata from frontmatter
   */
  generateSeoMeta(frontmatter, title, content) {
    const metaTitle = frontmatter.title || title;
    const metaDescription = frontmatter.excerpt || 
      frontmatter.description || 
      `${title} - Expert insights on interior design and modular solutions`;
    
    const keywords = [];
    if (frontmatter.keywords) {
      if (frontmatter.keywords.primary) {
        keywords.push(frontmatter.keywords.primary);
      }
      if (frontmatter.keywords.secondary && Array.isArray(frontmatter.keywords.secondary)) {
        keywords.push(...frontmatter.keywords.secondary);
      }
    }
    
    return {
      metaTitle: metaTitle.substring(0, 60), // Limit for SEO
      metaDescription: metaDescription.substring(0, 160), // Limit for SEO
      keywords: keywords.join(', '),
      canonicalURL: null,
      metaRobots: 'index,follow',
      structuredData: null,
      metaViewport: 'width=device-width, initial-scale=1',
      metaImage: frontmatter.coverImage || frontmatter.ogImage?.url || null
    };
  }

  /**
   * Generate project details if relevant
   */
  generateProjectDetails(frontmatter) {
    if (frontmatter.client || frontmatter.location || frontmatter.duration) {
      return {
        client: frontmatter.client || null,
        location: frontmatter.location || null,
        duration: frontmatter.duration || null,
        budget: frontmatter.budget || null,
        teamSize: frontmatter.teamSize || null,
        challenges: frontmatter.challenges || null,
        results: frontmatter.results || null
      };
    }
    return null;
  }

  /**
   * Convert markdown file to Strapi post data
   */
  async convertToStrapiPost(filePath, priority) {
    try {
      console.log(`\n📄 Processing: ${path.basename(filePath)}`);
      
      const fullPath = path.resolve(filePath);
      const { frontmatter, content, blocks } = this.converter.parseMarkdownFile(fullPath);
      
      console.log(`   Frontmatter keys: ${Object.keys(frontmatter).join(', ')}`);
      console.log(`   Content blocks: ${blocks.length}`);
      
      // Get category information
      const categoryInfo = this.categoryMapper.getCategoryByPillar(frontmatter.pillar);
      console.log(`   Category: ${categoryInfo ? categoryInfo.name : 'Default'}`);
      
      // Generate post data
      const title = frontmatter.title || path.basename(filePath, '.md').replace(/-/g, ' ');
      const slug = this.generateSlug(frontmatter.slug || title);
      const author = this.generateAuthorData(frontmatter);
      const seoMeta = this.generateSeoMeta(frontmatter, title, content);
      const projectDetails = this.generateProjectDetails(frontmatter);
      
      // Determine publish date
      let publishedAt = null;
      if (frontmatter.date) {
        publishedAt = new Date(frontmatter.date).toISOString();
      } else {
        // Generate a publish date based on priority (spread over last few months)
        const baseDate = new Date();
        baseDate.setMonth(baseDate.getMonth() - priority);
        publishedAt = baseDate.toISOString();
      }
      
      const postData = {
        title,
        slug,
        excerpt: frontmatter.excerpt || seoMeta.metaDescription,
        content: blocks,
        featured: frontmatter.featured || false,
        publishedAt,
        readTime: frontmatter.readTime || this.estimateReadTime(content),
        tags: frontmatter.tags || [],
        priority: frontmatter.priority || priority,
        author,
        seoMeta,
        projectDetails,
        // Category will be linked separately after we get categories
        categorySlug: this.categoryMapper.getCategorySlug(frontmatter.pillar)
      };
      
      console.log(`   Generated slug: ${slug}`);
      console.log(`   Publish date: ${publishedAt}`);
      console.log(`   Read time: ${postData.readTime} min`);
      
      return postData;
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Estimate reading time based on content length
   */
  estimateReadTime(content) {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  /**
   * Fetch existing categories from Strapi
   */
  async fetchCategories() {
    try {
      const response = await fetch(`${this.strapiUrl}/api/blog-categories`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('❌ Error fetching categories:', error.message);
      return [];
    }
  }

  /**
   * Create a blog post in Strapi
   */
  async createBlogPost(postData) {
    try {
      // Get categories to find the right category ID
      const categories = await this.fetchCategories();
      const categoryId = this.categoryMapper.findCategoryId(categories, postData.categorySlug);
      
      if (!categoryId) {
        console.warn(`⚠️  Category not found for slug: ${postData.categorySlug}`);
      }

      // Prepare Strapi data structure
      const strapiData = {
        data: {
          title: postData.title,
          slug: postData.slug,
          excerpt: postData.excerpt,
          content: postData.content,
          featured: postData.featured,
          publishedAt: postData.publishedAt,
          readTime: postData.readTime,
          tags: postData.tags,
          priority: postData.priority,
          author: postData.author,
          seoMeta: postData.seoMeta,
          projectDetails: postData.projectDetails,
          blog_category: categoryId // Link to category
        }
      };

      console.log(`   Creating post in Strapi...`);
      
      const response = await fetch(`${this.strapiUrl}/api/blog-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify(strapiData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Strapi API error (${response.status}): ${errorData}`);
      }

      const result = await response.json();
      console.log(`✅ Created post: ${postData.title} (ID: ${result.data.id})`);
      
      return result.data;
      
    } catch (error) {
      console.error(`❌ Error creating post "${postData.title}":`, error.message);
      return null;
    }
  }

  /**
   * Check if a post with the same slug already exists
   */
  async checkPostExists(slug) {
    try {
      const response = await fetch(`${this.strapiUrl}/api/blog-posts?filters[slug][$eq]=${slug}`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });
      const data = await response.json();
      return data.data && data.data.length > 0;
    } catch (error) {
      console.error('Error checking post existence:', error.message);
      return false;
    }
  }

  /**
   * Run the complete migration process
   */
  async migrate() {
    await this.initialize();
    
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    console.log(`\n📚 Starting migration of ${this.targetFiles.length} blog posts...\n`);

    for (const fileInfo of this.targetFiles) {
      try {
        // Convert markdown to post data
        const postData = await this.convertToStrapiPost(fileInfo.path, fileInfo.priority);
        
        if (!postData) {
          results.failed.push({ file: fileInfo.path, reason: 'Conversion failed' });
          continue;
        }

        // Check if post already exists
        const exists = await this.checkPostExists(postData.slug);
        if (exists) {
          console.log(`⏭️  Post already exists: ${postData.slug}`);
          results.skipped.push({ file: fileInfo.path, slug: postData.slug });
          continue;
        }

        // Create the post in Strapi
        const createdPost = await this.createBlogPost(postData);
        
        if (createdPost) {
          results.successful.push({ 
            file: fileInfo.path, 
            slug: postData.slug, 
            id: createdPost.id 
          });
        } else {
          results.failed.push({ file: fileInfo.path, reason: 'Strapi creation failed' });
        }
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Unexpected error processing ${fileInfo.path}:`, error.message);
        results.failed.push({ file: fileInfo.path, reason: error.message });
      }
    }

    // Print summary
    this.printMigrationSummary(results);
  }

  /**
   * Print migration summary
   */
  printMigrationSummary(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`✅ Successful: ${results.successful.length}`);
    results.successful.forEach(item => {
      console.log(`   - ${path.basename(item.file)} → ${item.slug} (ID: ${item.id})`);
    });
    
    if (results.skipped.length > 0) {
      console.log(`⏭️  Skipped: ${results.skipped.length}`);
      results.skipped.forEach(item => {
        console.log(`   - ${path.basename(item.file)} → ${item.slug} (already exists)`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log(`❌ Failed: ${results.failed.length}`);
      results.failed.forEach(item => {
        console.log(`   - ${path.basename(item.file)} → ${item.reason}`);
      });
    }
    
    console.log('\n🎉 Migration completed!');
    console.log(`   Total processed: ${results.successful.length + results.skipped.length + results.failed.length}`);
    
    if (results.successful.length > 0) {
      console.log('\n💡 Next steps:');
      console.log('   1. Check the posts in Strapi admin panel');
      console.log('   2. Test the frontend blog pages');
      console.log('   3. Verify SEO metadata is correct');
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new BlogPostMigrator();
  migrator.migrate().catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
}

module.exports = BlogPostMigrator;
