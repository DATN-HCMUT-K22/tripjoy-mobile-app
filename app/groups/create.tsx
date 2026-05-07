import { ContactItem } from "@/components/group/ContactItem";
import { useCreateGroup } from "@/hooks/useGroups";
import { useUserSearchDebounce } from "@/hooks/useUserSearchDebounce";
import { UserSimpleResponse } from "@/types/search";
import { useAppSelector } from "@/store/hooks";
import { showSuccessToast } from "@/utils/toast";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const params = useLocalSearchParams<{
    returnTo?: string;
    autoSelect?: string;
  }>();
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<UserSimpleResponse[]>(
    []
  );
  const [visible, setVisible] = useState(true);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const searchEnabled = visible && isAuthenticated && !!accessToken;

  const { results: searchResults, isLoading: isSearchingUsers } =
    useUserSearchDebounce(searchText, { enabled: searchEnabled });

  const currentUser = useAppSelector((state) => state.auth.user);

  const displayUsers = useMemo(() => {
    const list = Array.isArray(searchResults) ? searchResults : [];
    return list.filter((u) => u.id !== currentUser?.id);
  }, [searchResults, currentUser?.id]);

  // Create group mutation
  const createGroupMutation = useCreateGroup({ redirectToGroups: false });

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

  const handleCreate = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      return;
    }

    try {
      const createdGroup = await createGroupMutation.mutateAsync({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        theme_color: "#34B27D", // Màu mặc định
        member_ids: selectedMembers.map((m) => m.id),
      });

      showSuccessToast("Tạo nhóm thành công!");
      if (params.returnTo === "/create/select-group") {
        router.replace({
          pathname: "/create/select-group",
          params: {
            createdGroupId: createdGroup.id,
            autoSelect: params.autoSelect === "1" ? "1" : "0",
          },
        } as any);
        return;
      }
      router.replace("/groups" as any);
    } catch {
      // Lỗi đã xử lý trong mutation onError (toast)
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
                  placeholder="Tìm tên hoặc username"
                  placeholderTextColor="#9CA3AF"
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>

              {/* Users List — GET /users/search?q= (debounce 300ms) */}
              <View>
                {!searchText.trim() ? (
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
                      return (
                        <ContactItem
                          key={user.id}
                          contact={{
                            id: user.id,
                            name: displayName,
                            email: user.username ? `@${user.username}` : "",
                            avatar: user.avatarUrl || user.avatar_url || "",
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
              style={{ paddingBottom: 34, paddingTop: 16 }}
            >
              <View className="flex-row items-center justify-between">
                {/* Selected Contacts */}
                <View className="flex-row items-center gap-2 flex-1">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-1"
                    contentContainerStyle={{ paddingVertical: 8, paddingRight: 8 }}
                  >
                    <View className="flex-row items-center gap-2">
                      {selectedMembers.map((user) => (
                        <View key={user.id} className="relative">
                          <ExpoImage
                            source={{
                              uri: resolveUserAvatarUri(
                                user.avatarUrl || user.avatar_url,
                                user.fullName || user.full_name || user.username || "User"
                              ),
                            }}
                            style={{ width: 40, height: 40, borderRadius: 20 }}
                            contentFit="cover"
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
                            <Ionicons name="close" size={12} color="#FFFFFF" />
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
                    selectedMembers.length === 0 ||
                    createGroupMutation.isPending
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
