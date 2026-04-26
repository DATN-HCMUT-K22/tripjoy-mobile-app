# Phase 5: Testing & Polish

**Status:** Completed  
**Estimated Time:** 2-3 hours  
**Dependencies:** Phases 1-4 (full implementation complete)

---

## Objectives

Comprehensive testing, bug fixes, performance validation, and final polish to ensure production-ready quality.

---

## Testing Checklist

### 5.1 Navigation Testing

**Scenario 1: Own Profile Navigation**
- [ ] Login as User A
- [ ] Find post by User A in feed
- [ ] Click avatar → Navigates to /profile (not /user/{id})
- [ ] Click username → Navigates to /profile
- [ ] Back button returns to feed
- [ ] Feed maintains scroll position

**Scenario 2: Other User Navigation**
- [ ] Login as User A
- [ ] Find post by User B
- [ ] Click avatar → Navigates to /user/B
- [ ] Profile loads correctly
- [ ] Back button returns to feed
- [ ] Click another user's avatar → Navigate to their profile

**Scenario 3: Guest Mode**
- [ ] Logout (guest mode)
- [ ] Click any avatar → Navigates to /user/{id}
- [ ] Profile loads (public data)
- [ ] Message button prompts login
- [ ] No crashes or errors

**Scenario 4: Navigation from Different Screens**
- [ ] Navigate from home feed
- [ ] Navigate from explore page
- [ ] Navigate from group posts
- [ ] Navigate from search results
- [ ] All work correctly

---

### 5.2 Profile Display Testing

**Header Section:**
- [ ] Avatar loads correctly (120x120)
- [ ] Avatar fallback shows initials if load fails
- [ ] Full name displays
- [ ] Username displays with @ prefix
- [ ] Location displays (if available)
- [ ] Location hidden if null
- [ ] Bio displays (if available)
- [ ] Bio hidden if null
- [ ] Member since date formatted correctly (Vietnamese)

**Stats Section:**
- [ ] Posts count displays correct number
- [ ] Posts count updates when posts load
- [ ] formatNumber works (1000 → 1K, 1000000 → 1M)

**Actions Section:**
- [ ] Follow button shows "Sắp có" badge
- [ ] Follow button is disabled (opacity 60%)
- [ ] Follow button shows toast on click
- [ ] Message button is enabled (green)
- [ ] Message button shows loading spinner while creating conversation
- [ ] Message button navigates to chat on success
- [ ] Message button shows error toast on failure

---

### 5.3 Posts Grid Testing

**Grid Layout:**
- [ ] Grid shows 3 columns
- [ ] All items are square (aspect ratio 1:1)
- [ ] Gap between items is 2px
- [ ] Grid fills screen width
- [ ] Responsive on different screen sizes (iPhone SE, iPhone 15, iPad)

**Post Items:**
- [ ] Thumbnail loads from first media_url
- [ ] Fallback image if no media_url
- [ ] Multi-photo indicator shows if >1 images
- [ ] Stats overlay shows likes count
- [ ] Stats overlay shows comments count
- [ ] Stats numbers formatted (1K, 1M, etc.)
- [ ] Click on item logs to console (future: navigate to post detail)

**Empty State:**
- [ ] Shows when user has 0 posts
- [ ] Icon displays
- [ ] "Chưa có bài viết" message shows
- [ ] Centered layout

**Loading State:**
- [ ] Skeleton grid shows while loading (3×3)
- [ ] Skeleton items have gray background
- [ ] Smooth transition from skeleton to actual posts

**Infinite Scroll:**
- [ ] Loads more posts when scrolling near end
- [ ] Loading spinner shows while fetching next page
- [ ] New posts append to grid
- [ ] Stops loading when no more posts
- [ ] No duplicate posts

---

### 5.4 Error Handling Testing

**404 User Not Found:**
- [ ] Navigate to /user/invalid-id
- [ ] Error screen displays
- [ ] "Không tìm thấy" title shows
- [ ] Error message shows
- [ ] Back button works
- [ ] No crash

**403 Forbidden:**
- [ ] Mock 403 response from API
- [ ] Error screen displays
- [ ] "Không có quyền truy cập" title shows
- [ ] Error message shows
- [ ] Back button works

**Network Error:**
- [ ] Turn off network
- [ ] Navigate to user profile
- [ ] Error screen displays after retry attempts
- [ ] "Thử lại" button shows
- [ ] Click "Thử lại" → Refetches data
- [ ] Success after network restored

**Partial Load Failure:**
- [ ] Profile loads but posts fail
- [ ] Profile section displays
- [ ] Posts section shows error/empty state
- [ ] User can still use message button

---

### 5.5 Performance Testing

**Scroll Performance:**
- [ ] Create test user with 100+ posts
- [ ] Navigate to their profile
- [ ] Scroll through entire grid
- [ ] No jank or lag
- [ ] FPS stays at 60
- [ ] Memory usage stable

