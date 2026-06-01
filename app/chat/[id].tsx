import { ChatBubble } from "@/components/chat/ChatBubble";
import { SwipeableMessage } from "@/components/chat/SwipeableMessage";
import { DateSeparator } from "@/components/chat/DateSeparator";
import { MessageLikesModal } from "@/components/chat/MessageLikesModal";
import { ConnectionBanner } from "@/components/chat/ConnectionBanner";
import { TypingIndicatorBubble } from "@/components/chat/TypingIndicatorBubble";
import { useMessages } from "@/hooks/useMessages";
import { usePinnedMessages } from "@/hooks/usePinnedMessages";
import { MessageActionSheet } from "@/components/chat/MessageActionSheet";
import { conversationService } from "@/services/conversations";
import { PinnedMessageBar, PINNED_BAR_HEIGHT } from "@/components/chat/PinnedMessageBar";
import { PinnedMessagesModal } from "@/components/chat/PinnedMessagesModal";
import { ReportModal } from "@/components/social/ReportModal";
import { ContentType } from "@/types/report";
import { messageService } from "@/services/messages";
import { uploadImage, uploadVideo } from "@/services/media";
import { socketService } from "@/services/socket/socketService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCurrentOpenConversationId } from "@/store/slices/messageNotificationSlice";
import { setActiveConversation, resetUnread as resetUnreadRedux, selectTypingUsersForConversation } from "@/store/slices/conversationSlice";
import { useSocketTyping } from "@/hooks/useSocketTyping";
import { useChatStore } from "@/stores/chat.store";
import { ChatMessageResponse, getChatSenderId } from "@/types/message";
import { getDirectPeerAvatarUrl } from "@/utils/conversationDisplay";
import { showErrorToast } from "@/utils/toast";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Video, ResizeMode } from "expo-av";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import type { FlashListProps } from "@shopify/flash-list";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const isApiSuccess = (code?: number) => code === 0 || code === 1000;

type PickedMedia = {
  uri: string;
  kind: "image" | "video";
  mimeType?: string | null;
  fileName?: string | null;
};

function inferMediaKind(asset: ImagePicker.ImagePickerAsset): "image" | "video" {
  if (asset.type === "video") return "video";
  if (asset.type === "image") return "image";
  const mime = asset.mimeType?.toLowerCase() ?? "";
  if (mime.startsWith("video/")) return "video";
  return "image";
}

function defaultUploadFileMeta(
  kind: "image" | "video",
  mimeType?: string | null,
  preferredName?: string | null
) {
  const fileName =
    preferredName?.trim() ||
    (kind === "video" ? "message-video.mp4" : "message-image.jpg");
  const fileType =
    (mimeType && mimeType.trim()) ||
    (kind === "video" ? "video/mp4" : "image/jpeg");
  return { fileName, fileType };
}

// Helper function để check xem có cần hiển thị date separator không
// Nếu khoảng cách giữa 2 messages > 15 phút thì hiển thị separator
const shouldShowDateSeparator = (
  currentMessage: ChatMessageResponse,
  previousMessage: ChatMessageResponse | null
): boolean => {
  if (!previousMessage) {
    return true;
  }

  const currentTime = new Date(currentMessage.created_at).getTime();
  const previousTime = new Date(previousMessage.created_at).getTime();
  const diffMinutes = (currentTime - previousTime) / (1000 * 60);

  return diffMinutes > 15;
};

