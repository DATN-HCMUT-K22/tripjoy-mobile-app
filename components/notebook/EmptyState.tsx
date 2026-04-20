import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  onGenerate: () => void;
  isLoading?: boolean;
}

const FEATURES = [
  { icon: "restaurant", label: "Ẩm thực địa phương", color: "#F59E0B" },
  { icon: "sunny", label: "Khí hậu & thời tiết", color: "#EF4444" },
  { icon: "earth", label: "Văn hóa & phong tục", color: "#8B5CF6" },
  { icon: "call", label: "Liên hệ khẩn cấp", color: "#EF4444" },
  { icon: "bag-handle", label: "Danh sách hành lý", color: "#10B981" },
];

export function NotebookEmptyState({ onGenerate, isLoading }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name="book-outline" size={64} color="#9CA3AF" />
      </View>

      {/* Title */}
      <Text style={styles.title}>Chưa có hướng dẫn du lịch</Text>
      <Text style={styles.subtitle}>
        AI sẽ tạo nội dung cá nhân hóa về điểm đến của bạn
      </Text>

      {/* Features Grid */}
      <View style={styles.featuresGrid}>
        {FEATURES.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
              <Ionicons name={feature.icon} size={20} color={feature.color} />
            </View>
            <Text style={styles.featureLabel}>{feature.label}</Text>
          </View>
        ))}
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={onGenerate}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <Ionicons
          name="sparkles"
          size={20}
          color="#FFFFFF"
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonText}>
          {isLoading ? "Đang tạo..." : "Tạo hướng dẫn AI"}
        </Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Ionicons name="time-outline" size={16} color="#6B7280" />
        <Text style={styles.footerText}>Thời gian xử lý: ~20 giây</Text>
      </View>

      {/* Free Badge */}
      <View style={styles.badge}>
        <Ionicons name="diamond-outline" size={14} color="#10B981" />
        <Text style={styles.badgeText}>Miễn phí</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
    backgroundColor: "#F9FAFB",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginBottom: 32,
    maxWidth: 400,
  },
  featureItem: {
    alignItems: "center",
    width: 100,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 12,
    color: "#374151",
    textAlign: "center",
    lineHeight: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 200,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 13,
    color: "#6B7280",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#D1FAE5",
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10B981",
  },
});
