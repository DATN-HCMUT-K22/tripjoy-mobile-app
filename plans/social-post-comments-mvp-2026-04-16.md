# Social Post Comments System - MVP Implementation Plan

**Created:** 2026-04-16  
**Timeline:** 2 weeks (10 working days)  
**Scope:** Full comment system with create/view/delete, replies, likes, real-time updates

---

## 📋 EXECUTIVE SUMMARY

Implement Instagram-style comment system for TripJoy social feed with:
- Bottom sheet modal UI for comments
- Nested comment threads (replies)
- Like/unlike comments
- Delete own comments
- Polling-based real-time updates
- Optimistic UI for instant feedback

**Trade-offs accepted:**
- ❌ Edit comments (cut for v1 - users delete+repost instead)
- ⚠️ Polling instead of WebSocket (technical debt, refactor in v1.2)
- ⚠️ Load all comments at once (no pagination - add later if needed)
- ⚠️ Manual testing only (E2E tests in v1.1)

---

## 🎯 REQUIREMENTS

### Functional Requirements
1. **View Comments**
   - Tap comment icon → bottom sheet modal opens
   - Display root comments + nested replies
   - Show comment author, content, timestamp
   - Show like count per comment
   - Flat indented list for thread hierarchy

2. **Create Comments**
   - Text input at bottom of modal
   - Post root comment on current post
   - Reply to existing comment (with @mention)
   - Character limit: 500 chars
   - Empty validation

3. **Reply to Comments**
   - Tap "Reply" on any comment
   - Input focuses with "@username" pre-filled
   - Reply appears nested under parent
   - Support multi-level nesting

4. **Like Comments**
   - Heart icon on each comment
   - Toggle like/unlike
   - Show like count
   - Optimistic UI update

5. **Delete Comments**
   - Only own comments
   - Swipe-to-delete or long-press menu
   - Confirmation dialog
   - Auto-remove from UI

6. **Real-time Updates**
   - Poll every 30s when modal open
   - Pause polling when modal closed
   - Show new comments from others
   - Preserve scroll position

### Non-Functional Requirements
- **Performance:** Modal opens <200ms
- **Network:** Handle offline gracefully
- **UX:** Optimistic updates for own actions
- **Accessibility:** Screen reader support
- **Error Handling:** Toast messages for failures

---

## 🏗️ ARCHITECTURE

### Component Structure
```
app/(tabs)/index.tsx
└─ PostCard (existing)
   └─ onComment → opens CommentModal

components/social/
├─ CommentModal.tsx (new)
│  ├─ CommentBottomSheet (bottom sheet container)
│  ├─ CommentList (FlatList with comments)
│  ├─ CommentInput (text input + send button)
│  └─ useCommentPolling (polling hook)
│
├─ CommentItem.tsx (new)
│  ├─ UserAvatar
│  ├─ CommentContent
│  ├─ CommentActions (like, reply, delete)
│  └─ ReplyList (nested replies)
│
└─ CommentInput.tsx (new)
   ├─ TextInput (multi-line)
   ├─ SendButton
   └─ CharacterCount
```

### State Management
```typescript
// React Query cache keys
['posts', postId, 'comments'] // root comments
['comments', commentId, 'replies'] // nested replies
['comments', commentId, 'like'] // like state

// Local UI state (useState)
- modalVisible: boolean
- replyToComment: Comment | null
- inputText: string
```

### Data Flow
```
User Action (e.g., like comment)
    ↓
Optimistic UI Update (instant visual feedback)
    ↓
API Call (POST /comments/{id}/likes)
    ↓
Success → Keep optimistic state
    ↓
Error → Rollback + show toast
    ↓
Background polling refetches data (every 30s)
```

---

## 🔌 API INTEGRATION

### Endpoints to Use

**Get Comments:**
```typescript
GET /api/v1/posts/{postId}/comments?page=0&size=100
Response: PageCommentResponse {
  content: CommentResponse[]
  // CommentResponse has latest_replies: CommentResponse[]
}
```

**Create Root Comment:**
```typescript
POST /api/v1/posts/{postId}/comments
Body: { content: string, post_id: string }
Response: CommentResponse
```

**Create Reply:**
```typescript
POST /api/v1/comments/{commentId}/replies
Body: { content: string, post_id: string, parent_comment_id: string }
Response: CommentResponse
```

**Get Replies:**
```typescript
GET /api/v1/comments/{commentId}/replies?page=0&size=50
Response: PageCommentResponse
```

**Like Comment:**
```typescript
POST /api/v1/comments/{commentId}/likes
Response: ApiResponseVoid
```

