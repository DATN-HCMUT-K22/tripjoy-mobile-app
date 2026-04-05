import { messageService } from "@/services/messages";
import { socketService } from "@/services/socket/socketService";
import { useAppSelector } from "@/store/hooks";
import { ChatMessageResponse, TypingUser } from "@/types/message";
import { useCallback, useEffect, useRef, useState } from "react";

const isApiSuccess = (code?: number) => code === 0 || code === 1000;

interface UseMessagesOptions {
  conversationId: string;
  autoLoad?: boolean; // Tự động load messages khi mount
  pageSize?: number;
}

interface UseMessagesReturn {
  messages: ChatMessageResponse[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  typingUsers: TypingUser[];
  loadMessages: (page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  sendMessage: (content: string, options?: {
    messageType?: "TEXT" | "IMAGE" | "SHARE_POST";
    mediaUrl?: string;
    sharePostUrl?: string;
    parentMessageId?: string;
  }) => Promise<ChatMessageResponse | null>;
  /**
   * Đồng bộ lại like_count/is_liked_by_current_user theo dữ liệu mới từ server
   * (dùng khi mở modal danh sách người like để sửa lệch số like).
   */
  syncMessageLikes: (
    messageId: string,
    likesCount: number,
    currentUserLiked: boolean
  ) => void;
  likeMessage: (messageId: string) => Promise<void>;
  unlikeMessage: (messageId: string) => Promise<void>;
  pinMessage: (messageId: string) => Promise<void>;
  unpinMessage: (messageId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook để quản lý messages trong conversation
 * - Tự động kết nối Socket.IO và join conversation
 * - Load messages với pagination
 * - Xử lý real-time updates qua Socket.IO
 * - Quản lý typing indicators
 */
export function useMessages(options: UseMessagesOptions): UseMessagesReturn {
  const { conversationId, autoLoad = true, pageSize = 20 } = options;
  const currentUser = useAppSelector((state) => state.auth.user);

  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  // Cursor-based pagination state
  const [beforeCursor, setBeforeCursor] = useState<string | null>(null);
  const [afterCursor, setAfterCursor] = useState<string | null>(null);

  // Refs để tránh stale closures
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const messagesRef = useRef<ChatMessageResponse[]>([]);
  const conversationIdRef = useRef<string>(conversationId);

  // Update refs
  useEffect(() => {
    messagesRef.current = messages;
    conversationIdRef.current = conversationId;
  }, [messages, conversationId]);

  /**
   * Load messages từ API
   * Hỗ trợ cả cursor-based pagination (mới) và page-based pagination (cũ)
   */
  const loadMessages = useCallback(
    async (page: number = 0, useCursor: boolean = false) => {
      if (!conversationId) return;

      try {
        setLoading(true);
        setError(null);

        // Sử dụng cursor-based pagination nếu được yêu cầu và có cursor
        let response;
        if (useCursor && beforeCursor && page === 0) {
          // Load messages cũ hơn (scroll up) - chỉ khi có beforeCursor
          response = await messageService.getMessages(conversationId, {
            before: beforeCursor,
            limit: pageSize,
          });
        } else {
          // Fallback về page-based hoặc load lần đầu
          response = await messageService.getMessages(conversationId, {
            page,
            size: pageSize,
            sort: "created_at,desc", // Mới nhất trước (theo field BE)
            limit: pageSize, // Thêm limit cho cursor-based nếu API hỗ trợ
          });
        }

        // Log response để debug
        console.log(`\n📥 [USE MESSAGES] Processing response`);
        console.log(`Response code: ${response.code}`);
        console.log(`Response message: ${response.message}`);
        console.log(`Response data:`, response.data);
        
        // Hỗ trợ cả code thành công cũ/new
        if (isApiSuccess(response.code)) {
          // Hỗ trợ cả 2 format: content (format cũ) hoặc messages (format mới)
          // API trả về từ newest đến oldest, cần reverse để hiển thị oldest ở trên, newest ở dưới
          const newMessages = (response.data?.messages || response.data?.content || []).reverse();
          
          console.log(`✅ [USE MESSAGES] Response success, processing ${newMessages.length} messages`);
          console.log(`Using format: ${response.data?.messages ? 'messages (new)' : 'content (old)'}`);
          
          if (page === 0) {
            // Load mới, replace toàn bộ
            setMessages(newMessages);
            setCurrentPage(0);
            console.log(`✅ [USE MESSAGES] Loaded ${newMessages.length} messages (page 0)`);
          } else {
            // Load thêm, prepend vào đầu (vì đã reverse rồi, oldest sẽ ở đầu)
            setMessages((prev) => {
              const combined = [...newMessages, ...prev];
              console.log(`✅ [USE MESSAGES] Loaded ${newMessages.length} more messages, total: ${combined.length}`);
              return combined;
            });
          }

          // Update cursors nếu có (chỉ update khi load lần đầu hoặc load more)
          if (response.data?.cursors) {
            // Update before cursor để dùng cho lần load tiếp theo (scroll up)
            if (response.data.cursors.before) {
              setBeforeCursor(response.data.cursors.before);
            }
            // Update after cursor để track messages mới nhất
            if (response.data.cursors.after) {
              setAfterCursor(response.data.cursors.after);
            }
          }
          
          // Nếu load lần đầu và có messages, set before cursor từ message đầu tiên
          if (page === 0 && newMessages.length > 0 && !response.data?.cursors?.before) {
            const firstMessageTime = newMessages[0].created_at;
            setBeforeCursor(firstMessageTime);
          }

          // Set hasMore - hỗ trợ cả 2 format
          let hasMore = false;
          if (response.data?.has_more) {
            // Format mới: cursor-based pagination
            // has_more.before = true nghĩa là còn tin nhắn cũ hơn (cần load thêm khi scroll up)
            hasMore = response.data.has_more.before === true;
            console.log(`Has more (cursor-based): ${hasMore} (has_more.before: ${response.data.has_more.before})`);
          } else if (response.data?.last !== undefined) {
            // Format cũ: Spring pagination
            hasMore = !response.data.last;
            console.log(`Has more (page-based): ${hasMore} (last: ${response.data.last})`);
          } else {
            // Mặc định: không còn nếu không có data
            hasMore = false;
            console.log(`Has more: ${hasMore} (default, no pagination info)`);
          }
          setHasMore(hasMore);
          
          // Không có error nếu response thành công (kể cả khi empty)
          // Empty array là trạng thái bình thường, không phải lỗi
          setError(null);
        } else {
          // Chỉ throw error nếu code !== 1000 (thực sự là lỗi)
          console.error(`❌ [USE MESSAGES] Response code is not success: ${response.code}`);
          console.error(`Expected code: 0|1000, Got: ${response.code}`);
          throw new Error(response.message || "Failed to load messages");
        }
      } catch (err: any) {
        console.error("❌ [USE MESSAGES] Error loading messages:");
        console.error("Error type:", err?.constructor?.name);
        console.error("Error message:", err?.message);
        console.error("Error response:", err?.response);
        console.error("Error status:", err?.status || err?.response?.status);
        console.error("Error data:", err?.response?.data);
        console.error("Full error:", err);
        
        // Xử lý các loại lỗi khác nhau
        let errorMessage = "Không thể tải tin nhắn";
        
        if (!conversationId) {
          errorMessage = "Không tìm thấy cuộc trò chuyện";
        } else if (err?.response?.status === 401) {
          errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        } else if (err?.response?.status === 403) {
          errorMessage = "Bạn không có quyền truy cập cuộc trò chuyện này";
        } else if (err?.response?.status === 404) {
          errorMessage = "Không tìm thấy cuộc trò chuyện";
        } else if (err?.response?.status >= 500) {
          errorMessage = "Lỗi server. Vui lòng thử lại sau.";
        } else if (err?.message?.includes("timeout")) {
          errorMessage = "Hết thời gian chờ. Vui lòng thử lại.";
        } else if (err?.message?.includes("Network")) {
          errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối.";
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err?.message && err.message !== "Uncategorized error") {
          errorMessage = err.message;
        } else {
          errorMessage = "Đã xảy ra lỗi khi tải tin nhắn. Vui lòng thử lại.";
        }
        
        setError(errorMessage);
        
        // Nếu là lỗi, vẫn set messages = [] để hiển thị empty state
        if (page === 0) {
          setMessages([]);
          setBeforeCursor(null);
          setAfterCursor(null);
        }
      } finally {
        setLoading(false);
      }
    },
    [conversationId, pageSize, beforeCursor]
  );

  /**
   * Load more messages (pagination)
   * Hỗ trợ cả cursor-based và page-based
   */
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    // Ưu tiên sử dụng cursor-based nếu có cursor
    if (beforeCursor) {
      await loadMessages(0, true); // useCursor = true
    } else {
      // Fallback về page-based
      const nextPage = currentPage + 1;
      await loadMessages(nextPage, false);
      setCurrentPage(nextPage);
    }
  }, [loading, hasMore, currentPage, beforeCursor, loadMessages]);

  /**
   * Refresh messages (load lại từ đầu)
   */
  const refresh = useCallback(async () => {
    setCurrentPage(0);
    setHasMore(true);
    setBeforeCursor(null);
    setAfterCursor(null);
    await loadMessages(0, false);
  }, [loadMessages]);

  /**
   * Gửi message
   */
  const sendMessage = useCallback(
    async (
      content: string,
      options?: {
        messageType?: "TEXT" | "IMAGE" | "SHARE_POST";
        mediaUrl?: string;
        sharePostUrl?: string;
        parentMessageId?: string;
      }
    ): Promise<ChatMessageResponse | null> => {
      if (!conversationId || !content.trim()) return null;

      // Tạo optimistic message
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const optimisticMessage: ChatMessageResponse = {
        id: tempId,
        message_type: options?.messageType || "TEXT",
        message_content: content,
        media_url: options?.mediaUrl,
        share_post_url: options?.sharePostUrl,
        is_bot: false,
        status: "SENDING",
        sender_id: currentUser?.id || "",
        sender: currentUser ? {
          id: currentUser.id,
          username: currentUser.username || "",
          fullName: currentUser.fullName || currentUser.full_name,
          avatarUrl: currentUser.avatarUrl || currentUser.avatar_url,
        } : null,
        conversation_id: conversationId,
        parent_message_id: options?.parentMessageId,
        created_at: new Date().toISOString(),
        _isOptimistic: true,
        _tempId: tempId,
      };

      // Thêm optimistic message vào UI ngay lập tức
      setMessages((prev) => {
        const exists = prev.some((m) => m._tempId === tempId);
        if (exists) return prev;
        return [...prev, optimisticMessage];
      });

      try {
        const payload = {
          message_content: content,
          message_type: options?.messageType || "TEXT",
          media_url: options?.mediaUrl,
          share_post_url: options?.sharePostUrl,
          parent_message_id: options?.parentMessageId,
        };

        const response = await messageService.sendMessage(
          conversationId,
          payload
        );

        if (isApiSuccess(response.code) && response.data) {
          const msg = {
            ...response.data,
            conversation_id: response.data.conversation_id || conversationId,
            status: response.data.status || "SENT",
          };
          
          // Thay thế optimistic message bằng real message
          setMessages((prev) => {
            const filtered = prev.filter((m) => m._tempId !== tempId);
            const exists = filtered.some((m) => m.id === msg.id);
            if (exists) return filtered;
            return [...filtered, msg];
          });
          
          return msg;
        } else {
          throw new Error(response.message || "Failed to send message");
        }
      } catch (err: any) {
        console.error("❌ [USE MESSAGES] Error sending message:");
        console.error("Error object:", err);
        console.error("Error message:", err?.message);
        console.error("Error response:", err?.response);
        console.error("Error status:", err?.status || err?.response?.status);
        console.error("Error data:", err?.response?.data);
        console.error("Full error:", err);
        
        // Xử lý các loại lỗi khác nhau
        let errorMessage = "Không thể gửi tin nhắn";
        
        if (err?.response?.status === 500) {
          // Lỗi server - hiển thị message từ backend hoặc message mặc định
          errorMessage = err?.response?.data?.message || 
                       err?.message || 
                       "Lỗi server. Vui lòng thử lại sau.";
          // Nếu là "Uncategorized error", thay bằng message rõ ràng hơn
          if (errorMessage === "Uncategorized error") {
            errorMessage = "Lỗi server. Vui lòng thử lại sau.";
          }
        } else if (err?.response?.status === 401) {
          errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        } else if (err?.response?.status === 403) {
          errorMessage = "Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này";
        } else if (err?.response?.status === 404) {
          errorMessage = "Không tìm thấy cuộc trò chuyện";
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err?.message && err.message !== "Uncategorized error") {
          errorMessage = err.message;
        } else if (err?.message === "Uncategorized error") {
          errorMessage = "Lỗi server. Vui lòng thử lại sau.";
        }
        
        setError(errorMessage);
        
        // Cập nhật optimistic message thành failed
        setMessages((prev) =>
          prev.map((m) =>
            m._tempId === tempId
              ? { ...m, status: "FAILED" as const }
              : m
          )
        );
        
        return null;
      }
    },
    [conversationId, currentUser]
  );

  /**
   * Like message
   */
  const likeMessage = useCallback(async (messageId: string) => {
    try {
      const response = await messageService.likeMessage(messageId);
      if (response.code === 1000 || response.code === 0) {
        // Đổi trạng thái like cho current user ngay (optimistic)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  // Tăng like_count theo tài liệu API Chat Message
                  like_count: (m.like_count ?? m.likes_count ?? 0) + 1,
                  likes_count: (m.like_count ?? m.likes_count ?? 0) + 1,
                  is_liked_by_current_user: true,
                  is_liked: true,
                }
              : m
          )
        );
        // Số lượng like & đồng bộ với client khác vẫn dựa vào socket update_like từ BE
      } else {
        throw new Error(response.message || "Failed to like message");
      }
    } catch (err: any) {
      console.error("Error liking message:", err);
      setError(err.message || "Không thể like tin nhắn");
    }
  }, []);

  /**
   * Unlike message
   */
  const unlikeMessage = useCallback(async (messageId: string) => {
    try {
      const response = await messageService.unlikeMessage(messageId);
      if (response.code === 1000 || response.code === 0) {
        // Đổi trạng thái like cho current user ngay (optimistic)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  // Giảm like_count theo tài liệu API Chat Message (min 0)
                  like_count: Math.max(
                    (m.like_count ?? m.likes_count ?? 0) - 1,
                    0
                  ),
                  likes_count: Math.max(
                    (m.like_count ?? m.likes_count ?? 0) - 1,
                    0
                  ),
                  is_liked_by_current_user: false,
                  is_liked: false,
                }
              : m
          )
        );
        // Số lượng like & đồng bộ với client khác vẫn dựa vào socket update_like từ BE
      } else {
        throw new Error(response.message || "Failed to unlike message");
      }
    } catch (err: any) {
      console.error("Error unliking message:", err);
      setError(err.message || "Không thể unlike tin nhắn");
    }
  }, []);

  /**
   * Đồng bộ like_count & trạng thái liked từ dữ liệu server (modal danh sách like)
   * Đảm bảo số hiển thị cạnh tin nhắn trùng với list người like.
   */
  const syncMessageLikes = useCallback(
    (messageId: string, likesCount: number, currentUserLiked: boolean) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                like_count: likesCount,
                likes_count: likesCount,
                is_liked_by_current_user: currentUserLiked,
                is_liked: currentUserLiked,
              }
            : m
        )
      );
    },
    []
  );

  /**
   * Pin message
   * POST /api/v1/messages/{messageId}/pin?conversationId=...
   * Optimistic: set is_pinned = true. Refetch pinned list do Screen gọi usePinnedMessages.refetch sau khi thành công.
   */
  const pinMessage = useCallback(
    async (messageId: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, is_pinned: true } : m
        )
      );
      try {
        const response = await messageService.pinMessage(
          messageId,
          conversationId
        );
        if (response.code === 1000 || response.code === 0) {
          // Refetch pinned do Screen gọi usePinnedMessages.refetch
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId ? { ...m, is_pinned: false } : m
            )
          );
          throw new Error(response.message || "Failed to pin message");
        }
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, is_pinned: false } : m
          )
        );
        console.error("Error pinning message:", err);
        setError(err?.message || "Không thể pin tin nhắn");
      }
    },
    [conversationId]
  );

  /**
   * Unpin message
   */
  const unpinMessage = useCallback(
    async (messageId: string) => {
      try {
        const response = await messageService.unpinMessage(
          messageId,
          conversationId
        );
        if (response.code === 1000 || response.code === 0) {
          // Cập nhật local state; realtime qua socket update_pin sẽ đồng bộ thêm
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId ? { ...m, is_pinned: false } : m
            )
          );
        } else {
          throw new Error(response.message || "Failed to unpin message");
        }
      } catch (err: any) {
        console.error("Error unpinning message:", err);
        setError(err.message || "Không thể unpin tin nhắn");
      }
    },
    [conversationId]
  );

  // Auto load messages khi mount
  useEffect(() => {
    if (autoLoad && conversationId) {
      setBeforeCursor(null);
      setAfterCursor(null);
      loadMessages(0, false);
    }
  }, [autoLoad, conversationId, loadMessages]);

  // Setup Socket.IO listeners
  useEffect(() => {
    if (!conversationId) {
      console.log("[useMessages] No conversationId, skipping socket setup");
      return;
    }

    console.log(`[useMessages] Setting up socket for conversation: ${conversationId}`);
    console.log(`[useMessages] Socket connected: ${socketService.isConnected()}`);

    // Join conversation khi mount hoặc khi socket vừa connect
    const ensureJoinConversation = () => {
      const isConnected = socketService.isConnected();
      console.log(`[useMessages] ensureJoinConversation called, socket connected: ${isConnected}`);
      if (isConnected && conversationId) {
        console.log(`[useMessages] Calling joinConversation for: ${conversationId}`);
        socketService.joinConversation(conversationId);
      } else {
        console.warn(`[useMessages] Cannot join conversation - socket not connected or no conversationId`);
      }
    };

    if (socketService.isConnected()) {
      console.log("[useMessages] Socket already connected, joining conversation immediately");
      ensureJoinConversation();
    } else {
      console.log("[useMessages] Socket not connected, connecting first...");
      socketService
        .connect()
        .then(() => {
          console.log("[useMessages] Socket connected successfully, joining conversation");
          ensureJoinConversation();
        })
        .catch((err) => {
          console.error("[useMessages] Failed to connect socket:", err);
        });
    }

    // Re-join room khi socket reconnect (để thiết bị kia vẫn nhận typing)
    const sock = socketService.getSocket();
    const onSocketConnect = () => {
      ensureJoinConversation();
    };
    if (sock) {
      sock.on("connect", onSocketConnect);
    }

    // Handler cho message mới
    const handleReceiveMessage = (message: ChatMessageResponse) => {
      // Chỉ thêm message nếu thuộc conversation hiện tại
      if (message.conversation_id === conversationIdRef.current) {
        setMessages((prev) => {
          // Kiểm tra xem message đã tồn tại chưa (tránh duplicate)
          const exists = prev.some((m) => m.id === message.id);
          if (exists) {
            // Nếu đã tồn tại, update status nếu là message của mình
            return prev.map((m) => {
              if (m.id === message.id) {
                return { ...message, status: message.status || "SENT" };
              }
              return m;
            });
          }
          // Nếu là message của mình và có optimistic message tương ứng, thay thế
          if (message.sender_id === currentUser?.id) {
            // Tìm optimistic message có cùng content và thời gian gần đây
            const optimisticIndex = prev.findIndex(
              (m) =>
                m._isOptimistic &&
                m.message_content === message.message_content &&
                m.message_type === message.message_type &&
                Math.abs(
                  new Date(m.created_at).getTime() -
                    new Date(message.created_at).getTime()
                ) < 5000 // Trong vòng 5 giây
            );
            if (optimisticIndex >= 0) {
              // Thay thế optimistic message
              const newMessages = [...prev];
              newMessages[optimisticIndex] = {
                ...message,
                status: message.status || "SENT",
              };
              return newMessages;
            }
          }
          return [...prev, { ...message, status: message.status || "SENT" }];
        });
      }
    };

    // Handler cho typing indicator
    const handleUserTyping = (userId: string, conversationIdFromPayload?: string) => {
      // Nếu server gửi kèm conversationId thì chỉ xử lý khi đúng conversation hiện tại
      if (conversationIdFromPayload && conversationIdFromPayload !== conversationIdRef.current) return;
      // Không hiển thị typing của chính mình
      if (userId === currentUser?.id) return;

      setTypingUsers((prev) => {
        const exists = prev.find((u) => u.userId === userId);
        if (exists) {
          return prev.map((u) =>
            u.userId === userId ? { ...u, timestamp: Date.now() } : u
          );
        }
        return [...prev, { userId, timestamp: Date.now() }];
      });

      // Auto remove typing sau 3 giây
      const timeoutId = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
      }, 3000);

      if (typingTimeoutRef.current[userId]) {
        clearTimeout(typingTimeoutRef.current[userId]);
      }
      typingTimeoutRef.current[userId] = timeoutId;
    };

    // Handler cho stop typing
    const handleUserStopTyping = (userId: string, conversationIdFromPayload?: string) => {
      if (conversationIdFromPayload && conversationIdFromPayload !== conversationIdRef.current) return;
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
      if (typingTimeoutRef.current[userId]) {
        clearTimeout(typingTimeoutRef.current[userId]);
        delete typingTimeoutRef.current[userId];
      }
    };

    // Handler cho update_like (doc: 3 tham số messageId, userId, isLiked → cập nhật like_count và is_liked_by_current_user)
    const handleUpdateLike = (
      messageId: string,
      userId: string,
      isLiked: boolean
    ) => {
      const currentUserId = currentUser?.id;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const currentLikeCount = m.like_count ?? m.likes_count ?? 0;
          const isCurrentUser = userId === currentUserId;

          // Với client hiện tại, like_count đã được cập nhật optimistic trong likeMessage/unlikeMessage,
          // nên không cộng/trừ lần nữa để tránh double-count.
          // Với các client khác, dùng delta để cập nhật theo realtime event.
          let nextCount = currentLikeCount;
          if (!isCurrentUser) {
            const delta = isLiked ? 1 : -1;
            nextCount = Math.max(currentLikeCount + delta, 0);
          }

          return {
            ...m,
            like_count: nextCount,
            likes_count: nextCount,
            is_liked_by_current_user:
              isCurrentUser ? isLiked : m.is_liked_by_current_user,
          };
        })
      );
    };

    // Handler cho update_pin (doc: 3 tham số messageId, userId, isPinned)
    const handleUpdatePin = (
      messageId: string,
      _userId: string,
      isPinned: boolean
    ) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, is_pinned: isPinned } : m
        )
      );
    };

    // Register listeners
    socketService.onReceiveMessage(handleReceiveMessage);
    socketService.onUserTyping(handleUserTyping);
    socketService.onUserStopTyping(handleUserStopTyping);
    socketService.onUpdateLike(handleUpdateLike);
    socketService.onUpdatePin(handleUpdatePin);

    // Cleanup
    return () => {
      const s = socketService.getSocket();
      if (s) s.off("connect", onSocketConnect);
      socketService.offReceiveMessage(handleReceiveMessage);
      socketService.offUserTyping(handleUserTyping);
      socketService.offUserStopTyping(handleUserStopTyping);
      socketService.offUpdateLike(handleUpdateLike);
      socketService.offUpdatePin(handleUpdatePin);

      // Clear typing timeouts
      Object.values(typingTimeoutRef.current).forEach((timeout) =>
        clearTimeout(timeout)
      );
      typingTimeoutRef.current = {};

      // Leave conversation
      if (socketService.isConnected()) {
        socketService.leaveConversation(conversationId);
      }
    };
  }, [conversationId, currentUser?.id]);

  return {
    messages,
    loading,
    error,
    hasMore,
    typingUsers,
    loadMessages,
    loadMore,
    sendMessage,
    syncMessageLikes,
    likeMessage,
    unlikeMessage,
    pinMessage,
    unpinMessage,
    refresh,
  };
}
