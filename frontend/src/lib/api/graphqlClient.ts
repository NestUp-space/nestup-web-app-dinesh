import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// When NEXT_PUBLIC_STRAPI_URL is empty: browser uses same-origin /cms, server uses localhost
const graphqlUri =
  process.env.NEXT_PUBLIC_STRAPI_URL
    ? `${process.env.NEXT_PUBLIC_STRAPI_URL.replace(/\/$/, '')}/graphql`
    : typeof window !== 'undefined'
      ? '/cms/graphql'
      : 'http://localhost:1338/graphql';

const httpLink = createHttpLink({
  uri: graphqlUri,
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
