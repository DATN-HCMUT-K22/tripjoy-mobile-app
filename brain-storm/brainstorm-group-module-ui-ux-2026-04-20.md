# Group Module UI/UX Improvement Brainstorm

**Date:** 2026-04-20  
**Project:** TripJoy API - Group Module Frontend  
**Tech Stack:** React Native + NativeWind (Tailwind)  
**Target:** Mobile-first design  

---

## 📋 Executive Summary

Comprehensive UI/UX redesign for 5 core group module screens addressing navigation complexity, unclear role permissions, and poor mobile experience. Focus on mobile-first principles, gesture-driven interactions, and clear visual hierarchy for role-based access control.

---

## 🎯 Objectives

### Screens to Improve
1. **Group List/Discovery** - Main entry point for all groups
2. **Group Detail/Overview** - Central hub for group information
3. **Group Chat Interface** - Real-time messaging and interactions
4. **Member Management** - Role assignment and member actions
5. **Group Creation Flow** - Streamlined group setup wizard

### Pain Points Addressed
- ✅ **Hard to navigate** - simplified navigation structure with bottom tabs
- ✅ **Unclear roles/permissions** - visual role badges and permission tooltips
- ✅ **Poor mobile UX** - gesture-driven, thumb-friendly, bottom sheets

### Design Goals
- **Mobile-optimized** - touch-friendly, thumb-zone actions, native feel
- **Role clarity** - color-coded badges, contextual actions, permission info
- **Gesture-driven** - swipe, long-press, pull-to-refresh patterns
- **Progressive disclosure** - hide complexity until needed

---

## 🏗️ Architecture Overview

### Backend (Already Implemented ✅)
- Spring Boot REST API
- Role-based access control (LEADER, CO_LEADER, MEMBER)
- Event-driven architecture for group/chat sync
- Complete CRUD operations
- Chat integration with conversations and messages

### Frontend Stack
- **Framework:** React Native
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Navigation:** React Navigation v6+
- **Gestures:** react-native-gesture-handler
- **Sheets:** @gorhom/bottom-sheet
- **Animations:** react-native-reanimated

### API Endpoints Available
```
Groups:
- GET    /api/v1/groups                 (list my groups)
- POST   /api/v1/groups                 (create group)
- GET    /api/v1/groups/{id}            (group detail)
- PUT    /api/v1/groups/{id}            (update group)
- DELETE /api/v1/groups/{id}            (delete group)
- GET    /api/v1/groups/search?q=       (search groups)

Members:
- GET    /api/v1/groups/{id}/members           (list members)
- POST   /api/v1/groups/{id}/members           (add member)
- PUT    /api/v1/groups/{id}/members/{mid}     (update role)
- DELETE /api/v1/groups/{id}/members/{mid}     (remove member)
- DELETE /api/v1/groups/{id}/members/me        (leave group)
- POST   /api/v1/groups/{id}/transfer-leadership

Chat:
- GET    /api/v1/conversations                       (inbox)
- POST   /api/v1/conversations                       (create direct chat)
- PUT    /api/v1/conversations/{id}                  (update/pin conversation)
- GET    /api/v1/conversations/{id}/messages         (message history)
- POST   /api/v1/conversations/{id}/messages         (send message)
- GET    /api/v1/conversations/{id}/pinned-messages
- POST   /api/v1/messages/{id}/likes                 (like message)
- DELETE /api/v1/messages/{id}/likes                 (unlike message)
- POST   /api/v1/messages/{id}/pin                   (pin message)
- DELETE /api/v1/messages/{id}/pin                   (unpin message)
```

---

## 🎨 Design System

### Color Palette - Role-Based

```javascript
// Role Colors (NativeWind classes)
const roleColors = {
  LEADER: {
    bg: 'bg-amber-500',      // Gold/Orange
    text: 'text-amber-500',
    badge: '#F59E0B'
  },
  CO_LEADER: {
    bg: 'bg-blue-500',       // Blue
    text: 'text-blue-500',
    badge: '#3B82F6'
  },
  MEMBER: {
    bg: 'bg-gray-400',       // Gray
    text: 'text-gray-400',
    badge: '#9CA3AF'
  }
}
```

### Component Library

```javascript
// Core Components
<RoleBadge role="LEADER" size="sm|md|lg" />
<MemberCard user={user} role={role} onPress={handlePress} />
<GroupCard group={group} onSwipeLeft={actions} />
<PermissionSheet role={currentRole} visible={show} />
<AvatarStack users={members} max={5} />
<SwipeableRow leftActions={[]} rightActions={[]} />
<BottomSheet snapPoints={['25%', '50%', '90%']} />
```

### Touch Targets
- **Minimum:** 44x44 dp (iOS HIG / Material Design)
- **Primary actions:** Bottom 1/3 of screen (thumb zone)
- **Swipe threshold:** 80dp horizontal movement
- **Long-press duration:** 500ms

---

## 📱 Screen Designs

## 1️⃣ Group List/Discovery

### Layout
```
┌─────────────────────────────────┐
│ Groups              🔍  [+]     │ Header (fixed)
├─────────────────────────────────┤
│ 🔍 Search groups...             │ Sticky search
├─────────────────────────────────┤
│ 📌 PINNED                       │ Section header
│ ┌─────────────────────────────┐ │
│ │ 🏔️ Da Nang Avengers         │ │ Swipeable card
│ │ 5 members • 3 unread        │ │
│ │ 👤👤👤👤👤 [👑 LEADER]       │ │ Avatar stack + role
│ └─────────────────────────────┘ │
│ < swipe left for actions >      │ Hint (first time)
│                                 │
│ 📚 MY GROUPS (8)                │
│ ┌─────────────────────────────┐ │
│ │ 🏖️ Phu Quoc Trip            │ │
│ │ 8 members • Active          │ │
│ │ 👤👤👤👤... [🛡️ CO-LEADER]   │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 🌊 Nha Trang Beach          │ │
│ │ 3 members • Last: 2d ago    │ │
│ │ 👤👤👤 [👥 MEMBER]           │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
            [+] FAB
```

