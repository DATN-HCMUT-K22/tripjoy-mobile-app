import { Post } from "@/types/social";
import { formatNumber } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onDownload?: (postId: string) => void;
  onReport?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onDownload,
  onReport,
}) => {
  const [isLiked, setIsLiked] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(post.isBookmarked);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(post.id);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.(post.id);
  };

  return (
    <View className="bg-white mb-4">
      {/* Image với bookmark icon */}
      <View className="relative">
        <Image
          source={{ uri: post.image }}
          style={{ width: "100%", height: 320 }}
          contentFit="cover"
        />
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
            <Image
              source={{ uri: post.user.avatar }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              contentFit="cover"
            />
            <View className="flex-1">
              <Text className="text-base text-gray-600">{post.timestamp}</Text>
              <Text className="text-sm text-gray-500">{post.timeAgo}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-center gap-3">
            <TouchableOpacity
              onPress={() => onDownload?.(post.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="download" size={20} color="#666" />
            </TouchableOpacity>
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
    </View>
  );
};
