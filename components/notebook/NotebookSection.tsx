import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Enable LayoutAnimation on Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface NotebookSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  content: string;
  defaultExpanded?: boolean;
}

export function NotebookSection({
  title,
  icon,
  iconColor,
  content,
  defaultExpanded = false,
}: NotebookSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  // Extract first line as preview
  const preview = content?.split("\n")[0]?.replace(/^#+\s*/, "").substring(0, 60);
  const hasContent = content && content.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Header - Always visible */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpand}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {!isExpanded && hasContent && preview && (
              <Text style={styles.preview} numberOfLines={1}>
                {preview}
              </Text>
            )}
          </View>
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#9CA3AF"
        />
      </TouchableOpacity>

      {/* Content - Shown when expanded */}
      {isExpanded && (
        <View style={styles.content}>
          {hasContent ? (
            <Text style={styles.contentText}>{content}</Text>
          ) : (
            <Text style={styles.emptyText}>Chưa có nội dung</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    minHeight: 64,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  preview: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  contentText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
});