### Interactions

**Swipe Left Actions:**
```
[💬 Chat] [ℹ️ Info] [🚪 Leave]
```

**Long Press Card:**
- Pin to top
- Mute notifications
- Leave group
- Delete (if LEADER)

**Card States:**
- Default: White bg
- Unread messages: Blue accent border
- Pinned: Yellow pin icon
- Archived: Gray text

**Search:**
- Debounced (300ms)
- API: `GET /api/v1/groups/search?q=keyword`
- Results replace list (with cancel button)

### Components
```jsx
<FlatList
  data={groups}
  renderItem={({ item }) => (
    <SwipeableGroupCard
      group={item}
      onPress={() => navigate('GroupDetail', { id: item.id })}
      onSwipeLeft={(action) => handleAction(action, item)}
      isPinned={item.isPinned}
      unreadCount={item.unreadCount}
    />
  )}
  sections={[
    { title: 'PINNED', data: pinnedGroups },
    { title: 'MY GROUPS', data: otherGroups }
  ]}
  refreshControl={<RefreshControl onRefresh={refetch} />}
/>
```

---

## 2️⃣ Group Detail/Overview

### Layout - Tabbed Interface
```
┌─────────────────────────────────┐
│ ← Da Nang Avengers         ⋮    │ Header (fixed)
│ 🏔️ [Avatar]                     │ Parallax scroll
│ "Planning our summer trip..."   │
│ 🔒 Private • 5 members          │
│ [👑 LEADER] You                 │ Current user role
├─────────────────────────────────┤
│ [Overview][Members][Chat]       │ Sticky tabs
├─────────────────────────────────┤
│ QUICK ACCESS                    │ ScrollView content
│ ┌───────────────────────────┐   │
│ │ 💬 General Chat           │   │
│ │ "See you tomorrow!" • 5m  │   │ Last message preview
│ └───────────────────────────┘   │
│ ┌───────────────────────────┐   │
│ │ 📍 Location Suggestions   │   │
│ │ 5 places suggested        │   │
│ │               View all → │   │
│ └───────────────────────────┘   │
│ ┌───────────────────────────┐   │
│ │ 🗓️ Trip Itineraries       │   │
│ │ 2 active trips            │   │
│ │               View all → │   │
│ └───────────────────────────┘   │
│                                 │
│ GROUP INFO                      │
│ • Created: 2 weeks ago          │
│ • Created by: @johndoe          │
│ • Theme: #FF5733                │
│ • Pro: ✓ • Chatbots: 2          │
└─────────────────────────────────┘
```

### Header Menu (⋮ button)
```
┌─────────────────────────────────┐
│ Group Actions                   │
├─────────────────────────────────┤
│ ✏️ Edit Group Info              │ LEADER/CO_LEADER
│ 👥 Manage Members               │ LEADER/CO_LEADER
│ 🔔 Notification Settings        │ All
│ 📌 Pin Group                    │ All
│ 📤 Share Group                  │ All
│ ───────────────────────────────│
│ 🚪 Leave Group                  │ All
│ 🗑️ Delete Group                 │ LEADER only
│ ❌ Cancel                        │
└─────────────────────────────────┘
```

### Members Tab
```
┌─────────────────────────────────┐
│ 🔍 Search members...            │
├─────────────────────────────────┤
│ 👑 LEADER (1)                   │
│ Can: Everything                 │ Collapsible info
│ ┌─────────────────────────────┐ │
│ │ 👤 John Doe          [You]  │ │
│ │ @johndoe • Founder          │ │
│ │ Added 1 month ago           │ │
│ └─────────────────────────────┘ │
│                                 │
│ 🛡️ CO-LEADERS (2)               │
│ Can: Add/Remove, Edit Group     │
│ ┌─────────────────────────────┐ │
│ │ 👤 Jane Smith               │ │
│ │ @janesmith • Active         │ │
│ │ Added by John • 2w ago      │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 👤 Bob Wilson               │ │
│ │ @bobwilson • Online         │ │
│ │ Added by John • 1w ago      │ │
│ └─────────────────────────────┘ │
│                                 │
│ 👥 MEMBERS (2)                  │
│ Can: View, Suggest Locations    │
│ ...                             │
└─────────────────────────────────┘
         [+ Add Member] FAB
```

### Member Action Sheet (tap member)
```
┌─────────────────────────────────┐
│ Jane Smith                      │
│ @janesmith • CO-LEADER          │
│ Member since: 2 weeks ago       │
├─────────────────────────────────┤
│ 💬 Send Direct Message          │
│ 👁️ View Profile                 │
├─────────────────────────────────┤
│ ⬆️ Promote to Leader            │ LEADER only
│ ⬇️ Demote to Member             │ LEADER only
│ 🔄 Transfer Leadership          │ LEADER only
│ 🚫 Remove from Group            │ LEADER/CO-LEADER
├─────────────────────────────────┤
│ ❌ Cancel                        │
└─────────────────────────────────┘
```

