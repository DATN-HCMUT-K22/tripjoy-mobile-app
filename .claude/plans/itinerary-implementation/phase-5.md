# Phase 5: AI Features & Polish

**Duration:** 3-4 days  
**Priority:** Medium  
**Status:** Not Started  
**Depends On:** Phase 1, Phase 3

## Overview

Complete AI integration features including AI Modify (remove unwanted places), enhance polling UI, and polish error handling (business doc sections 4.1, 4.8).

## Prerequisites

- ✅ `useGenerateItinerary()` hook exists
- ✅ `useAiModifyItinerary()` hook exists
- ✅ Polling logic in `useItineraryDetail()` works
- ✅ Phase 3 complete (trip items with map)

## Current State

**AI Generation:**
- ✅ Hook exists with 202 handling
- ✅ Polling in detail screen
- ✅ Generation UI exists in `/create/ai-wait.tsx`
- ❌ Status polling UI needs polish
- ❌ Progress indicators missing

**AI Modify:**
- ✅ Hook exists
- ❌ UI to select unwanted places missing
- ❌ Suggestion UI missing

## Tasks Breakdown

### 1. AI Modify UI - Remove Unwanted Places
**Estimated:** 6 hours  
**File:** `components/itinerary/AiModifySheet.tsx`

UI for users to mark places they don't like and request AI replacement.

**Reference:** Business doc section 4.1 (AI Generation), section 13.2

**User Flow:**
1. User taps "Đề xuất thay thế" on trip item
2. Sheet opens with place details
3. User confirms "Không thích địa điểm này"
4. AI finds alternative and updates itinerary
5. Polling UI shows "Đang tìm địa điểm khác..."

**Implementation:**
```typescript
// components/itinerary/AiModifySheet.tsx

type AiModifySheetProps = {
  visible: boolean;
  onClose: () => void;
  itineraryId: string;
  tripItem: TripItemResponse;
};

export function AiModifySheet({ 
  visible, 
  onClose, 
  itineraryId, 
  tripItem 
}: AiModifySheetProps) {
  const aiModifyMutation = useAiModifyItinerary();
  
  const handleRemovePlace = async () => {
    try {
      // unwantedPlaceIds uses location_id (flat) or location.id
      const placeId = tripItem.location_id || tripItem.location?.id;
      if (!placeId) {
        showErrorToast('Không tìm thấy ID địa điểm');
        return;
      }
      
      await aiModifyMutation.mutateAsync({
        itineraryId,
        payload: {
          unwantedPlaceIds: [placeId],
        },
      });
      
      onClose();
      // Toast shown in mutation onSuccess
    } catch (error) {
      // Error handled in mutation
    }
  };
  
  return (
    <BottomSheet visible={visible} onDismiss={onClose}>
      <View className="p-6">
        <Text className="text-xl font-bold mb-4">
          Thay thế địa điểm
        </Text>
        
        {/* Place Info */}
        <View className="bg-gray-50 p-4 rounded-xl mb-6">
          <Text className="font-semibold text-lg mb-1">
            {tripItem.location?.name}
          </Text>
          <Text className="text-gray-600 text-sm">
            {tripItem.location?.full_address}
          </Text>
        </View>
        
        {/* Confirmation Message */}
        <Text className="text-gray-700 mb-6">
          AI sẽ tìm địa điểm tương tự và phù hợp hơn để thay thế. 
          Quá trình này có thể mất vài giây.
        </Text>
        
        {/* Actions */}
        <Button
          onPress={handleRemovePlace}
          loading={aiModifyMutation.isPending}
          className="mb-3"
        >
          Tìm địa điểm thay thế
        </Button>
        
        <Button
          variant="outline"
          onPress={onClose}
        >
          Hủy
        </Button>
      </View>
    </BottomSheet>
  );
}
```

**Integration in Detail Screen:**
```typescript
// app/itinerary/[id].tsx

function TripItemCard({ item }) {
  const [aiModifyVisible, setAiModifyVisible] = useState(false);
  
  return (
    <>
      <View>
        {/* Existing card content */}
        <TouchableOpacity onPress={() => setAiModifyVisible(true)}>
          <Text className="text-primary text-sm">
            ✨ Đề xuất thay thế
          </Text>
        </TouchableOpacity>
      </View>
      
      <AiModifySheet
        visible={aiModifyVisible}
        onClose={() => setAiModifyVisible(false)}
        itineraryId={itineraryId}
        tripItem={item}
      />
    </>
  );
}
```

