# GraphQL Client

A simple and lightweight GraphQL client for making requests in JavaScript/TypeScript applications.

## Installation

```bash
npm install @untools/gql-client
# or
yarn add @untools/gql-client
```

## Usage

### Basic usage

```typescript
import { executeGraphQL } from '@untools/gql-client';

const GET_USER_QUERY = `#graphql
  query GetUser($id: ID!) {
    getUser(id: $id) {
      id
      name
      email
    }
  }
`;

const getUser = async (userId: string) => {
  return executeGraphQL({
    query: GET_USER_QUERY,
    variables: { id: userId },
    url: 'https://your-api-url.com/graphql',
    headers: {
      'auth-token': 'your-auth-token'
    }
  });
};
```

### Using the GraphQLClient class

```typescript
import { GraphQLClient } from '@untools/gql-client';

const client = new GraphQLClient({
  apiUrl: 'https://your-api-url.com/graphql',
  apiKey: 'your-api-key'
});

const GET_USER_QUERY = `#graphql
  query GetUser($id: ID!) {
    getUser(id: $id) {
      id
      name
      email
    }
  }
`;

const getUser = async (userId: string, token: string) => {
  return client.executeGraphQL({
    query: GET_USER_QUERY,
    variables: { id: userId },
    headers: {
      'auth-token': token
    }
  });
};
```

### Custom logger

```typescript
import { GraphQLClient } from '@untools/gql-client';

const client = new GraphQLClient({
  apiUrl: 'https://your-api-url.com/graphql',
  apiKey: 'your-api-key',
  logger: {
    log: (...args) => console.log('[GraphQL Client]', ...args),
    error: (...args) => console.error('[GraphQL Client]', ...args)
  }
});
```

## API Reference

### GraphQLClient

```typescript
new GraphQLClient(config: GraphQLClientConfig)
```

#### GraphQLClientConfig

- `apiUrl`: Default GraphQL API URL
- `apiKey`: Default API key
- `logger`: Custom logger object with `log` and `error` methods

### executeGraphQL

```typescript
executeGraphQL<TResponse, TVariables>({
  query: string,
  variables: TVariables,
  headers?: Record<string, string>,
  url?: string
}): Promise<TResponse>
```

### graphqlRequest

```typescript
graphqlRequest<T>(
  url: string,
  options: GraphQLRequestOptions,
  headers?: Record<string, string>,
  apiKey?: string
): Promise<GraphQLResponse<T>>
```

## License

MIT
