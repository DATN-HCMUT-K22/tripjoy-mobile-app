# Phase 4: Enhanced Member Management

**Duration**: Week 5
**Status**: Completed
**Completion Date**: 2026-04-20
**Depends On**: Phase 1

## Goal

Create comprehensive member management with role hierarchy, permissions, and visual indicators.

## Tasks

### 4.1 Refactor Members Screen with Role Grouping

**File**: `app/groups/[id]/members.tsx` (MAJOR REFACTOR)

```typescript
const groupedMembers = useMemo(() => {
  const leaders = members.filter(m => m.role === 'LEADER');
  const coLeaders = members.filter(m => m.role === 'CO_LEADER');
  const regularMembers = members.filter(m => m.role === 'MEMBER');
  
  return [
    {
      title: `👑 LEADER (${leaders.length})`,
      subtitle: 'Full control over group',
      data: leaders,
      role: 'LEADER' as const
    },
    {
      title: `🛡️ CO-LEADERS (${coLeaders.length})`,
      subtitle: 'Can manage members and edit group',
      data: coLeaders,
      role: 'CO_LEADER' as const
    },
    {
      title: `👥 MEMBERS (${regularMembers.length})`,
      subtitle: 'Can participate and suggest',
      data: regularMembers,
      role: 'MEMBER' as const
    }
  ].filter(section => section.data.length > 0);
}, [members]);

<SectionList
  sections={groupedMembers}
  renderSectionHeader={({ section }) => (
    <MemberSectionHeader
      title={section.title}
      subtitle={section.subtitle}
      onInfoPress={() => setShowPermissionsInfo(true)}
    />
  )}
  renderItem={({ item: member }) => (
    <MemberCard
      member={member}
      isCurrentUser={member.user.id === currentUser.id}
      onPress={() => handleMemberPress(member)}
    />
  )}
  keyExtractor={(item) => item.id}
/>
```

**Acceptance Criteria**:
- [ ] Members grouped by role
- [ ] Section headers show counts
- [ ] Info icon shows permissions sheet
- [ ] Empty sections hidden

---

### 4.2 Create MemberCard Component

**File**: `components/group/MemberCard.tsx` (NEW)

```typescript
interface MemberCardProps {
  member: GroupMember;
  isCurrentUser: boolean;
  onPress: () => void;
}

export function MemberCard({ member, isCurrentUser, onPress }: MemberCardProps) {
  return (
    <TouchableOpacity
      className="bg-white px-4 py-3 flex-row items-center border-b border-gray-100"
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isCurrentUser}
    >
      <ExpoImage
        source={{ uri: resolveUserAvatarUri(member.user.avatarUrl, member.user.fullName) }}
        style={{ width: 48, height: 48, borderRadius: 24 }}
        contentFit="cover"
      />
      
      <View className="flex-1 ml-3">
        <View className="flex-row items-center gap-2">
          <Text className="font-semibold text-base text-gray-900">
            {member.user.fullName}
          </Text>
          {isCurrentUser && (
            <View className="bg-gray-100 px-2 py-0.5 rounded">
              <Text className="text-xs text-gray-600">You</Text>
            </View>
          )}
        </View>
        <Text className="text-gray-500 text-sm">@{member.user.username}</Text>
        {member.created_at && (
          <Text className="text-gray-400 text-xs mt-0.5">
            Joined {formatRelativeTime(member.created_at)}
          </Text>
        )}
      </View>
      
      <RoleBadge role={member.role} size="sm" />
    </TouchableOpacity>
  );
}
```

**Acceptance Criteria**:
- [ ] Shows avatar, name, username
- [ ] "You" badge for current user
- [ ] Role badge displayed
- [ ] Joined date formatted correctly
- [ ] Can't tap own card

---

### 4.3 Implement Member Action Sheet

**File**: `app/groups/[id]/members.tsx` (UPDATE)

```typescript
function handleMemberPress(member: GroupMember) {
  if (member.user.id === currentUser.id) return;
  
  const actions: Action[] = [
    { icon: 'chatbubble', label: 'Send Direct Message', onPress: () => openDM(member.user.id) },
    { icon: 'person', label: 'View Profile', onPress: () => viewProfile(member.user.id) },
  ];
  
  // Leader-only actions
  if (currentUserRole === 'LEADER') {
    if (member.role === 'MEMBER') {
      actions.push({ 
        icon: 'arrow-up', 
        label: 'Promote to Co-Leader', 
        onPress: () => showPromoteConfirm(member) 
      });
    }
    if (member.role === 'CO_LEADER') {
      actions.push({ 
        icon: 'arrow-down', 
        label: 'Demote to Member', 
        onPress: () => showDemoteConfirm(member) 
      });
      actions.push({ 
        icon: 'swap-horizontal', 
        label: 'Transfer Leadership', 
        onPress: () => showTransferConfirm(member) 
      });
    }
  }
  
  // Leader/Co-Leader can remove
  if (currentUserRole === 'LEADER' || currentUserRole === 'CO_LEADER') {
    actions.push({ 
      icon: 'remove-circle', 
      label: 'Remove from Group', 
      onPress: () => showRemoveConfirm(member), 
      danger: true 
    });
  }
  
  setSelectedMember(member);
  setMemberActions(actions);
  setShowMemberSheet(true);
}
```

