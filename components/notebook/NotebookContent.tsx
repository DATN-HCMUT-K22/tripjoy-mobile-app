import React, { useState, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { NotebookSection } from "./NotebookSection";
import { TravelNotebookResponse, NotebookSection as SectionType } from "@/types/notebook";

interface NotebookContentProps {
  notebook: TravelNotebookResponse;
}

const SECTIONS_CONFIG: Omit<SectionType, "content">[] = [
  {
    key: "food",
    title: "Ẩm thực địa phương",
    icon: "restaurant",
    iconColor: "#F59E0B",
    defaultExpanded: true,
  },
  {
    key: "climate",
    title: "Khí hậu & Thời tiết",
    icon: "sunny",
    iconColor: "#EF4444",
    defaultExpanded: true,
  },
  {
    key: "culture",
    title: "Văn hóa & Phong tục",
    icon: "earth",
    iconColor: "#8B5CF6",
    defaultExpanded: false,
  },
  {
    key: "weather_forecast",
    title: "Dự báo thời tiết",
    icon: "partly-sunny",
    iconColor: "#3B82F6",
    defaultExpanded: false,
  },
  {
    key: "culture_etiquette",
    title: "Lưu ý văn hóa",
    icon: "alert-circle",
    iconColor: "#F59E0B",
    defaultExpanded: false,
  },
  {
    key: "emergency_contacts",
    title: "Liên hệ khẩn cấp",
    icon: "call",
    iconColor: "#EF4444",
    defaultExpanded: false,
  },
  {
    key: "packing_guide",
    title: "Danh sách hành lý",
    icon: "bag-handle",
    iconColor: "#10B981",
    defaultExpanded: false,
  },
];

export function NotebookContent({ notebook }: NotebookContentProps) {
  const [revealedSections, setRevealedSections] = useState<Set<string>>(new Set());

  // Create fade animations for each section
  const fadeAnims = React.useRef(
    SECTIONS_CONFIG.reduce((acc, section) => {
      acc[section.key] = new Animated.Value(0);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;

  // Progressive reveal: stagger each section by 400ms
  useEffect(() => {
    SECTIONS_CONFIG.forEach((section, index) => {
      setTimeout(() => {
        setRevealedSections((prev) => new Set(prev).add(section.key));

        // Fade in animation
        Animated.timing(fadeAnims[section.key], {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, index * 400); // 400ms stagger
    });
  }, [notebook]); // Re-run when notebook changes

  return (
    <View style={styles.container}>
      {SECTIONS_CONFIG.map((config) => {
        const content = notebook[config.key as keyof TravelNotebookResponse] as
          | string
          | undefined;

        // Only render if section is revealed (progressive)
        if (!revealedSections.has(config.key)) {
          return null;
        }

        // Skip empty sections
        if (!content || content.trim().length === 0) {
          return null;
        }

        return (
          <Animated.View
            key={config.key}
            style={[
              styles.sectionWrapper,
              { opacity: fadeAnims[config.key] },
            ]}
          >
            <NotebookSection
              title={config.title}
              icon={config.icon}
              iconColor={config.iconColor}
              content={content}
              defaultExpanded={config.defaultExpanded}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionWrapper: {
    // Animated wrapper for fade-in
  },
});
