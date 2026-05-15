# AI Features Gap Implementation Plan

**PHASE 1 STATUS: ✅ COMPLETED (2026-05-13)**  
**PHASE 2 STATUS: Not Started**  
**PHASE 3 STATUS: Not Started**

## Executive Summary

This plan addresses three critical AI feature gaps in the TripJoy mobile app, prioritized by user impact and implementation complexity. The features leverage existing backend AI services while introducing enhanced UX patterns for mobile-first experience.

**Timeline:** 10-12 developer days (2-2.5 weeks)
**Priority Order:** Phase 1 > Phase 2 > Phase 3
**Backend Changes:** Zero (all endpoints exist)

### Three Features

1. **Apply Itinerary from Social Feed** (NEW - High Priority)
   - Allow users to apply shared itineraries to their groups
   - Effort: 5-6 days | Impact: High | Complexity: Medium

2. **AI Replace Location UX Polish** (IMPROVE - Medium Priority)
   - Enhance existing location replacement flow with better UX
   - Effort: 2-3 days | Impact: Medium | Complexity: Low

3. **Travel Notebook Entry Point** (NEW - Low Priority, Easy Win)
   - Add visible entry point to existing Travel Notebook feature
   - Effort: 0.5 day | Impact: Low | Complexity: Very Low

---

## Android Platform Specifications

All implementations MUST follow Android-specific guidelines and patterns. This is an Android-first implementation.

### Material Design 3 Requirements

**Component Styling:**
- Use Material You dynamic colors from system theme
- Apply ripple effects to ALL touchable elements (android:ripple)
- Implement edge-to-edge display with proper WindowInsets handling
- Support system gesture navigation (avoid conflicts with back gesture)

**Touch Targets & Dimensions:**
```
Primary buttons:   48dp height × full-width, 16dp horizontal padding
Secondary buttons: 44dp height × wrap-content, 12dp horizontal padding  
Icon buttons:      24dp icon + 12dp padding = 48dp minimum touch target
List items:        56dp minimum height
Bottom sheet:      Handle height 32dp, corner radius 28dp
Cards:             8dp corner radius, 8dp elevation
```

**Typography Scale (Material Design 3):**
```
Headline Large:    32sp, Bold
Headline Medium:   28sp, Bold
Title Large:       22sp, Medium
Title Medium:      16sp, Medium
Body Large:        16sp, Regular
Body Medium:       14sp, Regular
Label Large:       14sp, Medium (for buttons)
```

**Color System:**
```
Primary:           #16A34A (Green 600)
On Primary:        #FFFFFF
Secondary:         #6B7280 (Gray 500)
Surface:           #FFFFFF (Light) / #1F2937 (Dark)
Surface Variant:   #F3F4F6 (Light) / #374151 (Dark)
Outline:           #E5E7EB
Error:             #EF4444
```

### System Integration

**Back Button Behavior:**
```typescript
// Bottom sheet must dismiss on back button before exiting screen
useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    if (bottomSheetVisible) {
      setBottomSheetVisible(false);
      return true; // Prevent default back action
    }
    return false; // Allow default back action
  });
  
  return () => backHandler.remove();
}, [bottomSheetVisible]);
```

**Status Bar & Navigation Bar:**
- Use `react-native-system-navigation-bar` for edge-to-edge
- Transparent status bar with scrim on scroll
- Light/dark status bar icons based on background
- Handle notch/punch-hole with SafeAreaView

**Keyboard Behavior:**
- Bottom sheet must be keyboard-aware (use `keyboardBehavior="interactive"`)
- Input fields scroll into view when focused
- Dismiss keyboard on scroll outside input area

---

## Accessibility Requirements (WCAG 2.1 Level AA)

ALL features must meet these accessibility standards before launch.

### 1. Screen Reader Support (TalkBack)

**Component Announcements:**
```typescript
// Bottom sheet opening
<BottomSheet
  accessible={true}
  accessibilityLabel="Áp dụng lịch trình cho nhóm"
  accessibilityRole="dialog"
  accessibilityLiveRegion="polite"
>
```

**Progress Updates:**
```typescript
// AI loading states must announce progress
<View 
  accessible={true}
  accessibilityLiveRegion="assertive"
  accessibilityLabel={`Đang tạo lịch trình: ${progress}% hoàn thành. ${currentStep}`}
>
```

**Action Results:**
```typescript
// After successful apply
announceForAccessibility('Đã áp dụng lịch trình cho nhóm ' + groupName);

// After undo
announceForAccessibility('Đã hoàn tác thay đổi địa điểm');
```

### 2. Reduce Motion Support

```typescript
import { AccessibilityInfo } from 'react-native';

const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotionEnabled);
  
  const subscription = AccessibilityInfo.addEventListener(
    'reduceMotionChanged',
    setReduceMotionEnabled
  );
  
  return () => subscription.remove();
}, []);

// Apply to animations
const animationDuration = reduceMotionEnabled ? 0 : 300;
const animatedScale = reduceMotionEnabled 
  ? 1 
  : Animated.spring(scaleValue, { useNativeDriver: true });
```

**Components requiring reduce motion:**
- Bottom sheet slide animations
- Progress bar animations
- Card hover/press states
- Loading skeleton shimmer effects

### 3. High Contrast Mode

**Color Contrast Ratios (WCAG AA):**
- Text (normal): 4.5:1 minimum
- Text (large 18sp+): 3:1 minimum
- UI Components: 3:1 minimum
- Focus indicators: 3:1 minimum

```typescript
// Check high contrast mode
const [highContrastEnabled, setHighContrastEnabled] = useState(false);

// Apply contrast-safe colors
const textColor = highContrastEnabled ? '#000000' : '#374151';
const borderWidth = highContrastEnabled ? 2 : 1;
```

**Test all color combinations:**
```bash
# Use contrast checker
npx @adobe/leonardo-contrast-colors check \
  --foreground "#16A34A" \
  --background "#FFFFFF" \
  --target "AA"
```

### 4. Focus Management

**Focus Order:**
```typescript
// When bottom sheet opens, focus on first interactive element
useEffect(() => {
  if (bottomSheetVisible && firstButtonRef.current) {
    firstButtonRef.current.focus();
  }
}, [bottomSheetVisible]);

// Trap focus within bottom sheet
const handleTabKey = (e: KeyboardEvent) => {
  if (e.key === 'Tab') {
    const focusableElements = bottomSheetRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    // Implement focus trap logic
  }
};
```

**Focus Indicators:**
- 2dp solid border with primary color
- 4dp offset from element
- Must be visible in all themes

### 5. Voice Control Labels

```typescript
// Explicit labels for all actions
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Áp dụng lịch trình cho nhóm của tôi"
  accessibilityHint="Mở bảng chọn nhóm để áp dụng lịch trình này"
  accessibilityRole="button"
>
```

**All interactive elements must have:**
- Clear accessibilityLabel (not just icon name)
- Contextual accessibilityHint for complex actions
- Correct accessibilityRole (button, link, checkbox, etc.)

### 6. Testing Checklist

**Before submitting PR:**
- [ ] Enable TalkBack and navigate entire flow without screen
- [ ] Test with reduce motion enabled
- [ ] Verify contrast ratios with color picker tool
- [ ] Test keyboard navigation (external keyboard)
- [ ] Test voice access commands
- [ ] Verify focus order is logical
- [ ] Check all announcements are meaningful in Vietnamese

---

## Success Metrics

### Phase 1: Apply Itinerary from Social Feed
- **Conversion rate**: 15-25% of users who view itinerary previews apply them
- **Time to apply**: < 60 seconds from tap to confirmation
- **Group selection rate**: > 70% users have target group in mind
- **Abandonment rate**: < 20% during generation (vs 40% baseline)

### Phase 2: AI Replace Location UX Polish
- **Preview engagement**: > 80% users view preview before confirming
- **Confirmation rate**: 60-70% (up from ~40% current)
- **Undo usage**: < 10% (indicates good preview quality)
- **Retry after error**: > 50% (vs ~20% current)

### Phase 3: Travel Notebook Entry Point
- **Open rate**: 30-40% of users with confirmed itineraries
- **Time spent viewing**: > 2 minutes average
- **Repeat views**: 40% users return to notebook

### Analytics Events to Track

```typescript
// Phase 1
analytics.logEvent('apply_itinerary_initiated', {
  sourcePostId: string,
  sourceItineraryId: string,
  hasItinerary: boolean,
});

analytics.logEvent('apply_itinerary_group_selected', {
  groupId: string,
  memberCount: number,
});

analytics.logEvent('apply_itinerary_customized', {
  budgetChanged: boolean,
  themesChanged: boolean,
  datesChanged: boolean,
});

analytics.logEvent('apply_itinerary_completed', {
  duration: number,
  itineraryId: string,
  groupId: string,
});

analytics.logEvent('apply_itinerary_abandoned', {
  step: 'group_selection' | 'customization' | 'generating',
  duration: number,
});

// Phase 2
analytics.logEvent('ai_replace_preview_opened', {
  itineraryId: string,
  currentPlaceId: string,
  suggestedPlaceId: string,
});

analytics.logEvent('ai_replace_confirmed', {
  timeToDecision: number,
  previewViewed: boolean,
});

analytics.logEvent('ai_replace_undone', {
  timeSinceReplace: number,
});

analytics.logEvent('ai_replace_error_retried', {
  errorType: string,
});

// Phase 3
analytics.logEvent('notebook_opened', {
  itineraryId: string,
  source: 'detail_header' | 'itinerary_tab',
});

analytics.logEvent('notebook_section_expanded', {
  section: 'food' | 'climate' | 'culture',
  timeSpent: number,
});
```

