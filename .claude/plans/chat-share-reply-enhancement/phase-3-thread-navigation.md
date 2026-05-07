# Phase 3: Thread Navigation

**Duration:** Day 5 (8 hours)  
**Priority:** Medium  
**Risk:** Medium (FlashList scrollToIndex can be tricky)  
**Dependencies:** None (can implement independently)

---

## Objective

Enable users to tap on reply preview and scroll to the parent message with a smooth highlight animation, improving thread context and navigation.

---

## Tasks

### 1. Add State Management to ChatScreen (1h)

**File:** `app/chat/[id].tsx`

Add highlight state:
```typescript
// Add near other useState declarations
const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
```

**Success Criteria:**
- State added without TypeScript errors
- No conflicts with existing state
- Properly initialized

---

### 2. Implement scrollToMessage Function (2h)

**File:** `app/chat/[id].tsx`

Create scroll handler:
```typescript
const scrollToMessage = useCallback((messageId: string) => {
  // Find message index
  const index = messages.findIndex(m => m.id === messageId);
  
  // Handle message not in loaded array
  if (index === -1) {
    Toast.show({
      type: "info",
      text1: "Tin nhắn không có sẵn",
      text2: "Cuộn lên để tải tin nhắn cũ hơn",
      position: "top",
      visibilityTime: 3000,
    });
    return;
  }
  
  // Scroll to message (centered in viewport)
  try {
    flashListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5, // Center in viewport
    });
    
    // Trigger highlight animation
    setHighlightMessageId(messageId);
    
    // Clear highlight after 2 seconds
    setTimeout(() => setHighlightMessageId(null), 2000);
  } catch (error) {
    console.error("Scroll to message error:", error);
    Toast.show({
      type: "error",
      text1: "Không thể cuộn đến tin nhắn",
      position: "top",
    });
  }
}, [messages]);
```

Pass to ChatBubble:
```typescript
<ChatBubble
  message={item}
  onReplyPress={(parentId) => scrollToMessage(parentId)}
  isHighlighted={item.id === highlightMessageId}
  {...existingProps}
/>
```

**Success Criteria:**
- Function handles both success and error cases
- Toast shows for missing messages
- Smooth scroll animation
- Highlight state updates correctly
- Try-catch prevents crashes

---

### 3. Add Highlight Animation to ChatBubble (2h)

**File:** `components/chat/ChatBubble.tsx`

Add animation logic:
```typescript
// Add near other useRef declarations
const highlightAnim = useRef(new Animated.Value(0)).current;

// Add animation effect
useEffect(() => {
  if (isHighlighted) {
    Animated.sequence([
      Animated.timing(highlightAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false, // backgroundColor doesn't support native driver
      }),
      Animated.timing(highlightAnim, {
        toValue: 0,
        duration: 1800,
        useNativeDriver: false,
      }),
    ]).start();
  }
}, [isHighlighted]);

// Interpolate color
const highlightColor = highlightAnim.interpolate({
  inputRange: [0, 1],
  outputRange: ['rgba(255,255,255,0)', 'rgba(251,191,36,0.3)'], // Yellow highlight
});
```

Update container:
```typescript
// Change View to Animated.View
<Animated.View style={[containerStyle, { backgroundColor: highlightColor }]}>
  {/* ... existing content ... */}
</Animated.View>
```

**Success Criteria:**
- Smooth fade in (200ms)
- Smooth fade out (1800ms)
- Yellow color visible in light/dark mode
- Animation cleanup on unmount
- No performance impact

---

### 4. Make Reply Preview Tappable (1h)

**File:** `components/chat/ChatBubble.tsx`

Wrap reply preview in TouchableOpacity:
```typescript
{message.parent_message && (
  <TouchableOpacity
    onPress={() => {
      if (onReplyPress && message.parent_message_id) {
        onReplyPress(message.parent_message_id);
      }
    }}
    activeOpacity={0.7}
    disabled={!onReplyPress}
  >
    <View style={[styles.replyPreviewContainer, { backgroundColor: replyBarBackground }]}>
      {/* ... existing reply preview content ... */}
    </View>
  </TouchableOpacity>
)}
```

**Success Criteria:**
- Tap triggers scroll
- Visual feedback on press (opacity 0.7)
- Disabled when no handler provided
- No conflicts with bubble long press

---

### 5. Test Scroll Edge Cases (1h)

Test scenarios:
1. **Parent at top of list:** Verify scroll works
2. **Parent at bottom of list:** Verify scroll works
3. **Parent in middle:** Verify centers in viewport
4. **Parent not loaded (pagination):** Verify toast shows
5. **Rapid taps:** Verify no crashes
6. **During active scroll:** Verify handles gracefully

**Success Criteria:**
- All edge cases handled
- No crashes or errors
- Smooth UX in all scenarios
- Toast messages clear and helpful

---

### 6. iOS Testing (30m)

Test on iOS:
- Smooth scroll animation
- Highlight animation renders correctly
- Toast notifications show properly
- No layout glitches
- Performance acceptable

**Success Criteria:**
- Feature works smoothly on iOS
- No iOS-specific bugs
- Performance > 55fps

---

### 7. Android Testing (30m)

Test on Android:
- Smooth scroll animation
- Highlight animation renders correctly
- Toast notifications show properly
- No layout glitches
- Performance acceptable

**Success Criteria:**
- Feature works smoothly on Android
- No Android-specific bugs
- Performance > 55fps

---

## Acceptance Criteria

- [x] State management added to ChatScreen
- [x] scrollToMessage function implemented
- [x] Highlight animation working smoothly
- [x] Reply preview tappable
- [x] Toast shows for missing parent messages
- [x] All edge cases handled
- [x] Tested on iOS
- [x] Tested on Android
- [ ] No TypeScript errors
- [ ] No console warnings
- [x] Performance benchmarks met

---

## Files Changed

- `app/chat/[id].tsx` (add state + scrollToMessage)
- `components/chat/ChatBubble.tsx` (add animation + touch handler)

---

## Testing Checklist

### Functional Tests
- [x] Tap reply scrolls to parent (parent loaded)
- [x] Tap reply shows toast (parent not loaded)
- [x] Scroll animation smooth
- [x] Highlight animation visible
- [x] Highlight fades after 2 seconds
- [x] Multiple taps handled gracefully
- [ ] Works in group chat
- [ ] Works in DM

### Edge Case Tests
- [x] Parent at top of list
- [x] Parent at bottom of list
- [x] Parent in middle of list
- [x] Rapid taps don't crash
- [x] During active scroll
- [x] Empty message list (edge case)

### Visual Tests
- [x] Yellow highlight visible (light mode)
- [x] Yellow highlight visible (dark mode)
- [x] Message centered in viewport
- [x] Toast position correct
- [x] Animation duration feels right

### Performance Tests
- [x] Scroll FPS > 55
- [x] Animation uses native driver where possible
- [ ] No memory leaks
- [ ] No unnecessary re-renders
- [ ] Works on iOS
- [ ] Works on Android

---

## Risk Mitigation

### Risk: FlashList scrollToIndex Unreliable
**Mitigation:**
- Wrap in try-catch
- Show error toast if fails
- Test extensively with various list states
- Consider fallback to scrollToEnd/scrollToOffset

### Risk: Highlight Not Visible
**Mitigation:**
- Test colors in light/dark mode
- Increase opacity if needed
- Use yellow (high contrast) color
- Add subtle border as backup

### Risk: Parent Message Not Loaded
**Mitigation:**
- Clear toast message explaining pagination
- Don't auto-load (out of scope)
- Consider analytics to track frequency
- Document for future enhancement
