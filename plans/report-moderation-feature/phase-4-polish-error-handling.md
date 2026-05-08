# Phase 4: Polish & Error Handling (2-3 days)

**Goal:** Refine UX, add comprehensive error handling, and optimize performance

**Prerequisites:** Phase 1, 2, 3 completed (all features functional)

---

## Tasks Overview

1. Add loading skeletons
2. Implement comprehensive error handling
3. Add offline support
4. Add confirmation dialogs
5. Improve accessibility
6. Performance optimization
7. Add polish and micro-interactions

---

## Task 1: Loading Skeletons

### Replace ActivityIndicator with Skeleton Screens

**Why:** Skeleton screens provide better perceived performance and reduce layout shifts.

### File: `components/admin/ReportListSkeleton.tsx` (NEW)

```typescript
import React from "react";
import { View } from "react-native";

export function ReportListSkeleton() {
  return (
    <View className="px-4 py-2">
      {[1, 2, 3, 4, 5].map((index) => (
        <View
          key={index}
          className="bg-white rounded-lg p-4 border border-gray-200 mb-2"
        >
          <View className="flex-row items-start">
            {/* Icon skeleton */}
            <View className="w-10 h-10 rounded-full bg-gray-200 mr-3" />

            {/* Content skeleton */}
            <View className="flex-1">
              {/* Title */}
              <View className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              
              {/* Subtitle */}
              <View className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
              
              {/* Description */}
              <View className="h-3 bg-gray-200 rounded w-full mb-1" />
              <View className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
              
              {/* Footer */}
              <View className="flex-row items-center justify-between mt-1">
                <View className="h-6 bg-gray-200 rounded w-20" />
                <View className="h-3 bg-gray-200 rounded w-16" />
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
```

### Integrate Skeleton into ReportDashboard

**File: `components/admin/ReportDashboard.tsx` (MODIFY)**

```typescript
import { ReportListSkeleton } from "./ReportListSkeleton";

// In ReportDashboard component
// Replace loading state:
if (isLoading && !isFetching) {
  return <ReportListSkeleton />;
}
```

**Optional: Shimmer Animation**

Add shimmer effect using `react-native-linear-gradient` or CSS animation:

```typescript
// Add animated shimmer effect
import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export function SkeletonBox({ width, height, className }: { width?: string; height?: number; className?: string }) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={{ opacity }}
      className={`bg-gray-200 rounded ${className}`}
      style={{ width, height }}
    />
  );
}
```

**Acceptance Criteria:**
- Skeleton shows while initial load
- Skeleton matches actual layout
- Smooth transition to real content
- Optional shimmer animation

---

## Task 2: Comprehensive Error Handling

### Error Scenarios to Handle

1. **Network Errors**
2. **Permission Errors (401/403)**
3. **Validation Errors (400)**
4. **Server Errors (500+)**
5. **Duplicate Report Errors**
6. **Timeout Errors**

### Implementation

**Already Handled by Hooks:**
- ✅ Network errors → retry with exponential backoff
- ✅ Error toasts with messages
- ✅ Analytics tracking

**Additional Error Boundaries:**

### File: `components/common/ErrorBoundary.tsx` (NEW)

```typescript
import React, { Component, ReactNode } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trackError } from "@/utils/analytics";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    trackError(error.message, {
      componentStack: errorInfo.componentStack,
      action: "error_boundary",
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 items-center justify-center px-6 bg-white">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-xl font-bold text-gray-800 mt-4">
            Đã xảy ra lỗi
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            {this.state.error?.message || "Vui lòng thử lại"}
          </Text>
          <TouchableOpacity
            onPress={this.handleReset}
            className="mt-4 px-6 py-3 bg-green-600 rounded-lg"
          >
            <Text className="text-white font-semibold">Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
```

**Wrap Admin Components:**

```typescript
// In app/admin/reports.tsx
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

export default function AdminReportsScreen() {
  return (
    <ErrorBoundary>
      <ReportDashboard />
    </ErrorBoundary>
  );
}
```

