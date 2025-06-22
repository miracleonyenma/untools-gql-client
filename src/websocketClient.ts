import { Logger, SubscriptionOptions } from "./types";

// ./src/websocketClient.ts - WebSocket client implementation
export class GraphQLWebSocketClient {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private protocols?: string | string[];
  private connectionParams: Record<string, unknown>;
  private subscriptions = new Map<string, SubscriptionOptions>();
  private messageId = 0;
  private isConnecting = false;
  private shouldReconnect = true;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private logger?: Logger;
  private pingInterval?: NodeJS.Timeout;
  private connectionPromise?: Promise<void>;

  constructor(
    wsUrl: string,
    connectionParams: Record<string, unknown> = {},
    protocols?: string | string[],
    logger?: Logger
  ) {
    this.wsUrl = wsUrl;
    this.protocols = protocols;
    this.connectionParams = connectionParams;
    this.logger = logger;
  }

  private async connect(): Promise<void> {
    if (
      this.isConnecting ||
      (this.ws && this.ws.readyState === WebSocket.OPEN)
    ) {
      return this.connectionPromise || Promise.resolve();
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl, this.protocols);

        this.ws.onopen = () => {
          this.logger?.log("WebSocket connected");
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          // Send connection init message
          this.send({
            type: "connection_init",
            payload: this.connectionParams,
          });

          // Start ping interval
          this.startPing();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onclose = (event) => {
          this.logger?.log("WebSocket closed:", event.code, event.reason);
          this.isConnecting = false;
          this.stopPing();

          if (
            this.shouldReconnect &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          this.logger?.error("WebSocket error:", error);
          this.isConnecting = false;
          reject(new Error("WebSocket connection failed"));
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case "connection_ack":
        this.logger?.log("Connection acknowledged");
        break;

      case "ping":
        this.send({ type: "pong" });
        break;

      case "pong":
        // Pong received
        break;

      case "next":
        const subscription = this.subscriptions.get(message.id);
        if (subscription?.onNext) {
          subscription.onNext(message.payload);
        }
        break;

      case "error":
        const errorSub = this.subscriptions.get(message.id);
        if (errorSub?.onError) {
          errorSub.onError(
            new Error(message.payload.message || "Subscription error")
          );
        }
        break;

      case "complete":
        const completeSub = this.subscriptions.get(message.id);
        if (completeSub?.onComplete) {
          completeSub.onComplete();
        }
        this.subscriptions.delete(message.id);
        break;

      default:
        this.logger?.log("Unknown message type:", message.type);
    }
  }

  private send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      this.send({ type: "ping" });
    }, 30000); // Ping every 30 seconds
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.logger?.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect().catch(() => {
          // Connection failed, will try again if under max attempts
        });
      }
    }, delay);
  }

  public async subscribe(options: SubscriptionOptions): Promise<() => void> {
    await this.connect();

    const id = (++this.messageId).toString();
    this.subscriptions.set(id, options);

    this.send({
      id,
      type: "start",
      payload: {
        query: options.query,
        variables: options.variables,
      },
    });

    // Return unsubscribe function
    return () => {
      this.send({
        id,
        type: "stop",
      });
      this.subscriptions.delete(id);
    };
  }

  public close() {
    this.shouldReconnect = false;
    this.stopPing();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.subscriptions.clear();
  }

  public reconnect() {
    this.close();
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.connect();
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public updateConnectionParams(params: Record<string, unknown>) {
    this.connectionParams = { ...this.connectionParams, ...params };
  }
}