### Role Permission Info (ℹ️ icon)
```
┌─────────────────────────────────┐
│ Role Permissions                │
├─────────────────────────────────┤
│ 👑 LEADER                       │
│ • Delete entire group           │
│ • Transfer leadership           │
│ • All CO-LEADER permissions     │
│                                 │
│ 🛡️ CO-LEADER                    │
│ • Add new members               │
│ • Remove members                │
│ • Edit group information        │
│ • Promote/demote members        │
│ • Pin messages in chat          │
│                                 │
│ 👥 MEMBER                       │
│ • View group information        │
│ • Participate in chat           │
│ • Suggest locations             │
│ • Leave group                   │
│                                 │
│ Your current role: LEADER       │
└─────────────────────────────────┘
```

### Chat Tab
- Embedded conversation view
- Jump to full chat: `navigate('Chat', { conversationId })`
- Show last 20 messages
- "View full chat" button at top

---

## 3️⃣ Group Chat Interface

### Layout
```
┌─────────────────────────────────┐
│ ← Da Nang Avengers    🔍  ⋮     │ Header
│   5 members • 3 online          │ Subtitle
├─────────────────────────────────┤
│ 📌 3 Pinned Messages  ▼         │ Collapsible
├─────────────────────────────────┤
│                                 │
│ ┌──────────────────┐            │ Them (left)
│ │ 👤 Jane          │            │
│ │ Hey everyone!    │            │
│ │ 10:30 AM  ❤️ 3  │            │
│ └──────────────────┘            │
│                                 │
│            ┌──────────────────┐ │ You (right)
│            │ Let's meet up!   │ │
│            │ 10:32 AM  ✓✓     │ │
│            └──────────────────┘ │
│                                 │
│ ┌──────────────────┐            │ Reply indicator
│ │ ↩️ Jane replied   │            │
│ │ 👤 Bob            │            │
│ │ Sounds good!     │            │
│ │ 10:33 AM         │            │
│ └──────────────────┘            │
│                                 │
│ ┌──────────────────┐            │ Image message
│ │ 👤 Alice          │            │
│ │ [📷 Image]       │            │
│ │ Check this out!  │            │
│ │ 10:35 AM  ❤️ 5  │            │
│ └──────────────────┘            │
└─────────────────────────────────┘
[📎] [Type a message...  ] [🎤]
```

### Message Interactions

**Long Press Message → Action Sheet:**
```
┌─────────────────────────────────┐
│ Message Actions                 │
├─────────────────────────────────┤
│ ↩️ Reply                         │
│ ❤️ Like/Unlike                   │
│ 📌 Pin Message                   │ LEADER/CO_LEADER
│ 📋 Copy Text                     │
│ 🔗 Share                         │
│ 🗑️ Delete                        │ Own message or LEADER
│ ❌ Cancel                        │
└─────────────────────────────────┘
```

**Swipe Right on Message:**
- Quick reply (shows reply bar at bottom)

**Tap Pinned Banner:**
```
┌─────────────────────────────────┐
│ Pinned Messages (3)             │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 📌 "Meeting at 5pm"         │ │
│ │ By: Jane • 2d ago           │ │
│ │ [Jump to message]           │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 📌 "Hotel address..."       │ │
│ │ By: Bob • 1w ago            │ │
│ │ [Jump to message]           │ │
│ └─────────────────────────────┘ │
│ ...                             │
└─────────────────────────────────┘
```

**Search (🔍 icon):**
```
┌─────────────────────────────────┐
│ ← Search in Da Nang Avengers    │
├─────────────────────────────────┤
│ 🔍 [Search messages...]         │
├─────────────────────────────────┤
│ RESULTS (12)                    │
│ ┌─────────────────────────────┐ │
│ │ Jane: "...hotel booking..." │ │
│ │ 2 days ago                  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Bob: "...flight details..." │ │
│ │ 1 week ago                  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
Tap result → Jump to message in context
```

### Message Types

**TEXT:**
```
Standard bubble with text content
```

**IMAGE:**
```
┌──────────────────┐
│ 👤 Jane          │
│ [Image Preview]  │ Tap to open lightbox
│ "Check this!"    │ Optional caption
│ 10:30 AM  ❤️ 3  │
└──────────────────┘
```

**SHARE_POST:**
```
┌──────────────────┐
│ 👤 Bob           │
│ ┌──────────────┐ │
│ │ 📄 Post      │ │ Rich preview card
│ │ "Trip tips"  │ │
│ │ by @alice    │ │
│ └──────────────┘ │
│ 10:35 AM         │
└──────────────────┘
Tap card → Open post detail
```

**REPLY:**
```
┌──────────────────┐
│ 👤 Alice         │
│ ↩️ Jane: "Hey"   │ Parent message preview
│ "Hi there!"      │ Reply content
│ 10:40 AM         │
└──────────────────┘
```

### Input Bar

**Default State:**
```
[📎] [Type a message...            ] [🎤]
```

**Typing State:**
```
[📎] [Message text here             ] [➤]
                                    Send btn
```

**Reply Mode:**
```
┌─────────────────────────────────┐
│ ↩️ Replying to Jane: "Hey..."  ✕│
├─────────────────────────────────┤
│ [📎] [Type reply...            ] [➤]│
└─────────────────────────────────┘
```

**Attachment Options (📎 button):**
```
┌─────────────────────────────────┐
│ Send Attachment                 │
├─────────────────────────────────┤
│ 📷 Camera                        │
│ 🖼️ Gallery                       │
│ 📄 Share Post                    │
│ 📍 Location                      │
│ ❌ Cancel                        │
└─────────────────────────────────┘
```

### Components
```jsx
<FlatList
  inverted
  data={messages}
  renderItem={({ item }) => (
    <MessageBubble
      message={item}
      isOwn={item.sender_id === currentUserId}
      onLongPress={() => showActionSheet(item)}
      onSwipeRight={() => startReply(item)}
    />
  )}
  onEndReached={loadOlderMessages}
/>

<InputBar
  value={text}
  replyTo={replyingMessage}
  onSend={handleSend}
  onAttachment={showAttachmentSheet}
/>
```

