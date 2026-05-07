import { io, Socket } from "socket.io-client";
import { EXPO_PUBLIC_API_URL } from "@/config/env";
import { store } from "@/store";
import { storage } from "@/utils/storage";
import { setConnectionStatus } from "@/store/slices/conversationSlice";
import { handleRefreshToken } from "@/services/http/client";

// Define event interfaces for better type safety
export interface ServerToClientEvents {
  receive_message: (message: any) => void;
  notification: (notification: any) => void;
  new_conversation: (payload: any) => void;
  user_typing: (userId: string) => void;
  user_stop_typing: (userId: string) => void;
  update_like: (messageId: string, userId: string, isLiked: boolean) => void;
  update_pin: (messageId: string, userId: string, isPinned: boolean) => void;
  error: (error: any) => void;
}

export interface ClientToServerEvents {
  join_conversation: (conversationId: string) => void;
  leave_conversation: (conversationId: string) => void;
  join_room: (room: string) => void;
  leave_room: (room: string) => void;
  send_message: (message: any) => void;
  typing: (conversationId: string) => void;
  stop_typing: (conversationId: string) => void;
}

export interface NotificationObject {
  id: string;
  title: string;
  message: string;
  data?: any;
  type?: string;
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private authRetryCount = 0; 
  private maxReconnectAttempts = Infinity;
  private currentToken: string | null = null;

