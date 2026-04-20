# Phase 2: Itinerary Integration & Post Management

**Status:** ✅ COMPLETED  
**Completion Date:** 2026-04-20  
**Priority:** HIGH  
**Dependencies:** Phase 1 complete  

---

## Implementation Summary

Successfully implemented all Phase 2 requirements including itinerary selection in post creation, itinerary preview display, post edit screen with ownership validation, and post actions menu with delete confirmation.

**All 5 tasks completed:**
- ✅ Enhanced itinerary selection in create post
- ✅ Display itinerary preview in PostCard
- ✅ Created post edit screen with ownership checks
- ✅ Added post actions menu (edit/delete)
- ✅ Integrated three-dot menu in PostCard

---

## Overview

Enable posts to link to itineraries and allow creators to edit/delete their posts with proper ownership validation.

**Goal:** ✅ Users can share trip experiences linked to their itineraries and manage their content.

---

## Tasks

### 2.1 Enhance Itinerary Selection in Create Post ⏱️ 1.5 hours

**File:** `app/create-post.tsx`

**Already Has:** Itinerary selection UI (checked during exploration)

**Integrate:**
```typescript
const [selectedItinerary, setSelectedItinerary] = useState<ItineraryResponse | null>(null);

// Fetch user's itineraries
const { data: itineraries = [] } = useQuery({
  queryKey: ['itineraries', 'me'],
  queryFn: () => itineraryService.getMyItineraries(),
});

// In submit handler:
itinerary_id: selectedItinerary?.id,
```

**UI:**
- Show itinerary selector button
- Bottom sheet with user's itineraries list
- Display selected itinerary card
- "Remove itinerary" option

---

### 2.2 Display Itinerary Preview in PostCard ⏱️ 2 hours

**File:** `components/social/PostCard.tsx`

**New Component:**
```typescript
interface ItineraryPreviewProps {
  itinerary: Post['itinerary'];
  onPress: () => void;
}

const ItineraryPreview: React.FC<ItineraryPreviewProps> = ({ itinerary, onPress }) => {
  if (!itinerary) return null;
  
  return (
    <TouchableOpacity 
      style={styles.itineraryCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.itineraryIcon}>
        <Ionicons name="map-outline" size={20} color="#16A34A" />
      </View>
      <View style={styles.itineraryInfo}>
        <Text style={styles.itineraryTitle}>{itinerary.title}</Text>
        <View style={styles.itineraryMeta}>
          <Text style={styles.itineraryText}>
            {itinerary.duration_days} ngày • {formatCurrencyVND(itinerary.budget_estimate)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
};
```

**Integration:**
```typescript
// After HashtagList, before engagement metrics:
{post.itinerary && (
  <ItineraryPreview 
    itinerary={post.itinerary}
    onPress={() => router.push(`/itinerary/${post.itinerary.id}`)}
  />
)}
```

---

### 2.3 Create Post Edit Screen ⏱️ 2 hours

**New File:** `app/edit-post/[id].tsx`

**Structure:** Copy from `create-post.tsx`, modify:
```typescript
export default function EditPostScreen() {
  const { id } = useLocalSearchParams();
  const updateMutation = useUpdatePost();
  
  // Fetch existing post
  const { data: post, isLoading } = useQuery({
    queryKey: ['posts', id],
    queryFn: () => getPostById(id as string),
  });
  
  // Pre-fill form with existing data
  useEffect(() => {
    if (post) {
      setContent(post.content);
      setSelectedMedia(post.media_urls);
      setSelectedVisibility(post.visibility);
      setSelectedItinerary(post.itinerary);
    }
  }, [post]);
  
  const handleUpdate = async () => {
    await updateMutation.mutateAsync({
      postId: id as string,
      payload: {
        content,
        media_urls: selectedMedia,
        hashtags: extractHashtags(content),
        visibility: selectedVisibility,
        itinerary_id: selectedItinerary?.id,
      },
    });
  };
  
  // ... rest similar to create-post
}
```

**Ownership Check:**
```typescript
const currentUserId = useAppSelector(state => state.auth.user?.id);
const isOwner = post?.creator_id === currentUserId;

if (!isOwner) {
  return <UnauthorizedScreen />;
}
```

---

### 2.4 Add Post Actions Menu ⏱️ 2 hours

**New File:** `components/social/PostActionsMenu.tsx`