---

## 4️⃣ Member Management

### Layout
```
┌─────────────────────────────────┐
│ ← Members (5)          [+ Add]  │
├─────────────────────────────────┤
│ 🔍 Search members...            │
├─────────────────────────────────┤
│ ℹ️ Role Permissions             │ Tap for info sheet
├─────────────────────────────────┤
│ 👑 LEADER (1)                   │ Collapsible
│ Can: Everything               ▼│
│ ┌─────────────────────────────┐ │
│ │ 👤 John Doe                 │ │
│ │    @johndoe          [You]  │ │
│ │    Added 1 month ago        │ │
│ │    Founder                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ 🛡️ CO-LEADERS (2)               │
│ Can: Add/Remove, Edit Group   ▼│
│ ┌─────────────────────────────┐ │
│ │ 👤 Jane Smith               │ │
│ │    @janesmith      ⚡Online │ │
│ │    Added by John • 2w ago   │ │
│ │    [Tap for options]        │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 👤 Bob Wilson               │ │
│ │    @bobwilson               │ │
│ │    Added by Jane • 1w ago   │ │
│ │    [Tap for options]        │ │
│ └─────────────────────────────┘ │
│                                 │
│ 👥 MEMBERS (2)                  │
│ Can: View, Suggest            ▼│
│ ┌─────────────────────────────┐ │
│ │ 👤 Alice Cooper             │ │
│ │    @alice                   │ │
│ │    Added by Bob • 3d ago    │ │
│ │    [Tap for options]        │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 👤 Charlie Brown            │ │
│ │    @charlie                 │ │
│ │    Added by John • 1d ago   │ │
│ │    [Tap for options]        │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Add Member Flow

**Step 1: Tap [+ Add] → Search Users**
```
┌─────────────────────────────────┐
│ ← Add Member                    │
├─────────────────────────────────┤
│ 🔍 Search users...              │
├─────────────────────────────────┤
│ RESULTS (debounced 300ms)       │
│ ┌─────────────────────────────┐ │
│ │ 👤 David Lee                │ │
│ │    @davidlee                │ │
│ │    Mutual: 3 groups         │ │
│ │                     [Select]│ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 👤 Emma Watson              │ │
│ │    @emmaw                   │ │
│ │    Not in any groups        │ │
│ │                     [Select]│ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Step 2: Select User → Choose Role**
```
┌─────────────────────────────────┐
│ ← Add David Lee                 │
├─────────────────────────────────┤
│ 👤 @davidlee                    │
│                                 │
│ SELECT ROLE                     │
│ ┌─────────────────────────────┐ │
│ │ ● 👥 MEMBER (Recommended)   │ │ Default
│ │   Can view and participate  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ○ 🛡️ CO-LEADER               │ │
│ │   Can manage members & edit │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ○ 👑 LEADER                  │ │ Disabled
│ │   Transfer your leadership  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ℹ️ You can change role later    │
│                                 │
│ [Cancel]      [Add Member ✓]   │
└─────────────────────────────────┘
```

**Step 3: Success**
```
Toast: "David Lee added as MEMBER ✓"
→ Return to member list with new member
```

### Member Actions (tap member card)

**If you're LEADER viewing CO-LEADER:**
```
┌─────────────────────────────────┐
│ Jane Smith                      │
│ @janesmith • CO-LEADER          │
│ Member since: 2 weeks ago       │
│ Added by: John (you)            │
├─────────────────────────────────┤
│ 💬 Send Direct Message          │
│ 👁️ View Profile                 │
├─────────────────────────────────┤
│ 🔄 Transfer Leadership          │
│    Make Jane the new leader     │
│                                 │
│ ⬇️ Demote to Member             │
│    Remove management rights     │
│                                 │
│ 🚫 Remove from Group            │
│    Kick Jane from group         │
├─────────────────────────────────┤
│ ❌ Cancel                        │
└─────────────────────────────────┘
```

**If you're CO-LEADER viewing MEMBER:**
```
┌─────────────────────────────────┐
│ Charlie Brown                   │
│ @charlie • MEMBER               │
│ Member since: 1 day ago         │
│ Added by: John                  │
├─────────────────────────────────┤
│ 💬 Send Direct Message          │
│ 👁️ View Profile                 │
├─────────────────────────────────┤
│ ⬆️ Promote to CO-LEADER         │ If LEADER allows
│    Give management rights       │
│                                 │
│ 🚫 Remove from Group            │
│    Kick Charlie from group      │
├─────────────────────────────────┤
│ ❌ Cancel                        │
└─────────────────────────────────┘
```

**If you're MEMBER viewing others:**
```
┌─────────────────────────────────┐
│ Bob Wilson                      │
│ @bobwilson • CO-LEADER          │
│ Member since: 1 week ago        │
├─────────────────────────────────┤
│ 💬 Send Direct Message          │
│ 👁️ View Profile                 │
├─────────────────────────────────┤
│ ❌ Cancel                        │
└─────────────────────────────────┘
No management options
```

### Remove Member Confirmation
```
┌─────────────────────────────────┐
│ ⚠️ Remove Member                 │
├─────────────────────────────────┤
│ Are you sure you want to        │
│ remove Jane Smith from this     │
│ group?                          │
│                                 │
│ This will:                      │
│ • Remove from group             │
│ • Kick from all group chats     │
│ • Remove access to itineraries  │
│                                 │
│ This action cannot be undone.   │
│                                 │
│ [Cancel]    [Remove Member]     │
│             (Red/Danger)        │
└─────────────────────────────────┘
```