### Handle Specific Error Codes

**File: `hooks/useReports.ts` (MODIFY)**

Add specific error handling:

```typescript
onError: (error: any, variables) => {
  // Check for specific error codes
  const status = error?.response?.status;
  const errorCode = error?.response?.data?.code;

  if (status === 403) {
    showErrorToast("Bạn không có quyền thực hiện thao tác này");
    // Optional: redirect to home
    return;
  }

  if (status === 409 || errorCode === 4001) {
    // Duplicate report
    showErrorToast("Bạn đã báo cáo nội dung này rồi");
    return;
  }

  if (status === 429) {
    // Rate limit
    showErrorToast("Bạn đã gửi quá nhiều báo cáo. Vui lòng thử lại sau");
    return;
  }

  // Default error handling
  showErrorToast("Gửi báo cáo thất bại", error);
  trackError(error.message, {
    contentId: variables.content_id,
    action: "submit_report",
    status,
    errorCode,
  });
},
```

**Acceptance Criteria:**
- Error boundaries catch component errors
- Specific error codes handled with appropriate messages
- All errors tracked in analytics
- Users can recover from errors

---

## Task 3: Offline Support

### Detect Network Status

**File: `hooks/useNetworkStatus.ts` (NEW)**

```typescript
import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline, isInternetReachable };
}
```

### Offline Banner Component

**File: `components/common/OfflineBanner.tsx` (NEW)**

```typescript
import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function OfflineBanner() {
  const { isOnline, isInternetReachable } = useNetworkStatus();

  if (isOnline && isInternetReachable) {
    return null;
  }

  return (
    <View className="bg-yellow-500 px-4 py-3 flex-row items-center">
      <Ionicons name="cloud-offline-outline" size={20} color="#FFFFFF" />
      <Text className="text-white font-semibold ml-2 flex-1">
        {!isOnline
          ? "Không có kết nối mạng"
          : "Không thể kết nối đến internet"}
      </Text>
    </View>
  );
}
```

### Integrate into Admin Dashboard

```typescript
// In components/admin/ReportDashboard.tsx
import { OfflineBanner } from "../common/OfflineBanner";

return (
  <View className="flex-1">
    <OfflineBanner />
    <ReportFilterBar ... />
    <FlatList ... />
  </View>
);
```

### Queue Reports When Offline (Optional Advanced Feature)

```typescript
// Store failed mutations in AsyncStorage
// Retry when back online
// Not required for MVP but good enhancement
```

**Acceptance Criteria:**
- Offline banner shows when network unavailable
- React Query handles retry automatically
- Users see clear feedback about network status

---

## Task 4: Confirmation Dialogs

### Add Confirmation Before Handling Reports

**File: `components/common/ConfirmDialog.tsx` (NEW)**

```typescript
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  confirmColor = "#34B27D",
  onConfirm,
  onCancel,
  icon = "help-circle-outline",
  iconColor = "#3B82F6",
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-lg p-6 w-full max-w-sm">
          {/* Icon */}
          <View className="items-center mb-4">
            <Ionicons name={icon} size={48} color={iconColor} />
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-800 text-center mb-2">
            {title}
          </Text>

          {/* Message */}
          <Text className="text-gray-600 text-center mb-6">
            {message}
          </Text>

          {/* Buttons */}
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 py-3 rounded-lg border border-gray-300"
              activeOpacity={0.7}
            >
              <Text className="text-center text-gray-700 font-semibold">
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              className="flex-1 py-3 rounded-lg"
              style={{ backgroundColor: confirmColor }}
              activeOpacity={0.7}
            >
              <Text className="text-center text-white font-semibold">
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
```

### Integrate into ReportDetailModal

**File: `components/admin/ReportDetailModal.tsx` (MODIFY)**

