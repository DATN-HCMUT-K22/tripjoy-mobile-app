import {
  ChatMessageResponse,
  ParentMessage,
  getChatSenderId,
  getSenderAvatarParts,
  getSenderLabel,
} from "@/types/message";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { SharedPostCard } from "./SharedPostCard";

// Layout constants (tránh magic numbers)
const AVATAR_SIZE = 40;
const AVATAR_RADIUS = AVATAR_SIZE / 2;
const BUBBLE_BORDER_RADIUS = 18;
const MAX_BUBBLE_WIDTH_PERCENT = "75%";
const MIN_BUBBLE_WIDTH = 60;

// Bot Premium Colors
const BOT_PRIMARY = "#A855F7";
const BOT_BG = "#F3E8FF";
const BOT_BORDER = "#D8B4FE";
const BOT_TEXT = "#111827";

// Highlight animation constants
const HIGHLIGHT_FADE_IN_DURATION = 200;
const HIGHLIGHT_FADE_OUT_DURATION = 1800;
const HIGHLIGHT_DISPLAY_TIME = 2000;

interface ChatMessageProps {
  message: ChatMessageResponse;
  currentUserId?: string;
  showSenderName?: boolean;
  showTimestamp?: boolean;
  onLike?: (messageId: string) => void;
  onShowLikes?: (messageId: string) => void;
  onReply?: (message: ChatMessageResponse) => void;
  onReplyPress?: (messageId: string) => void;
  onLongPress?: () => void;
  onImagePress?: (imageUrl: string) => void;
  isHighlighted?: boolean;
  showAvatar?: boolean;
}

// Format time helper
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};