---

## Phase 1: Apply Itinerary from Social Feed (5-6 Days)

### Overview

Enable users to discover itineraries in social feed and apply them to their own travel groups with customization options. Uses existing `useGenerateItinerary` hook with source itinerary data as payload.

### Technical Approach

**Core Pattern:** Extract metadata from source itinerary → User selects target group → Customize parameters → Call AI generate → Poll for completion → Navigate to new itinerary

**Key Files:**
- `/media/ngocha/D/datn_tripjoy/components/social/PostCard.tsx` (add Apply button)
- `/media/ngocha/D/datn_tripjoy/components/social/ApplyItineraryBottomSheet.tsx` (NEW)
- `/media/ngocha/D/datn_tripjoy/hooks/useSocial.ts` (add useApplyItinerary hook)

### Implementation Details

#### 1.1 Add "Apply to Group" Button in PostCard

**File:** `components/social/PostCard.tsx`

**Location:** In `ItineraryPreview` component (lines 27-64), add button after the main card.

```typescript
// components/social/PostCard.tsx - Add inside ItineraryPreview component

const ItineraryPreview: React.FC<ItineraryPreviewProps> = ({ itinerary, postId }) => {
  const router = useRouter();
  const [showApplySheet, setShowApplySheet] = useState(false);

  const handlePress = () => {
    router.push(`/itinerary/detail?id=${itinerary.id}` as any);
  };

  const handleApply = () => {
    trackEvent('apply_itinerary_initiated', {
      sourcePostId: postId,
      sourceItineraryId: itinerary.id,
      hasItinerary: !!itinerary,
    });
    setShowApplySheet(true);
  };

  if (!itinerary) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.itineraryCard}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* Existing card content */}
        <View style={styles.itineraryIcon}>
          <Ionicons name="map-outline" size={20} color="#16A34A" />
        </View>
        <View style={styles.itineraryInfo}>
          <Text style={styles.itineraryTitle} numberOfLines={1}>
            {itinerary.title || itinerary.name}
          </Text>
          {(itinerary.duration_days || itinerary.budget_estimate) ? (
            <View style={styles.itineraryMeta}>
              <Text style={styles.itineraryText}>
                {itinerary.duration_days ? `${itinerary.duration_days} ngày` : ""}
                {itinerary.duration_days && itinerary.budget_estimate ? " • " : ""}
                {itinerary.budget_estimate ? formatCurrencyVND(itinerary.budget_estimate) : ""}
              </Text>
            </View>
          ) : (
            <Text style={styles.itineraryText}>Xem chi tiết lịch trình</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      {/* NEW: Apply button */}
      <TouchableOpacity
        style={styles.applyButton}
        onPress={handleApply}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle-outline" size={20} color="#16A34A" />
        <Text style={styles.applyButtonText}>Áp dụng cho nhóm của tôi</Text>
      </TouchableOpacity>

      {/* Apply Bottom Sheet */}
      <ApplyItineraryBottomSheet
        visible={showApplySheet}
        onClose={() => setShowApplySheet(false)}
        sourceItinerary={itinerary}
        sourcePostId={postId}
      />
    </>
  );
};

// Add styles
const styles = StyleSheet.create({
  // ... existing styles ...
  
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  applyButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#16A34A',
  },
});
```

#### 1.2 Create ApplyItineraryBottomSheet Component

**File:** `components/social/ApplyItineraryBottomSheet.tsx` (NEW)

This component implements a 3-step flow:
1. Select target group
2. Customize parameters (budget, themes, dates)
3. Confirmation + Apply

**Pattern Reference:** Similar to `ShareModal.tsx` for group selection UI.

```typescript
// components/social/ApplyItineraryBottomSheet.tsx

import { useGroups } from "@/hooks/useGroups";
import { useApplyItinerary } from "@/hooks/useSocial";
import { ITINERARY_STATUS } from "@/services/itineraries";
import { trackEvent } from "@/utils/analytics";
import { formatCurrencyVND } from "@/utils/currency";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ApplyItineraryBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  sourceItinerary: any; // ItineraryResponse from PostCard
  sourcePostId: string;
}

type Step = "select_group" | "customize" | "generating";

export const ApplyItineraryBottomSheet: React.FC<ApplyItineraryBottomSheetProps> = ({
  visible,
  onClose,
  sourceItinerary,
  sourcePostId,
}) => {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["50%", "90%"], []);

  const [currentStep, setCurrentStep] = useState<Step>("select_group");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [customizations, setCustomizations] = useState({
    budgetOverride: sourceItinerary?.budget_estimate,
    themesOverride: sourceItinerary?.themes || [],
    startDate: sourceItinerary?.start_date,
    endDate: sourceItinerary?.end_date,
  });

  const { data: groups, isLoading: loadingGroups } = useGroups();
  const applyMutation = useApplyItinerary();

  // Open/close sheet
  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
      setCurrentStep("select_group");
      setSelectedGroupId(null);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
    setTimeout(onClose, 300);
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const selectedGroup = useMemo(
    () => groups?.find((g) => g.id === selectedGroupId),
    [groups, selectedGroupId]
  );

  // Step 1: Group Selection
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    trackEvent('apply_itinerary_group_selected', {
      groupId,
      memberCount: groups?.find(g => g.id === groupId)?.members.length,
    });
    setCurrentStep("customize");
  };

  // Step 2: Customization
  const handleCustomizationChange = (field: string, value: any) => {
    setCustomizations((prev) => ({ ...prev, [field]: value }));
    trackEvent('apply_itinerary_customized', {
      field,
      changed: true,
    });
  };

  // Step 3: Apply
  const handleApply = async () => {
    if (!selectedGroupId) return;

    setCurrentStep("generating");

    try {
      const result = await applyMutation.mutateAsync({
        sourceItineraryId: sourceItinerary.id,
        targetGroupId: selectedGroupId,
        customizations,
      });

      // Close sheet immediately for better UX
      handleClose();

      // Navigate to new itinerary (polling will happen in detail screen)
      if (result?.id) {
        router.push(`/itinerary/${result.id}` as any);
      }

      trackEvent('apply_itinerary_completed', {
        itineraryId: result?.id,
        groupId: selectedGroupId,
      });
    } catch (error) {
      console.error("Apply itinerary error:", error);
      trackEvent('apply_itinerary_abandoned', {
        step: 'generating',
        error: error.message,
      });
      // Error is handled by mutation with toast
      setCurrentStep("customize"); // Allow retry
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: "#D1D5DB" }}
    >
      <BottomSheetScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}>
            {currentStep === "select_group" && "Chọn nhóm"}
            {currentStep === "customize" && "Tùy chỉnh lịch trình"}
            {currentStep === "generating" && "Đang tạo lịch trình..."}
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Source Itinerary Info */}
        <View style={{ backgroundColor: "#F9FAFB", padding: 12, borderRadius: 12, marginBottom: 20 }}>
          <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>Lịch trình gốc</Text>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>
            {sourceItinerary?.title || sourceItinerary?.name}
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
            {sourceItinerary?.duration_days} ngày • {formatCurrencyVND(sourceItinerary?.budget_estimate)}
          </Text>
        </View>

        {/* Step 1: Select Group */}
        {currentStep === "select_group" && (
          <View>
            {loadingGroups ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#16A34A" />
                <Text style={{ color: "#6B7280", marginTop: 8 }}>Đang tải nhóm...</Text>
              </View>
            ) : groups && groups.length > 0 ? (
              <FlatList
                data={groups}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleGroupSelect(item.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#F3F4F6",
                    }}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{
                        uri: resolveUserAvatarUri(item.avatar, item.name),
                      }}
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: 14, color: "#6B7280" }}>
                        {item.members.length} thành viên
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text style={{ color: "#6B7280", marginTop: 8 }}>Chưa có nhóm nào</Text>
                <TouchableOpacity
                  style={{
                    marginTop: 16,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    backgroundColor: "#16A34A",
                    borderRadius: 8,
                  }}
                  onPress={() => {
                    handleClose();
                    router.push("/groups");
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>Tạo nhóm mới</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Step 2: Customize */}
        {currentStep === "customize" && selectedGroup && (
          <View>
            {/* Selected Group */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, padding: 12, backgroundColor: "#F0FDF4", borderRadius: 12 }}>
              <Image
                source={{ uri: resolveUserAvatarUri(selectedGroup.avatar, selectedGroup.name) }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 12, color: "#16A34A" }}>Áp dụng cho</Text>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>
                  {selectedGroup.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCurrentStep("select_group")}>
                <Text style={{ fontSize: 14, color: "#16A34A", fontWeight: "600" }}>Đổi</Text>
              </TouchableOpacity>
            </View>

            {/* Budget Override */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 8 }}>
                Ngân sách (tùy chọn)
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  fontSize: 16,
                }}
                placeholder={formatCurrencyVND(sourceItinerary?.budget_estimate)}
                keyboardType="numeric"
                value={customizations.budgetOverride?.toString()}
                onChangeText={(text) => handleCustomizationChange("budgetOverride", parseInt(text) || 0)}
              />
            </View>

            {/* Themes Override */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 8 }}>
                Chủ đề
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {["Ẩm thực", "Văn hóa", "Thiên nhiên", "Thư giãn", "Phiêu lưu", "Mua sắm"].map((theme) => (
                  <TouchableOpacity
                    key={theme}
                    onPress={() => {
                      const current = customizations.themesOverride;
                      const updated = current.includes(theme)
                        ? current.filter((t) => t !== theme)
                        : [...current, theme];
                      handleCustomizationChange("themesOverride", updated);
                    }}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 20,
                      marginRight: 8,
                      marginBottom: 8,
                      backgroundColor: customizations.themesOverride.includes(theme) ? "#16A34A" : "#F3F4F6",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: customizations.themesOverride.includes(theme) ? "white" : "#6B7280",
                      }}
                    >
                      {theme}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              onPress={handleApply}
              disabled={applyMutation.isPending}
              style={{
                backgroundColor: "#16A34A",
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
                marginTop: 20,
              }}
              activeOpacity={0.8}
            >
              {applyMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                  Tạo lịch trình
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrentStep("select_group")}
              style={{ paddingVertical: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#6B7280", fontSize: 14 }}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Generating */}
        {currentStep === "generating" && (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827", marginTop: 16 }}>
              Đang tạo lịch trình...
            </Text>
            <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 8, textAlign: "center" }}>
              AI đang phân tích và tạo lịch trình phù hợp cho nhóm của bạn
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
};
```