```typescript
import { ConfirmDialog } from "../common/ConfirmDialog";

// Add state
const [showProcessConfirm, setShowProcessConfirm] = useState(false);
const [showDismissConfirm, setShowDismissConfirm] = useState(false);

// Modify button handlers
const handleProcessClick = () => {
  setShowProcessConfirm(true);
};

const handleDismissClick = () => {
  setShowDismissConfirm(true);
};

const confirmProcess = () => {
  setShowProcessConfirm(false);
  handleAction(ReportStatus.PROCESSED);
};

const confirmDismiss = () => {
  setShowDismissConfirm(false);
  handleAction(ReportStatus.DISMISSED);
};

// Render confirm dialogs
<ConfirmDialog
  visible={showProcessConfirm}
  title="Xác nhận xử lý báo cáo"
  message="Bạn đồng ý với báo cáo này và sẽ thực hiện hành động với nội dung vi phạm. Tiếp tục?"
  confirmText="Xử lý"
  confirmColor="#34B27D"
  icon="checkmark-circle-outline"
  iconColor="#34B27D"
  onConfirm={confirmProcess}
  onCancel={() => setShowProcessConfirm(false)}
/>

<ConfirmDialog
  visible={showDismissConfirm}
  title="Xác nhận từ chối báo cáo"
  message="Bạn cho rằng báo cáo này không hợp lệ và sẽ giữ nguyên nội dung. Tiếp tục?"
  confirmText="Từ chối"
  confirmColor="#EF4444"
  icon="close-circle-outline"
  iconColor="#EF4444"
  onConfirm={confirmDismiss}
  onCancel={() => setShowDismissConfirm(false)}
/>
```

**Acceptance Criteria:**
- Confirmation dialog shows before processing report
- Confirmation dialog shows before dismissing report
- Dialog explains what action will do
- User can cancel or confirm

---

## Task 5: Accessibility Improvements

### Add ARIA Labels and Semantic Markup

**File: `components/social/ReportModal.tsx` (MODIFY)**

```typescript
// Add accessibility props to interactive elements

<TouchableOpacity
  onPress={() => setSelectedReason(option.value)}
  accessible={true}
  accessibilityRole="radio"
  accessibilityLabel={`Chọn lý do: ${option.label}`}
  accessibilityState={{ selected: selectedReason === option.value }}
>
  {/* Radio button content */}
</TouchableOpacity>

<TextInput
  accessible={true}
  accessibilityLabel="Mô tả chi tiết báo cáo"
  accessibilityHint="Nhập thêm thông tin về lý do báo cáo"
  // ... other props
/>

<TouchableOpacity
  onPress={handleSubmit}
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Gửi báo cáo"
  accessibilityState={{ disabled: isPending || !selectedReason }}
>
  <Text>Gửi báo cáo</Text>
</TouchableOpacity>
```

### Test with Screen Reader

- iOS VoiceOver
- Android TalkBack

### Color Contrast Audit

Ensure all text meets WCAG AA standards:
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio

**Tools:**
- Chrome DevTools Accessibility Panel
- WebAIM Contrast Checker

**Acceptance Criteria:**
- All interactive elements have accessibilityRole
- All buttons have accessibilityLabel
- Form inputs have hints
- Color contrast passes WCAG AA
- Tested with screen reader

---

## Task 6: Performance Optimization

### Memoization

**File: `components/admin/ReportDashboard.tsx` (MODIFY)**

```typescript
import React, { useMemo } from "react";

// Memoize filter function
const filteredReports = useMemo(() => {
  if (!data?.content) return [];
  if (statusFilter === "ALL") return data.content;
  return data.content.filter((r) => r.status === statusFilter);
}, [data?.content, statusFilter]);
```

**File: `components/admin/ReportListItem.tsx` (MODIFY)**

```typescript
import React, { memo } from "react";

// Memoize component to prevent unnecessary re-renders
export const ReportListItem = memo(function ReportListItem({
  report,
  onPress,
}: ReportListItemProps) {
  // ... component code
});
```

### FlatList Optimization

```typescript
<FlatList
  data={reports}
  renderItem={({ item }) => <ReportListItem ... />}
  keyExtractor={(item) => item.id}
  // Performance props
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  windowSize={5}
  removeClippedSubviews={true}
  // ... other props
/>
```