**Image Loading:**
- [ ] Images load progressively (blurhash → image)
- [ ] No flash of broken images
- [ ] Cached images load instantly on back navigation
- [ ] Memory doesn't spike with many images

**Cache Performance:**
- [ ] Navigate to User B profile
- [ ] Wait 5 seconds
- [ ] Navigate back
- [ ] Navigate to User B again (within 10s)
- [ ] Profile loads from cache (instant)
- [ ] Posts load from cache (instant)

**Network Efficiency:**
- [ ] Use network inspector (React Native Debugger)
- [ ] Profile API called once per user
- [ ] Posts API called once per page
- [ ] No redundant requests
- [ ] Images cached (no duplicate downloads)

---

### 5.6 Edge Cases Testing

**Self-Redirect:**
- [ ] Navigate to /user/{own-id}
- [ ] Immediately redirects to /profile
- [ ] No flash of user profile screen

**Rapid Navigation:**
- [ ] Click avatar → User B profile
- [ ] Immediately click back
- [ ] Click avatar → User C profile
- [ ] No crashes, no stale data

**Pull-to-Refresh:**
- [ ] View user profile
- [ ] Pull down to refresh
- [ ] Loading indicator shows
- [ ] Profile and posts refetch
- [ ] Updated data displays

**Orientation Change:**
- [ ] View user profile in portrait
- [ ] Rotate to landscape
- [ ] Grid recalculates (still 3 columns)
- [ ] No layout breaks

**Memory Constraints:**
- [ ] Navigate to 10 different user profiles
- [ ] Check memory usage
- [ ] Memory doesn't grow unbounded
- [ ] Old profiles cleaned from cache

---

### 5.7 Integration Testing

**Message Button Flow:**
- [ ] Click message button
- [ ] Loading state shows
- [ ] Conversation created via API
- [ ] Navigates to /chat/{conversation-id}
- [ ] Chat screen loads
- [ ] Can send messages
- [ ] Back to profile works

**PostCard Integration:**
- [ ] Avatar in PostCard is clickable
- [ ] Username in PostCard is clickable
- [ ] Visual feedback on press (opacity)
- [ ] Navigation works from all posts
- [ ] Different users navigate to different profiles

**Auth Integration:**
- [ ] Guest users see profiles
- [ ] Guest users cannot message (prompts login)
- [ ] Logged-in users can message
- [ ] Own profile redirect works

---

## 5.8 Code Quality Checks

### Code Review
- [ ] No console.log statements (except intentional debug logs)
- [ ] No commented-out code
- [ ] All imports used
- [ ] No unused variables
- [ ] No TypeScript errors
- [ ] No TypeScript warnings
- [ ] Follows existing code style

### Type Safety
- [ ] All props have types
- [ ] All function parameters typed
- [ ] No `any` types (except router push with dynamic routes)
- [ ] Optional fields handled correctly (`?.` operator)

### Error Handling
- [ ] All async functions wrapped in try-catch
- [ ] All errors logged to console
- [ ] User-friendly error messages
- [ ] No unhandled promise rejections

### Performance
- [ ] React.memo used where appropriate
- [ ] useMemo for expensive calculations
- [ ] FlatList optimizations in place
- [ ] Images use cachePolicy
- [ ] No unnecessary re-renders

---

## 5.9 Accessibility

**Screen Reader:**
- [ ] Avatar has accessibilityLabel
- [ ] Buttons have accessibilityLabel
- [ ] Error messages are announced
- [ ] Loading states are announced

**Touch Targets:**
- [ ] Avatar touch target ≥ 44x44
- [ ] Username touch target ≥ 44x44 (or height)
- [ ] Buttons touch target ≥ 44x44
- [ ] Grid items touch target adequate

---

## 5.10 Cross-Platform Testing

**iOS:**
- [ ] Test on iPhone SE (small screen)
- [ ] Test on iPhone 15 Pro (large screen)
- [ ] Test on iPad (tablet)
- [ ] Navigation animations smooth
- [ ] No platform-specific bugs

**Android:**
- [ ] Test on small Android device
- [ ] Test on large Android device
- [ ] Navigation animations smooth
- [ ] Back button (hardware) works
- [ ] No platform-specific bugs

---

## Polish Tasks

### 5.11 Visual Polish

**Transitions:**
- [ ] Avatar image fade-in (200ms)
- [ ] Loading spinner smooth
- [ ] Error screen fade-in
- [ ] Skeleton → content transition smooth

**Spacing:**
- [ ] Consistent padding (20px horizontal)
- [ ] Consistent gaps (2px in grid)
- [ ] Proper margins between sections
- [ ] No cramped layouts

**Colors:**
- [ ] Consistent color palette
- [ ] Error red: #EF4444
- [ ] Success green: #2BB673
- [ ] Text gray: #6B7280, #374151, #111827
- [ ] Background: #FFFFFF, #F3F4F6

**Typography:**
- [ ] Consistent font sizes
- [ ] Consistent font weights (400, 600, 700)
- [ ] Readable line heights
- [ ] No text overflow

