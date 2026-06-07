import { ChatBubble } from "@/components/chat/ChatBubble";
import { ConnectionBanner } from "@/components/chat/ConnectionBanner";
import { DateSeparator } from "@/components/chat/DateSeparator";
import { MentionSuggestions, MentionUser } from "@/components/chat/MentionSuggestions";
import { MessageActionSheet } from "@/components/chat/MessageActionSheet";
import { MessageLikesModal } from "@/components/chat/MessageLikesModal";
import { PINNED_BAR_HEIGHT, PinnedMessageBar } from "@/components/chat/PinnedMessageBar";
import { SwipeableMessage } from "@/components/chat/SwipeableMessage";
import { TypingIndicatorBubble } from "@/components/chat/TypingIndicatorBubble";
import { LocationImage } from "@/components/location/LocationImage";
import { ReportModal } from "@/components/social/ReportModal";
import { PLACEHOLDER_ITINERARY_IMAGE, useGroupConfirmedItinerary, useItineraryTripItems } from "@/hooks/useItineraries";
import { useMessages } from "@/hooks/useMessages";
import { usePinnedMessages } from "@/hooks/usePinnedMessages";
import { useSocketTyping } from "@/hooks/useSocketTyping";
import { useAppDialog } from "@/hooks/useAppDialog";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { isGroupManager } from "@/utils/roleUtils";
import { conversationService } from "@/services/conversations";
import { uploadImage, uploadVideo } from "@/services/media";
import { socketService } from "@/services/socket/socketService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetUnread as resetUnreadRedux, selectTypingUsersForConversation, setActiveConversation } from "@/store/slices/conversationSlice";
import { setCurrentOpenConversationId } from "@/store/slices/messageNotificationSlice";
import { useChatStore } from "@/stores/chat.store";
import {
  ChatMessageResponse,
  ConversationResponse,
  getChatSenderId,
} from "@/types/message";
import { ContentType } from "@/types/report";
import { showErrorToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useIsFocused } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ResizeMode, Video } from "expo-av";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import type { FlashListRef } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
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

type ListItem =
  | { type: "date"; key: string; date: string }
  | { type: "message"; key: string; message: ChatMessageResponse; showSenderName: boolean; showAvatar: boolean };

const ItineraryBannerImage = ({ itineraryId, defaultImage, style }: { itineraryId: string, defaultImage?: string, style: any }) => {
  const { data: items, isLoading } = useItineraryTripItems(itineraryId);
  const firstLocation = items?.[0]?.location;

  if (isLoading) {
    return <Image source={{ uri: defaultImage || PLACEHOLDER_ITINERARY_IMAGE }} style={style} contentFit="cover" />;
  }

  if (!firstLocation || (defaultImage && defaultImage !== PLACEHOLDER_ITINERARY_IMAGE)) {
    return <Image source={{ uri: defaultImage || PLACEHOLDER_ITINERARY_IMAGE }} style={style} contentFit="cover" />;
  }

  return (
    <LocationImage
      location={firstLocation}
      style={style}
      containerStyle={style}
      placeholderIcon="map"
    />
  );
};

