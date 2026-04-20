# Phase 6: Chat Enhancements

**Duration**: Week 7-8
**Status**: Completed
**Completion Date**: 2026-04-20
**Depends On**: Phase 1, Phase 4

## Goal

Polish existing chat with pinned messages, enhanced interactions, and better UX.

## Tasks

### 6.1 Add Pinned Messages Feature

**File**: `app/groups/[id]/chat.tsx` (UPDATE)

```typescript
// Fetch pinned messages
const { data: pinnedMessages = [] } = useQuery({
  queryKey: ['pinned-messages', conversationId],
  queryFn: async () => {
    const response = await messageService.getPinnedMessages(conversationId);
    return response.data || [];
  },
  enabled: !!conversationId,
});

// Add pinned message bar
{pinnedMessages.length > 0 && (
  <PinnedMessageBar
    messages={pinnedMessages}
    onPress={(message) => scrollToMessage(message.id)}
    onClose={() => setPinnedBarVisible(false)}
  />
)}
```

**API Service**:
```typescript
// services/messages.ts (UPDATE or CREATE)
export const messageService = {
  async getPinnedMessages(conversationId: string): Promise<ApiResponse<Message[]>> {
    return httpClient.get(`/conversations/${conversationId}/messages/pinned`);
  },
  
  async pinMessage(messageId: string): Promise<ApiResponse<void>> {
    return httpClient.post(`/messages/${messageId}/pin`);
  },
  
  async unpinMessage(messageId: string): Promise<ApiResponse<void>> {
    return httpClient.delete(`/messages/${messageId}/pin`);
  },
};
```

**Acceptance Criteria**:
- [ ] Pinned bar shows at top of chat
- [ ] Tap to scroll to pinned message
- [ ] Visual indicator on pinned messages
- [ ] Only LEADER/CO_LEADER can pin

---

### 6.2 Create PinnedMessageBar Component

**File**: `components/chat/PinnedMessageBar.tsx` (NEW or UPDATE)

```typescript
interface PinnedMessageBarProps {
  messages: Message[];
  onPress: (message: Message) => void;
  onClose: () => void;
}

export function PinnedMessageBar({ messages, onPress, onClose }: PinnedMessageBarProps) {
  return (
    <View className="bg-amber-50 border-b border-amber-200">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="px-4 py-2"
      >
        {messages.map((message, index) => (
          <TouchableOpacity
            key={message.id}
            onPress={() => onPress(message)}
            className="mr-3 flex-row items-center bg-white rounded-lg px-3 py-2 shadow-sm"
            activeOpacity={0.7}
          >
            <Ionicons name="pin" size={16} color="#F59E0B" />
            <Text className="ml-2 text-sm text-gray-800" numberOfLines={1}>
              {message.message_content}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity
        className="absolute right-2 top-2 bg-white rounded-full p-1"
        onPress={onClose}
      >
        <Ionicons name="close" size={16} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );
}
```

**Acceptance Criteria**:
- [ ] Shows multiple pinned messages horizontally
- [ ] Tap to jump to message
- [ ] Close button hides bar
- [ ] Visual hierarchy clear

---

### 6.3 Enhance Message Action Sheet

**File**: `components/chat/MessageActionSheet.tsx` (UPDATE)

```typescript
const messageActions = useMemo(() => {
  const actions = [
    { icon: 'arrow-undo', label: 'Reply', onPress: () => replyToMessage(message) },
    { 
      icon: message.is_liked_by_current_user ? 'heart' : 'heart-outline', 
      label: message.is_liked_by_current_user ? 'Unlike' : 'Like', 
      onPress: () => toggleLike(message.id) 
    },
    { icon: 'copy', label: 'Copy Text', onPress: () => copyToClipboard(message.message_content) },
  ];
  
  // Pin/unpin for leaders and co-leaders
  if (currentUserRole === 'LEADER' || currentUserRole === 'CO_LEADER') {
    actions.push({
      icon: message.is_pinned ? 'pin' : 'pin-outline',
      label: message.is_pinned ? 'Unpin Message' : 'Pin Message',
      onPress: () => togglePinMessage(message.id)
    });
  }
  
  // Delete for message owner or leaders
  if (message.sender.id === currentUser.id || currentUserRole === 'LEADER') {
    actions.push({
      icon: 'trash',
      label: 'Delete Message',
      onPress: () => confirmDeleteMessage(message.id),
      danger: true
    });
  }
  
  return actions;
}, [message, currentUserRole, currentUser.id]);
```

**Acceptance Criteria**:
- [ ] Shows role-appropriate actions
- [ ] Pin action visible for LEADER/CO_LEADER
- [ ] Delete for owner or LEADER
- [ ] Actions work correctly

---

### 6.4 Add Message Search

**File**: `components/chat/MessageSearchModal.tsx` (NEW)

```typescript
export function MessageSearchModal({ visible, onClose, conversationId }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['search-messages', conversationId, debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 3) return [];
      const response = await messageService.searchMessages(conversationId, debouncedQuery);
      return response.data || [];
    },
    enabled: debouncedQuery.length >= 3,
  });
  
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView className="flex-1 bg-white">
        {/* Search header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <TextInput
            className="flex-1 ml-3 text-base"
            placeholder="Search messages..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search results */}
        {debouncedQuery.length < 3 ? (
          <EmptySearchState message="Type at least 3 characters to search" />
        ) : isLoading ? (
          <LoadingState />
        ) : searchResults.length === 0 ? (
          <EmptySearchState message="No messages found" />
        ) : (
          <FlatList
            data={searchResults}
            renderItem={({ item }) => (
              <MessageSearchResult
                message={item}
                query={debouncedQuery}
                onPress={() => {
                  onClose();
                  jumpToMessage(item.id);
                }}
              />
            )}
            keyExtractor={(item) => item.id}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
```

