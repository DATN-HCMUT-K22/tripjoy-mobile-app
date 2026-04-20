import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useItineraries } from "@/hooks/useItineraries";
import { useAppSelector } from "@/store/hooks";
import { uploadImage, uploadVideo, type MediaUploadResponse } from "@/services/media";
import { mockItineraries } from "@/data/mockItineraries";
import type { Itinerary } from "@/types/group";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { storage } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AttachedMediaGalleryModal } from "@/components/create-post/AttachedMediaGalleryModal";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import {
  clearPendingItinerary,
  getPendingItinerary,
} from "@/utils/pendingItinerarySelection";
import { useCreatePost } from "@/hooks/usePostManagement";

const ITINERARY_PLACEHOLDER_IMAGE = require("@/assets/images/loading_img.jpg");
const MAX_CONTENT_LENGTH = 5000;
const MAX_FILE_SIZE_MB = 10;

type PrivacyType = "public" | "private";

type PickedMedia = {
  uri: string;
  kind: "image" | "video";
  mimeType?: string;
  fileName?: string;
  thumbnailUri?: string;
};

function computeDurationLabel(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  const days = Math.max(1, Math.floor((e.getTime() - s.getTime()) / 86400000) + 1);
  const nights = days > 1 ? days - 1 : 0;
  return nights > 0 ? `${days} ngày ${nights} đêm` : `${days} ngày`;
}

