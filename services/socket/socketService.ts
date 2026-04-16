import { EXPO_PUBLIC_API_URL } from "@/config/env";
import { store } from "@/store";
import { ChatMessageResponse, ConversationResponse } from "@/types/message";
import { storage } from "@/utils/storage";
import { io, Socket } from "socket.io-client";

export interface ServerToClientEvents {
  receive_message: (message: ChatMessageResponse) => void;
  user_typing: (payload: string | { userId: string; conversationId?: string }) => void;
  user_stop_typing: (payload: string | { userId: string; conversationId?: string }) => void;
  update_like: (messageId: string, userId: string, isLiked: boolean) => void;
  update_pin: (messageId: string, userId: string, isPinned: boolean) => void;
  notification: (notification: NotificationObject) => void;
  /** Khi được thêm vào hội thoại DIRECT mới */
  new_conversation: (conversation: ConversationResponse) => void;
  error: (error: ErrorResponse) => void;
}

export interface ClientToServerEvents {
  join_conversation: (conversationId: string) => void;
  leave_conversation: (conversationId: string) => void;
  typing: (conversationId: string) => void;
  stop_typing: (conversationId: string) => void;
}

export interface ErrorResponse {
  type: string;
  message: string;
  timestamp: number;
}

export interface NotificationObject {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  created_at: string;
}

