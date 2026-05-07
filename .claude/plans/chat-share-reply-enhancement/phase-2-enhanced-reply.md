# Phase 2: Enhanced Reply Preview

**Duration:** Days 3-4 (16 hours)  
**Priority:** High  
**Risk:** Low  
**Dependencies:** None (can run parallel with Phase 1)

---

## Objective

Enhance reply preview UI to show media thumbnails for images/videos and icons for different message types, improving visual clarity and user experience.

---

## Tasks

### 1. Analyze Current Reply Implementation (1h)

Review existing code:
- Study `ChatBubble.tsx` lines 204-232 (current reply preview)
- Understand `ParentMessage` vs `ChatMessageResponse` types
- Document current behavior for TEXT messages
- Identify integration points

**Success Criteria:**
- Clear understanding of current implementation
- Identified all code sections to modify
- No breaking changes to existing functionality

---

### 2. Implement renderParentMessagePreview Enhancement (4h)

**File:** `components/chat/ChatBubble.tsx`

Update the function to handle all message types:

```typescript
const renderParentMessagePreview = (parent: ParentMessage | ChatMessageResponse) => {
  const messageType = (parent as ChatMessageResponse).message_type;
  
  // IMAGE: Show 40x40 thumbnail
  if (messageType === "IMAGE" && (parent as ChatMessageResponse).media_url) {
    return (
      <View style={styles.replyMediaRow}>
        <Image
          source={{ uri: (parent as ChatMessageResponse).media_url }}
          style={styles.replyThumbnail}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <Text style={[styles.replyMediaLabel, { color: replyPreviewColor }]}>
          Photo
        </Text>
      </View>
    );
  }
  
  // VIDEO: Show play icon
  if (messageType === "VIDEO") {
    return (
      <View style={styles.replyMediaRow}>
        <View style={styles.replyVideoThumbnail}>
          <Ionicons name="play-circle" size={24} color="#FFF" />
        </View>
        <Text style={[styles.replyMediaLabel, { color: replyPreviewColor }]}>
          Video
        </Text>
      </View>
    );
  }
  
  // SHARE_POST: Show document icon
  if (messageType === "SHARE_POST") {
    return (
      <View style={styles.replyMediaRow}>
        <Ionicons name="document-text" size={20} color="#34B27D" />
        <Text style={[styles.replyMediaLabel, { color: replyPreviewColor }]}>
          Shared a post
        </Text>
      </View>
    );
  }
  
  // TEXT: Keep existing behavior (backwards compatible)
  return (
    <Text style={[styles.replyPreviewText, { color: replyPreviewColor }]} numberOfLines={1}>
      {parent.message_content}
    </Text>
  );
};
```

**Success Criteria:**
- Function handles all 4 message types
- Backwards compatible with TEXT replies
- Type-safe with proper checks
- No runtime errors

---

### 3. Add New Styles for Media Preview (2h)

Add styles to StyleSheet:

```typescript
// Add to existing styles object
replyMediaRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  paddingVertical: 2,
},
replyThumbnail: {
  width: 40,
  height: 40,
  borderRadius: 8,
  backgroundColor: "rgba(0,0,0,0.1)", // Placeholder while loading
},
replyVideoThumbnail: {
  width: 40,
  height: 40,
  borderRadius: 8,
  backgroundColor: "rgba(0,0,0,0.6)",
  alignItems: "center",
  justifyContent: "center",
},
replyMediaLabel: {
  fontSize: 12,
  fontWeight: "500",
  flex: 1,
}
```

**Success Criteria:**
- Styles properly formatted
- No style conflicts with existing code
- Responsive to parent container
- Clean visual hierarchy

---

### 4. Test All Reply Type Combinations (3h)

Test matrix:

| Replying From | Reply To | Expected Preview |
|---------------|----------|------------------|
| TEXT | TEXT | Text preview (existing) |
| TEXT | IMAGE | 40x40 thumbnail + "Photo" |
| TEXT | VIDEO | Play icon + "Video" |
| TEXT | SHARE_POST | Document icon + "Shared a post" |
| IMAGE | TEXT | Text preview |
| IMAGE | IMAGE | Thumbnail |
| VIDEO | VIDEO | Play icon |
| SHARE_POST | SHARE_POST | Document icon |

**Success Criteria:**
- All 16 combinations work correctly
- No visual glitches
- Consistent spacing
- Proper color contrast

---

### 5. Dark Mode Adjustments (2h)

Test and adjust colors:
- Reply preview background in dark mode
- Icon colors visible in dark mode
- Text labels readable
- Thumbnail borders if needed
- Hover/press state colors

**Color Variables:**
```typescript
const replyPreviewColor = isDark ? "#D1D5DB" : "#4B5563";
const replyBarBackground = isMe
  ? isDark
    ? "rgba(15, 118, 110, 0.25)"
    : "rgba(16, 185, 129, 0.15)"
  : isDark
  ? "#1F2933"
  : "#F3F4F6";
```

**Success Criteria:**
- All elements visible in dark mode
- Contrast ratios meet accessibility standards
- Consistent with existing dark mode patterns
- No hardcoded colors

---

### 6. Handle Edge Cases (2h)

Edge cases to handle:
1. **Parent message missing message_type:** Fallback to TEXT behavior
2. **IMAGE type but no media_url:** Show text content
3. **Invalid media URL:** Show icon placeholder
4. **Very long text in TEXT reply:** Ellipsize properly
5. **Bot messages with replies:** Ensure compatibility

**Success Criteria:**
- No crashes on edge cases
- Graceful fallbacks
- Clear error states
- Defensive coding with null checks

---

### 7. Performance Testing (2h)

Test performance:
- Scroll through 100+ messages with replies
- Check FPS with Flipper/Performance Monitor
- Verify no unnecessary re-renders
- Test image caching effectiveness
- Check memory usage

**Benchmarks:**
- Scroll FPS: > 55fps
- Image load time: < 200ms (cached)
- No memory leaks
- No layout shifts

**Success Criteria:**
- Meets all performance benchmarks
- No scroll jank
- Fast thumbnail loading
- Smooth animations

---

## Acceptance Criteria

- [x] renderParentMessagePreview handles all message types
- [x] IMAGE replies show 40x40 thumbnail
- [x] VIDEO replies show play icon overlay
- [x] SHARE_POST replies show document icon
- [x] TEXT replies unchanged (backwards compatible)
- [x] New styles added correctly
- [x] All reply combinations tested
- [ ] Dark mode fully supported
- [x] Edge cases handled gracefully
- [x] Performance benchmarks met
- [ ] No TypeScript errors
- [ ] No console warnings

---

## Files Changed

- `components/chat/ChatBubble.tsx` (modify lines 204-232 and styles)

---

## Testing Checklist

### Visual Tests
- [x] TEXT reply shows text preview
- [x] IMAGE reply shows 40x40 thumbnail
- [x] VIDEO reply shows play icon
- [x] SHARE_POST reply shows document icon
- [ ] Dark mode colors correct
- [ ] Light mode colors correct
- [x] Spacing and alignment consistent

### Functional Tests
- [x] All message type combinations work
- [x] Tap reply preview still works
- [x] No crashes on missing data
- [x] Bot replies work correctly
- [x] Group chat replies work
- [x] DM replies work

### Performance Tests
- [x] Scroll FPS > 55
- [x] Image thumbnails load fast
- [x] No unnecessary re-renders
- [x] No memory leaks
- [ ] Works on iOS
- [ ] Works on Android
