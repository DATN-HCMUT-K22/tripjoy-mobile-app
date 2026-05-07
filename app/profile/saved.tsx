import { PostCard } from "@/components/social/PostCard";
import { ShareModal } from "@/components/social/ShareModal";
import { SocialHeader } from "@/components/social/SocialHeader";
import { useSavedPosts } from "@/hooks/useSocial";
import { useBookmarkPost, useLikePost } from "@/hooks/useSocial";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import * as RN from "react-native";

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
    return handleAuthAction(() => likeMutation.mutateAsync({ postId }));
  };

  const handleBookmark = async (postId: string) => {
    return handleAuthAction(() => bookmarkMutation.mutateAsync({ postId }));
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
      <RN.View className="py-4">
        <RN.ActivityIndicator size="small" color="#34B27D" />
      </RN.View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <RN.View className="flex-1 items-center justify-center py-20">
          <RN.ActivityIndicator size="large" color="#34B27D" />
          <RN.Text className="text-gray-500 mt-4">Đang tải...</RN.Text>
        </RN.View>
      );
    }

    if (isError) {
      return (
        <RN.View className="flex-1 items-center justify-center py-20">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <RN.Text className="text-gray-800 text-lg font-semibold mt-4">
            Không thể tải dữ liệu
          </RN.Text>
          <RN.Text className="text-gray-500 mt-2">Vui lòng thử lại sau</RN.Text>
          <RN.TouchableOpacity
            onPress={() => refetch()}
            className="mt-4 bg-green-600 px-6 py-3 rounded-lg"
          >
            <RN.Text className="text-white font-semibold">Thử lại</RN.Text>
          </RN.TouchableOpacity>
        </RN.View>
      );
    }

    return (
      <RN.View className="flex-1 items-center justify-center py-20">
        <Ionicons name="bookmark-outline" size={64} color="#9CA3AF" />
        <RN.Text className="text-gray-800 text-lg font-semibold mt-4">
          Chưa có bài viết đã lưu
        </RN.Text>
        <RN.Text className="text-gray-500 mt-2 text-center px-8">
          Nhấn vào biểu tượng bookmark để lưu các bài viết yêu thích
        </RN.Text>
        <RN.TouchableOpacity
          onPress={() => router.push("/(tabs)")}
          className="mt-6 bg-green-600 px-6 py-3 rounded-lg"
        >
          <RN.Text className="text-white font-semibold">Khám phá ngay</RN.Text>
        </RN.TouchableOpacity>
      </RN.View>
    );
  };

  if (isCheckingAuth) {
    return (
      <RN.SafeAreaView className="flex-1 bg-white">
        <RN.View className="flex-1 items-center justify-center">
          <RN.ActivityIndicator size="large" color="#34B27D" />
        </RN.View>
      </RN.SafeAreaView>
    );
  }

  return (
    <RN.SafeAreaView className="flex-1 bg-gray-50">
      <SocialHeader
        title="Bài viết đã lưu"
        showBackButton
        onBackPress={() => router.back()}
      />

      <RN.FlatList
        data={savedPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onBookmark={handleBookmark}

            onReport={handleReport}
          />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RN.RefreshControl
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
    </RN.SafeAreaView>
  );
}