**Acceptance Criteria:**
- [ ] Sheet opens from trip item card
- [ ] Shows place being replaced
- [ ] Confirm button triggers AI modify
- [ ] Loading state during API call
- [ ] Success toast shows
- [ ] Trip items update after modification
- [ ] Polling continues if status GENERATING
- [ ] Error handling works

---

### 2. Enhanced Polling UI with Progress
**Estimated:** 4 hours  
**File:** `components/itinerary/GeneratingOverlay.tsx`

Visual feedback when AI is generating/modifying itinerary.

**Reference:** Business doc section 4.1.4 (Polling UI)

**Design:**
```
┌────────────────────────────────┐
│                                │
│      [Animated Spinner]        │
│                                │
│   Đang tạo lịch trình...       │
│                                │
│   [Progress Bar: 60%]          │
│                                │
│   ⏱️ Còn khoảng 10 giây        │
│                                │
└────────────────────────────────┘
```

**Implementation:**
```typescript
// components/itinerary/GeneratingOverlay.tsx

type GeneratingOverlayProps = {
  visible: boolean;
  message?: string;
  showProgress?: boolean;
};

export function GeneratingOverlay({ 
  visible, 
  message = 'Đang tạo lịch trình...', 
  showProgress = true 
}: GeneratingOverlayProps) {
  // Fake progress for better UX (real progress unknown)
  const progress = useFakeProgress({
    duration: 30000, // 30s estimate
    enabled: visible && showProgress,
  });
  
  if (!visible) return null;
  
  return (
    <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
      <View className="bg-white rounded-2xl p-8 mx-8 items-center">
        {/* Spinner */}
        <ActivityIndicator size="large" color="#2BB673" />
        
        {/* Message */}
        <Text className="text-lg font-semibold mt-6 mb-4 text-center">
          {message}
        </Text>
        
        {/* Progress Bar */}
        {showProgress && (
          <View className="w-full">
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <Animated.View
                className="h-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </View>
            <Text className="text-gray-600 text-sm mt-2 text-center">
              ⏱️ Còn khoảng {Math.ceil((100 - progress) / 100 * 30)} giây
            </Text>
          </View>
        )}
        
        {/* Tip */}
        <Text className="text-gray-500 text-xs mt-4 text-center">
          💡 Mẹo: AI đang phân tích hàng nghìn địa điểm để tạo lịch trình tốt nhất cho bạn
        </Text>
      </View>
    </View>
  );
}

// Hook for fake progress
function useFakeProgress({ duration, enabled }: { duration: number; enabled: boolean }) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (!enabled) {
      setProgress(0);
      return;
    }
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const percent = Math.min(95, (elapsed / duration) * 100); // Cap at 95%
      setProgress(percent);
    }, 100);
    
    return () => clearInterval(interval);
  }, [enabled, duration]);
  
  return progress;
}
```

**Usage in Detail Screen:**
```typescript
// app/itinerary/[id].tsx

const isGenerating = normalizeStatus(itinerary?.status) === ITINERARY_STATUS.GENERATING;

return (
  <View className="flex-1">
    {/* Main content */}
    <ScrollView>
      {/* ... */}
    </ScrollView>
    
    {/* Overlay when generating */}
    <GeneratingOverlay
      visible={isGenerating}
      message="Đang tạo lịch trình..."
    />
  </View>
);
```

**Acceptance Criteria:**
- [ ] Overlay shows when status is GENERATING
- [ ] Progress bar animates smoothly
- [ ] Time estimate updates
- [ ] Tip text rotates (optional)
- [ ] Dismisses when status changes
- [ ] Works for both generate and modify

---

### 3. Status-Specific UI States
**Estimated:** 3 hours  
**Files:** Multiple (detail screen, list screen)

Handle all itinerary statuses with appropriate UI.

**Reference:** Business doc section 4.8 Error Handling & Recovery

