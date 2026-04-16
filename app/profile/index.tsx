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
    
} from "react-native";

type TabType = "posts" | "saved" | "favorites";

interface PostCard {
  id: string;
  image: string;
  location: string;
  startDate: string;
  endDate: string;
  memberCount: number;
  budget: number;
}

// Mock data
const mockPosts: PostCard[] = [
  {
    id: "1",
    image:
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
    location: "Hà Giang, Việt Nam",
    startDate: "16/08/2025",
    endDate: "19/08/2025",
    memberCount: 9,
    budget: 30000000,
  },
  {
    id: "2",
    image:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
    location: "Hà Giang, Việt Nam",
    startDate: "16/08/2025",
    endDate: "19/08/2025",
    memberCount: 9,
    budget: 30000000,
  },
  {
    id: "3",
    image:
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
    location: "Nha Trang, Việt Nam",
    startDate: "01/07/2025",
    endDate: "05/07/2025",
    memberCount: 6,
    budget: 15000000,
  },
  {
    id: "4",
    image:
      "https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80",
    location: "Đà Lạt, Việt Nam",
    startDate: "20/09/2025",
    endDate: "23/09/2025",
    memberCount: 4,
    budget: 12000000,
  },
  {
    id: "5",
    image:
      "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&q=80",
    location: "Phú Quốc, Việt Nam",
    startDate: "10/06/2025",
    endDate: "14/06/2025",
    memberCount: 8,
    budget: 25000000,
  },
  {
    id: "6",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    location: "Hạ Long, Việt Nam",
    startDate: "05/10/2025",
    endDate: "07/10/2025",
    memberCount: 12,
    budget: 18000000,
  },
  {
    id: "7",
    image:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
    location: "Hội An, Việt Nam",
    startDate: "15/11/2025",
    endDate: "18/11/2025",
    memberCount: 5,
    budget: 10000000,
  },
  {
    id: "8",
    image:
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
    location: "Sapa, Việt Nam",
    startDate: "25/12/2025",
    endDate: "28/12/2025",
    memberCount: 7,
    budget: 14000000,
  },
  {
    id: "9",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    location: "Cần Thơ, Việt Nam",
    startDate: "08/03/2025",
    endDate: "10/03/2025",
    memberCount: 3,
    budget: 8000000,
  },
  {
    id: "10",
    image:
      "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80",
    location: "Huế, Việt Nam",
    startDate: "12/04/2025",
    endDate: "15/04/2025",
    memberCount: 6,
    budget: 11000000,
  },
  {
    id: "11",
    image:
      "https://images.unsplash.com/photo-1509316975859-7d31f22a89a0?w=800&q=80",
    location: "Tam Cốc, Việt Nam",
    startDate: "22/05/2025",
    endDate: "24/05/2025",
    memberCount: 4,
    budget: 9000000,
  },
  {
    id: "12",
    image:
      "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&q=80",
    location: "Đà Nẵng, Việt Nam",
    startDate: "18/08/2025",
    endDate: "22/08/2025",
    memberCount: 10,
    budget: 22000000,
  },
  {
    id: "13",
    image:
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80",
    location: "Mai Châu, Việt Nam",
    startDate: "30/09/2025",
    endDate: "02/10/2025",
    memberCount: 5,
    budget: 9500000,
  },
  {
    id: "14",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    location: "Mũi Né, Việt Nam",
    startDate: "14/07/2025",
    endDate: "17/07/2025",
    memberCount: 8,
    budget: 16000000,
  },
  {
    id: "15",
    image:
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
    location: "Mộc Châu, Việt Nam",
    startDate: "28/02/2025",
    endDate: "02/03/2025",
    memberCount: 6,
    budget: 13000000,
  },
  {
    id: "16",
    image:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
    location: "Cao Bằng, Việt Nam",
    startDate: "10/01/2025",
    endDate: "13/01/2025",
    memberCount: 4,
    budget: 10500000,
  },
];

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

  // Fetch current user nếu chưa có trong Redux
  const { data: currentUser, isLoading: isCurrentUserLoading } = useCurrentUser(
    shouldLoadAuthenticatedData && !userFromRedux
  );

  // Cập nhật Redux khi có user từ API
  useEffect(() => {
    if (currentUser && !userFromRedux) {
      dispatch(updateUser(currentUser));
    }
  }, [currentUser, userFromRedux, dispatch]);

  // Lấy user info (ưu tiên từ Redux, nếu không có thì từ API)
  const user = userFromRedux || currentUser;

  // Ẩn header mặc định của Stack cho màn profile (dùng header custom SocialHeader)
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Kiểm tra authentication mỗi khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      const checkAuthStatus = async () => {
        setIsCheckingAuth(true);
        await checkAuth();
        setIsCheckingAuth(false);
      };

      checkAuthStatus();
      // Reset activeIcon khi focus vào màn này (quay lại từ messages)
      setActiveIcon(null);
    }, [checkAuth])
  );

  const messageCount = React.useMemo(
    () => conversations.reduce((sum, conv) => sum + (conv.unread_count ?? 0), 0),
    [conversations]
  );

  // Hiển thị skeleton khi đang check auth hoặc đang load user (UI giống lúc có data)
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

  // Nếu chưa authenticated, hiển thị modal và không hiển thị nội dung
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

  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Social Header */}
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

      {/* User Info Section */}
      <View className="px-4 pt-4 pb-3 bg-white">
        <View className="flex-row items-center justify-between mb-4 px-2">
          {/* Center: User Name and Post Count */}
          <View className="">
            <Text className="text-xl font-bold text-black">
              {user?.fullName || user?.username || "Người dùng"}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              {mockPosts.length} bài viết
            </Text>
          </View>

          {/* Right: Avatar */}
          <TouchableOpacity 
            activeOpacity={0.7} 
            className="relative"
            onPress={async () => {
              await requireAuth(async () => {
                router.push("/create-post");
              });
            }}
          >
            <Image
              source={{
                uri: resolveUserAvatarUri(
                  user?.avatarUrl,
                  user?.fullName || user?.username
                ),
              }}
              style={{ width: 60, height: 60, borderRadius: 30 }}
              contentFit="cover"
            />
            <View
              className="absolute -bottom-1 -right-1 bg-primary rounded-full w-5 h-5 items-center justify-center border-2 border-white"
              style={{ borderWidth: 2, borderColor: "white" }}
            >
              <Text className="text-white text-xs font-bold">+</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Update Profile Button */}
        <TouchableOpacity
          className="bg-white border border-gray-300 rounded-lg py-2 px-4 items-center"
          activeOpacity={0.7}
          onPress={async () => {
            await requireAuth(async () => {
              router.push("/profile/edit");
            });
          }}
        >
          <Text className="text-base font-semibold text-black">
            Cập nhật thông tin
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-200 bg-white">
        <TouchableOpacity
          className="flex-1 py-3 items-center"
          onPress={() => setActiveTab("posts")}
          activeOpacity={0.7}
        >
          <Text
            className={`text-base font-semibold ${
              activeTab === "posts" ? "text-primary" : "text-gray-500"
            }`}
          >
            Bài viết
          </Text>
          {activeTab === "posts" && (
            <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 items-center"
          onPress={() => setActiveTab("saved")}
          activeOpacity={0.7}
        >
          <Text
            className={`text-base font-semibold ${
              activeTab === "saved" ? "text-primary" : "text-gray-500"
            }`}
          >
            Đã lưu
          </Text>
          {activeTab === "saved" && (
            <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 items-center"
          onPress={() => setActiveTab("favorites")}
          activeOpacity={0.7}
        >
          <Text
            className={`text-base font-semibold ${
              activeTab === "favorites" ? "text-primary" : "text-gray-500"
            }`}
          >
            Yêu thích
          </Text>
          {activeTab === "favorites" && (
            <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-3 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            placeholder="Nhập tên địa điểm..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            className="flex-1 ml-2 text-base"
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 py-4">
          {activeTab === "posts" && (
            <>
              {mockPosts.map((post) => (
                <View
                  key={post.id}
                  className="mb-4 bg-white rounded-xl overflow-hidden shadow-sm"
                >
                  {/* Image */}
                  <View className="relative">
                    <Image
                      source={{ uri: post.image }}
                      style={{ width: "100%", height: 200 }}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      className="absolute top-3 right-3"
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="heart-outline" size={20} color="#000" />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Content */}
                  <View className="p-4">
                    {/* Location with Actions */}
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center flex-1">
                        <Text className="text-base font-bold text-black mr-2">
                          {post.location}
                        </Text>
                        <VietnamFlag size={20} />
                      </View>
                      {/* Actions - Edit and Delete */}
                      <View className="flex-row items-center gap-3">
                        <TouchableOpacity activeOpacity={0.7}>
                          <Ionicons
                            name="create-outline"
                            size={20}
                            color="#666"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.7}>
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Details */}
                    <View className="flex-row items-center flex-wrap">
                      <Text className="text-sm text-gray-600">
                        {post.startDate}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color="#666"
                        style={{ marginHorizontal: 4 }}
                      />
                      <Text className="text-sm text-gray-600">
                        {post.endDate}
                      </Text>
                      <Text className="text-sm text-gray-600 mx-1">-</Text>
                      <Text className="text-sm text-primary font-semibold">
                        {post.memberCount} thành viên
                      </Text>
                      <Text className="text-sm text-gray-600 mx-1">-</Text>
                      <Text className="text-sm text-primary font-semibold">
                        {formatBudget(post.budget)} VNĐ
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          {activeTab === "saved" && (
            <View className="items-center justify-center py-20">
              <Ionicons name="bookmark-outline" size={64} color="#ccc" />
              <Text className="text-gray-500 text-base mt-4">
                Chưa có bài viết đã lưu
              </Text>
            </View>
          )}

          {activeTab === "favorites" && (
            <View className="items-center justify-center py-20">
              <Ionicons name="heart-outline" size={64} color="#ccc" />
              <Text className="text-gray-500 text-base mt-4">
                Chưa có bài viết yêu thích
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </SafeAreaView>
  );
}