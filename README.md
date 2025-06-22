# @untools/gql-client

A modern, full-featured GraphQL client for JavaScript/TypeScript applications with support for queries, mutations, subscriptions, and file uploads.

## Features

- 🚀 **Simple API** - Easy to use with minimal setup
- 📁 **File Upload Support** - Handle multipart form data for file uploads
- 🔌 **WebSocket Subscriptions** - Real-time GraphQL subscriptions
- 🔄 **Auto-reconnection** - Automatic WebSocket reconnection with exponential backoff
- 🪵 **Custom Logging** - Pluggable logging system
- 🌍 **Environment Variables** - Automatic configuration from environment
- 📦 **TypeScript Support** - Full TypeScript support with type safety
- 🎯 **Lightweight** - Minimal dependencies

## Installation

```bash
npm install @untools/gql-client
# or
yarn add @untools/gql-client
# or
pnpm add @untools/gql-client
```

## Quick Start

### Basic Usage

```typescript
import { executeGraphQL } from '@untools/gql-client';

const GET_USER_QUERY = `#graphql
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

const user = await executeGraphQL({
  query: GET_USER_QUERY,
  variables: { id: "123" },
  url: 'https://api.example.com/graphql',
  headers: {
    'Authorization': 'Bearer your-token'
  }
});
```

### Using the GraphQL Client Class

```typescript
import { GraphQLClient } from '@untools/gql-client';

const client = new GraphQLClient({
  apiUrl: 'https://api.example.com/graphql',
  apiKey: 'your-api-key', // Automatically adds x-api-key header
  wsUrl: 'wss://api.example.com/graphql', // For subscriptions
  headers: {
    'Custom-Header': 'value'
  }
});

// Execute queries/mutations
const result = await client.executeGraphQL()({
  query: GET_USER_QUERY,
  variables: { id: "123" }
});
```

## File Upload Support

The client automatically handles file uploads using multipart form data:

```typescript
const UPLOAD_FILE_MUTATION = `#graphql
  mutation UploadFile($file: Upload!) {
    uploadFile(file: $file) {
      id
      filename
      url
    }
  }
`;

// Single file upload
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
const file = fileInput.files?.[0];

const result = await executeGraphQL({
  query: UPLOAD_FILE_MUTATION,
  variables: { file },
  url: 'https://api.example.com/graphql'
});

// Multiple files
const UPLOAD_MULTIPLE_MUTATION = `#graphql
  mutation UploadMultiple($files: [Upload!]!) {
    uploadMultiple(files: $files) {
      id
      filename
      url
    }
  }
`;

const files = Array.from(fileInput.files || []);
const result = await executeGraphQL({
  query: UPLOAD_MULTIPLE_MUTATION,
  variables: { files },
  url: 'https://api.example.com/graphql'
});

// Using the files option
const result = await executeGraphQL({
  query: UPLOAD_FILE_MUTATION,
  files: file, // or [file1, file2] or FileList
  url: 'https://api.example.com/graphql'
});
```

## WebSocket Subscriptions

### Basic Subscription

```typescript
const client = new GraphQLClient({
  apiUrl: 'https://api.example.com/graphql',
  wsUrl: 'wss://api.example.com/graphql',
  apiKey: 'your-api-key'
});

const MESSAGES_SUBSCRIPTION = `#graphql
  subscription OnMessageAdded($chatId: ID!) {
    messageAdded(chatId: $chatId) {
      id
      content
      user {
        name
      }
      createdAt
    }
  }
`;

const unsubscribe = await client.subscribe({
  query: MESSAGES_SUBSCRIPTION,
  variables: { chatId: "chat-123" },
  onNext: (data) => {
    console.log('New message:', data.messageAdded);
  },
  onError: (error) => {
    console.error('Subscription error:', error);
  },
  onComplete: () => {
    console.log('Subscription completed');
  }
});

// Unsubscribe when done
unsubscribe();
```

### WebSocket Management

```typescript
// Check connection status
const isConnected = client.isWebSocketConnected();

// Manually reconnect
client.reconnectWebSocket();

// Update authentication token
client.updateWebSocketAuth('new-token');

// Close WebSocket connection
client.closeWebSocket();
```

### Using Standalone WebSocket Client

```typescript
import { GraphQLWebSocketClient } from '@untools/gql-client';

const wsClient = new GraphQLWebSocketClient(
  'wss://api.example.com/graphql',
  { authorization: 'Bearer your-token' }, // Connection params
  ['graphql-ws'], // Protocols
  console // Logger
);

