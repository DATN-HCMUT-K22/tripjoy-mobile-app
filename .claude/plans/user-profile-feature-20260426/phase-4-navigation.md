# Phase 4: Navigation Integration

**Status:** Completed  
**Estimated Time:** 1 hour  
**Dependencies:** Phase 3 (user profile screen must exist)

---

## Objectives

Update PostCard component to make avatar and username clickable, implementing the navigation flow to user profiles.

---

## Tasks

### 4.1 Update PostCard Component

**File:** `components/social/PostCard.tsx`

**Changes Required:**
1. Add router and currentUserId hooks
2. Create handleAvatarPress function
3. Wrap avatar in TouchableOpacity
4. Wrap username in TouchableOpacity

---

### 4.2 Add Imports

**Location:** Top of file

**Add these imports:**
```typescript
import { useRouter } from 'expo-router';
import { useAppSelector } from '@/store/hooks';
import { TouchableOpacity } from 'react-native';
```

**Verify TouchableOpacity is imported** (might already be imported)

---

### 4.3 Add Hooks Inside PostCard Component

**Location:** Inside `PostCard` component function, before JSX return

**Add:**
```typescript
export function PostCard({ post, onLike, onComment, ... }: PostCardProps) {
  // Existing hooks...
  
  // ADD THESE HOOKS ⭐
  const router = useRouter();
  const currentUserId = useAppSelector(state => state.auth.user?.id);
  
  // Existing state and functions...
```

---

### 4.4 Create handleAvatarPress Function

**Location:** Inside PostCard component, after hooks

**Add:**
```typescript
const handleAvatarPress = () => {
  // Check if viewing own profile
  if (post.creator_id === currentUserId) {
    // Navigate to own profile
    router.push('/profile');
  } else {
    // Navigate to user profile
    router.push(`/user/${post.creator_id}` as any);
  }
};
```

**Logic:**
- If `post.creator_id` matches `currentUserId` → `/profile`
- Otherwise → `/user/{creator_id}`
- Guest users: currentUserId is null, always goes to `/user/{id}`

---

### 4.5 Update Avatar Section

**Location:** Find the avatar Image component (around line 287 in original file)

**BEFORE:**
```tsx
<Image
  source={{
    uri: resolveUserAvatarUri(post.user.avatar, post.user.name),
  }}
  style={{ width: 40, height: 40, borderRadius: 20 }}
  contentFit="cover"
  cachePolicy="memory-disk"
  priority="normal"
  placeholder={{ blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH" }}
  transition={200}
  onError={(error) => {
    console.error("[PostCard] Error loading avatar:", error);
    setAvatarError(true);
  }}
/>
```

**AFTER:**
```tsx
<TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
  <Image
    source={{
      uri: resolveUserAvatarUri(post.user.avatar, post.user.name),
    }}
    style={{ width: 40, height: 40, borderRadius: 20 }}
    contentFit="cover"
    cachePolicy="memory-disk"
    priority="normal"
    placeholder={{ blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH" }}
    transition={200}
    onError={(error) => {
      console.error("[PostCard] Error loading avatar:", error);
      setAvatarError(true);
    }}
  />
</TouchableOpacity>
```

**Changes:**
- ✅ Wrap in `<TouchableOpacity>`
- ✅ Add `onPress={handleAvatarPress}`
- ✅ Add `activeOpacity={0.7}` (visual feedback)

---

### 4.6 Update Username Section

**Location:** Find the username/timestamp area (around line 295-310)

**BEFORE:**
```tsx
<View className="flex-1">
  <View className="flex-row items-center gap-2 flex-wrap">
    <Text className="text-base text-gray-600">{post.timestamp}</Text>
    {post.visibility === 'PRIVATE' && (
      <View className="flex-row items-center bg-gray-100 px-2 py-0.5 rounded">
        <Ionicons name="lock-closed" size={12} color="#6B7280" />
        <Text className="text-xs text-gray-600 ml-1">Riêng tư</Text>
      </View>
    )}
  </View>
  <Text className="text-sm text-gray-500">{post.timeAgo}</Text>
</View>
```

**AFTER:**
```tsx
<View className="flex-1">
  <View className="flex-row items-center gap-2 flex-wrap">
    {/* Make username clickable */}
    <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
      <Text className="text-base text-gray-900 font-semibold">
        {post.user.name}
      </Text>
    </TouchableOpacity>
    
    <Text className="text-base text-gray-600">• {post.timestamp}</Text>
    
    {post.visibility === 'PRIVATE' && (
      <View className="flex-row items-center bg-gray-100 px-2 py-0.5 rounded">
        <Ionicons name="lock-closed" size={12} color="#6B7280" />
        <Text className="text-xs text-gray-600 ml-1">Riêng tư</Text>
      </View>
    )}
  </View>
  <Text className="text-sm text-gray-500">{post.timeAgo}</Text>
</View>
```

