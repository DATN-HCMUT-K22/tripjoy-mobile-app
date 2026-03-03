import React from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";

interface DateSeparatorProps {
  dateString: string;
}

// Format date helper
const formatDateSeparator = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const time = `${hours}:${minutes}`;

  if (diffDays === 0) {
    return `Hôm nay, ${time}`;
  } else if (diffDays === 1) {
    return `Hôm qua, ${time}`;
  } else if (diffDays < 7) {
    const dayNames = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    return `${dayNames[date.getDay()]}, ${time}`;
  } else {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}, ${time}`;
  }
};

export const DateSeparator: React.FC<DateSeparatorProps> = ({ dateString }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.line, { backgroundColor: isDark ? "#404040" : "#E5E7EB" }]} />
        <View style={[styles.badge, { backgroundColor: isDark ? "#2A2A2A" : "#F3F4F6" }]}>
          <Text style={[styles.text, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
            {formatDateSeparator(dateString)}
          </Text>
        </View>
        <View style={[styles.line, { backgroundColor: isDark ? "#404040" : "#E5E7EB" }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  line: {
    flex: 1,
    height: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
});