  /**
   * Kết nối với Socket.IO server
   */
  async connect(): Promise<void> {
    // Lấy token và user info mới nhất từ Store/Storage
    const state = store.getState();
    const accessToken = state.auth.accessToken || (await storage.getAccessToken());
    const userId = state.auth.user?.id;

    // NẾU KHÔNG CÓ TOKEN: Ngừng ngay
    if (!accessToken || !userId) {
      console.warn("⚠️ [SOCKET] Connection aborted: No access token or userId found.");
      this.isConnecting = false;
      store.dispatch(setConnectionStatus('disconnected'));
      return;
    }

    // TRƯỜNG HỢP TOKEN THAY ĐỔI (Ví dụ: sau khi Refresh Token từ HTTP request)
    if (this.socket && this.currentToken !== accessToken) {
      console.log("🔄 [SOCKET] Token changed, updating socket configuration...");
      this.currentToken = accessToken;
      this.socket.io.opts.query = { 
        ...this.socket.io.opts.query, 
        token: accessToken 
      };
      
      // Nếu đang kết nối, force reconnect với token mới
      if (this.socket.connected) {
        // socket.io-client sẽ tự dùng opts mới khi reconnect
        this.socket.disconnect().connect();
      }
      return;
    }

    // Tránh kết nối nhiều lần khi đã connected và token không đổi
    if (this.socket?.connected) {
      return;
    }

    // Nếu đang có một tiến trình kết nối diễn ra, hãy đợi nó
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Khởi tạo tiến trình kết nối mới
    this.connectionPromise = (async () => {
      try {
        this.isConnecting = true;
        this.currentToken = accessToken;

        // Cleanup existing socket before creating a new one to prevent zombie connections
        if (this.socket) {
          console.log("[SOCKET] Cleaning up existing socket instance...");
          this.socket.removeAllListeners();
          this.socket.disconnect();
          this.socket = null;
        }

        const baseUrl = EXPO_PUBLIC_API_URL.replace(/\/api\/v1$/, "");
        const apiUrl = new URL(baseUrl);
        const socketProtocol = apiUrl.protocol === "https:" ? "https" : "http";
        const host = apiUrl.hostname;
        const socketPort = "8085";
        const connectUrl = `${socketProtocol}://${host}:${socketPort}`;

        console.log(`[SOCKET] Connecting to: ${connectUrl}`);
        console.log(`[SOCKET] User ID: ${userId}`);
        console.log(`[SOCKET] Token Preview: ${accessToken.substring(0, 15)}...`);

        // Khởi tạo socket
        this.socket = io(connectUrl, {
          query: {
            token: accessToken,
            userId: userId,
          },
          transports: ["websocket"], // Skip polling for better performance and to avoid XHR polling errors
          forceNew: true,
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 10000,
          reconnectionAttempts: 5,
          timeout: 20000,
        });

        // Setup event listeners
        this.setupEventListeners();

        // Đợi kết nối thành công
        await new Promise<void>((resolve, reject) => {
          if (!this.socket) return reject(new Error("Socket is null"));

          const timeoutId = setTimeout(() => {
            reject(new Error("Connection timeout"));
          }, 25000);

          this.socket.on("connect", () => {
            clearTimeout(timeoutId);
            console.log("✅ [SOCKET] Connected successfully!");
            this.authRetryCount = 0;
            this.isConnecting = false;
            store.dispatch(setConnectionStatus('connected'));
            resolve();
          });

          this.socket.on("connect_error", async (error) => {
            console.error("❌ [SOCKET] Connect Error:", error.message);
            
            const isAuthError = this.checkIsAuthError(error);
            if (isAuthError) {
              if (this.authRetryCount < 3) {
                console.log(`⚠️ [SOCKET] Auth failed (attempt ${this.authRetryCount + 1}), refreshing token...`);
                try {
                  this.authRetryCount++;
                  const newToken = await handleRefreshToken();
                  if (this.socket) {
                    this.currentToken = newToken;
                    this.socket.io.opts.query = { ...this.socket.io.opts.query, token: newToken };
                    this.socket.connect();
                    return; 
                  }
                } catch (refreshError) {
                  console.error("❌ [SOCKET] Token refresh failed:", refreshError);
                }
              } else {
                console.error("⛔ [SOCKET] Fatal Auth Error: Giving up to avoid server spam.");
                this.socket?.disconnect();
                this.isConnecting = false;
                store.dispatch(setConnectionStatus('disconnected'));
                clearTimeout(timeoutId);
                reject(error);
                return;
              }
            }
          });
        });
      } catch (error: any) {
        this.isConnecting = false;
        console.error("❌ [SOCKET] Connection failed:", error.message);
        throw error;
      } finally {
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("disconnect", (reason) => {
      console.log(`⚠️ [SOCKET] Disconnected. Reason: ${reason}`);
      store.dispatch(setConnectionStatus('disconnected'));
      
      if (reason === "io server disconnect") {
        console.warn("[SOCKET] Server kicked the client. Manual reconnect might be required.");
      }
    });

    this.socket.on("error", (error) => {
      console.error("[SOCKET] Global Error:", error);
    });
  }

  private checkIsAuthError(error: any): boolean {
    const msg = error.message?.toLowerCase() || "";
    return (
      msg.includes("unauthorized") || 
      msg.includes("login") || 
      msg.includes("auth") ||
      msg.includes("token") ||
      msg.includes("need to login")
    );
  }

  joinRoom(room: string): void {
    if (this.socket?.connected) {
      this.socket.emit("join_room", room);
    }
  }

  leaveRoom(room: string): void {
    if (this.socket?.connected) {
      this.socket.emit("leave_room", room);
    }
  }

  /**
   * Gửi sự kiện đang soạn tin nhắn
   */
  sendTyping(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("typing", conversationId);
    }
  }

  /**
   * Gửi sự kiện dừng soạn tin nhắn
   */
  sendStopTyping(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("stop_typing", conversationId);
    }
  }

  /**
   * Gửi tin nhắn qua socket (nếu BE hỗ trợ)
   */
  sendMessage(message: any): void {
    if (this.socket?.connected) {
      console.log(`\n📤 [SOCKET] Emitting send_message:`, JSON.stringify(message, null, 2));
      this.socket.emit("send_message", message);
    } else {
      console.warn("⚠️ [SOCKET] Cannot emit send_message: socket not connected");
    }
  }

  joinConversation(conversationId: string): void {
    if (this.socket?.connected) {
      console.log(`\n🏠 [SOCKET] Joining conversation: ${conversationId}`);
      this.socket.emit("join_conversation", conversationId);
    }
  }

  leaveConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("leave_conversation", conversationId);
    }
  }

  onReceiveMessage(callback: (message: any) => void): void {
    this.socket?.on("receive_message", (message) => {
      console.log("\n📥 [SOCKET] Received message:", JSON.stringify(message, null, 2));
      callback(message);
    });
  }

  offReceiveMessage(callback: (message: any) => void): void {
    this.socket?.off("receive_message", callback);
  }

  onNotification(callback: (notification: any) => void): void {
    this.socket?.on("notification", callback);
  }

  offNotification(callback: (notification: any) => void): void {
    this.socket?.off("notification", callback);
  }

  onNewConversation(callback: (payload: any) => void): void {
    this.socket?.on("new_conversation", callback);
  }

  offNewConversation(callback: (payload: any) => void): void {
    this.socket?.off("new_conversation", callback);
  }

  onUserTyping(callback: (userId: string) => void): void {
    this.socket?.on("user_typing", callback);
  }

  offUserTyping(callback: (userId: string) => void): void {
    this.socket?.off("user_typing", callback);
  }

  onUserStopTyping(callback: (userId: string) => void): void {
    this.socket?.on("user_stop_typing", callback);
  }

  offUserStopTyping(callback: (userId: string) => void): void {
    this.socket?.off("user_stop_typing", callback);
  }

  onUpdateLike(callback: (messageId: string, userId: string, isLiked: boolean) => void): void {
    this.socket?.on("update_like", (messageId, userId, isLiked) => {
      console.log(`\n❤️ [SOCKET] Update like: messageId=${messageId}, userId=${userId}, isLiked=${isLiked}`);
      callback(messageId, userId, isLiked);
    });
  }

  offUpdateLike(callback: (messageId: string, userId: string, isLiked: boolean) => void): void {
    this.socket?.off("update_like", callback);
  }

  onUpdatePin(callback: (messageId: string, userId: string, isPinned: boolean) => void): void {
    this.socket?.on("update_pin", (messageId, userId, isPinned) => {
      console.log(`\n📌 [SOCKET] Update pin: messageId=${messageId}, userId=${userId}, isPinned=${isPinned}`);
      callback(messageId, userId, isPinned);
    });
  }

  offUpdatePin(callback: (messageId: string, userId: string, isPinned: boolean) => void): void {
    this.socket?.off("update_pin", callback);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.authRetryCount = 0;
      this.currentToken = null;
      this.connectionPromise = null;
      store.dispatch(setConnectionStatus('disconnected'));
      console.log("[SOCKET] Disconnected manually.");
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
