import { useGroup, useUpdateGroup } from "@/hooks/useGroups";
import { uploadImage } from "@/services/media";
import { showErrorToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditGroupInfoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: group, isLoading } = useGroup(id);
  const updateGroupMutation = useUpdateGroup(id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedLocalImageUri, setSelectedLocalImageUri] = useState<string | null>(
    null
  );
  const [themeColor, setThemeColor] = useState("#16A34A");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const colorPalette = [
    "#16A34A",
    "#0EA5E9",
    "#2563EB",
    "#7C3AED",
    "#DB2777",
    "#EA580C",
    "#EAB308",
    "#14B8A6",
  ];

  useEffect(() => {
    if (!group) return;
    setName(group.name ?? "");
    setDescription(group.description ?? "");
    setAvatarUrl(group.avatar ?? "");
    setSelectedLocalImageUri(null);
    setThemeColor(group.theme_color ?? "#16A34A");
  }, [group]);

  const isChanged = useMemo(() => {
    if (!group) return false;
    return (
      name.trim() !== (group.name ?? "").trim() ||
      description.trim() !== (group.description ?? "").trim() ||
      avatarUrl.trim() !== (group.avatar ?? "").trim() ||
      !!selectedLocalImageUri ||
      themeColor.trim() !== (group.theme_color ?? "#16A34A").trim()
    );
  }, [avatarUrl, description, group, name, selectedLocalImageUri, themeColor]);

  const isSaving = updateGroupMutation.isPending || isUploadingImage;

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showErrorToast(
        "Cần quyền truy cập",
        "Cần quyền truy cập thư viện ảnh để chọn ảnh đại diện nhóm."
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
      setSelectedLocalImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!group) return;
    if (!name.trim()) {
      showErrorToast("Thiếu thông tin", "Vui lòng nhập tên nhóm.");
      return;
    }
    try {
      let finalAvatar = avatarUrl.trim() || (group.avatar ?? "");
      if (selectedLocalImageUri) {
        setIsUploadingImage(true);
        const lowerUri = selectedLocalImageUri.toLowerCase();
        const fileType = lowerUri.endsWith(".png") ? "image/png" : "image/jpeg";
        const fileName = lowerUri.endsWith(".png")
          ? "group-avatar.png"
          : "group-avatar.jpg";
        try {
          const uploaded = await uploadImage({
            fileUri: selectedLocalImageUri,
            fileName,
            fileType,
            folder: "tripjoy/avatars/groups",
            timeoutMs: 60000,
          });
          finalAvatar = uploaded.secure_url || uploaded.url || finalAvatar;
        } catch {
          console.warn("[EditGroupInfo] Upload avatar failed, continue update group.");
        } finally {
          setIsUploadingImage(false);
        }
      }

      await updateGroupMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        avatar: finalAvatar || "",
        theme_color: themeColor.trim() || undefined,
        chatbot_count: group.chatbot_count,
        is_pro: group.is_pro,
      });
      router.back();
    } catch (error: any) {
      if (!updateGroupMutation.isError) {
        showErrorToast("Không thể cập nhật nhóm", error);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Không tìm thấy nhóm để chỉnh sửa.</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.headerSide}
          onPress={() => router.back()}
        >
          <Text style={styles.headerActionText}>Hủy</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Chỉnh sửa nhóm
          </Text>
        </View>
        <View style={styles.headerSide} />
      </View>


        <KeyboardAwareScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={20}
        >
          <View style={styles.card}>
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarPickerBtn}
                activeOpacity={0.85}
                onPress={handlePickImage}
              >
                <Image
                  source={{ uri: selectedLocalImageUri || avatarUrl || undefined }}
                  style={styles.avatarPreview}
                  contentFit="cover"
                />
                <View style={styles.avatarBadge}>
                  <Ionicons name="camera-outline" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Nhấn để đổi ảnh nhóm</Text>
            </View>

            <Text style={styles.label}>Tên nhóm</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nhập tên nhóm"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              maxLength={80}
            />

            <Text style={styles.label}>Mô tả</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Mô tả ngắn về nhóm"
              placeholderTextColor="#9CA3AF"
              style={[styles.input, styles.textArea]}
              multiline
              textAlignVertical="top"
              maxLength={300}
            />
            <Text style={styles.label}>Màu chủ đề</Text>
            <View style={styles.paletteWrap}>
              {colorPalette.map((color) => {
                const active = themeColor === color;
                return (
                  <TouchableOpacity
                    key={color}
                    activeOpacity={0.8}
                    onPress={() => setThemeColor(color)}
                    style={[
                      styles.colorChip,
                      { backgroundColor: color },
                      active && styles.colorChipActive,
                    ]}
                  >
                    {active ? (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </KeyboardAwareScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.saveBtn,
              (!isChanged || isSaving) && styles.saveBtnDisabled,
            ]}
            disabled={!isChanged || isSaving}
            onPress={handleSave}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: "#FFFFFF",
  },
  headerSide: {
    minWidth: 44,
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  headerActionText: {
    fontSize: 16,
    color: "#111827",
  },
  content: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  avatarPickerBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "visible",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  avatarPreview: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#E5E7EB",
  },
  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#16A34A",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B7280",
  },
  label: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: "#111827",
  },
  textArea: {
    minHeight: 110,
  },
  paletteWrap: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  colorChipActive: {
    borderWidth: 3,
    borderColor: "#111827",
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  saveBtn: {
    backgroundColor: "#16A34A",
    borderRadius: 12,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnDisabled: {
    backgroundColor: "#9CA3AF",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
