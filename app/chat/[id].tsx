import { ChatBubble } from "@/components/chat/ChatBubble";
import { DateSeparator } from "@/components/chat/DateSeparator";
import { MessageLikesModal } from "@/components/chat/MessageLikesModal";
import { useMessages } from "@/hooks/useMessages";
import { conversationService } from "@/services/conversations";
import { uploadImage } from "@/services/media";
import { socketService } from "@/services/socket/socketService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCurrentOpenConversationId } from "@/store/slices/messageNotificationSlice";
import { useChatStore } from "@/stores/chat.store";
import { ChatMessageResponse } from "@/types/message";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
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

export default function ChatScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id?: string; scrollToEnd?: string }>();
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
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
      if (response.code === 0 && response.data) {
        console.log("✅ [CHAT] Conversation loaded successfully");
        return response.data;
      }
      console.error("❌ [CHAT] Failed to load conversation");
      console.error(`Response code: ${response.code}, Expected: 0`);
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
    if (conversation?.avatar) return conversation.avatar;
    if (conversation?.type === "DIRECT" && conversation.members && conversation.members.length > 0) {
      const otherMember = conversation.members.find(
        (m) => m.id !== currentUser?.id
      );
      return otherMember?.avatarUrl || null;
    }
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
  const listData = React.useMemo(() => {
    const list: Array<
      | { type: "date"; key: string; date: string }
      | { type: "message"; key: string; message: ChatMessageResponse; showSenderName: boolean }
    > = [];
    let prev: ChatMessageResponse | null = null;
    messages.forEach((msg) => {
      const showSep = shouldShowDateSeparator(msg, prev);
      const showSender = !prev || prev.sender_id !== msg.sender_id;
      if (showSep) {
        list.push({ type: "date", key: `date-${msg.id}-${msg.created_at}`, date: msg.created_at });
      }
      list.push({ type: "message", key: msg.id, message: msg, showSenderName: showSender });
      prev = msg;
    });
    return list;
  }, [messages]);

  // Handle pick image
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Cần quyền truy cập",
          "Ứng dụng cần quyền truy cập thư viện ảnh để gửi ảnh."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  // Handle send message
  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || !conversationId) return;

    const content = input.trim();
    setInput("");
    const imageToSend = selectedImage;
    setSelectedImage(null);

    if (socketService.isConnected()) {
      socketService.sendStopTyping(conversationId);
    }

    try {
      if (imageToSend) {
        // Upload ảnh trước khi gửi tin nhắn
        setUploadingImage(true);
        try {
          const uploadResult = await uploadImage({
            fileUri: imageToSend,
            fileName: "message-image.jpg",
            fileType: "image/jpeg",
            folder: `tripjoy/messages/${conversationId}`,
          });
          
          console.log("[ChatScreen] Image uploaded successfully:", uploadResult.secure_url);
          
          // Gửi tin nhắn với media URL đã upload
          const result = await sendMessage(content || "Đã gửi ảnh", {
            messageType: "IMAGE",
            mediaUrl: uploadResult.secure_url,
          });
          
          setUploadingImage(false);
          if (!result) {
            Alert.alert("Lỗi", "Không thể gửi ảnh. Vui lòng thử lại.");
            setSelectedImage(imageToSend);
          }
        } catch (uploadError: any) {
          console.error("[ChatScreen] Failed to upload image:", uploadError);
          setUploadingImage(false);
          Alert.alert(
            "Lỗi",
            uploadError?.message || "Không thể tải ảnh lên. Vui lòng thử lại."
          );
          setSelectedImage(imageToSend);
        }
      } else {
        const result = await sendMessage(content);
        if (!result) {
          Alert.alert("Lỗi", "Không thể gửi tin nhắn. Vui lòng thử lại.");
          setInput(content);
        }
      }
    } catch (error) {
      setUploadingImage(false);
      Alert.alert("Lỗi", "Đã xảy ra lỗi. Vui lòng thử lại.");
      if (imageToSend) {
        setSelectedImage(imageToSend);
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
          {getAvatar() ? (
            <Image
              source={{ uri: getAvatar()! }}
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
                {getDisplayName().charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
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
            ) : !error ? (
              <View className="py-8 items-center">
                <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
                <Text className="text-gray-500 mt-4 text-center">
                  Chưa có tin nhắn nào
                </Text>
                <Text className="text-gray-400 text-sm mt-2 text-center">
                  Hãy bắt đầu cuộc trò chuyện
                </Text>
              </View>
            ) : (
              <View className="py-4 items-center">
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                <Text className="text-red-500 text-sm mt-2">{error}</Text>
                <TouchableOpacity
                  onPress={() => refresh()}
                  className="mt-4 bg-primary px-4 py-2 rounded-full"
                >
                  <Text className="text-white text-sm font-semibold">Thử lại</Text>
                </TouchableOpacity>
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

      {/* Image Preview */}
      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{ uri: selectedImage }}
            style={styles.imagePreview}
            contentFit="cover"
          />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => setSelectedImage(null)}
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
          onPress={handlePickImage}
          disabled={uploadingImage}
        >
          <Ionicons 
            name="image-outline" 
            size={24} 
            color={uploadingImage ? "#9CA3AF" : "#6B7280"} 
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
          disabled={(!input.trim() && !selectedImage) || loading || uploadingImage}
        >
          {uploadingImage ? (
            <ActivityIndicator size="small" color="#34B27D" />
          ) : (
            <Ionicons
              name="send"
              size={24}
              color={(input.trim() || selectedImage) && !loading ? "#34B27D" : "#9CA3AF"}
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
