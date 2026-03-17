import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { SocialHeader } from "@/components/social/SocialHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNotifications } from "@/hooks/useNotifications";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useConversations } from "@/hooks/useConversations";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateUser as updateUserInStore } from "@/store/slices/authSlice";
import { updateUserById, UserUpdateRequest } from "@/services/users";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

export default function EditProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { requireAuth, showLoginModal, setShowLoginModal } = useRequireAuth();

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const userFromRedux = useAppSelector((state) => state.auth.user);

  const { data: currentUser } = useCurrentUser(isAuthenticated && !userFromRedux);
  const user = userFromRedux || currentUser;

  const { conversations } = useConversations();
  const { unreadCount: notificationUnreadCount } = useNotifications();

  const unreadConversationsCount = useMemo(
    () => conversations.reduce((sum, conv) => sum + (conv.unread_count ?? 0), 0),
    [conversations]
  );

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(user?.dateOfBirth || null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Ẩn header mặc định
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Sync local state khi user load xong
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatarUrl || "");
      setDateOfBirth(user.dateOfBirth || null);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        requireAuth(() => Promise.resolve());
      }
    }, [isAuthenticated, requireAuth])
  );

  const handleSave = async () => {
    if (!user) return;
    const payload: UserUpdateRequest = {
      fullName: fullName.trim() || undefined,
      bio: bio.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
      dateOfBirth: dateOfBirth || undefined,
    };

    try {
      setIsSaving(true);
      await requireAuth(async () => {
        const res = await updateUserById(user.id, payload);
        if (res.code === 1000 || res.code === 0) {
          if (res.data) {
            dispatch(updateUserInStore(res.data));
          } else {
            dispatch(updateUserInStore(payload));
          }
          router.back();
        } else {
          Alert.alert("Lỗi", res.message || "Không thể cập nhật thông tin");
        }
      });
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message || "Không thể cập nhật thông tin");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    await requireAuth(async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Quyền bị từ chối", "Cần quyền truy cập thư viện ảnh để đổi avatar.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        // TODO: upload lên server lấy URL thật; tạm thời set trực tiếp local uri
        setAvatarUrl(result.assets[0].uri);
      }
    });
  };

  const handleDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const iso = selectedDate.toISOString().slice(0, 10); // YYYY-MM-DD
      setDateOfBirth(iso);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <SocialHeader
          notificationCount={notificationUnreadCount}
          messageCount={unreadConversationsCount}
          activeIcon={null}
          leftElement={
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{ padding: 4 }}
            >
              <Text style={{ fontSize: 16 }}>Hủy</Text>
            </TouchableOpacity>
          }
          centerElement={<Text className="text-lg font-semibold text-black">Chỉnh sửa thông tin</Text>}
          rightElement={
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={isSaving}
              style={{ paddingHorizontal: 8, paddingVertical: 4, opacity: isSaving ? 0.6 : 1 }}
            >
              <Text className="text-primary font-semibold">{isSaving ? "Đang lưu..." : "Lưu"}</Text>
            </TouchableOpacity>
          }
        />

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {/* Avatar */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <TouchableOpacity activeOpacity={0.8} onPress={handlePickAvatar}>
              <View>
                <Image
                  source={{
                    uri:
                      avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user?.fullName || user?.username || "User"
                      )}&background=34B27D&color=fff`,
                  }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                  contentFit="cover"
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    backgroundColor: "#34B27D",
                    borderRadius: 12,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderWidth: 2,
                    borderColor: "#FFFFFF",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 10, fontWeight: "600" }}>
                    Đổi
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Họ và tên</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ tên"
              className="border border-gray-300 rounded-lg px-3 py-2 text-base"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Giới thiệu</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Mô tả ngắn về bạn..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-base"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Ngày sinh */}
          <View style={{ marginBottom: 16 }}>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Ngày sinh</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <Text className="text-base text-gray-800">
                {dateOfBirth
                  ? new Date(dateOfBirth).toLocaleDateString("vi-VN")
                  : "Chọn ngày sinh"}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              value={dateOfBirth ? new Date(dateOfBirth) : new Date(2000, 0, 1)}
              onChange={handleDateChange}
            />
          )}
        </ScrollView>
      </View>

      <LoginRequiredModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </SafeAreaView>
  );
}


