import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { BottomNavigation } from "@/components/social/BottomNavigation";
import { PostCard } from "@/components/social/PostCard";
import { PostCardSkeletonList } from "@/components/social/PostCardSkeleton";
import { SearchBar } from "@/components/social/SearchBar";
import { ShareModal } from "@/components/social/ShareModal";
import { SocialHeader } from "@/components/social/SocialHeader";
import { TabMenu } from "@/components/social/TabMenu";
import { CommentModal } from "@/components/social/CommentModal";
import { ReportModal } from "@/components/social/ReportModal";
import { useAuthLogger } from "@/hooks/useAuthLogger";
import { useConversations } from "@/hooks/useConversations";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useNotifications } from "@/hooks/useNotifications";
import {
  useBookmarkPost,
  useCommentPost,
  useFilteredPosts,
  useLikePost,
  usePostRealtimeUpdates,
  usePosts,
  useSharePost,
} from "@/hooks/useSocial";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { useItinerary } from "@/contexts/ItineraryContext";
import { TabType, type Post } from "@/types/social";
import { ContentType } from "@/types/report";
import { useAppSelector } from "@/store/hooks";
import { useFocusEffect, router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  RefreshControl,
  SafeAreaView,
  View
} from "react-native";
import { trackEvent, trackPostView } from "@/utils/analytics";
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  // const router = useRouter();
  const { requireAuth, showLoginModal, setShowLoginModal } = useRequireAuth();
  const { isGuest } = useGuestMode();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const { resetTripData } = useTripSetup();
  const { resetItinerary } = useItinerary();
  /** Chỉ gọi API cần đăng nhập khi thật sự có phiên (không chỉ "không phải guest" — tránh 401 ở màn login / trước khi đăng nhập). */
  const shouldLoadAuthenticatedData =
    isGuest === false && (isAuthenticated || !!accessToken);
  const { data: allPosts = [], isLoading: postsLoading, refetch } = usePosts();
  const filteredPosts = useFilteredPosts(allPosts);
  const likePostMutation = useLikePost();
  const bookmarkPostMutation = useBookmarkPost();
  const commentPostMutation = useCommentPost();
  const sharePostMutation = useSharePost();

  useAuthLogger("HomeScreen");



  const [activeTab, setActiveTab] = useState<TabType>("popular");
  const [refreshing, setRefreshing] = useState(false);

  // Sắp xếp posts: Phổ biến (theo likes) và Gần đây (theo thời gian)
  const posts = useMemo(() => {
    if (activeTab === "popular") {
      return [...filteredPosts].sort((a, b) => b.likes - a.likes);
    }
    return [...filteredPosts].sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return timeB - timeA; // Mới nhất lên đầu
    });
  }, [activeTab, filteredPosts]);
  const [activeIcon, setActiveIcon] = useState<
    "notification" | "message" | null
  >(null);

  // Comment modal state
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostForComment, setSelectedPostForComment] = useState<string | null>(null);

  // Share modal state
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedPostForShare, setSelectedPostForShare] = useState<string | null>(null);
  const [selectedPostTitle, setSelectedPostTitle] = useState<string>("");

  // Report modal state
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedPostForReport, setSelectedPostForReport] = useState<string | null>(null);

  // Lấy conversations để tính unread count
  const { conversations } = useConversations({
    enabled: shouldLoadAuthenticatedData,
  });
  const { unreadCount } = useNotifications({
    enabled: shouldLoadAuthenticatedData,
  });
  const notificationUnreadCount = shouldLoadAuthenticatedData ? unreadCount : 0;

  // Tổng unread_count từ tất cả conversation
  const unreadConversationsCount = useMemo(() => {
    if (!shouldLoadAuthenticatedData) return 0;
    return conversations.reduce((sum, conv) => sum + (conv.unread_count ?? 0), 0);
  }, [conversations, shouldLoadAuthenticatedData]);

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
      await likePostMutation.mutateAsync({ postId });
      return true;
    });
    return result;
  };

  const handleComment = async (postId: string) => {
    await requireAuth(async () => {
      setSelectedPostForComment(postId);
      setCommentModalVisible(true);
    });
  };

  const handleCloseCommentModal = () => {
    setCommentModalVisible(false);
    setSelectedPostForComment(null);
  };

  const handleShare = async (postId: string) => {
    await requireAuth(async () => {
      const post = posts.find((p) => p.id === postId);
      setSelectedPostForShare(postId);
      setSelectedPostTitle(post?.caption || "");
      setShareModalVisible(true);
    });
  };

  const handleBookmark = async (postId: string) => {
    const result = await requireAuth(async () => {
      await bookmarkPostMutation.mutateAsync({ postId });
      return true;
    });
    return result;
  };



  const handleReport = async (postId: string) => {
    await requireAuth(async () => {
      setSelectedPostForReport(postId);
      setReportModalVisible(true);
    });
  };



  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Haptic feedback on pull
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // FlatList render item
  const renderPost: ListRenderItem<Post> = useCallback(({ item: post }) => {
    return (
      <PostCard
        post={post}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onBookmark={handleBookmark}

        onReport={handleReport}
      />
    );
  }, []);

  // FlatList key extractor
  const keyExtractor = useCallback((item: Post) => item.id, []);

  // Loading footer for pagination
  const renderFooter = useCallback(() => {
    // For now, no pagination footer since we're using mock data
    // Will be useful when implementing real infinite scroll
    return null;
  }, []);

  // Empty component
  const renderEmpty = useCallback(() => {
    if (postsLoading) {
      return <PostCardSkeletonList count={3} />;
    }
    return null;
  }, [postsLoading]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <SocialHeader
          notificationCount={notificationUnreadCount}
          messageCount={unreadConversationsCount}
          activeIcon={activeIcon}
          onNotificationPress={async () => {
            await requireAuth(async () => {
              setActiveIcon("notification");
              router.push("/notifications");
            });
          }}
          onMessagePress={async () => {
            await requireAuth(async () => {
              setActiveIcon("message");
              router.push("/messages");
            });
          }}
        />

        {/* Search disabled on home screen - use explore tab for search */}

        <TabMenu
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#34B27D"
              colors={['#34B27D']}
            />
          }
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          // Future: Add infinite scroll
          // onEndReached={loadMore}
          // onEndReachedThreshold={0.5}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />

        <BottomNavigation
          onExplorePress={async () => {
            await requireAuth(async () => {
              router.push("/explore");
            });
          }}
          onCreatePress={async () => {
            await requireAuth(async () => {
              resetTripData();
              resetItinerary();
              router.push("/create");
            });
          }}
          onCommunityPress={async () => {
            await requireAuth(async () => {
              router.push("/groups");
            });
          }}
          onProfilePress={async () => {
            await requireAuth(async () => {
              router.push("/profile");
            });
          }}
        />
      </View>

      <LoginRequiredModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {selectedPostForComment && (
        <CommentModal
          postId={selectedPostForComment}
          visible={commentModalVisible}
          onClose={handleCloseCommentModal}
          commentCount={posts.find((p) => p.id === selectedPostForComment)?.comments || 0}
        />
      )}

      {selectedPostForShare && (
        <ShareModal
          visible={shareModalVisible}
          onClose={() => setShareModalVisible(false)}
          postId={selectedPostForShare}
          postTitle={selectedPostTitle}
        />
      )}

      {selectedPostForReport && (
        <ReportModal
          visible={reportModalVisible}
          onClose={() => {
            setReportModalVisible(false);
            setSelectedPostForReport(null);
          }}
          contentId={selectedPostForReport}
          contentType={ContentType.POST}
          contentTitle={posts.find(p => p.id === selectedPostForReport)?.caption}
        />
      )}
    </SafeAreaView>
  );
}
