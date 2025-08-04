module.exports = async (policyContext, config, { strapi }) => {
  const { route } = policyContext;

  // Allow blog category operations
  if (route.handler === 'api::blog-category.blog-category.create') {
    return true;
  }

  if (route.handler === 'api::blog-category.blog-category.find') {
    return true;
  }

  // Allow blog post operations
  if (route.handler === 'api::blog-post.blog-post.create') {
    return true;
  }

  if (route.handler === 'api::blog-post.blog-post.find') {
    return true;
  }

  if (route.handler === 'api::blog-post.blog-post.findOne') {
    return true;
  }

  return true;
};