**Status Mapping:**
- **GENERATING** → Show polling overlay, disable actions
- **FAILED** → Show error card with retry button
- **DRAFT** → Show "Hoàn thiện lịch trình" CTA
- **CONFIRMED** → Normal view, all actions enabled
- **IN_PROGRESS** → Show "Đang diễn ra" badge
- **COMPLETED** → Show "Đã hoàn thành" badge, disable edit

**Implementation:**
```typescript
// app/itinerary/[id].tsx

function ItineraryStatusHandler({ itinerary }: { itinerary: ItineraryResponse }) {
  const status = normalizeStatus(itinerary.status);
  const router = useRouter();
  
  // FAILED status
  if (status === ITINERARY_STATUS.FAILED) {
    return (
      <View className="bg-red-50 border border-red-200 rounded-xl p-4 mx-4 mb-4">
        <View className="flex-row items-start">
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <View className="flex-1 ml-3">
            <Text className="font-bold text-red-900">
              Tạo lịch trình thất bại
            </Text>
            <Text className="text-red-700 text-sm mt-1">
              AI không thể tạo lịch trình với thông tin này. Vui lòng thử lại hoặc tạo thủ công.
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onPress={() => router.push('/itinerary/create')}
            className="flex-1"
          >
            Tạo thủ công
          </Button>
          <Button
            size="sm"
            onPress={() => {/* Retry AI generation */}}
            className="flex-1"
          >
            Thử lại
          </Button>
        </View>
      </View>
    );
  }
  
  // DRAFT status
  if (status === ITINERARY_STATUS.DRAFT) {
    return (
      <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mx-4 mb-4">
        <Text className="font-semibold text-amber-900 mb-1">
          📝 Lịch trình nháp
        </Text>
        <Text className="text-amber-700 text-sm">
          Hoàn thiện lịch trình để chia sẻ với nhóm
        </Text>
      </View>
    );
  }
  
  return null;
}
```

**Acceptance Criteria:**
- [ ] GENERATING shows overlay
- [ ] FAILED shows error + retry
- [ ] DRAFT shows completion CTA
- [ ] CONFIRMED normal view
- [ ] IN_PROGRESS shows badge
- [ ] COMPLETED disables edit

---

### 4. Error Handling Enhancement
**Estimated:** 4 hours  
**Files:** Multiple

Comprehensive error handling per business doc section 4.8.

**Reference:** Business doc section 9 Error Handling & Edge Cases

**Error Types:**
1. **Network Error** (No Internet) → Offline banner + retry
2. **AI Generation Failed** → Error card + manual create option
3. **Validation Error (400)** → Inline field errors
4. **Permission Error (403)** → "Access denied" message
5. **Not Found (404)** → "Lịch trình không tồn tại"
6. **Server Error (500)** → Generic error + retry

**Implementation:**
```typescript
// components/errors/ErrorCard.tsx

type ErrorType = 'network' | 'ai_failed' | 'validation' | 'permission' | 'not_found' | 'server';

type ErrorCardProps = {
  type: ErrorType;
  message?: string;
  onRetry?: () => void;
  onAction?: () => void;
  actionLabel?: string;
};

export function ErrorCard({ type, message, onRetry, onAction, actionLabel }: ErrorCardProps) {
  const config = getErrorConfig(type);
  
  return (
    <View className={`rounded-xl p-4 border ${config.bgClass} ${config.borderClass}`}>
      <View className="flex-row items-start">
        <Ionicons name={config.icon} size={24} color={config.iconColor} />
        <View className="flex-1 ml-3">
          <Text className={`font-bold ${config.titleClass}`}>
            {config.title}
          </Text>
          <Text className={`text-sm mt-1 ${config.messageClass}`}>
            {message || config.defaultMessage}
          </Text>
        </View>
      </View>
      
      {(onRetry || onAction) && (
        <View className="flex-row gap-2 mt-4">
          {onRetry && (
            <Button variant="outline" size="sm" onPress={onRetry} className="flex-1">
              Thử lại
            </Button>
          )}
          {onAction && (
            <Button size="sm" onPress={onAction} className="flex-1">
              {actionLabel || 'Tiếp tục'}
            </Button>
          )}
        </View>
      )}
    </View>
  );
}

function getErrorConfig(type: ErrorType) {
  const configs: Record<ErrorType, any> = {
    network: {
      icon: 'cloud-offline-outline',
      iconColor: '#9CA3AF',
      title: 'Không có kết nối',
      defaultMessage: 'Vui lòng kiểm tra kết nối internet và thử lại',
      bgClass: 'bg-gray-50',
      borderClass: 'border-gray-200',
      titleClass: 'text-gray-900',
      messageClass: 'text-gray-700',
    },
    ai_failed: {
      icon: 'alert-circle',
      iconColor: '#EF4444',
      title: 'Tạo lịch trình thất bại',
      defaultMessage: 'AI không thể tạo lịch với thông tin này',
      bgClass: 'bg-red-50',
      borderClass: 'border-red-200',
      titleClass: 'text-red-900',
      messageClass: 'text-red-700',
    },
    // ... other types
  };
  return configs[type];
}
```

