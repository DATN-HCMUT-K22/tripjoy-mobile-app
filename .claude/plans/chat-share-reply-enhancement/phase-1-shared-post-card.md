# Phase 1: SharedPostCard Component

**Duration:** Days 1-2 (14 hours)  
**Priority:** High  
**Risk:** Low  
**Dependencies:** None

---

## Objective

Create a rich preview component for shared posts in chat messages with thumbnail, author information, content preview, and engagement stats.

---

## Tasks

### 1. Create SharedPostCard Component (4h)

**File:** `components/chat/SharedPostCard.tsx`

Create new component with:
- TypeScript interface matching backend `shared_post` object structure
- Visual layout: 60x60 thumbnail, 24x24 author avatar, 2-line content preview
- Like/comment count display
- "Xem chi tiết" button
- Tap handler for navigation

**Component Structure:**
```typescript
interface SharedPostCardProps {
  post: {
    id: string;
    content: string;
    media_urls: string[];
    created_by_user: {
      id: string;
      username: string;
      fullName: string;
      avatarUrl?: string;
    };
    like_count: number;
    comment_count: number;
  };
  onPress: () => void;
  isDark?: boolean;
}

export const SharedPostCard: React.FC<SharedPostCardProps> = ({ post, onPress, isDark }) => {
  // Implementation
};
```

**Success Criteria:**
- Component renders without errors
- All props typed correctly
- No TypeScript errors

---

### 2. Implement Visual Design (3h)

Add styling:
- Card container: 240px width, rounded corners, border
- Thumbnail: 60x60px, rounded corners, first media or fallback icon
- Author row: Avatar 24x24 + name
- Content preview: 2 lines max with ellipsis
- Stats row: Heart icon + count, Comment icon + count
- Footer: "Xem chi tiết" with chevron

**Colors:**
- Light mode: `#F3F4F6` background, `#E5E7EB` border
- Dark mode: `#1F2937` background, `#374151` border
- Text colors responsive to theme

**Success Criteria:**
- Matches brainstorm design spec
- Clean visual hierarchy
- Responsive to dark mode

---

### 3. Handle Edge Cases (2h)

Implement fallback logic for:
1. **No media_urls:** Show document icon instead of thumbnail
2. **No shared_post object:** Show "Post không khả dụng" card
3. **Missing author data:** Use default avatar with username fallback
4. **Deleted post:** Graceful degradation with minimal data
5. **Multiple images:** Show first image with "+X more" badge

**Success Criteria:**
- No crashes on missing data
- Clear fallback UI for each edge case
- Console warnings for debugging (dev mode only)

---

### 4. Integrate in ChatBubble (2h)

**File:** `components/chat/ChatBubble.tsx`

Replace existing SHARE_POST rendering (lines 325-362) with:
```typescript
{message.message_type === "SHARE_POST" && (
  message.shared_post ? (
    <SharedPostCard
      post={message.shared_post}
      onPress={() => router.push(`/post/${message.shared_post_id}` as any)}
      isDark={isDark}
    />
  ) : (
    <View style={styles.fallbackCard}>
      <Ionicons name="alert-circle-outline" size={24} color="#9CA3AF" />
      <Text style={styles.fallbackText}>Post không khả dụng</Text>
    </View>
  )
)}
```

Add export in `components/chat/index.ts`:
```typescript
export { SharedPostCard } from "./SharedPostCard";
```

**Success Criteria:**
- SharedPostCard renders in chat
- Navigation to post detail works
- Existing chat functionality unaffected

---

### 5. Dark Mode Support (2h)

Test and adjust:
- Use `useColorScheme()` hook
- Test all components in dark mode
- Verify text readability
- Check border/background colors
- Test hover/press states

**Success Criteria:**
- All colors visible in dark mode
- Consistent with existing dark mode patterns
- No hardcoded colors

---

### 6. Performance Optimization (1h)

Apply optimizations:
- Wrap component in `React.memo`
- Use Expo Image with `cachePolicy="memory-disk"`
- Fixed height to prevent layout shift
- Avoid inline style objects
- Test with FlashList recycling

**Success Criteria:**
- Component memoized correctly
- No re-renders on scroll
- Fast image loading from cache

---

### 7. Testing with Real API (4h)

Test scenarios:
- Share post with single image
- Share post with multiple images
- Share text-only post
- Share post from different users
- Share deleted post (if possible)
- Test in group chat and DM
- Test with optimistic updates
- Test with socket.io real-time updates

**Success Criteria:**
- All scenarios work correctly
- No console errors
- Smooth UX
- Data displays accurately

---

## Acceptance Criteria

- [x] SharedPostCard component created and exported
- [x] Visual design matches specification
- [x] All edge cases handled gracefully
- [x] Integrated in ChatBubble successfully
- [x] Dark mode fully supported
- [x] Performance optimized (React.memo, caching)
- [x] Tested with real API data
- [x] No TypeScript errors
- [x] No console warnings (production)
- [x] Navigation to post detail works

---

## Files Changed

- `components/chat/SharedPostCard.tsx` (new)
- `components/chat/ChatBubble.tsx` (modify lines 325-362)
- `components/chat/index.ts` (add export)

---

## Testing Checklist

- [x] Renders with image thumbnail
- [x] Renders with text-only post
- [x] Shows fallback for missing post
- [x] Author info displays correctly
- [x] Like/comment counts accurate
- [x] Tap navigates to post detail
- [x] Dark mode colors correct
- [x] No scroll jank
- [x] Images cached properly
- [x] Works on iOS
- [x] Works on Android