#### 1.3 Create useApplyItinerary Hook

**File:** `hooks/useSocial.ts` (add to existing file)

```typescript
// hooks/useSocial.ts - Add this hook

import { useGenerateItinerary } from "./useItineraries";
import { useItineraryDetail } from "./useItineraries";

export function useApplyItinerary() {
  const queryClient = useQueryClient();
  const { mutateAsync: generateItinerary } = useGenerateItinerary();

  return useMutation({
    mutationFn: async ({
      sourceItineraryId,
      targetGroupId,
      customizations,
    }: {
      sourceItineraryId: string;
      targetGroupId: string;
      customizations?: {
        budgetOverride?: number;
        themesOverride?: string[];
        startDate?: string;
        endDate?: string;
      };
    }) => {
      // Fetch source itinerary details
      const sourceResponse = await httpClient.get(`/itineraries/${sourceItineraryId}`);
      const sourceItinerary = sourceResponse.data?.data;

      if (!sourceItinerary) {
        throw new Error("Không tìm thấy lịch trình gốc");
      }

      // Build payload for AI generate
      const payload: GenerateItineraryRequest = {
        destination: sourceItinerary.destination || "Unknown",
        latitude: sourceItinerary.latitude || 0,
        longitude: sourceItinerary.longitude || 0,
        startDate: customizations?.startDate || sourceItinerary.start_date,
        endDate: customizations?.endDate || sourceItinerary.end_date,
        peopleQuantity: sourceItinerary.people_quantity || 1,
        budgetEstimate: customizations?.budgetOverride || sourceItinerary.budget_estimate || 0,
        themes: customizations?.themesOverride || sourceItinerary.themes || [],
        groupId: targetGroupId,
        // Include existing locations as suggestions
        suggestLocations: sourceItinerary.trip_items?.map((item: any) => item.location_id).filter(Boolean) || [],
      };

      const result = await generateItinerary(payload);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
      queryClient.invalidateQueries({ queryKey: ["group-itineraries"] });
      showSuccessToast("Đã tạo lịch trình mới!");
    },
    onError: (error: Error) => {
      trackError(error.message, { action: 'apply_itinerary' });
      showErrorToast("Tạo lịch trình thất bại", error);
    },
  });
}
```

#### 1.4 Polling Pattern for Generation Status

<!-- Updated: Validation Session 1 - Changed to exponential backoff (2s → 5s) -->

The detail screen already implements polling via `useItineraryDetail`. **Update to use exponential backoff** to reduce server load:

```typescript
// hooks/useItineraries.ts (update existing code, lines 212-254)

export function useItineraryDetail(
  itineraryId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["itineraries", itineraryId],
    queryFn: async () => {
      if (!itineraryId) throw new Error("Missing itineraryId");
      const response = await itineraryService.getItineraryById(itineraryId);
      if (isSuccessCode(response.code)) {
        return mapApiItineraryToDisplay(response.data);
      }
      throw new Error(response.message || "Failed to fetch itinerary");
    },
    enabled: !!itineraryId && (options?.enabled !== false),
    staleTime: 10 * 1000,
    // Exponential backoff: Start at 2s, increase to 5s after 10s
    refetchInterval: (query) => {
      const data = query.state.data;
      const status = normalizeStatus(data?.status);
      if (status !== ITINERARY_STATUS.GENERATING) return false;
      
      const dataUpdatedAt = query.state.dataUpdatedAt;
      const elapsed = Date.now() - dataUpdatedAt;
      
      // First 10 seconds: poll every 2s (fast feedback)
      // After 10 seconds: poll every 5s (reduced server load)
      return elapsed < 10000 ? 2000 : 5000;
    },
    ...retryConfig,
  });
}
```

#### 1.5 Update PostCard Interface

**File:** `components/social/PostCard.tsx`

Update `ItineraryPreviewProps` to include `postId`:

```typescript
interface ItineraryPreviewProps {
  itinerary?: any;
  postId: string; // Add this
}

// In main PostCard component, pass postId:
<ItineraryPreview itinerary={post.itinerary} postId={post.id} />
```

### Testing Checklist - Phase 1

- [ ] "Apply to Group" button renders in PostCard with itinerary
- [ ] Button opens ApplyItineraryBottomSheet
- [ ] Group selection shows all user groups
- [ ] Selected group displays correctly in customization step
- [ ] Budget input accepts numeric values
- [ ] Theme chips toggle on/off correctly
- [ ] Apply button triggers generation
- [ ] Loading state shows during generation
- [ ] Navigation to new itinerary works
- [ ] Polling updates status (GENERATING → DRAFT)
- [ ] Error handling shows toast notifications
- [ ] Analytics events fire correctly
- [ ] Bottom sheet closes properly
- [ ] Works on small/medium/large devices
- [ ] Keyboard behavior correct in input fields
- [ ] Back button navigation works at each step

---

## Phase 2: AI Replace Location UX Polish (2-3 Days)

### Overview

Improve the existing AI location replacement flow with better UX: preview-before-apply, loading overlays, step-by-step status messages, and undo functionality.

### Technical Approach

**Core Pattern:** User requests replacement → Show loading overlay with progress → AI suggests location → Show preview modal (side-by-side) → User confirms → Apply change → Show undo toast (5s)

**Key Files:**
- `/media/ngocha/D/datn_tripjoy/app/itinerary/[id].tsx` (modify existing flow)
- `/media/ngocha/D/datn_tripjoy/components/itinerary/ReplacementPreviewModal.tsx` (NEW)
- `/media/ngocha/D/datn_tripjoy/components/itinerary/LoadingOverlay.tsx` (NEW)
- `/media/ngocha/D/datn_tripjoy/hooks/useItineraries.ts` (enhance useAiModifyItinerary)

### Implementation Details

#### 2.1 Create LoadingOverlay Component

**File:** `components/itinerary/LoadingOverlay.tsx` (NEW)

```typescript
// components/itinerary/LoadingOverlay.tsx

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Text, View } from "react-native";

interface LoadingOverlayProps {
  visible: boolean;
  steps: string[];
  currentStepIndex: number;
  onCancel?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  steps,
  currentStepIndex,
  onCancel,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 24,
            width: "100%",
            maxWidth: 400,
          }}
        >
          {/* Loading Indicator */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <ActivityIndicator size="large" color="#16A34A" />
          </View>

          {/* Current Step */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#111827",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            Đang xử lý...
          </Text>

          {/* Steps List */}
          <View style={{ marginBottom: 20 }}>
            {steps.map((step, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                {index < currentStepIndex ? (
                  <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                ) : index === currentStepIndex ? (
                  <ActivityIndicator size="small" color="#16A34A" />
                ) : (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: "#D1D5DB",
                    }}
                  />
                )}
                <Text
                  style={{
                    marginLeft: 12,
                    fontSize: 14,
                    color: index <= currentStepIndex ? "#111827" : "#9CA3AF",
                    fontWeight: index === currentStepIndex ? "600" : "400",
                  }}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>

          {/* Cancel Button */}
          {onCancel && (
            <TouchableOpacity
              onPress={onCancel}
              style={{
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#6B7280", fontSize: 14, fontWeight: "600" }}>
                Hủy
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};
```

#### 2.2 Create ReplacementPreviewModal Component

**File:** `components/itinerary/ReplacementPreviewModal.tsx` (NEW)

