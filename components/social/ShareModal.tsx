import { useNativeShare } from "@/hooks/useSocial";
import { useGroups } from "@/hooks/useGroups";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { resolveUserAvatarUri } from "@/utils/userAvatar";

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postTitle?: string;
}

interface ShareOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  iconColor?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  postId,
  postTitle,
}) => {
  const { copyLink, shareNative } = useNativeShare();
  const { data: groups, isLoading: loadingGroups } = useGroups();
  const [showGroupList, setShowGroupList] = useState(false);

  const handleCopyLink = async () => {
    const success = await copyLink(postId);
    if (success) {
      onClose();
    }
  };

  const handleNativeShare = async () => {
    const success = await shareNative(postId, postTitle);
    if (success) {
      onClose();
    }
  };

  const handleShareToGroup = () => {
    setShowGroupList(true);
  };

  const handleGroupSelect = (groupId: string) => {
    // TODO: Implement share to group functionality
    console.log("Share to group:", groupId);
    onClose();
  };

  const shareOptions: ShareOption[] = [
    {
      id: "copy",
      label: "Sao chép link",
      icon: "copy-outline",
      onPress: handleCopyLink,
      iconColor: "#3B82F6",
    },
    {
      id: "native",
      label: Platform.select({
        ios: "Chia sẻ qua...",
        android: "Chia sẻ qua...",
        default: "Chia sẻ",
      }),
      icon: "share-social-outline",
      onPress: handleNativeShare,
      iconColor: "#34B27D",
    },
  ];

  // Add share to group option if user has groups
  if (groups && groups.length > 0) {
    shareOptions.push({
      id: "group",
      label: "Chia sẻ đến nhóm",
      icon: "people-outline",
      onPress: handleShareToGroup,
      iconColor: "#8B5CF6",
    });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50"
        activeOpacity={1}
        onPress={onClose}
      >
        <View className="flex-1 justify-end">
          <TouchableOpacity activeOpacity={1}>
            <View className="bg-white rounded-t-3xl">
              {/* Header */}
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
                <Text className="text-lg font-semibold text-gray-800">
                  {showGroupList ? "Chọn nhóm" : "Chia sẻ bài viết"}
                </Text>
                <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              {!showGroupList ? (
                <View className="px-6 py-4">
                  {shareOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      onPress={option.onPress}
                      className="flex-row items-center py-4 border-b border-gray-100"
                      activeOpacity={0.7}
                    >
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center mr-4"
                        style={{ backgroundColor: `${option.iconColor}15` }}
                      >
                        <Ionicons
                          name={option.icon}
                          size={24}
                          color={option.iconColor}
                        />
                      </View>
                      <Text className="text-base text-gray-800 font-medium flex-1">
                        {option.label}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="px-6 py-4" style={{ maxHeight: 400 }}>
                  {loadingGroups ? (
                    <View className="py-8 items-center">
                      <ActivityIndicator size="small" color="#34B27D" />
                      <Text className="text-gray-500 mt-2">Đang tải...</Text>
                    </View>
                  ) : (
                    <FlatList
                      data={groups}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={() => handleGroupSelect(item.id)}
                          className="flex-row items-center py-3 border-b border-gray-100"
                          activeOpacity={0.7}
                        >
                          <Image
                            source={{
                              uri: resolveUserAvatarUri(
                                item.avatar,
                                item.name
                              ),
                            }}
                            style={{ width: 48, height: 48, borderRadius: 24 }}
                            contentFit="cover"
                          />
                          <View className="flex-1 ml-3">
                            <Text className="text-base font-semibold text-gray-800">
                              {item.name}
                            </Text>
                            <Text className="text-sm text-gray-500">
                              {item.member_count} thành viên
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color="#9CA3AF"
                          />
                        </TouchableOpacity>
                      )}
                      ListEmptyComponent={
                        <View className="py-8 items-center">
                          <Ionicons
                            name="people-outline"
                            size={48}
                            color="#9CA3AF"
                          />
                          <Text className="text-gray-500 mt-2">
                            Chưa có nhóm nào
                          </Text>
                        </View>
                      }
                    />
                  )}

                  {/* Back button */}
                  <TouchableOpacity
                    onPress={() => setShowGroupList(false)}
                    className="flex-row items-center justify-center py-3 mt-2"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-back" size={20} color="#34B27D" />
                    <Text className="text-green-600 font-medium ml-2">
                      Quay lại
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Bottom padding for safe area */}
              <View className="h-8" />
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
