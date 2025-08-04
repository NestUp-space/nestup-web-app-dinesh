export default {
  routes: [
    {
      method: 'POST',
      path: '/blog-categories',
      handler: 'api::blog-category.blog-category.create',
      config: {
        policies: [],
        auth: false, // Allow public access
      },
    },
    {
      method: 'GET',
      path: '/blog-categories',
      handler: 'api::blog-category.blog-category.find',
      config: {
        policies: [],
        auth: false,
      }
    },
    {
      method: 'GET',
      path: '/blog-categories/:id',
      handler: 'api::blog-category.blog-category.findOne',
      config: {
        policies: [],
        auth: false,
      }
    }
  ]
}
