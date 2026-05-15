import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { BottomNavigation } from "@/components/social/BottomNavigation";
import { SocialHeader } from "@/components/social/SocialHeader";
import { VietnamFlag } from "@/components/ui/VietnamFlag";
import { useConversations } from "@/hooks/useConversations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useNotifications } from "@/hooks/useNotifications";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateUser } from "@/store/slices/authSlice";
import { PostCard } from "@/components/social/PostCard";
import { CommentModal } from "@/components/social/CommentModal";
import { ShareModal } from "@/components/social/ShareModal";
import { ReportModal } from "@/components/social/ReportModal";
import { ContentType } from "@/types/report";
import { 
  useBookmarkPost, 
  useLikePost, 
  usePosts, 
  useSavedPosts,
  useCommentPost,
  useSharePost,
  useNativeShare
} from "@/hooks/useSocial";
import { useFavoriteItineraries } from "@/hooks/useItineraries";
import { ItineraryCard } from "@/components/group/ItineraryCard";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { formatCurrencyVND } from "@/utils/format";

type TabType = "posts" | "saved" | "favorites";

export default function ProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [searchText, setSearchText] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeIcon, setActiveIcon] = useState<
    "notification" | "message" | null
  >(null);
  const { isGuest } = useGuestMode();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const shouldLoadAuthenticatedData = !isGuest && (isAuthenticated || !!accessToken);
  
  const { conversations } = useConversations({
    enabled: shouldLoadAuthenticatedData,
  });
  const { unreadCount } = useNotifications({
    enabled: shouldLoadAuthenticatedData,
  });
  const notificationUnreadCount = shouldLoadAuthenticatedData ? unreadCount : 0;
  const userFromRedux = useAppSelector((state) => state.auth.user);
  const { checkAuth, showLoginModal, setShowLoginModal, requireAuth } =
    useRequireAuth();

  const { data: currentUser, isLoading: isCurrentUserLoading } = useCurrentUser(
    shouldLoadAuthenticatedData && !userFromRedux
  );

  useEffect(() => {
    if (currentUser && !userFromRedux) {
      dispatch(updateUser(currentUser));
    }
  }, [currentUser, userFromRedux, dispatch]);

  const user = userFromRedux || currentUser;

  const { data: userPosts = [], isLoading: isPostsLoading, refetch: refetchPosts } = usePosts({
    creator_id: user?.id,
  });

  const { data: savedPostsData, isLoading: isSavedLoading } = useSavedPosts();
  const savedPosts = savedPostsData?.pages.flatMap((page) => page.content) || [];

  const { data: favoriteItineraries = [], isLoading: isFavoritesLoading } = useFavoriteItineraries(
    shouldLoadAuthenticatedData ? "all" : undefined
  );

  const likePostMutation = useLikePost();
  const bookmarkPostMutation = useBookmarkPost();
  const commentPostMutation = useCommentPost();
  const sharePostMutation = useSharePost();
  const { shareNative } = useNativeShare();

  // Modal states
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostForComment, setSelectedPostForComment] = useState<string | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedPostForShare, setSelectedPostForShare] = useState<string | null>(null);
  const [selectedPostTitle, setSelectedPostTitle] = useState<string>("");

  // Report state
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedPostForReport, setSelectedPostForReport] = useState<string | null>(null);

  const handleLike = async (postId: string) => {
    const post = userPosts.find((p) => p.id === postId) || savedPosts.find((p) => p.id === postId);
    if (!post) return;
    await likePostMutation.mutateAsync({ postId, isCurrentlyLiked: post.isLiked });
  };

  const handleComment = (postId: string) => {
    setSelectedPostForComment(postId);
    setCommentModalVisible(true);
  };

  const handleShare = (postId: string) => {
    const post = userPosts.find((p) => p.id === postId) || savedPosts.find((p) => p.id === postId);
    setSelectedPostForShare(postId);
    setSelectedPostTitle(post?.caption || "");
    setShareModalVisible(true);
  };

  const handleBookmark = async (postId: string) => {
    const post = userPosts.find((p) => p.id === postId) || savedPosts.find((p) => p.id === postId);
    if (!post) return;
    await bookmarkPostMutation.mutateAsync({ postId, isCurrentlyBookmarked: post.isBookmarked });
  };

  const handleReport = (postId: string) => {
    requireAuth(() => {
      setSelectedPostForReport(postId);
      setReportModalVisible(true);
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const checkAuthStatus = async () => {
        setIsCheckingAuth(true);
        await checkAuth();
        setIsCheckingAuth(false);
      };

      checkAuthStatus();
      setActiveIcon(null);
      refetchPosts();
    }, [checkAuth, refetchPosts])
  );

  const messageCount = React.useMemo(
    () => conversations.reduce((sum, conv) => sum + (conv.unread_count ?? 0), 0),
    [conversations]
  );



  const displayedUserPosts = React.useMemo(() => {
    if (!user?.id) return [];
    const myPosts = userPosts.filter(post => post.creator_id === user.id);
    if (!searchText.trim()) return myPosts;
    const lower = searchText.toLowerCase();
    return myPosts.filter(post => post.caption?.toLowerCase().includes(lower));
  }, [userPosts, user?.id, searchText]);

  const displayedSavedPosts = React.useMemo(() => {
    if (!searchText.trim()) return savedPosts;
    const lower = searchText.toLowerCase();
    return savedPosts.filter(post => post.caption?.toLowerCase().includes(lower));
  }, [savedPosts, searchText]);

  const displayedFavoriteItineraries = React.useMemo(() => {
    if (!searchText.trim()) return favoriteItineraries;
    const lower = searchText.toLowerCase();
    return favoriteItineraries.filter(it => 
      it.title?.toLowerCase().includes(lower)
    );
  }, [favoriteItineraries, searchText]);

  const showSkeleton = isCheckingAuth || (isAuthenticated && !user && isCurrentUserLoading);
  
  if (showSkeleton) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <SocialHeader
          notificationCount={notificationUnreadCount}
          messageCount={messageCount}
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
        <ProfileSkeleton />
        <BottomNavigation />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated && !accessToken) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <SocialHeader
          notificationCount={notificationUnreadCount}
          messageCount={messageCount}
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
        <LoginRequiredModal
          visible={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA]">
      <SocialHeader
        notificationCount={notificationUnreadCount}
        messageCount={messageCount}
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

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* User Info Header */}
        <View className="bg-white px-5 pt-6 pb-6 shadow-sm border-b border-gray-100">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => router.push("/profile/edit")}
              className="mr-5"
            >
              <Image
                source={{
                  uri: resolveUserAvatarUri(
                    user?.avatarUrl,
                    user?.fullName || user?.username
                  ),
                }}
                style={{ width: 84, height: 84, borderRadius: 42 }}
                contentFit="cover"
              />
              <View className="absolute bottom-0 right-0 bg-[#34B27D] rounded-full w-7 h-7 items-center justify-center border-2 border-white shadow-sm">
                <Ionicons name="camera" size={14} color="white" />
              </View>
            </TouchableOpacity>

            <View className="flex-1">
              <Text className="text-2xl font-bold text-[#1A1A1A]">
                {user?.fullName || user?.username || "Người dùng"}
              </Text>
              <Text className="text-gray-500 mt-1 text-base">
                @{user?.username || "username"}
              </Text>
              <View className="flex-row mt-3 items-center">
                <View>
                  <Text className="text-lg font-bold text-[#1A1A1A]">{userPosts.filter(post => post.creator_id === user?.id).length}</Text>
                  <Text className="text-gray-400 text-xs uppercase tracking-tighter">Bài viết</Text>
                </View>

              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-[#34B27D] rounded-2xl py-3.5 items-center shadow-sm"
              activeOpacity={0.8}
              onPress={() => router.push("/profile/edit")}
            >
              <Text className="text-white font-bold text-base">Sửa trang cá nhân</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-14 bg-gray-100 rounded-2xl items-center justify-center"
              activeOpacity={0.8}
              onPress={() => router.push("/create-post")}
            >
              <Ionicons name="add-circle-outline" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Selection */}
        <View className="flex-row bg-white mt-1 border-b border-gray-100">
          {(["posts", "saved", "favorites"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="flex-1 py-4 items-center relative"
            >
              <Text className={`font-bold text-[15px] ${activeTab === tab ? "text-[#34B27D]" : "text-gray-400"}`}>
                {tab === "posts" ? "Bài viết" : tab === "saved" ? "Đã lưu" : "Yêu thích"}
              </Text>
              {activeTab === tab && (
                <View className="absolute bottom-0 w-12 h-1 bg-[#34B27D] rounded-t-full" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Bar */}
        <View className="px-4 mt-4">
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              placeholder={
                activeTab === "posts" ? "Tìm trong bài viết của bạn..." :
                activeTab === "saved" ? "Tìm trong bài viết đã lưu..." :
                "Tìm trong lịch trình yêu thích..."
              }
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
              className="flex-1 ml-3 text-[15px] text-[#1A1A1A]"
            />
          </View>
        </View>

        {/* Posts Content */}
        <View className="px-4 pt-4 pb-24">
          {activeTab === "posts" && (
            <>
              {isPostsLoading ? (
                <View className="py-20 items-center">
                  <ActivityIndicator size="large" color="#34B27D" />
                </View>
              ) : displayedUserPosts.length === 0 ? (
                <View className="items-center justify-center py-20 bg-white rounded-3xl mt-4 border border-dashed border-gray-200">
                  <Ionicons name="images-outline" size={64} color="#E5E7EB" />
                  <Text className="text-gray-400 text-base font-medium mt-4">Không tìm thấy bài viết nào</Text>
                </View>
              ) : (
                displayedUserPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    onBookmark={handleBookmark}

                    onReport={handleReport}
                  />
                ))
              )}
            </>
          )}

          {activeTab === "saved" && (
            <View className="mt-2">
              {isSavedLoading ? (
                <View className="py-20 items-center">
                  <ActivityIndicator size="large" color="#34B27D" />
                </View>
              ) : displayedSavedPosts.length === 0 ? (
                <View className="items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <Ionicons name="bookmark-outline" size={64} color="#E5E7EB" />
                  <Text className="text-gray-400 text-base font-medium mt-4">Không tìm thấy bài viết nào</Text>
                </View>
              ) : (
                displayedSavedPosts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    activeOpacity={0.9}
                    onPress={() => router.push(`/post/${post.id}` as any)}
                    className="flex-row bg-white p-4 rounded-3xl mb-4 border border-gray-50 shadow-sm items-center"
                  >
                    <Image
                      source={{ uri: post.image || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80" }}
                      style={{ width: 72, height: 72, borderRadius: 18 }}
                      contentFit="cover"
                    />
                    <View className="flex-1 ml-4">
                      <Text className="text-base font-bold text-[#1A1A1A]" numberOfLines={1}>
                        {post.caption || "Bài viết đã lưu"}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-1">
                        @{post.user.name} • {post.timeAgo}
                      </Text>
                    </View>
                    <View className="bg-gray-50 w-8 h-8 rounded-full items-center justify-center">
                      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {activeTab === "favorites" && (
            <View className="mt-2">
              {isFavoritesLoading ? (
                <View className="py-20 items-center">
                  <ActivityIndicator size="large" color="#34B27D" />
                </View>
              ) : displayedFavoriteItineraries.length === 0 ? (
                <View className="items-center justify-center py-20 bg-white rounded-3xl mt-4 border border-dashed border-gray-200">
                  <Ionicons name="heart-outline" size={64} color="#E5E7EB" />
                  <Text className="text-gray-400 text-base font-medium mt-4">Không tìm thấy lịch trình nào</Text>
                </View>
              ) : (
                displayedFavoriteItineraries.map((itinerary) => (
                  <View key={itinerary.id} className="mb-4">
                    <ItineraryCard itinerary={itinerary} />
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNavigation />

      <LoginRequiredModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {selectedPostForComment && (
        <CommentModal
          postId={selectedPostForComment}
          visible={commentModalVisible}
          onClose={() => setCommentModalVisible(false)}
          commentCount={
            (userPosts.find((p) => p.id === selectedPostForComment) || 
             savedPosts.find((p) => p.id === selectedPostForComment))?.comments || 0
          }
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
          contentTitle={(userPosts.find(p => p.id === selectedPostForReport) || savedPosts.find(p => p.id === selectedPostForReport))?.caption}
        />
      )}
    </SafeAreaView>
  );
}