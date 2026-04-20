# Phase 4: Main Screen Component (Day 3-4 - 6 hours)

## Objectives
- Build main screen that orchestrates all states
- Integrate empty, loading, success, and error states
- Add sticky header with refresh button
- Implement regenerate confirmation dialog
- Handle state transitions smoothly

---

## 4.1 Main Screen Component

**File:** `components/notebook/TravelNotebookScreen.tsx`

```typescript
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNotebook, useGenerateNotebook, useRegenerateNotebook } from "@/hooks/useNotebook";
import { NotebookEmptyState } from "./EmptyState";
import { NotebookGeneratingState } from "./GeneratingState";
import { NotebookContent } from "./NotebookContent";
import { timeAgo } from "@/utils/format";

interface TravelNotebookScreenProps {
  itineraryId: string;
  itineraryName?: string;
}

export function TravelNotebookScreen({
  itineraryId,
  itineraryName,
}: TravelNotebookScreenProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch notebook data
  const {
    data: notebook,
    isLoading,
    error,
    refetch,
  } = useNotebook(itineraryId);

  // Mutations
  const generateMutation = useGenerateNotebook();
  const regenerateMutation = useRegenerateNotebook();

  // Check if generating
  const isGenerating = generateMutation.isPending || regenerateMutation.isPending;

  /**
   * Handle generate notebook (first time)
   */
  const handleGenerate = async () => {
    try {
      await generateMutation.mutateAsync(itineraryId);
    } catch (err) {
      // Error handled in hook (shows toast)
      console.error("[TravelNotebookScreen] Generate error:", err);
    }
  };

  /**
   * Handle regenerate notebook (with confirmation)
   */
  const handleRegenerate = () => {
    Alert.alert(
      "Làm mới hướng dẫn?",
      "AI sẽ tạo nội dung mới. Nội dung cũ sẽ bị thay thế. Quá trình này mất khoảng 20 giây.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Tiếp tục",
          style: "default",
          onPress: async () => {
            try {
              await regenerateMutation.mutateAsync(itineraryId);
            } catch (err) {
              console.error("[TravelNotebookScreen] Regenerate error:", err);
            }
          },
        },
      ]
    );
  };

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // STATE 1: Loading (initial fetch)
  if (isLoading && !notebook) {
    return (
      <View style={styles.centerContainer}>
        <NotebookGeneratingState isGenerating={false} />
      </View>
    );
  }

  // STATE 2: Generating (AI in progress)
  if (isGenerating) {
    return (
      <View style={styles.centerContainer}>
        <NotebookGeneratingState isGenerating={true} />
      </View>
    );
  }

  // STATE 3: Empty (notebook not generated yet)
  if (!notebook && !error) {
    return (
      <View style={styles.centerContainer}>
        <NotebookEmptyState
          onGenerate={handleGenerate}
          isLoading={isGenerating}
        />
      </View>
    );
  }

  // STATE 4: Error (failed to load)
  if (error && !notebook) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Không thể tải hướng dẫn</Text>
          <Text style={styles.errorMessage}>
            {(error as any)?.message || "Đã xảy ra lỗi. Vui lòng thử lại."}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // STATE 5: Success (display notebook)
  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {notebook?.name || itineraryName || "Hướng dẫn du lịch"}
          </Text>
          {notebook?.updated_at && (
            <Text style={styles.headerSubtitle}>
              Cập nhật {timeAgo(notebook.updated_at)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRegenerate}
          disabled={isGenerating}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="refresh" size={20} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {notebook && <NotebookContent notebook={notebook} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#D1FAE5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#10B981",
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
```

---

## 4.2 State Flow Diagram

```
┌─────────────────┐
│  Initial Load   │
└────────┬────────┘
         │
         ▼
    ┌─────────┐
    │ Loading │ ← Show loading spinner
    └────┬────┘
         │
    ┌────▼─────┐
    │ Notebook │
    │  Exists? │
    └─┬─────┬──┘
      │     │
   No │     │ Yes
      │     │
      ▼     ▼
┌──────────┐  ┌──────────┐
│  Empty   │  │ Success  │
│  State   │  │  State   │
└────┬─────┘  └────┬─────┘
     │             │
     │ Generate    │ Refresh
     │             │
     ▼             ▼
┌─────────────────────┐
│ Generating State    │
│ (Fake Progress)     │
└──────────┬──────────┘
           │
           │ Complete
           │
           ▼
     ┌──────────┐
     │ Success  │
     │  State   │
     └──────────┘
```

---

## 4.3 State Management Details

### State 1: Initial Loading
**When:** First time loading the screen
**Display:** Loading spinner (without progress bar)
**Duration:** ~500ms (cache hit) or ~2s (API call)

### State 2: Empty
**When:** Notebook doesn't exist for this itinerary
**Display:** EmptyState component with generate button
**Action:** User clicks "Tạo hướng dẫn AI" → transitions to Generating

