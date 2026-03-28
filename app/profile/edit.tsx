import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { SocialHeader } from "@/components/social/SocialHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNotifications } from "@/hooks/useNotifications";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useConversations } from "@/hooks/useConversations";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateUser as updateUserInStore } from "@/store/slices/authSlice";
import { updateUserById, UserUpdateRequest } from "@/services/users";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import DatePicker from "react-native-date-picker";

interface BasicInfoCardProps {
  fullName: string;
  setFullName: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  dateOfBirth: string | null;
  onOpenDatePicker: () => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
}

function BasicInfoCard({
  fullName,
  setFullName,
  bio,
  setBio,
  dateOfBirth,
  onOpenDatePicker,
  confirmPassword,
  setConfirmPassword,
}: BasicInfoCardProps) {
  return (
    <View className="bg-white rounded-2xl px-4 py-4 mb-4">
      <Text className="text-base font-semibold text-black mb-3">Thông tin tài khoản cơ bản</Text>

      <View style={{ marginBottom: 16 }}>
        <Text className="text-sm font-semibold text-gray-700 mb-2">Họ và tên</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nhập họ và tên của bạn"
          className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-[#FAFAFA]"
        />
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text className="text-sm font-semibold text-gray-700 mb-2">Giới thiệu</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Viết vài dòng giới thiệu về bạn..."
          className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-[#FAFAFA]"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ minHeight: 100 }}
        />
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text className="text-sm font-semibold text-gray-700 mb-2">Ngày sinh</Text>
        <TouchableOpacity
          onPress={onOpenDatePicker}
          activeOpacity={0.7}
          className="border border-gray-200 rounded-xl px-4 py-3 bg-[#FAFAFA] flex-row items-center justify-between"
        >
          <Text className="text-base text-gray-800">
            {dateOfBirth ? new Date(dateOfBirth).toLocaleDateString("vi-VN") : "Chọn ngày sinh"}
          </Text>
          <Ionicons name="calendar-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View>
        <Text className="text-sm font-semibold text-gray-700 mb-2">Mật khẩu xác nhận</Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Nhập mật khẩu để lưu thông tin cơ bản"
          className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-[#FAFAFA]"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

interface ChangePasswordCardProps {
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmNewPassword: string;
  setConfirmNewPassword: (value: string) => void;
}

function ChangePasswordCard({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword,
}: ChangePasswordCardProps) {
  return (
    <View className="bg-white rounded-2xl px-4 py-4 mb-4">
      <Text className="text-base font-semibold text-black mb-3">Đổi mật khẩu</Text>

      <View style={{ marginBottom: 12 }}>
        <Text className="text-sm font-semibold text-gray-700 mb-2">Mật khẩu hiện tại</Text>
        <TextInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Nhập mật khẩu hiện tại"
          className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-[#FAFAFA]"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text className="text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Nhập mật khẩu mới"
          className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-[#FAFAFA]"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View>
        <Text className="text-sm font-semibold text-gray-700 mb-2">Nhập lại mật khẩu mới</Text>
        <TextInput
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          placeholder="Nhập lại mật khẩu mới"
          className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-[#FAFAFA]"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

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
  const [pickerDate, setPickerDate] = useState<Date>(new Date());
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const hasProfileChanges =
    (fullName || "") !== (user?.fullName || "") ||
    (bio || "") !== (user?.bio || "") ||
    (avatarUrl || "") !== (user?.avatarUrl || "") ||
    (dateOfBirth || "") !== (user?.dateOfBirth || "");

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
    if (!confirmPassword.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập mật khẩu để xác nhận cập nhật.");
      return;
    }

    const roleNames =
      user.roles
        ?.map((role) => role?.name)
        .filter((name): name is string => !!name && name.trim().length > 0) || [];

    const payload: UserUpdateRequest = {
      password: confirmPassword.trim(),
      fullName: fullName.trim() || undefined,
      bio: bio.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
      dateOfBirth: dateOfBirth || undefined,
      roles: roleNames.length > 0 ? roleNames : ["USER"],
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
          setConfirmPassword("");
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

  const handleChangePassword = async () => {
    if (!user) return;
    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ thông tin đổi mật khẩu.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Không khớp", "Mật khẩu mới và xác nhận mật khẩu chưa khớp.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Mật khẩu yếu", "Mật khẩu mới cần tối thiểu 8 ký tự.");
      return;
    }

    const roleNames =
      user.roles
        ?.map((role) => role?.name)
        .filter((name): name is string => !!name && name.trim().length > 0) || [];

    try {
      setIsSaving(true);
      await requireAuth(async () => {
        const res = await updateUserById(user.id, {
          password: newPassword.trim(),
          roles: roleNames.length > 0 ? roleNames : ["USER"],
        });
        if (res.code === 1000 || res.code === 0) {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
          Alert.alert("Thành công", "Đã cập nhật mật khẩu.");
        } else {
          Alert.alert("Lỗi", res.message || "Không thể cập nhật mật khẩu");
        }
      });
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message || "Không thể cập nhật mật khẩu");
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

  const openDatePicker = () => {
    setPickerDate(dateOfBirth ? new Date(dateOfBirth) : new Date());
    setShowDatePicker(true);
  };

  const handleConfirmDate = (selectedDate: Date) => {
    const iso = selectedDate.toISOString().slice(0, 10); // YYYY-MM-DD
    setDateOfBirth(iso);
    setShowDatePicker(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FA]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
          centerElement={<Text className="text-lg font-semibold text-black">Cập nhật thông tin</Text>}
          rightElement={
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={isSaving || !hasProfileChanges}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                opacity: isSaving || !hasProfileChanges ? 0.5 : 1,
              }}
            >
              <Text className="text-primary font-semibold">{isSaving ? "Đang lưu..." : "Lưu"}</Text>
            </TouchableOpacity>
          }
        />

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
          <View className="bg-white rounded-2xl px-4 py-5 mb-4">
            <View style={{ alignItems: "center", marginBottom: 8 }}>
              <TouchableOpacity activeOpacity={0.85} onPress={handlePickAvatar}>
                <View>
                  <Image
                    source={{
                      uri:
                        avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user?.fullName || user?.username || "User"
                        )}&background=34B27D&color=fff`,
                    }}
                    style={{ width: 96, height: 96, borderRadius: 48 }}
                    contentFit="cover"
                  />
                  <View
                    style={{
                      position: "absolute",
                      right: -2,
                      bottom: -2,
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: "#34B27D",
                      borderWidth: 2,
                      borderColor: "#fff",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="camera-outline" size={16} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
              <Text className="text-sm text-gray-500 mt-3">Nhấn vào avatar để thay đổi</Text>
            </View>
          </View>

          <BasicInfoCard
            fullName={fullName}
            setFullName={setFullName}
            bio={bio}
            setBio={setBio}
            dateOfBirth={dateOfBirth}
            onOpenDatePicker={openDatePicker}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
          />
          <TouchableOpacity
            className={`rounded-xl py-3 items-center mb-4 ${isSaving || !hasProfileChanges ? "bg-gray-300" : "bg-primary"}`}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={isSaving || !hasProfileChanges}
          >
            <Text className="text-white text-base font-semibold">
              {isSaving ? "Đang lưu thay đổi..." : "Lưu thông tin cơ bản"}
            </Text>
          </TouchableOpacity>

          <ChangePasswordCard
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmNewPassword={confirmNewPassword}
            setConfirmNewPassword={setConfirmNewPassword}
          />
          <TouchableOpacity
            className={`rounded-xl py-3 items-center ${isSaving ? "bg-gray-300" : "bg-black"}`}
            activeOpacity={0.8}
            onPress={handleChangePassword}
            disabled={isSaving}
          >
            <Text className="text-white text-base font-semibold">
              {isSaving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </Text>
          </TouchableOpacity>

          <DatePicker
            modal
            open={showDatePicker}
            date={pickerDate}
            mode="date"
            locale="vi"
            maximumDate={new Date()}
            title="Chọn ngày sinh"
            confirmText="Chọn"
            cancelText="Hủy"
            onConfirm={handleConfirmDate}
            onCancel={() => setShowDatePicker(false)}
            onDateChange={setPickerDate}
          />
        </ScrollView>

      </KeyboardAvoidingView>

      <LoginRequiredModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </SafeAreaView>
  );
}


