import {
  ChatMessageResponse,
  getChatSenderId,
  getSenderAvatarParts,
  getSenderLabel,
} from "@/types/message";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

// Layout constants (tránh magic numbers)
const AVATAR_SIZE = 40;
const AVATAR_RADIUS = AVATAR_SIZE / 2;
const BUBBLE_BORDER_RADIUS = 18;
const MAX_BUBBLE_WIDTH_PERCENT = "75%";
const MIN_BUBBLE_WIDTH = 60;

interface ChatMessageProps {
  message: ChatMessageResponse;
  currentUserId?: string;
  showSenderName?: boolean;
  showTimestamp?: boolean;
  onLike?: (messageId: string) => void;
  onShowLikes?: (messageId: string) => void;
  onReply?: (message: ChatMessageResponse) => void;
  onLongPress?: () => void;
  isHighlighted?: boolean;
}

// Format time helper
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};


export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  currentUserId,
  showSenderName = true,
  showTimestamp = true,
  onLike,
  onShowLikes,
  onReply,
  onLongPress,
  isHighlighted = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  const isMe = getChatSenderId(message) === currentUserId;
  const isBot = message.is_bot === true;
  
  // Color scheme - supports dark mode
  const bubbleColor = isBot 
    ? (isDark ? "#4A148C" : "#F0E6F7") 
    : isMe 
    ? (isDark ? "#0D7377" : "#34B27D") 
    : (isDark ? "#2A2A2A" : "#F5F5F5");
    
  const textColor = isMe || isBot 
    ? (isDark ? "#FFFFFF" : "#FFFFFF") 
    : (isDark ? "#E5E5E5" : "#111827");
    
  const borderColor = isBot || !isMe 
    ? (isDark ? "#404040" : "#E5E7EB") 
    : "transparent";
    
  const timestampColor = isDark ? "#9CA3AF" : "#9CA3AF";
  const senderNameColor = isDark ? "#D1D5DB" : "#111827";
  const replyMetaColor = isBot
    ? "#7B1FA2"
    : isDark
    ? "#9CA3AF"
    : "#6B7280";
  const replyPreviewColor = isDark ? "#D1D5DB" : "#4B5563";
  const replyBarBackground = isMe
    ? isDark
      ? "rgba(15, 118, 110, 0.25)"
      : "rgba(16, 185, 129, 0.15)"
    : isDark
    ? "#1F2933"
    : "#F3F4F6";

  const s = message.sender;
  const senderDisplayName = isMe ? "Bạn" : getSenderLabel(s);
  const avatarParts = getSenderAvatarParts(s);
  const resolvedAvatarUri = resolveUserAvatarUri(avatarParts.uri, avatarParts.nameHint);

  // Like: ưu tiên like_count và chỉ tin field is_liked_by_current_user cho user hiện tại
  const likeCount = message.like_count ?? message.likes_count ?? 0;
  const isLiked = message.is_liked_by_current_user === true;
  const hasLikes = likeCount > 0;
  const heartColor = (isLiked || hasLikes) ? "#ef4444" : textColor;
  const heartName = (isLiked || hasLikes) ? "heart" : "heart-outline";

  // Avatar JSX (dùng lại cho cả 2 phía để đảm bảo kích thước đồng nhất)
  const avatar = (
    <View style={styles.avatarContainer}>
      {isBot ? (
        <Image
          source={require("@/assets/logo/ai_bot.webp")}
          style={styles.avatarBot}
          contentFit="cover"
        />
      ) : (
        <Image
          source={{ uri: resolvedAvatarUri }}
          style={styles.avatar}
          contentFit="cover"
        />
      )}
    </View>
  );

  // Message status indicator (chỉ hiển thị cho message của mình)
  const getStatusIcon = () => {
    if (!isMe) return null;
    const status = message.status;
    if (status === "SENDING") {
      return <ActivityIndicator size={12} color={timestampColor} />;
    }
    if (status === "SENT") {
      return <Ionicons name="checkmark" size={12} color={timestampColor} />;
    }
    if (status === "DELIVERED") {
      return <Ionicons name="checkmark-done" size={12} color={timestampColor} />;
    }
    if (status === "READ") {
      return <Ionicons name="checkmark-done" size={12} color="#34B27D" />;
    }
    if (status === "FAILED") {
      return <Ionicons name="alert-circle" size={12} color="#ef4444" />;
    }
    return null;
  };

  // Header (tên + giờ) - giống nhau cho cả mình và thành viên khác,
  // chỉ khác align trái/phải, tên luôn nằm giữa avatar và time
  const header = (showSenderName || showTimestamp) && (
    <View
      style={[
        styles.header,
        isMe ? styles.headerRight : styles.headerLeft,
      ]}
    >
      {showSenderName && (
        <Text style={[styles.senderName, { color: senderNameColor }]}>
          {senderDisplayName}
        </Text>
      )}
      <View style={styles.timestampContainer}>
        {showTimestamp && (
          <Text style={[styles.timestamp, { color: timestampColor }]}>
            {formatTime(message.created_at)}
          </Text>
        )}
        {isMe && getStatusIcon() && (
          <View style={styles.statusIcon}>
            {getStatusIcon()}
          </View>
        )}
      </View>
    </View>
  );

  // Reply preview (bar bên trong bubble)
  const replyPreview =
    message.parent_message && (
      <View style={[styles.replyPreviewContainer, { backgroundColor: replyBarBackground }]}>
        <View style={styles.replyHeaderRow}>
          <Ionicons
            name="arrow-back"
            size={12}
            color={replyMetaColor}
          />
          <Text
            style={[styles.replySenderText, { color: replyMetaColor }]}
            numberOfLines={1}
          >
            {message.parent_message.sender?.fullName ||
              message.parent_message.sender?.username ||
              "Thành viên"}
          </Text>
        </View>
        {message.parent_message.message_content ? (
          <Text
            style={[styles.replyPreviewText, { color: replyPreviewColor }]}
            numberOfLines={1}
          >
            {message.parent_message.message_content}
          </Text>
        ) : null}
      </View>
    );

  // Nội dung bubble (text, ảnh hoặc video)
  const bubbleContent =
    message.message_type === "IMAGE" && message.media_url ? (
      <View style={styles.imageBubbleWrapper}>
        <View
          style={[
            styles.imageBubble,
            {
              backgroundColor: bubbleColor,
              borderWidth: isBot || !isMe ? 1 : 0,
              borderColor: borderColor,
            },
          ]}
        >
          <Image
            source={{ uri: message.media_url }}
            style={styles.image}
            contentFit="cover"
          />
          {message.message_content ? (
            <View style={styles.imageCaption}>
              <Text
                style={[styles.imageCaptionText, { color: textColor }]}
              >
                {message.message_content}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    ) : message.message_type === "VIDEO" && message.media_url ? (
      <View style={styles.imageBubbleWrapper}>
        <View
          style={[
            styles.imageBubble,
            {
              backgroundColor: bubbleColor,
              borderWidth: isBot || !isMe ? 1 : 0,
              borderColor: borderColor,
            },
          ]}
        >
          <Video
            source={{ uri: message.media_url }}
            style={styles.image}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
          />
          {message.message_content ? (
            <View style={styles.imageCaption}>
              <Text
                style={[styles.imageCaptionText, { color: textColor }]}
              >
                {message.message_content}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    ) : (
      <View style={styles.bubbleWrapper}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: bubbleColor,
              borderWidth: isBot || !isMe ? 1 : 0,
              borderColor: borderColor,
            },
          ]}
        >
          {replyPreview}

          {/* Pinned indicator */}
          {message.is_pinned && (
            <View style={[styles.pinIndicator, { backgroundColor: isMe ? "rgba(255,255,255,0.2)" : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)") }]}>
              <Ionicons name="pin" size={12} color={isMe ? "#FFFFFF" : (isDark ? "#9CA3AF" : "#6B7280")} />
              <Text style={[styles.pinIndicatorText, { color: isMe ? "#FFFFFF" : (isDark ? "#9CA3AF" : "#6B7280") }]}>
                Đã ghim
              </Text>
            </View>
          )}

          <Text
            style={[styles.messageText, { color: textColor }]}
            selectable
          >
            {message.message_content}
          </Text>

          {/* Like: like_count > 0 thì hiện số + icon heart màu đỏ */}
          <View style={styles.likeContainer}>
            <TouchableOpacity
              onPress={() => onLike && onLike(message.id)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={heartName} size={16} color={heartColor} />
            </TouchableOpacity>
            {hasLikes ? (
              <Pressable
                onPress={() => onShowLikes && onShowLikes(message.id)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.likeCount, { color: heartColor }]}>
                  {likeCount}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );

  const content = (
    <View
      style={[
        styles.messageWrapper,
        isMe ? styles.messageWrapperRight : styles.messageWrapperLeft,
      ]}
    >
      {header}
      {bubbleContent}
    </View>
  );

  // Layout đối xứng: avatar ngoài cùng, bubble ở trong
  // Người khác: avatar trái, bubble phải
  // Mình: bubble trái, avatar phải
  const containerStyle = [
    styles.container,
    isMe ? styles.containerRight : styles.containerLeft,
    isHighlighted && styles.containerHighlighted,
  ];

  const Inner = (
    <>
      {isMe ? (
        <>
          {content}
          {avatar}
        </>
      ) : (
        <>
          {avatar}
          {content}
        </>
      )}
    </>
  );

  if (onLongPress) {
    return (
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={400}
        style={containerStyle}
      >
        {Inner}
      </Pressable>
    );
  }
  return <View style={containerStyle}>{Inner}</View>;
};

// Giữ export cũ để không phá vỡ import hiện tại
export const ChatBubble = React.memo(ChatMessage);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  containerRight: {
    justifyContent: "flex-end",
  },
  containerLeft: {
    justifyContent: "flex-start",
  },
  containerHighlighted: {
    backgroundColor: "rgba(52, 179, 125, 0.2)",
    borderRadius: 12,
  },
  avatarContainer: {
    marginHorizontal: 8,
    // Căn avatar theo hàng tên/giờ (top-align với header)
    alignSelf: "flex-start",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_RADIUS,
  },
  avatarBot: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 8,
  },
  messageWrapper: {
    maxWidth: MAX_BUBBLE_WIDTH_PERCENT,
    minWidth: MIN_BUBBLE_WIDTH, // Minimum width cho message rất ngắn
  },
  messageWrapperRight: {
    alignItems: "flex-end",
  },
  messageWrapperLeft: {
    alignItems: "flex-start",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  headerRight: {
    justifyContent: "flex-end",
  },
  headerLeft: {
    justifyContent: "flex-start",
  },
  senderName: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.7,
  },
  statusIcon: {
    marginLeft: 2,
  },
  bubbleWrapper: {
    position: "relative",
  },
  bubble: {
    borderRadius: BUBBLE_BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21, // 1.4 line height
    fontWeight: "400",
  },
  replyPreviewContainer: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  replyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  replySenderText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
    flex: 1,
  },
  replyPreviewText: {
    fontSize: 12,
    lineHeight: 16,
  },
  replyDivider: {
    height: 1,
    marginBottom: 8,
    opacity: 0.5,
  },
  likeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  likeCount: {
    fontSize: 12,
  },
  // Image message styles
  imageBubbleWrapper: {
    position: "relative",
  },
  imageBubble: {
    borderRadius: BUBBLE_BORDER_RADIUS,
    overflow: "hidden",
    maxWidth: 280,
  },
  image: {
    width: "100%",
    height: 200,
  },
  imageCaption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  imageCaptionText: {
    fontSize: 15,
    lineHeight: 21,
  },
  pinIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
    alignSelf: "flex-start",
    gap: 4,
  },
  pinIndicatorText: {
    fontSize: 10,
    fontWeight: "500",
  },
});