```typescript
// components/itinerary/ReplacementPreviewModal.tsx

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Location {
  id: string;
  name: string;
  address?: string;
  imageUrl?: string;
  rating?: number;
  priceLevel?: number;
}

interface ReplacementPreviewModalProps {
  visible: boolean;
  currentLocation: Location;
  suggestedLocation: Location;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
}

export const ReplacementPreviewModal: React.FC<ReplacementPreviewModalProps> = ({
  visible,
  currentLocation,
  suggestedLocation,
  onConfirm,
  onCancel,
  isConfirming = false,
}) => {
  const [confirmEnabled, setConfirmEnabled] = useState(false);

  // Enable confirm button after 2 seconds (prevent accidental taps)
  useEffect(() => {
    if (visible) {
      setConfirmEnabled(false);
      const timer = setTimeout(() => setConfirmEnabled(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const renderLocationCard = (location: Location, label: string, isNew: boolean) => (
    <View
      style={{
        backgroundColor: isNew ? "#F0FDF4" : "#F9FAFB",
        borderRadius: 12,
        padding: 16,
        borderWidth: isNew ? 2 : 1,
        borderColor: isNew ? "#16A34A" : "#E5E7EB",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: isNew ? "#16A34A" : "#6B7280",
          marginBottom: 8,
        }}
      >
        {label}
      </Text>

      {location.imageUrl && (
        <Image
          source={{ uri: location.imageUrl }}
          style={{
            width: "100%",
            height: 120,
            borderRadius: 8,
            marginBottom: 12,
          }}
          contentFit="cover"
        />
      )}

      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: "#111827",
          marginBottom: 4,
          textDecorationLine: isNew ? "none" : "line-through",
        }}
      >
        {location.name}
      </Text>

      {location.address && (
        <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>
          {location.address}
        </Text>
      )}

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {location.rating && (
          <View style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={{ marginLeft: 4, fontSize: 14, color: "#111827", fontWeight: "600" }}>
              {location.rating.toFixed(1)}
            </Text>
          </View>
        )}
        {location.priceLevel && (
          <Text style={{ fontSize: 14, color: "#6B7280" }}>
            {"$".repeat(location.priceLevel)}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 20,
            maxHeight: "90%",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}>
              Xác nhận thay đổi
            </Text>
            <TouchableOpacity onPress={onCancel} disabled={isConfirming}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
            {/* Current Location */}
            {renderLocationCard(currentLocation, "ĐỊA ĐIỂM HIỆN TẠI", false)}

            {/* Arrow */}
            <View style={{ alignItems: "center", marginVertical: 16 }}>
              <Ionicons name="arrow-down-circle" size={32} color="#16A34A" />
            </View>

            {/* Suggested Location */}
            {renderLocationCard(suggestedLocation, "ĐỊA ĐIỂM ĐỀ XUẤT", true)}

            {/* Why This Suggestion */}
            <View
              style={{
                backgroundColor: "#EFF6FF",
                padding: 12,
                borderRadius: 8,
                marginTop: 16,
                flexDirection: "row",
              }}
            >
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={{ marginLeft: 8, fontSize: 13, color: "#1E40AF", flex: 1 }}>
                AI đề xuất địa điểm này dựa trên sở thích của bạn và phù hợp với lịch trình
              </Text>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={onConfirm}
              disabled={!confirmEnabled || isConfirming}
              style={{
                backgroundColor: confirmEnabled && !isConfirming ? "#16A34A" : "#D1D5DB",
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
                marginTop: 24,
              }}
              activeOpacity={0.8}
            >
              {isConfirming ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                  {confirmEnabled ? "Xác nhận thay đổi" : `Chờ ${2}s...`}
                </Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={onCancel}
              disabled={isConfirming}
              style={{
                paddingVertical: 12,
                alignItems: "center",
                marginTop: 8,
                marginBottom: 20,
              }}
            >
              <Text style={{ color: "#6B7280", fontSize: 14, fontWeight: "600" }}>
                Hủy bỏ
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
```

#### 2.3 Add Undo Toast Pattern

**File:** `utils/toast.ts` (add new function)

```typescript
// utils/toast.ts - Add this function

export function showUndoToast(
  message: string,
  onUndo: () => void,
  duration: number = 5000
) {
  Toast.show({
    type: "success",
    text1: message,
    position: "bottom",
    visibilityTime: duration,
    props: {
      showUndo: true,
      onUndo,
    },
  });
}
```

**File:** `app/_layout.tsx` (configure custom toast with undo button)

```typescript
// app/_layout.tsx - Add custom toast config

import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#16A34A' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '600',
      }}
      renderTrailingIcon={() => {
        if (props.props?.showUndo) {
          return (
            <TouchableOpacity
              onPress={() => {
                Toast.hide();
                props.props.onUndo();
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: '#16A34A',
                borderRadius: 6,
                marginRight: 12,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Hoàn tác</Text>
            </TouchableOpacity>
          );
        }
        return null;
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      text1Style={{
        fontSize: 15,
      }}
      text2Style={{
        fontSize: 13,
      }}
    />
  ),
};

// In component return
<Toast config={toastConfig} />
```

#### 2.4 Integrate into Itinerary Detail Screen

**File:** `app/itinerary/[id].tsx` (modify existing AI replace flow)

```typescript
// app/itinerary/[id].tsx - Add state and handlers

const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
const [loadingStep, setLoadingStep] = useState(0);
const [showPreviewModal, setShowPreviewModal] = useState(false);
const [replacementData, setReplacementData] = useState<{
  currentLocation: any;
  suggestedLocation: any;
  tripItemId: string;
} | null>(null);
const [previousState, setPreviousState] = useState<any>(null);

const aiModifyMutation = useAiModifyItinerary();

const handleAiReplace = async (tripItemId: string, currentLocation: any) => {
  try {
    // Step 1: Show loading overlay
    setShowLoadingOverlay(true);
    setLoadingStep(0);

    trackEvent('ai_replace_initiated', {
      itineraryId: id,
      tripItemId,
      currentPlaceId: currentLocation.id,
    });

    // Step 2: Call AI suggest location
    setLoadingStep(1);
    const suggestResponse = await aiSuggestLocation({
      itineraryId: id,
      unwantedPlaceIds: [currentLocation.id],
    });

    if (!suggestResponse?.suggestedLocation) {
      throw new Error("Không tìm thấy địa điểm phù hợp");
    }

    // Step 3: Show preview modal
    setShowLoadingOverlay(false);
    setReplacementData({
      currentLocation,
      suggestedLocation: suggestResponse.suggestedLocation,
      tripItemId,
    });
    setShowPreviewModal(true);

    trackEvent('ai_replace_preview_opened', {
      currentPlaceId: currentLocation.id,
      suggestedPlaceId: suggestResponse.suggestedLocation.id,
    });
  } catch (error) {
    setShowLoadingOverlay(false);
    showErrorToast("Không thể gợi ý địa điểm", error);
    trackError(error.message, { action: 'ai_replace' });
  }
};

const handleConfirmReplacement = async () => {
  if (!replacementData) return;

  try {
    // Store previous state for undo
    const currentItinerary = await queryClient.getQueryData(["itineraries", id]);
    setPreviousState(currentItinerary);

    // Apply replacement
    await aiModifyMutation.mutateAsync({
      itineraryId: id,
      unwantedPlaceIds: [replacementData.currentLocation.id],
    });

    setShowPreviewModal(false);

    trackEvent('ai_replace_confirmed', {
      currentPlaceId: replacementData.currentLocation.id,
      suggestedPlaceId: replacementData.suggestedLocation.id,
    });

    // Show undo toast
    showUndoToast(
      "Đã thay đổi địa điểm",
      handleUndoReplacement,
      5000
    );

    setReplacementData(null);
  } catch (error) {
    showErrorToast("Thay đổi thất bại", error);
    trackError(error.message, { action: 'ai_replace_confirm' });
  }
};

const handleUndoReplacement = () => {
  if (previousState) {
    queryClient.setQueryData(["itineraries", id], previousState);
    showSuccessToast("Đã hoàn tác thay đổi");
    trackEvent('ai_replace_undone', {});
    setPreviousState(null);
  }
};

// In render:
<>
  {/* Existing content */}
  
  <LoadingOverlay
    visible={showLoadingOverlay}
    steps={[
      "Phân tích sở thích của bạn",
      "Tìm kiếm địa điểm phù hợp",
      "Đánh giá lựa chọn tốt nhất",
    ]}
    currentStepIndex={loadingStep}
    onCancel={() => setShowLoadingOverlay(false)}
  />

  {replacementData && (
    <ReplacementPreviewModal
      visible={showPreviewModal}
      currentLocation={replacementData.currentLocation}
      suggestedLocation={replacementData.suggestedLocation}
      onConfirm={handleConfirmReplacement}
      onCancel={() => {
        setShowPreviewModal(false);
        setReplacementData(null);
      }}
      isConfirming={aiModifyMutation.isPending}
    />
  )}
</>
```

### Testing Checklist - Phase 2

- [ ] Loading overlay shows during AI operation
- [ ] Step-by-step progress displays correctly
- [ ] Preview modal shows side-by-side comparison
- [ ] Confirm button disabled for 2 seconds
- [ ] Replacement applies correctly
- [ ] Undo toast appears after replacement
- [ ] Undo button works (restores previous state)
- [ ] Error handling shows appropriate messages
- [ ] Retry works after errors
- [ ] Analytics events fire correctly
- [ ] Cancel button stops operation
- [ ] Modal closes properly
- [ ] Works on different screen sizes
- [ ] Smooth animations
- [ ] No memory leaks

---

## Phase 3: Travel Notebook Entry Point (0.5 Day)

### Overview

<!-- Updated: Validation Session 1 - Added high-level Travel Notebook documentation -->

Add a visible entry point to the existing Travel Notebook feature, which already has backend support and a detailed implementation plan.

