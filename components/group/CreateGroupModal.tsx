import { ContactItem } from "@/components/group/ContactItem";
import { useCreateGroup } from "@/hooks/useGroups";
import { useUsers } from "@/hooks/useUsers";
import { useAppSelector } from "@/store/hooks";
import { uploadImage } from "@/services/media";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
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

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const windowHeight = Dimensions.get("window").height;
  // Trượt full màn hình (chạm đỉnh), header sẽ tự chừa safe area bằng paddingTop
  const expandedY = 0;
  const collapsedY = expandedY;

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const slideAnim = useRef(new Animated.Value(windowHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sheetPositionRef = useRef(expandedY);

  // Fetch users từ API - chỉ khi modal visible và đã authenticated
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    error: usersError,
  } = useUsers(visible);
  const createGroupMutation = useCreateGroup();

  // Lấy user hiện tại từ Redux để filter ra khỏi danh sách
  const currentUser = useAppSelector((state) => state.auth.user);

  // Debug logging
  useEffect(() => {
    if (visible) {
      console.log("[CreateGroupModal] Users state:", {
        usersCount: users.length,
        isLoadingUsers,
        usersError: usersError ? String(usersError) : null,
        users: users.slice(0, 3), // Log first 3 users
      });
    }
  }, [visible, users, isLoadingUsers, usersError]);

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setGroupName("");
      setGroupDescription("");
      setSearchText("");
      setSelectedContacts([]);
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
  }, [visible, expandedY, windowHeight, fadeAnim, slideAnim]);

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

  // Helper function để tạo avatar mẫu từ tên
  const getAvatarUrl = (user: any) => {
    if (user.avatarUrl) {
      console.log("[getAvatarUrl] Using user avatarUrl:", user.avatarUrl);
      return user.avatarUrl;
    }
    const name = user.fullName || user.username || user.email || "User";
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=34B27D&color=fff&size=128`;
    console.log(
      "[getAvatarUrl] Generated avatar URL:",
      avatarUrl,
      "for name:",
      name
    );
    return avatarUrl;
  };

  // Filter users theo search text và loại bỏ user hiện tại
  const filteredUsers = users.filter((user) => {
    // Loại bỏ user hiện tại
    if (currentUser && user.id === currentUser.id) {
      return false;
    }
    
    // Filter theo search text
    const searchLower = searchText.toLowerCase();
    const fullName = (user.fullName || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const username = (user.username || "").toLowerCase();
    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      username.includes(searchLower)
    );
  });

  const toggleContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const removeContact = (contactId: string) => {
    setSelectedContacts((prev) => prev.filter((id) => id !== contactId));
  };

  const selectedUsersData = users.filter((user) =>
    selectedContacts.includes(user.id)
  );

  // Bỏ pan gesture, chỉ auto slide lên full height

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Cần quyền truy cập",
        "Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh đại diện nhóm."
      );
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedContacts.length === 0) {
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
          console.log("[CreateGroupModal] Image uploaded successfully:", avatarUrl);
        } catch (uploadError: any) {
          console.error("[CreateGroupModal] Failed to upload image:", uploadError);
          Alert.alert(
            "Lỗi",
            uploadError?.message || "Không thể tải ảnh lên. Vui lòng thử lại."
          );
          setIsUploadingImage(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      // Tạo nhóm với avatar URL đã upload
      await createGroupMutation.mutateAsync({
        name: groupName.trim(),
        avatar: avatarUrl,
        description: groupDescription.trim() || undefined,
        theme_color: "#34B27D", // Màu mặc định, có thể thêm picker sau
        member_ids: selectedContacts,
      });

      // Close modal sau khi tạo thành công
      // Toast và navigation đã được xử lý trong useCreateGroup hook
      handleClose();
    } catch (error) {
      // Error đã được handle trong useCreateGroup hook
      console.error("Failed to create group:", error);
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
                  <TextInput
                    className="text-lg font-medium text-black pb-2 border-b border-gray-300"
                    placeholder="Đặt tên nhóm..."
                    placeholderTextColor="#9CA3AF"
                    value={groupName}
                    onChangeText={setGroupName}
                    underlineColorAndroid="transparent"
                  />
                </View>
              </View>

              {/* Description Input */}
              <View className="mb-6">
                <TextInput
                  className={`text-base text-gray-800 pb-2 ${
                    !isDescriptionFocused
                      ? "border-b border-gray-300"
                      : "border-0"
                  }`}
                  placeholder="Mô tả nhóm (tùy chọn)..."
                  placeholderTextColor="#9CA3AF"
                  value={groupDescription}
                  onChangeText={setGroupDescription}
                  onFocus={() => setIsDescriptionFocused(true)}
                  onBlur={() => setIsDescriptionFocused(false)}
                  multiline
                  underlineColorAndroid="transparent"
                />
              </View>

              {/* Search Bar */}
              <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-3 mb-4">
                <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-2 text-base text-gray-800"
                  placeholder="Tìm tên hoặc email"
                  placeholderTextColor="#9CA3AF"
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>

              {/* Users List */}
              <View>
                {isLoadingUsers ? (
                  <View className="py-8 items-center">
                    <Text className="text-gray-500">Đang tải danh sách...</Text>
                  </View>
                ) : filteredUsers.length === 0 ? (
                  <View className="py-8 items-center">
                    <Text className="text-gray-500">
                      Không tìm thấy người dùng
                    </Text>
                  </View>
                ) : (
                  filteredUsers.map((user) => {
                    const avatarUrl = getAvatarUrl(user);
                    const displayName =
                      user.fullName || user.username || user.email || "User";
                    console.log("[CreateGroupModal] Rendering user:", {
                      id: user.id,
                      name: displayName,
                      avatarUrl,
                      hasAvatarUrl: !!user.avatarUrl,
                    });
                    return (
                      <ContactItem
                        key={user.id}
                        contact={{
                          id: user.id,
                          name: displayName,
                          email: user.email || "",
                          avatar: avatarUrl,
                        }}
                        isSelected={selectedContacts.includes(user.id)}
                        onToggle={toggleContact}
                      />
                    );
                  })
                )}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action Bar */}
          {selectedContacts.length > 0 && (
            <View className="px-4 py-3 bg-white border-t border-gray-200">
              <View className="flex-row items-center justify-between">
                {/* Selected Users */}
                <View className="flex-row items-center gap-2 flex-1">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-1"
                  >
                    <View className="flex-row items-center gap-2">
                      {selectedUsersData.map((user) => {
                        const avatarUrl = getAvatarUrl(user);
                        const displayName =
                          user.fullName ||
                          user.username ||
                          user.email ||
                          "User";
                        return (
                          <View key={user.id} className="relative">
                            {user.avatarUrl ? (
                              <ExpoImage
                                source={{ uri: avatarUrl }}
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
                            ) : (
                              <View
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 20,
                                  backgroundColor: "#34B27D",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Text className="text-white text-sm font-bold">
                                  {displayName.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
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
                  onPress={handleCreate}
                  activeOpacity={0.8}
                  disabled={
                    !groupName.trim() ||
                    selectedContacts.length === 0 ||
                    createGroupMutation.isPending ||
                    isUploadingImage
                  }
                  style={{
                    backgroundColor:
                      groupName.trim() &&
                      selectedContacts.length > 0 &&
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
