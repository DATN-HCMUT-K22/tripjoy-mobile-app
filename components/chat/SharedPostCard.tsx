import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { resolveUserAvatarUri } from "@/utils/userAvatar";

/**
 * Shared post object structure from backend
 */
interface SharedPost {
  id: string;
  content: string;
  media_urls: string[];
  created_by_user: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
  like_count: number;
  comment_count: number;
}

interface SharedPostCardProps {
  post: SharedPost;
  onPress: () => void;
}

/**
 * Rich preview card for shared posts in chat
 *
 * Shows:
 * - 60x60 thumbnail (first media or fallback icon)
 * - Author avatar + name
 * - Content preview (2 lines max)
 * - Like/comment counts
 * - "Xem chi tiết" call-to-action
 */
export const SharedPostCard: React.FC<SharedPostCardProps> = React.memo(
  ({ post, onPress }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    // Error states for image loading
    const [thumbnailError, setThumbnailError] = useState(false);

    // Colors
    const cardBg = isDark ? "#1F2937" : "#F3F4F6";
    const cardBorder = isDark ? "#374151" : "#E5E7EB";
    const titleColor = isDark ? "#F3F4F6" : "#111827";
    const authorColor = isDark ? "#D1D5DB" : "#374151";
    const statsColor = isDark ? "#9CA3AF" : "#6B7280";
    const linkColor = "#34B27D";

    // Avatar
    const author = post.created_by_user;
    const authorAvatarUri = resolveUserAvatarUri(
      author.avatarUrl,
      author.fullName || author.username
    );

    // Thumbnail: first media or fallback
    const hasThumbnail = post.media_urls && post.media_urls.length > 0 && !thumbnailError;
    const thumbnailUri = hasThumbnail ? post.media_urls[0] : null;
    const hasMultipleMedia = (post.media_urls?.length || 0) > 1;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[
          styles.card,
          { backgroundColor: cardBg, borderColor: cardBorder },
        ]}
      >
        {/* Header: Thumbnail + Author */}
        <View style={styles.header}>
          {/* Thumbnail */}
          <View style={styles.thumbnailContainer}>
            {thumbnailUri ? (
              <>
                <Image
                  source={{ uri: thumbnailUri }}
                  style={styles.thumbnail}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  onError={() => setThumbnailError(true)}
                />
                {hasMultipleMedia && (
                  <View style={styles.mediaBadge}>
                    <Text style={styles.mediaBadgeText}>
                      +{post.media_urls.length - 1}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailFallback]}>
                <Ionicons name="document-text" size={28} color="#9CA3AF" />
              </View>
            )}
          </View>

          {/* Author Info */}
          <View style={styles.authorInfo}>
            <Image
              source={{ uri: authorAvatarUri }}
              style={styles.authorAvatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <Text
              style={[styles.authorName, { color: authorColor }]}
              numberOfLines={1}
            >
              {author.fullName || author.username}
            </Text>
          </View>
        </View>

        {/* Content Preview */}
        {post.content ? (
          <Text
            style={[styles.contentPreview, { color: titleColor }]}
            numberOfLines={2}
          >
            {post.content}
          </Text>
        ) : null}

        {/* Footer: Stats + CTA */}
        <View style={styles.footer}>
          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={14} color="#EF4444" />
              <Text style={[styles.statText, { color: statsColor }]}>
                {post.like_count || 0}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble" size={14} color="#3B82F6" />
              <Text style={[styles.statText, { color: statsColor }]}>
                {post.comment_count || 0}
              </Text>
            </View>
          </View>

          {/* CTA */}
          <View style={styles.cta}>
            <Text style={[styles.ctaText, { color: linkColor }]}>
              Xem chi tiết
            </Text>
            <Ionicons name="chevron-forward" size={14} color={linkColor} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

SharedPostCard.displayName = "SharedPostCard";

const CARD_WIDTH = 240;
const THUMBNAIL_SIZE = 60;
const AVATAR_SIZE = 24;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  thumbnailContainer: {
    position: "relative",
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
  },
  thumbnailFallback: {
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  mediaBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  authorInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  authorAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  authorName: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  contentPreview: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