**Unlike Comment:**
```typescript
DELETE /api/v1/comments/{commentId}/likes
Response: ApiResponseVoid
```

**Delete Comment:**
```typescript
DELETE /api/v1/comments/{commentId}
Response: ApiResponseVoid
```

### New Service Functions (services/comment.ts)

```typescript
export const getPostComments = (postId: string, page = 0, size = 100) =>
  httpClient.get(`/posts/${postId}/comments`, { params: { page, size } });

export const getCommentReplies = (commentId: string, page = 0, size = 50) =>
  httpClient.get(`/comments/${commentId}/replies`, { params: { page, size } });

export const createComment = (payload: {
  postId: string;
  content: string;
}) => httpClient.post(`/posts/${payload.postId}/comments`, {
  content: payload.content,
  post_id: payload.postId,
});

export const createReply = (payload: {
  commentId: string;
  postId: string;
  content: string;
}) => httpClient.post(`/comments/${payload.commentId}/replies`, {
  content: payload.content,
  post_id: payload.postId,
  parent_comment_id: payload.commentId,
});

export const likeComment = (commentId: string) =>
  httpClient.post(`/comments/${commentId}/likes`);

export const unlikeComment = (commentId: string) =>
  httpClient.delete(`/comments/${commentId}/likes`);

export const deleteComment = (commentId: string) =>
  httpClient.delete(`/comments/${commentId}`);
```

### New Hooks (hooks/useComments.ts)

```typescript
// Query: Get comments for a post
export const usePostComments = (postId: string, enabled: boolean) =>
  useQuery({
    queryKey: ['posts', postId, 'comments'],
    queryFn: () => getPostComments(postId),
    enabled,
    refetchInterval: enabled ? 30000 : false, // poll every 30s
  });

// Query: Get replies for a comment
export const useCommentReplies = (commentId: string, enabled: boolean) =>
  useQuery({
    queryKey: ['comments', commentId, 'replies'],
    queryFn: () => getCommentReplies(commentId),
    enabled,
  });

// Mutation: Create root comment
export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createComment,
    onMutate: async (newComment) => {
      // Optimistic update
      await queryClient.cancelQueries(['posts', newComment.postId, 'comments']);
      const previous = queryClient.getQueryData(['posts', newComment.postId, 'comments']);
      
      queryClient.setQueryData(['posts', newComment.postId, 'comments'], (old: any) => ({
        ...old,
        content: [
          {
            id: `temp-${Date.now()}`,
            content: newComment.content,
            created_by_user: { /* current user */ },
            like_count: 0,
            is_liked: false,
            reply_count: 0,
          },
          ...(old?.content || []),
        ],
      }));
      
      return { previous };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['posts', variables.postId, 'comments'], context?.previous);
      showErrorToast('Bình luận thất bại', err);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries(['posts', variables.postId, 'comments']);
    },
  });
};

// Mutation: Like comment
export const useLikeComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => likeComment(commentId),
    onMutate: async (commentId) => {
      // Optimistic toggle
      // ... similar pattern
    },
    onError: (err) => showErrorToast('Thao tác thất bại', err),
  });
};

// Mutation: Delete comment
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']); // refetch all
      showSuccessToast('Đã xóa bình luận');
    },
    onError: (err) => showErrorToast('Xóa thất bại', err),
  });
};
```

---

## 📐 UI/UX DESIGN

### Comment Modal Layout

```
┌─────────────────────────────────────┐
│  [X] Bình luận (142)           Close│ ← Header
├─────────────────────────────────────┤
│  ╭───────────────────────────────╮  │
│  │ [@avatar] Nguyễn Văn A  2h    │  │ ← Root comment
│  │ Chuyến đi này đẹp quá! 😍     │  │
│  │ ♥ 12  💬 Reply  🗑️ Delete     │  │
│  │                                │  │
│  │   ├─ [@avatar] Trần B  1h     │  │ ← Reply (indented)
│  │   │  Đồng ý! Mình cũng muốn đi│  │
│  │   │  ♥ 3  💬 Reply             │  │
│  │   │                            │  │
│  │   └─ [@avatar] Lê C  30m      │  │ ← Nested reply
│  │      Cùng đi nhé!              │  │
│  │      ♥ 1  💬 Reply             │  │
│  ╰───────────────────────────────╯  │
│  ... more comments ...              │
│                                     │
├─────────────────────────────────────┤
│ Đang trả lời @Nguyễn Văn A  [x]    │ ← Reply indicator
│ ┌─────────────────────────────────┐ │
│ │ Nhập bình luận...               │ │ ← Input
│ └─────────────────────────────────┘ │
│ [📷] [😊] [Send ✈️]  120/500        │ ← Actions + char count
└─────────────────────────────────────┘
```