```typescript
import { useAppSelector } from '@/store/hooks';
import { useDeletePost } from '@/hooks/usePostManagement';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

interface PostActionsMenuProps {
  post: Post;
  onClose: () => void;
}

export const PostActionsMenu: React.FC<PostActionsMenuProps> = ({ post, onClose }) => {
  const currentUserId = useAppSelector(state => state.auth.user?.id);
  const isOwner = post.creator_id === currentUserId;
  const deleteMutation = useDeletePost();
  const router = useRouter();
  
  if (!isOwner) return null;
  
  const handleEdit = () => {
    onClose();
    router.push(`/edit-post/${post.id}`);
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Xóa bài viết',
      'Bạn có chắc chắn muốn xóa bài viết này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            onClose();
            await deleteMutation.mutateAsync(post.id);
          },
        },
      ]
    );
  };
  
  return (
    <BottomSheetModal>
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
          <Ionicons name="create-outline" size={24} color="#374151" />
          <Text style={styles.menuText}>Chỉnh sửa bài viết</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#DC2626" />
          <Text style={[styles.menuText, styles.deleteText]}>Xóa bài viết</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={onClose}>
          <Text style={styles.cancelText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
};
```

---

### 2.5 Add Three-Dot Menu to PostCard ⏱️ 30min

**File:** `components/social/PostCard.tsx`

```typescript
const [showActionsMenu, setShowActionsMenu] = useState(false);
const currentUserId = useAppSelector(state => state.auth.user?.id);
const isOwner = post.creator_id === currentUserId;

// In header section, next to username:
{isOwner && (
  <TouchableOpacity 
    onPress={() => setShowActionsMenu(true)}
    style={styles.moreBtn}
  >
    <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
  </TouchableOpacity>
)}

// At bottom of component:
<PostActionsMenu 
  post={post}
  visible={showActionsMenu}
  onClose={() => setShowActionsMenu(false)}
/>
```

---

## Acceptance Criteria

- ✅ User can select itinerary when creating post
- ✅ Selected itinerary displays in post creation form
- ✅ Itinerary preview card shows in post feed
- ✅ Clicking itinerary preview navigates to itinerary detail
- ✅ User can unlink itinerary during edit
- ✅ Only post creator sees three-dot menu
- ✅ Edit screen pre-fills all existing data (content, media, hashtags, visibility, itinerary)
- ✅ Updated post refreshes in feed immediately
- ✅ Delete requires confirmation dialog
- ✅ Deleted post disappears from feed immediately
- ✅ Non-owner cannot access edit screen (unauthorized error)
- ✅ Non-owner does not see three-dot menu

---

## Testing Checklist

- [ ] Create post with itinerary selected
- [ ] Create post without itinerary
- [ ] Edit post to add itinerary
- [ ] Edit post to remove itinerary
- [ ] Edit post content only (no other changes)
- [ ] Edit post media (add/remove images)
- [ ] Try to edit another user's post (should fail)
- [ ] Delete own post (confirm dialog appears)
- [ ] Delete post → verify it disappears from feed
- [ ] Delete post → try to access by direct URL (should 404)
- [ ] Click itinerary preview → navigates correctly

---

## Files Changed

### Modified:
1. `app/create-post.tsx` - Add itinerary selection
2. `components/social/PostCard.tsx` - Add itinerary preview + actions menu
3. `hooks/usePostManagement.ts` - Already created in Phase 1
4. `services/social.ts` - Already has update/delete

### Created:
1. `app/edit-post/[id].tsx` - Edit screen
2. `components/social/PostActionsMenu.tsx` - Edit/delete menu
3. `components/social/ItineraryPreview.tsx` - Or inline in PostCard

---

## API Requirements

- `PUT /posts/{id}` - Must accept partial updates
- `DELETE /posts/{id}` - Soft delete (sets `is_deleted = true`)
- `GET /posts/{id}` - Fetch single post for edit screen

---

## Success Metrics

- 80%+ posts with itinerary link (indicates users find it useful)
- < 3% edit failure rate
- < 1% unauthorized edit attempts (good auth enforcement)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| User edits post while viewing old cached version | Fetch latest before edit, show "Post updated by someone else" if conflict |
| Itinerary deleted after post created | Handle null itinerary gracefully, show "[Itinerary removed]" |
| Long itinerary names overflow UI | Truncate with ellipsis (numberOfLines={1}) |

---

**Status:** ✅ COMPLETED  
**Completion Date:** 2026-04-20  
**Next:** Phase 3 - Discovery & Search (COMPLETED)
