import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAppSelector } from "@/store/hooks";
import { createPost } from "@/services/social";
import { mockItineraries } from "@/data/mockItineraries";
import type { Itinerary } from "@/types/group";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  clearPendingItinerary,
  getAndClearPendingItinerary,
  getPendingItinerary,
} from "@/utils/pendingItinerarySelection";

type PrivacyType = "public" | "private";

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itineraryId?: string }>();
  const { requireAuth } = useRequireAuth();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState<PrivacyType>("public");
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [privacyWidth, setPrivacyWidth] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentInputRef = useRef<TextInput>(null);

  const formatItineraryDateRange = (start: string, end: string) => {
    const f = (s: string) => {
      const d = new Date(s);
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    };
    return `${f(start)} - ${f(end)}`;
  };

  // Đồng bộ lịch trình khi quay lại từ màn "Chọn lịch trình" — đọc state (object đầy đủ field)
  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => {
        const it = getAndClearPendingItinerary();
        if (it) {
          setSelectedItinerary(it);
        }
      }, 100);
      return () => clearTimeout(t);
    }, [])
  );

  // Khi mount: đọc pending (object) hoặc params (id) để tương thích
  useEffect(() => {
    const it = getPendingItinerary();
    if (it) {
      setSelectedItinerary(it);
      clearPendingItinerary();
      return;
    }
    const id = params?.itineraryId as string | undefined;
    if (!id) return;
    const found = mockItineraries.find((x) => String(x.id) === String(id));
    if (found) setSelectedItinerary(found);
  }, [params?.itineraryId]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Cần quyền truy cập",
          "Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newUris = result.assets.map((asset) => asset.uri);
        setSelectedImages((prev) => [...prev, ...newUris]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleAddHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setHashtagInput("");
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedImages.length === 0) {
      Alert.alert("Thông báo", "Vui lòng nhập nội dung hoặc chọn ảnh");
      return;
    }

    await requireAuth(async () => {
      setIsSubmitting(true);
      try {
        // TODO: Upload images to server and get URLs
        const imageUrls = selectedImages; // For now, use local URIs
        
        await createPost({
          content: content.trim(),
          images: imageUrls.length > 0 ? imageUrls : undefined,
        });

        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Bài viết đã được đăng",
        });

        router.back();
      } catch (error: any) {
        console.error("Error creating post:", error);
        Alert.alert(
          "Lỗi",
          error?.response?.data?.message || "Không thể đăng bài viết. Vui lòng thử lại."
        );
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo bài viết</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting || (!content.trim() && selectedImages.length === 0)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.postButton,
                (isSubmitting || (!content.trim() && selectedImages.length === 0)) &&
                  styles.postButtonDisabled,
              ]}
            >
              Đăng
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* User Profile and Privacy */}
          <View style={styles.userSection}>
            <Image
              source={{
                uri:
                  currentUser?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    currentUser?.fullName || currentUser?.username || "User"
                  )}&background=34B27D&color=fff`,
              }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {currentUser?.fullName || currentUser?.username || "Người dùng"}
              </Text>
              <View style={styles.privacyWrapper}>
                <TouchableOpacity
                  onPress={() => setShowPrivacyModal((prev) => !prev)}
                  style={styles.privacyButton}
                  activeOpacity={0.7}
                  onLayout={(e) => {
                    setPrivacyWidth(e.nativeEvent.layout.width);
                  }}
                >
                  <Ionicons
                    name={privacy === "public" ? "globe-outline" : "lock-closed-outline"}
                    size={16}
                    color="#666"
                  />
                  <Text style={styles.privacyText}>
                    {privacy === "public" ? "Công khai" : "Chỉ mình tôi"}
                  </Text>
                  <Ionicons
                    name={showPrivacyModal ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#666"
                  />
                </TouchableOpacity>

                {showPrivacyModal && (
                  <View
                    style={[
                      styles.dropdownContent,
                      {
                        width: privacyWidth
                          ? Math.max(privacyWidth, 200)
                          : 200,
                      },
                    ]}
                    collapsable={false}
                  >
                    <TouchableOpacity
                      style={styles.privacyOption}
                      onPress={() => {
                        Keyboard.dismiss();
                        setPrivacy("public");
                        setShowPrivacyModal(false);
                        setTimeout(() => contentInputRef.current?.blur(), 0);
                      }}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="globe-outline" size={16} color="#000" />
                      <Text style={styles.privacyOptionText} numberOfLines={1}>
                        Công khai
                      </Text>
                      {privacy === "public" && (
                        <Ionicons name="checkmark" size={16} color="#34B27D" />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.privacyOption}
                      onPress={() => {
                        Keyboard.dismiss();
                        setPrivacy("private");
                        setShowPrivacyModal(false);
                        setTimeout(() => contentInputRef.current?.blur(), 0);
                      }}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="lock-closed-outline" size={16} color="#000" />
                      <Text style={styles.privacyOptionText} numberOfLines={1}>
                        Chỉ mình tôi
                      </Text>
                      {privacy === "private" && (
                        <Ionicons name="checkmark" size={16} color="#34B27D" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Nội dung + Hashtag trong cùng block với nền xanh */}
          <View style={styles.contentBlock}>
            {/* Text Input */}
            <TextInput
              ref={contentInputRef}
              style={styles.textInput}
              placeholder="Bạn đang nghĩ gì?"
              placeholderTextColor="#999"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />

            {/* Hashtag Section */}
            <View style={styles.hashtagSection}>
              <Text style={styles.sectionTitle}># Hashtag</Text>
              {hashtags.length > 0 && (
                <View style={styles.hashtagContainer}>
                  {hashtags.map((tag, index) => (
                    <View key={index} style={styles.hashtag}>
                      <Text style={styles.hashtagText}>#{tag}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveHashtag(tag)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle" size={18} color="#666" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.hashtagInputContainer}>
                <TextInput
                  style={styles.hashtagInput}
                  placeholder="Thêm #hashtag"
                  placeholderTextColor="#999"
                  value={hashtagInput}
                  onChangeText={setHashtagInput}
                  onSubmitEditing={handleAddHashtag}
                  returnKeyType="done"
                />
                {hashtagInput.trim() && (
                  <TouchableOpacity
                    onPress={handleAddHashtag}
                    style={styles.addHashtagButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle" size={24} color="#34B27D" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Image Upload Section - scroll ngang khi nhiều ảnh */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ảnh đính kèm</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imageScrollView}
              contentContainerStyle={styles.imageScrollContent}
            >
              {selectedImages.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.imageItem}>
                  <Image source={{ uri }} style={styles.imagePreview} contentFit="cover" />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handlePickImage}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={32} color="#999" />
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Itinerary Section - theo ảnh: nền xanh nhạt, card trắng khi đã gắn */}
          <View style={styles.itineraryBlock}>
            <View style={styles.itineraryBlockHeader}>
              <View style={styles.itineraryHeaderRow}>
                <Ionicons name="trail-sign-outline" size={20} color="#16A34A" />
                <Text style={styles.itineraryBlockTitle}>Lịch trình đã gắn</Text>
              </View>
              {selectedItinerary ? (
                <TouchableOpacity
                  onPress={() => {
                    router.push({
                      pathname: "/select-itinerary" as const,
                      params: { itineraryId: selectedItinerary.id },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.itineraryChangeLink}>Thay đổi</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.itineraryTouchable}
              onPress={() => {
                router.push({
                  pathname: "/select-itinerary" as const,
                  params: {
                    itineraryId: selectedItinerary?.id ?? "",
                  },
                });
              }}
              activeOpacity={0.9}
            >
              {selectedItinerary ? (
                <View style={styles.itineraryCard}>
                  <Image
                    source={{ uri: selectedItinerary.image }}
                    style={styles.itineraryCardImage}
                    contentFit="cover"
                  />
                  <View style={styles.itineraryCardBody}>
                    <Text style={styles.itineraryCardTitle} numberOfLines={2}>
                      {selectedItinerary.name}
                    </Text>
                    <View style={styles.itineraryCardRow}>
                      <Text style={styles.itineraryCardIconEmoji}>📆</Text>
                      <Text style={styles.itineraryCardLabel}>
                        Thời gian:{" "}
                        <Text style={styles.itineraryCardValue}>
                          {formatItineraryDateRange(selectedItinerary.startDate, selectedItinerary.endDate)}
                        </Text>
                      </Text>
                    </View>
                    <View style={styles.itineraryCardRow}>
                      <Ionicons name="people-outline" size={16} color="#16A34A" />
                      <Text style={styles.itineraryCardLabel}>
                        Số người:{" "}
                        <Text style={styles.itineraryCardValue}>
                          {selectedItinerary.memberCount} thành viên
                        </Text>
                      </Text>
                    </View>
                    <Text style={styles.itineraryCardLabel}>
                      Ngân sách:{" "}
                      <Text style={styles.itineraryCardBudget}>
                        {new Intl.NumberFormat("vi-VN").format(selectedItinerary.budget)} đ
                      </Text>
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.itineraryEmpty}>
                  <Ionicons name="location-outline" size={28} color="#9CA3AF" />
                  <Text style={styles.itineraryPlaceholderText}>Chưa gắn lịch trình</Text>
                  <Text style={styles.itineraryPlaceholderSubtext}>Nhấn để chọn lịch trình</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  postButton: {
    fontSize: 16,
    fontWeight: "600",
    color: "#34B27D",
  },
  postButtonDisabled: {
    color: "#9CA3AF",
  },
  content: {
    flex: 1,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  contentBlock: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    overflow: "hidden",
  },
  privacyWrapper: {
    alignSelf: "flex-start",
    position: "relative",
    zIndex: 1000,
    elevation: 10,
  },
  privacyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
  },
  privacyText: {
    fontSize: 14,
    color: "#666",
  },
  textInput: {
    minHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#FFFFFF",
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  hashtagSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  hashtagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  hashtag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  hashtagText: {
    color: "#047857",
    fontSize: 14,
    fontWeight: "500",
  },
  hashtagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hashtagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#000",
  },
  addHashtagButton: {
    padding: 4,
  },
  imageScrollView: {
    minHeight: 116,
  },
  imageScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 4,
    minHeight: 100,
  },
  imageItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    minWidth: 100,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  itineraryBlock: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    padding: 14,
    backgroundColor: "#EEFAF4",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  itineraryBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  itineraryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itineraryBlockTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  itineraryChangeLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16A34A",
  },
  itineraryTouchable: {
    borderRadius: 12,
    overflow: "hidden",
  },
  itineraryEmpty: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  itineraryPlaceholderText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 4,
  },
  itineraryPlaceholderSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  itineraryCard: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 100,
  },
  itineraryCardImage: {
    width: 100,
    minHeight: 100,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  itineraryCardBody: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  itineraryCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  itineraryCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  itineraryCardIconEmoji: {
    fontSize: 16,
  },
  itineraryCardLabel: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 2,
  },
  itineraryCardValue: {
    fontWeight: "700",
    color: "#111827",
  },
  itineraryCardBudget: {
    fontWeight: "700",
    color: "#16A34A",
    fontSize: 13,
  },
  dropdownContent: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    zIndex: 1001,
    elevation: 11,
  },
  privacyOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 2,
    gap: 6,
    flexWrap: "nowrap",
  },
  privacyOptionText: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
});