### State 3: Generating
**When:** AI generation in progress (10-30 seconds)
**Display:** GeneratingState with fake progress 0% → 95%
**Duration:** 10-30 seconds
**Exit:** When API returns success → transitions to Success

### State 4: Success
**When:** Notebook exists and loaded successfully
**Display:** NotebookContent with progressive reveal
**Actions:**
- Pull-to-refresh: Refetch data
- Refresh button: Show confirmation → Regenerate
- Scroll: View all sections

### State 5: Error
**When:** API call fails (network error, timeout, 500, etc.)
**Display:** Error icon, message, and retry button
**Action:** User clicks retry → transitions back to Loading

---

## 4.4 Error Handling

### Network Errors
```typescript
// Handled in useNotebook hook
try {
  const res = await notebookService.getNotebookByItinerary(itineraryId);
  // ...
} catch (error: any) {
  if (error.message === "Network request failed") {
    // Show: "Không thể kết nối. Kiểm tra mạng."
  }
  throw error;
}
```

### 404 Errors (Notebook Not Found)
```typescript
// Treated as "empty" state, not error
if (code === 404 || code === 2004) {
  return null; // Show empty state
}
```

### Timeout Errors
```typescript
// httpClient already handles timeout (15s default)
// Shows: "Request timeout. Vui lòng thử lại."
```

### Generation Failures
```typescript
// AI generation fails after 30s
onError: (error: any) => {
  showErrorToast("Không thể tạo hướng dẫn", error);
  // User stays on empty state, can retry
}
```

---

## 4.5 Confirmation Dialog

**Regenerate Confirmation:**
```typescript
Alert.alert(
  "Làm mới hướng dẫn?", // Title
  "AI sẽ tạo nội dung mới. Nội dung cũ sẽ bị thay thế. Quá trình này mất khoảng 20 giây.", // Message
  [
    { text: "Hủy", style: "cancel" },
    { text: "Tiếp tục", onPress: () => regenerate() },
  ]
);
```

**Why confirmation needed:**
- Prevents accidental data loss
- Sets expectations (20 seconds)
- Professional UX pattern

---

## 4.6 Pull-to-Refresh

```typescript
const handleRefresh = async () => {
  setIsRefreshing(true);
  await refetch(); // React Query refetch
  setIsRefreshing(false);
};

// In ScrollView
<ScrollView
  refreshControl={
    <RefreshControl 
      refreshing={isRefreshing} 
      onRefresh={handleRefresh} 
    />
  }
>
```

**Behavior:**
- Refetches from API (bypasses React Query cache)
- Checks AsyncStorage cache first (still fast)
- Shows native pull-to-refresh spinner
- Updates notebook if changed on server

---

## Testing Phase 4

### Manual Testing Checklist

**State Transitions:**
- [ ] Initial load → Empty (no notebook)
- [ ] Empty → Generating (click generate)
- [ ] Generating → Success (wait 20-30s)
- [ ] Success → Success (pull-to-refresh)
- [ ] Success → Generating (click refresh button with confirmation)

**Error Scenarios:**
- [ ] Network offline → Error state
- [ ] API timeout → Error state
- [ ] 500 error → Error state
- [ ] Retry from error → Loading → Success/Error

**UI Interactions:**
- [ ] Sticky header stays at top while scrolling
- [ ] Refresh button only enabled when not generating
- [ ] Confirmation dialog shows before regenerate
- [ ] Pull-to-refresh works correctly
- [ ] All buttons have proper touch targets (44px+)

**Edge Cases:**
- [ ] Navigate away during generation → state preserved
- [ ] Come back after generation complete → show success
- [ ] Generate fails → can retry
- [ ] Multiple rapid clicks on generate → debounced

---

## Performance Optimization

### Prevent Unnecessary Re-renders
```typescript
// Memoize notebook content
const memoizedContent = useMemo(
  () => notebook ? <NotebookContent notebook={notebook} /> : null,
  [notebook?.id, notebook?.updated_at] // Only re-render if notebook changes
);
```

### Optimize ScrollView
```typescript
<ScrollView
  removeClippedSubviews={true} // Unmount offscreen views
  maxToRenderPerBatch={3}
  windowSize={5}
>
```

### Cache Strategy
- First check: AsyncStorage (instant)
- Second: React Query cache (if fresh)
- Last: API call (if stale)

---

## Deliverables Checklist

- [ ] `components/notebook/TravelNotebookScreen.tsx` created
- [ ] All 5 states implemented (loading, empty, generating, success, error)
- [ ] State transitions work smoothly
- [ ] Sticky header with refresh button
- [ ] Regenerate confirmation dialog
- [ ] Pull-to-refresh implemented
- [ ] Error handling comprehensive
- [ ] Tested on iOS and Android
- [ ] Performance optimized

---

## Next Phase

**Phase 5**: Integration with existing itinerary screens and mobile optimizations