// Re-export ChatMessageResponse từ types
export type { ChatMessageResponse };

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  // Callback arrays để quản lý nhiều listeners cho từng event
  private messageCallbacks: Set<(message: ChatMessageResponse) => void> = new Set();
  private typingCallbacks: Set<(userId: string, conversationId?: string) => void> = new Set();
  private stopTypingCallbacks: Set<(userId: string, conversationId?: string) => void> = new Set();
  private likeUpdateCallbacks: Set<
    (messageId: string, userId: string, isLiked: boolean) => void
  > = new Set();
  private pinUpdateCallbacks: Set<
    (messageId: string, userId: string, isPinned: boolean) => void
  > = new Set();
  private notificationCallbacks: Set<(notification: NotificationObject) => void> = new Set();
  private newConversationCallbacks: Set<(conversation: ConversationResponse) => void> = new Set();

  // Flags để đảm bảo chỉ đăng ký socket listener một lần
  private isMessageListenerRegistered = false;
  private isTypingListenerRegistered = false;
  private isStopTypingListenerRegistered = false;
  private isLikeUpdateListenerRegistered = false;
  private isPinUpdateListenerRegistered = false;
  private isNotificationListenerRegistered = false;
  private isNewConversationListenerRegistered = false;

  /**
   * Kết nối với Socket.IO server
   */
  async connect(): Promise<void> {
    // Tránh kết nối nhiều lần
    if (this.socket?.connected || this.isConnecting) {
      console.log("Socket already connected or connecting");
      return;
    }

    let connectUrl = "N/A";
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
      
      if (!baseUrl) {
        throw new Error("EXPO_PUBLIC_API_URL is not set");
      }

      // Sử dụng URL constructor để parse đúng
      let apiUrl: URL;
      try {
        apiUrl = new URL(baseUrl);
      } catch {
        throw new Error(`Invalid API URL format: ${baseUrl}`);
      }

      // Tạo WebSocket URL từ HTTP URL
      // Socket.IO chạy trên port 8085 (theo API doc)
      const protocol = apiUrl.protocol === "https:" ? "wss" : "ws";
      const host = apiUrl.hostname;
      const socketPort = "8085";
      
      // Tạo connect URL
      connectUrl = `${protocol}://${host}:${socketPort}`;

      const timestamp = new Date().toISOString();
      console.log("\n========== SOCKET.IO CONNECTION ==========");
      console.log(`[${timestamp}] Connecting to Socket.IO server`);
      console.log(`Connect URL: ${connectUrl}`);
      console.log(`Base API URL: ${baseUrl}`);
      console.log(`Protocol: ${protocol}`);
      console.log(`Host: ${host}`);
      console.log(`Port: ${socketPort}`);
      console.log(`Token: ${accessToken.substring(0, 20)}...`);
      console.log(`User ID: ${userId}`);
      console.log("==========================================\n");

      // Tạo socket connection với query params
      this.socket = io(connectUrl, {
        query: {
          token: accessToken,
          userId: userId,
        },
        transports: ["websocket", "polling"], // Theo API doc
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
          const timestamp = new Date().toISOString();
          console.log("\n✅ [SOCKET] Connection Success");
          console.log(`[${timestamp}] Socket ID: ${this.socket?.id}`);
          console.log(`Connect URL: ${connectUrl}`);
          console.log("==========================================\n");
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        });

        this.socket.on("connect_error", (error) => {
          clearTimeout(timeout);
          const timestamp = new Date().toISOString();
          console.error("\n❌ [SOCKET] Connection Error");
          console.error(`[${timestamp}] Error Message:`, error.message);
          console.error(`Error Name:`, error.name);
          console.error(`Error Type:`, (error as any).type);
          console.error(`Error Description:`, (error as any).description);
          console.error(`Connect URL:`, connectUrl);
          console.error(`Full Error:`, error);
          console.error("==========================================\n");
          this.isConnecting = false;
          reject(error);
        });
      });
    } catch (error: any) {
      this.isConnecting = false;
      const timestamp = new Date().toISOString();
      console.error("\n❌ [SOCKET] Failed to connect");
      console.error(`[${timestamp}] Error Name:`, error.name);
      console.error(`Error Message:`, error.message);
      console.error(`Error Stack:`, error.stack);
      console.error("==========================================\n");
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
      const timestamp = new Date().toISOString();
      console.log(`\n✅ [SOCKET] Connected [${timestamp}]`);
      console.log(`Socket ID: ${this.socket?.id}`);
      console.log("==========================================\n");
      this.reconnectAttempts = 0;
    });

    // Ngắt kết nối
    this.socket.on("disconnect", (reason) => {
      const timestamp = new Date().toISOString();
      console.log(`\n⚠️ [SOCKET] Disconnected [${timestamp}]`);
      console.log(`Reason: ${reason}`);

      // Nếu disconnect do lỗi, thử reconnect
      if (reason === "io server disconnect") {
        // Server force disconnect, không reconnect tự động
        console.log("Type: Server force disconnected");
      } else if (reason === "io client disconnect") {
        // Client tự disconnect, không reconnect
        console.log("Type: Client disconnected");
      } else {
        // Lỗi khác, sẽ tự động reconnect
        console.log("Type: Connection lost, will reconnect...");
      }
      console.log("==========================================\n");
    });

    // Lỗi kết nối
    this.socket.on("connect_error", (error) => {
      this.reconnectAttempts++;
      const timestamp = new Date().toISOString();
      console.error(`\n❌ [SOCKET] Connection Error [${timestamp}]`);
      console.error(`Attempt: ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      console.error(`Error Message:`, error.message);
      console.error(`Error Name:`, error.name);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached - stopping");
        this.disconnect();
      }
      console.error("==========================================\n");
    });

    // Lỗi từ server
    this.socket.on("error", (error: ErrorResponse) => {
      const timestamp = new Date().toISOString();
      console.error(`\n❌ [SOCKET] Server Error [${timestamp}]`);
      console.error(`Error Type:`, error.type);
      console.error(`Error Message:`, error.message);
      console.error(`Timestamp:`, error.timestamp);
      console.error("==========================================\n");
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
      
      // Reset tất cả callbacks và flags
      this.messageCallbacks.clear();
      this.typingCallbacks.clear();
      this.stopTypingCallbacks.clear();
      this.likeUpdateCallbacks.clear();
      this.pinUpdateCallbacks.clear();
      this.notificationCallbacks.clear();
      this.newConversationCallbacks.clear();
      this.isMessageListenerRegistered = false;
      this.isTypingListenerRegistered = false;
      this.isStopTypingListenerRegistered = false;
      this.isLikeUpdateListenerRegistered = false;
      this.isPinUpdateListenerRegistered = false;
      this.isNotificationListenerRegistered = false;
      this.isNewConversationListenerRegistered = false;
    }
  }

  /**
   * Hội thoại DIRECT mới (BE: `new_conversation` → ConversationResponse)
   */
  onNewConversation(
    callback: (conversation: ConversationResponse) => void
  ): void {
    if (!this.socket) {
      console.warn("\n⚠️ [SOCKET] Cannot listen new_conversation - socket not initialized\n");
      return;
    }

    this.newConversationCallbacks.add(callback);

    if (!this.isNewConversationListenerRegistered) {
      this.isNewConversationListenerRegistered = true;
      this.socket.on("new_conversation", (conversation: ConversationResponse) => {
        this.newConversationCallbacks.forEach((cb) => {
          try {
            cb(conversation);
          } catch (error) {
            console.error("Error in new_conversation callback:", error);
          }
        });
      });
    }
  }

  offNewConversation(
    callback?: (conversation: ConversationResponse) => void
  ): void {
    if (!this.socket) return;

    if (callback) {
      this.newConversationCallbacks.delete(callback);
      if (this.newConversationCallbacks.size === 0 && this.isNewConversationListenerRegistered) {
        this.socket.off("new_conversation");
        this.isNewConversationListenerRegistered = false;
      }
    } else {
      this.newConversationCallbacks.clear();
      if (this.isNewConversationListenerRegistered) {
        this.socket.off("new_conversation");
        this.isNewConversationListenerRegistered = false;
      }
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
    if (!this.socket) {
      console.warn("\n⚠️ [SOCKET] Cannot join conversation - socket not initialized");
      console.warn(`Conversation ID: ${conversationId}`);
      console.warn("==========================================\n");
      return;
    }
    
    if (!this.socket.connected) {
      console.warn("\n⚠️ [SOCKET] Cannot join conversation - not connected");
      console.warn(`Conversation ID: ${conversationId}`);
      console.warn(`Socket ID: ${this.socket.id || "N/A"}`);
      console.warn("==========================================\n");
      return;
    }

    const timestamp = new Date().toISOString();
    console.log(`\n📥 [SOCKET] Joining conversation [${timestamp}]`);
    console.log(`Conversation ID: ${conversationId}`);
    console.log(`Socket ID: ${this.socket.id}`);
    console.log(`Socket connected: ${this.socket.connected}`);
    console.log("==========================================\n");
    this.socket.emit("join_conversation", conversationId);
  }

  /**
   * Leave conversation room
   */
  leaveConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    const timestamp = new Date().toISOString();
    console.log(`\n📤 [SOCKET] Leaving conversation [${timestamp}]`);
    console.log(`Conversation ID: ${conversationId}`);
    console.log("==========================================\n");
    this.socket.emit("leave_conversation", conversationId);
  }

  /**
   * Gửi typing indicator
   */
  sendTyping(conversationId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    // Log ít hơn để tránh spam (chỉ log mỗi 5 lần)
    if (Math.random() < 0.2) {
      console.log(`[SOCKET] Typing: ${conversationId}`);
    }
    this.socket.emit("typing", conversationId);
  }

  /**
   * Gửi stop typing indicator
   */
  sendStopTyping(conversationId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    console.log(`[SOCKET] Stop typing: ${conversationId}`);
    this.socket.emit("stop_typing", conversationId);
  }

  /**
   * Listen event: Nhận message mới
   * Sử dụng pattern listener array để tránh duplicate listeners
   */
  onReceiveMessage(callback: (message: ChatMessageResponse) => void): void {
    if (!this.socket) {
      console.warn("\n⚠️ [SOCKET] Cannot listen - socket not initialized");
      console.warn("==========================================\n");
      return;
    }

    // Thêm callback vào set
    this.messageCallbacks.add(callback);

    // Chỉ đăng ký socket listener một lần
    if (!this.isMessageListenerRegistered) {
      this.isMessageListenerRegistered = true;
      this.socket.on("receive_message", (message: ChatMessageResponse) => {
        const timestamp = new Date().toISOString();
        console.log(`\n📨 [SOCKET] Received message [${timestamp}]`);
        console.log(`Message ID: ${message.id}`);
        console.log(`Conversation ID: ${message.conversation_id}`);
        console.log(`Sender ID: ${message.sender_id ?? (message.sender as { id?: string } | undefined)?.id}`);
        console.log(`Message Type: ${message.message_type}`);
        console.log(`Content: ${(message.message_content ?? "").substring(0, 50)}...`);
        console.log(`Callbacks count: ${this.messageCallbacks.size}`);
        
        // Gọi tất cả callbacks
        let callbackIndex = 0;
        this.messageCallbacks.forEach((cb) => {
          try {
            callbackIndex++;
            console.log(`[SOCKET] Calling callback #${callbackIndex}...`);
            cb(message);
            console.log(`[SOCKET] ✅ Callback #${callbackIndex} completed`);
          } catch (error) {
            console.error(`[SOCKET] ❌ Error in callback #${callbackIndex}:`, error);
            console.error("Error stack:", (error as Error).stack);
          }
        });
        console.log("==========================================\n");
      });
    }
  }

  /**
   * Listen event: User đang typing
   * Hỗ trợ payload: string (userId) hoặc object { userId, conversationId? }
   * Backend cần broadcast "user_typing" tới tất cả client trong cùng conversation room.
   */
  onUserTyping(callback: (userId: string, conversationId?: string) => void): void {
    if (!this.socket) {
      console.warn("\n⚠️ [SOCKET] Cannot listen - socket not initialized");
      console.warn("==========================================\n");
      return;
    }

    this.typingCallbacks.add(callback);

    if (!this.isTypingListenerRegistered) {
      this.isTypingListenerRegistered = true;
      this.socket.on("user_typing", (payload: string | { userId: string; conversationId?: string }) => {
        const userId = typeof payload === "string" ? payload : payload?.userId;
        const conversationId = typeof payload === "object" && payload && "conversationId" in payload ? payload.conversationId : undefined;
        if (!userId) return;
        console.log(`[SOCKET] User typing: ${userId}` + (conversationId ? ` conversation: ${conversationId}` : ""));
        this.typingCallbacks.forEach((cb) => {
          try {
            cb(userId, conversationId);
          } catch (error) {
            console.error("Error in typing callback:", error);
          }
        });
      });
    }
  }

  /**
   * Remove listener: receive_message
   */
  offReceiveMessage(callback?: (message: ChatMessageResponse) => void): void {
    if (!this.socket) return;

    if (callback) {
      // Remove callback khỏi set
      this.messageCallbacks.delete(callback);
      
      // Nếu không còn callback nào, remove socket listener
      if (this.messageCallbacks.size === 0 && this.isMessageListenerRegistered) {
        this.socket.off("receive_message");
        this.isMessageListenerRegistered = false;
      }
    } else {
      // Remove tất cả
      this.messageCallbacks.clear();
      if (this.isMessageListenerRegistered) {
        this.socket.off("receive_message");
        this.isMessageListenerRegistered = false;
      }
    }
  }

  /**
   * Remove listener: user_typing
   */
  offUserTyping(callback?: (userId: string, conversationId?: string) => void): void {
    if (!this.socket) return;

    if (callback) {
      // Remove callback khỏi set
      this.typingCallbacks.delete(callback);
      
      // Nếu không còn callback nào, remove socket listener
      if (this.typingCallbacks.size === 0 && this.isTypingListenerRegistered) {
        this.socket.off("user_typing");
        this.isTypingListenerRegistered = false;
      }
    } else {
      // Remove tất cả
      this.typingCallbacks.clear();
      if (this.isTypingListenerRegistered) {
        this.socket.off("user_typing");
        this.isTypingListenerRegistered = false;
      }
    }
  }

  /**
   * Listen event: User ngừng typing
   * Hỗ trợ payload: string (userId) hoặc object { userId, conversationId? }
   */
  onUserStopTyping(callback: (userId: string, conversationId?: string) => void): void {
    if (!this.socket) {
      console.warn("\n⚠️ [SOCKET] Cannot listen - socket not initialized");
      console.warn("==========================================\n");
      return;
    }

    this.stopTypingCallbacks.add(callback);

    if (!this.isStopTypingListenerRegistered) {
      this.isStopTypingListenerRegistered = true;
      this.socket.on("user_stop_typing", (payload: string | { userId: string; conversationId?: string }) => {
        const userId = typeof payload === "string" ? payload : payload?.userId;
        const conversationId = typeof payload === "object" && payload && "conversationId" in payload ? payload.conversationId : undefined;
        if (!userId) return;
        console.log(`[SOCKET] User stop typing: ${userId}`);
        this.stopTypingCallbacks.forEach((cb) => {
          try {
            cb(userId, conversationId);
          } catch (error) {
            console.error("Error in stop typing callback:", error);
          }
        });
      });
    }
  }

  /**
   * Remove listener: user_stop_typing
   */
  offUserStopTyping(callback?: (userId: string, conversationId?: string) => void): void {
    if (!this.socket) return;

    if (callback) {
      // Remove callback khỏi set
      this.stopTypingCallbacks.delete(callback);
      
      // Nếu không còn callback nào, remove socket listener
      if (this.stopTypingCallbacks.size === 0 && this.isStopTypingListenerRegistered) {
        this.socket.off("user_stop_typing");
        this.isStopTypingListenerRegistered = false;
      }
    } else {
      // Remove tất cả
      this.stopTypingCallbacks.clear();
      if (this.isStopTypingListenerRegistered) {
        this.socket.off("user_stop_typing");
        this.isStopTypingListenerRegistered = false;
      }
    }
  }

  /**
   * Listen event: Update like (update_like)
   * Backend emit: update_like(messageId, userId, isLiked)
   */
  onUpdateLike(
    callback: (messageId: string, userId: string, isLiked: boolean) => void
  ): void {
    if (!this.socket) {
      console.warn("\n⚠️ [SOCKET] Cannot listen - socket not initialized");
      console.warn("==========================================\n");
      return;
    }

    // Thêm callback vào set
    this.likeUpdateCallbacks.add(callback);

    // Chỉ đăng ký socket listener một lần
    // Doc: payload là 3 tham số (messageId, userId, isLiked); một số BE gửi 1 object → hỗ trợ cả hai
    if (!this.isLikeUpdateListenerRegistered) {
      this.isLikeUpdateListenerRegistered = true;
      this.socket.on("update_like", (...args: unknown[]) => {
        let messageId: string;
        let userId: string;
        let isLiked: boolean;
        if (args.length >= 3 && typeof args[0] === "string" && typeof args[1] === "string" && typeof args[2] === "boolean") {
          [messageId, userId, isLiked] = args as [string, string, boolean];
        } else if (args.length === 1 && args[0] && typeof args[0] === "object" && "messageId" in (args[0] as object)) {
          const o = args[0] as { messageId: string; userId: string; isLiked: boolean };
          messageId = o.messageId;
          userId = o.userId;
          isLiked = o.isLiked;
        } else {
          console.warn("[SOCKET] update_like: unexpected payload", args);
          return;
        }
        console.log(`\n❤️ [SOCKET] update_like messageId=${messageId} userId=${userId} isLiked=${isLiked}\n`);

        this.likeUpdateCallbacks.forEach((cb) => {
          try {
            cb(messageId, userId, isLiked);
          } catch (error) {
            console.error("Error in like update callback:", error);
          }
        });
      });
    }
  }

  /**
   * Remove listener: update_like
   */
  offUpdateLike(
    callback?: (messageId: string, userId: string, isLiked: boolean) => void
  ): void {
    if (!this.socket) return;

    if (callback) {
      // Remove callback khỏi set
      this.likeUpdateCallbacks.delete(callback);

      // Nếu không còn callback nào, remove socket listener
      if (this.likeUpdateCallbacks.size === 0 && this.isLikeUpdateListenerRegistered) {
        this.socket.off("update_like");
        this.isLikeUpdateListenerRegistered = false;
      }
    } else {
      // Remove tất cả
      this.likeUpdateCallbacks.clear();
      if (this.isLikeUpdateListenerRegistered) {
        this.socket.off("update_like");
        this.isLikeUpdateListenerRegistered = false;
      }
    }
  }

  /**
   * Listen event: Update pin (update_pin)
   * Backend emit: update_pin(messageId, userId, isPinned)
   */
  onUpdatePin(
    callback: (messageId: string, userId: string, isPinned: boolean) => void
  ): void {
    if (!this.socket) {
      console.warn("\n⚠️ [SOCKET] Cannot listen - socket not initialized");
      console.warn("==========================================\n");
      return;
    }

    this.pinUpdateCallbacks.add(callback);

    // Doc: payload 3 tham số (messageId, userId, isPinned); hỗ trợ cả 1 object
    if (!this.isPinUpdateListenerRegistered) {
      this.isPinUpdateListenerRegistered = true;
      this.socket.on("update_pin", (...args: unknown[]) => {
        let messageId: string;
        let userId: string;
        let isPinned: boolean;
        if (args.length >= 3 && typeof args[0] === "string" && typeof args[1] === "string" && typeof args[2] === "boolean") {
          [messageId, userId, isPinned] = args as [string, string, boolean];
        } else if (args.length === 1 && args[0] && typeof args[0] === "object" && "messageId" in (args[0] as object)) {
          const o = args[0] as { messageId: string; userId: string; isPinned: boolean };
          messageId = o.messageId;
          userId = o.userId;
          isPinned = o.isPinned;
        } else {
          console.warn("[SOCKET] update_pin: unexpected payload", args);
          return;
        }
        console.log(`\n📌 [SOCKET] update_pin messageId=${messageId} userId=${userId} isPinned=${isPinned}\n`);

        this.pinUpdateCallbacks.forEach((cb) => {
          try {
            cb(messageId, userId, isPinned);
          } catch (error) {
            console.error("Error in pin update callback:", error);
          }
        });
      });
    }
  }

  /**
   * Remove listener: update_pin
   */
  offUpdatePin(
    callback?: (messageId: string, userId: string, isPinned: boolean) => void
  ): void {
    if (!this.socket) return;

    if (callback) {
      this.pinUpdateCallbacks.delete(callback);
      if (this.pinUpdateCallbacks.size === 0 && this.isPinUpdateListenerRegistered) {
        this.socket.off("update_pin");
        this.isPinUpdateListenerRegistered = false;
      }
    } else {
      this.pinUpdateCallbacks.clear();
      if (this.isPinUpdateListenerRegistered) {
        this.socket.off("update_pin");
        this.isPinUpdateListenerRegistered = false;
      }
    }
  }

  /**
   * Listen event: Notification
   */
  onNotification(callback: (notification: NotificationObject) => void): void {
    if (!this.socket) {
      console.warn("\n⚠️ [SOCKET] Cannot listen - socket not initialized");
      console.warn("==========================================\n");
      return;
    }

    // Thêm callback vào set
    this.notificationCallbacks.add(callback);

    // Chỉ đăng ký socket listener một lần
    if (!this.isNotificationListenerRegistered) {
      this.isNotificationListenerRegistered = true;
      this.socket.on("notification", (notification: NotificationObject) => {
        const timestamp = new Date().toISOString();
        console.log(`\n🔔 [SOCKET] Notification event received [${timestamp}]`);
        console.log(`Notification ID: ${notification.id}`);
        console.log(`Type: ${notification.type}`);
        console.log(`Title: ${notification.title}`);
        console.log(`Message: ${notification.message}`);
        console.log(`Data:`, notification.data);
        console.log(`Callbacks count: ${this.notificationCallbacks.size}`);
        
        // Gọi tất cả callbacks
        let callbackIndex = 0;
        this.notificationCallbacks.forEach((cb) => {
          try {
            callbackIndex++;
            console.log(`[SOCKET] Calling notification callback #${callbackIndex}...`);
            cb(notification);
            console.log(`[SOCKET] ✅ Notification callback #${callbackIndex} completed`);
          } catch (error) {
            console.error(`[SOCKET] ❌ Error in notification callback #${callbackIndex}:`, error);
            console.error("Error stack:", (error as Error).stack);
          }
        });
        console.log("==========================================\n");
      });
    }
  }

  /**
   * Remove listener: notification
   */
  offNotification(callback?: (notification: NotificationObject) => void): void {
    if (!this.socket) return;

    if (callback) {
      // Remove callback khỏi set
      this.notificationCallbacks.delete(callback);
      
      // Nếu không còn callback nào, remove socket listener
      if (this.notificationCallbacks.size === 0 && this.isNotificationListenerRegistered) {
        this.socket.off("notification");
        this.isNotificationListenerRegistered = false;
      }
    } else {
      // Remove tất cả
      this.notificationCallbacks.clear();
      if (this.isNotificationListenerRegistered) {
        this.socket.off("notification");
        this.isNotificationListenerRegistered = false;
      }
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();



