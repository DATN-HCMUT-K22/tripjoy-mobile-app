import { ConfirmLogoutModal } from "@/components/common/ConfirmLogoutModal";
import { useGuestMode } from "@/hooks/useGuestMode";
import { logout as logoutAPI } from "@/services/auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout as logoutAction } from "@/store/slices/authSlice";
import { clearQueue } from "@/store/slices/messageNotificationSlice";
import { storage } from "@/utils/storage";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MenuDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function MenuDrawer({ visible, onClose }: MenuDrawerProps) {
  // const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { isGuest } = useGuestMode();
  
  // Tính toán width động dựa trên kích thước màn hình
  const screenWidth = Dimensions.get("window").width;
  const drawerWidth = Math.min(screenWidth * 0.75, 320);
  const slideAnim = useRef(new Animated.Value(-drawerWidth)).current; // Start from left (negative width)
  const backdropOpacity = useRef(new Animated.Value(0)).current; // Backdrop opacity
  const [modalVisible, setModalVisible] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    // Cập nhật slideAnim value khi drawerWidth thay đổi
    const currentWidth = Math.min(screenWidth * 0.75, 320);
    if (visible) {
      // Reset animation values về vị trí ban đầu
      slideAnim.setValue(-currentWidth);
      backdropOpacity.setValue(0);
      
      // Mở modal trước
      setModalVisible(true);
      
      // Đợi một frame để modal render xong, sau đó mới bắt đầu animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Slide in from left và fade in backdrop cùng lúc
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        });
      });
    } else {
      // Slide out to left và fade out backdrop cùng lúc
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -currentWidth,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Đợi animation hoàn thành rồi mới đóng modal
        setModalVisible(false);
      });
    }
  }, [visible, slideAnim, backdropOpacity, screenWidth]);

  const handleLogoutClick = () => {
    // Hiện modal confirm
    setShowConfirmModal(true);
  };

  const handleLogout = async () => {
    // Đóng modal confirm
    setShowConfirmModal(false);

    try {
      // Lấy token trước khi clear
      const token = await storage.getAccessToken();

      // Gọi API logout nếu có token
      if (token) {
        try {
          await logoutAPI({ token });
          console.log("Logout API called successfully");
        } catch (error) {
          // Nếu API logout thất bại, vẫn tiếp tục clear local data
          console.error("Logout API error:", error);
          showErrorToast("Đăng xuất thất bại", error);
        }
      }

      // Clear tokens from storage
      await storage.clearTokens();
      // Clear guest mode
      await storage.setGuestMode(false);
      // Clear Redux state
      dispatch(logoutAction());
      dispatch(clearQueue());

      // Hiển thị toast thành công
      showSuccessToast("Đăng xuất thành công!");

      // Close menu
      onClose();

      // Navigate to login
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      showErrorToast("Đăng xuất thất bại", error);
    }
  };

  const handleBackdropPress = () => {
    onClose();
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "left"]}>
        <View style={styles.overlay}>
          {/* Backdrop - nhấn ra ngoài để đóng */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleBackdropPress}
          >
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  opacity: backdropOpacity,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                },
              ]}
            />
          </TouchableOpacity>
          
          {/* Drawer */}
          <Animated.View
            style={[
              styles.drawer,
              {
                width: drawerWidth,
                transform: [{ translateX: slideAnim }],
              },
            ]}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
          >
            <SafeAreaView style={styles.drawerContent} edges={["top", "bottom"]}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Menu</Text>
                <TouchableOpacity 
                  onPress={handleBackdropPress} 
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>

              {/* User Info */}
              {user && (
                <View style={styles.userInfo}>
                  <View style={styles.avatarContainer}>
                    <Image
                      source={{
                        uri: resolveUserAvatarUri(
                          user.avatarUrl,
                          user.fullName || user.username
                        ),
                      }}
                      style={styles.avatarImage}
                      contentFit="cover"
                    />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {user.fullName || user.username}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                </View>
              )}

              {/* Menu Items - Scrollable */}
              <ScrollView 
                style={styles.menuItemsContainer}
                contentContainerStyle={styles.menuItems}
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onClose();
                    router.push("/profile");
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="person-outline" size={24} color="#111827" />
                  <Text style={styles.menuItemText}>Trang cá nhân</Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>



                {/* Chỉ hiển thị nút đăng xuất nếu không phải guest mode */}
                {!isGuest && (
                  <>
                    <View style={styles.divider} />

                    <TouchableOpacity
                      style={[styles.menuItem, styles.logoutItem]}
                      onPress={handleLogoutClick}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                      <Text style={[styles.menuItemText, styles.logoutText]}>
                        Đăng xuất
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>

              {isGuest && (
                <View style={styles.bottomCtaContainer}>
                  <TouchableOpacity
                    style={styles.loginCtaButton}
                    onPress={() => {
                      onClose();
                      router.push("/login");
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.loginCtaText}>Đăng nhập</Text>
                  </TouchableOpacity>
                </View>
              )}
            </SafeAreaView>
          </Animated.View>
        </View>
      </SafeAreaView>

      {/* Confirm Logout Modal */}
      <ConfirmLogoutModal
        visible={showConfirmModal}
        onConfirm={handleLogout}
        onCancel={() => setShowConfirmModal(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  drawer: {
    height: "100%",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  drawerContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Platform.OS === "ios" ? 20 : 16,
    paddingTop: Platform.OS === "ios" ? 8 : 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: Platform.OS === "ios" ? 20 : 18,
    fontWeight: "700",
    color: "#111827",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Platform.OS === "ios" ? 20 : 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E5F6F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  userDetails: {
    flex: 1,
    minWidth: 0, // Cho phép text truncate
  },
  userName: {
    fontSize: Platform.OS === "ios" ? 16 : 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: Platform.OS === "ios" ? 14 : 13,
    color: "#6B7280",
  },
  menuItemsContainer: {
    flex: 1,
  },
  menuItems: {
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 20 : 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Platform.OS === "ios" ? 20 : 16,
    paddingVertical: Platform.OS === "ios" ? 16 : 14,
    gap: 12,
    minHeight: 48, // Đảm bảo touch target đủ lớn
  },
  menuItemText: {
    flex: 1,
    fontSize: Platform.OS === "ios" ? 16 : 15,
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 8,
    marginHorizontal: Platform.OS === "ios" ? 20 : 16,
  },
  logoutItem: {
    marginTop: 8,
  },
  logoutText: {
    color: "#EF4444",
    fontWeight: "600",
  },
  bottomCtaContainer: {
    paddingHorizontal: Platform.OS === "ios" ? 20 : 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 14 : 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  loginCtaButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#34B27D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  loginCtaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