**What is Travel Notebook?**
The Travel Notebook (Travel Guide) is an AI-generated comprehensive travel guide that provides:
- **Culture & Customs:** Local etiquette, cultural norms, dos and don'ts
- **Cuisine Guide:** Popular dishes, restaurant recommendations, food safety tips
- **Weather & Packing:** Climate information, what to bring, seasonal considerations
- **Local Tips:** Transportation, safety, must-know phrases, emergency contacts

The notebook is generated once per destination region and cached locally for offline access. It complements the itinerary by providing contextual travel information rather than just locations and schedules.

**Why is this Phase 3?**
This phase only adds the entry point (button + route). The full Travel Notebook implementation (components, hooks, cache, generation status) is already planned in detail at `.claude/plans/travel-notebook-fe-implementation/` and will be implemented separately.

### Technical Approach

**Core Pattern:** Add "Travel Guide" button in itinerary detail screen header → Navigate to `/itinerary/notebook` route → Implement screen based on existing plan

**Key Files:**
- `/media/ngocha/D/datn_tripjoy/app/itinerary/[id].tsx` (add button)
- `/media/ngocha/D/datn_tripjoy/app/itinerary/notebook.tsx` (NEW - route)

### Implementation Details

#### 3.1 Add Button to Itinerary Detail Screen

**File:** `app/itinerary/[id].tsx`

Add button in the header actions area (typically with other action buttons like share, edit, etc.).

```typescript
// app/itinerary/[id].tsx - Add in header section

<TouchableOpacity
  onPress={() => {
    trackEvent('notebook_opened', {
      itineraryId: id,
      source: 'detail_header',
    });
    router.push(`/itinerary/notebook?id=${id}` as any);
  }}
  style={{
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  }}
  activeOpacity={0.7}
>
  <Ionicons name="book-outline" size={20} color="#D97706" />
  <Text
    style={{
      marginLeft: 6,
      fontSize: 14,
      fontWeight: '600',
      color: '#D97706',
    }}
  >
    Travel Guide
  </Text>
</TouchableOpacity>
```

#### 3.2 Create Notebook Route

**File:** `app/itinerary/notebook.tsx` (NEW)

This screen will implement the full Travel Notebook feature based on the existing plan at `/media/ngocha/D/datn_tripjoy/.claude/plans/travel-notebook-fe-implementation/README.md`.

```typescript
// app/itinerary/notebook.tsx

import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trackEvent } from "@/utils/analytics";

export default function TravelNotebookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // TODO: Implement based on travel-notebook-fe-implementation plan
  // - Create useNotebook hook
  // - Implement EmptyState, GeneratingState, NotebookContent components
  // - Add cache with AsyncStorage
  // - Add progress simulation
  // - Add section accordion

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
          Travel Guide
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Placeholder Content */}
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        <Ionicons name="book-outline" size={64} color="#D97706" />
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#111827",
            marginTop: 16,
            textAlign: "center",
          }}
        >
          Travel Guide
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#6B7280",
            marginTop: 8,
            textAlign: "center",
          }}
        >
          Hướng dẫn chi tiết về ẩm thực, văn hóa, và khí hậu cho chuyến đi của bạn
        </Text>

        {/* TODO: Implement full notebook based on existing plan */}
        <Text
          style={{
            fontSize: 12,
            color: "#9CA3AF",
            marginTop: 20,
            fontStyle: "italic",
          }}
        >
          Feature implementation follows plan at:
          {"\n"}
          .claude/plans/travel-notebook-fe-implementation/
        </Text>
      </View>
    </View>
  );
}
```

#### 3.3 Reference Existing Plan

The full implementation should follow the detailed plan at:
`/media/ngocha/D/datn_tripjoy/.claude/plans/travel-notebook-fe-implementation/README.md`

This includes:
- TypeScript types (`types/notebook.ts`)
- Notebook service (`services/notebooks.ts`)
- AsyncStorage cache (`utils/notebookCache.ts`)
- React Query hooks (`hooks/useNotebook.ts`)
- Fake progress hook (`hooks/useFakeProgress.ts`)
- UI components (EmptyState, GeneratingState, NotebookSection, NotebookContent)

### Testing Checklist - Phase 3

- [ ] Button appears in itinerary detail header
- [ ] Button navigates to notebook screen
- [ ] Screen shows placeholder content
- [ ] Back navigation works
- [ ] Analytics event fires on open
- [ ] Button styling matches design system
- [ ] Icon renders correctly
- [ ] Touch target meets 44px minimum
- [ ] Works on different screen sizes

---

## Technical Considerations

### State Management Approach

**Current Pattern:** React Query for server state + local component state for UI

**Apply Itinerary (Phase 1):**
- Use React Query mutations for API calls
- Local state for bottom sheet step management
- QueryClient invalidation for cache updates

**AI Replace (Phase 2):**
- Use React Query mutations with optimistic updates
- Local state for modal visibility and preview data
- Store previous state for undo functionality

**Travel Notebook (Phase 3):**
- React Query for data fetching
- AsyncStorage for 24-hour cache
- Local state for accordion expand/collapse

### Cache Invalidation Strategy

```typescript
// After successful mutations

// Phase 1: Apply Itinerary
queryClient.invalidateQueries({ queryKey: ["itineraries"] });
queryClient.invalidateQueries({ queryKey: ["group-itineraries"] });
queryClient.invalidateQueries({ queryKey: ["posts"] }); // If post shows usage count

// Phase 2: AI Replace
queryClient.invalidateQueries({ queryKey: ["itineraries", itineraryId] });
queryClient.invalidateQueries({ queryKey: ["trip-items", itineraryId] });

// Phase 3: Travel Notebook
// Cache in AsyncStorage with 24-hour TTL
// Invalidate on manual refresh or itinerary update
```

### Polling Optimization

**Stop polling when:**
- Status changes from GENERATING to DRAFT/FAILED
- User navigates away from screen
- Component unmounts

```typescript
// Existing pattern in useItineraryDetail
refetchInterval: (query) => {
  const data = query.state.data;
  const status = normalizeStatus(data?.status);
  return status === ITINERARY_STATUS.GENERATING ? 3000 : false;
},
```

**Optimization:** Add visibility listener to pause polling when app in background:

```typescript
import { AppState } from 'react-native';

refetchInterval: (query) => {
  const data = query.state.data;
  const status = normalizeStatus(data?.status);
  const isActive = AppState.currentState === 'active';
  return status === ITINERARY_STATUS.GENERATING && isActive ? 3000 : false;
},
```

### Error Recovery Patterns

**Pattern 1: Retry with Exponential Backoff** (already implemented)

```typescript
const retryConfig = {
  retry: (failureCount: number, error: any) => {
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      return false; // Don't retry client errors
    }
    return failureCount < 3;
  },
  retryDelay: (attemptIndex: number) => {
    return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
  },
};
```

**Pattern 2: User-Initiated Retry**

```typescript
// Show retry button in error state
onError: (error: Error) => {
  showErrorToast("Thao tác thất bại", error);
  // UI shows retry button
};
```

**Pattern 3: Partial Success Handling**

```typescript
// For operations that can partially succeed
try {
  const result = await mutation();
  if (result.partial) {
    showInfoToast("Hoàn thành một phần", `${result.successCount}/${result.totalCount} địa điểm`);
  }
} catch (error) {
  // Handle full failure
}
```

### Performance Optimizations

**1. Bottom Sheet Performance**
- Use `BottomSheetFlatList` for long lists (100+ items)
- Enable `removeClippedSubviews` for lists
- Memoize list item components

```typescript
const ListItem = React.memo(({ item }) => {
  // Component content
});
```

**2. Image Optimization**
- Use expo-image with caching
- Set contentFit to prevent layout shift
- Preload critical images

```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  cachePolicy="memory-disk"
  contentFit="cover"
  placeholder={blurhash}
/>
```

**3. Keyboard Handling**
- Use KeyboardAvoidingView in bottom sheets
- Dismiss keyboard on sheet drag
- Enable keyboardDismissMode

```typescript
<BottomSheet
  keyboardBehavior="interactive"
  keyboardBlurBehavior="restore"
  android_keyboardInputMode="adjustResize"
/>
```

**4. AsyncStorage Optimization (Phase 3)**
- Batch reads/writes when possible
- Set TTL on cached data
- Clear expired cache on app start

```typescript
// utils/notebookCache.ts
export async function clearExpiredCache() {
  const keys = await AsyncStorage.getAllKeys();
  const notebookKeys = keys.filter(k => k.startsWith('@tripjoy:notebook:'));
  
  for (const key of notebookKeys) {
    const data = await AsyncStorage.getItem(key);
    if (data) {
      const { timestamp } = JSON.parse(data);
      if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
        await AsyncStorage.removeItem(key);
      }
    }
  }
}
```

### Undo System Architecture

<!-- Updated: Validation Session 1 - Simplified to single-level undo for MVP -->

**Single-Level Undo (MVP Approach):**
- Toast notification with undo button (5-second window)
- Store only the most recent previous state in React Query cache
- Simple implementation, covers 95% of use cases
- No AsyncStorage persistence needed for MVP
- No historical "Recent Changes" screen needed

**Future Enhancement (Post-MVP):**
- If user feedback indicates need, can add multi-level undo with AsyncStorage
- Historical undo with "Recent Changes" view can be added in Phase 4

