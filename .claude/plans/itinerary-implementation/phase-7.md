# Phase 7: Quality & Accessibility

**Duration:** 3-4 days  
**Priority:** Medium  
**Status:** Not Started  
**Depends On:** All previous phases

## Overview

Production-ready quality: performance optimization, accessibility features, comprehensive testing, and documentation (business doc sections 10, 14, 15).

## Prerequisites

- ✅ All features implemented (Phases 1-6)
- ✅ Code review completed
- ✅ Manual testing done

## Tasks Breakdown

### 1. Performance Optimization
**Estimated:** 6 hours  
**Files:** Multiple

Optimize for smooth 60fps experience on mobile devices.

**Reference:** Business doc section 10 Performance Best Practices

#### 1.1 List Optimization

**FlatList Configuration:**
```typescript
// app/itinerary/index.tsx

<FlatList
  data={itineraries}
  keyExtractor={item => item.id}
  renderItem={renderItem}
  
  // Performance props
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={5}
  
  // Fixed height optimization (if possible)
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  
  // Avoid inline functions
  renderItem={renderItineraryCard}
/>
```

**Memoization:**
```typescript
// components/itinerary/ItineraryCard.tsx

export const ItineraryCard = React.memo(({ itinerary, onPress }: Props) => {
  // Memoize expensive computations
  const displayDate = useMemo(() => 
    formatDateRange(itinerary.startDate, itinerary.endDate),
    [itinerary.startDate, itinerary.endDate]
  );
  
  const handlePress = useCallback(() => {
    onPress(itinerary.id);
  }, [onPress, itinerary.id]);
  
  return (
    <TouchableOpacity onPress={handlePress}>
      {/* ... */}
    </TouchableOpacity>
  );
}, (prev, next) => {
  // Custom comparison for better control
  return prev.itinerary.id === next.itinerary.id &&
         prev.itinerary.is_favorite === next.itinerary.is_favorite;
});
```

#### 1.2 Image Optimization

```typescript
// components/shared/OptimizedImage.tsx

import { Image } from 'expo-image';

type OptimizedImageProps = {
  uri?: string;
  width: number;
  height: number;
  placeholder?: string;
};

export function OptimizedImage({ uri, width, height, placeholder }: Props) {
  // Use expo-image with caching and blurhash
  return (
    <Image
      source={{ uri }}
      placeholder={placeholder || BLURHASH_PLACEHOLDER}
      contentFit="cover"
      transition={200}
      style={{ width, height }}
      cachePolicy="memory-disk"
    />
  );
}
```

#### 1.3 Map Performance

```typescript
// components/itinerary/ItineraryRouteMap.tsx

// Memoize markers and coords
const markers = useMemo(() => 
  tripItems.map(item => ({
    id: item.id,
    coordinate: {
      latitude: item.location?.lat || 0,
      longitude: item.location?.lng || 0,
    },
  })),
  [tripItems]
);

const routeCoords = useMemo(() => 
  markers.map(m => m.coordinate),
  [markers]
);

// Throttle map updates
const [region, setRegion] = useState<Region>(initialRegion);
const onRegionChange = useCallback(
  throttle((newRegion: Region) => setRegion(newRegion), 300),
  []
);
```

**Acceptance Criteria:**
- [ ] Lists scroll at 60fps
- [ ] No jank when opening sheets
- [ ] Images load progressively
- [ ] Map interactions smooth
- [ ] No memory leaks
- [ ] App size < 50MB

---

### 2. Accessibility Implementation
**Estimated:** 5 hours  
**Files:** Multiple

WCAG AA compliance for inclusive design.

**Reference:** Business doc section 15 Accessibility (a11y)

#### 2.1 Screen Reader Support

