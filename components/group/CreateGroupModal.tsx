import { ContactItem } from "@/components/group/ContactItem";
import { useCreateGroup } from "@/hooks/useGroups";
import { useUserSearchDebounce } from "@/hooks/useUserSearchDebounce";
import { UserSimpleResponse } from "@/types/search";
import { useAppSelector } from "@/store/hooks";
import { uploadImage } from "@/services/media";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
}

interface CreateGroupFormValues {
  groupName: string;
  groupDescription: string;
  searchText: string;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const windowHeight = Dimensions.get("window").height;
  // Trượt full màn hình (chạm đỉnh), header sẽ tự chừa safe area bằng paddingTop
  const expandedY = 0;
  const collapsedY = expandedY;

  const [selectedMembers, setSelectedMembers] = useState<UserSimpleResponse[]>(
    []
  );
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const slideAnim = useRef(new Animated.Value(windowHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sheetPositionRef = useRef(expandedY);
  const { control, handleSubmit, watch, reset } = useForm<CreateGroupFormValues>({
    defaultValues: {
      groupName: "",
      groupDescription: "",
      searchText: "",
    },
  });
  const groupName = watch("groupName");
  const groupDescription = watch("groupDescription");
  const searchText = watch("searchText");

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const searchEnabled = visible && isAuthenticated && !!accessToken;

  const { results: searchResults, isLoading: isSearchingUsers } =
    useUserSearchDebounce(searchText || "", { enabled: searchEnabled });

  const createGroupMutation = useCreateGroup();

  const currentUser = useAppSelector((state) => state.auth.user);

  const displayUsers = useMemo(() => {
    const list = Array.isArray(searchResults) ? searchResults : [];
    return list.filter((u) => u.id !== currentUser?.id);
  }, [searchResults, currentUser?.id]);

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      reset({
        groupName: "",
        groupDescription: "",
        searchText: "",
      });
      setSelectedMembers([]);
      setIsDescriptionFocused(false);
      setSelectedImage(null);

      // Slide up animation - mượt như lúc đóng (cùng duration và easing)
      slideAnim.setValue(windowHeight);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: expandedY,
          duration: 300, // Cùng duration như lúc đóng
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic), // Easing mượt cho slide up
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250, // Cùng duration như lúc đóng
          useNativeDriver: true,
          easing: Easing.out(Easing.ease), // Easing mượt cho fade in
        }),
      ]).start(() => {
        sheetPositionRef.current = expandedY;
      });
    } else {
      // Reset animations when modal closes
      slideAnim.setValue(windowHeight);
      fadeAnim.setValue(0);
      sheetPositionRef.current = expandedY;
    }
  }, [visible, expandedY, windowHeight, fadeAnim, slideAnim, reset]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: windowHeight,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic), // Easing mượt hơn khi đóng
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start(() => {
      onClose();
    });
  };

  const toggleContact = (contactId: string) => {
    setSelectedMembers((prev) => {
      const exists = prev.some((u) => u.id === contactId);
      if (exists) {
        return prev.filter((u) => u.id !== contactId);
      }
      const fromList = displayUsers.find((u) => u.id === contactId);
      if (fromList) {
        return [...prev, fromList];
      }
      return prev;
    });
  };

  const removeContact = (contactId: string) => {
    setSelectedMembers((prev) => prev.filter((u) => u.id !== contactId));
  };

  // Bỏ pan gesture, chỉ auto slide lên full height

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showErrorToast(
        "Cần quyền truy cập",
        "Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh đại diện nhóm."
      );
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleCreate = async (values: CreateGroupFormValues) => {
    const trimmedName = values.groupName.trim();
    if (!trimmedName || selectedMembers.length === 0) {
      return;
    }

    try {
      let avatarUrl: string | undefined = undefined;

      // Upload ảnh trước nếu có
      if (selectedImage) {
        setIsUploadingImage(true);
        try {
          const uploadResult = await uploadImage({
            fileUri: selectedImage,
            fileName: "group-avatar.jpg",
            fileType: "image/jpeg",
            folder: "tripjoy/avatars/groups",
          });
          avatarUrl = uploadResult.secure_url;
        } catch (uploadError: unknown) {
          showErrorToast("Không tải được ảnh nhóm", uploadError);
          avatarUrl = undefined;
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Tạo nhóm với avatar URL đã upload
      await createGroupMutation.mutateAsync({
        name: trimmedName,
        avatar: avatarUrl,
        description: values.groupDescription.trim() || undefined,
        theme_color: "#34B27D", // Màu mặc định, có thể thêm picker sau
        member_ids: selectedMembers.map((m) => m.id),
      });

      // Close modal sau khi tạo thành công
      showSuccessToast("Tạo nhóm thành công!");
      handleClose();
    } catch {
      // Lỗi đã xử lý trong useCreateGroup (toast)
    }
  };

  // Không render modal nếu không visible để tránh backdrop mờ
  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop - Large View with dimmed background */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: Dimensions.get("window").width,
              height: Dimensions.get("window").height,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              opacity: fadeAnim,
            }}
          />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: windowHeight,
            backgroundColor: "white",
            borderTopLeftRadius: slideAnim.interpolate({
              inputRange: [expandedY, collapsedY],
              outputRange: [0, 20],
              extrapolate: "clamp",
            }),
            borderTopRightRadius: slideAnim.interpolate({
              inputRange: [expandedY, collapsedY],
              outputRange: [0, 20],
              extrapolate: "clamp",
            }),
            transform: [{ translateY: slideAnim }],
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <View
            className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200"
            style={{ paddingTop: insets.top + 8 }}
          >
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-black">Nhóm mới</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
          >
            {/* Group Info Section */}
            <View className="px-4 py-6">
              {/* Avatar and Name Input */}
              <View className="flex-row items-center gap-4 mb-6">
                {/* Avatar Placeholder */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={pickImage}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    overflow: "hidden",
                  }}
                >
                  {selectedImage ? (
                    <ExpoImage
                      source={{ uri: selectedImage }}
                      style={{ width: 70, height: 70, borderRadius: 35 }}
                      contentFit="cover"
                    />
                  ) : (
                    <Ionicons name="camera-outline" size={28} color="#9CA3AF" />
                  )}
                </TouchableOpacity>

                {/* Name Input */}
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="groupName"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        className="text-lg font-medium text-black pb-2 border-b border-gray-300"
                        placeholder="Đặt tên nhóm..."
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={onChange}
                        underlineColorAndroid="transparent"
                      />
                    )}
                  />
                </View>
              </View>

              {/* Description Input */}
              <View className="mb-6">
                <Controller
                  control={control}
                  name="groupDescription"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className={`text-base text-gray-800 pb-2 ${
                        !isDescriptionFocused
                          ? "border-b border-gray-300"
                          : "border-0"
                      }`}
                      placeholder="Mô tả nhóm (tùy chọn)..."
                      placeholderTextColor="#9CA3AF"
                      value={value}
                      onChangeText={onChange}
                      onFocus={() => setIsDescriptionFocused(true)}
                      onBlur={() => setIsDescriptionFocused(false)}
                      multiline
                      underlineColorAndroid="transparent"
                    />
                  )}
                />
              </View>

              {/* Search Bar */}
              <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-3 mb-4">
                <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                <Controller
                  control={control}
                  name="searchText"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="flex-1 ml-2 text-base text-gray-800"
                      placeholder="Tìm tên hoặc username"
                      placeholderTextColor="#9CA3AF"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>

              {/* Users List — GET /users/search?q= (debounce 300ms) */}
              <View>
                {!searchText?.trim() ? (
                  <View className="py-8 items-center px-2">
                    <Text className="text-gray-500 text-center">
                      Nhập tên hoặc username để tìm và thêm thành viên
                    </Text>
                  </View>
                ) : isSearchingUsers ? (
                  <View className="py-8 items-center">
                    <Text className="text-gray-500">Đang tìm...</Text>
                  </View>
                ) : displayUsers.length === 0 ? (
                  <View className="py-8 items-center">
                    <Text className="text-gray-500">
                      Không tìm thấy người dùng
                    </Text>
                  </View>
                ) : (
                  <View className="mt-2">
                    {displayUsers.map((user) => {
                      const displayName =
                        user.fullName || user.full_name || user.username || "User";
                      const avatarUrl = resolveUserAvatarUri(
                        user.avatarUrl || user.avatar_url,
                        displayName
                      );
                      return (
                        <ContactItem
                          key={user.id}
                          contact={{
                            id: user.id,
                            name: displayName,
                            email: user.username ? `@${user.username}` : "",
                            avatar: avatarUrl,
                          }}
                          isSelected={selectedMembers.some(
                            (m) => m.id === user.id
                          )}
                          onToggle={toggleContact}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action Bar */}
          {selectedMembers.length > 0 && (
            <View 
              className="px-4 bg-white border-t border-gray-200"
              style={{ paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 20, paddingTop: 16 }}
            >
              <View className="flex-row items-center justify-between">
                {/* Selected Users */}
                <View className="flex-row items-center gap-2 flex-1">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-1"
                    contentContainerStyle={{ paddingVertical: 8, paddingRight: 8 }}
                  >
                    <View className="flex-row items-center gap-2">
                      {selectedMembers.map((user) => {
                        const displayName =
                          user.fullName || user.username || "User";
                        const chipAvatarUri = resolveUserAvatarUri(
                          user.avatarUrl || user.avatar_url,
                          displayName
                        );
                        return (
                          <View key={user.id} className="relative">
                            <ExpoImage
                              source={{ uri: chipAvatarUri }}
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                              }}
                              contentFit="cover"
                              placeholder={{
                                blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
                              }}
                              transition={200}
                            />
                            <TouchableOpacity
                              onPress={() => removeContact(user.id)}
                              activeOpacity={0.7}
                              style={{
                                position: "absolute",
                                top: -8,
                                right: -8,
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: "#EF4444",
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: 2,
                                borderColor: "#FFFFFF",
                                zIndex: 10,
                                elevation: 5,
                              }}
                            >
                              <Ionicons
                                name="close"
                                size={12}
                                color="#FFFFFF"
                              />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                {/* Create Button */}
                <TouchableOpacity
                  onPress={handleSubmit(handleCreate)}
                  activeOpacity={0.8}
                  disabled={
                    !groupName.trim() ||
                    selectedMembers.length === 0 ||
                    createGroupMutation.isPending ||
                    isUploadingImage
                  }
                  style={{
                    backgroundColor:
                      groupName.trim() &&
                      selectedMembers.length > 0 &&
                      !createGroupMutation.isPending
                        ? "#34B27D"
                        : "#D1D5DB",
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {createGroupMutation.isPending ? (
                    <Text className="text-white font-semibold">
                      Đang tạo...
                    </Text>
                  ) : (
                    <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};