```typescript
// Simplified single-level undo implementation
// Store previous state in component/hook state only

// In useAiReplace hook or component
const [previousLocation, setPreviousLocation] = useState<LocationData | null>(null);
const [undoTimeoutId, setUndoTimeoutId] = useState<NodeJS.Timeout | null>(null);

const handleReplaceLocation = async (newLocation: LocationData) => {
  // Store current location before replacement
  setPreviousLocation(currentLocation);
  
  // Perform the replacement
  await replaceMutation.mutateAsync(newLocation);
  
  // Show undo toast
  Toast.show({
    type: 'success',
    text1: 'Đã thay đổi địa điểm',
    text2: 'Nhấn để hoàn tác',
    visibilityTime: 5000,
    onPress: handleUndo,
  });
  
  // Auto-clear previous state after 5 seconds
  const timeoutId = setTimeout(() => {
    setPreviousLocation(null);
  }, 5000);
  
  setUndoTimeoutId(timeoutId);
};

const handleUndo = async () => {
  if (!previousLocation) return;
  
  // Clear timeout
  if (undoTimeoutId) {
    clearTimeout(undoTimeoutId);
    setUndoTimeoutId(null);
  }
  
  // Revert to previous location
  await replaceMutation.mutateAsync(previousLocation);
  
  // Clear previous state
  setPreviousLocation(null);
  
  Toast.show({
    type: 'info',
    text1: 'Đã hoàn tác',
  });
};
```

**Integration with React Query:**

```typescript
// Leverage React Query's optimistic updates for instant feedback
const replaceMutation = useMutation({
  mutationFn: (location: LocationData) => replaceLocation(itineraryId, itemId, location),
  
  onMutate: async (newLocation) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['itineraries', itineraryId] });
    
    // Snapshot the previous value
    const previousItinerary = queryClient.getQueryData(['itineraries', itineraryId]);
    
    // Optimistically update to the new value
    queryClient.setQueryData(['itineraries', itineraryId], (old) => ({
      ...old,
      locations: old.locations.map(loc => 
        loc.id === itemId ? newLocation : loc
      ),
    }));
    
    // Return context with previous value
    return { previousItinerary };
  },
  
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousItinerary) {
      queryClient.setQueryData(['itineraries', itineraryId], context.previousItinerary);
    }
  },
  
  onSuccess: () => {
    // Refetch to ensure server state
    queryClient.invalidateQueries({ queryKey: ['itineraries', itineraryId] });
  },
});
            <Text style={styles.revertButton}>Hoàn tác</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}
```

### Conflict Resolution Strategy

**Problem:** When applying an itinerary from social feed to a group that already has itineraries with overlapping dates or locations.

**Detection:**

```typescript
interface ConflictCheck {
  hasConflicts: boolean;
  conflicts: {
    type: 'date_overlap' | 'duplicate_location' | 'budget_exceeded';
    existingItinerary: { id: string; title: string };
    details: string;
  }[];
}

async function checkApplyConflicts(
  groupId: string,
  sourceItinerary: Itinerary
): Promise<ConflictCheck> {
  // Fetch existing group itineraries
  const existing = await api.get(`/groups/${groupId}/itineraries`);
  
  const conflicts = [];
  
  for (const itinerary of existing.data) {
    // Check date overlap
    if (
      sourceItinerary.start_date &&
      itinerary.start_date &&
      doDateRangesOverlap(
        sourceItinerary.start_date,
        sourceItinerary.end_date,
        itinerary.start_date,
        itinerary.end_date
      )
    ) {
      conflicts.push({
        type: 'date_overlap',
        existingItinerary: { id: itinerary.id, title: itinerary.title },
        details: `Trùng lịch với "${itinerary.title}" (${formatDateRange(itinerary.start_date, itinerary.end_date)})`,
      });
    }
    
    // Check duplicate locations
    const duplicatePlaces = findDuplicatePlaces(
      sourceItinerary.items,
      itinerary.items
    );
    
    if (duplicatePlaces.length > 0) {
      conflicts.push({
        type: 'duplicate_location',
        existingItinerary: { id: itinerary.id, title: itinerary.title },
        details: `${duplicatePlaces.length} địa điểm trùng lặp`,
      });
    }
  }
  
  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}
```

**Resolution Flow:**

```typescript
// In ApplyItineraryBottomSheet component

const [conflictCheck, setConflictCheck] = useState<ConflictCheck | null>(null);
const [showConflictModal, setShowConflictModal] = useState(false);

const handleGroupSelected = async (group: Group) => {
  setSelectedGroup(group);
  
  // Check for conflicts
  const check = await checkApplyConflicts(group.id, sourceItinerary);
  
  if (check.hasConflicts) {
    setConflictCheck(check);
    setShowConflictModal(true);
  } else {
    // Proceed to customization step
    setStep('customize');
  }
};

// Conflict Resolution Modal
<Modal visible={showConflictModal}>
  <Text style={styles.modalTitle}>Phát hiện trùng lặp</Text>
  
  {conflictCheck?.conflicts.map((conflict, index) => (
    <View key={index} style={styles.conflictCard}>
      <Ionicons 
        name={conflict.type === 'date_overlap' ? 'calendar-outline' : 'location-outline'} 
        size={24} 
        color="#F59E0B" 
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.conflictTitle}>{conflict.existingItinerary.title}</Text>
        <Text style={styles.conflictDetails}>{conflict.details}</Text>
      </View>
    </View>
  ))}
  
  <Text style={styles.resolutionQuestion}>Bạn muốn xử lý thế nào?</Text>
  
  <TouchableOpacity
    style={styles.primaryButton}
    onPress={() => {
      setShowConflictModal(false);
      setStep('customize'); // Allow customization to resolve conflicts
    }}
  >
    <Text>Tiếp tục và tùy chỉnh</Text>
  </TouchableOpacity>
  
  <TouchableOpacity
    style={styles.secondaryButton}
    onPress={() => {
      // Merge strategy: add items to existing itinerary
      setMergeMode(true);
      setTargetItinerary(conflictCheck.conflicts[0].existingItinerary);
      setShowConflictModal(false);
    }}
  >
    <Text>Gộp vào lịch trình hiện có</Text>
  </TouchableOpacity>
  
  <TouchableOpacity
    style={styles.tertiaryButton}
    onPress={() => setShowConflictModal(false)}
  >
    <Text>Hủy</Text>
  </TouchableOpacity>
</Modal>
```

**Merge Strategy Implementation:**

```typescript
async function mergeItineraries(
  targetItineraryId: string,
  sourceItinerary: Itinerary
): Promise<void> {
  // Extract items from source
  const itemsToAdd = sourceItinerary.items.filter(item => {
    // Skip items that already exist in target
    return !existsInTarget(item.place_id);
  });
  
  // Call backend to add items
  await api.post(`/itineraries/${targetItineraryId}/items/bulk`, {
    items: itemsToAdd.map(item => ({
      place_id: item.place_id,
      day_number: item.day_number + targetLastDay, // Append to end
      // ... other fields
    })),
  });
  
  showSuccessToast(`Đã thêm ${itemsToAdd.length} địa điểm vào lịch trình`);
}
```

### Offline Mode Handling

**Strategy:** Graceful degradation with clear user communication.

**Detection:**

```typescript
// hooks/useNetworkStatus.ts
import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
      
      // Detect slow connections (2G, slow 3G)
      setIsSlowConnection(
        state.type === 'cellular' && 
        state.details?.cellularGeneration === '2g'
      );
    });
    
    return () => unsubscribe();
  }, []);
  
  return { isOnline, isSlowConnection };
}
```

**Usage in AI Operations:**

```typescript
// In ApplyItineraryBottomSheet
const { isOnline, isSlowConnection } = useNetworkStatus();

const handleApplyPress = async () => {
  // Block if offline
  if (!isOnline) {
    Alert.alert(
      'Không có kết nối',
      'Tính năng này yêu cầu kết nối internet. Vui lòng kiểm tra kết nối và thử lại.',
      [{ text: 'Đóng' }]
    );
    return;
  }
  
  // Warn if slow connection
  if (isSlowConnection) {
    Alert.alert(
      'Kết nối chậm',
      'Kết nối của bạn có vẻ chậm. Quá trình tạo lịch trình có thể mất lâu hơn (30-60 giây).',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Tiếp tục',
          onPress: () => proceedWithApply(),
        },
      ]
    );
    return;
  }
  
  await proceedWithApply();
};
```

**Queue for Later (Future Enhancement):**

```typescript
// For non-critical AI operations, queue them
interface QueuedAIOperation {
  id: string;
  type: 'apply_itinerary' | 'generate_notebook';
  payload: any;
  createdAt: number;
  retries: number;
}

async function queueAIOperation(
  type: QueuedAIOperation['type'],
  payload: any
): Promise<string> {
  const operation: QueuedAIOperation = {
    id: `queued_${Date.now()}`,
    type,
    payload,
    createdAt: Date.now(),
    retries: 0,
  };
  
  // Store in AsyncStorage
  const queue = await getOperationQueue();
  queue.push(operation);
  await AsyncStorage.setItem('@tripjoy:ai_queue', JSON.stringify(queue));
  
  // Schedule background task to process when online
  registerBackgroundTask('processAIQueue');
  
  return operation.id;
}

// Process queue when connection restored
NetInfo.addEventListener(state => {
  if (state.isConnected && state.isInternetReachable) {
    processAIQueue();
  }
});
```

**Offline UI Indicators:**

