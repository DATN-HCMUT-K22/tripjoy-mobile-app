import { ContactItem } from "@/components/group/ContactItem";
import { useCreateGroup } from "@/hooks/useGroups";
import { useUsers } from "@/hooks/useUsers";
import { useAppSelector } from "@/store/hooks";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function CreateGroupScreen() {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [visible, setVisible] = useState(true);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch users từ API
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    error: usersError,
  } = useUsers(visible);

  // Lấy user hiện tại từ Redux để filter ra khỏi danh sách
  const currentUser = useAppSelector((state) => state.auth.user);

  // Create group mutation
  const createGroupMutation = useCreateGroup();

  useEffect(() => {
    // Slide up animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: Dimensions.get("window").height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      router.back();
    });
  };

  // Filter users theo search text và loại bỏ user hiện tại
  const filteredUsers = users.filter((user) => {
    // Loại bỏ user hiện tại
    if (currentUser && user.id === currentUser.id) {
      return false;
    }
    
    // Filter theo search text
    const searchLower = searchText.toLowerCase();
    const fullName = (user.fullName || user.username || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower)
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

  // Get selected users data
  const selectedUsersData = users.filter((user) =>
    selectedContacts.includes(user.id)
  );

  const handleCreate = async () => {
    if (!groupName.trim() || selectedContacts.length === 0) {
      return;
    }

    try {
      console.log("Creating group:", {
        name: groupName,
        description: groupDescription,
        member_ids: selectedContacts,
      });

      await createGroupMutation.mutateAsync({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        theme_color: "#34B27D", // Màu mặc định
        member_ids: selectedContacts,
      });

      // handleClose sẽ được gọi trong onSuccess của mutation
    } catch (error) {
      // Error đã được xử lý trong mutation onError
      console.error("Create group error:", error);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              opacity: fadeAnim,
            }}
          />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: Dimensions.get("window").height * 0.5,
            backgroundColor: "white",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-black">Nhóm mới</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Group Info Section */}
            <View className="px-4 py-6">
              {/* Name Input */}
              <View className="mb-6">
                <TextInput
                  className="text-lg font-medium text-black pb-2 border-b border-gray-300"
                  placeholder="Đặt tên nhóm..."
                  placeholderTextColor="#9CA3AF"
                  value={groupName}
                  onChangeText={setGroupName}
                  underlineColorAndroid="transparent"
                />
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
                ) : usersError ? (
                  <View className="py-8 items-center">
                    <Text className="text-red-500">
                      Không thể tải danh sách người dùng
                    </Text>
                  </View>
                ) : filteredUsers.length === 0 ? (
                  <View className="py-8 items-center">
                    <Text className="text-gray-500">
                      Không tìm thấy người dùng
                    </Text>
                  </View>
                ) : (
                  filteredUsers.map((user) => {
                    const displayName =
                      user.fullName || user.username || user.email || "User";
                    return (
                      <ContactItem
                        key={user.id}
                        contact={{
                          id: user.id,
                          name: displayName,
                          email: user.email || "",
                          avatar: user.avatarUrl || "",
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
                {/* Selected Contacts */}
                <View className="flex-row items-center gap-2 flex-1">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-1"
                  >
                    <View className="flex-row items-center gap-2">
                      {selectedUsersData.map((user) => (
                        <View key={user.id} className="relative">
                          {user.avatarUrl ? (
                            <ExpoImage
                              source={{ uri: user.avatarUrl }}
                              style={{ width: 40, height: 40, borderRadius: 20 }}
                              contentFit="cover"
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
                                {(user.fullName || user.username || "U").charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <TouchableOpacity
                            onPress={() => removeContact(user.id)}
                            activeOpacity={0.7}
                            style={{
                              position: "absolute",
                              top: -6,
                              right: -6,
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: "#EF4444",
                              alignItems: "center",
                              justifyContent: "center",
                              borderWidth: 2,
                              borderColor: "#FFFFFF",
                              zIndex: 10,
                              elevation: 5,
                            }}
                          >
                            <Ionicons name="close" size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ))}
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
                    createGroupMutation.isPending
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
                    <Text className="text-white text-sm font-semibold">
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
}
