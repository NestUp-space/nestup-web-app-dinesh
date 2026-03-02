import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// Fallback to same-origin so the app doesn't break when env is missing (e.g. local dev)
const strapiUrl =
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');
const httpLink = createHttpLink({
  uri: strapiUrl ? `${strapiUrl.replace(/\/$/, '')}/graphql` : '/graphql',
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_TOKEN}`,
    }
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          blogPosts: {
            keyArgs: ['filters', 'sort'],
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
      BlogPost: {
        keyFields: ['documentId'],
      },
    },
  }),
});