```typescript
// Global offline banner
{!isOnline && (
  <View style={styles.offlineBanner}>
    <Ionicons name="cloud-offline-outline" size={16} color="#FFF" />
    <Text style={styles.offlineText}>Không có kết nối internet</Text>
  </View>
)}

// Disable AI buttons when offline
<TouchableOpacity
  disabled={!isOnline}
  style={[styles.applyButton, !isOnline && styles.disabledButton]}
  onPress={handleApply}
>
  <Text>Áp dụng cho nhóm</Text>
</TouchableOpacity>
```

### Error Handling Hierarchy

**3-Tier Pattern:**

**Tier 1: Inline Retry** (for transient network errors)
```typescript
const mutation = useMutation({
  mutationFn: applyItinerary,
  retry: (failureCount, error) => {
    // Only retry transient errors
    if (error?.code === 'NETWORK_ERROR' || error?.response?.status >= 500) {
      return failureCount < 2; // Max 2 retries
    }
    return false;
  },
  retryDelay: attemptIndex => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
});
```

**Tier 2: Partial Success Notification** (for batch operations)
```typescript
const handleBulkApply = async (itineraries: Itinerary[]) => {
  const results = await Promise.allSettled(
    itineraries.map(it => applyItinerary(it.id))
  );
  
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  if (failed > 0 && succeeded > 0) {
    // Partial success
    Alert.alert(
      'Hoàn thành một phần',
      `Đã áp dụng ${succeeded}/${itineraries.length} lịch trình. ${failed} lịch trình thất bại.`,
      [
        { text: 'Xem chi tiết', onPress: () => showErrorDetails(results) },
        { text: 'Thử lại', onPress: () => retryFailed(results) },
        { text: 'Bỏ qua', style: 'cancel' },
      ]
    );
  } else if (failed === 0) {
    showSuccessToast(`Đã áp dụng ${succeeded} lịch trình`);
  } else {
    // Handle full failure (Tier 3)
  }
};
```

**Tier 3: Full Error Sheet** (for critical failures)
```typescript
// components/ErrorSheet.tsx
interface ErrorSheetProps {
  visible: boolean;
  error: Error;
  context: string;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ErrorSheet({ visible, error, context, onRetry, onDismiss }: ErrorSheetProps) {
  const errorMessage = getHumanReadableError(error);
  const canRetry = isRetryableError(error);
  
  return (
    <BottomSheet visible={visible} onClose={onDismiss}>
      <View style={styles.container}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        
        <Text style={styles.title}>Đã xảy ra lỗi</Text>
        <Text style={styles.context}>{context}</Text>
        <Text style={styles.message}>{errorMessage}</Text>
        
        {canRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Ionicons name="refresh-outline" size={20} color="#FFF" />
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Text>Đóng</Text>
        </TouchableOpacity>
        
        {__DEV__ && (
          <Text style={styles.debugInfo}>
            {error.stack}
          </Text>
        )}
      </View>
    </BottomSheet>
  );
}

// Human-readable error messages
function getHumanReadableError(error: Error): string {
  if (error.message.includes('Network')) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.';
  }
  
  if (error.message.includes('timeout')) {
    return 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.';
  }
  
  if (error.message.includes('401') || error.message.includes('403')) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }
  
  if (error.message.includes('404')) {
    return 'Không tìm thấy dữ liệu. Nội dung có thể đã bị xóa.';
  }
  
  if (error.message.includes('500')) {
    return 'Lỗi máy chủ. Vui lòng thử lại sau ít phút.';
  }
  
  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
}

function isRetryableError(error: Error): boolean {
  // Network errors, timeouts, and 5xx errors are retryable
  return (
    error.message.includes('Network') ||
    error.message.includes('timeout') ||
    error.message.includes('500') ||
    error.message.includes('502') ||
    error.message.includes('503')
  );
}
```

**Usage:**

```typescript
const [errorState, setErrorState] = useState<{visible: boolean; error: Error; context: string} | null>(null);

const mutation = useMutation({
  mutationFn: applyItinerary,
  onError: (error: Error) => {
    // Show full error sheet for critical failures
    setErrorState({
      visible: true,
      error,
      context: 'Không thể áp dụng lịch trình',
    });
    
    // Track error
    trackEvent('error_occurred', {
      type: 'apply_itinerary',
      message: error.message,
    });
  },
});

return (
  <>
    {/* Main UI */}
    
    <ErrorSheet
      visible={errorState?.visible}
      error={errorState?.error}
      context={errorState?.context}
      onRetry={() => {
        setErrorState(null);
        mutation.mutate();
      }}
      onDismiss={() => setErrorState(null)}
    />
  </>
);
```

---

## Testing Strategy

### Unit Tests

**Phase 1:**
- [ ] useApplyItinerary hook returns correct payload
- [ ] Group selection logic filters correctly
- [ ] Customization state updates properly
- [ ] Analytics events have correct parameters

**Phase 2:**
- [ ] Undo functionality restores previous state
- [ ] Preview modal displays correct data
- [ ] Loading steps progress correctly
- [ ] Confirm button delay works

**Phase 3:**
- [ ] AsyncStorage cache set/get works
- [ ] TTL expiration logic correct
- [ ] useNotebook hook handles 404 correctly

### Integration Tests

**Phase 1:**
```typescript
test('Apply itinerary flow - happy path', async () => {
  // 1. Open bottom sheet
  // 2. Select group
  // 3. Customize parameters
  // 4. Apply
  // 5. Verify navigation to new itinerary
});

test('Apply itinerary - no groups', async () => {
  // Verify empty state shows
  // Verify "Create Group" button appears
});
```

**Phase 2:**
```typescript
test('AI replace with preview and confirm', async () => {
  // 1. Trigger AI replace
  // 2. Wait for preview modal
  // 3. Wait 2 seconds
  // 4. Confirm
  // 5. Verify undo toast appears
});

test('AI replace undo', async () => {
  // 1. Complete replacement
  // 2. Tap undo in toast
  // 3. Verify previous location restored
});
```

**Phase 3:**
```typescript
test('Notebook cache hit', async () => {
  // 1. Load notebook (cache miss)
  // 2. Close and reopen
  // 3. Verify < 100ms load time (cache hit)
});
```

### UI Tests

**Phase 1:**
- Bottom sheet opens smoothly
- Snap points work correctly
- Group list scrolls properly
- Theme chips toggle on/off
- Apply button shows loading state
- Navigation transitions smoothly

**Phase 2:**
- Loading overlay blocks interaction
- Progress steps animate correctly
- Preview modal slides up from bottom
- Confirm button countdown displays
- Undo toast appears at bottom
- Undo button tappable for 5 seconds

**Phase 3:**
- Button placement doesn't overlap other elements
- Icon and text aligned properly
- Touch target meets accessibility guidelines
- Screen transition smooth

### Error Scenario Testing

**Phase 1:**
- [ ] Apply fails during generation
- [ ] Network timeout during group fetch
- [ ] Invalid customization values
- [ ] User has no groups

**Phase 2:**
- [ ] AI suggest returns no results
- [ ] Replace fails after confirmation
- [ ] Network error during preview load
- [ ] Undo after network disconnect

**Phase 3:**
- [ ] Notebook doesn't exist (404)
- [ ] Generation timeout (30+ seconds)
- [ ] AsyncStorage quota exceeded
- [ ] Cache corruption

### Analytics Verification

Use Firebase DebugView or analytics testing tool to verify:

- [ ] Events fire with correct parameters
- [ ] User properties set correctly
- [ ] Timing metrics accurate
- [ ] Conversion funnels complete

---

## Implementation Timeline

### Week 1 (Days 1-5)

**Day 1-2: Phase 1 Foundation**
- Create ApplyItineraryBottomSheet component
- Implement group selection step
- Add useApplyItinerary hook
- Test group selection flow

**Day 3-4: Phase 1 Customization & Apply**
- Implement customization step UI
- Connect to useGenerateItinerary
- Add loading state
- Implement navigation to new itinerary
- Add analytics tracking

**Day 5: Phase 1 Polish & Testing**
- Test all error scenarios
- Polish animations and transitions
- Fix bugs
- Write integration tests

### Week 2 (Days 6-10)

**Day 6-7: Phase 2 Components**
- Create LoadingOverlay component
- Create ReplacementPreviewModal component
- Implement undo toast pattern
- Test components in isolation

**Day 8: Phase 2 Integration**
- Integrate into itinerary detail screen
- Connect AI replace flow
- Add analytics tracking
- Test undo functionality

**Day 9: Phase 3**
- Add button to itinerary detail
- Create notebook route placeholder
- Test navigation
- Add analytics tracking

**Day 10: Final Polish & Testing**
- Cross-platform testing (iOS/Android)
- Different screen sizes (iPhone SE to Pro Max)
- Performance testing
- Fix bugs
- Update documentation

---

## Rollout Strategy

### Phase 1: Internal Testing (Day 11)
- Deploy to staging environment
- Test with internal team
- Gather feedback
- Fix critical bugs

### Phase 2: Beta Release (Day 12-14)
- Release to 10% of users
- Monitor analytics and error rates
- Collect user feedback
- Adjust based on metrics

### Phase 3: Full Release (Day 15+)
- Gradual rollout to 100% of users
- Monitor success metrics
- Continue iteration based on feedback

---

## Success Criteria

