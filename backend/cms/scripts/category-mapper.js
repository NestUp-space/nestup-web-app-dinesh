/**
 * Map pillar names to Strapi category information
 */
class CategoryMapper {
  constructor() {
    // Map pillar names from markdown to Strapi category data
    this.pillarMapping = {
      'Design Trends & Inspiration': {
        name: 'Design Trends & Inspiration',
        slug: 'design-trends-inspiration',
        description: 'Latest design trends, inspiration, and style guides for interior designers'
      },
      'Case Studies & Project Spotlights': {
        name: 'Case Studies & Project Spotlights', 
        slug: 'case-studies',
        description: 'Real project case studies and success stories showcasing modular solutions'
      },
      'How-To Guides & Technical Mastery': {
        name: 'How-To Guides & Technical Mastery',
        slug: 'how-to-technical', 
        description: 'Step-by-step guides and technical expertise for interior design professionals'
      },
      'Business & Marketing for Interior Designers': {
        name: 'Business & Marketing',
        slug: 'business-marketing',
        description: 'Business strategy, marketing tips, and growth advice for design professionals'
      },
      'Business & Marketing': {
        name: 'Business & Marketing',
        slug: 'business-marketing',
        description: 'Business strategy, marketing tips, and growth advice for design professionals'
      },
      'Sustainability & Materials': {
        name: 'Sustainability & Materials',
        slug: 'sustainability-materials',
        description: 'Sustainable design practices, eco-friendly materials, and green building solutions'
      },
      'Tech Tools & Digital Workflow Integration': {
        name: 'Tech Tools & Digital Workflow Integration',
        slug: 'tech-tools-workflow',
        description: 'Digital tools, software integration, and workflow optimization for modern designers'
      },
      'Credibility & Community Building': {
        name: 'Credibility & Community Building',
        slug: 'credibility-community-building',
        description: 'Building professional credibility and fostering design community connections'
      },
      'Interactive Resources & Tools': {
        name: 'Interactive Resources & Tools',
        slug: 'interactive-resources-tools',
        description: 'Interactive tools, calculators, and resources for design professionals'
      }
    };
  }

  /**
   * Get category information by pillar name
   * @param {string} pillarName - The pillar name from markdown frontmatter
   * @returns {Object|null} Category information or null if not found
   */
  getCategoryByPillar(pillarName) {
    if (!pillarName) {
      console.warn('No pillar name provided');
      return null;
    }

    const category = this.pillarMapping[pillarName.trim()];
    if (!category) {
      console.warn(`No category mapping found for pillar: "${pillarName}"`);
      // Return a default category
      return {
        name: 'General',
        slug: 'general',
        description: 'General interior design content'
      };
    }

    return category;
  }

  /**
   * Get all available categories
   * @returns {Array} Array of all category objects
   */
  getAllCategories() {
    return Object.values(this.pillarMapping);
  }

  /**
   * Get category slug by pillar name
   * @param {string} pillarName - The pillar name from markdown frontmatter
   * @returns {string} Category slug
   */
  getCategorySlug(pillarName) {
    const category = this.getCategoryByPillar(pillarName);
    return category ? category.slug : 'general';
  }

  /**
   * Get category name by pillar name
   * @param {string} pillarName - The pillar name from markdown frontmatter
   * @returns {string} Category name
   */
  getCategoryName(pillarName) {
    const category = this.getCategoryByPillar(pillarName);
    return category ? category.name : 'General';
  }

  /**
   * Validate if a pillar name has a valid mapping
   * @param {string} pillarName - The pillar name to validate
   * @returns {boolean} True if valid mapping exists
   */
  isValidPillar(pillarName) {
    return pillarName && this.pillarMapping.hasOwnProperty(pillarName.trim());
  }

  /**
   * Get list of all supported pillar names
   * @returns {Array} Array of pillar names
   */
  getSupportedPillars() {
    return Object.keys(this.pillarMapping);
  }

  /**
   * Create category data structure for Strapi API
   * @param {string} pillarName - The pillar name from markdown
   * @returns {Object} Strapi-compatible category data
   */
  createCategoryData(pillarName) {
    const category = this.getCategoryByPillar(pillarName);
    if (!category) return null;

    return {
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        publishedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Find category ID from Strapi response by pillar name
   * @param {Array} strapiCategories - Array of categories from Strapi API
   * @param {string} pillarName - The pillar name to match
   * @returns {number|null} Category ID or null if not found
   */
  findCategoryId(strapiCategories, pillarName) {
    const targetSlug = this.getCategorySlug(pillarName);
    
    const foundCategory = strapiCategories.find(cat => 
      cat.slug === targetSlug
    );
    
    return foundCategory ? foundCategory.id : null;
  }

  /**
   * Log mapping information for debugging
   */
  logMappingInfo() {
    console.log('\n=== Category Mapping Information ===');
    console.log(`Total mappings: ${Object.keys(this.pillarMapping).length}`);
    
    Object.entries(this.pillarMapping).forEach(([pillar, category]) => {
      console.log(`\nPillar: "${pillar}"`);
      console.log(`  -> Name: ${category.name}`);
      console.log(`  -> Slug: ${category.slug}`);
    });
    console.log('\n=====================================\n');
  }
}

module.exports = CategoryMapper;