### Transfer Leadership Confirmation
```
┌─────────────────────────────────┐
│ 🔄 Transfer Leadership           │
├─────────────────────────────────┤
│ Transfer leadership to          │
│ Jane Smith?                     │
│                                 │
│ After transfer:                 │
│ • Jane becomes LEADER           │
│ • You become CO-LEADER          │
│ • Only Jane can delete group    │
│                                 │
│ ⚠️ You cannot undo this action  │
│                                 │
│ [Cancel]    [Transfer]          │
│             (Warning color)     │
└─────────────────────────────────┘
```

---

## 5️⃣ Group Creation Flow

### Multi-Step Wizard

**Step 1: Basic Info**
```
┌─────────────────────────────────┐
│ ← Create Group        (1/4)     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ Progress: 25%
├─────────────────────────────────┤
│ BASIC INFORMATION               │
│                                 │
│ 📸 [Upload Group Avatar]        │ Optional
│    Tap to choose photo          │
│                                 │
│ Group Name *                    │
│ ┌─────────────────────────────┐ │
│ │ Da Nang Avengers            │ │
│ └─────────────────────────────┘ │
│ Character count: 16/50          │
│                                 │
│ Description                     │
│ ┌─────────────────────────────┐ │
│ │ Planning our summer trip... │ │
│ │                             │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│ 0/200 characters                │
│                                 │
│ * Required field                │
│                                 │
│         [Next Step →]           │
└─────────────────────────────────┘
```

**Step 2: Customization**
```
┌─────────────────────────────────┐
│ ← Create Group        (2/4)     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ Progress: 50%
├─────────────────────────────────┤
│ CUSTOMIZE YOUR GROUP            │
│                                 │
│ Theme Color                     │
│ ┌─────────────────────────────┐ │
│ │ ○ 🔵 Blue                   │ │
│ │ ○ 🔴 Red                    │ │
│ │ ● 🟠 Orange (Selected)      │ │
│ │ ○ 🟢 Green                  │ │
│ │ ○ 🟣 Purple                 │ │
│ └─────────────────────────────┘ │
│                                 │
│ Group Type                      │
│ ┌─────────────────────────────┐ │
│ │ ● 🆓 Free Group             │ │
│ │   Basic features            │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ○ 💎 Pro Group              │ │
│ │   AI chatbots, analytics    │ │
│ │   ℹ️ Upgrade anytime         │ │
│ └─────────────────────────────┘ │
│                                 │
│ [← Back]      [Next Step →]    │
└─────────────────────────────────┘
```

**Step 3: Add Members**
```
┌─────────────────────────────────┐
│ ← Create Group        (3/4)     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ Progress: 75%
├─────────────────────────────────┤
│ ADD MEMBERS (Optional)          │
│                                 │
│ 🔍 Search users...              │
│                                 │
│ SELECTED (3)                    │
│ ┌─────────────────────────────┐ │
│ │ 👤 Jane Smith         ✓     │ │
│ │    @janesmith               │ │
│ │    Role: [CO-LEADER ▼]      │ │
│ │    [Remove]                 │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 👤 Bob Wilson         ✓     │ │
│ │    @bobwilson               │ │
│ │    Role: [MEMBER ▼]         │ │
│ │    [Remove]                 │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 👤 Alice Cooper       ✓     │ │
│ │    @alice                   │ │
│ │    Role: [MEMBER ▼]         │ │
│ │    [Remove]                 │ │
│ └─────────────────────────────┘ │
│                                 │
│ ℹ️ You can add members later    │
│                                 │
│ [← Back]  [Skip]  [Next Step →]│
└─────────────────────────────────┘
```

**Step 4: Review & Create**
```
┌─────────────────────────────────┐
│ ← Create Group        (4/4)     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ Progress: 100%
├─────────────────────────────────┤
│ REVIEW & CONFIRM                │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🏔️ [Avatar Preview]         │ │
│ │                             │ │
│ │ Da Nang Avengers            │ │
│ │ "Planning summer trip..."   │ │
│ │                             │ │
│ │ • Theme: 🟠 Orange          │ │
│ │ • Type: Free Group          │ │
│ │ • Members: You + 3 others   │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ ✓ General chat channel will be │
│   created automatically         │
│                                 │
│ ✓ You will be the group leader │
│                                 │
│ ✓ Members will receive          │
│   invitation notification       │
│                                 │
│ [← Back]    [Create Group ✓]   │
│             (Primary action)    │
└─────────────────────────────────┘
```

**Success Screen**
```
┌─────────────────────────────────┐
│                                 │
│        ✓                        │
│     Success!                    │
│                                 │
│ Your group "Da Nang Avengers"   │
│ has been created!               │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 💬 Start Chatting           │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 👥 View Group               │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ← Back to Groups            │ │
│ └─────────────────────────────┘ │
│                                 │
│ (Auto-navigate in 3s)           │
└─────────────────────────────────┘
```

### Validation Rules

```javascript
// Step 1: Basic Info
const validation = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 50,
    error: 'Group name must be 3-50 characters'
  },
  description: {
    maxLength: 200,
    error: 'Description max 200 characters'
  },
  avatar: {
    optional: true,
    maxSize: 5 * 1024 * 1024, // 5MB
    types: ['image/jpeg', 'image/png']
  }
}

// Step 2: Customization
const themes = [
  { color: '#3B82F6', name: 'Blue', emoji: '🔵' },
  { color: '#EF4444', name: 'Red', emoji: '🔴' },
  { color: '#F59E0B', name: 'Orange', emoji: '🟠' },
  { color: '#10B981', name: 'Green', emoji: '🟢' },
  { color: '#8B5CF6', name: 'Purple', emoji: '🟣' }
]

// Step 3: Add Members
const memberValidation = {
  maxMembers: 50, // Per group
  roles: ['LEADER', 'CO_LEADER', 'MEMBER'],
  defaultRole: 'MEMBER'
}
```

