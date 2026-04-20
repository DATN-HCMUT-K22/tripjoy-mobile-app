import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFakeProgress } from "@/hooks/useFakeProgress";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface GeneratingStateProps {
  isGenerating: boolean;
}

export function NotebookGeneratingState({ isGenerating }: GeneratingStateProps) {
  const { progress, stepLabel, completedSteps } = useFakeProgress(isGenerating);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progress}%`, { duration: 300 }),
  }));

  return (
    <View style={styles.container}>
      {/* Loading Spinner */}
      <View style={styles.iconContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>

      {/* Title */}
      <Text style={styles.title}>AI đang tạo hướng dẫn...</Text>
      <Text style={styles.subtitle}>{stepLabel}</Text>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, progressBarStyle]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>

      {/* Checklist of Completed Steps */}
      <View style={styles.checklist}>
        {completedSteps.map((step, index) => (
          <View key={index} style={styles.checklistItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.checklistText}>{step.label}</Text>
          </View>
        ))}
      </View>

      {/* Tip */}
      <View style={styles.tip}>
        <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
        <Text style={styles.tipText}>
          Bạn có thể đóng trang, kết quả sẽ được lưu tự động
        </Text>
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
    backgroundColor: "#FFFFFF",
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    minHeight: 20,
    paddingHorizontal: 16,
  },
  progressContainer: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 32,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
    textAlign: "right",
  },
  checklist: {
    width: "100%",
    maxWidth: 400,
    gap: 12,
    marginBottom: 24,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checklistText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    maxWidth: 400,
  },
  tipText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
});
