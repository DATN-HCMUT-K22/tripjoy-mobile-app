import { ChatBubble } from "@/components/chat/ChatBubble";
import { DateSeparator } from "@/components/chat/DateSeparator";
import { MessageLikesModal } from "@/components/chat/MessageLikesModal";
import { useMessages } from "@/hooks/useMessages";
import { conversationService } from "@/services/conversations";
import { uploadImage, uploadVideo } from "@/services/media";
import { socketService } from "@/services/socket/socketService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCurrentOpenConversationId } from "@/store/slices/messageNotificationSlice";
import { useChatStore } from "@/stores/chat.store";
import { ChatMessageResponse, getChatSenderId } from "@/types/message";
import { getDirectPeerAvatarUrl } from "@/utils/conversationDisplay";
import { showErrorToast } from "@/utils/toast";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Video, ResizeMode } from "expo-av";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const params = useLocalSearchParams<{ id?: string; scrollToEnd?: string; messageId?: string }>();
  const [input, setInput] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<PickedMedia | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [likesModalMessageId, setLikesModalMessageId] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const conversationId = params.id;

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
      return () => {
        setCurrentChatId(null);
      };
    }
  }, [conversationId, setCurrentChatId, resetUnread]);

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
  });

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
          flatListRef.current?.scrollToEnd({ animated: true });
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
        flatListRef.current?.scrollToEnd({ animated: true });
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
      const showSender =
        !prev || getChatSenderId(prev) !== getChatSenderId(msg);
      if (showSep) {
        list.push({ type: "date", key: `date-${msg.id}-${msg.created_at}`, date: msg.created_at });
      }
      list.push({ type: "message", key: msg.id, message: msg, showSenderName: showSender });
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
      flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
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
          });

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
        const result = await sendMessage(content);
        if (!result) {
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
  const handleLike = async (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    const isLiked = msg.is_liked_by_current_user === true;
    if (isLiked) await unlikeMessage(messageId);
    else await likeMessage(messageId);
  };

  const handleShowLikes = (messageId: string) => {
    setLikesModalMessageId(messageId);
    setLikesModalVisible(true);
  };

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: isDark ? "#000000" : "#FFFFFF" }]} 
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF", borderBottomColor: isDark ? "#2A2A2A" : "#E5E7EB" }]}>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
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
            <Text className="text-base font-bold text-black">
              {getDisplayName()}
            </Text>
            {conversation?.type === "DIRECT" && (
              <Text className="text-xs text-gray-500 mt-0.5">Đang hoạt động</Text>
            )}
            {conversation?.type === "GROUP" && (
              <Text className="text-xs text-gray-500 mt-0.5">
                {conversation.members && conversation.members.length > 0
                  ? `${conversation.members.length} thành viên`
                  : "0 thành viên"}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Messages */}
      <View style={styles.messagesWrapper}>
        <FlatList
          ref={flatListRef}
          data={listData}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
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
              />
            );
          }}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
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
              {typingUsers.length > 0 && (
                <View style={styles.typingWrapper}>
                  <View style={styles.typingRow}>
                    <View style={styles.typingAvatar}>
                      <ActivityIndicator size="small" color="#9CA3AF" />
                    </View>
                    <Text className="text-gray-500 text-sm font-medium">
                      {typingUsers.length === 1
                        ? "Đang gõ..."
                        : `${typingUsers.length} người đang gõ...`}
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
        
        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <TouchableOpacity
            style={styles.scrollToBottomButton}
            onPress={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
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

      {/* Input */}
      <SafeAreaView 
        edges={["bottom"]} 
        style={[styles.inputContainer, { backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF", borderTopColor: isDark ? "#2A2A2A" : "#E5E7EB" }]}
      >
        <View style={styles.inputWrapper}>
        <TouchableOpacity 
          activeOpacity={0.7} 
          className="mr-3"
          onPress={handlePickMedia}
          disabled={uploadingMedia}
        >
          <Ionicons 
            name="images-outline" 
            size={24} 
            color={uploadingMedia ? "#9CA3AF" : "#6B7280"} 
          />
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
      </SafeAreaView>

      {/* Likes Modal */}
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
});
