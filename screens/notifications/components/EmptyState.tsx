import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export function EmptyState() {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name="notifications-outline" size={40} color="#9CA3AF" />
      </View>
      <Text style={styles.title}>Chưa có thông báo nào</Text>
      <Text style={styles.description}>
        Khi có hoạt động mới như lượt thích, bình luận hay lời mời tham gia
        nhóm, chúng tôi sẽ hiển thị tại đây.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});






