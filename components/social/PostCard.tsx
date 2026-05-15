import { Post } from "@/types/social";
import { formatNumber, formatCurrencyVND } from "@/utils/format";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { useAppSelector } from "@/store/hooks";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import { Text, TouchableOpacity, View, FlatList, Dimensions, StyleSheet, Pressable, Modal } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { HashtagList } from "./HashtagList";
import { PostActionsMenu } from "./PostActionsMenu";

const screenWidth = Dimensions.get('window').width;

interface ItineraryPreviewProps {
  itinerary: Post['itinerary'];
}

const ItineraryPreview: React.FC<ItineraryPreviewProps> = ({ itinerary }) => {
  const router = useRouter();

  if (!itinerary) return null;

  const handlePress = () => {
    router.push(`/itinerary/detail?id=${itinerary.id}` as any);
  };

  return (
    <TouchableOpacity
      style={styles.itineraryCard}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.itineraryIcon}>
        <Ionicons name="map-outline" size={20} color="#16A34A" />
      </View>
      <View style={styles.itineraryInfo}>
        <Text style={styles.itineraryTitle} numberOfLines={1}>
          {itinerary.title || itinerary.name}
        </Text>
        {(itinerary.duration_days || itinerary.budget_estimate) ? (
          <View style={styles.itineraryMeta}>
            <Text style={styles.itineraryText}>
              {itinerary.duration_days ? `${itinerary.duration_days} ngày` : ""}
              {itinerary.duration_days && itinerary.budget_estimate ? " • " : ""}
              {itinerary.budget_estimate ? formatCurrencyVND(itinerary.budget_estimate) : ""}
            </Text>
          </View>
        ) : (
          <Text style={styles.itineraryText}>Xem chi tiết lịch trình</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
};

interface PostCardProps {
  post: Post;
  onLike?: (
    postId: string
  ) => void | Promise<void | boolean | null | undefined>;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (
    postId: string
  ) => void | Promise<void | boolean | null | undefined>;
  onReport?: (postId: string) => void;
}

export const PostCard = React.memo<PostCardProps>(
  ({
    post,
    onLike,
    onComment,
    onShare,
    onBookmark,
    onReport,
  }) => {
    const router = useRouter();
    const currentUserId = useAppSelector((state) => state.auth.user?.id);
    const isOwner = post.creator_id === currentUserId;

    // Use props directly to stay in sync with React Query / Realtime
    const isLiked = post.isLiked;
    const isBookmarked = post.isBookmarked;
    const [imageError, setImageError] = React.useState(false);
    const [avatarError, setAvatarError] = React.useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = React.useState(0);
    const [failedImageIndices, setFailedImageIndices] = React.useState<Set<number>>(new Set());
    const [showActionsMenu, setShowActionsMenu] = React.useState(false);
    const [showPrivacyTooltip, setShowPrivacyTooltip] = React.useState(false);

    // Double-tap animation values
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const lastTap = useRef<number>(0);

    const mediaUrls = post.media_urls && post.media_urls.length > 0 ? post.media_urls : [post.image].filter(Boolean);

    const handleLike = () => {
      onLike?.(post.id);
    };

    const triggerLikeAnimation = () => {
      scale.value = 0;
      opacity.value = 1;
      scale.value = withSequence(
        withSpring(1, { damping: 8, stiffness: 100 }),
        withSpring(1.2, { damping: 8, stiffness: 100 }),
        withTiming(0, { duration: 400 })
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 400 })
      );
    };

    const handleDoubleTap = () => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300; // ms

      if (now - lastTap.current < DOUBLE_TAP_DELAY) {
        // Double tap detected
        if (!isLiked) {
          triggerLikeAnimation();
          handleLike();
        }
      }

      lastTap.current = now;
    };

    const animatedHeartStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
      };
    });

    const handleBookmark = () => {
      onBookmark?.(post.id);
    };

    const handleAvatarPress = () => {
      // Check if viewing own profile
      if (post.creator_id === currentUserId) {
        // Navigate to own profile
        router.push('/profile');
      } else {
        // Navigate to user profile
        router.push(`/user/${post.creator_id}` as any);
      }
    };

    return (
      <View className="bg-white mb-4">
        {/* Media Carousel với bookmark icon - fullwidth */}
        <View className="relative">
          {mediaUrls.length > 0 ? (
            <FlatList
              data={mediaUrls}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEnabled={true}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                setCurrentMediaIndex(index);
              }}
              renderItem={({ item, index }) => (
                <Pressable onPress={handleDoubleTap}>
                  {!failedImageIndices.has(index) ? (
                    <Image
                      source={{ uri: item }}
                      style={{ width: screenWidth, height: 320 }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      priority="high"
                      placeholder={{ blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH" }}
                      transition={200}
                      onError={(error) => {
                        console.error(
                          "[PostCard] Error loading image:",
                          error,
                          "URI:",
                          item
                        );
                        // Track individual failed images
                        setFailedImageIndices((prev) => new Set(prev).add(index));
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: screenWidth,
                        height: 320,
                        backgroundColor: "#E5E7EB",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="image-outline" size={64} color="#9CA3AF" />
                    </View>
                  )}
                </Pressable>
              )}
              keyExtractor={(item, index) => `${post.id}-media-${index}`}
            />
          ) : (
            <Pressable onPress={handleDoubleTap}>
              <View
                style={{
                  width: "100%",
                  height: 320,
                  backgroundColor: "#E5E7EB",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="image-outline" size={64} color="#9CA3AF" />
              </View>
            </Pressable>
          )}

          {/* Animated Heart for Double-Tap Like */}
          <Animated.View
            style={[
              {
                position: "absolute",
                top: "50%",
                left: "50%",
                marginLeft: -50,
                marginTop: -50,
                pointerEvents: "none",
              },
              animatedHeartStyle,
            ]}
          >
            <Ionicons name="heart" size={100} color="#EF4444" />
          </Animated.View>

          {/* Media Counter */}
          {mediaUrls.length > 1 && (
            <View
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
                {currentMediaIndex + 1}/{mediaUrls.length}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleBookmark}
            className="absolute top-3 right-3"
            activeOpacity={0.7}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={20}
                color={isBookmarked ? "#34B27D" : "#000"}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* User info và actions */}
        <View className="px-4 py-3">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2 flex-1">
              <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
                {!avatarError ? (
                  <Image
                    source={{
                      uri: resolveUserAvatarUri(post.user.avatar, post.user.name),
                    }}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    priority="normal"
                    placeholder={{ blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH" }}
                    transition={200}
                    onError={(error) => {
                      console.error(
                        "[PostCard] Error loading avatar:",
                        error,
                        "URI:",
                        post.user.avatar
                      );
                      setAvatarError(true);
                    }}
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
                    <Text className="text-white text-sm font-bold">
                      {post.user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <View className="flex-1">
                <View className="flex-row items-center gap-2 flex-wrap">
                  <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
                    <Text className="text-base text-gray-900 font-semibold">
                      {post.user.name}
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-base text-gray-600">• {post.timestamp}</Text>
                  {post.visibility === 'PRIVATE' && (
                    <TouchableOpacity
                      style={styles.privacyBadge}
                      onPress={() => setShowPrivacyTooltip(true)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="lock-closed" size={14} color="#6B7280" />
                      <Text style={styles.privacyText}>Riêng tư</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text className="text-sm text-gray-500">{post.timeAgo}</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-center gap-3">
              {isOwner && (
                <TouchableOpacity
                  onPress={() => setShowActionsMenu(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => onReport?.(post.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="alert-circle-outline" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onShare?.(post.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="share-social" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Caption */}
          <Text className="text-base text-gray-800 mb-3 leading-5 font-semibold">
            {post.caption}
          </Text>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <HashtagList
              hashtags={post.hashtags}
              onHashtagPress={(tag) => console.log('Hashtag clicked:', tag)}
            />
          )}

          {/* Itinerary Preview */}
          {post.itinerary && (
            <>
              <ItineraryPreview itinerary={post.itinerary} />
            </>
          )}

          {/* Engagement metrics */}
          <View className="flex-row items-center gap-8">
            <View className="flex-row items-center gap-1.5">
              <TouchableOpacity onPress={handleLike} activeOpacity={0.7}>
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={22}
                  color={isLiked ? "#ef4444" : "#666"}
                />
              </TouchableOpacity>
              <Text className="text-sm text-gray-600 font-medium">
                {formatNumber(post.likes)}
              </Text>
            </View>

            <View className="flex-row items-center gap-1.5">
              <TouchableOpacity
                onPress={() => onComment?.(post.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#666" />
              </TouchableOpacity>
              <Text className="text-sm text-gray-600">
                {formatNumber(post.comments)} bình luận
              </Text>
            </View>

            <View className="flex-row items-center gap-1.5">
              <Ionicons name="share-outline" size={20} color="#666" />
              <Text className="text-sm text-gray-600">
                {formatNumber(post.shares)} lượt chia sẻ
              </Text>
            </View>
          </View>
        </View>

        {/* Post Actions Menu */}
        <PostActionsMenu
          post={post}
          visible={showActionsMenu}
          onClose={() => setShowActionsMenu(false)}
        />

        {/* Privacy Tooltip Modal */}
        <Modal
          visible={showPrivacyTooltip}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPrivacyTooltip(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowPrivacyTooltip(false)}
          >
            <View style={styles.tooltipContainer}>
              <View style={styles.tooltipHeader}>
                <Ionicons name="lock-closed" size={24} color="#16A34A" />
                <Text style={styles.tooltipTitle}>Bài viết riêng tư</Text>
              </View>
              <Text style={styles.tooltipText}>
                Chỉ bạn và thành viên nhóm (nếu có liên kết hành trình) có thể xem bài viết này.
              </Text>
              <TouchableOpacity
                style={styles.tooltipButton}
                onPress={() => setShowPrivacyTooltip(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.tooltipButtonText}>Đã hiểu</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>


      </View>
    );
  }
);

const styles = StyleSheet.create({
  itineraryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  itineraryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itineraryInfo: {
    flex: 1,
  },
  itineraryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itineraryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itineraryText: {
    fontSize: 13,
    color: '#6B7280',
  },

  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  privacyText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tooltipContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  tooltipText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 20,
  },
  tooltipButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  tooltipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
