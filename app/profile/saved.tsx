import { PostCard } from "@/components/social/PostCard";
import { ShareModal } from "@/components/social/ShareModal";
import { SocialHeader } from "@/components/social/SocialHeader";
import { useSavedPosts } from "@/hooks/useSocial";
import { useBookmarkPost, useLikePost } from "@/hooks/useSocial";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SavedPostsScreen() {
  const router = useRouter();
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostTitle, setSelectedPostTitle] = useState<string>("");

  // Require auth for this screen
  const { isCheckingAuth, showLoginModal, setShowLoginModal, handleAuthAction } =
    useRequireAuth();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useSavedPosts();

  const bookmarkMutation = useBookmarkPost();
  const likeMutation = useLikePost();

  // Flatten all pages into single array
  const savedPosts = data?.pages.flatMap((page) => page.content) ?? [];

  const handleLike = async (postId: string) => {
    return handleAuthAction(() => likeMutation.mutateAsync(postId));
  };

  const handleBookmark = async (postId: string) => {
    return handleAuthAction(() => bookmarkMutation.mutateAsync(postId));
  };

  const handleComment = (postId: string) => {
    handleAuthAction(() => {
      router.push(`/post/${postId}` as any);
    });
  };

  const handleShare = (postId: string) => {
    const post = savedPosts.find((p) => p.id === postId);
    setSelectedPostId(postId);
    setSelectedPostTitle(post?.caption || "");
    setShowShareModal(true);
  };

  const handleDownload = (postId: string) => {
    console.log("Download post:", postId);
  };

  const handleReport = (postId: string) => {
    console.log("Report post:", postId);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#34B27D" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#34B27D" />
          <Text className="text-gray-500 mt-4">Đang tải...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-gray-800 text-lg font-semibold mt-4">
            Không thể tải dữ liệu
          </Text>
          <Text className="text-gray-500 mt-2">Vui lòng thử lại sau</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="mt-4 bg-green-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="flex-1 items-center justify-center py-20">
        <Ionicons name="bookmark-outline" size={64} color="#9CA3AF" />
        <Text className="text-gray-800 text-lg font-semibold mt-4">
          Chưa có bài viết đã lưu
        </Text>
        <Text className="text-gray-500 mt-2 text-center px-8">
          Nhấn vào biểu tượng bookmark để lưu các bài viết yêu thích
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)")}
          className="mt-6 bg-green-600 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Khám phá ngay</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isCheckingAuth) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#34B27D" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <SocialHeader
        title="Bài viết đã lưu"
        showBackButton
        onBackPress={() => router.back()}
      />

      <FlatList
        data={savedPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onBookmark={handleBookmark}
            onDownload={handleDownload}
            onReport={handleReport}
          />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#34B27D"
            colors={["#34B27D"]}
          />
        }
        contentContainerStyle={
          savedPosts.length === 0 ? { flex: 1 } : undefined
        }
      />

      {/* Share Modal */}
      {selectedPostId && (
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          postId={selectedPostId}
          postTitle={selectedPostTitle}
        />
      )}
    </SafeAreaView>
  );
}