```typescript
// components/itinerary/ItineraryCard.tsx

export function ItineraryCard({ itinerary }: Props) {
  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Lịch trình ${itinerary.name}`}
      accessibilityHint="Nhấn để xem chi tiết"
      accessibilityState={{
        selected: itinerary.is_favorite,
      }}
    >
      {/* Visual content */}
      
      {/* Status badge with accessibility */}
      <StatusBadge
        status={itinerary.status}
        accessibilityLabel={`Trạng thái: ${getStatusLabel(itinerary.status)}`}
      />
      
      {/* Favorite button */}
      <TouchableOpacity
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={
          itinerary.is_favorite 
            ? "Bỏ yêu thích" 
            : "Thêm vào yêu thích"
        }
        onPress={handleFavorite}
      >
        <Ionicons name={itinerary.is_favorite ? 'heart' : 'heart-outline'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
```

**Form Accessibility:**
```typescript
// components/forms/TextInput.tsx

export function TextInput({ label, error, required, ...props }: Props) {
  const inputId = useId();
  
  return (
    <View>
      <Text
        nativeID={`${inputId}-label`}
        accessible={false}
      >
        {label} {required && <Text>*</Text>}
      </Text>
      <RNTextInput
        accessibilityLabel={label}
        accessibilityHint={required ? "Bắt buộc" : undefined}
        accessibilityInvalid={!!error}
        accessibilityErrorMessage={error}
        {...props}
      />
      {error && (
        <Text
          nativeID={`${inputId}-error`}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}
    </View>
  );
}
```

#### 2.2 Dynamic Type Support

```typescript
// utils/textStyles.ts

import { Platform, PixelRatio } from 'react-native';

// Respect system font size
export const getFontSize = (base: number) => {
  if (Platform.OS === 'ios') {
    // iOS handles this automatically with Dynamic Type
    return base;
  }
  // Android - use PixelRatio for consistency
  return PixelRatio.roundToNearestPixel(base);
};

// Use in components
<Text style={{ fontSize: getFontSize(16) }}>
  Content that respects user's font size preference
</Text>
```

#### 2.3 Color Contrast (WCAG AA)

```typescript
// utils/colors.ts

// Ensure all text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large)

export const colors = {
  // Primary text on white background - contrast ratio: 12.63:1 ✅
  textPrimary: '#1F2937',
  
  // Secondary text on white - contrast ratio: 7.38:1 ✅
  textSecondary: '#4B5563',
  
  // Primary button - contrast ratio: 4.53:1 ✅
  primary: '#2BB673',
  primaryText: '#FFFFFF',
  
  // Error - contrast ratio: 5.93:1 ✅
  error: '#EF4444',
  errorText: '#FFFFFF',
};

// Verify contrast in code
import { getContrastRatio } from 'polished';

const ratio = getContrastRatio(colors.primary, colors.primaryText);
if (ratio < 4.5) {
  console.warn('Insufficient contrast ratio:', ratio);
}
```

#### 2.4 Focus Management

```typescript
// hooks/useFocusOnMount.ts

import { useRef, useEffect } from 'react';
import { TextInput } from 'react-native';

export function useFocusOnMount() {
  const ref = useRef<TextInput>(null);
  
  useEffect(() => {
    // Focus first input when screen mounts
    setTimeout(() => {
      ref.current?.focus();
    }, 300);
  }, []);
  
  return ref;
}

// Usage in forms
const firstInputRef = useFocusOnMount();

<TextInput ref={firstInputRef} />
```

**Acceptance Criteria:**
- [ ] All interactive elements have labels
- [ ] Form errors announced by screen reader
- [ ] Status changes announced
- [ ] Tab navigation works with keyboard
- [ ] Color contrast meets WCAG AA
- [ ] Dynamic type supported (iOS)
- [ ] Focus indicators visible
- [ ] No accessibility warnings in tests

---

### 3. Error Boundaries & Resilience
**Estimated:** 3 hours  
**Files:** Multiple

Wrap critical sections with error boundaries.

**Implementation:**
```typescript
// app/itinerary/[id].tsx

export default function ItineraryDetailScreen() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <ErrorFallback
          error={error}
          onReset={reset}
          message="Không tải được lịch trình"
        />
      )}
    >
      <ItineraryDetailContent />
    </ErrorBoundary>
  );
}

// Separate component for actual content
function ItineraryDetailContent() {
  const { itineraryId } = useLocalSearchParams();
  const { data, isLoading, error } = useItineraryDetail(itineraryId);
  
  // Graceful degradation
  if (error) {
    return <ErrorCard type="not_found" onRetry={refetch} />;
  }
  
  if (isLoading) {
    return <ItineraryDetailSkeleton />;
  }
  
  // Main content
}
```

**Critical Sections:**
- Detail screen (trip items)
- List screen (itinerary list)
- Map component (location services)
- Form submissions
- Image uploads

**Acceptance Criteria:**
- [ ] All screens wrapped in ErrorBoundary
- [ ] Errors don't crash app
- [ ] Fallback UI shows retry option
- [ ] Errors logged to console (future: Sentry)
- [ ] Graceful degradation for missing data

---

### 4. Testing Suite
**Estimated:** 8 hours  
**Files:** Multiple test files

Comprehensive test coverage.

**Reference:** Business doc section 14 Testing Strategy

#### 4.1 Unit Tests (Jest + React Native Testing Library)

```typescript
// hooks/__tests__/useItineraries.test.ts

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useItineraries } from '../useItineraries';