---

## 📐 Navigation Structure

### Bottom Tab Navigator (Root Level)
```
┌────────┬────────┬────────┬────────┐
│ Groups │  Chat  │ Trips  │Profile │
│   🏔️   │   💬   │   🗺️   │   👤   │
└────────┴────────┴────────┴────────┘
```

### Groups Tab Stack
```
GroupListScreen (root)
  ├─→ GroupDetailScreen
  │    ├─→ MemberManagementScreen
  │    ├─→ EditGroupScreen
  │    └─→ GroupChatScreen
  │         └─→ PinnedMessagesScreen
  │         └─→ SearchMessagesScreen
  │
  └─→ CreateGroupScreen (wizard)
       ├─→ Step1BasicInfo
       ├─→ Step2Customization
       ├─→ Step3AddMembers
       └─→ Step4Review
```

### Navigation Props
```typescript
type GroupsStackParamList = {
  GroupList: undefined;
  GroupDetail: { groupId: string };
  MemberManagement: { groupId: string };
  EditGroup: { groupId: string };
  GroupChat: { conversationId: string; groupId: string };
  CreateGroup: undefined;
  PinnedMessages: { conversationId: string };
  SearchMessages: { conversationId: string };
};
```

---

## 🔧 Technical Implementation

### State Management

**Global State (Redux/Zustand):**
```javascript
// stores/groupStore.js
const useGroupStore = create((set) => ({
  groups: [],
  currentGroup: null,
  members: [],
  
  // Actions
  fetchGroups: async () => {
    const data = await api.get('/api/v1/groups')
    set({ groups: data })
  },
  
  setCurrentGroup: (group) => set({ currentGroup: group }),
  
  addMember: async (groupId, memberId, role) => {
    await api.post(`/api/v1/groups/${groupId}/members`, {
      member_id: memberId,
      role
    })
    // Refresh members list
  },
  
  updateMemberRole: async (groupId, memberId, role) => {
    await api.put(`/api/v1/groups/${groupId}/members/${memberId}`, {
      role
    })
  }
}))
```

**Local State (React hooks):**
```javascript
// screens/GroupDetailScreen.jsx
const GroupDetailScreen = ({ route }) => {
  const { groupId } = route.params
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const { currentGroup, setCurrentGroup } = useGroupStore()
  
  useEffect(() => {
    fetchGroupDetail(groupId)
  }, [groupId])
  
  // ...
}
```

### API Integration

**API Client (Axios with interceptors):**
```javascript
// api/client.js
import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'https://api.tripjoy.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response.data.data, // Extract data field
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token flow
      const newToken = await refreshAccessToken()
      if (newToken) {
        // Retry original request
        return apiClient.request(error.config)
      }
    }
    return Promise.reject(error)
  }
)
```

**Group Service:**
```javascript
// api/groupService.js
export const groupService = {
  // List my groups
  getMyGroups: () => 
    apiClient.get('/api/v1/groups'),
  
  // Create group
  createGroup: (data) =>
    apiClient.post('/api/v1/groups', {
      name: data.name,
      description: data.description,
      avatar: data.avatar,
      theme_color: data.themeColor,
      is_pro: data.isPro,
      member_ids: data.memberIds
    }),
  
  // Get group detail
  getGroupById: (groupId) =>
    apiClient.get(`/api/v1/groups/${groupId}`),
  
  // Update group
  updateGroup: (groupId, data) =>
    apiClient.put(`/api/v1/groups/${groupId}`, data),
  
  // Delete group
  deleteGroup: (groupId) =>
    apiClient.delete(`/api/v1/groups/${groupId}`),
  
  // Members
  getMembers: (groupId) =>
    apiClient.get(`/api/v1/groups/${groupId}/members`),
  
  addMember: (groupId, memberId, role) =>
    apiClient.post(`/api/v1/groups/${groupId}/members`, {
      member_id: memberId,
      role
    }),
  
  removeMember: (groupId, memberId) =>
    apiClient.delete(`/api/v1/groups/${groupId}/members/${memberId}`),
  
  updateMemberRole: (groupId, memberId, role) =>
    apiClient.put(`/api/v1/groups/${groupId}/members/${memberId}`, {
      role
    }),
  
  transferLeadership: (groupId, newLeaderId) =>
    apiClient.post(`/api/v1/groups/${groupId}/transfer-leadership`, {
      newLeaderId
    }),
  
  leaveGroup: (groupId) =>
    apiClient.delete(`/api/v1/groups/${groupId}/members/me`)
}
```

### Components

**RoleBadge Component:**
```jsx
// components/RoleBadge.jsx
import { View, Text } from 'react-native'

const roleConfig = {
  LEADER: {
    bg: 'bg-amber-500',
    text: 'text-white',
    icon: '👑',
    label: 'Leader'
  },
  CO_LEADER: {
    bg: 'bg-blue-500',
    text: 'text-white',
    icon: '🛡️',
    label: 'Co-Leader'
  },
  MEMBER: {
    bg: 'bg-gray-400',
    text: 'text-white',
    icon: '👥',
    label: 'Member'
  }
}

export const RoleBadge = ({ role, size = 'md' }) => {
  const config = roleConfig[role]
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }
  
  return (
    <View className={`flex-row items-center rounded-full ${config.bg} ${sizeClasses[size]}`}>
      <Text className={`${config.text} font-medium`}>
        {config.icon} {config.label}
      </Text>
    </View>
  )
}
```