**Acceptance Criteria**:
- [ ] Action sheet shows role-appropriate actions
- [ ] Actions work correctly
- [ ] Danger actions styled red
- [ ] Sheet dismisses after action

---

### 4.4 Create Role Permissions Info Sheet

**File**: `components/group/RolePermissionsSheet.tsx` (NEW)

```typescript
interface RolePermissionsSheetProps {
  visible: boolean;
  onClose: () => void;
  currentUserRole: GroupMemberRole;
}

export function RolePermissionsSheet({ visible, onClose, currentUserRole }: RolePermissionsSheetProps) {
  return (
    <AppBottomSheet visible={visible} onClose={onClose} title="Role Permissions">
      <ScrollView className="p-4">
        <RolePermissionSection
          role="LEADER"
          icon="👑"
          color="#F59E0B"
          permissions={[
            'Delete entire group',
            'Transfer leadership',
            'All CO-LEADER permissions'
          ]}
          highlight={currentUserRole === 'LEADER'}
        />
        
        <RolePermissionSection
          role="CO_LEADER"
          icon="🛡️"
          color="#3B82F6"
          permissions={[
            'Add new members',
            'Remove members',
            'Edit group information',
            'Promote/demote members',
            'Pin messages in chat'
          ]}
          highlight={currentUserRole === 'CO_LEADER'}
        />
        
        <RolePermissionSection
          role="MEMBER"
          icon="👥"
          color="#9CA3AF"
          permissions={[
            'View group information',
            'Participate in chat',
            'Suggest locations',
            'Leave group'
          ]}
          highlight={currentUserRole === 'MEMBER'}
        />
        
        {currentUserRole && (
          <View className="mt-4 p-4 bg-blue-50 rounded-lg">
            <Text className="text-blue-800 font-semibold text-center">
              Your current role: {getRoleBadgeConfig(currentUserRole).label}
            </Text>
          </View>
        )}
      </ScrollView>
    </AppBottomSheet>
  );
}
```

**Acceptance Criteria**:
- [ ] Shows all 3 roles with permissions
- [ ] Highlights current user's role
- [ ] Clear permission lists
- [ ] Scrollable if content is long

---

### 4.5 Create Confirmation Dialogs

**File**: `components/group/TransferLeadershipDialog.tsx` (NEW)

```typescript
export function TransferLeadershipDialog({ 
  visible, 
  onConfirm, 
  onCancel, 
  targetMember 
}: Props) {
  return (
    <AppDialogModal visible={visible} onClose={onCancel}>
      <View className="p-6">
        <View className="items-center mb-4">
          <Ionicons name="swap-horizontal" size={48} color="#F59E0B" />
        </View>
        <Text className="text-xl font-bold text-center mb-2">
          Transfer Leadership?
        </Text>
        <Text className="text-gray-600 text-center mb-4">
          You are about to transfer leadership to {targetMember.user.fullName}.
        </Text>
        <View className="bg-amber-50 p-4 rounded-lg mb-4">
          <Text className="text-amber-800 text-sm text-center">
            ⚠️ You will become a CO-LEADER and lose the ability to delete the group or transfer leadership again.
          </Text>
        </View>
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-gray-200 py-3 rounded-lg"
            onPress={onCancel}
          >
            <Text className="text-center font-semibold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-amber-500 py-3 rounded-lg"
            onPress={onConfirm}
          >
            <Text className="text-white text-center font-semibold">Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppDialogModal>
  );
}
```

**File**: `components/group/RemoveMemberDialog.tsx` (NEW)

Similar structure for remove confirmation.

**Acceptance Criteria**:
- [ ] Warning clear and prominent
- [ ] Confirm button styled appropriately
- [ ] Cancel button works
- [ ] Dialog dismisses after action

---

### 4.6 Add Member Search

**File**: `app/groups/[id]/members.tsx` (UPDATE)

**Add search bar above SectionList**:
```typescript
const [memberSearch, setMemberSearch] = useState('');

const filteredMembers = useMemo(() => {
  if (!memberSearch) return members;
  const query = memberSearch.toLowerCase();
  return members.filter(m => 
    m.user.fullName.toLowerCase().includes(query) ||
    m.user.username.toLowerCase().includes(query)
  );
}, [members, memberSearch]);
```

**Acceptance Criteria**:
- [ ] Search filters members
- [ ] Searches name and username
- [ ] Clear button works
- [ ] Empty state when no results

---

## Deliverables

- ✅ Role-based member grouping
- ✅ MemberCard component
- ✅ Member action sheet with role-based actions
- ✅ Role permissions info sheet
- ✅ Transfer leadership dialog
- ✅ Remove member dialog
- ✅ Member search
- ✅ FAB for adding members (existing functionality)

## Dependencies

- Phase 1 components (RoleBadge, AppBottomSheet)
- Existing hooks (useGroupMembers, useUpdateGroupMemberRole, etc.)

## Testing

### Manual Testing
- [ ] All role-based actions work correctly
- [ ] Confirmations prevent accidental actions
- [ ] Search works smoothly
- [ ] Permission info sheet is clear
- [ ] Visual hierarchy clear (LEADER > CO_LEADER > MEMBER)

## Notes

- Respect role permissions strictly
- Test all edge cases (removing last CO_LEADER, etc.)
- Consider adding bulk actions (future enhancement)
