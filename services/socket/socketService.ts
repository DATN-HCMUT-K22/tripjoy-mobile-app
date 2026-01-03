import { io, Socket } from "socket.io-client";
import { EXPO_PUBLIC_API_URL } from "@/config/env";
import { storage } from "@/utils/storage";
import { store } from "@/store";

// Interface cho Socket.IO events
export interface ServerToClientEvents {
  receive_message: (message: ChatMessageResponse) => void;
  user_typing: (userId: string) => void;
  error: (error: ErrorResponse) => void;
}

export interface ClientToServerEvents {
  join_conversation: (conversationId: string) => void;
  typing: (conversationId: string) => void;
}

export interface ErrorResponse {
  type: string;
  message: string;
  timestamp: number;
}

export interface ChatMessageResponse {
  id: string;
  messageContent: string;
  senderId: string;
  conversationId: string;
  messageType: string;
  createdAt: string;
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Kết nối với Socket.IO server
   */
  async connect(): Promise<void> {
    // Tránh kết nối nhiều lần
    if (this.socket?.connected || this.isConnecting) {
      console.log("Socket already connected or connecting");
      return;
    }

    try {
      this.isConnecting = true;

      // Lấy token và user info từ Redux hoặc storage
      const state = store.getState();
      const accessToken = state.auth.accessToken || (await storage.getAccessToken());
      const userId = state.auth.user?.id;

      if (!accessToken) {
        throw new Error("No access token found. Please login first.");
      }

      if (!userId) {
        throw new Error("No user ID found. Please login first.");
      }

      // Parse API URL để lấy base URL (bỏ /api/v1)
      const baseUrl = EXPO_PUBLIC_API_URL.replace(/\/api\/v1$/, "");
      
      // Tạo WebSocket URL từ HTTP URL
      let socketUrl: string;
      if (baseUrl.startsWith("https://")) {
        socketUrl = baseUrl.replace("https://", "wss://");
      } else if (baseUrl.startsWith("http://")) {
        socketUrl = baseUrl.replace("http://", "ws://");
      } else {
        throw new Error("Invalid API URL format");
      }

      // Parse host và port
      const urlParts = socketUrl.split(":");
      const protocol = urlParts[0]; // ws hoặc wss
      const host = urlParts[1]?.replace("//", "") || "localhost";
      const httpPort = urlParts[2]?.split("/")[0] || "8080";
      
      // Socket.IO chạy trên port 8085
      const socketPort = "8085";
      const connectUrl = `${protocol}//${host}:${socketPort}`;

      console.log("Connecting to Socket.IO server:", connectUrl);
      console.log("Token:", accessToken.substring(0, 20) + "...");
      console.log("User ID:", userId);

      // Tạo socket connection với query params
      this.socket = io(connectUrl, {
        query: {
          token: accessToken,
          userId: userId,
        },
        transports: ["websocket"], // Chỉ dùng WebSocket, không fallback polling
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
      });

      // Setup event listeners
      this.setupEventListeners();

      // Đợi kết nối thành công
      await new Promise<void>((resolve, reject) => {
        if (!this.socket) {
          reject(new Error("Socket is null"));
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 20000);

        this.socket.on("connect", () => {
          clearTimeout(timeout);
          console.log("✅ Socket.IO connected:", this.socket?.id);
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        });

        this.socket.on("connect_error", (error) => {
          clearTimeout(timeout);
          console.error("❌ Socket.IO connection error:", error);
          this.isConnecting = false;
          reject(error);
        });
      });
    } catch (error) {
      this.isConnecting = false;
      console.error("Failed to connect to Socket.IO:", error);
      throw error;
    }
  }

  /**
   * Setup các event listeners cơ bản
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Kết nối thành công
    this.socket.on("connect", () => {
      console.log("Socket.IO connected:", this.socket?.id);
      this.reconnectAttempts = 0;
    });

    // Ngắt kết nối
    this.socket.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected:", reason);

      // Nếu disconnect do lỗi, thử reconnect
      if (reason === "io server disconnect") {
        // Server force disconnect, không reconnect tự động
        console.log("Server force disconnected");
      } else if (reason === "io client disconnect") {
        // Client tự disconnect, không reconnect
        console.log("Client disconnected");
      } else {
        // Lỗi khác, sẽ tự động reconnect
        console.log("Connection lost, will reconnect...");
      }
    });

    // Lỗi kết nối
    this.socket.on("connect_error", (error) => {
      this.reconnectAttempts++;
      console.error("Socket.IO connection error:", error.message);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
        this.disconnect();
      }
    });

    // Lỗi từ server
    this.socket.on("error", (error: ErrorResponse) => {
      console.error("Socket.IO server error:", error);
    });
  }

  /**
   * Ngắt kết nối
   */
  disconnect(): void {
    if (this.socket) {
      console.log("Disconnecting Socket.IO...");
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Lấy socket instance (để dùng trong components)
   */
  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  /**
   * Join vào conversation room
   */
  joinConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Cannot join conversation.");
      return;
    }

    console.log("Joining conversation:", conversationId);
    this.socket.emit("join_conversation", conversationId);
  }

  /**
   * Leave conversation room
   */
  leaveConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    // Socket.IO không có built-in leave event
    // Server sẽ tự động remove client khỏi room khi disconnect
    console.log("Leaving conversation:", conversationId);
  }

  /**
   * Gửi typing indicator
   */
  sendTyping(conversationId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit("typing", conversationId);
  }

  /**
   * Listen event: Nhận message mới
   */
  onReceiveMessage(callback: (message: ChatMessageResponse) => void): void {
    if (!this.socket) {
      console.warn("Socket not initialized");
      return;
    }

    this.socket.on("receive_message", callback);
  }

  /**
   * Listen event: User đang typing
   */
  onUserTyping(callback: (userId: string) => void): void {
    if (!this.socket) {
      console.warn("Socket not initialized");
      return;
    }

    this.socket.on("user_typing", callback);
  }

  /**
   * Remove listener: receive_message
   */
  offReceiveMessage(callback?: (message: ChatMessageResponse) => void): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off("receive_message", callback);
    } else {
      this.socket.off("receive_message");
    }
  }

  /**
   * Remove listener: user_typing
   */
  offUserTyping(callback?: (userId: string) => void): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off("user_typing", callback);
    } else {
      this.socket.off("user_typing");
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();



