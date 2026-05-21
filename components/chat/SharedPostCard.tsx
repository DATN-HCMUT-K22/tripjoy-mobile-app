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
import { PLACEHOLDER_ITINERARY_IMAGE } from "@/hooks/useItineraries";

/**
 * Shared post object structure from backend
 */
interface SharedPost {
  id: string;
  content?: string;
  content_snippet?: string;
  contentSnippet?: string;
  media_urls?: string[];
  mediaUrls?: string[];
  thumbnail_url?: string;
  thumbnailUrl?: string;
  location_name?: string;
  locationName?: string;
  hashtags?: string[];
  author?: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
  created_by_user?: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
  like_count?: number;
  comment_count?: number;
}

interface SharedPostCardProps {
  post: SharedPost;
  onPress: () => void;
}

/**
 * Premium shared post card - Matching the user provided UI design
 * 
 * Layout:
 * [     Large Image     ]
 * [ 📍 Title      Flag  ]
 * [ #hashtags           ]
 * [ Content snippet     ]
 * [         Xem chi tiết]
 */
export const SharedPostCard: React.FC<SharedPostCardProps> = React.memo(
  ({ post, onPress }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    // Error states for image loading
    const [thumbnailError, setThumbnailError] = useState(false);

    // Colors
    const cardBg = isDark ? "#1F2937" : "#FFFFFF";
    const cardBorder = isDark ? "#374151" : "#E5E7EB";
    const titleColor = isDark ? "#F3F4F6" : "#111827";
    const snippetColor = isDark ? "#D1D5DB" : "#374151";
    const hashtagColor = isDark ? "#9CA3AF" : "#9CA3AF";
    const linkColor = "#34B27D";

    // Normalize data from multiple possible backend formats
    const author = post?.author || post?.created_by_user || (post as any)?.createdByUser;
    const thumbnailUri = post?.thumbnail_url || post?.thumbnailUrl || (post as any)?.thumbnail || (post?.media_urls && post.media_urls[0]) || (post?.mediaUrls && post.mediaUrls[0]) || PLACEHOLDER_ITINERARY_IMAGE;
    const locationName = post?.location_name || post?.locationName || "Địa điểm khám phá";
    const contentSnippet = post?.content_snippet || post?.contentSnippet || post?.content || "";
    const hashtags = post?.hashtags || [];

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[
          styles.card,
          { backgroundColor: cardBg, borderColor: cardBorder },
        ]}
      >
        {/* 1. Large Top Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: thumbnailError ? PLACEHOLDER_ITINERARY_IMAGE : thumbnailUri }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            onError={() => setThumbnailError(true)}
          />
        </View>

        {/* 2. Content Area */}
        <View style={styles.contentContainer}>
          {/* Title Row: Location + Optional Flag Icon placeholder */}
          <View style={styles.titleRow}>
            <View style={styles.locationContainer}>
              <Ionicons name="location-sharp" size={18} color="#EF4444" />
              <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
                {locationName}
              </Text>
            </View>
            
            {/* Example Flag / Region Indicator */}
            {locationName.includes("Việt Nam") && (
               <View style={styles.flagContainer}>
                  <Text style={styles.flagEmoji}>🇻🇳</Text>
               </View>
            )}
          </View>

          {/* Hashtags Row */}
          {hashtags.length > 0 && (
            <Text style={[styles.hashtag, { color: hashtagColor }]} numberOfLines={1}>
              {hashtags.map(tag => `#${tag.replace("#", "")}`).join(" ")}
            </Text>
          )}

          {/* Snippet Row */}
          <Text 
            style={[styles.snippet, { color: snippetColor }]} 
            numberOfLines={2}
          >
            {contentSnippet}
          </Text>

          {/* CTA Row */}
          <View style={styles.footer}>
            <Text style={[styles.ctaText, { color: linkColor }]}>
              Xem chi tiết
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

SharedPostCard.displayName = "SharedPostCard";

const CARD_WIDTH = 260;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    maxWidth: "100%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    alignSelf: "flex-start",
    // Subtle shadow for premium feel
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: "100%",
    height: 140,
    backgroundColor: "#F3F4F6",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    padding: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  flagContainer: {
    width: 28,
    height: 18,
    borderRadius: 2,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  flagEmoji: {
    fontSize: 12,
  },
  hashtag: {
    fontSize: 13,
    marginBottom: 4,
  },
  snippet: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
