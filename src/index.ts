// ./src/index.ts - Enhanced main client class with WebSocket support
import { createGraphqlRequest } from "./graphqlRequest";
import { createExecuteGraphQL } from "./executeGraphQL";
import { GraphQLClientConfig, Logger, SubscriptionOptions } from "./types";
import { GraphQLWebSocketClient } from "./websocketClient";

export * from "./types";
export * from "./utils/fileUpload";
export { GraphQLWebSocketClient } from "./websocketClient";

export class GraphQLClient {
  private apiUrl?: string;
  private apiKey?: string;
  private logger?: Logger;
  private wsClient?: GraphQLWebSocketClient;
  private wsUrl?: string;
  private wsHeaders?: Record<string, string>;
  private wsProtocols?: string | string[];
  headers?: Record<string, string>;

  constructor(config: GraphQLClientConfig = {}) {
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.headers = config.headers;
    this.logger = config.logger;
    this.wsUrl = config.wsUrl;
    this.wsHeaders = config.wsHeaders;
    this.wsProtocols = config.wsProtocols;
  }

  public graphqlRequest = createGraphqlRequest(
    this.apiKey,
    this.logger,
    this.headers
  );

  public executeGraphQL = () => {
    return createExecuteGraphQL(this.apiUrl, this.apiKey, this.logger);
  };

  private getWebSocketClient(): GraphQLWebSocketClient {
    if (!this.wsClient) {
      if (!this.wsUrl) {
        // Try to derive WebSocket URL from HTTP URL
        if (this.apiUrl) {
          const url = new URL(this.apiUrl);
          url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
          this.wsUrl = url.toString();
        } else {
          throw new Error("WebSocket URL is required for subscriptions");
        }
      }

      // Prepare connection parameters with headers
      const connectionParams: Record<string, unknown> = {};

      // Add API key if available
      if (this.apiKey) {
        connectionParams.authorization = `Bearer ${this.apiKey}`;
      }

      // Add custom headers
      if (this.wsHeaders) {
        Object.assign(connectionParams, this.wsHeaders);
      }

      // Add default headers
      if (this.headers) {
        Object.assign(connectionParams, this.headers);
      }

      this.wsClient = new GraphQLWebSocketClient(
        this.wsUrl,
        connectionParams,
        this.wsProtocols,
        this.logger
      );
    }

    return this.wsClient;
  }

  public async subscribe(options: SubscriptionOptions): Promise<() => void> {
    const wsClient = this.getWebSocketClient();
    return await wsClient.subscribe(options);
  }

  public closeWebSocket() {
    if (this.wsClient) {
      this.wsClient.close();
      this.wsClient = undefined;
    }
  }

  public reconnectWebSocket() {
    if (this.wsClient) {
      this.wsClient.reconnect();
    }
  }

  public isWebSocketConnected(): boolean {
    return this.wsClient?.isConnected() ?? false;
  }

  public updateWebSocketAuth(token: string) {
    if (this.wsClient) {
      this.wsClient.updateConnectionParams({
        authorization: `Bearer ${token}`,
      });
      this.wsClient.reconnect();
    }
  }
}

// Create default instances with environment variables
const DEFAULT_API_URL =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_GRAPHQL_API_URL
    : undefined;
const DEFAULT_API_KEY =
  typeof process !== "undefined" ? process.env.API_KEY : undefined;
const DEFAULT_WS_URL =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_GRAPHQL_WS_URL
    : undefined;

export const graphqlRequest = createGraphqlRequest(DEFAULT_API_KEY);
export const executeGraphQL = createExecuteGraphQL(
  DEFAULT_API_URL,
  DEFAULT_API_KEY
);

// Default client instance
export const defaultGraphQLClient = new GraphQLClient({
  apiUrl: DEFAULT_API_URL,
  apiKey: DEFAULT_API_KEY,
  wsUrl: DEFAULT_WS_URL,
});
