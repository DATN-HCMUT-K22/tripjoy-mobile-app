import { SharedHeader } from "@/components/common/SharedHeader";
import { ConversationAvatar } from "@/components/conversation/ConversationAvatar";
import { ConversationListSkeleton } from "@/components/conversation/ConversationSkeleton";
import { SwipeableConversationItem } from "@/components/conversation/SwipeableConversationItem";
import { UnreadBadge } from "@/components/conversation/UnreadBadge";
import { useConversations } from "@/hooks/useConversations";
import { searchService } from "@/services/search";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { deleteConversation, togglePin } from "@/store/slices/conversationSlice";
import { useChatStore } from "@/stores/chat.store";
import { ConversationResponse } from "@/types/message";
import { MessageSearchResponse, UserSimpleResponse } from "@/types/search";
import { getDirectPeerAvatarUrl } from "@/utils/conversationDisplay";
import { formatRelativeTime } from "@/utils/timeFormat";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter, useFocusEffect } from "expo-router";
import debounce from "lodash.debounce";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "personal" | "group";

const SEARCH_PAGE_SIZE = 20;

/** Chỉ user đã chọn từ kết quả tìm — lưu local AsyncStorage */
type RecentSearchUser = {
  userId: string;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
};

const RECENT_USERS_KEY = "@tripjoy:messageSearchRecentUsers";
const RECENT_V2_KEY = "@tripjoy:messageSearchRecentV2";

function parseRecentUsersFromStorage(stored: string | null): RecentSearchUser[] {
  if (!stored) return [];
  try {
    const raw = JSON.parse(stored) as unknown;
    if (!Array.isArray(raw)) return [];
    const out: RecentSearchUser[] = [];
    for (const x of raw) {
      if (!x || typeof x !== "object") continue;
      const o = x as Record<string, unknown>;
      if (typeof o.userId === "string" && typeof o.username === "string") {
        out.push({
          userId: o.userId,
          username: o.username,
          fullName: (o.fullName as string) ?? null,
          avatarUrl: (o.avatarUrl as string) ?? null,
        });
      } else if (o.type === "user" && typeof o.userId === "string" && typeof o.username === "string") {
        out.push({
          userId: o.userId,
          username: o.username,
          fullName: (o.fullName as string) ?? null,
          avatarUrl: (o.avatarUrl as string) ?? null,
        });
      }
    }
    return out.slice(0, 12);
  } catch {
    return [];
  }
}

