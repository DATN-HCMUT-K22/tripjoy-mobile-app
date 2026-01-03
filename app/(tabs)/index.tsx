import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { BottomNavigation } from "@/components/social/BottomNavigation";
import { PostCard } from "@/components/social/PostCard";
import { SearchBar } from "@/components/social/SearchBar";
import { SocialHeader } from "@/components/social/SocialHeader";
import { TabMenu } from "@/components/social/TabMenu";
import { mockPosts } from "@/data/mockPosts";
import { useAuthLogger } from "@/hooks/useAuthLogger";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { TabType } from "@/types/social";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { SafeAreaView, ScrollView, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const { requireAuth, showLoginModal, setShowLoginModal } = useRequireAuth();

  // Log user info và token từ Redux khi component mount
  useAuthLogger("HomeScreen");
  const [activeTab, setActiveTab] = useState<TabType>("popular");
  const [posts] = useState(mockPosts);
  const [activeIcon, setActiveIcon] = useState<
    "notification" | "message" | null
  >(null);

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
      // TODO: Call API like post
      console.log("Like post:", postId);
      // await likePost(postId);
      return true; // Trả về true để báo thành công
    });
    // Nếu result là null, có nghĩa là không có auth (modal đã hiện)
    return result;
  };

  const handleComment = async (postId: string) => {
    await requireAuth(async () => {
      // TODO: Call API comment post
      console.log("Comment on post:", postId);
      // await commentPost(postId);
    });
  };

  const handleShare = async (postId: string) => {
    await requireAuth(async () => {
      // TODO: Call API share post
      console.log("Share post:", postId);
      // await sharePost(postId);
    });
  };

  const handleBookmark = async (postId: string) => {
    const result = await requireAuth(async () => {
      // TODO: Call API bookmark post
      console.log("Bookmark post:", postId);
      // await bookmarkPost(postId);
      return true; // Trả về true để báo thành công
    });
    // Nếu result là null, có nghĩa là không có auth (modal đã hiện)
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
          messageCount={5}
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
          {posts.map((post) => (
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
          ))}
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
