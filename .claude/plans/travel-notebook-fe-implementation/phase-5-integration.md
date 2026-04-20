# Phase 5: Integration & Mobile Optimization (Day 4-5 - 6 hours)

## Objectives
- Create notebook route in app directory
- Add navigation button to itinerary detail screen
- Implement mobile optimizations (touch targets, responsive design)
- Test on various device sizes

---

## 5.1 Create Notebook Route

**File:** `app/itinerary/notebook.tsx`

```typescript
import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SharedHeader } from "@/components/common/SharedHeader";
import { TravelNotebookScreen } from "@/components/notebook/TravelNotebookScreen";
import { useItineraryDetail } from "@/hooks/useItineraries";

/**
 * Travel Notebook route for an itinerary
 * Route: /itinerary/notebook?id={itineraryId}
 */
export default function ItineraryNotebookRoute() {
  const router = useRouter();
  const { id: itineraryId } = useLocalSearchParams<{ id: string }>();
  
  // Fetch itinerary details for name
  const { data: detail } = useItineraryDetail(itineraryId);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header with back button */}
      <SharedHeader
        leftElement={
          <Ionicons
            name="chevron-back"
            size={24}
            color="#111827"
            onPress={() => router.back()}
          />
        }
        centerElement={null}
        rightElement={null}
        withMenuDrawer={false}
        showBorderBottom
      />

      {/* Main content */}
      <TravelNotebookScreen
        itineraryId={itineraryId || ""}
        itineraryName={detail?.title}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
```

**Route URL:**
- `/itinerary/notebook?id=123` - View notebook for itinerary 123

---

## 5.2 Add Navigation Button to Itinerary Detail

**Modify:** `app/itinerary/[id].tsx` (or wherever itinerary detail screen is)

### Option A: Tab Navigation (Recommended)

If your itinerary detail uses tabs (Overview, Activities, Expenses, etc.), add a new tab:

```typescript
import { useRouter } from "expo-router";

// Inside the component
const router = useRouter();

// Add to tab configuration
const tabs = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'activities', label: 'Hoạt động' },
  { key: 'expenses', label: 'Chi phí' },
  { key: 'notebook', label: 'Hướng dẫn', icon: 'book' }, // NEW TAB
];

// Handle tab press
const handleTabPress = (key: string) => {
  if (key === 'notebook') {
    router.push(`/itinerary/notebook?id=${itineraryId}`);
  } else {
    setActiveTab(key);
  }
};
```

### Option B: Floating Action Button

If tabs aren't available, add a floating button:

```typescript
import { useRouter } from "expo-router";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Inside the component
const router = useRouter();

// Add this button to your render
<TouchableOpacity
  style={styles.notebookFab}
  onPress={() => router.push(`/itinerary/notebook?id=${itineraryId}`)}
  activeOpacity={0.8}
>
  <Ionicons name="book" size={24} color="#FFFFFF" />
</TouchableOpacity>

// Add styles
const styles = StyleSheet.create({
  notebookFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
```

### Option C: Card/Button in Content

Add a prominent card in the itinerary detail:

```typescript
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Inside the component
const router = useRouter();

// Add this card in your content
<TouchableOpacity
  style={styles.notebookCard}
  onPress={() => router.push(`/itinerary/notebook?id=${itineraryId}`)}
  activeOpacity={0.7}
>
  <View style={styles.notebookCardIcon}>
    <Ionicons name="book" size={32} color="#10B981" />
  </View>
  <View style={styles.notebookCardContent}>
    <Text style={styles.notebookCardTitle}>Hướng dẫn du lịch AI</Text>
    <Text style={styles.notebookCardSubtitle}>
      Ẩm thực, văn hóa, khí hậu và nhiều hơn nữa
    </Text>
  </View>
  <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
</TouchableOpacity>

// Add styles
const styles = StyleSheet.create({
  notebookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notebookCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  notebookCardContent: {
    flex: 1,
  },
  notebookCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notebookCardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
});
```

---

## 5.3 Mobile Optimizations

### Touch Targets (Minimum 44x44px)

Ensure all interactive elements meet Apple's and Google's accessibility guidelines:

```typescript
// ❌ Bad - too small
<TouchableOpacity style={{ padding: 4 }}>
  <Ionicons name="refresh" size={16} />
</TouchableOpacity>

// ✅ Good - minimum 44px
<TouchableOpacity 
  style={{ padding: 12 }} // 12*2 + 20 = 44px
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} // Extend touch area
>
  <Ionicons name="refresh" size={20} />
</TouchableOpacity>
```

### Responsive Font Sizes

**File:** `utils/responsive.ts`

```typescript
import { Dimensions, Platform } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const responsive = {
  // Device checks
  isSmallDevice: SCREEN_WIDTH < 375,       // iPhone SE
  isMediumDevice: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 768,  // Most phones
  isTablet: SCREEN_WIDTH >= 768,           // iPad, tablets
  isIOS: Platform.OS === "ios",
  isAndroid: Platform.OS === "android",
  
  // Scale font sizes
  scaleFontSize: (size: number): number => {
    if (responsive.isSmallDevice) return size * 0.9;
    if (responsive.isTablet) return size * 1.1;
    return size;
  },
  
  // Scale spacing
  scaleSpacing: (size: number): number => {
    if (responsive.isSmallDevice) return size * 0.9;
    if (responsive.isTablet) return size * 1.2;
    return size;
  },
  
  // Get screen dimensions
  screenWidth: SCREEN_WIDTH,
  screenHeight: Dimensions.get("window").height,
};
```

