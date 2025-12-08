import { BottomNavigation } from "@/components/social/BottomNavigation";
import { PostCard } from "@/components/social/PostCard";
import { SearchBar } from "@/components/social/SearchBar";
import { SocialHeader } from "@/components/social/SocialHeader";
import { TabMenu } from "@/components/social/TabMenu";
import { mockPosts } from "@/data/mockPosts";
import { TabType } from "@/types/social";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { SafeAreaView, ScrollView, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
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

  const handleLike = (postId: string) => {
    console.log("Like post:", postId);
  };

  const handleComment = (postId: string) => {
    console.log("Comment on post:", postId);
  };

  const handleShare = (postId: string) => {
    console.log("Share post:", postId);
  };

  const handleBookmark = (postId: string) => {
    console.log("Bookmark post:", postId);
  };

  const handleDownload = (postId: string) => {
    console.log("Download post:", postId);
  };

  const handleReport = (postId: string) => {
    console.log("Report post:", postId);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <SocialHeader
          notificationCount={3}
          messageCount={5}
          activeIcon={activeIcon}
          onNotificationPress={() => {
            setActiveIcon("notification");
            console.log("Notification pressed");
          }}
          onMessagePress={() => {
            setActiveIcon("message");
            router.push("/messages");
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
    </SafeAreaView>
  );
}
