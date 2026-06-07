import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showSuccessToast } from "@/utils/toast";
import { useAppDialog } from "@/hooks/useAppDialog";

const DEFAULT_POST_VISIBILITY_KEY = "@tripjoy:defaultPostVisibility";

type VisibilityType = "PUBLIC" | "PRIVATE";

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const [defaultVisibility, setDefaultVisibility] = useState<VisibilityType>("PUBLIC");
  const [isLoading, setIsLoading] = useState(true);
  const { dialog, showError } = useAppDialog();

  useEffect(() => {
    loadDefaultVisibility();
  }, []);

  const loadDefaultVisibility = async () => {
    try {
      const saved = await AsyncStorage.getItem(DEFAULT_POST_VISIBILITY_KEY);
      if (saved === "PRIVATE" || saved === "PUBLIC") {
        setDefaultVisibility(saved);
      }
    } catch (error) {
      console.error("Failed to load default visibility:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDefaultVisibility = async (visibility: VisibilityType) => {
    try {
      await AsyncStorage.setItem(DEFAULT_POST_VISIBILITY_KEY, visibility);
      setDefaultVisibility(visibility);
      showSuccessToast("Đã lưu", "Cài đặt quyền riêng tư đã được cập nhật");
    } catch (error) {
      console.error("Failed to save default visibility:", error);
      showError("Lỗi", "Không thể lưu cài đặt. Vui lòng thử lại.");
    }
  };

  const handleVisibilityChange = (visibility: VisibilityType) => {
    saveDefaultVisibility(visibility);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quyền riêng tư</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Default Post Visibility Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye-outline" size={22} color="#16A34A" />
            <Text style={styles.sectionTitle}>Quyền riêng tư bài viết</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Chọn mức độ hiển thị mặc định khi tạo bài viết mới
          </Text>

          {/* Public Option */}
          <TouchableOpacity
            style={[
              styles.visibilityOption,
              defaultVisibility === "PUBLIC" && styles.visibilityOptionActive,
            ]}
            onPress={() => handleVisibilityChange("PUBLIC")}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <View style={styles.visibilityOptionLeft}>
              <View style={styles.visibilityIconContainer}>
                <Ionicons name="globe" size={24} color="#16A34A" />
              </View>
              <View style={styles.visibilityOptionText}>
                <Text style={styles.visibilityOptionTitle}>Công khai</Text>
                <Text style={styles.visibilityOptionDescription}>
                  Mọi người đều có thể xem bài viết của bạn
                </Text>
              </View>
            </View>
            {defaultVisibility === "PUBLIC" && (
              <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
            )}
          </TouchableOpacity>

          {/* Private Option */}
          <TouchableOpacity
            style={[
              styles.visibilityOption,
              defaultVisibility === "PRIVATE" && styles.visibilityOptionActive,
            ]}
            onPress={() => handleVisibilityChange("PRIVATE")}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <View style={styles.visibilityOptionLeft}>
              <View style={styles.visibilityIconContainer}>
                <Ionicons name="lock-closed" size={24} color="#6B7280" />
              </View>
              <View style={styles.visibilityOptionText}>
                <Text style={styles.visibilityOptionTitle}>Riêng tư</Text>
                <Text style={styles.visibilityOptionDescription}>
                  Chỉ bạn và thành viên nhóm có thể xem
                </Text>
              </View>
            </View>
            {defaultVisibility === "PRIVATE" && (
              <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
            )}
          </TouchableOpacity>
        </View>

        {/* Privacy Guide Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={22} color="#16A34A" />
            <Text style={styles.sectionTitle}>Hướng dẫn quyền riêng tư</Text>
          </View>

          <View style={styles.guideCard}>
            <View style={styles.guideItem}>
              <View style={styles.guideBullet}>
                <Ionicons name="globe" size={18} color="#16A34A" />
              </View>
              <View style={styles.guideTextContainer}>
                <Text style={styles.guideTitle}>Bài viết công khai</Text>
                <Text style={styles.guideText}>
                  Mọi người trên TripJoy đều có thể xem, thích và bình luận bài viết của bạn.
                  Bài viết sẽ xuất hiện trong trang khám phá và tìm kiếm.
                </Text>
              </View>
            </View>

            <View style={styles.guideDivider} />

            <View style={styles.guideItem}>
              <View style={styles.guideBullet}>
                <Ionicons name="lock-closed" size={18} color="#6B7280" />
              </View>
              <View style={styles.guideTextContainer}>
                <Text style={styles.guideTitle}>Bài viết riêng tư</Text>
                <Text style={styles.guideText}>
                  Chỉ bạn và thành viên nhóm (nếu bài viết được gắn với hành trình nhóm) có thể xem.
                  Bài viết sẽ không xuất hiện trong trang khám phá.
                </Text>
              </View>
            </View>

            <View style={styles.guideDivider} />

            <View style={styles.guideItem}>
              <View style={styles.guideBullet}>
                <Ionicons name="people" size={18} color="#16A34A" />
              </View>
              <View style={styles.guideTextContainer}>
                <Text style={styles.guideTitle}>Bài viết có hành trình nhóm</Text>
                <Text style={styles.guideText}>
                  Khi bạn gắn hành trình nhóm vào bài viết riêng tư, tất cả thành viên trong nhóm đó
                  đều có thể xem bài viết.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Additional Privacy Info */}
        <View style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
            <Text style={styles.infoTitle}>Lưu ý về quyền riêng tư</Text>
          </View>
          <Text style={styles.infoText}>
            Bạn có thể thay đổi quyền riêng tư cho từng bài viết khi tạo hoặc chỉnh sửa.
            Cài đặt này chỉ áp dụng cho bài viết mới.
          </Text>
          <Text style={styles.infoText}>
            Bài viết đã tạo sẽ giữ nguyên cài đặt quyền riêng tư ban đầu.
          </Text>
        </View>

        {/* Privacy FAQ Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle-outline" size={22} color="#16A34A" />
            <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
          </View>

          <View style={styles.faqCard}>
            <Text style={styles.faqQuestion}>Ai có thể xem bài viết riêng tư của tôi?</Text>
            <Text style={styles.faqAnswer}>
              Chỉ bạn và thành viên trong nhóm hành trình (nếu bài viết được gắn với hành trình nhóm)
              có thể xem bài viết riêng tư.
            </Text>
          </View>

          <View style={styles.faqCard}>
            <Text style={styles.faqQuestion}>Tôi có thể thay đổi quyền riêng tư sau khi đăng không?</Text>
            <Text style={styles.faqAnswer}>
              Có, bạn có thể chỉnh sửa bài viết và thay đổi quyền riêng tư bất cứ lúc nào.
            </Text>
          </View>

          <View style={styles.faqCard}>
            <Text style={styles.faqQuestion}>Bài viết riêng tư có hiện trong tìm kiếm không?</Text>
            <Text style={styles.faqAnswer}>
              Không, bài viết riêng tư sẽ không xuất hiện trong kết quả tìm kiếm hoặc trang khám phá.
            </Text>
          </View>
        </View>
      </ScrollView>
      {dialog}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  visibilityOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  visibilityOptionActive: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  visibilityOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  visibilityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  visibilityOptionText: {
    flex: 1,
  },
  visibilityOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  visibilityOptionDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  guideCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  guideItem: {
    flexDirection: "row",
    gap: 12,
  },
  guideBullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  guideTextContainer: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  guideText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  guideDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  infoBox: {
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  infoText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 8,
  },
  faqCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
});