const unsubscribe = await wsClient.subscribe({
  query: MESSAGES_SUBSCRIPTION,
  variables: { chatId: "chat-123" },
  onNext: (data) => console.log(data),
  onError: (error) => console.error(error)
});
```

## Environment Variables

The client automatically reads from environment variables:

```env
NEXT_PUBLIC_GRAPHQL_API_URL=https://api.example.com/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=wss://api.example.com/graphql
API_KEY=your-api-key
```

Then use the default instances:

```typescript
import { executeGraphQL, defaultGraphQLClient } from '@untools/gql-client';

// Uses environment variables automatically
const result = await executeGraphQL({
  query: GET_USER_QUERY,
  variables: { id: "123" }
});

// Or use the default client
const subscription = await defaultGraphQLClient.subscribe({
  query: MESSAGES_SUBSCRIPTION,
  variables: { chatId: "chat-123" },
  onNext: (data) => console.log(data)
});
```

## Custom Logging

```typescript
const client = new GraphQLClient({
  apiUrl: 'https://api.example.com/graphql',
  apiKey: 'your-api-key',
  logger: {
    log: (...args) => console.log('[GraphQL]', ...args),
    error: (message, data) => console.error(`[GraphQL Error] ${message}`, data)
  }
});
```

## Advanced Usage

### Error Handling

```typescript
try {
  const result = await executeGraphQL({
    query: GET_USER_QUERY,
    variables: { id: "123" },
    url: 'https://api.example.com/graphql'
  });
} catch (error) {
  if (error.message.includes('User not found')) {
    // Handle specific GraphQL error
  } else {
    // Handle network or other errors
  }
}
```

### Custom Headers per Request

```typescript
const client = new GraphQLClient({
  apiUrl: 'https://api.example.com/graphql',
  headers: {
    'Default-Header': 'value'
  }
});

const result = await client.executeGraphQL()({
  query: GET_USER_QUERY,
  variables: { id: "123" },
  headers: {
    'Request-Specific-Header': 'value',
    'Authorization': 'Bearer different-token' // Override default
  }
});
```

### Direct GraphQL Request

For more control, use the low-level `graphqlRequest` function:

```typescript
import { graphqlRequest } from '@untools/gql-client';

const response = await graphqlRequest({
  url: 'https://api.example.com/graphql',
  options: {
    query: GET_USER_QUERY,
    variables: { id: "123" },
    files: fileList // Optional file uploads
  },
  headers: {
    'Authorization': 'Bearer token'
  },
  apiKey: 'your-api-key'
});

// Handle response.data and response.errors manually
if (response.errors) {
  console.error('GraphQL errors:', response.errors);
} else {
  console.log('Data:', response.data);
}
```

## API Reference

### GraphQLClient

#### Constructor Options

```typescript
interface GraphQLClientConfig {
  apiUrl?: string;           // Default GraphQL endpoint
  apiKey?: string;           // Default API key (adds x-api-key header)
  headers?: Record<string, string>;  // Default headers
  logger?: Logger;           // Custom logger
  wsUrl?: string;            // WebSocket URL for subscriptions
  wsHeaders?: Record<string, string>; // WebSocket-specific headers
  wsProtocols?: string | string[];    // WebSocket protocols
}
```

#### Methods

- `executeGraphQL()` - Returns a function to execute GraphQL operations
- `subscribe(options)` - Create a GraphQL subscription
- `graphqlRequest(params)` - Low-level GraphQL request
- `closeWebSocket()` - Close WebSocket connection
- `reconnectWebSocket()` - Reconnect WebSocket
- `isWebSocketConnected()` - Check WebSocket connection status
- `updateWebSocketAuth(token)` - Update WebSocket authentication

### Functions

#### executeGraphQL

```typescript
executeGraphQL<TResponse, TVariables>({
  query: string;
  variables?: TVariables;
  headers?: Record<string, string>;
  url?: string;
  files?: File[] | FileList | File;
}): Promise<TResponse>
```

#### graphqlRequest

```typescript
graphqlRequest<T>({
  url: string;
  options: {
    query: string;
    variables?: Record<string, unknown>;
    files?: File[] | FileList | File;
  };
  headers?: Record<string, string>;
  apiKey?: string;
}): Promise<GraphQLResponse<T>>
```

### Types

```typescript
interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: { line: number; column: number }[];
    path?: string[];
    extensions?: Record<string, any>;
  }>;
}

interface SubscriptionOptions {
  query: string;
  variables?: Record<string, unknown>;
  onNext?: (data: any) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

interface Logger {
  log: (...args: any[]) => void;
  error: (message: string, data?: any) => void;
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.
