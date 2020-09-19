import React from 'react';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
};

const withApolloProvider = (Story, context) => {
  const client = new ApolloClient({
    uri: 'http://localhost:4000',
    cache: new InMemoryCache(),
  });
  return (
    <ApolloProvider client={client}>
      <Story {...context} />
    </ApolloProvider>
  );
};

export const decorators = [withApolloProvider];
