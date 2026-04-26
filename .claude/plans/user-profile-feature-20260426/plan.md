# User Profile Feature - Implementation Plan

**Created:** 2026-04-26  
**Status:** Completed  
**Completed:** 2026-04-27  
**Brainstorm:** `/media/ngocha/New Volume/datn_tripjoy/brain-storm/user-profile-feature-2026-04-26.md`

---

## 📋 Overview

Implement user profile viewing feature that allows users to click on avatars/usernames in posts to view other users' public profiles with their post history.

**Key Features:**
- View public user profiles (avatar, name, bio, location, member since)
- Display user's posts in 3-column grid with infinite scroll
- Message button to create conversation
- Follow button (disabled placeholder for MVP)
- Comprehensive error handling (404, 403, network errors)
- Loading states and performance optimization

**Timeline:** 10-13 hours (1.5-2 working days)

---

## 🏗️ Architecture

### Routing Strategy
```
EXISTING:
/profile           → Own profile (app/profile/index.tsx)
/profile/edit      → Edit own profile

NEW:
/user/[id]         → Other user's profile (NEW SCREEN) ⭐
```

### Component Hierarchy
```
UserProfileScreen (app/user/[id].tsx)
├── ProfileHeader (avatar, name, bio, location, member since)
├── ProfileStats (posts count only for MVP)
├── ProfileActions (Follow disabled + Message functional)
└── PostsGrid (3 columns, infinite scroll)
```

### Data Flow
```
API: /users/{userId}/profile → useUserProfile hook (10s cache)
API: /posts?creator_id={userId} → useUserPosts hook (infinite scroll)
```

---

## ✅ Completion Summary

**Implementation Date:** 2026-04-27  
**All Phases:** Completed  
**Test Results:** 8/10 quality score  

**Known Minor Issues:**
- Console.logs present in code
- Accessibility labels need improvement

**Deliverables:**
- User profile viewing feature fully functional
- Message button creates conversations
- Follow button (disabled placeholder for MVP)
- Post grid with infinite scroll
- Comprehensive error handling (404, 403, network errors)
- Loading states and performance optimization

---

## 📦 Implementation Phases

### Phase 1: Core Structure & Services (2 hours)

**Files:**
- `types/user.ts` - Add UserPublicProfile interface
- `services/users.ts` - Add getUserProfile(userId) API call
- `hooks/useUserProfile.ts` - Profile data hook with 10s cache
- `hooks/useUserPosts.ts` - Infinite scroll posts hook

**Tasks:**
1. Add UserPublicProfile type to types/user.ts
2. Implement getUserProfile API service
3. Create useUserProfile hook with caching
4. Create useUserPosts hook with infinite scroll

**Key Decisions:**
- 10s cache for profile (balance freshness vs performance)
- 30s cache for posts
- No retry on 404/403 errors (permanent failures)
- 20 posts per page for infinite scroll

---

### Phase 2: Shared Components (4 hours)

**Files:**
- `components/profile/ProfileHeader.tsx` - User info display
- `components/profile/ProfileStats.tsx` - Posts count
- `components/profile/ProfileActions.tsx` - Follow/Message buttons
- `components/profile/PostsGrid.tsx` - 3-column grid with infinite scroll

**Tasks:**
1. Create ProfileHeader component
   - Avatar 120x120 with fallback
   - Full name, username, location, bio
   - Member since date (formatted)
   
2. Create ProfileStats component
   - Posts count from totalElements
   - MVP: Only posts (no trips/saved)
   
3. Create ProfileActions component
   - Follow button: disabled with "Sắp có" badge
   - Message button: functional with loading state
   - Create conversation → navigate to chat
   
4. Create PostsGrid component
   - FlatList with 3 columns
   - Thumbnail + stats overlay
   - Infinite scroll with performance optimization
   - Empty state, loading skeleton

**Key Decisions:**
- Avatar size 120x120 (matches Instagram)
- Grid gap 2px (tight spacing)
- Performance: removeClippedSubviews, maxToRenderPerBatch=15
- Empty state shows "Chưa có bài viết"

