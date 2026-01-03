import { ConfirmLogoutModal } from "@/components/common/ConfirmLogoutModal";
import { logout as logoutAPI } from "@/services/auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout as logoutAction } from "@/store/slices/authSlice";
import { storage } from "@/utils/storage";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface MenuDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function MenuDrawer({ visible, onClose }: MenuDrawerProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const slideAnim = useRef(new Animated.Value(-320)).current; // Start from left (negative width)
  const backdropOpacity = useRef(new Animated.Value(0)).current; // Backdrop opacity
  const [modalVisible, setModalVisible] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (visible) {
      // Mở modal trước, sau đó slide in và fade in backdrop
      setModalVisible(true);
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
    } else {
      // Slide out to left và fade out backdrop cùng lúc
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -320,
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
  }, [visible, slideAnim, backdropOpacity]);

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

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: backdropOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={styles.backdrop} />
        </Animated.View>
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Menu</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* User Info */}
          {user && (
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={32} color="#34B27D" />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {user.fullName || user.username}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
          )}

          {/* Menu Items */}
          <View style={styles.menuItems}>
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

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                // TODO: Navigate to settings
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={24} color="#111827" />
              <Text style={styles.menuItemText}>Cài đặt</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

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
          </View>
        </Animated.View>
      </View>

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
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  drawer: {
    width: "75%",
    maxWidth: 320,
    backgroundColor: "#ffffff",
    paddingTop: 20,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
  },
  menuItems: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 8,
    marginHorizontal: 20,
  },
  logoutItem: {
    marginTop: 8,
  },
  logoutText: {
    color: "#EF4444",
    fontWeight: "600",
  },
});
