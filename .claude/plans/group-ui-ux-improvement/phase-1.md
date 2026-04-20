# Phase 1: Foundation Components & Design System

**Duration**: Week 1-2
**Status**: Completed
**Completion Date**: 2026-04-20

## Goal

Establish reusable components and design system for consistent role-based UI across the module.

## Tasks

### 1.1 Create RoleBadge Component

**File**: `components/ui/RoleBadge.tsx` (NEW)

```typescript
interface RoleBadgeProps {
  role: 'LEADER' | 'CO_LEADER' | 'MEMBER';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
}
```

**Implementation**:
- Three color variants:
  - LEADER: `bg-amber-500` (#F59E0B) with 👑 icon
  - CO_LEADER: `bg-blue-500` (#3B82F6) with 🛡️ icon
  - MEMBER: `bg-gray-400` (#9CA3AF) with 👥 icon
- Size variants: sm (px-2 py-0.5 text-xs), md (px-3 py-1 text-sm), lg (px-4 py-1.5 text-base)
- Optional icon and label display

**Acceptance Criteria**:
- [ ] Component renders all 3 role types correctly
- [ ] Size prop changes dimensions appropriately
- [ ] Icon and label toggles work
- [ ] Accessible with proper semantic markup

---

### 1.2 Create AvatarStack Component

**File**: `components/ui/AvatarStack.tsx` (NEW)

```typescript
interface AvatarStackProps {
  users: Array<{ id: string; avatarUrl?: string; fullName: string }>;
  max?: number;        // Default 5
  size?: number;       // Default 32
  overlap?: number;    // Default -8 (negative margin)
}
```

**Implementation**:
- Display first `max` avatars with overlap effect
- Show "+N" badge for remaining users
- Use expo-image for caching
- White 2px border around each avatar
- Handle missing avatars gracefully

**Acceptance Criteria**:
- [ ] Shows correct number of avatars based on max prop
- [ ] Overlapping effect works correctly
- [ ] "+N" badge displays when users > max
- [ ] Images load efficiently with caching

---

### 1.3 Create SwipeableGroupCard Component

**File**: `components/group/SwipeableGroupCard.tsx` (NEW)

```typescript
import { Swipeable } from 'react-native-gesture-handler';

interface SwipeableGroupCardProps {
  group: Group;
  conversation?: ConversationResponse | null;
  onSwipeAction: (action: 'chat' | 'info' | 'leave') => void;
  isPinned?: boolean;
}
```

**Implementation**:
- Left swipe reveals actions: [💬 Chat] [ℹ️ Info] [🚪 Leave]
- Action colors: Chat (blue-500), Info (gray-500), Leave (red-500)
- Haptic feedback on swipe threshold
- Integrate existing GroupCard/GroupListItem as children
- Smooth spring animation

**Acceptance Criteria**:
- [ ] Swipe gesture feels smooth on physical device
- [ ] Actions render correctly with icons and colors
- [ ] Haptic feedback triggers at threshold
- [ ] Works with both GroupCard and GroupListItem
- [ ] Proper cleanup on unmount

---

### 1.4 Create AppBottomSheet Wrapper

**File**: `components/common/AppBottomSheet.tsx` (NEW)

```typescript
import BottomSheet from '@gorhom/bottom-sheet';

interface AppBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  snapPoints?: string[];  // Default ['25%', '50%', '90%']
  children: React.ReactNode;
  title?: string;
}
```

**Implementation**:
- Consistent backdrop styling with rgba(0,0,0,0.5)
- Pan-down gesture to close
- Header with title and close button
- Reusable across all bottom sheet needs
- Animate in/out smoothly

**Acceptance Criteria**:
- [ ] Opens and closes smoothly
- [ ] Backdrop dismisses sheet when tapped
- [ ] Pan-down gesture works
- [ ] Title displays when provided
- [ ] Proper keyboard handling

---

### 1.5 Create Role Utility Functions

**File**: `utils/roleUtils.ts` (NEW)

```typescript
export const rolePermissions = {
  LEADER: {
    canDelete: true,
    canTransfer: true,
    canEditGroup: true,
    canManageMembers: true,
    canPromoteDemote: true,
    canPinMessages: true,
  },
  CO_LEADER: {
    canDelete: false,
    canTransfer: false,
    canEditGroup: true,
    canManageMembers: true,
    canPromoteDemote: true,
    canPinMessages: true,
  },
  MEMBER: {
    canDelete: false,
    canTransfer: false,
    canEditGroup: false,
    canManageMembers: false,
    canPromoteDemote: false,
    canPinMessages: false,
  },
};

export function hasPermission(role: GroupMemberRole, permission: keyof typeof rolePermissions.LEADER): boolean;
export function getRoleBadgeConfig(role: GroupMemberRole): { bg: string; text: string; icon: string; label: string };
export function sortMembersByRole(members: GroupMember[]): GroupMember[];
```

**Acceptance Criteria**:
- [ ] Permission checking works for all roles
- [ ] Badge config returns correct values
- [ ] Member sorting prioritizes LEADER > CO_LEADER > MEMBER
- [ ] Unit tests cover all functions

---

### 1.6 Enhance Type Definitions

**File**: `types/group.ts` (UPDATE)

**Add**:
```typescript
export interface Group {
  // ... existing fields
  isPinned?: boolean;           // Client-side state for pinned groups
  unreadCount?: number;         // From conversation
  currentUserRole?: GroupMemberRole;  // Derived from members array
}

export interface GroupMember {
  // ... existing fields
  addedBy?: string;            // Username who added this member
  joinedAt?: string;           // ISO timestamp
  lastActive?: string;         // ISO timestamp
}
```

**Acceptance Criteria**:
- [ ] Types compile without errors
- [ ] Optional fields don't break existing code
- [ ] IDE autocomplete works for new fields

---

## Deliverables

- ✅ RoleBadge component with 3 variants
- ✅ AvatarStack component
- ✅ SwipeableGroupCard component
- ✅ AppBottomSheet wrapper
- ✅ Role utility functions
- ✅ Enhanced type definitions
- ✅ Unit tests for roleUtils

## Dependencies

- `react-native-gesture-handler` (already installed)
- `@gorhom/bottom-sheet` (already installed)
- `expo-haptics` (check if installed)

## Testing

### Unit Tests
- `roleUtils.test.ts`:
  - hasPermission for all roles and permissions
  - getRoleBadgeConfig returns correct values
  - sortMembersByRole orders correctly

### Component Tests
- RoleBadge renders all variants
- AvatarStack handles edge cases (0 users, 1 user, max users)
- SwipeableGroupCard gesture handling

### Manual Testing
- [ ] Test RoleBadge in isolation (create preview screen)
- [ ] Test AvatarStack with varying user counts
- [ ] Test SwipeableGroupCard on physical device for gesture feel
- [ ] Test AppBottomSheet on different screen sizes

## Notes

- Follow existing component patterns in the codebase
- Use TailwindCSS (NativeWind) for styling
- Ensure components work on both iOS and Android
- Add TypeScript strict mode compliance
- Document props with JSDoc comments