**Changes:**
- ✅ Add username as clickable element
- ✅ Wrap in `<TouchableOpacity onPress={handleAvatarPress}>`
- ✅ Username styles: `text-gray-900 font-semibold`
- ✅ Add bullet separator before timestamp

**Note:** This assumes username was missing before. If it already exists, just wrap it in TouchableOpacity.

---

### 4.7 Alternative: Username Already Exists

If username already exists in the PostCard, just wrap it:

**Find existing username Text:**
```tsx
<Text className="font-medium text-gray-900">{post.user.name}</Text>
```

**Wrap it:**
```tsx
<TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
  <Text className="font-medium text-gray-900">{post.user.name}</Text>
</TouchableOpacity>
```

---

## Navigation Flow

### Scenario 1: User clicks own avatar

```
PostCard (User A's post)
  ↓ [Click avatar/username]
currentUserId === post.creator_id
  ↓ [Yes]
router.push('/profile')
  ↓
Own Profile Screen (with edit capabilities)
```

### Scenario 2: User clicks other user's avatar

```
PostCard (User B's post)
  ↓ [Click avatar/username]
currentUserId !== post.creator_id
  ↓ [No]
router.push('/user/B')
  ↓
User Profile Screen (User B)
  ├─ ProfileHeader
  ├─ ProfileStats
  ├─ ProfileActions
  └─ PostsGrid
```

### Scenario 3: Guest clicks avatar

```
PostCard
  ↓ [Click avatar/username]
currentUserId === null
  ↓
router.push('/user/{id}')
  ↓
User Profile Screen
  ↓
Guest sees public profile
(Message button might require login)
```

---

## Testing

### Manual Testing Steps

1. **Test Own Avatar:**
   - Login as User A
   - Find a post by User A
   - Click avatar → Should go to /profile
   - Click username → Should go to /profile

2. **Test Other User Avatar:**
   - Login as User A
   - Find a post by User B
   - Click avatar → Should go to /user/B
   - Click username → Should go to /user/B
   - Verify profile loads correctly

3. **Test Guest Mode:**
   - Logout (guest mode)
   - Click any avatar
   - Should go to /user/{id}
   - Profile should load (public data)

4. **Test Navigation Back:**
   - Click avatar → User profile
   - Press back button
   - Should return to PostCard feed
   - Feed should maintain scroll position

5. **Test Multiple Clicks:**
   - Click User B's avatar
   - Press back
   - Click User C's avatar
   - Both should work correctly

---

## Visual Feedback

**activeOpacity={0.7}:**
- Provides visual feedback when user presses avatar/username
- Standard iOS pattern (70% opacity on press)
- Indicates the element is tappable

**Alternative: Add ripple effect on Android:**
```tsx
<TouchableOpacity
  onPress={handleAvatarPress}
  activeOpacity={0.7}
  android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
>
```

---

## Edge Cases

### 1. Post.creator_id is missing

```typescript
const handleAvatarPress = () => {
  if (!post.creator_id) {
    console.warn('No creator_id for post:', post.id);
    return;
  }
  
  if (post.creator_id === currentUserId) {
    router.push('/profile');
  } else {
    router.push(`/user/${post.creator_id}` as any);
  }
};
```

### 2. CurrentUserId is undefined (loading state)

```typescript
const currentUserId = useAppSelector(state => state.auth.user?.id);

// Will be undefined during auth loading
// Navigation will default to /user/{id} (correct behavior)
```

### 3. Navigation while still loading profile

- React Navigation handles this gracefully
- New screen shows loading state
- No crash or error

---

## Performance Considerations

1. **useAppSelector optimization:**
   ```typescript
   // Only re-render if user ID changes
   const currentUserId = useAppSelector(
     state => state.auth.user?.id,
     (prev, next) => prev === next
   );
   ```

2. **TouchableOpacity vs Pressable:**
   - TouchableOpacity: Simpler, standard
   - Pressable: More control, modern API
   - Stick with TouchableOpacity for consistency

3. **Navigation performance:**
   - Expo Router handles lazy loading
   - User profile screen only loads when navigated to
   - No performance impact on PostCard render

---

## Verification Checklist

After implementation, verify:

- [ ] Avatar is clickable
- [ ] Username is clickable
- [ ] Own avatar navigates to /profile
- [ ] Other user avatar navigates to /user/{id}
- [ ] Visual feedback on press (opacity change)
- [ ] Navigation back button works
- [ ] Guest mode navigation works
- [ ] No TypeScript errors
- [ ] No console warnings

---

## Code Review Checklist

- [ ] Imports are at the top
- [ ] Hooks are called before conditional returns
- [ ] handleAvatarPress has null checks
- [ ] TouchableOpacity has activeOpacity
- [ ] Type assertion `as any` is used for dynamic routes
- [ ] No duplicate code
- [ ] Follows existing code style

---

## Next Phase

Phase 5: Testing & Polish (comprehensive testing, bug fixes, optimization)