### Interaction States

**Comment Item States:**
- Default: Black text, gray metadata
- Liked: Red heart icon filled
- Own comment: Show delete icon
- Long press: Show context menu (Reply, Delete if own)

**Input States:**
- Empty: Send button disabled, gray
- Typing: Character count updates
- Replying: Show "@username" chip, cancelable
- Sending: Loading spinner on send button
- Error: Red border + shake animation

### Animations
- Modal slide up from bottom: 300ms ease-out
- Comment appear: Fade in 200ms
- Like heart: Scale bounce (1.0 → 1.3 → 1.0) 150ms
- Delete: Swipe right 200ms → fade out 150ms
- Error shake: Translate X (-10 → 10 → 0) 300ms

---

## 🛠️ IMPLEMENTATION PLAN

### Week 1: Core Foundation (Days 1-5)

#### Day 1-2: Modal UI + Layout
**Files to create:**
- `components/social/CommentModal.tsx`
- `components/social/CommentBottomSheet.tsx`

**Tasks:**
- [ ] Install `@gorhom/bottom-sheet` package
- [ ] Create CommentModal component with bottom sheet
- [ ] Add modal trigger from PostCard onComment
- [ ] Implement header with close button + comment count
- [ ] Create basic ScrollView/FlatList for comments
- [ ] Add modal open/close animations
- [ ] Test modal on different screen sizes

**Acceptance:**
- Tapping comment icon opens modal
- Modal has header with count + close button
- Modal closes smoothly
- Works on iOS + Android

---

#### Day 3-4: Create & View Root Comments
**Files to create:**
- `services/comment.ts`
- `hooks/useComments.ts`
- `components/social/CommentInput.tsx`
- `components/social/CommentItem.tsx`
- `types/comment.ts`

**Tasks:**
- [ ] Define Comment types in `types/comment.ts`
- [ ] Create API service functions (getPostComments, createComment)
- [ ] Create usePostComments hook with React Query
- [ ] Create useCreateComment mutation with optimistic updates
- [ ] Build CommentInput component (text input + send button)
- [ ] Build CommentItem component (avatar, username, content, timestamp)
- [ ] Wire up create comment flow
- [ ] Add character limit validation (500 chars)
- [ ] Add empty content validation
- [ ] Test create comment API integration
- [ ] Test optimistic UI (instant feedback)

**Acceptance:**
- Can type and submit root comments
- Comments appear instantly (optimistic)
- Comment count updates
- Shows error toast if API fails
- Validation prevents empty/too long comments

---

#### Day 5: Reply Functionality
**Files to modify:**
- `components/social/CommentItem.tsx`
- `components/social/CommentInput.tsx`
- `hooks/useComments.ts`
- `services/comment.ts`

**Tasks:**
- [ ] Add createReply service function
- [ ] Create useCreateReply mutation hook
- [ ] Add "Reply" button to CommentItem
- [ ] Handle reply click → set replyTo state
- [ ] Show "@username" chip in input when replying
- [ ] Add cancel reply button
- [ ] Implement reply submission
- [ ] Render nested replies with indentation
- [ ] Add getCommentReplies service + hook (for future pagination)
- [ ] Test multi-level reply threads

**Acceptance:**
- Clicking Reply focuses input with @mention
- Replies appear nested under parent
- Can cancel reply mode
- Indentation shows thread hierarchy

---

### Week 2: Advanced Features (Days 6-10)

#### Day 6-7: Like Comments + Delete Comments
**Files to modify:**
- `components/social/CommentItem.tsx`
- `hooks/useComments.ts`
- `services/comment.ts`

**Tasks:**
- [ ] Add likeComment/unlikeComment service functions
- [ ] Create useLikeComment mutation with optimistic toggle
- [ ] Add heart icon + like count to CommentItem
- [ ] Implement like/unlike on tap
- [ ] Add deleteComment service function
- [ ] Create useDeleteComment mutation
- [ ] Add delete icon for own comments (check created_by vs current user)
- [ ] Implement swipe-to-delete gesture (react-native-swipeable)
- [ ] Add confirmation dialog before delete
- [ ] Handle delete optimistic update
- [ ] Test like toggle (visual + API)
- [ ] Test delete (own comments only)

**Acceptance:**
- Can like/unlike comments (heart turns red)
- Like count updates instantly
- Can swipe or long-press to delete own comments
- Confirmation dialog prevents accidental deletes
- Deleted comments disappear from UI

