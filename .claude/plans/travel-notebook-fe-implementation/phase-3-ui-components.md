# Phase 3: UI Components (Day 2-3 - 8 hours)

## Objectives
- Build EmptyState component with features grid
- Build GeneratingState with progress simulation
- Build NotebookSection accordion component
- Build NotebookContent with progressive reveal animation

---

## 3.1 Empty State Component

**File:** `components/notebook/EmptyState.tsx`

```typescript
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
              <Ionicons name={feature.icon as any} size={20} color={feature.color} />
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
```

---

## 3.2 Generating State Component

**File:** `components/notebook/GeneratingState.tsx`

```typescript
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
```

---

## 3.3 Notebook Section (Accordion)

**File:** `components/notebook/NotebookSection.tsx`

```typescript
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
```

---

## 3.4 Notebook Content (with Progressive Reveal)

**File:** `components/notebook/NotebookContent.tsx`

```typescript
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
              icon={config.icon as any}
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
```

---

## Testing Phase 3

### Manual Testing Checklist

**EmptyState:**
- [ ] Renders correctly on small/medium/large devices
- [ ] Features grid displays all 5 items
- [ ] Generate button has proper touch target (44px+)
- [ ] Loading state disables button
- [ ] Icons and colors match design

**GeneratingState:**
- [ ] Progress bar animates smoothly
- [ ] Percentage updates correctly
- [ ] Step labels change as progress advances
- [ ] Checklist shows completed steps
- [ ] Tip message displays correctly

**NotebookSection:**
- [ ] Expands/collapses smoothly
- [ ] Preview text shows when collapsed
- [ ] Icon and colors correct
- [ ] Touch target large enough for mobile
- [ ] Animation works on Android and iOS

**NotebookContent:**
- [ ] Sections fade in progressively (400ms stagger)
- [ ] First 2 sections default expanded
- [ ] Empty sections don't render
- [ ] All 7 section types supported
- [ ] Re-renders correctly when notebook changes

---

## Deliverables Checklist

- [ ] `components/notebook/EmptyState.tsx` created
- [ ] `components/notebook/GeneratingState.tsx` created
- [ ] `components/notebook/NotebookSection.tsx` created
- [ ] `components/notebook/NotebookContent.tsx` created
- [ ] All components render correctly
- [ ] Animations smooth (no jank)
- [ ] Mobile-optimized (touch targets, spacing)
- [ ] Tested on iOS and Android

---

## Next Phase

**Phase 4**: Build main screen component that orchestrates all states