### Usage in Components

```typescript
import { responsive } from "@/utils/responsive";

const styles = StyleSheet.create({
  title: {
    fontSize: responsive.scaleFontSize(24),
    padding: responsive.scaleSpacing(16),
  },
});
```

### Sticky Header on Mobile

```typescript
<ScrollView
  stickyHeaderIndices={[0]} // Make first child sticky
  showsVerticalScrollIndicator={false}
>
  <View style={styles.stickyHeader}>
    {/* Header content */}
  </View>
  
  {/* Scrollable content */}
</ScrollView>
```

### Safe Area Handling

```typescript
import { SafeAreaView } from "react-native-safe-area-context";

// Wrap entire screen
<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
  {/* Content */}
</SafeAreaView>

// Or use SafeAreaView for specific edges
<SafeAreaView edges={["top"]}> {/* Only top notch */}
  {/* Content */}
</SafeAreaView>
```

---

## 5.4 Device-Specific Testing

### Test Matrix

| Device | Screen Size | Test Cases |
|--------|-------------|------------|
| iPhone SE | 375 x 667 | Small device optimizations |
| iPhone 12 | 390 x 844 | Standard phone |
| iPhone 14 Pro Max | 430 x 932 | Large phone, Dynamic Island |
| iPad Air | 820 x 1180 | Tablet layout |
| Android Small | 360 x 640 | Small Android |
| Android Large | 412 x 915 | Large Android |

### Testing Checklist

**Layout:**
- [ ] All text visible without truncation
- [ ] No horizontal scrolling
- [ ] Proper spacing on small devices
- [ ] Content fills screen on tablets
- [ ] Safe area respected (notch, home indicator)

**Touch Targets:**
- [ ] All buttons minimum 44x44px
- [ ] Proper hitSlop for small icons
- [ ] Accordions easy to tap
- [ ] No accidental taps on adjacent elements

**Typography:**
- [ ] Text readable on all devices
- [ ] Font sizes scale appropriately
- [ ] Line height comfortable (1.4-1.6)
- [ ] No text overflow

**Performance:**
- [ ] Smooth scrolling (60fps)
- [ ] No jank during animations
- [ ] Fast transitions between states
- [ ] Memory usage acceptable

---

## 5.5 Accessibility Improvements

### Screen Reader Support

```typescript
import { AccessibilityInfo } from "react-native";

// For important interactive elements
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Tạo hướng dẫn du lịch bằng AI"
  accessibilityHint="Nhấn để tạo hướng dẫn về ẩm thực, văn hóa và khí hậu"
  accessibilityRole="button"
>
  <Text>Tạo hướng dẫn AI</Text>
</TouchableOpacity>

// For progress indicators
<View
  accessible={true}
  accessibilityLabel={`Đang tạo hướng dẫn: ${Math.round(progress)}%`}
  accessibilityRole="progressbar"
>
  {/* Progress bar UI */}
</View>
```

### Reduce Motion Support

```typescript
import { AccessibilityInfo } from "react-native";
import { useState, useEffect } from "react";

function useReducedMotion() {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const checkReducedMotion = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      setIsReducedMotion(reduceMotion);
    };
    checkReducedMotion();
  }, []);

  return isReducedMotion;
}

// Usage in components
const isReducedMotion = useReducedMotion();
const animationDuration = isReducedMotion ? 0 : 600;

Animated.timing(fadeAnim, {
  toValue: 1,
  duration: animationDuration,
  useNativeDriver: true,
}).start();
```

---

## 5.6 Deep Linking (Optional)

If you want to support deep links like `tripjoy://itinerary/123/notebook`:

**File:** `app.json` (add to existing config)

```json
{
  "expo": {
    "scheme": "tripjoy",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "tripjoy",
              "host": "*"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "ios": {
      "bundleIdentifier": "com.tripjoy.app",
      "associatedDomains": ["applinks:tripjoy.com"]
    }
  }
}
```

**Usage:**
```bash
# Open notebook from external link
tripjoy://itinerary/notebook?id=123

# Or from web
https://tripjoy.com/itinerary/notebook?id=123
```

---

## Testing Phase 5

### Integration Testing

**Navigation Flow:**
- [ ] From itinerary detail → notebook screen
- [ ] Back button returns to itinerary detail
- [ ] State preserved when navigating away
- [ ] Deep link opens correct notebook

**Mobile Specific:**
- [ ] Touch targets all 44px+ on iPhone SE
- [ ] Text readable on small devices
- [ ] No layout issues on tablets
- [ ] Safe area handled correctly
- [ ] Landscape mode works (if supported)

**Performance:**
- [ ] Navigation smooth (<100ms)
- [ ] No memory leaks when navigating
- [ ] AsyncStorage cache persists across navigation
- [ ] React Query cache works correctly

---

## Deliverables Checklist

- [ ] `app/itinerary/notebook.tsx` route created
- [ ] Navigation button added to itinerary detail
- [ ] `utils/responsive.ts` created
- [ ] Touch targets all 44px+ minimum
- [ ] Responsive font sizes implemented
- [ ] Safe area handling correct
- [ ] Tested on 6+ device sizes
- [ ] Accessibility improvements added
- [ ] Performance optimized
- [ ] iOS and Android both work

---

## Next Phase

**Phase 6**: Comprehensive testing and QA