---

#### Day 8: Polling + Real-time Updates
**Files to modify:**
- `hooks/useComments.ts`
- `components/social/CommentModal.tsx`

**Tasks:**
- [ ] Add refetchInterval to usePostComments (30000ms)
- [ ] Only enable polling when modal is visible
- [ ] Pause polling when modal closes
- [ ] Preserve scroll position during refetch
- [ ] Add pull-to-refresh gesture
- [ ] Handle new comments appearing (smooth insertion)
- [ ] Add "X new comments" indicator at top
- [ ] Test polling behavior (network tab)
- [ ] Test background/foreground transitions
- [ ] Optimize: only poll if connected to internet

**Acceptance:**
- Comments refresh every 30s when modal open
- No polling when modal closed
- New comments appear without jarring scroll
- Pull-to-refresh works
- No polling when offline

---

#### Day 9-10: Bug Fixes, Testing, Polish
**Files to modify:**
- All comment components
- Add error boundaries

**Tasks:**
- [ ] Add error boundary around CommentModal
- [ ] Handle edge cases:
  - Empty comment list state
  - Loading state (skeleton UI)
  - Network error state
  - Deleted comment (show "[Đã xóa]" placeholder)
  - User not found (deleted account)
- [ ] Accessibility:
  - Add aria labels
  - Test with screen reader
  - Keyboard navigation
- [ ] Performance:
  - Memoize CommentItem with React.memo
  - Use FlatList keyExtractor properly
  - Optimize re-renders
- [ ] Polish animations:
  - Smooth transitions
  - Haptic feedback on like/delete
- [ ] Manual testing on real devices:
  - iOS (iPhone 12+)
  - Android (Pixel, Samsung)
- [ ] Fix bugs from testing
- [ ] Code review + refactor

**Acceptance:**
- No crashes or UI glitches
- Smooth performance (60fps)
- Accessible to screen readers
- Works offline gracefully
- All edge cases handled

---

## 🧪 TESTING STRATEGY