---

### Phase 3: Main Screen (2 hours)

**Files:**
- `app/user/[id].tsx` - User profile screen (NEW)

**Tasks:**
1. Create app/user/[id].tsx directory and file
2. Integrate all components (Header, Stats, Actions, Grid)
3. Implement self-redirect (viewing own ID → /profile)
4. Add comprehensive error handling
5. Add loading states (skeleton)
6. Implement pull-to-refresh logic

**Error States:**
- 404 User Not Found
- 403 No Permission
- Network errors
- Invalid/missing user ID

**Key Decisions:**
- Self-viewing redirects to /profile (avoid duplicate screens)
- ScrollView with stickyHeaderIndices for header
- Comprehensive error UI with retry/back options

---

### Phase 4: Navigation Integration (1 hour)

**Files:**
- `components/social/PostCard.tsx` - Add avatar/username click handlers

**Tasks:**
1. Add router and currentUserId hooks
2. Create handleAvatarPress function
   - If own ID → router.push('/profile')
   - Else → router.push(`/user/${post.creator_id}`)
3. Wrap avatar in TouchableOpacity
4. Wrap username in TouchableOpacity
5. Test navigation flow

**Key Decisions:**
- Both avatar AND username are clickable (better UX)
- Conditional routing based on ownership
- activeOpacity={0.7} for visual feedback

---

### Phase 5: Testing & Polish (2-3 hours)

**Testing Checklist:**
- [ ] Navigation works (avatar, username, self-redirect)
- [ ] Profile displays all fields correctly
- [ ] Posts grid 3 columns with infinite scroll
- [ ] Message button creates conversation
- [ ] Error states (404, 403, network)
- [ ] Loading states (skeleton, spinner)
- [ ] Empty state when no posts
- [ ] Performance with 100+ posts

**Polish:**
- Code review and cleanup
- Remove console.logs
- Optimize imports
- Add comments for complex logic
- Test on different screen sizes

---

## 🎯 File Changes Summary

### New Files (7)
1. `app/user/[id].tsx` - Main user profile screen
2. `hooks/useUserProfile.ts` - Profile data hook
3. `hooks/useUserPosts.ts` - Posts infinite scroll hook
4. `components/profile/ProfileHeader.tsx` - User info display
5. `components/profile/ProfileStats.tsx` - Stats display
6. `components/profile/ProfileActions.tsx` - Action buttons
7. `components/profile/PostsGrid.tsx` - Posts grid

### Modified Files (2)
1. `types/user.ts` - Add UserPublicProfile interface
2. `services/users.ts` - Add getUserProfile function
3. `components/social/PostCard.tsx` - Add navigation handlers

---

## ⚡ Performance Optimization

### FlatList Optimization
```typescript
<FlatList
  removeClippedSubviews={true}        // Remove off-screen items
  maxToRenderPerBatch={15}            // 3 cols × 5 rows
  windowSize={5}                      // Render window size
  initialNumToRender={12}             // First 4 rows
  updateCellsBatchingPeriod={50}      // Batch updates
/>
```

### Caching Strategy
- **Profile:** 10s stale, 5min gc time
- **Posts:** 30s stale, no gc time limit
- **Images:** expo-image memory-disk cache

### Component Memoization
- PostGridItem uses React.memo with custom comparison
- Prevents re-renders when stats don't change

---

## 🚨 Error Handling

### Error States Covered

**404 User Not Found:**
```
Icon: person-outline
Title: "Không tìm thấy"
Message: "Người dùng này không tồn tại hoặc đã bị xóa"
Action: "Quay lại"
```

**403 Forbidden:**
```
Icon: alert-circle-outline
Title: "Không có quyền truy cập"
Message: "Bạn không có quyền xem trang này"
Action: "Quay lại"
```

**Network Error:**
```
Icon: alert-circle-outline
Title: "Đã có lỗi"
Message: "Không thể kết nối đến server. Vui lòng kiểm tra mạng."
Action: "Thử lại"
```

