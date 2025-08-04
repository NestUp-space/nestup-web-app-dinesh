const fetch = require('node-fetch');

const API_TOKEN = 'fcea3056120a439858d07deae4c7cbcd549c8ef0e20c3cf207ade1ab8dfa1a1d8245387438e4c7673578526360a739f41e4989e1b318331c66c620278a41c249a977022e00448a3ac566f4daf4612652913e1e88721bdd893ed69093690522b089e9ded841210110b8af51e1d572847777e46041ee495a5c12d8bb963c7aadfe';
const STRAPI_URL = 'http://127.0.0.1:1338';

async function createTestPost() {
  try {
    // First, get or create a category
    const categoryResponse = await fetch(`${STRAPI_URL}/api/blog-categories`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
      },
    });

    const categoryData = await categoryResponse.json();
    let categoryId;

    if (categoryData.data && categoryData.data.length > 0) {
      categoryId = categoryData.data[0].id;
      console.log('✅ Using existing category:', categoryData.data[0].attributes.name);
    } else {
      // Create a test category
      const newCategoryResponse = await fetch(`${STRAPI_URL}/api/blog-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
            name: 'Design Trends',
            slug: 'design-trends',
            description: 'Latest interior design trends and inspiration',
            color: '#3B82F6'
          }
        })
      });

      if (!newCategoryResponse.ok) {
        throw new Error(`Failed to create category: ${newCategoryResponse.status}`);
      }

      const newCategory = await newCategoryResponse.json();
      categoryId = newCategory.data.id;
      console.log('✅ Created new category:', newCategory.data.attributes.name);
    }

    // Create a test blog post
    const testPost = {
      data: {
        title: 'Welcome to Our New Blog System',
        slug: 'welcome-to-our-new-blog-system',
        excerpt: 'Discover how we have transformed our blog experience with Strapi CMS and modern web technologies.',
        content: [
          {
            type: 'paragraph',
            children: [
              {
                text: 'Welcome to our newly redesigned blog! We are excited to share our latest insights on interior design, modular furniture, and architectural trends.',
                bold: false
              }
            ]
          },
          {
            type: 'heading',
            level: 2,
            children: [
              {
                text: 'What\'s New?'
              }
            ]
          },
          {
            type: 'paragraph',
            children: [
              {
                text: 'Our new blog system is powered by ',
                bold: false
              },
              {
                text: 'Strapi CMS',
                bold: true
              },
              {
                text: ' and built with modern web technologies to provide you with a seamless reading experience.',
                bold: false
              }
            ]
          },
          {
            type: 'list',
            format: 'unordered',
            children: [
              {
                text: 'Rich content editing capabilities'
              },
              {
                text: 'Better search and filtering'
              },
              {
                text: 'Enhanced mobile experience'
              },
              {
                text: 'Improved loading speeds'
              }
            ]
          },
          {
            type: 'paragraph',
            children: [
              {
                text: 'Stay tuned for more exciting content about interior design, sustainability, and innovative modular solutions!',
                italic: true
              }
            ]
          }
        ],
        featured: true,
        publishedAt: new Date().toISOString(),
        readTime: 3,
        tags: ['announcement', 'technology', 'blog'],
        priority: 1,
        author: {
          name: 'NestUp Team',
          bio: 'Interior design experts specializing in modular solutions',
          picture: null,
          socialLinks: null
        },
        seoMeta: {
          metaTitle: 'Welcome to Our New Blog System | NestUp',
          metaDescription: 'Discover our newly redesigned blog powered by modern technology.',
          keywords: 'blog, technology, interior design, nestup',
          canonicalURL: null,
          metaRobots: 'index,follow',
          structuredData: null,
          metaViewport: 'width=device-width, initial-scale=1',
          metaImage: null
        },
        projectDetails: null,
        blog_category: categoryId
      }
    };

    console.log('📝 Creating test blog post...');

    const response = await fetch(`${STRAPI_URL}/api/blog-posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(testPost)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create post: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Test post created successfully!');
    console.log('   Title:', result.data.attributes.title);
    console.log('   Slug:', result.data.attributes.slug);
    console.log('   ID:', result.data.id);
    console.log('\n🌐 View your post at: http://localhost:3000/resources/blog/' + result.data.attributes.slug);

  } catch (error) {
    console.error('❌ Error creating test post:', error.message);
    process.exit(1);
  }
}

// Run the script
createTestPost();