// Cache để lưu trữ tỉ lệ khung hình của ảnh theo URL, tránh bị nhảy layout khi component re-render hoặc recycle
const imageRatioCache = new Map<string, number>();

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  currentUserId,
  showSenderName = true,
  showTimestamp = true,
  onLike,
  onShowLikes,
  onReply,
  onReplyPress,
  onLongPress,
  onImagePress,
  isHighlighted = false,
  showAvatar = true,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  // Khởi tạo aspect ratio từ cache nếu đã có, tránh nhảy layout
  const initialRatio = (message.media_url && imageRatioCache.get(message.media_url)) || 1;
  const [imgAspectRatio, setImgAspectRatio] = React.useState<number>(initialRatio);

  // Highlight animation for thread navigation
  const highlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isHighlighted) {
      const animation = Animated.sequence([
        Animated.timing(highlightAnim, {
          toValue: 1,
          duration: HIGHLIGHT_FADE_IN_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: HIGHLIGHT_FADE_OUT_DURATION,
          useNativeDriver: false,
        }),
      ]);
      animation.start();

      // Cleanup animation on unmount or when isHighlighted changes
      return () => {
        animation.stop();
        highlightAnim.setValue(0);
      };
    }
  }, [isHighlighted, highlightAnim]);

  const highlightColor = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0)", "rgba(251,191,36,0.3)"],
  });
  
  const isMe = getChatSenderId(message) === currentUserId;
  
  // Robust isBot detection
  const senderName = (message.sender?.fullName || message.sender?.username || "").toLowerCase();
  const isBot = message.is_bot === true || 
                senderName.includes("tripjoy bot") || 
                senderName.includes("tripjoy admin") ||
                senderName.includes("assistant");
  
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

  // Avatar JSX (Only show for others and when showAvatar is true)
  const avatar = !isMe ? (
    <View style={styles.avatarContainer}>
      {showAvatar ? (
        isBot ? (
          <View style={[styles.avatarCircle, { backgroundColor: BOT_BG, borderColor: BOT_BORDER, borderWidth: 1 }]}>
            <Image
              source={require("@/assets/logo/ai_bot.webp")}
              style={styles.avatarBotIcon}
              contentFit="cover"
            />
          </View>
        ) : (
          <Image
            source={{ uri: resolvedAvatarUri }}
            style={styles.avatar}
            contentFit="cover"
          />
        )
      ) : (
        <View style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }} />
      )}
    </View>
  ) : null;

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
        <Text style={[styles.senderName, { color: isBot ? BOT_PRIMARY : senderNameColor }]}>
          {isBot ? "Tripjoy Bot" : senderDisplayName}
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

  // Render parent message preview with media thumbnails
  const renderParentMessagePreview = (parent: ChatMessageResponse | ParentMessage) => {
    const parentMessage = parent as ChatMessageResponse;
    const messageType = parentMessage.message_type;

    // IMAGE: Show 40x40 thumbnail
    if (messageType === "IMAGE" && parentMessage.media_url) {
      return (
        <View style={styles.replyMediaRow}>
          <Image
            source={{ uri: parentMessage.media_url }}
            style={styles.replyThumbnail}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <Text style={[styles.replyMediaLabel, { color: replyPreviewColor }]}>
            Photo
          </Text>
        </View>
      );
    }

    // VIDEO: Show play icon
    if (messageType === "VIDEO" && parentMessage.media_url) {
      return (
        <View style={styles.replyMediaRow}>
          <View style={styles.replyVideoThumbnail}>
            <Ionicons name="play-circle" size={24} color="#FFF" />
          </View>
          <Text style={[styles.replyMediaLabel, { color: replyPreviewColor }]}>
            Video
          </Text>
        </View>
      );
    }

    // SHARE_POST: Show document icon
    if (messageType === "SHARE_POST") {
      return (
        <View style={styles.replyMediaRow}>
          <Ionicons name="document-text" size={20} color="#34B27D" />
          <Text style={[styles.replyMediaLabel, { color: replyPreviewColor }]}>
            Shared a post
          </Text>
        </View>
      );
    }

    // TEXT: Keep existing behavior (backwards compatible)
    return (
      <Text style={[styles.replyPreviewText, { color: replyPreviewColor }]} numberOfLines={1}>
        {parent.message_content || ""}
      </Text>
    );
  };

  // Reply preview (bar bên trong bubble)
  const replyPreview =
    message.parent_message && (
      <TouchableOpacity
        onPress={() => {
          if (onReplyPress && message.parent_message_id) {
            onReplyPress(message.parent_message_id);
          }
        }}
        activeOpacity={0.7}
        disabled={!onReplyPress}
      >
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
          {renderParentMessagePreview(message.parent_message)}
        </View>
      </TouchableOpacity>
    );

  const botReplyTarget = React.useMemo(() => {
    if (!message.parent_message) return "Bạn";
    const parentSenderId = (message.parent_message as any).sender_id || (message.parent_message.sender as any)?.id;
    if (parentSenderId === currentUserId) return "Bạn";
    return getSenderLabel(message.parent_message.sender, "Thành viên");
  }, [message.parent_message, currentUserId]);

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
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onImagePress && message.media_url ? onImagePress(message.media_url) : undefined}
            onLongPress={onLongPress}
          >
            <Image
              source={{ uri: message.media_url }}
              style={[styles.image, { height: undefined, aspectRatio: imgAspectRatio }]}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              onLoad={(e) => {
                if (e.source.width && e.source.height) {
                  let ratio = e.source.width / e.source.height;
                  // Giới hạn tỉ lệ để ảnh không bị quá dài hoặc quá ngang
                  if (ratio < 0.5) ratio = 0.5;
                  if (ratio > 2) ratio = 2;
                  
                  // Lưu vào cache và cập nhật state nếu tỉ lệ thay đổi đáng kể
                  if (message.media_url) {
                    imageRatioCache.set(message.media_url, ratio);
                  }
                  
                  if (Math.abs(ratio - imgAspectRatio) > 0.01) {
                    setImgAspectRatio(ratio);
                  }
                }
              }}
            />
          </TouchableOpacity>
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
    ) : message.message_type === "SHARE_POST" ? (
      <View style={styles.bubbleWrapper}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isBot ? BOT_BG : bubbleColor,
              borderWidth: isBot || !isMe ? 1 : 0,
              borderColor: isBot ? BOT_BORDER : borderColor,
              paddingTop: 10,
              paddingHorizontal: 12,
              paddingBottom: 12,
            },
          ]}
        >
          {replyPreview}
          
          {message.message_content && (
            <Text
              style={[
                styles.messageText,
                {
                  color: isBot ? BOT_TEXT : textColor,
                  marginBottom: 8,
                },
              ]}
              selectable
            >
              {message.message_content}
            </Text>
          )}

          {message.shared_post ? (
            <SharedPostCard
              post={message.shared_post}
              onPress={() => {
                const postId = message.shared_post_id || message.shared_post?.id;
                if (postId) {
                  router.push(`/post/${postId}`);
                }
              }}
            />
          ) : (
            <View style={styles.fallbackCard}>
              <Ionicons name="alert-circle-outline" size={24} color="#9CA3AF" />
              <Text style={[styles.fallbackText, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
                Post không khả dụng
              </Text>
            </View>
          )}
        </View>
      </View>
    ) : (
      <View style={styles.bubbleWrapper}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isBot ? BOT_BG : bubbleColor,
              borderWidth: isBot || !isMe ? 1 : 0,
              borderColor: isBot ? BOT_BORDER : borderColor,
              paddingTop: isBot ? 0 : 10,
              paddingHorizontal: isBot ? 0 : 12,
            },
          ]}
        >
          {isBot && (
            <View style={styles.botReplyHeader}>
               <View style={styles.botReplyRow}>
                 <Ionicons name="arrow-back" size={14} color={BOT_PRIMARY} style={{ opacity: 0.7 }} />
                 <Text style={styles.botReplyText}>Phản hồi đến {botReplyTarget}</Text>
               </View>
               <View style={[styles.botDivider, { backgroundColor: BOT_BORDER }]} />
            </View>
          )}

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
            style={[styles.messageText, { 
              color: isBot ? BOT_TEXT : textColor,
              paddingHorizontal: isBot ? 12 : 0,
              paddingBottom: isBot ? 10 : 0,
              paddingTop: isBot ? 8 : 0,
            }]}
            selectable
          >
            {message.message_content}
          </Text>

          {/* Like: like_count > 0 thì hiện số + icon heart màu đỏ */}
          <View style={[styles.likeContainer, { paddingHorizontal: isBot ? 12 : 0, paddingBottom: isBot ? 8 : 0 }]}>
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
      <Animated.View style={[{ backgroundColor: highlightColor }]}>
        <Pressable
          onLongPress={onLongPress}
          delayLongPress={400}
          style={[containerStyle, { flex: 1 }]}
        >
          {Inner}
        </Pressable>
      </Animated.View>
    );
  }
  return (
    <Animated.View style={[containerStyle, { backgroundColor: highlightColor }]}>
      {Inner}
    </Animated.View>
  );
};

