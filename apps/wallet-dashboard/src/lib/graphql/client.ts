import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://104.248.245.150:4000/graphql';

// HTTP Link
const httpLink = createHttpLink({
  uri: API_URL,
});

// Auth Link - adds token to headers
const authLink = setContext((_, { headers }) => {
  const token = Cookies.get('healthpay_token') || localStorage.getItem('healthpay_token');
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error handling link
const errorLink = new ApolloLink((operation, forward) => {
  return forward(operation).map((response) => {
    if (response.errors) {
      response.errors.forEach((error) => {
        console.error('[GraphQL Error]:', error.message);
        
        // Handle authentication errors
        if (error.message.includes('Unauthorized') || error.message.includes('jwt expired')) {
          // Clear tokens and redirect to login
          Cookies.remove('healthpay_token');
          localStorage.removeItem('healthpay_token');
          localStorage.removeItem('healthpay_user');
          
          if (typeof window !== 'undefined') {
            window.location.href = '/ar/auth/login';
          }
        }
      });
    }
    return response;
  });
});

// Apollo Client instance
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Merge paginated results
          transactionsByWallet: {
            keyArgs: ['walletId'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
          billPaymentHistory: {
            keyArgs: ['userId'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
      Wallet: {
        keyFields: ['id'],
      },
      Transaction: {
        keyFields: ['id'],
      },
      User: {
        keyFields: ['id'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

// Helper to clear cache
export const clearApolloCache = () => {
  apolloClient.clearStore();
};

export default apolloClient;