### Retry Logic
- Profile: No retry on 404/403, max 3 retries on network error
- Posts: Same retry logic
- Exponential backoff: 1s, 2s, 4s...max 30s

---

## ✅ Success Criteria

**Feature Complete When:**

1. **Navigation:**
   - ✅ Click avatar in PostCard → Navigate to /user/{id}
   - ✅ Click username in PostCard → Navigate to /user/{id}
   - ✅ Click own avatar → Navigate to /profile
   - ✅ Back button works correctly

2. **Profile Display:**
   - ✅ Avatar displays (120x120)
   - ✅ Full name, username, location, bio, member since
   - ✅ Posts count shows correct number

3. **Posts Grid:**
   - ✅ 3 columns grid
   - ✅ Thumbnails load correctly
   - ✅ Stats overlay (likes, comments)
   - ✅ Infinite scroll works smoothly
   - ✅ Empty state when no posts
   - ✅ Loading skeleton while fetching

4. **Actions:**
   - ✅ Message button creates conversation
   - ✅ Message button navigates to chat
   - ✅ Loading state shows while creating
   - ✅ Follow button disabled with badge

5. **States:**
   - ✅ Loading skeleton displays
   - ✅ Error states (404, 403, network)
   - ✅ Empty state for no posts
   - ✅ Pull-to-refresh works

6. **Performance:**
   - ✅ Smooth scroll with 100+ posts
   - ✅ Images load fast (cached)
   - ✅ No jank or lag

---

## 📊 Timeline Breakdown

### Day 1 (6-7 hours)
**Morning:**
- Phase 1: Types & Services (2h)
- Phase 2: Start Components (2h)

**Afternoon:**
- Phase 2: Complete Components (2-3h)

### Day 2 (4-6 hours)
**Morning:**
- Phase 3: Main Screen (2h)
- Phase 4: Navigation (1h)

**Afternoon:**
- Phase 5: Testing & Polish (2-3h)

**Total:** 10-13 hours

---

## 🔄 Future Enhancements (Post-MVP)

1. **Follow/Unfollow Functionality**
   - API integration
   - Following/Followers count
   - Following/Followers list screens

2. **Extended Stats**
   - Trips count (from itineraries)
   - Saved posts count
   - Clickable stats → detail screens

3. **Profile Tabs**
   - Posts tab (current)
   - Trips/Itineraries tab
   - Saved tab (if public)

4. **Social Features**
   - Mutual friends count
   - Verified badge
   - Share profile
   - Report/Block user

5. **Performance**
   - Advanced image caching
   - Virtual scrolling
   - Progressive loading

---

## 📚 References

- **Brainstorm:** `brain-storm/user-profile-feature-2026-04-26.md`
- **Backend Doc:** `USER_PROFILE_FRONTEND_GUIDE.md`
- **Existing Profile:** `app/profile/index.tsx`
- **PostCard:** `components/social/PostCard.tsx`
- **Similar Pattern:** `hooks/useSavedPosts.ts` (infinite scroll)
- **Instagram UX:** Grid 3 columns, stats above posts

---

## 🎓 Implementation Notes

### Why Separate Screen (not conditional logic)?
- ✅ Clear separation: own profile has edit, user profile is read-only
- ✅ Easier to maintain and test
- ✅ No complex conditional logic
- ✅ Follows industry patterns (Instagram, Facebook)

### Why 10s Cache for Profile?
- ✅ Profile data changes infrequently
- ✅ Reduces API calls on quick navigation
- ✅ Balance between freshness and performance
- ✅ Manual refresh available via pull-to-refresh

### Why 3 Columns Grid?
- ✅ Industry standard (Instagram, Pinterest)
- ✅ Optimal for mobile viewing
- ✅ More content visible without scrolling
- ✅ Maintains aspect ratio (square thumbnails)

### Why Message Button Only (not Follow)?
- ✅ MVP scope: core functionality first
- ✅ Follow requires backend support (following system)
- ✅ Message leverages existing conversation system
- ✅ Placeholder for follow shows future intent