export default function GroupChatScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
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
  const [selectedMedia, setSelectedMedia] = useState<PickedMedia | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const flashListRef = useRef<FlashListRef<ListItem>>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { showWarning, dialog } = useAppDialog();

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
  const [likesModalMessageId, setLikesModalMessageId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // ActionSheet, pin, highlight
  const [selectedMessage, setSelectedMessage] = useState<ChatMessageResponse | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const [currentPinnedIndex, setCurrentPinnedIndex] = useState(0);
  const [isPinning, setIsPinning] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessageResponse | null>(null);

  // Mention state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportedMessage, setReportedMessage] = useState<ChatMessageResponse | null>(null);

  // Focus tracking
  const isFocused = useIsFocused();

  // Đảm bảo header bị tắt
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Lấy conversationId từ params
  const paramConversationId = (() => {
    const raw = (params as any).conversationId;
    if (typeof raw === "string" && raw.length > 0) return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    return undefined;
  })();
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

  // 1. Resolve conversationId if missing (e.g. navigation from Group Info/Detail without conversationId)
  const { data: resolvedConversationId, isLoading: isResolving } = useQuery({
    queryKey: ["resolve-group-conversation", groupId],
    queryFn: async () => {
      if (paramConversationId) return paramConversationId;
      if (!groupId) return null;

      console.log(`🔍 [GROUP CHAT] Resolving conversationId for groupId: ${groupId}`);
      const res = await conversationService.getConversations();
      if (isApiSuccess(res.code)) {
        const found = res.data?.find(c => String(c.group_id) === String(groupId));
        console.log(`✅ [GROUP CHAT] Resolved conversationId: ${found?.id || "NOT FOUND"}`);
        return found?.id || null;
      }
      return null;
    },
    enabled: !paramConversationId && !!groupId,
    staleTime: 5 * 60 * 1000,
  });

  // ConversationId - ưu tiên param, sau đó đến resolved
  const conversationId = paramConversationId || resolvedConversationId || null;

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
  
  useFocusEffect(
    useCallback(() => {
      if (!conversationId) return;
      
      setCurrentChatId(conversationId);
      resetUnread(conversationId);
      dispatch(setActiveConversation(conversationId));

      let cancelled = false;
      const retryDelays = [300, 800, 1500];
      const markReadWithRetry = async () => {
        for (let i = 0; i < retryDelays.length; i++) {
          try {
            await conversationService.markConversationRead(conversationId);
            if (!cancelled) {
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
        console.log(`[GROUP CHAT] Unfocusing/Unmounting, running cleanup for conversationId: ${conversationId}`);
        cancelled = true;
        setCurrentChatId(null);
        dispatch(setActiveConversation(null));
        
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
              console.log(`[GROUP CHAT] markConversationRead API success for ${conversationId} on exit`);
              queryClient.invalidateQueries({ queryKey: ["conversations"] });
            })
            .catch((err) => {
              console.error(`[GROUP CHAT] markConversationRead API failed on exit:`, err);
            });
        }
      };
    }, [conversationId, setCurrentChatId, resetUnread, dispatch, queryClient])
  );

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
      if (isApiSuccess(response.code) && response.data) {
        console.log("✅ [GROUP CHAT] Conversation loaded from API");
        console.log(`API conversation members:`, response.data.members);
        console.log(`API conversation members length:`, response.data.members?.length);
        return response.data;
      }
      console.error("❌ [GROUP CHAT] Failed to load conversation");
      return null;
    },
    enabled: !!conversationId, // Chỉ query nếu có conversationId
    staleTime: 60000,
    refetchOnWindowFocus: false,
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
    deleteMessage,
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
      const { groupService, isGroupApiSuccess } = await import("@/services/groups");
      const response = await groupService.getGroupById(groupId);
      if (isGroupApiSuccess(response.code) && response.data) {
        return response.data;
      }
      return null;
    },
    enabled: !!groupId, // Load trực tiếp từ groupId
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  // Tính số thành viên — ưu tiên API group
  const memberCount = useMemo(() => {
    if (groupInfo?.members && Array.isArray(groupInfo.members) && groupInfo.members.length > 0) {
      return groupInfo.members.length;
    }
    return 0;
  }, [groupInfo]);

  // Tên nhóm — BE thường sai/khác ở field conversation.name trong inbox; GET /groups/{id} đáng tin hơn
  const groupName = useMemo(() => {
    if (groupInfo?.name) return groupInfo.name;
    return "Đang tải...";
  }, [groupInfo?.name]);

  const groupAvatar = useMemo(() => {
    if (groupInfo?.avatar) return groupInfo.avatar;
    return null;
  }, [groupInfo?.avatar]);

  const { resetTripData, setTargetGroup } = useTripSetup();
  const isManager = useMemo(() => isGroupManager(groupInfo || undefined, currentUser?.id), [groupInfo, currentUser?.id]);

  // Mention Suggestions logic
  const mentionSuggestions = useMemo(() => {
    const bot: MentionUser = {
      id: "bot-tripjoy",
      username: "Tripjoy",
      fullName: "Tripjoy AI Assistant",
      isBot: true,
    };

    const members = (groupInfo?.members || []).map((m) => ({
      id: m.user.id,
      username: m.user.username,
      fullName: m.user.fullName,
      avatarUrl: m.user.avatarUrl,
      isBot: false,
    }));

    const all = [bot, ...members];

    if (!mentionSearchQuery) return [bot];

    return all.filter(
      (u) =>
        u.username.toLowerCase().includes(mentionSearchQuery.toLowerCase()) ||
        u.fullName.toLowerCase().includes(mentionSearchQuery.toLowerCase())
    );
  }, [groupInfo?.members, mentionSearchQuery]);

  const handleSelectMention = (user: MentionUser) => {
    const textBefore = input.substring(0, input.lastIndexOf("@", cursorPosition - 1));
    const textAfter = input.substring(cursorPosition);
    const newText = `${textBefore}@${user.username} ${textAfter}`;
    setInput(newText);
    setShowMentionSuggestions(false);
  };

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

  const handlePickMedia = async () => {
    if (!conversationId) {
      showErrorToast("Chưa có hội thoại", "Không tìm thấy cuộc trò chuyện để gửi file.");
      return;
    }
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

  // Handle send message (text + optional ảnh/video qua POST messages + media_url)
  const handleSend = async () => {
    if ((!input.trim() && !selectedMedia) || !conversationId) {
      if (!conversationId) {
        showErrorToast("Chưa có hội thoại", "Không tìm thấy cuộc trò chuyện.");
      }
      return;
    }

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
          });

          if (result) {
            setReplyingToMessage(null);
          }

          if (!result) {
            setSelectedMedia(mediaToSend);
            setInput(content);
            showErrorToast("Không gửi được tin nhắn", "Vui lòng thử lại.");
          }
        } catch (err) {
          showErrorToast(
            mediaToSend.kind === "video" ? "Tải video lên thất bại" : "Tải ảnh lên thất bại",
            err
          );
          setSelectedMedia(mediaToSend);
          setInput(content);
        } finally {
          setUploadingMedia(false);
        }
      } else {
        const result = await sendMessage(content, {
          parentMessageId: replyingToMessage?.id,
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
        setInput(content);
      } else {
        setInput(content);
      }
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

  // Lấy lịch trình CONFIRMED từ API
  const { data: confirmedItinerary } = useGroupConfirmedItinerary(groupId);

  // FlatList data: date separators + messages; map messageId -> index
  const { listData, messageIdToIndex } = useMemo(() => {
    const list: ListItem[] = [];
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
        showAvatar: showSender
      });
      map.set(msg.id, list.length - 1);
      prev = msg;
    });
    return { listData: list, messageIdToIndex: map };
  }, [messages]);

  // 🔥 Typing indicators
  const { emitTyping, emitStopTyping } = useSocketTyping(conversationId);
  const typingUsersRedux = useAppSelector(state =>
    conversationId ? selectTypingUsersForConversation(state, conversationId) : []
  );

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
        // Tăng delay một chút để đảm bảo FlashList đã render xong các item phức tạp (như bot message)
        const delay = scrollToEndParam === "1" ? 400 : 250;
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
          flashListRef.current?.scrollToEnd({ animated: true });
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
      flashListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
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
        flashListRef.current?.scrollToEnd({ animated: true });
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
      } finally {
        setIsPinning(false);
      }
    },
    [isPinning, pinMessage]
  );

  const handleUnpin = useCallback(
    async (messageId: string) => {
      if (isPinning) return;
      setIsPinning(true);
      try {
        await unpinMessage(messageId);
      } finally {
        setIsPinning(false);
      }
    },
    [isPinning, unpinMessage]
  );

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
    const msg = pinnedMessages[currentPinnedIndex];
    const idx = messageIdToIndex.get(msg.id);
    if (idx !== undefined) {
      flashListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
      setHighlightMessageId(msg.id);
      setTimeout(() => setHighlightMessageId(null), 1500);
    }
    const next = (currentPinnedIndex + 1) % pinnedMessages.length;
    setCurrentPinnedIndex(next);
  }, [pinnedMessages, currentPinnedIndex, messageIdToIndex]);

  const onScrollToIndexFailed = useCallback((info: { index: number }) => {
    setTimeout(() => {
      flashListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
    }, 150);
  }, []);

  const renderListItem = useCallback(
    ({ item }: { item: ListItem }) => {
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
            onImagePress={(url) => setPreviewImageUrl(url)}
            isHighlighted={highlightMessageId === item.message.id}
            showAvatar={item.showAvatar}
          />
        </SwipeableMessage>
      );
    },
    [currentUser?.id, highlightMessageId, handleLike, handleLongPress]
  );

  const handleBack = useCallback(() => {
    if (conversationId) {
      const latestMessage = messages[messages.length - 1];
      const fallbackUpdatedAt = new Date().toISOString();

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
            <Text style={{ fontSize: 16, fontWeight: "bold", color: isDark ? "#FFFFFF" : "#000000" }}>
              {groupName}
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? "#9CA3AF" : "#6B7280", marginTop: 2 }}>
              {memberCount} thành viên
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2"
            onPress={() => {
              resetTripData();
              setTargetGroup(groupId || "", groupName);
              router.push("/create" as any);
            }}
          >
            <Ionicons name="add-circle" size={28} color="#0D9488" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Information Banner - Lịch trình chính thức / Đang diễn ra */}
      {confirmedItinerary && (
        <TouchableOpacity
          activeOpacity={0.8}
          className="overflow-hidden"
          style={{
            backgroundColor: (confirmedItinerary.raw?.status || "").toUpperCase() === "IN_PROGRESS" 
              ? "rgba(59, 130, 246, 0.7)" // Blue for IN_PROGRESS
              : "rgba(16, 185, 129, 0.7)", // Green for CONFIRMED
            width: "100%",
          }}
          onPress={() => {
            if (confirmedItinerary?.id) {
              router.push(`/itinerary/detail?id=${confirmedItinerary.id}` as any);
            }
          }}
        >
          <View className="flex-row items-center p-3">
            {/* Itinerary Image - Dynamic from first location */}
            <ItineraryBannerImage
              itineraryId={confirmedItinerary.id}
              defaultImage={confirmedItinerary.image}
              style={{ width: 80, height: 80, borderRadius: 12 }}
            />
            {/* Text Content */}
            <View className="flex-1 ml-3">
              <View className="flex-row items-center mb-1">
                <Ionicons 
                  name={(confirmedItinerary.raw?.status || "").toUpperCase() === "IN_PROGRESS" ? "play-circle" : "checkmark-circle"} 
                  size={16} 
                  color="#FFFFFF" 
                />
                <Text className="text-sm text-white ml-1 font-medium">
                  {(confirmedItinerary.raw?.status || "").toUpperCase() === "IN_PROGRESS" ? "Đang diễn ra" : "Lịch trình chính thức"}
                </Text>
              </View>
              <Text className="text-base font-bold text-white mb-1">
                {confirmedItinerary.name}
              </Text>
              <Text className="text-sm text-white">
                {confirmedItinerary.startDate} - {confirmedItinerary.endDate}
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 90}
      >
        {/* Messages: FlashList + PinnedMessageBar (absolute, không chiếm flow) */}
        <View style={styles.messagesWrapper}>
          <FlashList
            ref={flashListRef as any}
            data={listData}
            keyExtractor={(i) => i.key}
            renderItem={renderListItem}
            contentContainerStyle={{
              paddingBottom: 16,
              ...(pinnedMessages.length > 0 ? { paddingTop: PINNED_BAR_HEIGHT } : {}),
            }}
            showsVerticalScrollIndicator={false}
            onScroll={(e) => {
              const { contentOffset } = e.nativeEvent;
              if (contentOffset.y <= 100 && hasMore && !loading) loadMore();
            }}
            scrollEventThrottle={400}
            ListEmptyComponent={
              (loading || isResolving) && messages.length === 0 ? (
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
                <View className="py-8 items-center">
                  <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
                  <Text className="text-gray-500 mt-4 text-center">Chưa có tin nhắn nào</Text>
                  <Text className="text-gray-400 text-sm mt-2 text-center">Hãy bắt đầu cuộc trò chuyện</Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              <>
                {(typingUsers.length > 0 || typingUsersRedux.length > 0) && (
                  <TypingIndicatorBubble
                    usernames={
                      typingUsersRedux.length > 0
                        ? typingUsersRedux.map(u => u.username)
                        : typingUsers.map(u => String(u.username ?? ''))
                    }
                  />
                )}
                {loading && messages.length > 0 && (
                  <View className="py-4 items-center">
                    <ActivityIndicator size="small" color="#34B27D" />
                  </View>
                )}
              </>
            }
          />
          <PinnedMessageBar
            pinnedMessages={pinnedMessages}
            currentIndex={currentPinnedIndex}
            onTap={handlePinnedBarTap}
            isDark={isDark}
          />
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
              disabled={uploadingMedia || !conversationId}
            >
              <Ionicons
                name="images-outline"
                size={26}
                color={uploadingMedia || !conversationId ? "#9CA3AF" : (isDark ? "#9CA3AF" : "#6B7280")}
              />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              {showMentionSuggestions && (
                <View style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 100 }}>
                  <MentionSuggestions
                    suggestions={mentionSuggestions}
                    onSelect={handleSelectMention}
                    isDark={isDark}
                  />
                </View>
              )}
              <TextInput
                value={input}
                onChangeText={(text) => {
                  setInput(text);
                  if (text.length > 0) {
                    emitTyping();
                  } else {
                    emitStopTyping();
                  }

                  // Detect @ for mentions
                  const lastAtPos = text.lastIndexOf("@", cursorPosition);
                  if (lastAtPos !== -1) {
                    const query = text.substring(lastAtPos + 1, cursorPosition + 1);
                    if (!query.includes(" ")) {
                      setMentionSearchQuery(query);
                      setShowMentionSuggestions(true);
                      return;
                    }
                  }
                  setShowMentionSuggestions(false);
                }}
                onSelectionChange={(event) => {
                  setCursorPosition(event.nativeEvent.selection.start);
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
                editable={!loading && !uploadingMedia}
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
                  color={
                    (input.trim() || selectedMedia) && !loading ? "#34B27D" : "#9CA3AF"
                  }
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <MessageActionSheet
        visible={actionSheetVisible}
        message={selectedMessage}
        onDismiss={handleActionSheetDismiss}
        onPin={handlePin}
        onUnpin={handleUnpin}
        onReply={(msg) => {
          setReplyingToMessage(msg);
        }}
        onDelete={handleDelete}
        onReport={handleReport}
        currentUserId={currentUser?.id}
      />
      <MessageLikesModal
        visible={likesModalVisible}
        messageId={likesModalMessageId}
        onClose={() => {
          setLikesModalVisible(false);
          setLikesModalMessageId(null);
        }}
      />

      {/* Image Preview Modal */}
      <Modal visible={!!previewImageUrl} transparent={true} onRequestClose={() => setPreviewImageUrl(null)} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 }}
            onPress={() => setPreviewImageUrl(null)}
          >
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>
          {previewImageUrl && (
            <ImageZoom uri={previewImageUrl} style={{ flex: 1 }} />
          )}
        </View>
      </Modal>

      {/* Report Modal */}
      {reportedMessage && (
        <ReportModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
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