### Image Optimization (if showing avatars)

```typescript
import { Image } from "expo-image";

<Image
  source={{ uri: avatarUrl }}
  style={{ width: 48, height: 48 }}
  contentFit="cover"
  transition={200}
  // Use placeholder while loading
  placeholder={require("@/assets/avatar-placeholder.png")}
/>
```

**Acceptance Criteria:**
- FlatList scrolls smoothly (60fps)
- No unnecessary re-renders
- Images load efficiently
- App feels responsive

---

## Task 7: Polish & Micro-interactions

### Add Subtle Animations

**Fade-in Animation for List Items:**

```typescript
import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export function ReportListItem({ report, onPress }: ReportListItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity onPress={onPress} className="...">
        {/* Content */}
      </TouchableOpacity>
    </Animated.View>
  );
}
```

### Haptic Feedback

```typescript
import * as Haptics from "expo-haptics";

const handleSubmit = () => {
  // Validate...
  
  // Trigger light haptic feedback
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  
  submit(payload);
};

const handleAction = (status: ReportStatus) => {
  // Trigger medium haptic for important actions
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  
  handleReport({ reportId, payload: { status } });
};
```

### Success Animations

Use Lottie or built-in animations for success states:

```typescript
// After successful report submission
import LottieView from "lottie-react-native";

<LottieView
  source={require("@/assets/animations/success-checkmark.json")}
  autoPlay
  loop={false}
  style={{ width: 100, height: 100 }}
/>
```

### Smooth Transitions

```typescript
// Use LayoutAnimation for list updates
import { LayoutAnimation, Platform, UIManager } from "react-native";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const handleFilterChange = (newFilter: ReportStatus | "ALL") => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setStatusFilter(newFilter);
  setPage(0);
};
```

**Acceptance Criteria:**
- Animations are subtle and enhance UX
- Haptic feedback on important actions
- Smooth transitions between states
- App feels polished and professional

---

## Testing Checklist

### Error Handling Tests

- [ ] Network error while loading list
- [ ] Network error during report submission
- [ ] Network error during report handling
- [ ] 403 permission error
- [ ] 409 duplicate report error
- [ ] 500 server error
- [ ] Timeout error
- [ ] Component crash (error boundary)

### Offline Tests

- [ ] Open app offline
- [ ] Go offline while viewing list
- [ ] Submit report while offline
- [ ] Return online and verify retry

### Accessibility Tests

- [ ] Navigate with screen reader (VoiceOver/TalkBack)
- [ ] Keyboard navigation on tablet
- [ ] Color contrast check
- [ ] Touch target size (min 44x44 points)

### Performance Tests

- [ ] Scroll 100+ item list smoothly
- [ ] Load time < 3 seconds
- [ ] No memory leaks
- [ ] No frame drops during animations

### Polish Tests

- [ ] Animations smooth
- [ ] Haptic feedback works
- [ ] Loading states clear
- [ ] Success feedback satisfying

---

## Acceptance Criteria for Phase 4

- [ ] Loading skeletons implemented
- [ ] Comprehensive error handling
- [ ] Offline support with banner
- [ ] Confirmation dialogs for destructive actions
- [ ] Accessibility improved (labels, contrast)
- [ ] Performance optimized (memoization, FlatList)
- [ ] Polish added (animations, haptics)
- [ ] All error scenarios tested
- [ ] Offline behavior tested
- [ ] Accessibility tested with screen reader
- [ ] Performance meets targets

---

## Notes

- **Progressive Enhancement:** Start with basic error handling, add polish incrementally
- **User Testing:** Get feedback on animations and micro-interactions
- **Performance Budget:** Maintain 60fps scrolling, < 3s load times
- **Accessibility First:** Don't sacrifice accessibility for fancy animations

---

**Estimated Time:** 2-3 days  
**Dependencies:** Phase 1, 2, 3 completed  
**Next Phase:** Phase 5 - Testing & Documentation