**SwipeableGroupCard Component:**
```jsx
// components/SwipeableGroupCard.jsx
import { Swipeable } from 'react-native-gesture-handler'
import { View, Text, TouchableOpacity } from 'react-native'

export const SwipeableGroupCard = ({ 
  group, 
  onPress, 
  onSwipeLeft 
}) => {
  const renderLeftActions = () => (
    <View className="flex-row">
      <TouchableOpacity 
        className="bg-blue-500 px-4 justify-center"
        onPress={() => onSwipeLeft('chat', group)}
      >
        <Text className="text-white">💬 Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        className="bg-gray-500 px-4 justify-center"
        onPress={() => onSwipeLeft('info', group)}
      >
        <Text className="text-white">ℹ️ Info</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        className="bg-red-500 px-4 justify-center"
        onPress={() => onSwipeLeft('leave', group)}
      >
        <Text className="text-white">🚪 Leave</Text>
      </TouchableOpacity>
    </View>
  )
  
  return (
    <Swipeable renderLeftActions={renderLeftActions}>
      <TouchableOpacity 
        onPress={onPress}
        className="bg-white p-4 mb-2 rounded-lg"
      >
        <View className="flex-row items-center">
          <Image source={{ uri: group.avatar }} className="w-12 h-12 rounded-full" />
          <View className="flex-1 ml-3">
            <Text className="text-lg font-semibold">{group.name}</Text>
            <Text className="text-gray-500">{group.members?.length} members</Text>
          </View>
          <RoleBadge role={group.currentUserRole} />
        </View>
        {group.unreadCount > 0 && (
          <View className="absolute top-2 right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center">
            <Text className="text-white text-xs">{group.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Swipeable>
  )
}
```

**BottomSheet for Actions:**
```jsx
// components/ActionBottomSheet.jsx
import BottomSheet from '@gorhom/bottom-sheet'
import { View, Text, TouchableOpacity } from 'react-native'

export const ActionBottomSheet = ({ 
  visible, 
  onClose, 
  actions 
}) => {
  const snapPoints = ['25%', '50%']
  
  return (
    <BottomSheet
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
    >
      <View className="p-4">
        {actions.map((action, idx) => (
          <TouchableOpacity
            key={idx}
            className={`py-4 border-b border-gray-200 ${action.danger ? 'bg-red-50' : ''}`}
            onPress={() => {
              action.onPress()
              onClose()
            }}
          >
            <Text className={`text-lg ${action.danger ? 'text-red-500' : 'text-gray-900'}`}>
              {action.icon} {action.label}
            </Text>
            {action.description && (
              <Text className="text-sm text-gray-500 mt-1">
                {action.description}
              </Text>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          className="py-4 items-center"
          onPress={onClose}
        >
          <Text className="text-lg text-gray-500">Cancel</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
```

### Performance Optimizations

**FlatList with Memoization:**
```jsx
import { FlatList, memo } from 'react-native'

const MemberItem = memo(({ member, onPress }) => (
  <TouchableOpacity onPress={() => onPress(member)}>
    <View className="flex-row p-4">
      <Avatar uri={member.user.avatarUrl} />
      <View className="flex-1 ml-3">
        <Text className="font-semibold">{member.user.fullName}</Text>
        <Text className="text-gray-500">@{member.user.username}</Text>
      </View>
      <RoleBadge role={member.role} />
    </View>
  </TouchableOpacity>
))

export const MemberList = ({ members, onMemberPress }) => (
  <FlatList
    data={members}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => (
      <MemberItem member={item} onPress={onMemberPress} />
    )}
    getItemLayout={(data, index) => ({
      length: 80,
      offset: 80 * index,
      index
    })}
    removeClippedSubviews
    maxToRenderPerBatch={10}
    windowSize={5}
  />
)
```

**Image Caching:**
```jsx
import FastImage from 'react-native-fast-image'

export const Avatar = ({ uri, size = 48 }) => (
  <FastImage
    source={{
      uri,
      priority: FastImage.priority.high,
      cache: FastImage.cacheControl.immutable
    }}
    style={{ width: size, height: size, borderRadius: size / 2 }}
  />
)
```

**Optimistic Updates:**
```javascript
// Example: Like message
const handleLikeMessage = async (messageId) => {
  // Optimistic update
  setMessages(prev => prev.map(msg => 
    msg.id === messageId 
      ? { 
          ...msg, 
          is_liked_by_current_user: !msg.is_liked_by_current_user,
          like_count: msg.is_liked_by_current_user 
            ? msg.like_count - 1 
            : msg.like_count + 1
        }
      : msg
  ))
  
  try {
    if (message.is_liked_by_current_user) {
      await messageService.unlikeMessage(messageId)
    } else {
      await messageService.likeMessage(messageId)
    }
  } catch (error) {
    // Rollback on error
    setMessages(prevMessages)
    showToast('Failed to like message')
  }
}
```

---

## 🎯 Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Setup architecture and core components

- ✅ Setup React Navigation with bottom tabs
- ✅ Implement API client with interceptors
- ✅ Create design system (colors, typography, spacing)
- ✅ Build reusable components:
  - RoleBadge
  - Avatar / AvatarStack
  - BottomSheet wrapper
  - SwipeableRow
- ✅ Setup state management (Zustand/Redux)
- ✅ Implement authentication flow

**Deliverable:** Core infrastructure ready for feature development

---

### Phase 2: Group List & Detail (Week 3-4)
**Goal:** Primary group discovery and management

**2.1 Group List Screen**
- Fetch and display groups
- Implement swipeable cards
- Add search functionality
- Pin/unpin groups
- Pull-to-refresh
- FAB for create group

