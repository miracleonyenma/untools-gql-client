export interface GraphQLRequestOptions {
  query: string;
  variables?: Record<string, any>;
}

export interface GraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
  extensions?: Record<string, any>;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

export interface Logger {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

export interface GraphQLClientConfig {
  apiUrl?: string;
  apiKey?: string;
  logger?: Logger;
}

export interface GraphQLRequestParams<
  TVariables extends Record<string, unknown> | undefined
> {
  query: string;
  variables?: TVariables;
  headers?: { [key: string]: string };
  url?: string;
}
