import React from "react";
import { StyleSheet, View } from "react-native";

export function NotificationSkeleton() {
  return (
    <View style={styles.row}>
      <View style={styles.avatar} />
      <View style={styles.content}>
        <View style={styles.lineShort} />
        <View style={styles.lineLong} />
      </View>
    </View>
  );
}

export function NotificationSkeletonList() {
  return (
    <View>
      <NotificationSkeleton />
      <NotificationSkeleton />
      <NotificationSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  lineShort: {
    width: "40%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    marginBottom: 8,
  },
  lineLong: {
    width: "80%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E5E7EB",
  },
});