// Helper function để format time:
// - Cùng ngày: HH:mm
// - Khác ngày: English date (vd: Apr 6)
const formatTime = (dateString?: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const renderHighlightedText = (
  text: string,
  keyword: string,
  defaultClassName: string
) => {
  const query = keyword.trim();
  if (!query) {
    return <Text className={defaultClassName}>{text}</Text>;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <Text className={defaultClassName}>
      {parts.map((part, idx) => {
        const matched = part.toLowerCase() === query.toLowerCase();
        return (
          <Text key={`${part}-${idx}`} className={matched ? "text-primary font-semibold" : undefined}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
};

/** Một dòng kết quả tìm tin nhắn: tên + ảnh nhóm (hoặc chat riêng), người gửi, nội dung */
interface SearchMessageResultRowProps {
  message: MessageSearchResponse;
  conversation?: ConversationResponse;
  trimmedKeyword: string;
  onPress: () => void;
  currentUserId?: string;
}

const SearchMessageResultRow: React.FC<SearchMessageResultRowProps> = ({
  message,
  conversation,
  trimmedKeyword,
  onPress,
  currentUserId,
}) => {
  const isGroup = conversation?.type === "GROUP" && !!conversation.group_id;

  const { data: groupInfo } = useQuery({
    queryKey: ["group", conversation?.group_id],
    queryFn: async () => {
      if (!conversation?.group_id) return null;
      const { getGroupById, isGroupApiSuccess } = await import("@/services/groups");
      const response = await getGroupById(conversation.group_id);
      if (isGroupApiSuccess(response.code) && response.data) return response.data;
      return null;
    },
    enabled: isGroup,
  });

  const groupTitle = isGroup
    ? groupInfo?.name || conversation?.name || "Nhóm chat"
    : null;
  const groupAvatarUri = isGroup
    ? groupInfo?.avatar || conversation?.avatar || null
    : null;

  let headerTitle = groupTitle;
  let avatarUri: string | null = groupAvatarUri;

  if (!isGroup && conversation?.type === "DIRECT" && conversation.members?.length) {
    const other = conversation.members.find((m) => m.id !== currentUserId);
    headerTitle = other?.fullName || other?.username || "Chat riêng";
      avatarUri =
        getDirectPeerAvatarUrl(conversation, currentUserId) ||
        other?.avatarUrl ||
        other?.avatar_url ||
        null;
  } else if (!isGroup && !headerTitle) {
    headerTitle = "Tin nhắn";
    avatarUri = null;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row py-3 border-b border-gray-100"
    >
      <View>
        <Image
          source={{
            uri: resolveUserAvatarUri(avatarUri, headerTitle || undefined),
          }}
          style={{ width: 44, height: 44, borderRadius: 22 }}
          contentFit="cover"
        />
      </View>
      <View className="flex-1 ml-3 min-w-0">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {headerTitle}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
          {message.sender?.fullName || message.sender?.full_name || message.sender?.username || "Người dùng"} ·{" "}
          {formatTime(message.created_at)}
        </Text>
        <View className="mt-1">
          {renderHighlightedText(
            message.message_content || "",
            trimmedKeyword,
            "text-sm text-gray-800"
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Conversation Item Component
interface ConversationItemProps {
  conversation: ConversationResponse;
  onPress: () => void;
  onLongPress?: () => void;
  currentUserId?: string;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
  onLongPress,
  currentUserId,
}) => {
  const dispatch = useAppDispatch();
  const { updateConversation, markConversationRead } = useConversations();
  // Load group info nếu là GROUP và không có name
  const { data: groupInfo } = useQuery({
    queryKey: ["group", conversation.group_id],
    queryFn: async () => {
      if (!conversation.group_id) return null;
      const { getGroupById, isGroupApiSuccess } = await import("@/services/groups");
      const response = await getGroupById(conversation.group_id);
      if (isGroupApiSuccess(response.code) && response.data) {
        return response.data;
      }
      return null;
    },
    // Luôn gọi GET /groups/{id} cho nhóm: inbox có thể trả conversation.name sai nhưng vẫn non-null
    enabled: conversation.type === "GROUP" && !!conversation.group_id,
  });

  // Avatar: nhóm = ảnh nhóm; DIRECT = ảnh đối phương trước, rồi mới `conversation.avatar`
  const getAvatar = () => {
    if (conversation.type === "GROUP" && groupInfo?.avatar) return groupInfo.avatar;
    if (conversation.type === "DIRECT") {
      const peer = getDirectPeerAvatarUrl(conversation, currentUserId);
      if (peer) return peer;
      if (conversation.avatar) return conversation.avatar;
      return null;
    }
    if (conversation.avatar) return conversation.avatar;
    return null;
  };

  // Lấy tên hiển thị
  const getDisplayName = () => {
    if (conversation.type === "DIRECT" && conversation.members && conversation.members.length > 0) {
      const otherMember = conversation.members.find(
        (m) => m.id !== currentUserId
      );
      return otherMember?.fullName || otherMember?.full_name || otherMember?.username || "Người dùng";
    }

    // GROUP: ưu tiên tên từ GET /groups/{id} (đúng với bảng group), conversation.name từ inbox thường lệch BE
    if (conversation.type === "GROUP" && conversation.group_id) {
      if (groupInfo?.name) return groupInfo.name;
      if (conversation.name) return conversation.name;
      return "Nhóm chat";
    }

    if (conversation.name) return conversation.name;
    return "Nhóm chat";
  };

  const avatar = getAvatar();
  const displayName = getDisplayName();
  const displayTime =
    conversation.last_message?.created_at ||
    conversation.updated_at ||
    conversation.created_at ||
    "";
  // Hiển thị "Tên: nội dung tin nhắn" từ last_message; nếu không có sender thì chỉ nội dung
  const getLastMessageSubtitle = (): string => {
    const lm = conversation.last_message;
    if (!lm) return "Chưa có tin nhắn";
    const senderName =
      lm.sender?.fullName || lm.sender?.full_name || lm.sender?.username || null;
    const content = lm.message_content?.trim() || "";
    if (senderName && content) return `${senderName}: ${content}`;
    if (content) return content;
    return "Chưa có tin nhắn";
  };
  const lastMessageSubtitle = getLastMessageSubtitle();
  // Get unread count from chat store (managed by useIncomingMessage)
  const unreadMap = useChatStore((state) => state.unreadCount);
  const hasLocalUnread = Object.prototype.hasOwnProperty.call(unreadMap, conversation.id);
  const unreadCount = hasLocalUnread
    ? Math.max(0, unreadMap[conversation.id] ?? 0)
    : Math.max(0, conversation.unread_count ?? 0);
  const isPinned = conversation.is_pinned ?? false;

  // 🔥 Swipe action handlers
  const handlePin = async () => {
    try {
      await updateConversation({
        conversationId: conversation.id,
        payload: { is_pinned: !isPinned },
      });
      dispatch(togglePin({ conversationId: conversation.id }));
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Xóa cuộc trò chuyện',
      'Bạn có chắc muốn xóa cuộc trò chuyện này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteConversation({ conversationId: conversation.id }));
          },
        },
      ]
    );
  };

  const handleMarkUnread = async () => {
    // Mark as unread by setting unread count to 1
    useChatStore.getState().setUnread(conversation.id, 1);
  };

  return (
    <SwipeableConversationItem
      conversationId={conversation.id}
      isPinned={isPinned}
      onPin={handlePin}
      onDelete={handleDelete}
      onMarkUnread={handleMarkUnread}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        onLongPress={onLongPress}
        className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white"
      >
        {/* 🔥 Enhanced Avatar with online status */}
        <View className="relative">
          <ConversationAvatar
            uri={resolveUserAvatarUri(avatar, displayName)}
            size={56}
            isOnline={conversation.type === "DIRECT"}
            showOnlineStatus={false}
          />
          {/* Pin indicator */}
          {isPinned && (
            <View
              className="absolute -top-1 -right-1 bg-primary rounded-full"
              style={{ padding: 2 }}
            >
              <Ionicons name="pin" size={12} color="#fff" />
            </View>
          )}
        </View>

        {/* Content */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-bold text-black flex-1" numberOfLines={1}>
              {displayName}
            </Text>
            {displayTime ? (
              <Text className="text-xs text-gray-500 ml-2">
                {formatRelativeTime(displayTime)}
              </Text>
            ) : null}
          </View>
          <View className="flex-row items-center">
            <Text className="text-sm text-gray-600 flex-1" numberOfLines={1}>
              {lastMessageSubtitle}
            </Text>
            {/* 🔥 Gradient Unread Badge */}
            <View className="ml-2">
              <UnreadBadge count={unreadCount} size="medium" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </SwipeableConversationItem>
  );
};

export default function MessagesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "#F3F4F6" : "#111827";
  const textColor = isDark ? "#F3F4F6" : "#111827";
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchUsers, setSearchUsers] = useState<UserSimpleResponse[]>([]);
  const [searchMessages, setSearchMessages] = useState<MessageSearchResponse[]>([]);
  const [searchPage, setSearchPage] = useState(0);
  const [hasMoreSearchMessages, setHasMoreSearchMessages] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentSearchUser[]>([]);
  /** Chỉ hiện "Tìm kiếm gần đây" khi đang focus ô tìm kiếm */
  const [searchInputFocused, setSearchInputFocused] = useState(false);
  const currentUser = useAppSelector((state) => state.auth.user);
  const userSearchAbortRef = useRef<AbortController | null>(null);
  const messageSearchAbortRef = useRef<AbortController | null>(null);
  const latestSearchRequestRef = useRef(0);

  const {
    directConversations,
    groupConversations,
    isLoading,
    error,
    refetch,
    createConversation,
    updateConversation,
  } = useConversations();

  const conversations =
    activeTab === "personal" ? directConversations : groupConversations;

  // Refresh data when screen is focused (e.g. returning from chat)
  useFocusEffect(
    useCallback(() => {
      console.log("[MessagesScreen] Screen focused, refetching conversations...");
      refetch();
    }, [refetch])
  );

  const debouncedSearch = useMemo(() => debounce((value: string) => void runSearch(value), 300), []);

  /** Map conversationId -> conversation (nhóm + cá nhân) để mở đúng màn từ kết quả search tin nhắn */
  const conversationById = useMemo(() => {
    const map = new Map<string, ConversationResponse>();
    for (const c of groupConversations) map.set(c.id, c);
    for (const c of directConversations) map.set(c.id, c);
    return map;
  }, [groupConversations, directConversations]);

  const trimmedKeyword = searchKeyword.trim();
  /** Cả tab Cá nhân và Nhóm đều có ô tìm kiếm */
  const shouldShowSearchUI = true;
  const isSearching = trimmedKeyword.length > 0;

  const matchedLocalConversations = useMemo(() => {
    if (!isSearching) return [];
    const query = trimmedKeyword.toLowerCase();
    if (activeTab === "group") {
      return groupConversations.filter((conversation) =>
        (conversation.name || "Nhóm chat").toLowerCase().includes(query)
      );
    }
    return directConversations.filter((conversation) => {
      if (conversation.type !== "DIRECT" || !conversation.members?.length) return false;
      const other = conversation.members.find((m) => m.id !== currentUser?.id);
      const label = (other?.fullName || other?.username || "").toLowerCase();
      return label.includes(query);
    });
  }, [
    activeTab,
    directConversations,
    groupConversations,
    isSearching,
    trimmedKeyword,
    currentUser?.id,
  ]);

  const matchedConversationsSectionTitle =
    activeTab === "group" ? "Nhóm chat" : "Tin nhắn cá nhân";

  useEffect(() => {
    const loadRecent = async () => {
      let stored = await AsyncStorage.getItem(RECENT_USERS_KEY);
      if (!stored) {
        const v2 = await AsyncStorage.getItem(RECENT_V2_KEY);
        if (v2) {
          const users = parseRecentUsersFromStorage(v2);
          if (users.length > 0) {
            await AsyncStorage.setItem(RECENT_USERS_KEY, JSON.stringify(users));
            stored = await AsyncStorage.getItem(RECENT_USERS_KEY);
          }
        }
      }
      setRecentUsers(parseRecentUsersFromStorage(stored));
    };
    loadRecent();
  }, []);

  const addRecentUser = useCallback((user: UserSimpleResponse) => {
    setRecentUsers((prev) => {
      const filtered = prev.filter((item) => item.userId !== user.id);
      const next: RecentSearchUser[] = [
        {
          userId: user.id,
          username: user.username,
          fullName: user.fullName || user.full_name,
          avatarUrl: user.avatarUrl || user.avatar_url,
        },
        ...filtered,
      ].slice(0, 12);
      AsyncStorage.setItem(RECENT_USERS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /** Đổi tab: reset ô tìm kiếm và kết quả về trạng thái ban đầu */
  useEffect(() => {
    // Không tự ý xóa searchKeyword và kết quả khi đổi tab nếu đang gõ tìm kiếm
    // để kết quả search toàn cục (người dùng, tin nhắn) được giữ nguyên.
    if (!trimmedKeyword) {
      userSearchAbortRef.current?.abort();
      messageSearchAbortRef.current?.abort();
      debouncedSearch.cancel();
      setSearchKeyword("");
      setSearchUsers([]);
      setSearchMessages([]);
      setSearchPage(0);
      setHasMoreSearchMessages(false);
      setSearchError(null);
      setSearchLoading(false);
      setSearchLoadingMore(false);
      setSearchInputFocused(false);
    }
  }, [activeTab, debouncedSearch, trimmedKeyword]);

  const runSearch = async (keyword: string) => {
    const q = keyword.trim();
    if (!q) {
      userSearchAbortRef.current?.abort();
      messageSearchAbortRef.current?.abort();
      setSearchUsers([]);
      setSearchMessages([]);
      setSearchPage(0);
      setHasMoreSearchMessages(false);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    const requestId = Date.now();
    latestSearchRequestRef.current = requestId;
    userSearchAbortRef.current?.abort();
    messageSearchAbortRef.current?.abort();
    const userController = new AbortController();
    const messageController = new AbortController();
    userSearchAbortRef.current = userController;
    messageSearchAbortRef.current = messageController;
    setSearchLoading(true);
    setSearchError(null);
    setSearchPage(0);

    try {
      const results = await Promise.allSettled([
        searchService.searchUsers(q, userController.signal),
        searchService.searchMessagesGlobal(q, 0, SEARCH_PAGE_SIZE, messageController.signal),
      ]);

      if (latestSearchRequestRef.current !== requestId) return;

      // Xử lý kết quả search users
      const usersRes = results[0];
      if (usersRes.status === "fulfilled") {
        const { normalizeUserSearchPayload } = await import("@/hooks/useUserSearchDebounce");
        setSearchUsers(usersRes.value.code === 1000 ? normalizeUserSearchPayload(usersRes.value.data) : []);
      } else if (usersRes.reason?.name !== "AbortError") {
        console.error("User search failed:", usersRes.reason);
      }

      // Xử lý kết quả search messages
      const messagesRes = results[1];
      if (messagesRes.status === "fulfilled") {
        const nextMessages = messagesRes.value.code === 1000 ? messagesRes.value.data || [] : [];
        setSearchMessages(nextMessages);
        setHasMoreSearchMessages(nextMessages.length >= SEARCH_PAGE_SIZE);
      } else if (messagesRes.reason?.name !== "AbortError") {
        console.error("Message search failed:", messagesRes.reason);
        setSearchError(messagesRes.reason?.message || "Không thể tìm kiếm tin nhắn.");
      }
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      setSearchError(error?.message || "Lỗi hệ thống khi tìm kiếm.");
    } finally {
      if (latestSearchRequestRef.current === requestId) {
        setSearchLoading(false);
      }
    }
  };


  useEffect(() => {
    debouncedSearch(searchKeyword);
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch, searchKeyword]);

  useEffect(() => {
    return () => {
      userSearchAbortRef.current?.abort();
      messageSearchAbortRef.current?.abort();
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  /** Xóa ô tìm kiếm + kết quả (khi mở nhóm từ search để lúc quay lại thấy danh sách sạch) */
  const resetGroupSearchState = useCallback(() => {
    userSearchAbortRef.current?.abort();
    messageSearchAbortRef.current?.abort();
    debouncedSearch.cancel();
    setSearchKeyword("");
    setSearchUsers([]);
    setSearchMessages([]);
    setSearchPage(0);
    setHasMoreSearchMessages(false);
    setSearchError(null);
    setSearchLoading(false);
    setSearchLoadingMore(false);
  }, [debouncedSearch]);

  const handleLoadMoreSearchMessages = async () => {
    if (!isSearching || searchLoadingMore || !hasMoreSearchMessages) return;
    try {
      setSearchLoadingMore(true);
      messageSearchAbortRef.current?.abort();
      const controller = new AbortController();
      messageSearchAbortRef.current = controller;
      const nextPage = searchPage + 1;
      const res = await searchService.searchMessagesGlobal(
        trimmedKeyword,
        nextPage,
        SEARCH_PAGE_SIZE,
        controller.signal
      );
      const nextData = res.code === 1000 ? res.data || [] : [];
      setSearchMessages((prev) => [...prev, ...nextData]);
      setSearchPage(nextPage);
      setHasMoreSearchMessages(nextData.length >= SEARCH_PAGE_SIZE);
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        setSearchError(error?.message || "Không thể tải thêm kết quả.");
      }
    } finally {
      setSearchLoadingMore(false);
    }
  };

  // Handle navigate to chat
  const handleConversationPress = (
    conversation: ConversationResponse,
    options?: { fromSearch?: boolean }
  ) => {
    const fromSearch = options?.fromSearch === true;
    if (fromSearch) {
      resetGroupSearchState();
    }

    // GROUP: ưu tiên `/groups/[groupId]/chat` (cần group_id — đã chuẩn hóa groupId từ BE trong conversationService)
    const groupId =
      conversation.group_id ??
      (conversation as ConversationResponse & { groupId?: string }).groupId;
    if (conversation.type === "GROUP" && groupId) {
      router.push({
        pathname: `/groups/${groupId}/chat` as any,
        params: {
          conversationId: conversation.id,
          name: conversation.name || undefined,
          avatar: conversation.avatar || undefined,
          memberCount: conversation.members?.length
            ? String(conversation.members.length)
            : undefined,
        },
      } as any);
      return;
    }
    if (conversation.type === "GROUP") {
      // Thiếu group id: vẫn mở được bằng conversation id (màn app/chat/[id])
      router.push(`/chat/${conversation.id}` as any);
      return;
    }
    router.push(`/chat/${conversation.id}` as any);
  };

  /** Mở chat từ kết quả search tin nhắn — nhóm dùng cùng route/params như danh sách để header đúng */
  const handleSearchMessagePress = (message: MessageSearchResponse) => {
    resetGroupSearchState();
    const conv = conversationById.get(message.conversation_id);
    const searchGroupId =
      conv?.group_id ??
      (conv as ConversationResponse & { groupId?: string })?.groupId;
    if (conv?.type === "GROUP" && searchGroupId) {
      router.push({
        pathname: `/groups/${searchGroupId}/chat` as any,
        params: {
          conversationId: conv.id,
          name: conv.name || undefined,
          avatar: conv.avatar || undefined,
          memberCount: conv.members?.length ? String(conv.members.length) : undefined,
          messageId: message.id,
        },
      } as any);
      return;
    }
    if (conv?.type === "GROUP") {
      router.push({
        pathname: `/chat/${message.conversation_id}` as any,
        params: { messageId: message.id },
      } as any);
      return;
    }
    router.push({
      pathname: `/chat/${message.conversation_id}` as any,
      params: { messageId: message.id },
    } as any);
  };

  const handleUserSearchPress = async (user: UserSimpleResponse) => {
    addRecentUser(user);
    try {
      const conversation = await createConversation(user.id);
      router.push(`/chat/${conversation.id}` as any);
    } catch {
    }
  };

  // Handle pin/unpin
  const handlePinConversation = async (
    conversation: ConversationResponse,
    isPinned: boolean
  ) => {
    try {
      await updateConversation({
        conversationId: conversation.id,
        payload: { is_pinned: !isPinned },
      });
    } catch {
    }
  };

  // Handle long press - show options
  const handleLongPress = (conversation: ConversationResponse) => {
    Alert.alert(
      conversation.name || "Hội thoại",
      "Chọn hành động",
      [
        {
          text: conversation.is_pinned ? "Bỏ ghim" : "Ghim",
          onPress: () =>
            handlePinConversation(conversation, conversation.is_pinned || false),
        },
        {
          text: "Hủy",
          style: "cancel",
        },
      ]
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
        <SharedHeader
        withMenuDrawer={false}
        leftElement={
          <TouchableOpacity
            onPress={() => {
              try {
                router.replace("/(tabs)");
              } catch {
                // Ignore
              }
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back-outline" size={24} color={iconColor} />
          </TouchableOpacity>
        }
        centerElement={
          <Text style={{ fontSize: 20, fontWeight: "700", color: textColor }}>Tin nhắn</Text>
        }
        rightElement={null}
      />

      {/* Tabs */}
      <View className="flex-row border-b border-gray-200">
        <TouchableOpacity
          onPress={() => setActiveTab("personal")}
          className="flex-1 py-3 items-center"
          activeOpacity={0.7}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "personal" ? "text-primary" : "text-black"
            }`}
          >
            Cá nhân
          </Text>
          {activeTab === "personal" && (
            <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("group")}
          className="flex-1 py-3 items-center"
          activeOpacity={0.7}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "group" ? "text-primary" : "text-black"
            }`}
          >
            Nhóm
          </Text>
          {activeTab === "group" && (
            <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </TouchableOpacity>
      </View>

      {shouldShowSearchUI && (
        <View className="px-4 py-3 border-b border-gray-100 bg-white">
          <View className="flex-row items-center rounded-xl bg-gray-100 px-3">
            <Ionicons name="search-outline" size={18} color="#6b7280" />
            <TextInput
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              onFocus={() => setSearchInputFocused(true)}
              onBlur={() => setSearchInputFocused(false)}
              placeholder={
                activeTab === "group"
                  ? "Tìm nhóm, tin nhắn, người dùng..."
                  : "Tìm người dùng, tin nhắn..."
              }
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-[15px] py-2.5 ml-2"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {!!searchKeyword && (
              <TouchableOpacity onPress={() => setSearchKeyword("")} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#34B27D"
          />
        }
      >
        {/* Chỉ khi focus ô tìm kiếm; khi đang gõ (isSearching) ẩn block này */}
        {shouldShowSearchUI && searchInputFocused && !isSearching && (
          <View className="py-3 border-b border-gray-100">
            {recentUsers.length > 0 ? (
              <>
                <Text className="text-sm font-semibold text-gray-500 mb-2 px-4">Tìm kiếm gần đây</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{
                    flexDirection: "row",
                    paddingHorizontal: 16,
                    paddingBottom: 4,
                  }}
                >
                  {recentUsers.map((item, idx) => (
                    <TouchableOpacity
                      key={item.userId}
                      onPress={() => {
                        const u: UserSimpleResponse = {
                          id: item.userId,
                          username: item.username,
                          fullName: item.fullName,
                          avatarUrl: item.avatarUrl,
                        };
                        void handleUserSearchPress(u);
                      }}
                      activeOpacity={0.7}
                      style={{
                        width: 72,
                        alignItems: "center",
                        marginRight: idx < recentUsers.length - 1 ? 14 : 0,
                      }}
                    >
                      <Image
                        source={{
                          uri: resolveUserAvatarUri(
                            item.avatarUrl,
                            item.fullName || item.username
                          ),
                        }}
                        style={{ width: 56, height: 56, borderRadius: 28 }}
                        contentFit="cover"
                      />
                      <Text
                        className="text-[11px] text-gray-800 mt-1.5 text-center w-full"
                        numberOfLines={1}
                      >
                        {item.fullName || item.username}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <View className="py-10 items-center px-4">
                <Ionicons name="search-outline" size={40} color="#D1D5DB" />
                <Text className="text-gray-400 text-sm mt-3 text-center">
                  {activeTab === "group"
                    ? "Gõ để tìm nhóm, tin nhắn hoặc người dùng"
                    : "Gõ để tìm người dùng hoặc tin nhắn"}
                </Text>
              </View>
            )}
          </View>
        )}

        {shouldShowSearchUI && isSearching ? (
          <View className="px-4 py-4">
            {searchLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator color="#34B27D" />
                <Text className="text-gray-500 mt-2">Đang tìm kiếm...</Text>
              </View>
            ) : searchError ? (
              <View className="items-center py-8 px-6">
                <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
                <Text className="text-red-500 mt-2 text-center font-medium">{searchError}</Text>
                <TouchableOpacity 
                  onPress={() => void runSearch(searchKeyword)}
                  className="mt-4 px-4 py-2 bg-gray-100 rounded-lg"
                >
                  <Text className="text-gray-600">Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {matchedLocalConversations.length > 0 && (
                  <View className="mb-5">
                    <Text className="text-sm font-semibold text-gray-500 mb-2">
                      {matchedConversationsSectionTitle}
                    </Text>
                    {matchedLocalConversations.map((conversation) => {
                      const label =
                        activeTab === "group"
                          ? conversation.name || "Nhóm chat"
                          : (() => {
                              const other = conversation.members?.find(
                                (m) => m.id !== currentUser?.id
                              );
                              return other?.fullName || other?.username || "Người dùng";
                            })();
                      return (
                        <TouchableOpacity
                          key={`conv-${conversation.id}`}
                          onPress={() =>
                            handleConversationPress(conversation, { fromSearch: true })
                          }
                          activeOpacity={0.7}
                          className="py-2"
                        >
                          {renderHighlightedText(label, trimmedKeyword, "text-base text-black")}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {searchUsers.length > 0 && (
                  <View className="mb-5">
                    <Text className="text-sm font-semibold text-gray-500 mb-2">Người dùng</Text>
                    {searchUsers.map((user) => (
                      <TouchableOpacity
                        key={`user-${user.id}`}
                        onPress={() => void handleUserSearchPress(user)}
                        activeOpacity={0.7}
                        className="flex-row items-center py-2"
                      >
                        <Image
                          source={{
                            uri: resolveUserAvatarUri(
                              user.avatarUrl,
                              user.fullName || user.username
                            ),
                          }}
                          style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12 }}
                          contentFit="cover"
                        />
                        <View className="flex-1">
                          {renderHighlightedText(user.fullName || user.username, trimmedKeyword, "text-base text-black")}
                          <Text className="text-xs text-gray-500">@{user.username}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {searchMessages.length > 0 && (
                  <View>
                    <Text className="text-sm font-semibold text-gray-500 mb-2">Tin nhắn</Text>
                    {searchMessages.map((message) => (
                      <SearchMessageResultRow
                        key={`msg-${message.id}`}
                        message={message}
                        conversation={conversationById.get(message.conversation_id)}
                        trimmedKeyword={trimmedKeyword}
                        onPress={() => handleSearchMessagePress(message)}
                        currentUserId={currentUser?.id}
                      />
                    ))}
                    {hasMoreSearchMessages && (
                      <TouchableOpacity
                        onPress={handleLoadMoreSearchMessages}
                        activeOpacity={0.7}
                        className="mt-3 py-2 items-center rounded-lg bg-gray-100"
                        disabled={searchLoadingMore}
                      >
                        {searchLoadingMore ? (
                          <ActivityIndicator size="small" color="#34B27D" />
                        ) : (
                          <Text className="text-sm text-gray-700 font-medium">Tải thêm tin nhắn</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {matchedLocalConversations.length === 0 &&
                  searchUsers.length === 0 &&
                  searchMessages.length === 0 && (
                    <View className="items-center py-10">
                      <Ionicons name="search-outline" size={40} color="#9CA3AF" />
                      <Text className="text-gray-500 mt-3">Không tìm thấy kết quả phù hợp</Text>
                    </View>
                  )}
              </>
            )}
          </View>
        ) : shouldShowSearchUI && searchInputFocused ? null : isLoading && conversations.length === 0 ? (
          <ConversationListSkeleton count={8} showPin={true} />
        ) : conversations.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text className="text-gray-500 mt-4 text-center">
              {activeTab === "personal"
                ? "Chưa có tin nhắn cá nhân nào"
                : "Chưa có tin nhắn nhóm nào"}
            </Text>
          </View>
        ) : (
          <View>
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUser?.id}
                onPress={() => handleConversationPress(conversation)}
                onLongPress={() => handleLongPress(conversation)}
              />
            ))}
          </View>
        )}
      </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