export default function ChatScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string; scrollToEnd?: string; messageId?: string }>();
  const [input, setInput] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<PickedMedia | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const flashListRef = useRef<FlashList<any> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [likesModalMessageId, setLikesModalMessageId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessageResponse | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [pinnedModalVisible, setPinnedModalVisible] = useState(false);
  const [pinnedIndex, setPinnedIndex] = useState(0);
  const [isPinning, setIsPinning] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessageResponse | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportedMessage, setReportedMessage] = useState<ChatMessageResponse | null>(null);
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const conversationId = params.id;

  // Load pinned messages với hook
  const { pinnedMessages, isLoading: isPinListLoading, refetch: refetchPinned } = usePinnedMessages(conversationId || null);

  // Conversation đang mở — không hiện banner tin nhắn từ chính conversation này
  useEffect(() => {
    if (conversationId) {
      dispatch(setCurrentOpenConversationId(conversationId));
      return () => {
        dispatch(setCurrentOpenConversationId(null));
      };
    }
  }, [conversationId, dispatch]);

  // Zustand store integration - set current chat and reset unread
  const { setCurrentChatId, resetUnread } = useChatStore();
  useEffect(() => {
    if (conversationId) {
      setCurrentChatId(conversationId);
      resetUnread(conversationId);
      // 🔥 Redux: Set active conversation to prevent unread increment
      dispatch(setActiveConversation(conversationId));
      return () => {
        setCurrentChatId(null);
        // 🔥 Redux: Clear active conversation
        dispatch(setActiveConversation(null));
      };
    }
  }, [conversationId, setCurrentChatId, resetUnread, dispatch]);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    const retryDelays = [300, 800, 1500];
    const markReadWithRetry = async () => {
      for (let i = 0; i < retryDelays.length; i++) {
        try {
          await conversationService.markConversationRead(conversationId);
          if (!cancelled) {
            // Zustand update
            resetUnread(conversationId);
            // 🔥 Redux: Reset unread count
            dispatch(resetUnreadRedux({ conversationId }));
            queryClient.setQueryData(["conversations"], (prev: any) => {
              if (!prev || !Array.isArray(prev)) return prev;
              return prev.map((conversation: any) =>
                conversation.id === conversationId
                  ? { ...conversation, unread_count: 0 }
                  : conversation
              );
            });
          }
          return;
        } catch {
          if (i === retryDelays.length - 1 || cancelled) return;
          await new Promise((resolve) => setTimeout(resolve, retryDelays[i]));
        }
      }
    };

    void markReadWithRetry();

    return () => {
      cancelled = true;
      if (conversationId) {
        // Optimistic update immediately
        resetUnread(conversationId);
        dispatch(resetUnreadRedux({ conversationId }));
        queryClient.setQueryData(["conversations"], (prev: any) => {
          if (!prev || !Array.isArray(prev)) return prev;
          return prev.map((conversation: any) =>
            conversation.id === conversationId
              ? { ...conversation, unread_count: 0 }
              : conversation
          );
        });

        // Backend call & update after confirm
        conversationService.markConversationRead(conversationId)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          })
          .catch(() => {});
      }
    };
  }, [conversationId, resetUnread, dispatch, queryClient]);

  // Đảm bảo header bị tắt
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Load conversation info
  const { data: conversation } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      if (!conversationId) {
        console.warn("⚠️ [CHAT] No conversationId to load");
        return null;
      }
      console.log(`\n📥 [CHAT] Loading conversation: ${conversationId}`);
      const response = await conversationService.getConversationById(
        conversationId
      );
      console.log(`📊 [CHAT] Conversation API Response:`, JSON.stringify(response, null, 2));
      console.log(`📊 [CHAT] Response code: ${response.code}`);
      console.log(`📊 [CHAT] Response data:`, response.data);
      if (response.data) {
        console.log(`📊 [CHAT] Conversation members:`, response.data.members);
        console.log(`📊 [CHAT] Conversation members length:`, response.data.members?.length);
        console.log(`📊 [CHAT] Conversation type:`, response.data.type);
        console.log(`📊 [CHAT] Conversation name:`, response.data.name);
      }
      if (isApiSuccess(response.code) && response.data) {
        console.log("✅ [CHAT] Conversation loaded successfully");
        return response.data;
      }
      console.error("❌ [CHAT] Failed to load conversation");
      console.error(`Response code: ${response.code}, Expected: 0|1000`);
      return null;
    },
    enabled: !!conversationId,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  /** Cycle qua các tin ghim mỗi 8 giây nếu có > 1 tin */
  useEffect(() => {
    if (pinnedMessages.length <= 1) return;
    const timer = setInterval(() => {
      setPinnedIndex((prev) => (prev + 1) % pinnedMessages.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [pinnedMessages.length]);

  // Sử dụng useMessages hook
  const {
    messages,
    loading,
    error,
    hasMore,
    typingUsers,
    sendMessage,
    likeMessage,
    unlikeMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    loadMore,
    refresh,
  } = useMessages({
    conversationId: conversationId || "",
    autoLoad: !!conversationId,
    pageSize: 20,
  });

  // Lấy tên và avatar để hiển thị
  const getDisplayName = () => {
    if (conversation?.name) return conversation.name;
    if (conversation?.type === "DIRECT" && conversation.members && conversation.members.length > 0) {
      const otherMember = conversation.members.find(
        (m) => m.id !== currentUser?.id
      );
      return otherMember?.fullName || otherMember?.username || "Người dùng";
    }
    return "Hội thoại";
  };

  const getAvatar = () => {
    if (conversation?.type === "DIRECT" && conversation.members?.length) {
      const peer = getDirectPeerAvatarUrl(conversation, currentUser?.id ?? null);
      if (peer) return peer;
      if (conversation.avatar) return conversation.avatar;
      return null;
    }
    if (conversation?.avatar) return conversation.avatar;
    return null;
  };

  // Debounce typing indicator
  useEffect(() => {
    if (!conversationId || !socketService.isConnected()) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (input.trim().length > 0) {
      socketService.sendTyping(conversationId);
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendStopTyping(conversationId);
      }, 3000) as any;
    } else {
      socketService.sendStopTyping(conversationId);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [input, conversationId]);

  // Auto scroll to bottom khi có message mới, load messages lần đầu, hoặc mở từ notification (scrollToEnd=1)
  const lastMessageIdRef = useRef<string | null>(null);
  const hasScrolledToBottomRef = useRef(false);
  
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const isNewMessage = lastMessage.id !== lastMessageIdRef.current;
      const shouldScroll = isNewMessage || !hasScrolledToBottomRef.current || params.scrollToEnd === "1";
      
      if (shouldScroll) {
        lastMessageIdRef.current = lastMessage.id;
        hasScrolledToBottomRef.current = true;
        const delay = params.scrollToEnd === "1" ? 300 : 100;
        const t = setTimeout(() => {
          flashListRef.current?.scrollToEnd({ animated: true });
        }, delay);
        return () => clearTimeout(t);
      }
    } else {
      // Reset khi không có messages
      hasScrolledToBottomRef.current = false;
      lastMessageIdRef.current = null;
    }
  }, [messages, params.scrollToEnd]);

  // Auto scroll to bottom khi có user đang typing
  useEffect(() => {
    if (typingUsers.length > 0) {
      const t = setTimeout(() => {
        flashListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [typingUsers.length]);

  // Prepare FlatList data với date separators
  const { listData, messageIdToIndex } = React.useMemo(() => {
    const list: (
      | { type: "date"; key: string; date: string }
      | { type: "message"; key: string; message: ChatMessageResponse; showSenderName: boolean }
    )[] = [];
    const map = new Map<string, number>();
    let prev: ChatMessageResponse | null = null;
    messages.forEach((msg) => {
      const showSep = shouldShowDateSeparator(msg, prev);
      const isNewSender = !prev || getChatSenderId(prev) !== getChatSenderId(msg);
      const showSender = isNewSender || showSep;
      if (showSep) {
        list.push({ type: "date", key: `date-${msg.id}-${msg.created_at}`, date: msg.created_at });
      }
      list.push({ 
        type: "message", 
        key: msg.id, 
        message: msg, 
        showSenderName: showSender,
        showAvatar: showSender // Avatar follows same grouping as name
      });
      map.set(msg.id, list.length - 1);
      prev = msg;
    });
    return { listData: list, messageIdToIndex: map };
  }, [messages]);

  useEffect(() => {
    if (!params.messageId) return;
    const idx = messageIdToIndex.get(params.messageId);
    if (idx === undefined) return;
    const t = setTimeout(() => {
      flashListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
    }, 200);
    return () => clearTimeout(t);
  }, [params.messageId, messageIdToIndex]);

  const handlePickMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showErrorToast("Cần quyền truy cập thư viện", "Vui lòng cấp quyền trong Cài đặt.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: false,
        quality: 0.85,
        videoMaxDuration: 120,
      });

      if (!result.canceled && result.assets[0]) {
        const a = result.assets[0];
        setSelectedMedia({
          uri: a.uri,
          kind: inferMediaKind(a),
          mimeType: a.mimeType ?? null,
          fileName: a.fileName ?? null,
        });
      }
    } catch (error) {
      showErrorToast("Không chọn được file", error);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedMedia) || !conversationId) return;

    const content = input.trim();
    setInput("");
    const mediaToSend = selectedMedia;
    setSelectedMedia(null);

    if (socketService.isConnected()) {
      socketService.sendStopTyping(conversationId);
    }

    const folder = `tripjoy/messages/${conversationId}`;

    try {
      if (mediaToSend) {
        setUploadingMedia(true);
        try {
          const { fileName, fileType } = defaultUploadFileMeta(
            mediaToSend.kind,
            mediaToSend.mimeType,
            mediaToSend.fileName
          );

          const uploadResult =
            mediaToSend.kind === "video"
              ? await uploadVideo({
                  fileUri: mediaToSend.uri,
                  fileName,
                  fileType,
                  folder,
                })
              : await uploadImage({
                  fileUri: mediaToSend.uri,
                  fileName,
                  fileType,
                  folder,
                });

          const mediaUrl = uploadResult.secure_url;
          const caption =
            content ||
            (mediaToSend.kind === "video" ? "Đã gửi video" : "Đã gửi ảnh");

          const result = await sendMessage(caption, {
            messageType: mediaToSend.kind === "video" ? "VIDEO" : "IMAGE",
            mediaUrl,
            parentMessageId: replyingToMessage?.id,
            parentMessage: replyingToMessage ?? undefined,
          });

          if (result) {
            setReplyingToMessage(null);
          }

          if (!result) {
            setSelectedMedia(mediaToSend);
            showErrorToast("Không gửi được tin nhắn", "Vui lòng thử lại.");
          }
        } catch (err) {
          showErrorToast(
            mediaToSend.kind === "video" ? "Tải video lên thất bại" : "Tải ảnh lên thất bại",
            err
          );
          setSelectedMedia(mediaToSend);
        } finally {
          setUploadingMedia(false);
        }
      } else {
        const result = await sendMessage(content, {
          parentMessageId: replyingToMessage?.id,
          parentMessage: replyingToMessage ?? undefined,
        });
        if (result) {
          setReplyingToMessage(null);
        } else {
          setInput(content);
        }
      }
    } catch {
      setUploadingMedia(false);
      if (mediaToSend) {
        setSelectedMedia(mediaToSend);
      } else {
        setInput(content);
      }
    }
  };

  // Handle like/unlike (API: is_liked_by_current_user)
  // 🔥 Memoize callbacks for FlashList performance
  const handleLike = useCallback(async (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    const isLiked = msg.is_liked_by_current_user === true;
    if (isLiked) await unlikeMessage(messageId);
    else await likeMessage(messageId);
  }, [messages, unlikeMessage, likeMessage]);

  const handleShowLikes = useCallback((messageId: string) => {
    setLikesModalMessageId(messageId);
    setLikesModalVisible(true);
  }, []);

  const handleLongPress = useCallback((msg: ChatMessageResponse) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMessage(msg);
    setActionSheetVisible(true);
    setHighlightMessageId(msg.id);
  }, []);

  // Scroll to parent message when reply preview is tapped
  const scrollToMessage = useCallback((messageId: string) => {
    const index = listData.findIndex(
      (item) => item.type === "message" && item.message.id === messageId
    );

    if (index === -1) {
      Toast.show({
        type: "info",
        text1: "Tin nhắn không có sẵn",
        text2: "Cuộn lên để tải tin nhắn cũ hơn",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    try {
      flashListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });

      setHighlightMessageId(messageId);
      // Clear highlight after animation completes (matches ChatBubble animation duration)
      setTimeout(() => setHighlightMessageId(null), 2000);
    } catch (error) {
      console.error("Scroll to message error:", error);
      Toast.show({
        type: "error",
        text1: "Không thể cuộn đến tin nhắn",
        position: "top",
      });
    }
  }, [listData]);

  const handleActionSheetDismiss = useCallback(() => {
    setActionSheetVisible(false);
    setSelectedMessage(null);
    setHighlightMessageId(null);
  }, []);

  const handlePin = useCallback(async (messageId: string) => {
    if (isPinning || !conversationId) return;
    setIsPinning(true);
    console.log(`\n📌 [UI ACTION] Pinning message: ${messageId}`);
    try {
      const response = await pinMessage(messageId);
      console.log(`✅ [UI ACTION] Pin API success, code: ${response.code}`);
    } catch (err) {
      console.error(`❌ [UI ACTION] Pin failed:`, err);
    } finally {
      setIsPinning(false);
    }
  }, [isPinning, pinMessage, conversationId]);

  const handleUnpin = useCallback(async (messageId: string) => {
    if (isPinning || !conversationId) return;
    setIsPinning(true);
    console.log(`\n📍 [UI ACTION] Unpinning message: "${messageId}"`);

    try {
      const response = await unpinMessage(messageId);
      console.log(`✅ [UI ACTION] Unpin API success, code: ${response?.code}`);
    } catch (err) {
      console.error("❌ [UI ACTION] Unpin failed:", err);
    } finally {
      setIsPinning(false);
    }
  }, [isPinning, unpinMessage, conversationId]);

  const handleDelete = useCallback(async (message: ChatMessageResponse) => {
    const { Alert } = await import("react-native");
    Alert.alert(
      "Thu hồi tin nhắn",
      "Bạn có chắc chắn muốn thu hồi tin nhắn này?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Thu hồi",
          style: "destructive",
          onPress: async () => {
            console.log(`\n🗑️ [UI ACTION] Deleting message: ${message.id}`);
            try {
              await deleteMessage(message.id);
              console.log(`✅ [UI ACTION] Delete API success`);
            } catch (err) {
              console.error("❌ [UI ACTION] Delete failed:", err);
              showErrorToast("Lỗi", "Không thể thu hồi tin nhắn");
            }
          },
        },
      ]
    );
  }, [deleteMessage]);

  const handleReport = useCallback((message: ChatMessageResponse) => {
    setReportedMessage(message);
    setReportModalVisible(true);
  }, []);

  const handlePinnedBarTap = useCallback(() => {
    if (pinnedMessages.length === 0) return;
    const msg = pinnedMessages[pinnedIndex];
    const idx = messageIdToIndex.get(msg.id);
    if (idx !== undefined) {
      flashListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
      setHighlightMessageId(msg.id);
      setTimeout(() => setHighlightMessageId(null), 1500);
    }
    const next = (pinnedIndex + 1) % pinnedMessages.length;
    setPinnedIndex(next);
  }, [pinnedMessages, pinnedIndex, messageIdToIndex]);

  const onScrollToIndexFailed = useCallback((info: { index: number }) => {
    setTimeout(() => {
      flashListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
    }, 150);
  }, []);

  // 🔥 Memoize renderItem for FlashList
  const renderItem = useCallback(({ item }: { item: any }) => {
    if (item.type === "date") {
      return <DateSeparator dateString={item.date} />;
    }
    return (
      <SwipeableMessage
        message={item.message}
        currentUserId={currentUser?.id}
        onSwipeToReply={(msg) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setReplyingToMessage(msg);
        }}
      >
        <ChatBubble
          message={item.message}
          currentUserId={currentUser?.id}
          showSenderName={item.showSenderName}
          onLike={handleLike}
          onShowLikes={handleShowLikes}
          onLongPress={() => handleLongPress(item.message)}
          onReplyPress={scrollToMessage}
          isHighlighted={highlightMessageId === item.message.id}
          showAvatar={item.showAvatar}
        />
      </SwipeableMessage>
    );
  }, [currentUser?.id, handleLike, handleShowLikes, highlightMessageId, handleLongPress, scrollToMessage]);

  const keyExtractor = useCallback((item: any) => item.key, []);
  
  // 🔥 Handle Back with Cache Update
  const handleBack = useCallback(() => {
    if (conversationId) {
      const latestMessage = messages[messages.length - 1];
      const fallbackUpdatedAt = new Date().toISOString();

      // Optimistically update the conversations list cache
      queryClient.setQueryData<ConversationResponse[]>(
        ["conversations"],
        (prev) => {
          if (!Array.isArray(prev)) return prev;
          const next = prev.map((conv) => {
            if (conv.id !== conversationId) return conv;
            return {
              ...conv,
              updated_at: latestMessage?.created_at || fallbackUpdatedAt,
              last_message: latestMessage || conv.last_message,
              unread_count: 0,
              unreadCount: 0,
            };
          });

          // Sort: pinned first, then by date
          next.sort((a, b) => {
            const aPinned = a.is_pinned ?? false;
            const bPinned = b.is_pinned ?? false;
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            const aTime = a.last_message?.created_at || a.updated_at || a.created_at || "";
            const bTime = b.last_message?.created_at || b.updated_at || b.created_at || "";
            if (!aTime && !bTime) return 0;
            if (!aTime) return 1;
            if (!bTime) return -1;
            return new Date(bTime).getTime() - new Date(aTime).getTime();
          });

          return next;
        }
      );
    }

    // Delay refetch slightly to allow markRead API to process on backend
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.refetchQueries({ queryKey: ["conversations"], type: "all" });
    }, 500);

    // Luôn quay về danh sách tin nhắn
    router.push("/messages");
  }, [conversationId, messages, queryClient, router]);

  // 🔥 Typing indicators
  const { emitTyping, emitStopTyping } = useSocketTyping(conversationId);
  const typingUsersRedux = useAppSelector(state =>
    conversationId ? selectTypingUsersForConversation(state, conversationId) : []
  );

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Debug render state
  if (__DEV__) {
    console.log(`[CHAT RENDER] Pinned count: ${pinnedMessages.length}, Index: ${pinnedIndex}`);
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000000" : "#FFFFFF" }]}
      edges={["top"]}
    >
      {/* 🔥 Connection Status Banner */}
      <ConnectionBanner />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF", borderBottomColor: isDark ? "#2A2A2A" : "#E5E7EB" }]}>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={handleBack}
            className="mr-3"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>
          {/* Avatar */}
          <Image
            source={{
              uri: resolveUserAvatarUri(getAvatar(), getDisplayName()),
            }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
            contentFit="cover"
          />
          {/* Name */}
          <View className="flex-1 ml-3">
            <Text style={{ fontSize: 16, fontWeight: "bold", color: isDark ? "#FFFFFF" : "#000000" }}>
              {getDisplayName()}
            </Text>
            {conversation?.type === "DIRECT" && (
              <Text style={{ fontSize: 12, color: isDark ? "#9CA3AF" : "#6B7280", marginTop: 2 }}>Đang hoạt động</Text>
            )}
            {conversation?.type === "GROUP" && (
              <Text style={{ fontSize: 12, color: isDark ? "#9CA3AF" : "#6B7280", marginTop: 2 }}>
                {conversation.members && conversation.members.length > 0
                  ? `${conversation.members.length} thành viên`
                  : "0 thành viên"}
              </Text>
            )}
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Messages */}
        <View style={styles.messagesWrapper}>
          <PinnedMessageBar
            pinnedMessages={pinnedMessages}
            currentIndex={pinnedIndex}
            isDark={isDark}
            onTap={handlePinnedBarTap}
          />
          <FlashList
            ref={flashListRef}
            data={listData}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onScrollToIndexFailed={onScrollToIndexFailed}
            estimatedItemSize={80 as any}
            style={styles.messagesContainer}
            contentContainerStyle={[
              styles.messagesContent,
              { paddingTop: pinnedMessages.length > 0 ? PINNED_BAR_HEIGHT : 0 },
              listData.length === 0 && { flex: 1 },
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={(event) => {
              const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
              // Check if user scrolled up (not at bottom)
              const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
              setShowScrollToBottom(!isNearBottom && messages.length > 0);
              
              // Load more when scrolling to top
              if (contentOffset.y <= 100 && hasMore && !loading) {
                loadMore();
              }
            }}
            scrollEventThrottle={400}
            ListEmptyComponent={
              loading ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color="#34B27D" />
                  <Text className="text-gray-500 mt-2">Đang tải tin nhắn...</Text>
                </View>
              ) : (
                <View className="py-8 items-center">
                  <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
                  <Text className="text-gray-500 mt-4 text-center">
                    Chưa có tin nhắn nào
                  </Text>
                  <Text className="text-gray-400 text-sm mt-2 text-center">
                    Hãy bắt đầu cuộc trò chuyện
                  </Text>
                </View>
              )
            }
            ListFooterComponent={
              <>
                {typingUsersRedux.length > 0 && (
                  <TypingIndicatorBubble
                    usernames={typingUsersRedux.map(u => u.username)}
                  />
                )}
                {loading && messages.length > 0 && (
                  <View className="py-4 items-center">
                    <ActivityIndicator size="small" color="#34B27D" />
                  </View>
                )}
              </>
            }
            initialNumToRender={20}
            maxToRenderPerBatch={15}
            windowSize={10}
          />
          
          {/* Scroll to bottom button */}
          {showScrollToBottom && (
            <TouchableOpacity
              style={styles.scrollToBottomButton}
              onPress={() => {
                flashListRef.current?.scrollToEnd({ animated: true });
                setShowScrollToBottom(false);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-down" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
  
        {/* Preview ảnh / video trước khi gửi */}
        {selectedMedia && (
          <View style={styles.imagePreviewContainer}>
            {selectedMedia.kind === "video" ? (
              <Video
                source={{ uri: selectedMedia.uri }}
                style={styles.imagePreview}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
              />
            ) : (
              <Image
                source={{ uri: selectedMedia.uri }}
                style={styles.imagePreview}
                contentFit="cover"
              />
            )}
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setSelectedMedia(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
  
        {/* Reply Preview */}
        {replyingToMessage && (
          <View style={[styles.replyContainer, { backgroundColor: isDark ? "#1A1A1A" : "#F3F4F6", borderTopColor: isDark ? "#2A2A2A" : "#E5E7EB" }]}>
            <View style={styles.replyBar} />
            <View style={styles.replyContent}>
              <Text style={[styles.replyUser, { color: "#34B27D" }]}>
                Đang phản hồi {replyingToMessage.sender?.fullName || replyingToMessage.sender?.username || "Thành viên"}
              </Text>
              <Text style={[styles.replyText, { color: isDark ? "#9CA3AF" : "#6B7280" }]} numberOfLines={1}>
                {replyingToMessage.message_content || (replyingToMessage.message_type === "IMAGE" ? "Hình ảnh" : replyingToMessage.message_type === "VIDEO" ? "Video" : "Tin nhắn")}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setReplyingToMessage(null)}
              style={styles.closeReplyButton}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}
  
        {/* Input */}
        <View 
          style={[
            styles.inputContainer, 
            { 
              backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF", 
              borderTopColor: isDark ? "#2A2A2A" : "#E5E7EB",
              paddingBottom: isKeyboardVisible ? 0 : insets.bottom
            }
          ]}
        >
          <View style={styles.inputWrapper}>
          <TouchableOpacity 
            activeOpacity={0.7} 
            style={{ marginRight: 12 }}
            onPress={handlePickMedia}
            disabled={uploadingMedia}
          >
            <Ionicons 
              name="images-outline" 
              size={26} 
              color={uploadingMedia ? "#9CA3AF" : (isDark ? "#9CA3AF" : "#6B7280")} 
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <TextInput
              value={input}
              onChangeText={(text) => {
                setInput(text);
                if (text.length > 0) {
                  emitTyping();
                } else {
                  emitStopTyping();
                }
              }}
              placeholder="Nhắn tin..."
              style={{
                backgroundColor: isDark ? "#2A2A2A" : "#F3F4F6",
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: 10,
                fontSize: 15,
                color: isDark ? "#FFFFFF" : "#000000",
                maxHeight: 120,
              }}
              placeholderTextColor="#9CA3AF"
              multiline
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!loading}
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            className="ml-3"
            onPress={handleSend}
            disabled={(!input.trim() && !selectedMedia) || loading || uploadingMedia}
          >
            {uploadingMedia ? (
              <ActivityIndicator size="small" color="#34B27D" />
            ) : (
              <Ionicons
                name="send"
                size={24}
                color={(input.trim() || selectedMedia) && !loading ? "#34B27D" : "#9CA3AF"}
              />
            )}
          </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Likes Modal */}
      <MessageLikesModal
        visible={likesModalVisible}
        messageId={likesModalMessageId}
        onClose={() => {
          setLikesModalVisible(false);
          setLikesModalMessageId(null);
        }}
      />

      {/* Message Action Sheet (Pin/Unpin, etc.) */}
      <MessageActionSheet
        visible={actionSheetVisible}
        message={selectedMessage}
        onDismiss={handleActionSheetDismiss}
        onPin={handlePin}
        onUnpin={handleUnpin}
        onReply={(msg) => {
          setReplyingToMessage(msg);
          // Auto focus input
          // Note: TextInput doesn't have a direct ref here yet, but usually autofocus works when state changes if implemented
        }}
        onDelete={handleDelete}
        onReport={handleReport}
        currentUserId={currentUser?.id}
      />

      {/* Pinned Messages Modal */}
      <PinnedMessagesModal
        visible={pinnedModalVisible}
        conversationId={conversationId || ""}
        pinnedMessages={pinnedMessages}
        loading={isPinListLoading}
        onRefresh={refetchPinned}
        isDark={isDark}
        onClose={() => setPinnedModalVisible(false)}
        onUnpinMessage={handleUnpin}
        onJumpToMessage={(mid) => {
          const idx = messageIdToIndex.get(mid);
          if (idx !== undefined) {
             flashListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
          }
        }}
      />

      {/* Report Modal */}
      {reportedMessage && (
        <ReportModal
          visible={reportModalVisible}
          onClose={() => {
            setReportModalVisible(false);
            setReportedMessage(null);
          }}
          contentId={reportedMessage.id}
          contentType={ContentType.MESSAGE}
          contentTitle={
            reportedMessage.message_content 
              ? (reportedMessage.message_content.length > 30 
                  ? reportedMessage.message_content.substring(0, 30) + '...' 
                  : reportedMessage.message_content)
              : "Đính kèm media"
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  messagesWrapper: {
    flex: 1,
    position: "relative",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 16,
  },
  scrollToBottomButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#34B27D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  typingWrapper: {
    width: "100%",
    marginBottom: 12,
    paddingHorizontal: 16,
    alignItems: "flex-start",
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  typingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  imagePreviewContainer: {
    position: "relative",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
  },
  replyContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  replyBar: {
    width: 4,
    height: "100%",
    backgroundColor: "#34B27D",
    borderRadius: 2,
    marginRight: 12,
  },
  replyContent: {
    flex: 1,
    justifyContent: "center",
  },
  replyUser: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
  },
  closeReplyButton: {
    padding: 4,
  },
});