describe('useItineraries', () => {
  it('fetches itineraries successfully', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    
    const { result } = renderHook(() => useItineraries(), { wrapper });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(3);
  });
  
  it('handles fetch error', async () => {
    // Mock API error
    // ...test error handling
  });
});
```

```typescript
// components/__tests__/StatusBadge.test.tsx

import { render } from '@testing-library/react-native';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders GENERATING status with blue color', () => {
    const { getByText } = render(<StatusBadge status="GENERATING" />);
    const badge = getByText('Đang tạo');
    expect(badge).toBeTruthy();
    // Check color, size, etc.
  });
  
  it('renders all status types correctly', () => {
    const statuses = ['GENERATING', 'FAILED', 'DRAFT', 'CONFIRMED'];
    statuses.forEach(status => {
      const { getByText } = render(<StatusBadge status={status} />);
      // Assert each renders
    });
  });
});
```

#### 4.2 Integration Tests

```typescript
// screens/__tests__/ItineraryDetail.integration.test.tsx

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ItineraryDetailScreen from '../itinerary/[id]';

describe('ItineraryDetailScreen Integration', () => {
  it('loads and displays itinerary with trip items', async () => {
    const { getByText, getAllByTestId } = render(
      <ItineraryDetailScreen />
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(getByText('Du lịch Đà Nẵng')).toBeTruthy();
    });
    
    // Check trip items rendered
    const tripItems = getAllByTestId('trip-item-card');
    expect(tripItems).toHaveLength(5);
  });
  
  it('adds trip item successfully', async () => {
    const { getByText, getByTestId } = render(
      <ItineraryDetailScreen />
    );
    
    // Open add form
    fireEvent.press(getByTestId('add-trip-item-button'));
    
    // Fill form
    // ... fill location, time, etc.
    
    // Submit
    fireEvent.press(getByText('Thêm'));
    
    // Assert new item appears
    await waitFor(() => {
      expect(getByText('New Location')).toBeTruthy();
    });
  });
});
```

#### 4.3 E2E Tests (Detox)

```typescript
// e2e/itinerary.e2e.ts

