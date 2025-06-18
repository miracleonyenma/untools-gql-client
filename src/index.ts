// ./src/index.ts - Main client class (unchanged, but now supports file uploads)
import { createGraphqlRequest } from "./graphqlRequest";
import { createExecuteGraphQL } from "./executeGraphQL";
import { GraphQLClientConfig, Logger } from "./types";

export * from "./types";
export * from "./utils/fileUpload";

export class GraphQLClient {
  private apiUrl?: string;
  private apiKey?: string;
  private logger?: Logger;
  headers?: Record<string, string>;

  constructor(config: GraphQLClientConfig = {}) {
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.headers = config.headers;
    this.logger = config.logger;
  }

  public graphqlRequest = createGraphqlRequest(this.apiKey, this.logger);

  public executeGraphQL = () => {
    return createExecuteGraphQL(this.apiUrl, this.apiKey, this.logger);
  };
}

// Create default instances with environment variables
const DEFAULT_API_URL =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_GRAPHQL_API_URL
    : undefined;
const DEFAULT_API_KEY =
  typeof process !== "undefined" ? process.env.API_KEY : undefined;

export const graphqlRequest = createGraphqlRequest(DEFAULT_API_KEY);
export const executeGraphQL = createExecuteGraphQL(
  DEFAULT_API_URL,
  DEFAULT_API_KEY
);
