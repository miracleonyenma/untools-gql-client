// ./src/types.ts

export interface GraphQLClientConfig {
  apiUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  logger?: Logger;
  wsUrl?: string; // WebSocket URL for subscriptions
  wsHeaders?: Record<string, string>; // Headers for WebSocket connection
  wsProtocols?: string | string[]; // WebSocket protocols
}

export interface GraphQLRequestOptions {
  query: string;
  variables?: Record<string, unknown>;
  files?: File[] | FileList | File;
}

export interface GraphQLRequestParams<TVariables> {
  query: string;
  variables?: TVariables;
  headers?: Record<string, string>;
  url?: string;
  files?: File[] | FileList | File;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; [key: string]: any }>;
}

export interface Logger {
  log: (...args: any[]) => void;
  error: (message: string, data?: any) => void;
}

export interface GraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
  extensions?: Record<string, any>;
}

export interface GraphQLClientConfig {
  apiUrl?: string;
  apiKey?: string;
  logger?: Logger;
  headers?: Record<string, string>;
}

export interface GraphQLRequestParams<
  TVariables extends Record<string, unknown> | undefined
> {
  query: string;
  variables?: TVariables;
  headers?: { [key: string]: string };
  url?: string;
}

export interface SubscriptionOptions {
  query: string;
  variables?: Record<string, unknown>;
  onNext?: (data: any) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  headers?: Record<string, string>;
}

export interface WebSocketConnection {
  subscribe: (options: SubscriptionOptions) => () => void; // Returns unsubscribe function
  close: () => void;
  reconnect: () => void;
  isConnected: () => boolean;
}
