import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { SocialHeader } from "@/components/social/SocialHeader";
import { useConversations } from "@/hooks/useConversations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNotifications } from "@/hooks/useNotifications";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  changePassword,
  updateCurrentUser,
  UserUpdateRequest,
} from "@/services/users";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateUser as updateUserInStore } from "@/store/slices/authSlice";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DatePicker from "react-native-date-picker";
import { SafeAreaView } from "react-native-safe-area-context";

interface BasicInfoCardProps {
  fullName: string;
  setFullName: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  dateOfBirth: string | null;
  onOpenDatePicker: () => void;
}

function BasicInfoCard({
  fullName,
  setFullName,
  bio,
  setBio,
  dateOfBirth,
  onOpenDatePicker,
}: BasicInfoCardProps) {
  return (
    <View className="bg-white rounded-2xl px-4 py-4 mb-4">
      <Text className="text-base font-semibold text-black mb-3">
        Thông tin tài khoản cơ bản
      </Text>

      <View style={{ marginBottom: 16 }}>
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Họ và tên
        </Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nhập họ và tên của bạn"
          className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-[#FAFAFA]"
        />
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Giới thiệu
        </Text>
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
        <Text className="text-xs text-gray-500 mt-1.5">
          Mô tả tối thiểu 8 ký tự (có thể để trống).
        </Text>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Ngày sinh
        </Text>
        <TouchableOpacity
          onPress={onOpenDatePicker}
          activeOpacity={0.7}
          className="border border-gray-200 rounded-xl px-4 py-3 bg-[#FAFAFA] flex-row items-center justify-between"
        >
          <Text className="text-base text-gray-800">
            {dateOfBirth
              ? new Date(dateOfBirth).toLocaleDateString("vi-VN")
              : "Chọn ngày sinh"}
          </Text>
          <Ionicons name="calendar-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
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
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <View className="bg-white rounded-2xl px-4 py-4 mb-4">
      <Text className="text-base font-semibold text-black mb-3">
        Đổi mật khẩu
      </Text>

      <View style={{ marginBottom: 12 }}>
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Mật khẩu hiện tại
        </Text>
        <View className="flex-row items-center border border-gray-200 rounded-xl bg-[#FAFAFA] pr-1">
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Nhập mật khẩu hiện tại"
            className="flex-1 px-4 py-3 text-base text-gray-900"
            secureTextEntry={!showCurrent}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={() => setShowCurrent((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={showCurrent ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            <Ionicons
              name={showCurrent ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Mật khẩu mới
        </Text>
        <View className="flex-row items-center border border-gray-200 rounded-xl bg-[#FAFAFA] pr-1">
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Tối thiểu 6 ký tự"
            className="flex-1 px-4 py-3 text-base text-gray-900"
            secureTextEntry={!showNew}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={() => setShowNew((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            <Ionicons
              name={showNew ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View>
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Xác nhận mật khẩu mới
        </Text>
        <View className="flex-row items-center border border-gray-200 rounded-xl bg-[#FAFAFA] pr-1">
          <TextInput
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            placeholder="Nhập lại mật khẩu mới"
            className="flex-1 px-4 py-3 text-base text-gray-900"
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={() => setShowConfirm((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            <Ionicons
              name={showConfirm ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>
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

  const { data: currentUser } = useCurrentUser(
    isAuthenticated && !userFromRedux,
  );
  const user = userFromRedux || currentUser;

  const { conversations } = useConversations();
  const { unreadCount: notificationUnreadCount } = useNotifications();

  const unreadConversationsCount = useMemo(
    () =>
      conversations.reduce((sum, conv) => sum + (conv.unread_count ?? 0), 0),
    [conversations],
  );

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(
    user?.dateOfBirth || null,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
    }, [isAuthenticated, requireAuth]),
  );

  const handleSave = async () => {
    if (!user) return;
    if (!hasProfileChanges) return;

    const bioTrim = bio.trim();
    if (bioTrim.length > 0 && bioTrim.length < 8) {
      showErrorToast(
        "Mô tả quá ngắn",
        "Phần giới thiệu cần tối thiểu 8 ký tự, hoặc để trống.",
      );
      return;
    }

    const roleNames =
      user.roles
        ?.map((role) => role?.name)
        .filter((name): name is string => !!name && name.trim().length > 0) ||
      [];

    const payload: UserUpdateRequest = {
      fullName: fullName.trim() || undefined,
      bio: bioTrim || undefined,
      avatarUrl: avatarUrl || undefined,
      dateOfBirth: dateOfBirth || undefined,
      roles: roleNames.length > 0 ? roleNames : ["USER"],
    };

    try {
      setIsSavingProfile(true);
      await requireAuth(async () => {
        const res = await updateCurrentUser(payload);
        if (res.code === 1000 || res.code === 0) {
          if (res.data) {
            dispatch(updateUserInStore(res.data));
          } else {
            dispatch(
              updateUserInStore({
                fullName: payload.fullName,
                bio: payload.bio,
                avatarUrl: payload.avatarUrl,
                dateOfBirth: payload.dateOfBirth,
              }),
            );
          }
          showSuccessToast("Đã cập nhật thông tin");
          router.back();
        } else {
          showErrorToast(
            "Không lưu được",
            res.message || "Không thể cập nhật thông tin",
          );
        }
      });
    } catch (e: any) {
      const msg = e?.message || "Không thể cập nhật thông tin";
      showErrorToast(
        "Không lưu được",
        /method not allowed/i.test(String(msg))
          ? "Máy chủ không chấp nhận thao tác cập nhật (405). Kiểm tra lại API hoặc liên hệ hỗ trợ."
          : msg,
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmNewPassword.trim()
    ) {
      showErrorToast(
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ thông tin đổi mật khẩu.",
      );
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showErrorToast(
        "Không khớp",
        "Mật khẩu mới và xác nhận mật khẩu chưa khớp.",
      );
      return;
    }
    if (newPassword.trim().length < 6) {
      showErrorToast("Mật khẩu yếu", "Mật khẩu mới cần tối thiểu 6 ký tự.");
      return;
    }

    try {
      setIsChangingPassword(true);
      await requireAuth(async () => {
        const res = await changePassword({
          oldPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
          confirmPassword: confirmNewPassword.trim(),
        });
        if (res.code === 1000) {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
          showSuccessToast("Đã đổi mật khẩu");
        } else {
          showErrorToast(
            "Đổi mật khẩu thất bại",
            res.message || "Không thể đổi mật khẩu.",
          );
        }
      });
    } catch (e: any) {
      const code = e?.response?.data?.code as number | undefined;
      const apiMsg = e?.response?.data?.message as string | undefined;
      if (code === 2001) {
        showErrorToast(
          "Không đổi được mật khẩu",
          "Mật khẩu hiện tại không đúng hoặc phiên đăng nhập không hợp lệ.",
        );
      } else if (code === 1002) {
        showErrorToast(
          "Dữ liệu không hợp lệ",
          apiMsg ||
            "Kiểm tra độ dài mật khẩu và mật khẩu xác nhận phải khớp mật khẩu mới.",
        );
      } else {
        showErrorToast(
          "Đổi mật khẩu thất bại",
          apiMsg || e?.message || "Vui lòng thử lại sau.",
        );
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePickAvatar = async () => {
    await requireAuth(async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showErrorToast(
          "Cần quyền truy cập",
          "Cần quyền truy cập thư viện ảnh để đổi avatar.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
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
    <SafeAreaView
      className="flex-1 bg-[#F7F8FA]"
      edges={["top", "left", "right", "bottom"]}
    >
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
              style={{ padding: 4, marginTop: -36 }}
            >
              <Text style={{ fontSize: 14, lineHeight: 22 }}>Hủy</Text>
            </TouchableOpacity>
          }
          centerElement={
            <Text
              className="text-lg font-semibold text-black"
              style={{ marginTop: -36, lineHeight: 22 }}
            >
              Cập nhật thông tin
            </Text>
          }
          rightElement={
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={
                isSavingProfile || isChangingPassword || !hasProfileChanges
              }
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                marginTop: -36,
                opacity:
                  isSavingProfile || isChangingPassword || !hasProfileChanges
                    ? 0.5
                    : 1,
              }}
            ></TouchableOpacity>
          }
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          <View className="bg-white rounded-2xl px-4 py-5 mb-4">
            <View style={{ alignItems: "center", marginBottom: 8 }}>
              <TouchableOpacity activeOpacity={0.85} onPress={handlePickAvatar}>
                <View>
                  <Image
                    source={{
                      uri: resolveUserAvatarUri(
                        avatarUrl,
                        user?.fullName || user?.username,
                      ),
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
              <Text className="text-sm text-gray-500 mt-3">
                Nhấn vào avatar để thay đổi
              </Text>
            </View>
          </View>

          <BasicInfoCard
            fullName={fullName}
            setFullName={setFullName}
            bio={bio}
            setBio={setBio}
            dateOfBirth={dateOfBirth}
            onOpenDatePicker={openDatePicker}
          />
          <TouchableOpacity
            className={`rounded-xl py-3 items-center mb-4 ${isSavingProfile || isChangingPassword || !hasProfileChanges ? "bg-gray-300" : "bg-primary"}`}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={
              isSavingProfile || isChangingPassword || !hasProfileChanges
            }
          >
            <Text className="text-white text-base font-semibold">
              {isSavingProfile
                ? "Đang lưu thay đổi..."
                : "Lưu thông tin cơ bản"}
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
            className={`rounded-xl py-3 items-center ${isChangingPassword || isSavingProfile ? "bg-gray-300" : "bg-black"}`}
            activeOpacity={0.8}
            onPress={handleChangePassword}
            disabled={isChangingPassword || isSavingProfile}
          >
            <Text className="text-white text-base font-semibold">
              {isChangingPassword ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
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
