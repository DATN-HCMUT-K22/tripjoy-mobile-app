import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

export type AppDialogVariant = "error" | "info" | "warning";

export interface AppDialogModalProps {
  visible: boolean;
  onRequestClose: () => void;
  title: string;
  message: string;
  variant?: AppDialogVariant;
  /** Một nút — mặc định "Đã hiểu" */
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  /** Hai nút: nút phụ (trái) */
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  /** Nút chính có style cảnh báo (vd. Xóa) */
  primaryDestructive?: boolean;
}

const variantIcon = (v: AppDialogVariant) => {
  switch (v) {
    case "error":
      return { name: "alert-circle" as const, color: "#DC2626", bg: "#FEE2E2" };
    case "warning":
      return { name: "warning" as const, color: "#D97706", bg: "#FEF3C7" };
    default:
      return { name: "information-circle" as const, color: "#2563EB", bg: "#DBEAFE" };
  }
};

/**
 * Modal thông báo / lỗi tùy chỉnh — thay Alert hệ thống.
 */
export function AppDialogModal({
  visible,
  onRequestClose,
  title,
  message,
  variant = "info",
  primaryLabel = "Đã hiểu",
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  primaryDestructive,
}: AppDialogModalProps) {
  const { width } = useWindowDimensions();
  const cardMax = Math.min(340, width - 48);
  const icon = variantIcon(variant);
  const twoButtons = !!secondaryLabel && !!onSecondaryPress;

  const handlePrimary = () => {
    if (onPrimaryPress) onPrimaryPress();
    else onRequestClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
      <Pressable style={styles.backdrop} onPress={onRequestClose}>
        <Pressable
          style={[styles.card, { maxWidth: cardMax }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
            <Ionicons name={icon.name} size={28} color={icon.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {twoButtons ? (
            <View style={styles.rowBtns}>
              <TouchableOpacity
                style={[styles.btnOutline, styles.btnFlex, styles.btnRowLeft]}
                onPress={() => {
                  onSecondaryPress?.();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.btnOutlineText}>{secondaryLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btnSolid,
                  styles.btnFlex,
                  primaryDestructive && styles.btnDestructive,
                ]}
                onPress={handlePrimary}
                activeOpacity={0.85}
              >
                <Text style={styles.btnSolidText}>{primaryLabel}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.btnSolid,
                styles.btnFull,
                primaryDestructive && styles.btnDestructive,
              ]}
              onPress={handlePrimary}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSolidText}>{primaryLabel}</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  message: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#4B5563",
    textAlign: "center",
  },
  rowBtns: {
    flexDirection: "row",
    marginTop: 22,
  },
  btnRowLeft: {
    marginRight: 10,
  },
  btnFlex: {
    flex: 1,
  },
  btnFull: {
    marginTop: 22,
  },
  btnSolid: {
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDestructive: {
    backgroundColor: "#DC2626",
  },
  btnSolidText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  btnOutline: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  btnOutlineText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
});
