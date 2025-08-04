const fetch = require('node-fetch');

const STRAPI_API_URL = 'http://localhost:1337/api';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN; // Make sure to set this in your environment variables

const categories = [
  {
    name: "Design Trends & Inspiration",
    slug: "design-trends-inspiration",
    description: "Latest design trends and creative inspiration for modern interiors",
    color: "#FF6B6B"
  },
  {
    name: "Case Studies & Project Spotlights",
    slug: "case-studies",
    description: "Real projects showcasing modular solutions in action",
    color: "#4ECDC4"
  },
  {
    name: "How-To & Technical Guides",
    slug: "how-to-technical",
    description: "Step-by-step guides and technical insights for professionals",
    color: "#45B7D1"
  },
  {
    name: "Business & Marketing",
    slug: "business-marketing",
    description: "Business strategies and marketing insights for design professionals",
    color: "#96CEB4"
  },
  {
    name: "Sustainability & Materials",
    slug: "sustainability-materials",
    description: "Eco-friendly materials and sustainable design practices",
    color: "#FFEAA7"
  },
  {
    name: "Tech Tools & Workflow",
    slug: "tech-tools-workflow",
    description: "Digital tools and workflow optimization for designers",
    color: "#DDA0DD"
  }
];

async function createCategory(category) {
  try {
    // Check if category already exists
    const checkResponse = await fetch(`${STRAPI_API_URL}/blog-categories?filters[slug][$eq]=${category.slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_TOKEN}`
      }
    });

    if (!checkResponse.ok) {
      const error = await checkResponse.json();
      throw new Error(`Failed to check category ${category.name}: ${JSON.stringify(error)}`);
    }

    const existingCategories = await checkResponse.json();

    if (existingCategories.data && existingCategories.data.length > 0) {
      console.log(`Category "${category.name}" already exists. Skipping creation.`);
      return;
    }

    // If not, create the category
    const response = await fetch(`${STRAPI_API_URL}/blog-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_TOKEN}`
      },
      body: JSON.stringify({ data: category })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create category ${category.name}: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    console.log(`Successfully created category: ${result.data.attributes.name}`);
  } catch (error) {
    console.error(error.message);
  }
}

async function seed() {
  if (!STRAPI_TOKEN) {
    console.error("STRAPI_API_TOKEN is not set. Please set it in your environment variables.");
    return;
  }

  for (const category of categories) {
    await createCategory(category);
  }
}

seed();
