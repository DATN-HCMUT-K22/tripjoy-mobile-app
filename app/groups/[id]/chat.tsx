import { ChatBubble } from "@/components/chat/ChatBubble";
import { DateSeparator } from "@/components/chat/DateSeparator";
import { MessageActionSheet } from "@/components/chat/MessageActionSheet";
import { MessageLikesModal } from "@/components/chat/MessageLikesModal";
import { PinnedMessageBar, PINNED_BAR_HEIGHT } from "@/components/chat/PinnedMessageBar";
import { mockItineraries } from "@/data/mockItineraries";
import { useMessages } from "@/hooks/useMessages";
import { usePinnedMessages } from "@/hooks/usePinnedMessages";
import { conversationService } from "@/services/conversations";
import { socketService } from "@/services/socket/socketService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCurrentOpenConversationId } from "@/store/slices/messageNotificationSlice";
import { useChatStore } from "@/stores/chat.store";
import { ChatMessageResponse } from "@/types/message";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

type ListItem =
  | { type: "date"; key: string; date: string }
  | { type: "message"; key: string; message: ChatMessageResponse; showSenderName: boolean };

export default function GroupChatScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{
    id?: string;
    conversationId?: string;
    name?: string;
    avatar?: string;
    memberCount?: string; // sẽ parse sang number
    scrollToEnd?: string; // "1" khi mở từ banner tin nhắn
    messageId?: string | string[]; // mở từ search tin nhắn / deep link
  }>();
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [likesModalMessageId, setLikesModalMessageId] = useState<string | null>(null);

  // ActionSheet, pin, highlight
  const [selectedMessage, setSelectedMessage] = useState<ChatMessageResponse | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const [currentPinnedIndex, setCurrentPinnedIndex] = useState(0);
  const [isPinning, setIsPinning] = useState(false);

  // Đảm bảo header bị tắt
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Lấy conversationId từ params
  const paramConversationId = (params as any).conversationId;
  const groupId = params.id;

  const messageIdFromParams = (() => {
    const raw = params.messageId as string | string[] | undefined;
    if (typeof raw === "string" && raw.length > 0) return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    return undefined;
  })();

  // Giá trị ban đầu lấy từ params (từ danh sách conversations) để tránh nhảy tên/đếm mem
  const initialNameFromParams = (params as any).name as string | undefined;
  const initialAvatarFromParams = (params as any).avatar as string | undefined;
  const initialMemberCountFromParams = (() => {
    const raw = (params as any).memberCount as string | undefined;
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  })();

  // ConversationId - chỉ dùng từ params, không cần load toàn bộ danh sách
  const conversationId = paramConversationId || null;

  // Conversation đang mở — dùng để không hiện banner tin nhắn từ chính conversation này
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
      return () => {
        setCurrentChatId(null);
      };
    }
  }, [conversationId, setCurrentChatId, resetUnread]);
  
  // Load conversation info để lấy members và tên nhóm
  const { data: conversation } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      if (!conversationId) {
        console.warn("⚠️ [GROUP CHAT] No conversationId to load");
        return null;
      }
      // Load từ API
      console.log(`📥 [GROUP CHAT] Loading conversation from API: ${conversationId}`);
      const response = await conversationService.getConversationById(
        conversationId
      );
      if (response.code === 1000 && response.data) {
        console.log("✅ [GROUP CHAT] Conversation loaded from API");
        console.log(`API conversation members:`, response.data.members);
        console.log(`API conversation members length:`, response.data.members?.length);
        return response.data;
      }
      console.error("❌ [GROUP CHAT] Failed to load conversation");
      return null;
    },
    enabled: !!conversationId, // Chỉ query nếu có conversationId
  });
  

  // Pinned messages
  const { pinnedMessages, refetch: refetchPinned } = usePinnedMessages(conversationId);

  // Sử dụng useMessages hook - chỉ load nếu có conversationId hợp lệ
  const {
    messages,
    loading,
    error,
    hasMore,
    typingUsers,
    sendMessage,
    likeMessage,
    unlikeMessage,
    pinMessage,
    unpinMessage,
    loadMore,
    refresh,
  } = useMessages({
    conversationId: conversationId || "",
    autoLoad: !!conversationId, // Chỉ auto load nếu có conversationId
    pageSize: 20,
  });

  // Log error nếu không có conversationId và hiển thị error state
  const hasConversationIdError = !conversationId && groupId;
  
  useEffect(() => {
    if (hasConversationIdError) {
      console.error("\n❌ [GROUP CHAT] Missing conversationId!");
      console.error(`Group ID: ${groupId}`);
      console.error(`Param Conversation ID: ${paramConversationId || "N/A"}`);
      console.error("Cannot load messages without conversationId");
      console.error("================================\n");
    }
  }, [hasConversationIdError, groupId, paramConversationId]);

  // Lấy group info từ API trực tiếp từ groupId (từ params)
  const { data: groupInfo } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      if (!groupId) return null;
      const { groupService } = await import("@/services/groups");
      const response = await groupService.getGroupById(groupId);
      if (response.code === 1000 && response.data) {
        return response.data;
      }
      return null;
    },
    enabled: !!groupId, // Load trực tiếp từ groupId
  });

  // Tính số thành viên — ưu tiên API group/conversation (đúng dữ liệu); params chỉ fallback khi chưa load
  const memberCount = useMemo(() => {
    if (groupInfo?.members && Array.isArray(groupInfo.members) && groupInfo.members.length > 0) {
      return groupInfo.members.length;
    }
    if (conversation?.members && Array.isArray(conversation.members) && conversation.members.length > 0) {
      return conversation.members.length;
    }
    if (typeof initialMemberCountFromParams === "number") {
      return initialMemberCountFromParams;
    }
    return 0;
  }, [initialMemberCountFromParams, conversation, groupInfo]);

  // Tên nhóm — BE thường sai/khác ở field conversation.name trong inbox; GET /groups/{id} đáng tin hơn
  const groupName = useMemo(() => {
    if (groupInfo?.name) return groupInfo.name;
    if (conversation?.name) return conversation.name;
    if (initialNameFromParams) return initialNameFromParams;
    return "Nhóm chat";
  }, [groupInfo?.name, conversation?.name, initialNameFromParams]);

  const groupAvatar = useMemo(() => {
    if (groupInfo?.avatar) return groupInfo.avatar;
    if (conversation?.avatar) return conversation.avatar;
    if (initialAvatarFromParams) return initialAvatarFromParams;
    return null;
  }, [groupInfo?.avatar, conversation?.avatar, initialAvatarFromParams]);

  // Debounce typing indicator
  useEffect(() => {
    if (!conversationId || !socketService.isConnected()) return;

    // Clear timeout cũ
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Nếu có text, gửi typing
    if (input.trim().length > 0) {
      socketService.sendTyping(conversationId);
      // Auto stop typing sau 3 giây không gõ
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendStopTyping(conversationId);
      }, 3000) as any;
    } else {
      // Nếu không có text, stop typing ngay
      socketService.sendStopTyping(conversationId);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [input, conversationId]);

  // Handle send message
  const handleSend = async () => {
    // Validation
    if (!input.trim()) {
      console.warn("⚠️ [CHAT] Cannot send empty message");
      return;
    }

    if (!conversationId) {
      console.error("❌ [CHAT] Cannot send message - conversationId is missing");
      console.error("Params:", params);
      console.error("Group ID:", groupId);
      Alert.alert(
        "Lỗi", 
        "Không tìm thấy cuộc trò chuyện. Vui lòng thử lại sau."
      );
      return;
    }

    const content = input.trim();
    setInput("");

    // Stop typing
    if (socketService.isConnected()) {
      socketService.sendStopTyping(conversationId);
    }

    console.log("\n📤 [CHAT] Sending message");
    console.log(`ConversationId: ${conversationId}`);
    console.log(`Content: ${content}`);
    console.log(`Content length: ${content.length}`);
    
    try {
      const result = await sendMessage(content);
      if (!result) {
        console.error("❌ [CHAT] Failed to send message - result is null");
        // Lấy error message từ hook nếu có
        const errorMsg = error || "Không thể gửi tin nhắn. Vui lòng thử lại.";
        Alert.alert("Lỗi", errorMsg);
        setInput(content); // Restore input nếu lỗi
      } else {
        console.log("✅ [CHAT] Message sent successfully");
        console.log("Message result:", result);
      }
    } catch (err: any) {
      console.error("❌ [CHAT] Exception when sending message:", err);
      console.error("Error details:", {
        message: err?.message,
        status: err?.status || err?.response?.status,
        data: err?.response?.data,
        stack: err?.stack,
      });
      const errorMsg = err?.response?.data?.message || 
                      err?.message || 
                      "Không thể gửi tin nhắn. Vui lòng thử lại.";
      Alert.alert("Lỗi", errorMsg);
      setInput(content); // Restore input nếu lỗi
    }
  };

  // Handle like/unlike (API: is_liked_by_current_user / like_count)
  const handleLike = useCallback(
    async (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;
      const isLiked = msg.is_liked_by_current_user === true;
      if (isLiked) await unlikeMessage(messageId);
      else await likeMessage(messageId);
    },
    [messages, likeMessage, unlikeMessage]
  );

  const handleShowLikes = useCallback((messageId: string) => {
    setLikesModalMessageId(messageId);
    setLikesModalVisible(true);
  }, []);

  // Lấy lịch trình gần đây từ mockItineraries dựa trên groupId
  const recentItinerary = useMemo(() => {
    if (!params.id) return null;
    const groupItineraries = mockItineraries.filter(
      (it) => `${it.groupId}` === `${params.id}`
    );
    if (groupItineraries.length === 0) return null;

    // Lấy lịch trình mới nhất (sắp xếp theo startDate)
    const latest = groupItineraries.sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )[0];

    // Format date
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    return {
      name: latest.name,
      image: latest.image,
      startDate: formatDate(latest.startDate),
      endDate: formatDate(latest.endDate),
    };
  }, [params.id]);

  // FlatList data: date separators + messages; map messageId -> index
  const { listData, messageIdToIndex } = useMemo(() => {
    const list: ListItem[] = [];
    const map = new Map<string, number>();
    let prev: ChatMessageResponse | null = null;
    messages.forEach((msg) => {
      const showSep = shouldShowDateSeparator(msg, prev);
      const showSender = !prev || prev.sender_id !== msg.sender_id;
      if (showSep) {
        list.push({ type: "date", key: `date-${msg.id}-${msg.created_at}`, date: msg.created_at });
      }
      list.push({ type: "message", key: msg.id, message: msg, showSenderName: showSender });
      map.set(msg.id, list.length - 1);
      prev = msg;
    });
    return { listData: list, messageIdToIndex: map };
  }, [messages]);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Reset currentPinnedIndex khi danh sách pinned thay đổi
  useEffect(() => {
    setCurrentPinnedIndex(0);
  }, [pinnedMessages.length]);

  const scrollToEndParam = (params as any).scrollToEnd;
  const lastMessageIdRef = useRef<string | null>(null);
  const hasScrolledToBottomRef = useRef(false);
  /** Chỉ cuộn tới messageId từ params một lần (tránh mỗi lần messages đổi lại nhảy) */
  const appliedParamMessageScrollRef = useRef<string | null>(null);
  
  // Auto scroll to bottom khi có tin mới, load messages lần đầu, hoặc mở từ notification (scrollToEnd=1)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const isNewMessage = lastMessage.id !== lastMessageIdRef.current;
      let shouldScroll = isNewMessage || !hasScrolledToBottomRef.current || scrollToEndParam === "1";
      // Mở với messageId (search): không cuộn xuống đáy lần đầu khi tin đã có trong list — để effect bên dưới cuộn tới tin
      if (
        messageIdFromParams &&
        !hasScrolledToBottomRef.current &&
        scrollToEndParam !== "1" &&
        messageIdToIndex.get(messageIdFromParams) !== undefined
      ) {
        shouldScroll = false;
      }

      if (shouldScroll) {
        lastMessageIdRef.current = lastMessage.id;
        hasScrolledToBottomRef.current = true;
        const delay = scrollToEndParam === "1" ? 300 : 100;
        const t = setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, delay);
        return () => clearTimeout(t);
      }
    } else {
      // Reset khi không có messages
      hasScrolledToBottomRef.current = false;
      lastMessageIdRef.current = null;
    }
  }, [messages, scrollToEndParam, messageIdFromParams, messageIdToIndex]);

  // Cuộn tới tin khi mở từ search (giống app/chat/[id])
  useEffect(() => {
    if (!messageIdFromParams) {
      appliedParamMessageScrollRef.current = null;
      return;
    }
    if (appliedParamMessageScrollRef.current === messageIdFromParams) return;

    const idx = messageIdToIndex.get(messageIdFromParams);
    if (idx === undefined) {
      if (!loading && messages.length > 0) {
        const t = setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
          const last = messages[messages.length - 1];
          if (last) {
            lastMessageIdRef.current = last.id;
            hasScrolledToBottomRef.current = true;
          }
          appliedParamMessageScrollRef.current = messageIdFromParams;
        }, 200);
        return () => clearTimeout(t);
      }
      return;
    }
    const t = setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
      setHighlightMessageId(messageIdFromParams);
      setTimeout(() => setHighlightMessageId(null), 1500);
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        lastMessageIdRef.current = lastMessage.id;
        hasScrolledToBottomRef.current = true;
      }
      appliedParamMessageScrollRef.current = messageIdFromParams;
    }, 250);
    return () => clearTimeout(t);
  }, [messageIdFromParams, messageIdToIndex, messages, loading]);

  // Auto scroll to bottom khi có user đang typing
  useEffect(() => {
    if (typingUsers.length > 0) {
      const t = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [typingUsers.length]);

  // Handlers: long-press, pin, action sheet, pinned bar tap
  const handleLongPress = useCallback((msg: ChatMessageResponse) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMessage(msg);
    setActionSheetVisible(true);
    setHighlightMessageId(msg.id);
  }, []);

  const handleActionSheetDismiss = useCallback(() => {
    setActionSheetVisible(false);
    setSelectedMessage(null);
    setHighlightMessageId(null);
  }, []);

  const handlePin = useCallback(
    async (messageId: string) => {
      if (isPinning) return;
      setIsPinning(true);
      try {
        await pinMessage(messageId);
        await refetchPinned();
      } finally {
        setIsPinning(false);
      }
    },
    [isPinning, pinMessage, refetchPinned]
  );

  const handleUnpin = useCallback(
    async (messageId: string) => {
      if (isPinning) return;
      setIsPinning(true);
      try {
        await unpinMessage(messageId);
        await refetchPinned();
      } finally {
        setIsPinning(false);
      }
    },
    [isPinning, unpinMessage, refetchPinned]
  );

  const handlePinnedBarTap = useCallback(() => {
    if (pinnedMessages.length === 0) return;
    const msg = pinnedMessages[currentPinnedIndex];
    const idx = messageIdToIndex.get(msg.id);
    if (idx !== undefined) {
      flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
      setHighlightMessageId(msg.id);
      setTimeout(() => setHighlightMessageId(null), 1500);
    }
    const next = (currentPinnedIndex + 1) % pinnedMessages.length;
    setCurrentPinnedIndex(next);
  }, [pinnedMessages, currentPinnedIndex, messageIdToIndex]);

  const onScrollToIndexFailed = useCallback((info: { index: number }) => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
    }, 150);
  }, []);

  const renderListItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === "date") {
        return <DateSeparator dateString={item.date} />;
      }
      return (
        <ChatBubble
          message={item.message}
          currentUserId={currentUser?.id}
          showSenderName={item.showSenderName}
          onLike={handleLike}
          onShowLikes={handleShowLikes}
          onLongPress={() => handleLongPress(item.message)}
          isHighlighted={highlightMessageId === item.message.id}
        />
      );
    },
    [currentUser?.id, highlightMessageId, handleLike, handleLongPress]
  );

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: isDark ? "#000000" : "#FFFFFF" }]} 
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF", borderBottomColor: isDark ? "#2A2A2A" : "#E5E7EB" }]}>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push("/messages");
              }
            }}
            className="mr-3"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          {/* Group Avatar */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (conversation?.group_id || params.id) {
                router.push(`/groups/${conversation?.group_id || params.id}/info` as any);
              }
            }}
          >
            {groupAvatar ? (
              <Image
                source={{ uri: groupAvatar }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#34B27D",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text className="text-white text-lg font-bold">
                  {groupName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {/* Group Name and Member Count */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (conversation?.group_id || params.id) {
                router.push(`/groups/${conversation?.group_id || params.id}/info` as any);
              }
            }}
            className="flex-1 ml-3"
          >
            <Text className="text-base font-bold text-black">
              {groupName}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              {memberCount} thành viên
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Information Banner - Lịch trình gần đây */}
      {recentItinerary && (
        <TouchableOpacity
          activeOpacity={0.8}
          className="overflow-hidden"
          style={{
            backgroundColor: "rgba(61, 158, 117, 0.58)", // #3D9E75 với opacity 58%
            width: "100%",
          }}
        >
          <View className="flex-row items-center p-3">
            {/* Itinerary Image */}
            <Image
              source={{ uri: recentItinerary.image }}
              style={{ width: 80, height: 80, borderRadius: 12 }}
              contentFit="cover"
            />
            {/* Text Content */}
            <View className="flex-1 ml-3">
              <Text className="text-sm text-white mb-1 font-medium">
                Lịch trình gần đây
              </Text>
              <Text className="text-base font-bold text-white mb-1">
                {recentItinerary.name}
              </Text>
              <Text className="text-sm text-white">
                {recentItinerary.startDate} - {recentItinerary.endDate}
              </Text>
            </View>
            {/* Arrow and View Details */}
            <View className="items-end">
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              <Text className="text-sm font-semibold text-white mt-1">
                Xem chi tiết
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Messages: FlatList + PinnedMessageBar (absolute, không chiếm flow) */}
      <View style={styles.messagesWrapper}>
        <FlatList
          ref={flatListRef}
          data={listData}
          keyExtractor={(i) => i.key}
          renderItem={renderListItem}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            listData.length === 0 && { flex: 1 },
            pinnedMessages.length > 0 && { paddingTop: PINNED_BAR_HEIGHT },
          ]}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const { contentOffset } = e.nativeEvent;
          if (contentOffset.y <= 100 && hasMore && !loading) loadMore();
        }}
        scrollEventThrottle={400}
        onScrollToIndexFailed={onScrollToIndexFailed}
        ListEmptyComponent={
          loading && messages.length === 0 ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#34B27D" />
              <Text className="text-gray-500 mt-2">Đang tải tin nhắn...</Text>
            </View>
          ) : !loading && !error && messages.length === 0 ? (
            <View className="py-8 items-center">
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text className="text-gray-500 mt-4 text-center">Chưa có tin nhắn nào</Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">Hãy bắt đầu cuộc trò chuyện</Text>
            </View>
          ) : (error || hasConversationIdError) && messages.length === 0 ? (
            <View className="py-8 items-center px-4">
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ionicons name="alert-circle" size={32} color="#ef4444" />
              </View>
              <Text className="text-red-500 text-base font-semibold mt-2 text-center">
                {hasConversationIdError ? "Không tìm thấy cuộc trò chuyện. Vui lòng quay lại và thử lại." : error || "Đã xảy ra lỗi khi tải tin nhắn"}
              </Text>
              {!hasConversationIdError ? (
                <TouchableOpacity onPress={() => refresh()} className="mt-6 bg-primary px-6 py-3 rounded-full" activeOpacity={0.8}>
                  <Text className="text-white text-sm font-semibold">Thử lại</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => { if (router.canGoBack()) router.back(); else router.push("/messages"); }} className="mt-6 bg-primary px-6 py-3 rounded-full" activeOpacity={0.8}>
                  <Text className="text-white text-sm font-semibold">Quay lại</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
        ListFooterComponent={
          <>
            {typingUsers.length > 0 && (
              <View style={styles.typingWrapper}>
                <View style={styles.typingRow}>
                  <View style={styles.typingAvatar}>
                    <ActivityIndicator size="small" color="#9CA3AF" />
                  </View>
                  <Text className="text-gray-500 text-sm font-medium">
                    {typingUsers.length === 1 ? "Đang gõ..." : `${typingUsers.length} người đang gõ...`}
                  </Text>
                </View>
              </View>
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
        <PinnedMessageBar
          pinnedMessages={pinnedMessages}
          currentIndex={currentPinnedIndex}
          onTap={handlePinnedBarTap}
          isDark={isDark}
        />
      </View>

      {/* Input */}
      <SafeAreaView 
        edges={["bottom"]} 
        style={[styles.inputContainer, { backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF", borderTopColor: isDark ? "#2A2A2A" : "#E5E7EB" }]}
      >
        <View style={styles.inputWrapper}>
        <TouchableOpacity activeOpacity={0.7} className="mr-3">
          <Ionicons name="image-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
        <View className="flex-1">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Nhắn tin..."
            className="bg-gray-100 rounded-full px-4 py-3 text-sm"
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
          disabled={!input.trim() || loading}
        >
          <Ionicons
            name="send"
            size={24}
            color={input.trim() && !loading ? "#34B27D" : "#9CA3AF"}
          />
        </TouchableOpacity>
        </View>
      </SafeAreaView>

      <MessageActionSheet
        visible={actionSheetVisible}
        message={selectedMessage}
        onDismiss={handleActionSheetDismiss}
        onPin={handlePin}
        onUnpin={handleUnpin}
      />
      <MessageLikesModal
        visible={likesModalVisible}
        messageId={likesModalMessageId}
        onClose={() => {
          setLikesModalVisible(false);
          setLikesModalMessageId(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesWrapper: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 16,
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
});
