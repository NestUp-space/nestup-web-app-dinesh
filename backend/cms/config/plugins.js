module.exports = {
  seo: {
    enabled: true,
  },
  graphql: {
    enabled: true,
    config: {
      playground: true,
      apolloServer: {
        introspection: true,
      },
    },
  },
};
