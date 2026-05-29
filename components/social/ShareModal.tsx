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
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { Image } from "expo-image";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { conversationService } from "@/services/conversations";
import { messageService } from "@/services/messages";
import { sharePost } from "@/services/social";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

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
  const { data: groups, isLoading: loadingGroups } = useGroups();
  const [showGroupList, setShowGroupList] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [sharingToGroup, setSharingToGroup] = useState(false);

  const handleShareToGroup = () => {
    setShowGroupList(true);
    setSelectedGroupId(null);
    setCustomMessage("");
  };

  const handleConfirmShare = async () => {
    if (!selectedGroupId || sharingToGroup) return;

    try {
      setSharingToGroup(true);
      Keyboard.dismiss();

      // Đóng modal ngay lập tức để trải nghiệm mượt mà
      onClose();

      // 1. Lấy danh sách conversations để tìm conversation của group
      const conversationsRes = await conversationService.getConversations();

      if (!conversationsRes.data) {
        showErrorToast("Không thể tải danh sách hội thoại");
        return;
      }

      // 2. Tìm conversation có group_id matching
      const groupConversation = conversationsRes.data.find(
        (conv) => conv.type === "GROUP" && conv.group_id === selectedGroupId
      );

      if (!groupConversation?.id) {
        showErrorToast("Không tìm thấy hội thoại của nhóm");
        return;
      }

      // 3. Gửi message với type SHARE_POST
      // Content ưu tiên lời nhắn của người dùng, nếu không có thì dùng title bài viết
      const messageContent = customMessage.trim() || postTitle || "Chia sẻ bài viết";
      
      await messageService.sendMessage(groupConversation.id, {
        message_content: messageContent,
        message_type: "SHARE_POST",
        shared_post_id: postId,
        share_post_url: `https://tripjoy.app/post/${postId}`,
      });

      showSuccessToast("Đã chia sẻ vào nhóm!");
    } catch (error) {
      console.error("Share to group error:", error);
      showErrorToast("Chia sẻ thất bại");
    } finally {
      setSharingToGroup(false);
    }
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
  };



  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
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
                  {selectedGroupId 
                    ? "Nhập lời nhắn" 
                    : "Chia sẻ bài viết"}
                </Text>
                <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              {selectedGroupId ? (
                // Step 3: Add message
                <View className="px-6 py-4">
                  <View className="flex-row items-center mb-4 p-3 bg-gray-50 rounded-xl">
                    <Image
                      source={{
                        uri: resolveUserAvatarUri(
                          groups?.find(g => g.id === selectedGroupId)?.avatar,
                          groups?.find(g => g.id === selectedGroupId)?.name
                        ),
                      }}
                      style={{ width: 40, height: 40, borderRadius: 20 }}
                    />
                    <Text className="ml-3 font-medium text-gray-700">
                      Gửi đến: {groups?.find(g => g.id === selectedGroupId)?.name}
                    </Text>
                  </View>

                  <TextInput
                    className="bg-gray-100 rounded-2xl p-4 text-base text-gray-800 min-h-[100px]"
                    placeholder="Viết lời nhắn đi kèm..."
                    multiline
                    value={customMessage}
                    onChangeText={setCustomMessage}
                    autoFocus
                  />

                  <TouchableOpacity
                    onPress={handleConfirmShare}
                    disabled={sharingToGroup}
                    className="bg-green-500 rounded-2xl py-4 mt-6 items-center shadow-sm"
                    activeOpacity={0.8}
                  >
                    {sharingToGroup ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-lg">Gửi ngay</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSelectedGroupId(null)}
                    className="py-3 mt-2 items-center"
                    activeOpacity={0.7}
                  >
                    <Text className="text-gray-500 font-medium">Chọn nhóm khác</Text>
                  </TouchableOpacity>
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
                              {item.members.length} thành viên
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

                </View>
              )}

              {/* Bottom padding for safe area */}
              <View className="h-8" />
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};