### Manual Testing Checklist
- [ ] Create root comment
- [ ] Create reply to comment
- [ ] Create nested reply (3 levels deep)
- [ ] Like/unlike comment (own + others')
- [ ] Delete own comment (root + reply)
- [ ] Try to delete others' comment (should not see option)
- [ ] Submit empty comment (should fail validation)
- [ ] Submit 501 char comment (should fail validation)
- [ ] Open modal on slow network (loading state)
- [ ] Open modal with no comments (empty state)
- [ ] Like while offline → go online (should retry)
- [ ] Create comment while offline (should error)
- [ ] Polling updates (post comment from another account, wait 30s)
- [ ] Pull to refresh
- [ ] Close modal (polling stops)
- [ ] Reopen modal (polling resumes)
- [ ] App background → foreground (no crashes)
- [ ] Rapid like/unlike (optimistic UI)
- [ ] Cancel reply mode
- [ ] Long comment text (wrapping)
- [ ] Comment with emojis
- [ ] Comment with URLs
- [ ] Screen rotation
- [ ] Small screens (iPhone SE)
- [ ] Large screens (iPad)
- [ ] Dark mode (if supported)

### Automated Testing (Future - v1.1)
```typescript
// Example E2E test with Detox
describe('Comment System', () => {
  it('should create a comment', async () => {
    await element(by.id('post-comment-btn')).tap();
    await element(by.id('comment-input')).typeText('Great post!');
    await element(by.id('comment-send-btn')).tap();
    await expect(element(by.text('Great post!'))).toBeVisible();
  });
});
```

---

## 📊 SUCCESS METRICS

### Technical Metrics
- Modal open time: <200ms (p95)
- Comment create latency: <500ms (p95)
- API error rate: <1%
- Crash-free rate: >99.5%
- FPS during scroll: >55fps

### Product Metrics (Track in Analytics)
- Comments per post (avg)
- Reply rate (% of comments that get replies)
- Like rate (% of comments that get likes)
- Delete rate (% of comments deleted by author)
- Time spent in comment modal (avg)
- DAU engagement with comments (% of users)

---

## ⚠️ RISKS & MITIGATION

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Polling overhead kills battery** | High | Medium | Add intelligent polling: only when modal open, pause when backgrounded, fallback to 60s if battery low |
| **Viral posts (>500 comments) lag** | Medium | High | Emergency pagination: if >200 comments, show "Load more", track post comment_count to predict |
| **No edit frustrates users** | High | Medium | Clear messaging in UI, add edit in v1.1 sprint (1 week), educate users via tooltip |
| **Race conditions in optimistic UI** | Medium | Medium | Use temp IDs for optimistic comments, dedupe on API response, server timestamp as source of truth |
| **Network errors confuse users** | Medium | High | Toast messages explain what failed, retry button, rollback optimistic changes, offline indicator |
| **Scope creep (features added mid-sprint)** | High | High | Lock scope, document v1.1 features, redirect new requests to backlog |
| **API response format changes** | Low | High | Validate API schema, add error boundary, log unexpected responses to Sentry |

---

## 🚀 POST-LAUNCH (v1.1 - Week 3+)

### Technical Debt to Address
1. **Replace polling with WebSocket** (3-4 days)
   - Set up WebSocket connection
   - Subscribe to post comment events
   - Push new comments in real-time
   - Remove polling logic

2. **Add comment pagination** (2 days)
   - Infinite scroll for comments
   - "Load more replies" for threads
   - Virtual scrolling for large lists

3. **Edit comments** (2 days)
   - Inline editing UI
   - PUT /comments/{id} API
   - Edit history tracking (future)

### Feature Enhancements (v1.2+)
- **Notifications:** Push notification when someone replies to your comment
- **Mentions:** @username mentions with autocomplete
- **Rich media:** Upload images in comments
- **Reactions:** Beyond like (laugh, love, wow)
- **Sorting:** Sort by newest/oldest/most liked
- **Moderation:** Report comments, admin delete
- **Analytics:** Track engagement metrics

---

## 📚 TECHNICAL REFERENCES

### Key Dependencies
```json
{
  "@gorhom/bottom-sheet": "^4.6.0",
  "@tanstack/react-query": "^5.x",
  "react-native-swipeable": "^0.6.0",
  "expo-haptics": "~13.x"
}
```

### API Documentation
- `/docs/modules/post.md` - Post endpoints
- `/docs/modules/comment.md` - Comment endpoints
- Backend API base: `/api/v1`

### Code References
- Existing: `components/social/PostCard.tsx`
- Existing: `hooks/useSocial.ts`
- Pattern: `hooks/useConversations.ts` (similar polling logic)
- Pattern: `components/common/LoginRequiredModal.tsx` (modal reference)

---

## 📝 NOTES & DECISIONS

### Why Polling Over WebSocket?
- **Time constraint:** WebSocket needs infrastructure setup (3-4 days)
- **Polling works:** 30s interval acceptable for v1
- **Easy rollback:** Can swap in WebSocket later without UI changes
- **Trade-off:** Battery drain + server load, but buys time to ship

### Why Cut Edit Comments?
- **Low ROI:** Users can delete+repost
- **Complexity:** Edit history, abuse prevention
- **Time:** Saves 1.5 days
- **User feedback:** Ship first, add if users complain

### Why No Pagination?
- **Realistic assumption:** Most posts <100 comments
- **Simplicity:** Avoid infinite scroll bugs
- **Emergency exit:** Can add if post goes viral (200+ comments)
- **Performance:** FlatList handles 100 items fine

### Why Optimistic UI?
- **Perceived speed:** Feels instant vs 300-500ms API latency
- **Engagement:** Users keep scrolling instead of waiting
- **Rollback:** Easy to revert on error
- **Standard:** Instagram/Twitter do this

---

## ✅ DEFINITION OF DONE

### Code Complete When:
- [ ] All components created and working
- [ ] All API endpoints integrated
- [ ] All hooks handle errors gracefully
- [ ] TypeScript has no errors
- [ ] Code follows project style guide
- [ ] Comments added for complex logic

### Testing Complete When:
- [ ] All manual test cases pass
- [ ] No crash bugs found
- [ ] Works on iOS + Android
- [ ] Accessibility tested
- [ ] Performance acceptable (>55fps)

### Launch Ready When:
- [ ] Code reviewed by team
- [ ] Merged to main branch
- [ ] Analytics events tracking
- [ ] Error logging (Sentry) configured
- [ ] Documentation updated
- [ ] Product team signed off

---

## 🎯 FINAL CHECKLIST FOR GO-LIVE

- [ ] Code freeze 1 day before launch
- [ ] QA testing complete
- [ ] Rollback plan documented
- [ ] Monitor server load during launch
- [ ] Watch error rates in Sentry
- [ ] Support team briefed on new feature
- [ ] Social media announcement ready
- [ ] User feedback channels open
- [ ] Post-launch metrics dashboard ready

---

**Plan Status:** READY FOR IMPLEMENTATION  
**Next Step:** Day 1 - Start with CommentModal UI  
**Owner:** Development Team  
**Last Updated:** 2026-04-16
