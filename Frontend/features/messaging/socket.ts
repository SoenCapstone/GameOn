import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import { createScopedLog } from "@/utils/logger";
import { isDevelopment } from "@/utils/runtime";
import { MessageResponse, SendMessagePayload } from "./types";

export type SocketState = "idle" | "connecting" | "connected" | "error";

const log = createScopedLog("MessagingSocket");

export interface MessagingSocketOptions {
  getToken: () => Promise<string | null>;
  onMessage: (message: MessageResponse) => void;
  onStateChange?: (state: SocketState) => void;
}

export class MessagingSocket {
  private client: Client | null = null;
  private readonly getToken: () => Promise<string | null>;
  private readonly onMessage: (message: MessageResponse) => void;
  private readonly onStateChange?: (state: SocketState) => void;
  private readonly wsBaseUrl: string;
  private currentWsUrl: string | null = null;
  private currentConnectHeaders: Record<string, string> = {};
  private userSubscription: StompSubscription | null = null;
  private conversationSubscriptions = new Map<string, StompSubscription>();
  private desiredConversationIds = new Set<string>();
  private state: SocketState = "idle";

  constructor(options: MessagingSocketOptions) {
    this.getToken = options.getToken;
    this.onMessage = options.onMessage;
    this.onStateChange = options.onStateChange;
    const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
    if (!base) {
      throw new Error("Missing EXPO_PUBLIC_API_BASE_URL for messaging socket");
    }
    let baseUrl = base;
    while (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }
    this.wsBaseUrl = baseUrl;
  }

  private setState(next: SocketState) {
    if (this.state !== next) {
      this.state = next;
      this.onStateChange?.(next);
    }
  }

  get currentState(): SocketState {
    return this.state;
  }

  async connect() {
    if (this.state === "connecting") {
      log.debug("Connect requested while already connecting");
      return;
    }
    if (this.state === "connected" && this.client?.connected) {
      log.debug("Socket already connected");
      return;
    }
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.setState("connecting");
    this.client = new Client({
      debug: (msg) => log.info(`[STOMP] ${msg}`),
      reconnectDelay: 15000,
      heartbeatOutgoing: 0,
      heartbeatIncoming: 0,
      connectHeaders: this.currentConnectHeaders,
      beforeConnect: async () => {
        await this.refreshWebSocketUrl();
        log.info("STOMP connect headers", this.currentConnectHeaders);
        if (this.client) {
          this.client.connectHeaders = this.currentConnectHeaders;
        }
      },
      webSocketFactory: () => {
        if (!this.currentWsUrl) {
          throw new Error("WebSocket URL not prepared");
        }
        log.info("Opening WebSocket", {
          url: this.redactUrl(this.currentWsUrl),
        });
    this.client.binaryWSFrames = true;
    this.client.forceBinaryWSFrames = true;

        const socket = new WebSocket(this.currentWsUrl, "v12.stomp");
        socket.onclose = (event) => {
          log.warn("WebSocket closed", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });
        };
        socket.onerror = (event) => {
          log.warn(
            "WebSocket error",
            typeof event === "string" ? event : JSON.stringify(event),
          );
        };

        return socket as unknown as WebSocket;
      },
      onConnect: () => {
        log.info("WebSocket connected");
        this.setState("connected");
        this.subscribeUserQueue();
        this.desiredConversationIds.forEach((id) =>
          this.subscribeConversation(id),
        );
      },
      onStompError: (frame) => {
        log.warn("STOMP error", frame.headers["message"], frame.body);
        this.setState("error");
      },
      onWebSocketClose: (event) => {
        log.error("STOMP WebSocket closed", event);
        this.cleanupSubscriptions();
        this.setState("idle");
      },
    });

    this.client.activate();
  }

  private async refreshWebSocketUrl() {
    const token = await this.getToken();
    if (!token) {
      this.setState("error");
      throw new Error("No authentication token available");
    }
    this.currentWsUrl = this.buildWsUrl(token);
    this.currentConnectHeaders = this.buildConnectHeaders(token);
  }

  private buildConnectHeaders(token: string) {
    const url = new URL(this.wsBaseUrl);
    return {
      host: url.hostname,
      Authorization: `Bearer ${token}`,
    };
  }

  private redactUrl(url: string) {
    if (!url.includes("token=")) {
      return url;
    }
    return url.replace(/token=[^&]+/, "token=***");
  }

  private buildWsUrl(token?: string) {
    const wsBase = this.wsBaseUrl.replace(/^http/i, "ws");
    if (!token) {
      return `${wsBase}/api/v1/messaging/ws`;
    }
    return `${wsBase}/api/v1/messaging/ws?token=${encodeURIComponent(token)}`;
  }



  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.cleanupSubscriptions();
    this.setState("idle");
  }

  private cleanupSubscriptions() {
    this.userSubscription?.unsubscribe();
    this.userSubscription = null;
    this.conversationSubscriptions.forEach((sub) => sub.unsubscribe());
    this.conversationSubscriptions.clear();
  }

  private subscribeUserQueue() {
    if (!this.client || !this.client.connected || this.userSubscription) {
      return;
    }
    this.userSubscription = this.client.subscribe(
      "/user/queue/messages",
      (message) => this.handleInboundMessage(message),
    );
  }

  ensureConversationSubscription(conversationId: string) {
    this.desiredConversationIds.add(conversationId);
    this.subscribeConversation(conversationId);
  }

  private subscribeConversation(conversationId: string) {
    if (!this.client || !this.client.connected) {
      return;
    }
    if (this.conversationSubscriptions.has(conversationId)) {
      return;
    }
    const destination = `/topic/chatrooms/${conversationId}`;
    const subscription = this.client.subscribe(destination, (message) =>
      this.handleInboundMessage(message),
    );
    this.conversationSubscriptions.set(conversationId, subscription);
  }

  private handleInboundMessage(frame: IMessage) {
    try {
      const payload = JSON.parse(frame.body) as MessageResponse;
      if (isDevelopment) {
        log.debug(`Message received for ${payload.conversationId}`);
      } else {
        log.debug("Message received", { conversationId: payload.conversationId });
      }
      this.onMessage(payload);
    } catch (err) {
      log.warn("Failed to parse inbound message", err);
    }
  }

  async sendMessage(payload: SendMessagePayload) {
    if (!this.client || !this.client.connected) {
      throw new Error("WebSocket not connected");
    }
    this.client.publish({
      destination: "/app/messages/send",
      body: JSON.stringify(payload), 
    });
  }
}