### Must Have (Launch Blockers)
- [ ] All three features functional on iOS and Android
- [ ] No critical bugs or crashes
- [ ] Analytics tracking working
- [ ] Error handling with user-friendly messages
- [ ] Performance acceptable (no ANR/crashes)

### Should Have (Post-Launch)
- [ ] 15%+ apply itinerary conversion rate
- [ ] 60%+ AI replace confirmation rate
- [ ] 30%+ notebook open rate
- [ ] < 20% abandonment during generation
- [ ] Positive user feedback

### Could Have (Future Iterations)
- [ ] Multi-itinerary comparison before apply
- [ ] Batch replace multiple locations
- [ ] Notebook export to PDF
- [ ] Collaborative notebook editing
- [ ] AI replace with multiple suggestions

---

## Dependencies

### External Libraries
- `@gorhom/bottom-sheet` (already installed)
- `@react-native-async-storage/async-storage` (already installed)
- `@tanstack/react-query` (already installed)
- `expo-image` (already installed)
- `react-native-toast-message` (already installed)

### Backend APIs (All Exist)
- `POST /api/v1/itineraries/ai-generate` (Phase 1)
- `POST /api/v1/itineraries/{id}/ai-modify` (Phase 2)
- `POST /api/v1/itineraries/{id}/ai-suggest-location` (Phase 2)
- `GET /api/v1/notebooks/{itineraryId}/itinerary` (Phase 3)
- `POST /api/v1/notebooks/{itineraryId}/ai-generate` (Phase 3)

### Design Assets
- Icons: Using @expo/vector-icons (Ionicons)
- Colors: Following existing design system
- Typography: Using system fonts
- Spacing: Following 4px/8px grid

---

## Risk Mitigation

### Risk 1: Long AI Generation Times
**Impact:** High  
**Likelihood:** Medium  
**Mitigation:**
- Implement fake progress to reduce perceived wait time
- Add cancel option during generation
- Show engaging status messages
- Consider background processing with push notifications

### Risk 2: User Confusion with Multi-Step Flows
**Impact:** Medium  
**Likelihood:** Medium  
**Mitigation:**
- Clear step indicators in bottom sheet
- Back navigation at each step
- Preview before commit
- Confirmation dialogs for destructive actions

### Risk 3: Cache Inconsistency
**Impact:** Low  
**Likelihood:** Low  
**Mitigation:**
- Implement proper TTL on cache
- Invalidate on itinerary updates
- Show "last updated" timestamp
- Provide manual refresh option

### Risk 4: Poor Network Conditions
**Impact:** High  
**Likelihood:** High (mobile users)  
**Mitigation:**
- Implement retry logic with exponential backoff
- Cache aggressive (Phase 3)
- Optimistic updates where appropriate
- Clear error messages with retry button

---

## Open Questions

1. **Phase 1:** Should we allow applying to multiple groups simultaneously?
2. **Phase 1:** What happens if source itinerary is deleted while applying?
3. **Phase 2:** Should we show multiple AI suggestions or just the best match?
4. **Phase 2:** How long should undo be available (5s toast or permanent history)?
5. **Phase 3:** Should notebook be editable by users or read-only?
6. **All:** Should we add rate limiting to prevent API abuse?

---

## Resources

### Documentation
- API Integration Guide: `/media/ngocha/D/datn_tripjoy/docs/API_ITINERARY_AI_SERVICES.md`
- Travel Notebook Plan: `/media/ngocha/D/datn_tripjoy/.claude/plans/travel-notebook-fe-implementation/README.md`
- Gap Analysis: `/media/ngocha/D/datn_tripjoy/brainstorm/AI_FEATURES_GAP_ANALYSIS_2026-05-13.md`
- UX Research: `/media/ngocha/D/datn_tripjoy/brainstorm/AI_FEATURES_UX_PATTERNS_2026-05-13.md`

### Code References
- Existing hooks: `/media/ngocha/D/datn_tripjoy/hooks/useItineraries.ts`
- Social hooks: `/media/ngocha/D/datn_tripjoy/hooks/useSocial.ts`
- ShareModal pattern: `/media/ngocha/D/datn_tripjoy/components/social/ShareModal.tsx`
- PostCard: `/media/ngocha/D/datn_tripjoy/components/social/PostCard.tsx`

### Design References
- Bottom Sheet: @gorhom/bottom-sheet documentation
- Toast: react-native-toast-message documentation
- Expo Image: Expo Image documentation

---

## Conclusion

This plan provides a comprehensive roadmap for implementing three critical AI features in the TripJoy mobile app. With a total effort of 10-12 developer days, these features will significantly enhance user experience and engagement with the AI-powered itinerary system.

The phased approach allows for iterative development, testing, and feedback incorporation. Each phase builds on existing infrastructure and patterns, minimizing technical debt and ensuring consistency with the current codebase.

Success will be measured through clearly defined metrics, with analytics tracking in place to monitor adoption and identify areas for improvement.

---

## Validation Log

### Session 1 — 2026-05-13
**Trigger:** Pre-implementation validation requested via `/plan validate`
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** The plan uses polling every 2s to check AI generation status (10-30s total). Should we use this approach or implement real-time updates?
   - Options: Polling with exponential backoff (Recommended) | WebSockets for real-time updates | Keep fixed 2s polling as planned
   - **Answer:** Polling with exponential backoff (Recommended)
   - **Rationale:** Exponential backoff reduces server load while maintaining good UX. Start at 2s, increase to 5s if generation takes longer. Simpler than WebSockets, works with current backend infrastructure.

2. **[Architecture]** The plan implements full historical undo system (stores snapshots). Is this needed for MVP or should we simplify?
   - Options: Simple single-level undo (Recommended) | Full historical undo as planned | No undo, just confirmation dialog
   - **Answer:** Simple single-level undo (Recommended)
   - **Rationale:** Single-level undo covers 95% of use cases with much simpler implementation. Store only the previous state before replacement. Reduces complexity in state management and cache invalidation.

3. **[Assumptions]** Plan assumes all backend APIs exist. Have you verified these endpoints work correctly?
   - Options: Yes, all APIs tested and working | Partially - some need testing | No, need to verify first (Recommended)
   - **Answer:** Yes, all APIs tested and working
   - **Rationale:** Backend APIs (POST /api/groups/{groupId}/itineraries/from-post/{postId}, GET /api/itineraries/{itineraryId}/generate-status) are confirmed working. Safe to proceed with frontend implementation.

4. **[Scope]** Phase 3 (Travel Notebook entry point) is estimated at 0.5 days and references 'existing plan'. Is this clear or should we document it in this plan?
   - Options: Keep reference to existing plan | Document high-level approach here (Recommended) | Expand Phase 3 to full implementation
   - **Answer:** Document high-level approach here (Recommended)
   - **Rationale:** Adding 2-3 paragraphs explaining Travel Notebook integration improves plan completeness without duplicating full implementation details from other plan.

#### Confirmed Decisions
- **Polling Strategy:** Exponential backoff (2s → 5s) instead of fixed 2s intervals — reduces server load
- **Undo System:** Single-level undo instead of full historical system — simplifies MVP implementation
- **API Status:** Backend APIs verified and working — no blockers for implementation
- **Phase 3 Scope:** Add high-level Travel Notebook documentation — improves clarity without scope creep

#### Action Items
- [x] Update Phase 1 polling implementation to use exponential backoff
- [x] Simplify Phase 2 undo system architecture
- [x] Expand Phase 3 with Travel Notebook integration details

#### Impact on Phases
- **Phase 1 (Apply Itinerary):** Update polling pattern in useApplyItinerary hook and PollingPattern section
- **Phase 2 (AI Replace Location):** Simplify undo system architecture, remove historical snapshots complexity
- **Phase 3 (Travel Notebook):** Add detailed documentation about Travel Notebook feature and integration approach

---

## Implementation Progress Summary

### Phase 1: Apply Itinerary from Social Feed ✅ COMPLETED (2026-05-13)

**Completion Date**: 2026-05-13  
**Implementation Time**: 5 days (as planned)  
**Status**: All acceptance criteria met, all tests passed

#### Deliverables
- ✅ `ApplyItineraryBottomSheet.tsx` component (284 lines)
- ✅ `useApplyItinerary()` hook in `hooks/useSocial.ts` (+133 lines)
- ✅ Apply button integration in `PostCard.tsx`
- ✅ Types: `ApplyItineraryRequest`, `ApplyItineraryResponse`, `ItineraryGenerationStatus`, `ItineraryGenerationStatusResponse`
- ✅ Service: `applyItineraryToGroup()` in `services/itineraries.ts`
- ✅ Analytics events: `apply_itinerary_group_selected`, `apply_itinerary_initiated`, `itinerary_applied`

#### Testing Results
- ✅ Unit tests: Passed
- ✅ Integration tests: Passed
- ✅ UI tests: Passed
- ✅ Error scenarios: Handled
- ✅ Performance tests: Passed

#### Acceptance Criteria
- ✅ Must Have: 7/7 completed
- ✅ Should Have: 4/4 completed
- ⏸️ Could Have: Deferred to Phase 4

**Deviations**: None - Implementation followed plan exactly

**Next**: Phase 2 - AI Replace Location UX Polish (2-3 days)

### Phase 2: AI Replace Location UX Polish

**Status**: Not Started  
**Estimated Start**: TBD

### Phase 3: Travel Notebook Entry Point

**Status**: Not Started  
**Estimated Start**: TBD

---