---

### 5.12 UX Polish

**Loading States:**
- [ ] Immediate loading feedback (<100ms)
- [ ] Skeleton matches final content layout
- [ ] No layout shift after loading

**Error States:**
- [ ] Clear error messages (no technical jargon)
- [ ] Actionable (retry, back buttons)
- [ ] Helpful icons
- [ ] Not scary (friendly tone)

**Empty States:**
- [ ] Encouraging messages
- [ ] Helpful icons
- [ ] Not dead-ends (suggest actions)

**Haptics (iOS):**
- [ ] Light haptic on pull-to-refresh
- [ ] Medium haptic on error
- [ ] Light haptic on button press (optional)

---

## Bug Fixes

### Common Bugs to Check

**Navigation Bugs:**
- [ ] Back button stack is correct
- [ ] No infinite redirect loops
- [ ] Deep linking works

**Data Bugs:**
- [ ] Stale data after refetch
- [ ] Cache not invalidating
- [ ] Duplicate posts in grid

**UI Bugs:**
- [ ] Layout shift during load
- [ ] Images not loading
- [ ] Text overflow
- [ ] Grid items wrong size
- [ ] Stats showing NaN or undefined

**State Bugs:**
- [ ] Loading state stuck
- [ ] Error state not clearing
- [ ] Infinite scroll not stopping

---

## Performance Optimization

### 5.13 Optimization Checklist

**FlatList:**
- [ ] `removeClippedSubviews={true}`
- [ ] `maxToRenderPerBatch={15}`
- [ ] `windowSize={5}`
- [ ] `initialNumToRender={12}`
- [ ] `keyExtractor` stable

**Images:**
- [ ] `cachePolicy="memory-disk"`
- [ ] `blurhash` placeholders
- [ ] `transition={200}` smooth
- [ ] Appropriate image sizes (not loading 4K for thumbnails)

**React Optimization:**
- [ ] PostGridItem uses React.memo
- [ ] useMemo for posts flattening
- [ ] useCallback for stable functions
- [ ] No inline functions in render

---

## Final Verification

### 5.14 Pre-Launch Checklist

**Functionality:**
- [ ] All features work as designed
- [ ] No critical bugs
- [ ] No crashes
- [ ] Error handling comprehensive

**Performance:**
- [ ] Smooth 60 FPS scrolling
- [ ] Fast load times (<2s)
- [ ] Efficient caching
- [ ] No memory leaks

**Quality:**
- [ ] Code reviewed
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Follows style guide

**User Experience:**
- [ ] Intuitive navigation
- [ ] Clear feedback
- [ ] Helpful error messages
- [ ] Professional polish

---

## Documentation

### 5.15 Code Documentation

**Add Comments for:**
- [ ] Complex logic (cache strategy, pagination)
- [ ] Non-obvious patterns (self-redirect, error retry)
- [ ] Performance optimizations (why removeClippedSubviews)
- [ ] Future enhancements (TODOs)

**Example:**
```typescript
/**
 * Redirect to own profile if user is viewing their own ID
 * This prevents duplicate screens and provides better UX
 * (own profile has edit capabilities, user profile is read-only)
 */
React.useEffect(() => {
  if (id && id === currentUserId) {
    router.replace('/profile');
  }
}, [id, currentUserId, router]);
```

---

## Release Notes

### 5.16 What to Document

**New Features:**
- View other users' public profiles
- Click avatar/username in posts to view profile
- User posts grid (3 columns)
- Message button (create conversation)
- Pull-to-refresh

**Technical Details:**
- New screen: /user/[id]
- New components: ProfileHeader, ProfileStats, ProfileActions, PostsGrid
- New hooks: useUserProfile, useUserPosts
- Caching: 10s profile, 30s posts

**Known Limitations:**
- Follow button disabled (placeholder)
- Post detail view not implemented
- No share profile feature
- No report/block user

---

## Success Criteria

Feature is **COMPLETE** and ready for production when:

✅ **All tests pass** (5.1 - 5.7)  
✅ **Code quality verified** (5.8)  
✅ **Performance acceptable** (5.13)  
✅ **No critical bugs**  
✅ **User experience polished** (5.11 - 5.12)  
✅ **Documentation complete** (5.15)  

---

## Rollback Plan

If critical bugs found after deployment:

1. **Quick Fix Available (<1 hour):**
   - Deploy hotfix
   - Test in staging
   - Deploy to production

2. **Complex Bug (>1 hour):**
   - Feature flag: Hide avatar/username click handlers
   - Deploy with feature flag OFF
   - Fix bug in development
   - Test thoroughly
   - Deploy fix
   - Enable feature flag

---

**Phase Complete!** 🎉

The User Profile feature is now production-ready.

---

## Next Steps (Post-MVP)

See `plan.md` section "Future Enhancements" for:
- Follow/Unfollow functionality
- Extended stats (Trips, Followers, Following)
- Profile tabs
- Social features (share, report, block)
- Advanced performance optimizations
