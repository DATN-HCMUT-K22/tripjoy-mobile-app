import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { BottomNavigation } from "@/components/social/BottomNavigation";
import { PostCard } from "@/components/social/PostCard";
import { SearchBar } from "@/components/social/SearchBar";
import { SocialHeader } from "@/components/social/SocialHeader";
import { TabMenu } from "@/components/social/TabMenu";
import { useAuthLogger } from "@/hooks/useAuthLogger";
import { useConversations } from "@/hooks/useConversations";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  useBookmarkPost,
  useCommentPost,
  useLikePost,
  usePosts,
  useSharePost,
} from "@/hooks/useSocial";
import { TabType } from "@/types/social";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const { requireAuth, showLoginModal, setShowLoginModal } = useRequireAuth();
  const { data: allPosts = [], isLoading: postsLoading } = usePosts();
  const likePostMutation = useLikePost();
  const bookmarkPostMutation = useBookmarkPost();
  const commentPostMutation = useCommentPost();
  const sharePostMutation = useSharePost();

  useAuthLogger("HomeScreen");
  const [activeTab, setActiveTab] = useState<TabType>("popular");

  // Sắp xếp posts: Phổ biến (theo likes) và Gần đây (theo thời gian)
  const posts = useMemo(() => {
    if (activeTab === "popular") {
      return [...allPosts].sort((a, b) => b.likes - a.likes);
    }
    const parseTimeAgo = (timeAgo: string): number => {
      if (timeAgo.includes("phút")) return parseInt(timeAgo) || 0;
      if (timeAgo.includes("giờ")) return (parseInt(timeAgo) || 0) * 60;
      if (timeAgo.includes("ngày")) return (parseInt(timeAgo) || 0) * 60 * 24;
      return 0;
    };
    return [...allPosts].sort((a, b) => {
      const timeA = parseTimeAgo(a.timeAgo);
      const timeB = parseTimeAgo(b.timeAgo);
      return timeA - timeB;
    });
  }, [activeTab, allPosts]);
  const [activeIcon, setActiveIcon] = useState<
    "notification" | "message" | null
  >(null);

  // Lấy conversations để tính unread count
  const { conversations } = useConversations();

  // Tổng unread_count từ tất cả conversation
  const unreadConversationsCount = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + (conv.unread_count ?? 0), 0);
  }, [conversations]);

  // Reset activeIcon khi quay lại màn này
  useFocusEffect(
    useCallback(() => {
      // Reset activeIcon khi focus vào màn này (quay lại từ messages)
      setActiveIcon(null);
    }, [])
  );

  const handleSearch = (text: string) => {
    console.log("Search:", text);
  };

  const handleLike = async (postId: string) => {
    const result = await requireAuth(async () => {
      await likePostMutation.mutateAsync(postId);
      return true;
    });
    return result;
  };

  const handleComment = async (postId: string) => {
    await requireAuth(async () => {
      // API đã gắn: commentPostMutation.mutateAsync({ postId, content }). Cần modal nhập nội dung.
      console.log("Comment post:", postId);
    });
  };

  const handleShare = async (postId: string) => {
    await requireAuth(async () => {
      await sharePostMutation.mutateAsync(postId);
    });
  };

  const handleBookmark = async (postId: string) => {
    const result = await requireAuth(async () => {
      await bookmarkPostMutation.mutateAsync(postId);
      return true;
    });
    return result;
  };

  const handleDownload = async (postId: string) => {
    await requireAuth(async () => {
      // TODO: Call API download post
      console.log("Download post:", postId);
      // await downloadPost(postId);
    });
  };

  const handleReport = async (postId: string) => {
    await requireAuth(async () => {
      // TODO: Call API report post
      console.log("Report post:", postId);
      // await reportPost(postId);
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <SocialHeader
          notificationCount={3}
          messageCount={unreadConversationsCount}
          activeIcon={activeIcon}
          onNotificationPress={async () => {
            await requireAuth(async () => {
              setActiveIcon("notification");
              // TODO: Call API get notifications
              console.log("Notification pressed");
            });
          }}
          onMessagePress={async () => {
            await requireAuth(async () => {
              setActiveIcon("message");
              router.push("/messages");
            });
          }}
        />

        <SearchBar onSearch={handleSearch} />

        <TabMenu activeTab={activeTab} onTabChange={setActiveTab} />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="pb-4">
            {postsLoading ? (
              <ActivityIndicator size="large" style={{ paddingVertical: 32 }} />
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  onShare={handleShare}
                  onBookmark={handleBookmark}
                  onDownload={handleDownload}
                  onReport={handleReport}
                />
              ))
            )}
          </View>
        </ScrollView>

        <BottomNavigation />
      </View>

      <LoginRequiredModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </SafeAreaView>
  );
}