describe('Itinerary Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });
  
  it('should create manual itinerary', async () => {
    // Navigate to create screen
    await element(by.id('create-itinerary-button')).tap();
    
    // Fill form
    await element(by.id('name-input')).typeText('Test Trip');
    await element(by.id('start-date-picker')).tap();
    // ... select date
    
    // Submit
    await element(by.id('submit-button')).tap();
    
    // Assert navigation to detail
    await expect(element(by.text('Test Trip'))).toBeVisible();
  });
  
  it('should favorite and unfavorite itinerary', async () => {
    // Tap favorite button
    await element(by.id('favorite-button')).tap();
    
    // Assert heart filled
    await expect(element(by.id('favorite-icon-filled'))).toBeVisible();
    
    // Tap again to unfavorite
    await element(by.id('favorite-button')).tap();
    
    // Assert heart outline
    await expect(element(by.id('favorite-icon-outline'))).toBeVisible();
  });
  
  it('should handle AI generation polling', async () => {
    // Start AI generation
    await element(by.id('ai-generate-button')).tap();
    
    // Assert polling overlay visible
    await expect(element(by.text('Đang tạo lịch trình...'))).toBeVisible();
    
    // Wait for completion (mock 5s)
    await waitFor(element(by.text('Du lịch AI')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Assert trip items generated
    await expect(element(by.id('trip-item-0'))).toBeVisible();
  });
});
```

**Test Coverage Goals:**
- [ ] Hooks: >80%
- [ ] Components: >70%
- [ ] Screens: >60%
- [ ] Overall: >70%

**Acceptance Criteria:**
- [ ] All critical paths tested
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests cover main flows
- [ ] Coverage meets goals
- [ ] CI/CD runs tests automatically

---

### 5. Documentation
**Estimated:** 3 hours  
**Files:** Multiple markdown files

**docs/itinerary-module.md:**
```markdown
# Itinerary Module Documentation

## Overview
The Itinerary module handles trip planning, AI generation, and itinerary management.

## Architecture
- **State Management:** React Query for server state, local state for UI
- **API Client:** `services/itineraries.ts`
- **Hooks:** `hooks/useItineraries.ts`, `hooks/useFavorites.ts`
- **Screens:** `app/itinerary/`
- **Components:** `components/itinerary/`

## Key Features
### AI Generation
- HTTP 202 async pattern
- Polling every 4s when status=GENERATING
- See `useItineraryDetail` hook for implementation

### Optimistic Updates
- Favorite/unfavorite uses optimistic updates
- Rollback on error
- See `hooks/useFavorites.ts`

## API Endpoints
- GET `/itineraries/me` - User's itineraries
- GET `/itineraries/:id` - Detail
- POST `/itineraries` - Create manual
- POST `/itineraries/ai-generate` - AI generation (202)
- POST `/itineraries/:id/ai-modify` - Replace places
- POST `/itineraries/:id/favorites` - Favorite
- DELETE `/itineraries/:id/favorites` - Unfavorite

## Data Flow
[Diagram showing component -> hook -> service -> API flow]

## Common Patterns
### Form Validation
All forms use react-hook-form + zod for validation.

### Error Handling
All API calls wrapped in try/catch with error boundaries.

### Testing
- Unit: `__tests__/` co-located with files
- Integration: `screens/__tests__/`
- E2E: `e2e/`

## Troubleshooting
### Polling doesn't stop
Check if `refetchInterval` callback returns false when status != GENERATING.

### Optimistic update doesn't rollback
Verify `onError` handler restores previous cache data.
```

**Component Documentation:**
```typescript
// components/itinerary/StatusBadge.tsx

/**
 * StatusBadge displays itinerary status with color coding.
 * 
 * @example
 * ```tsx
 * <StatusBadge status="GENERATING" size="md" />
 * ```
 * 
 * @param status - Itinerary status (see ITINERARY_STATUS const)
 * @param size - Badge size: 'sm' | 'md' | 'lg'
 * @param animated - Enable pulse animation for GENERATING (default: true)
 */
export function StatusBadge({ status, size = 'md', animated = true }: Props) {
  // ...
}
```

**Acceptance Criteria:**
- [ ] Module overview documented
- [ ] Architecture explained
- [ ] API endpoints listed
- [ ] Common patterns described
- [ ] Troubleshooting guide
- [ ] All public APIs documented
- [ ] README updated

---

## Final Checklist

### Code Quality
- [ ] No console.log statements
- [ ] No hardcoded strings (use i18n)
- [ ] No magic numbers (use constants)
- [ ] TypeScript strict mode
- [ ] ESLint warnings resolved
- [ ] Prettier formatted

### Performance
- [ ] Lists scroll smoothly
- [ ] Images optimized
- [ ] Bundle size acceptable
- [ ] No memory leaks
- [ ] Profiled with React DevTools

### Accessibility
- [ ] Screen reader tested (iOS VoiceOver, Android TalkBack)
- [ ] Color contrast verified
- [ ] Touch targets ≥ 44px
- [ ] Focus management works
- [ ] Dynamic type supported

### Testing
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing on devices
- [ ] Regression testing complete

### Documentation
- [ ] Module documented
- [ ] APIs documented
- [ ] README updated
- [ ] CHANGELOG updated

### Deployment
- [ ] Version bumped
- [ ] Release notes written
- [ ] App submitted for review (if needed)
- [ ] Monitoring enabled
- [ ] Rollback plan ready

## Acceptance Criteria (Phase Complete)

- [ ] All 5 tasks completed
- [ ] Performance optimized (60fps)
- [ ] Accessibility implemented (WCAG AA)
- [ ] Error boundaries in place
- [ ] Test coverage >70%
- [ ] Documentation complete
- [ ] Code review passed
- [ ] Merged to main branch
- [ ] **READY FOR PRODUCTION**

## Resources

- Business doc: Section 10, 14, 15
- React Native Performance: https://reactnative.dev/docs/performance
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Testing Library: https://testing-library.com/docs/react-native-testing-library/intro

## Notes

- Performance testing on real devices is critical
- Accessibility testing with actual screen readers
- E2E tests may need backend mocking
- Monitor crash reports in production
- Iterate based on user feedback