**Usage:**
```typescript
// In screens with error states

if (isError) {
  const errorType = detectErrorType(error);
  return (
    <ErrorCard
      type={errorType}
      message={error.message}
      onRetry={refetch}
      onAction={() => router.push('/itinerary/create')}
      actionLabel="Tạo thủ công"
    />
  );
}
```

**Acceptance Criteria:**
- [ ] All error types handled
- [ ] Network error shows offline banner
- [ ] AI failed shows alternatives
- [ ] 404 shows "not found" message
- [ ] Retry button works
- [ ] Alternative actions work

---

### 5. Loading State Refinement
**Estimated:** 2 hours  
**Files:** Multiple

Polish loading states across all screens.

**Reference:** Business doc section 11.3 Loading States

**Requirements:**
- Skeleton loaders for content
- Shimmer animation
- Progressive loading (show what's available)
- No flash of empty state

**Implementation:**
```typescript
// components/shared/ItineraryDetailSkeleton.tsx

export function ItineraryDetailSkeleton() {
  return (
    <View className="flex-1">
      {/* Hero Skeleton */}
      <View className="h-48 bg-gray-200 animate-shimmer" />
      
      {/* Title Skeleton */}
      <View className="px-4 pt-4">
        <View className="h-6 w-3/4 bg-gray-200 rounded animate-shimmer" />
        <View className="h-4 w-1/2 bg-gray-200 rounded mt-2 animate-shimmer" />
      </View>
      
      {/* Trip Items Skeleton */}
      <View className="px-4 pt-6">
        {[1, 2, 3].map(i => (
          <View key={i} className="bg-gray-100 rounded-xl p-4 mb-3">
            <View className="h-4 w-1/4 bg-gray-200 rounded animate-shimmer" />
            <View className="h-5 w-3/4 bg-gray-200 rounded mt-2 animate-shimmer" />
            <View className="h-3 w-1/2 bg-gray-200 rounded mt-2 animate-shimmer" />
          </View>
        ))}
      </View>
    </View>
  );
}
```

**Acceptance Criteria:**
- [ ] Skeleton matches real content layout
- [ ] Shimmer animation smooth
- [ ] No flash of empty state
- [ ] Progressive loading when possible

---

## Testing Requirements

### Unit Tests
- [ ] useFakeProgress calculates correctly
- [ ] detectErrorType returns correct type
- [ ] Status normalization works

### Integration Tests
- [ ] AI modify triggers mutation
- [ ] Polling continues until CONFIRMED
- [ ] Error card shows on failure
- [ ] Retry refetches data
- [ ] Overlay dismisses on success

### E2E Tests
- [ ] User removes unwanted place via AI
- [ ] AI finds replacement
- [ ] User sees progress during generation
- [ ] User retries failed generation
- [ ] User creates manual itinerary from failed AI

## Acceptance Criteria (Phase Complete)

- [ ] All 5 tasks completed
- [ ] AI modify UI functional
- [ ] Polling UI polished
- [ ] All statuses handled
- [ ] Error handling comprehensive
- [ ] Loading states smooth
- [ ] Code review passed
- [ ] Tests passing
- [ ] Merged to main branch

## Resources

- Business doc: Section 4.1, 4.8, 9, 11.3
- Existing: `/app/create/ai-wait.tsx` for polling patterns

## Notes

- Test AI modify on real backend
- Fake progress is OK for UX (real progress unknown)
- Error messages should be Vietnamese
- Consider analytics for AI usage