**File**: `components/chat/MessageSearchResult.tsx` (NEW)

```typescript
export function MessageSearchResult({ message, query, onPress }: Props) {
  // Highlight matching text
  const highlightedText = useMemo(() => {
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = message.message_content.split(regex);
    return parts;
  }, [message.message_content, query]);
  
  return (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-100"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center mb-2">
        <ExpoImage
          source={{ uri: message.sender.avatar_url }}
          style={{ width: 32, height: 32, borderRadius: 16 }}
        />
        <View className="ml-2">
          <Text className="font-semibold text-sm">{message.sender.full_name}</Text>
          <Text className="text-xs text-gray-500">
            {formatRelativeTime(message.created_at)}
          </Text>
        </View>
      </View>
      <Text className="text-gray-800" numberOfLines={2}>
        {highlightedText.map((part, index) => (
          <Text
            key={index}
            className={part.toLowerCase() === query.toLowerCase() ? 'bg-yellow-200' : ''}
          >
            {part}
          </Text>
        ))}
      </Text>
    </TouchableOpacity>
  );
}
```

**Acceptance Criteria**:
- [ ] Search works with 3+ characters
- [ ] Results show with highlighted matches
- [ ] Tap to jump to message
- [ ] Debounce prevents too many requests
- [ ] Empty states clear

---

### 6.5 Add Search Button to Chat Header

**File**: `app/groups/[id]/chat.tsx` (UPDATE)

```typescript
// Add search button to header
<View className="flex-row items-center">
  <TouchableOpacity
    onPress={() => setShowSearch(true)}
    className="p-2"
  >
    <Ionicons name="search" size={24} color="#000" />
  </TouchableOpacity>
</View>

<MessageSearchModal
  visible={showSearch}
  onClose={() => setShowSearch(false)}
  conversationId={conversationId}
/>
```

**Acceptance Criteria**:
- [ ] Search icon visible in header
- [ ] Opens search modal
- [ ] Modal dismisses correctly

---

### 6.6 Improve Typing Indicators

**File**: `components/chat/TypingIndicator.tsx` (UPDATE or CREATE)

```typescript
export function TypingIndicator({ typingUsers }: { typingUsers: User[] }) {
  if (typingUsers.length === 0) return null;
  
  const displayText = useMemo(() => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].full_name} is typing...`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].full_name} and ${typingUsers[1].full_name} are typing...`;
    }
    return `${typingUsers.length} people are typing...`;
  }, [typingUsers]);
  
  return (
    <View className="px-4 py-2 bg-gray-50 flex-row items-center">
      <View className="flex-row gap-1 mr-2">
        <Animated.View className="w-2 h-2 bg-gray-400 rounded-full" />
        <Animated.View className="w-2 h-2 bg-gray-400 rounded-full" />
        <Animated.View className="w-2 h-2 bg-gray-400 rounded-full" />
      </View>
      <Text className="text-sm text-gray-600">{displayText}</Text>
    </View>
  );
}
```

**Acceptance Criteria**:
- [ ] Shows when users are typing
- [ ] Handles multiple typers
- [ ] Animated dots
- [ ] Hides when no one typing

---

### 6.7 Add Optimistic Updates

**File**: `app/groups/[id]/chat.tsx` (UPDATE)

```typescript
const toggleLikeMutation = useMutation({
  mutationFn: async (messageId: string) => {
    await messageService.toggleLike(messageId);
  },
  onMutate: async (messageId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['messages', conversationId]);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['messages', conversationId]);
    
    // Optimistically update
    queryClient.setQueryData(['messages', conversationId], (old: any) => {
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          data: page.data.map((msg: Message) =>
            msg.id === messageId
              ? { ...msg, is_liked_by_current_user: !msg.is_liked_by_current_user }
              : msg
          )
        }))
      };
    });
    
    return { previous };
  },
  onError: (err, messageId, context) => {
    // Rollback on error
    queryClient.setQueryData(['messages', conversationId], context.previous);
  },
});
```

**Acceptance Criteria**:
- [ ] Like updates immediately
- [ ] Rolls back on error
- [ ] No flickering
- [ ] Works with pagination

---

## Deliverables

- ✅ Pinned messages bar
- ✅ Enhanced action sheet with role-based actions
- ✅ Message search modal with highlighting
- ✅ Better typing indicators
- ✅ Optimistic updates for likes
- ✅ Jump to message functionality
- ✅ Visual indicators for pinned messages

## Dependencies

- Phase 1 components
- Phase 4 (role-based permissions)
- Existing chat implementation
- Backend API support for pinning (check availability)

## Testing

### Manual Testing
- [ ] Pin/unpin works for LEADER/CO_LEADER
- [ ] Pinned bar shows and scrolls
- [ ] Search finds messages correctly
- [ ] Jump to message scrolls correctly
- [ ] Typing indicators accurate
- [ ] Optimistic updates feel instant

## Notes

- Check if backend supports pinned messages API
- If not, implement client-side only (local storage) as MVP
- Consider message reactions (future enhancement)
- Consider thread replies (future enhancement)