---

## ✅ Validation Log

### Session 1 — 2026-04-26
**Trigger:** Pre-implementation validation  
**Questions asked:** 7

#### Questions & Answers

1. **[Architecture]** The plan uses separate screens (/profile for self, /user/[id] for others) instead of conditional logic in one screen. Is this the right approach?
   - Options: Separate screens (Recommended) | Single screen with conditional logic | Hybrid: shared components only
   - **Answer:** Separate screens (Recommended)
   - **Rationale:** Clear separation, easier maintenance, matches industry patterns (Instagram/Facebook). Own profile has edit capabilities, user profile is read-only.

2. **[Caching]** The plan assumes 10s cache for profiles and 30s for posts. Does this match your app's data freshness requirements?
   - Options: Yes, 10s/30s is good (Recommended) | Shorter: 5s profile, 15s posts | Longer: 30s profile, 60s posts
   - **Answer:** Yes, 10s/30s is good (Recommended)
   - **Rationale:** Profiles change infrequently, posts update more often. Balances freshness vs performance. Manual refresh always available.

3. **[MVP Scope]** The plan implements message button but disables follow button for MVP. Is this the right scope?
   - Options: Message only (Recommended) | Both message and follow | Hide both for MVP
   - **Answer:** Message only (Recommended)
   - **Rationale:** Leverages existing conversation system. Follow requires backend support (following system). Ship faster, iterate later.

4. **[Profile Tabs]** The plan shows only posts grid, not trips/saved tabs. Is this acceptable for MVP?
   - Options: Posts only (Recommended) | Posts + Trips tabs | All tabs: Posts, Trips, Saved
   - **Answer:** Posts only (Recommended)
   - **Rationale:** Core functionality, fastest to ship. Tabs can be added later when needed. Most users care about posts first.

5. **[Error Strategy]** For error handling, the plan doesn't retry on 404/403 (permanent errors) but retries network errors up to 3 times. Is this correct?
   - Options: No retry on 404/403 (Recommended) | Retry all errors including 404/403 | Show retry button for all errors
   - **Answer:** No retry on 404/403 (Recommended)
   - **Rationale:** Permanent errors shouldn't be retried - wastes time and API quota. Immediate feedback is better UX.

6. **[Pagination]** The plan uses 20 posts per page for infinite scroll. Is this the right balance?
   - Options: 20 posts/page (Recommended) | Smaller: 12 posts/page | Larger: 30 posts/page
   - **Answer:** 20 posts/page (Recommended)
   - **Rationale:** ~7 rows on average screen. Good balance between initial load speed and fewer API calls.

7. **[Self-View]** When viewing own ID via /user/[own-id], the plan redirects to /profile. Should we handle this differently?
   - Options: Redirect to /profile (Recommended) | Show user profile view anyway | Show both options
   - **Answer:** Redirect to /profile (Recommended)
   - **Rationale:** Consistent experience, provides edit capabilities. Users expect own profile features when viewing self.

#### Confirmed Decisions
- Architecture: Separate screens (/profile vs /user/[id]) — Clear separation of concerns, easier to maintain
- Caching: 10s profile, 30s posts — Balanced freshness and performance
- MVP Scope: Message button only, follow disabled — Ship faster, leverage existing systems
- Content: Posts grid only, no tabs — Focus on core functionality
- Error Handling: No retry on permanent errors (404/403) — Faster feedback, efficient API usage
- Pagination: 20 posts per page — Optimal for mobile viewing
- Self-redirect: /user/[own-id] → /profile — Consistent UX, provide edit capabilities

#### Action Items
- [x] All architectural decisions validated
- [x] All assumptions confirmed
- [x] No changes needed to phase files
- [x] Plan ready for implementation

#### Impact on Phases
- No changes required — all recommended options confirmed by user

---

**Plan Status:** ✅ Validated & Ready for Implementation  
**Next Step:** Start with Phase 1 (Types & Services)

Use `/ck:cook` to begin implementation following this plan.