// Giữ export cũ để không phá vỡ import hiện tại
export const ChatBubble = React.memo(ChatMessage);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  containerRight: {
    justifyContent: "flex-end",
    paddingRight: 12,
    paddingLeft: 12,
  },
  containerLeft: {
    justifyContent: "flex-start",
    paddingLeft: 8,  // Khoảng cách bên trái cho avatar
    paddingRight: 12,
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
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarBotIcon: {
    width: "100%",
    height: "100%",
  },
  messageWrapper: {
    maxWidth: MAX_BUBBLE_WIDTH_PERCENT,
    minWidth: MIN_BUBBLE_WIDTH, // Minimum width cho message rất ngắn
  },
  messageWrapperRight: {
    alignItems: "flex-end",
    marginRight: 0,
  },
  messageWrapperLeft: {
    alignItems: "flex-start",
    marginLeft: 0,
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
  replyMediaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  replyThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  replyVideoThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  replyMediaLabel: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  replyDivider: {
    height: 1,
    marginBottom: 8,
    opacity: 0.5,
  },
  // Bot styles
  botReplyHeader: {
    width: '100%',
  },
  botReplyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  botReplyText: {
    fontSize: 13,
    color: "#A855F7",
    fontWeight: "500",
  },
  botDivider: {
    height: 1,
    width: '100%',
    opacity: 0.3,
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
    width: 260, // Cố định chiều rộng để không bị bóp theo độ dài của text
    maxWidth: "100%",
  },
  image: {
    width: "100%",
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
  // Fallback card for unavailable shared post
  fallbackCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(156, 163, 175, 0.1)",
    width: 240,
  },
  fallbackText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