**2.2 Group Detail Screen**
- Tabbed interface (Overview, Members, Chat)
- Role-based action menu
- Group info display
- Quick access cards
- Edit group (for LEADER/CO_LEADER)

**Deliverable:** Users can browse, search, and view group details

---

### Phase 3: Member Management (Week 5)
**Goal:** Complete member CRUD operations

- Member list with role grouping
- Add member flow (search + role selection)
- Remove member with confirmation
- Update member role
- Transfer leadership
- Leave group
- Role permission info sheet

**Deliverable:** Full member management capability

---

### Phase 4: Group Creation (Week 6)
**Goal:** Streamlined group creation wizard

- Multi-step wizard (4 steps)
- Form validation
- Avatar upload
- Theme customization
- Add members during creation
- Preview before create
- Success state with navigation

**Deliverable:** Users can create groups with members

---

### Phase 5: Chat Integration (Week 7-8)
**Goal:** Real-time messaging within groups

**5.1 Chat Interface**
- Message list (FlatList inverted)
- Send message (text, image, share post)
- Message bubbles (own vs others)
- Read receipts
- Typing indicators

**5.2 Message Interactions**
- Long-press action sheet
- Reply to message
- Like/unlike message
- Pin/unpin message (LEADER/CO_LEADER)
- Copy message text
- Delete own message

**5.3 Advanced Features**
- Pinned messages list
- Search messages
- Pagination (cursor-based)
- Optimistic updates

**Deliverable:** Full-featured group chat

---

### Phase 6: Polish & Optimization (Week 9-10)
**Goal:** Performance and UX refinement

- Optimize FlatList performance
- Add loading skeletons
- Implement error boundaries
- Add haptic feedback
- Smooth animations (reanimated)
- Offline support (persist data)
- Push notifications
- Deep linking
- Analytics tracking

**Deliverable:** Production-ready app

---

## 📊 Success Metrics

### Quantitative Metrics

**Performance:**
- Screen load time < 1s (p95)
- FlatList scroll FPS > 55
- API response time < 500ms
- Image load time < 300ms

**User Engagement:**
- Group creation completion rate > 80%
- Member addition success rate > 95%
- Chat message send success > 99%
- Daily active users per group

**Error Rates:**
- Permission denied errors < 1%
- Failed API calls < 2%
- App crash rate < 0.1%

### Qualitative Metrics

**Usability Testing:**
- Can users identify their role? (Target: 95% yes)
- Can users find member management? (Target: 90% < 10s)
- Can users create a group? (Target: 85% complete wizard)
- Can users understand role permissions? (Target: 90% yes)

**User Satisfaction:**
- NPS score > 50
- App store rating > 4.5
- Feature request vs bug report ratio

---

## ⚠️ Risk Mitigation

### Technical Risks

**Risk 1: Real-time sync issues**
- **Mitigation:** Use WebSocket with fallback to polling
- **Backup:** Implement optimistic updates + manual refresh

**Risk 2: Large member lists performance**
- **Mitigation:** Pagination, virtualization, search
- **Backup:** Limit member display to 100, "View more" button

**Risk 3: Role permission complexity**
- **Mitigation:** Backend enforces all permissions
- **Backup:** Frontend only hides UI, never skips API validation

**Risk 4: Offline data consistency**
- **Mitigation:** Queue actions, retry on reconnect
- **Backup:** Clear "offline mode" indicator

### UX Risks

**Risk 1: Overwhelming information**
- **Mitigation:** Progressive disclosure, tabs, collapsible sections
- **Backup:** Add "Simple mode" toggle

**Risk 2: Accidental destructive actions**
- **Mitigation:** Confirmation dialogs for delete/leave/transfer
- **Backup:** Undo mechanism (within 5s window)

**Risk 3: Unclear role hierarchy**
- **Mitigation:** Color coding, icons, tooltips everywhere
- **Backup:** Tutorial on first group creation

---

## 🚀 Next Steps

### Immediate Actions

1. **Validate design with stakeholders**
   - Share wireframes/mockups
   - Get feedback on flows
   - Adjust based on input

2. **Technical setup**
   - Create React Native project
   - Install dependencies (navigation, gesture-handler, bottom-sheet, nativewind)
   - Setup folder structure

3. **Backend coordination**
   - Verify all API endpoints work as documented
   - Confirm WebSocket setup for real-time chat
   - Test permission enforcement

4. **Design assets**
   - Create role icons/badges
   - Prepare color palette
   - Design empty states, loading states, error states

### Follow-up Questions

- **Timeline:** What's the target launch date?
- **Team:** How many developers? Need design support?
- **Priority:** Which phase should we start with? (Can we MVP with Phases 1-2 only?)
- **Backend:** Is WebSocket ready? Any API changes needed?
- **Testing:** User testing plan? Beta testers available?

---

## 📚 References

### Design Inspiration
- **WhatsApp**: Group chat interactions, message actions
- **Telegram**: Group management, role hierarchy
- **Slack**: Channel organization, member permissions
- **Discord**: Role-based permissions, visual hierarchy

### Technical Resources
- [React Navigation](https://reactnavigation.org/)
- [NativeWind](https://www.nativewind.dev/)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [Bottom Sheet](https://gorhom.github.io/react-native-bottom-sheet/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

### Best Practices
- [iOS Human Interface Guidelines - Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures)
- [Material Design - Touch Targets](https://m3.material.io/foundations/accessible-design/accessibility-basics)
- [React Native Performance](https://reactnative.dev/docs/performance)

---

**END OF BRAINSTORM DOCUMENT**

*Next step: Create detailed implementation plan with `/ck:plan`*