function extractHashtags(content: string): string[] {
  // Use Unicode-aware regex to support Vietnamese characters
  const regex = /#([\p{L}\p{N}_]+)/gu;
  const matches = content.match(regex) || [];
  return matches.map(tag => tag.slice(1).toLowerCase());
}

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itineraryId?: string }>();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const shouldLoadAuthenticatedData = isAuthenticated || !!accessToken;
  const { data: myItineraries = [] } = useItineraries({
    enabled: shouldLoadAuthenticatedData,
  });
  const { requireAuth, checkAuth, showLoginModal, setShowLoginModal } = useRequireAuth();
  const currentUser = useAppSelector((state) => state.auth.user);
  const createPostMutation = useCreatePost();
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<PickedMedia[]>([]);
  const [privacy, setPrivacy] = useState<PrivacyType>("public");
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [privacyWidth, setPrivacyWidth] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [mediaGalleryVisible, setMediaGalleryVisible] = useState(false);
  const [mediaGalleryIndex, setMediaGalleryIndex] = useState(0);
  const contentInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!shouldLoadAuthenticatedData) {
      void checkAuth();
    }
  }, [checkAuth, shouldLoadAuthenticatedData]);

  // Load default post visibility preference
  useEffect(() => {
    const loadDefaultVisibility = async () => {
      const defaultVisibility = await storage.getDefaultPostVisibility();
      setPrivacy(defaultVisibility.toLowerCase() as PrivacyType);
    };
    void loadDefaultVisibility();
  }, []);

  const formatItineraryDateRange = (start: string, end: string) => {
    const f = (s: string) => {
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return "—";
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    };
    return `${f(start)} - ${f(end)}`;
  };

  // Khi quay lại từ "Chọn lịch trình": đọc pending sau 1 frame để tránh race với router.back().
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const frame = requestAnimationFrame(() => {
        if (cancelled) return;
        const it = getPendingItinerary();
        if (it) {
          setSelectedItinerary(it);
          clearPendingItinerary();
        }
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
      };
    }, [])
  );

  // Params itineraryId (mock hoặc cache danh sách /itineraries/me) — không đụng pending ở đây.
  useEffect(() => {
    const raw = params?.itineraryId;
    const id = typeof raw === "string" ? raw.trim() : "";
    if (!id) return;
    const fromMock = mockItineraries.find((x) => String(x.id) === String(id));
    if (fromMock) {
      setSelectedItinerary(fromMock);
      return;
    }
    const fromList = myItineraries.find((x) => String(x.id) === String(id));
    if (fromList) setSelectedItinerary(fromList);
  }, [params?.itineraryId, myItineraries]);

  const handlePickMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showErrorToast(
          "Cần quyền truy cập",
          "Ứng dụng cần quyền truy cập thư viện để chọn ảnh hoặc video."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const validItems: PickedMedia[] = [];

        for (const asset of result.assets) {
          // Check file size (asset.fileSize in bytes)
          if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
            showErrorToast(
              "File quá lớn",
              `File ${asset.fileName || 'được chọn'} vượt quá giới hạn ${MAX_FILE_SIZE_MB}MB`
            );
            continue;
          }

          const isVideo =
            asset.type === "video" ||
            (typeof asset.mimeType === "string" &&
              asset.mimeType.startsWith("video/"));
          let thumbnailUri: string | undefined;
          if (isVideo) {
            try {
              const thumb = await VideoThumbnails.getThumbnailAsync(asset.uri, {
                time: 1000,
              });
              thumbnailUri = thumb.uri;
            } catch {
              thumbnailUri = undefined;
            }
          }
          validItems.push({
            uri: asset.uri,
            kind: isVideo ? "video" : "image",
            mimeType: asset.mimeType ?? undefined,
            fileName: asset.fileName ?? undefined,
            thumbnailUri,
          });
        }

        if (validItems.length > 0) {
          setSelectedMedia((prev) => [...prev, ...validItems]);
        }
      }
    } catch (error) {
      showErrorToast("Không chọn được file", "Không thể chọn ảnh/video. Vui lòng thử lại.");
    }
  };

  const handleRemoveMedia = (index: number) => {
    setSelectedMedia(selectedMedia.filter((_, i) => i !== index));
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
    // Validate content is not empty
    if (content.trim().length === 0) {
      showErrorToast("Lỗi", "Nội dung không được để trống");
      return;
    }

    // Validate content max length
    if (content.length > MAX_CONTENT_LENGTH) {
      showErrorToast("Lỗi", `Nội dung tối đa ${MAX_CONTENT_LENGTH} ký tự`);
      return;
    }

    if (selectedMedia.length > 5) {
      showErrorToast("Quá nhiều media", "Chỉ được chọn tối đa 5 ảnh/video");
      return;
    }

    await requireAuth(async () => {
      setIsSubmitting(true);
      try {
        const uploadedUrls: string[] = [];
        const uploadedPublicIds: string[] = []; // Track for potential cleanup

        if (selectedMedia.length > 0) {
          const folder = currentUser?.id ? `tripjoy/posts/${currentUser.id}` : "tripjoy/posts";

          for (let i = 0; i < selectedMedia.length; i++) {
            const item = selectedMedia[i];
            setUploadProgress(`Đang tải ${i + 1}/${selectedMedia.length}...`);

            try {
              let result: MediaUploadResponse;
              if (item.kind === "video") {
                result = await uploadVideo({
                  fileUri: item.uri,
                  fileName: item.fileName || `post-video-${i}.mp4`,
                  fileType: item.mimeType || "video/mp4",
                  folder,
                });
              } else {
                result = await uploadImage({
                  fileUri: item.uri,
                  fileName: item.fileName || `post-image-${i}.jpg`,
                  fileType: item.mimeType || "image/jpeg",
                  folder,
                });
              }
              uploadedUrls.push(result.secure_url);
              uploadedPublicIds.push(result.public_id); // For cleanup tracking
            } catch (uploadError) {
              console.error(`Upload failed for media ${i + 1}:`, uploadError);

              // NOTE: Cloudinary cleanup requires admin API key (backend should handle this)
              // For now, just report the error and stop the process

              showErrorToast(
                "Lỗi tải ảnh",
                `Không thể tải file ${i + 1}/${selectedMedia.length}. Vui lòng thử lại.`
              );
              return; // Stop the upload process
            }
          }
        }

        const extractedHashtags = extractHashtags(content);
        const allHashtags = Array.from(new Set([...hashtags, ...extractedHashtags]));

        setUploadProgress("Đang đăng bài...");

        await createPostMutation.mutateAsync({
          content: content.trim(),
          media_urls: uploadedUrls,
          hashtags: allHashtags,
          visibility: privacy.toUpperCase() as 'PUBLIC' | 'PRIVATE',
          itinerary_id: selectedItinerary?.id,
        });
      } catch (error: unknown) {
        const msg =
          error instanceof Error
            ? error.message
            : "Không thể đăng bài. Vui lòng thử lại.";
        showErrorToast("Đăng bài thất bại", msg);
      } finally {
        setIsSubmitting(false);
        setUploadProgress("");
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
            disabled={isSubmitting || (!content.trim() && selectedMedia.length === 0)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.postButton,
                (isSubmitting || (!content.trim() && selectedMedia.length === 0)) &&
                  styles.postButtonDisabled,
              ]}
            >
              Đăng
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Upload Progress Indicator */}
          {isSubmitting && uploadProgress && (
            <View style={styles.uploadProgressContainer}>
              <ActivityIndicator size="small" color="#34B27D" />
              <Text style={styles.uploadProgressText}>{uploadProgress}</Text>
            </View>
          )}

          {/* User Profile and Privacy */}
          <View style={styles.userSection}>
            <Image
              source={{
                uri: resolveUserAvatarUri(
                  currentUser?.avatarUrl,
                  currentUser?.fullName || currentUser?.username
                ),
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

          {/* Privacy Guidance - Show when PRIVATE selected */}
          {privacy === "private" && (
            <View style={styles.privacyGuidance}>
              <View style={styles.privacyGuidanceHeader}>
                <Ionicons name="information-circle" size={20} color="#16A34A" />
                <Text style={styles.privacyGuidanceTitle}>Bài viết riêng tư</Text>
              </View>
              <Text style={styles.privacyGuidanceText}>
                Bài viết chỉ bạn và thành viên nhóm (nếu có liên kết hành trình) có thể xem.
              </Text>
            </View>
          )}

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

          {/* Ảnh / video đính kèm */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ảnh & video đính kèm</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imageScrollView}
              contentContainerStyle={styles.imageScrollContent}
            >
              {selectedMedia.map((item, index) => (
                <Pressable
                  key={`${item.uri}-${item.kind}-${index}`}
                  style={styles.imageItem}
                  onPress={() => {
                    setMediaGalleryIndex(index);
                    setMediaGalleryVisible(true);
                  }}
                >
                  {item.kind === "video" ? (
                    <View style={styles.videoThumbPlaceholder}>
                      {item.thumbnailUri ? (
                        <Image
                          source={{ uri: item.thumbnailUri }}
                          style={styles.imagePreview}
                          contentFit="cover"
                        />
                      ) : (
                        <Ionicons name="videocam" size={36} color="#9CA3AF" />
                      )}
                      <View style={styles.videoPlayBadge}>
                        <Ionicons name="play" size={14} color="#fff" />
                      </View>
                    </View>
                  ) : (
                    <Image source={{ uri: item.uri }} style={styles.imagePreview} contentFit="cover" />
                  )}
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveMedia(index)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </Pressable>
              ))}
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handlePickMedia}
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
                    source={
                      selectedItinerary.image?.trim()
                        ? { uri: selectedItinerary.image.trim() }
                        : ITINERARY_PLACEHOLDER_IMAGE
                    }
                    style={styles.itineraryCardImage}
                    contentFit="cover"
                  />
                  <View style={styles.itineraryCardBody}>
                    <Text style={styles.itineraryCardTitle} numberOfLines={2}>
                      {(() => {
                        const name = (selectedItinerary.name ?? "").trim();
                        const computedDur = computeDurationLabel(
                          selectedItinerary.startDate,
                          selectedItinerary.endDate
                        );
                        const dur = computedDur || (selectedItinerary.duration ?? "").trim();
                        if (name && dur && !name.includes(dur)) return `${name} - ${dur}`;
                        return name || dur || "Lịch trình";
                      })()}
                    </Text>
                    <View style={styles.itineraryCardRow}>
                      <Ionicons name="calendar-outline" size={16} color="#16A34A" />
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
                          {selectedItinerary.memberCount ?? 0} thành viên
                        </Text>
                      </Text>
                    </View>
                    <Text style={styles.itineraryCardLabel}>
                      Ngân sách:{" "}
                      <Text style={styles.itineraryCardBudget}>
                        {new Intl.NumberFormat("vi-VN").format(
                          selectedItinerary.budget ?? 0
                        )}{" "}
                        đ
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

        <AttachedMediaGalleryModal
          visible={mediaGalleryVisible}
          items={selectedMedia}
          initialIndex={mediaGalleryIndex}
          onClose={() => setMediaGalleryVisible(false)}
        />
        <LoginRequiredModal
          visible={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
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
  uploadProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F0FDF4",
    borderBottomWidth: 1,
    borderBottomColor: "#BBF7D0",
    gap: 12,
  },
  uploadProgressText: {
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "600",
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
  videoThumbPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  videoPlayBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
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
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  itineraryCardImage: {
    width: 84,
    minHeight: 96,
    borderTopLeftRadius: 11,
    borderBottomLeftRadius: 11,
  },
  itineraryCardBody: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
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
  privacyGuidance: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  privacyGuidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  privacyGuidanceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  privacyGuidanceText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});
