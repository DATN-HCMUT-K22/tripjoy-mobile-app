# AI Features Gap Analysis & Enhancement Proposal

**Date:** 2026-05-13  
**Stakeholders:** Frontend Team, Backend Team, Product  
**Status:** Brainstorm & Proposal  

---

## 📋 Executive Summary

Backend provides **4 AI service endpoints** for itinerary management. Frontend has implemented all hooks/services but **critical UX features are missing**, particularly:
- ❌ **No "Apply Itinerary from Social Feed"** - Users can't copy interesting itineraries to their groups
- ❌ **AI replacement workflow needs UX polish** - Exists but not intuitive
- ⚠️ **Travel Notebook is hidden** - Implemented but no visible entry point from itinerary detail screen

**Impact:** Users can't leverage social discovery → group planning flow. AI features exist but underutilized.

---

## 🎯 Backend AI Capabilities (All Available)

### 1. AI Generate Itinerary ✅
- **Endpoint:** `POST /api/v1/itineraries/ai-generate`
- **Status:** 202 Accepted (async with polling)
- **Input:** Destination, dates, budget, people count, themes, optional suggested locations
- **Output:** Full itinerary with trip items
- **Frontend:** `useGenerateItinerary()` hook implemented

### 2. AI Modify Itinerary ✅
- **Endpoint:** `POST /api/v1/itineraries/ai-modify`
- **Status:** 200 OK (sync) or 202 if complex
- **Input:** `itineraryId`, `unwantedPlaceIds[]`
- **Output:** Updated itinerary with replacements
- **Frontend:** `useAiModifyItinerary()` hook implemented, used in `app/itinerary/[id].tsx`

### 3. AI Suggest Location ✅
- **Endpoint:** `POST /api/v1/itineraries/ai-suggest-location`
- **Status:** 200 OK (sync)
- **Input:** `itineraryId`, `unwantedPlaceId` (optional)
- **Output:** Array of `TripItemResponse` suggestions
- **Frontend:** `useAiSuggestLocation()` hook implemented, used in `app/itinerary/[id].tsx`

### 4. AI Generate Travel Notebook ✅
- **Endpoint:** `POST /api/v1/notebooks/{itineraryId}/ai-generate`
- **Status:** 200 OK
- **Output:** Markdown content (food_guide, climate_info, cultural_notes)
- **Frontend:** Full implementation exists:
  - `useNotebook()` + `useGenerateNotebook()` + `useRegenerateNotebook()`
  - `TravelNotebookScreen` component
  - Route: `/itinerary/notebook?id={id}`

---

## 🔍 Current Frontend Implementation Status

### ✅ Fully Implemented (but UX gaps)
| Feature | Hook | Used In | Status |
|---------|------|---------|--------|
| Generate Itinerary | `useGenerateItinerary()` | Itinerary creation flow | ✅ Works |
| Modify Itinerary | `useAiModifyItinerary()` | `app/itinerary/[id].tsx` | ✅ Works |
| Suggest Location | `useAiSuggestLocation()` | `app/itinerary/[id].tsx` | ✅ Works |
| Travel Notebook | `useNotebook()` | `app/itinerary/notebook.tsx` | ✅ Works but **hidden** |

### ❌ Missing Features

#### 1. **Apply Itinerary from Social Feed** (High Priority)
**Problem:**
- Social feed (`app/(tabs)/index.tsx`) displays itinerary previews in posts
- `PostCard` component shows `ItineraryPreview` with "View Details" only
- **No action to copy/apply itinerary to user's group or personal collection**

**User Story:**
> "As a user browsing social feed, when I see an interesting 3-day Đà Lạt itinerary, I want to apply it to my upcoming trip group, then ask AI to adjust it (replace coffee shops, add hiking spots)."

**Current Flow (broken):**
```
User sees post with itinerary
  → Tap "View Details"
    → Opens read-only itinerary detail
      → ❌ Dead end - can't do anything with it
```

**Desired Flow:**
```
User sees post with itinerary
  → Tap "Apply to Group" button
    → Select target group
      → AI generates new itinerary copy for group (with option to modify)
        → Group members can see & edit
```

---

#### 2. **AI Replace Location UX Needs Polish** (Medium Priority)
**Current State:**
- `app/itinerary/[id].tsx` has `aiModifyMutation` and `aiSuggestMutation`
- Code shows state management for suggestions modal (`suggestionModalVisible`, `aiSuggestions`)
- **But unclear if UI is fully wired up**

**Gaps:**
- No visible "🤖 Replace with AI" button on trip items?
- Suggestion modal UI implementation unclear
- No confirmation flow: "Replace X with Y?"

---

#### 3. **Travel Notebook Hidden** (Low Priority but Easy Win)
**Current State:**
- Full implementation exists
- Route works: `/itinerary/notebook?id={id}`
- **But no visible button/tab in itinerary detail screen**

**Missing:**
- Tab or button in `app/itinerary/[id].tsx` to navigate to notebook
- Could be a 4th tab alongside "Chi tiết / Thành viên / Thảo luận"
- Or a floating action button with AI sparkle icon ✨

---

## 💡 Feature Proposals

### Proposal 1: Apply Itinerary from Social Feed (NEW FEATURE)

#### **A. UI Components Needed**

**1.1. Add "Apply to Group" Button to PostCard**
```tsx
// In components/social/PostCard.tsx - ItineraryPreview component

<View style={styles.itineraryActions}>
  <TouchableOpacity onPress={handleViewDetails}>
    <Text>Xem chi tiết</Text>
  </TouchableOpacity>
  
  {/* NEW: Apply button */}
  <TouchableOpacity 
    onPress={handleApplyItinerary}
    style={styles.applyButton}
  >
    <Ionicons name="add-circle-outline" size={20} />
    <Text>Áp dụng</Text>
  </TouchableOpacity>
</View>
```

**1.2. Group Selection Bottom Sheet**
```tsx
<BottomSheet>
  <Text>Áp dụng lịch trình vào nhóm nào?</Text>
  
  <FlatList
    data={userGroups}
    renderItem={({ item }) => (
      <GroupListItem 
        group={item}
        onPress={() => handleSelectGroup(item.id)}
      />
    )}
  />
  
  {/* Option to create personal copy */}
  <TouchableOpacity onPress={handleCreatePersonalCopy}>
    <Text>📋 Tạo bản sao cá nhân</Text>
  </TouchableOpacity>
</BottomSheet>
```

**1.3. AI Adjustment Modal (Optional Enhancement)**
```tsx
<Modal>
  <Text>Bạn có muốn AI điều chỉnh lịch trình này không?</Text>
  
  <CheckboxList>
    <Checkbox label="Thay thế quán cà phê bằng gợi ý khác" />
    <Checkbox label="Thêm hoạt động trekking" />
    <Checkbox label="Điều chỉnh ngân sách về 5 triệu VNĐ" />
  </CheckboxList>
  
  <TextInput 
    placeholder="Hoặc mô tả thay đổi tự do..."
    multiline
  />
  
  <Button onPress={handleApplyWithAI}>
    ✨ Áp dụng & Điều chỉnh bằng AI
  </Button>
</Modal>
```

#### **B. Backend Strategy**

**Option 1: Use Existing `ai-generate` API** (Recommended)
- Frontend fetches source itinerary trip items
- Extract locations, themes, budget
- Call `POST /itineraries/ai-generate` with:
  - `destination` from source
  - `suggestLocations` = all location IDs from source itinerary
  - `groupId` = target group
  - User-provided adjustments (if any)

**Pros:**
- ✅ No new backend endpoint needed
- ✅ AI can optimize the copy (remove closed places, reorder, etc.)
- ✅ Preserves AI adjustment capability

**Cons:**
- ⚠️ Slower (async polling required)
- ⚠️ May deviate from original if AI "improves" it

**Option 2: Simple Clone API** (Simpler but less powerful)
- Backend adds `POST /itineraries/{id}/clone?groupId={groupId}`
- Copies all trip items as-is
- No AI involved in cloning

**Pros:**
- ✅ Fast, synchronous
- ✅ Exact copy guaranteed

**Cons:**
- ❌ Requires new backend endpoint
- ❌ No AI optimization during copy
- ❌ User must manually call AI modify afterward

**Recommendation:** **Option 1** - Use existing AI generate API. Better UX, no backend changes.

#### **C. Implementation Flow**

```typescript
// hooks/useSocial.ts - New hook

export function useApplyItineraryToGroup() {
  const { mutateAsync: generateItinerary } = useGenerateItinerary();
  const { data: itineraryDetail } = useItineraryDetail(sourceItineraryId);
  
  return useMutation({
    mutationFn: async ({
      sourceItineraryId,
      targetGroupId,
      adjustments?: {
        unwantedThemes?: string[];
        additionalThemes?: string[];
        budgetOverride?: number;
      }
    }) => {
      // 1. Fetch source itinerary data
      const source = await itineraryService.getItineraryById(sourceItineraryId);
      
      // 2. Extract locations
      const suggestLocations = source.trip_items
        ?.map(item => item.location_id)
        .filter(Boolean) || [];
      
      // 3. Build AI generate request
      const payload = {
        destination: source.destination || source.title,
        latitude: source.latitude,
        longitude: source.longitude,
        startDate: source.start_date,
        endDate: source.end_date,
        peopleQuantity: source.people_quantity || 2,
        budgetEstimate: adjustments?.budgetOverride || source.budget_estimate,
        themes: source.themes || [],
        groupId: targetGroupId,
        suggestLocations, // ← Key: seed with source locations
      };
      
      // 4. Generate new itinerary
      const result = await generateItinerary(payload);
      
      // 5. If adjustments, call AI modify
      if (adjustments?.unwantedThemes?.length) {
        // Find trip items matching unwanted themes and replace
        await aiModifyItinerary({
          itineraryId: result.id,
          unwantedPlaceIds: [...], // Filter logic
        });
      }
      
      return result;
    },
    onSuccess: (data) => {
      showSuccessToast('Đã áp dụng lịch trình!');
      // Navigate to new itinerary or group
      router.push(`/groups/${data.group_id}/itineraries`);
    },
  });
}
```

#### **D. UX Considerations**

**Loading State:**
- Show "⏳ AI đang tạo bản sao lịch trình..." (10-30s)
- Allow background - user can continue browsing
- Push notification when done

**Permissions:**
- Check if user is member of target group
- Fallback: create personal itinerary (no group)

**Conflicts:**
- If group already has confirmed itinerary → warn user
- Option: "Replace existing" vs "Create as draft"

---

### Proposal 2: AI Replace Location - UX Polish

#### **A. Current Implementation Check**

Need to verify in `app/itinerary/[id].tsx`:
- Is there a "Replace" button on each trip item?
- Is suggestion modal wired up?
- Is the flow: Tap Replace → Show suggestions → Select → Confirm?

#### **B. Recommended UX Flow**

```
Trip Item Card
  → Long press or ⋮ menu
    → "🤖 Đề xuất thay thế bằng AI"
      → Loading spinner (2-5s)
        → Bottom Sheet with 3-5 suggestions
          → Each suggestion shows:
            - Location name + category
            - Photo thumbnail
            - Distance from original
            - Duration
            - "Gợi ý từ AI" badge
          → Tap suggestion
            → Confirmation: "Thay X bằng Y?"
              → Call `updateTripItem` API
                → Success toast + auto-refresh
```

#### **C. UI Components**

**2.1. Trip Item Action Menu**
```tsx
<ActionSheet>
  <ActionButton icon="create-outline">Chỉnh sửa</ActionButton>
  <ActionButton icon="sparkles-outline">🤖 AI đề xuất thay thế</ActionButton>
  <ActionButton icon="trash-outline" danger>Xóa</ActionButton>
</ActionSheet>
```

**2.2. AI Suggestion Bottom Sheet**
```tsx
<BottomSheet height={400}>
  <Text style={styles.header}>
    AI gợi ý thay thế cho "{currentLocation.name}"
  </Text>
  
  {isLoading ? (
    <ActivityIndicator />
  ) : (
    <FlatList
      data={suggestions}
      renderItem={({ item }) => (
        <SuggestionCard
          location={item.location}
          duration={item.duration}
          distance={calculateDistance(current, item)}
          aiGenerated={true}
          onSelect={() => handleSelectSuggestion(item)}
        />
      )}
    />
  )}
  
  <Button variant="ghost" onPress={onClose}>
    Giữ nguyên địa điểm hiện tại
  </Button>
</BottomSheet>
```

**2.3. Suggestion Card Component**
```tsx
<TouchableOpacity style={styles.suggestionCard}>
  <Image source={{ uri: location.photo_url }} style={styles.thumb} />
  
  <View style={styles.info}>
    <View style={styles.header}>
      <Text style={styles.name}>{location.name}</Text>
      <Badge>✨ AI</Badge>
    </View>
    
    <Text style={styles.category}>{location.category}</Text>
    <Text style={styles.meta}>
      {distance} km • {duration} phút
    </Text>
    
    <Text style={styles.note} numberOfLines={2}>
      {item.note}
    </Text>
  </View>
  
  <Ionicons name="checkmark-circle-outline" size={24} />
</TouchableOpacity>
```

#### **D. Implementation Checklist**

- [ ] Add "AI Suggest" action to trip item menu
- [ ] Create `SuggestionBottomSheet` component
- [ ] Create `SuggestionCard` component with AI badge
- [ ] Wire up `useAiSuggestLocation()` hook
- [ ] Add confirmation dialog before replacing
- [ ] Handle loading/error states
- [ ] Add analytics: `trackEvent('ai_suggest_location')`

---

### Proposal 3: Expose Travel Notebook (Quick Win)

#### **A. Current State**
- Full implementation exists at `app/itinerary/notebook.tsx`
- `TravelNotebookScreen` component ready
- Just needs **entry point** from itinerary detail

#### **B. Add Entry Point**

**Option 1: Add Tab to Itinerary Detail**
```tsx
// app/itinerary/[id].tsx

const tabs = [
  { key: 'details', label: 'Chi tiết' },
  { key: 'members', label: 'Thành viên' },
  { key: 'chat', label: 'Thảo luận' },
  { key: 'notebook', label: '📖 Sổ tay', icon: 'book-outline' }, // NEW
];

// Tab content
{activeTab === 'notebook' && (
  <TravelNotebookScreen 
    itineraryId={itineraryId}
    itineraryName={detail?.title}
  />
)}
```

**Option 2: Floating Action Button**
```tsx
// In itinerary detail screen

<FAB
  icon="sparkles-outline"
  label="AI Travel Guide"
  onPress={() => router.push(`/itinerary/notebook?id=${itineraryId}`)}
  style={styles.fab}
/>
```

**Option 3: Card in Overview Section**
```tsx
// In "Chi tiết" tab, after map and trip items

<TouchableOpacity 
  style={styles.notebookCard}
  onPress={() => router.push(`/itinerary/notebook?id=${id}`)}
>
  <Ionicons name="book-outline" size={32} color="#8B5CF6" />
  <View>
    <Text style={styles.title}>📖 Sổ tay du lịch</Text>
    <Text style={styles.subtitle}>
      Hướng dẫn ẩm thực, văn hóa & khí hậu do AI tạo
    </Text>
  </View>
  <Ionicons name="chevron-forward" size={20} />
</TouchableOpacity>
```

#### **C. Implementation** (1-2 hours)

**Recommendation:** **Option 3** (Card) - Most discoverable, doesn't clutter tabs.

```tsx
// app/itinerary/[id].tsx

// Add after trip items list, before expenses section

<View style={styles.notebookSection}>
  <Text style={styles.sectionTitle}>Thông tin hữu ích</Text>
  
  <TravelNotebookCard
    itineraryId={itineraryId}
    onPress={() => router.push(`/itinerary/notebook?id=${itineraryId}`)}
  />
</View>

// components/itinerary/TravelNotebookCard.tsx
export function TravelNotebookCard({ itineraryId, onPress }) {
  const { data: notebook } = useNotebook(itineraryId);
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <LinearGradient
        colors={['#8B5CF6', '#6366F1']}
        style={styles.iconContainer}
      >
        <Ionicons name="book-outline" size={28} color="#FFF" />
      </LinearGradient>
      
      <View style={styles.content}>
        <Text style={styles.title}>📖 Sổ tay du lịch</Text>
        {notebook ? (
          <Text style={styles.subtitle}>
            ✓ Hướng dẫn ẩm thực, văn hóa & khí hậu
          </Text>
        ) : (
          <Text style={styles.subtitle}>
            Nhấn để tạo hướng dẫn bằng AI
          </Text>
        )}
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}
```

---

## 🎨 Visual Mockups (Text-Based)

### Mockup 1: Apply Itinerary from Social Feed

```
┌────────────────────────────────────┐
│  📱 Social Feed Post               │
├────────────────────────────────────┤
│  @user123                          │
│  "Chuyến đi Đà Lạt 3 ngày cực     │
│  chill của mình ❤️"                │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ 🗺️  Chuyến đi Đà Lạt        │ │
│  │  3 ngày • 8,000,000 VNĐ     │ │
│  │                              │ │
│  │  [Xem chi tiết]  [📋 Áp dụng]│ │  ← NEW BUTTON
│  └──────────────────────────────┘ │
│                                    │
│  ❤️ 142   💬 23   🔖 Save         │
└────────────────────────────────────┘

             ↓ User taps "Áp dụng"

┌────────────────────────────────────┐
│  Áp dụng lịch trình vào nhóm nào?  │
├────────────────────────────────────┤
│  ⚪ Chuyến đi Đà Lạt team XYZ      │
│  ⚪ Gia đình đi biển tháng 6       │
│  ⚪ Solo trip Sapa                  │
│                                    │
│  📋 Tạo bản sao cá nhân (không     │
│     thuộc nhóm nào)                │
│                                    │
│  [Tiếp tục] →                      │
└────────────────────────────────────┘

             ↓ Select group

┌────────────────────────────────────┐
│  Điều chỉnh bằng AI? (Tùy chọn)   │
├────────────────────────────────────┤
│  ☐ Thay đổi ngân sách thành:      │
│    [5,000,000] VNĐ                 │
│                                    │
│  ☐ Thay thế các quán cà phê       │
│  ☐ Thêm hoạt động trekking         │
│                                    │
│  💬 Mô tả thêm:                    │
│  ┌──────────────────────────────┐ │
│  │ "Bỏ các điểm check-in, thêm  │ │
│  │  nhiều địa điểm ăn uống..."  │ │
│  └──────────────────────────────┘ │
│                                    │
│  [Bỏ qua]  [✨ Áp dụng với AI]    │
└────────────────────────────────────┘

             ↓ Processing

┌────────────────────────────────────┐
│  ⏳ AI đang tạo lịch trình...      │
│                                    │
│   ████████░░░░░░░░░░  40%          │
│                                    │
│  Đang phân tích 12 địa điểm...     │
│                                    │
│  [Tiếp tục duyệt feed]             │
└────────────────────────────────────┘
```

### Mockup 2: AI Replace Location

```
┌────────────────────────────────────┐
│  🗺️ Chuyến đi Đà Lạt              │
│  Ngày 1 - 15/06/2026               │
├────────────────────────────────────┤
│                                    │
│  09:00  ┌─────────────────────┐   │
│         │ ☕ Café View Đà Lạt │   │
│         │ 123 Trần Hưng Đạo   │   │
│         │ 60 phút       [⋮]  │   │  ← Long press
│         └─────────────────────┘   │
│                                    │
│  11:00  ┌─────────────────────┐   │
│         │ 🌸 Vườn Hoa TP      │   │
│         └─────────────────────┘   │
└────────────────────────────────────┘

             ↓ Tap ⋮ menu

┌────────────────────────────────────┐
│  Hành động                         │
├────────────────────────────────────┤
│  ✏️  Chỉnh sửa                     │
│  🤖 Đề xuất thay thế bằng AI       │  ← NEW
│  🗑️  Xóa                           │
│  [Hủy]                             │
└────────────────────────────────────┘

             ↓ AI suggests

┌────────────────────────────────────┐
│  AI gợi ý thay thế                 │
│  "Café View Đà Lạt"                │
├────────────────────────────────────┤
│  ┌──────────────────────────────┐ │
│  │ [img] ☕ Làng Cà Phê Mê Linh │ │
│  │       Cafe • 1.2 km          │ │
│  │       "View thung lũng tuyệt │ │
│  │       đẹp"          ✨ AI   │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ [img] ☕ The Married Beans    │ │
│  │       Cafe • 0.8 km          │ │
│  │       "Chill, yên tĩnh"      │ │
│  │                     ✨ AI   │ │
│  └──────────────────────────────┘ │
│                                    │
│  [Giữ nguyên địa điểm cũ]          │
└────────────────────────────────────┘

             ↓ Select suggestion

┌────────────────────────────────────┐
│  Xác nhận thay đổi                 │
├────────────────────────────────────┤
│  Thay thế:                         │
│  ❌ Café View Đà Lạt               │
│                                    │
│  Bằng:                             │
│  ✅ Làng Cà Phê Mê Linh            │
│      (1.2 km, View thung lũng)     │
│                                    │
│  [Hủy]  [Xác nhận]                 │
└────────────────────────────────────┘
```

### Mockup 3: Travel Notebook Entry Point

```
┌────────────────────────────────────┐
│  🗺️ Chuyến đi Đà Lạt              │
│  Chi tiết • Thành viên • Thảo luận │
├────────────────────────────────────┤
│                                    │
│  [Map Preview]                     │
│                                    │
│  📍 12 địa điểm • 3 ngày           │
│                                    │
│  ═══ Thông tin hữu ích ═══         │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ 📖 [icon] Sổ tay du lịch    │ │  ← NEW CARD
│  │                              │ │
│  │ Hướng dẫn ẩm thực, văn hóa   │ │
│  │ & khí hậu do AI tạo          │ │
│  │                          [→] │ │
│  └──────────────────────────────┘ │
│                                    │
│  ═══ Ngày 1 - 15/06/2026 ═══      │
│                                    │
│  09:00  ☕ Café View               │
│  11:00  🌸 Vườn Hoa TP             │
│  ...                               │
└────────────────────────────────────┘
```

---

## 🏗️ Implementation Complexity

### Priority Matrix

| Feature | Impact | Effort | Priority | Timeline |
|---------|--------|--------|----------|----------|
| **Apply Itinerary from Social** | 🔥 High | 🟡 Medium | P0 | 3-5 days |
| **Expose Travel Notebook** | 🟢 Medium | 🟢 Low | P1 | 0.5 day |
| **Polish AI Replace UX** | 🟡 Medium | 🟡 Medium | P2 | 2-3 days |

### Effort Breakdown

#### Feature 1: Apply Itinerary (3-5 days)
- **Day 1:** Design + approval
  - Finalize UX flow
  - Design bottom sheets
  - Review with product
- **Day 2-3:** Core implementation
  - Add "Áp dụng" button to `PostCard`
  - Create group selection bottom sheet
  - Implement `useApplyItineraryToGroup()` hook
  - Wire up AI generate call
- **Day 4:** Polish & edge cases
  - Loading states
  - Error handling
  - Permission checks
  - Analytics tracking
- **Day 5:** Testing & bug fixes

#### Feature 2: Expose Notebook (0.5 day)
- **Hour 1-2:** Create `TravelNotebookCard` component
- **Hour 2-3:** Integrate into itinerary detail screen
- **Hour 3-4:** Test + polish styling

#### Feature 3: AI Replace UX (2-3 days)
- **Day 1:** Audit existing implementation
  - Check if suggestion modal exists
  - Identify gaps
- **Day 2:** Build/fix UI components
  - `SuggestionBottomSheet`
  - `SuggestionCard`
  - Action menu item
- **Day 3:** Polish & test
  - Animations
  - Error states
  - User testing

---

## ⚙️ Technical Considerations

### 1. State Management
- Use existing React Query cache for itineraries
- Invalidate queries after AI operations
- Optimistic updates for better UX

### 2. Polling for AI Operations
- AI Generate returns 202 → need polling
- Reuse existing polling pattern from `useGenerateItinerary`
- Show progress indicator: "⏳ 40%... Đang phân tích địa điểm"

### 3. Analytics Events to Track
```typescript
// Feature 1
trackEvent('apply_itinerary_from_social', {
  sourceItineraryId,
  targetGroupId,
  hadAdjustments: boolean,
});

// Feature 2
trackEvent('ai_replace_location_requested', {
  itineraryId,
  locationId,
  suggestionCount: number,
});

trackEvent('ai_replace_location_selected', {
  itineraryId,
  oldLocationId,
  newLocationId,
});

// Feature 3
trackEvent('travel_notebook_viewed', {
  itineraryId,
  entryPoint: 'card' | 'tab' | 'fab',
});
```

### 4. Error Handling Scenarios

**Apply Itinerary:**
- ❌ User not member of target group → Show error, suggest creating personal copy
- ❌ AI generate times out (>60s) → Retry option + fallback to manual copy
- ❌ Source itinerary deleted → Graceful error message

**AI Replace:**
- ❌ No suggestions returned → "Không tìm thấy gợi ý phù hợp"
- ❌ API timeout → Retry or manual search option

**Travel Notebook:**
- ❌ Generation fails → Clear error message + "Thử lại" button

### 5. Performance Optimizations
- Lazy load `TravelNotebookScreen` (code splitting)
- Cache AI suggestions for 5 minutes
- Debounce AI calls if user rapid-fires requests
- Use `React.memo` for suggestion cards

---

## 📊 Success Metrics

### Feature 1: Apply Itinerary
- **Adoption:** % of social feed itinerary views → apply actions
- **Completion:** % of apply flows completed (vs abandoned)
- **Engagement:** Increase in group itinerary creation rate
- **Target:** 15%+ of itinerary post viewers try "Áp dụng"

### Feature 2: AI Replace
- **Usage:** # of AI replace requests per itinerary edit session
- **Satisfaction:** % of suggestions accepted (vs manual search)
- **Target:** 30%+ acceptance rate for AI suggestions

### Feature 3: Travel Notebook
- **Discovery:** % of itinerary viewers who open notebook
- **Retention:** % who return to notebook multiple times
- **Target:** 20%+ of itinerary viewers open notebook

---

## 🎯 Recommendations

### Phase 1 (This Sprint) - High Impact Quick Wins
1. ✅ **Expose Travel Notebook** - Already implemented, just add entry point (0.5 day)
2. ✅ **Apply Itinerary from Social** - Core flow without AI adjustment (3 days)

### Phase 2 (Next Sprint) - Polish
3. ✅ **Apply with AI Adjustment** - Add optional AI modify step (2 days)
4. ✅ **Polish AI Replace UX** - Full suggestion flow with confirmation (2-3 days)

### Phase 3 (Future) - Advanced Features
- **AI-Powered Itinerary Comparison**
  - Show diff when applying: "12 địa điểm khớp, 4 địa điểm mới"
- **Smart Suggestions Based on Group Profile**
  - If group has kids → AI suggests family-friendly alternatives
  - If budget-conscious → AI replaces expensive places
- **Collaborative AI Editing**
  - Multiple members suggest replacements
  - AI aggregates preferences: "3/5 thành viên muốn thêm hiking"

---

## 📝 Next Steps

1. **Stakeholder Review** - Get product/design approval on UX flows
2. **Backend Clarification** - Confirm no new APIs needed for Apply Itinerary
3. **Design Assets** - Get AI sparkle icon, loading animations
4. **Implementation Plan** - Break into tickets, assign to sprint

---

## 🤔 Open Questions

1. **Apply Itinerary - Group Permissions:**
   - Can any member apply itinerary to group? Or only admins?
   - If group has existing confirmed itinerary, should we:
     - Block apply?
     - Allow but create as separate "Draft #2"?
     - Show merge conflict UI?

2. **AI Replace - Suggestion Quality:**
   - How many suggestions should we show? (Currently: 3-5)
   - Should we show "confidence score" or "match %" for each suggestion?
   - Fallback if AI returns 0 suggestions?

3. **Travel Notebook - Generation Timing:**
   - Auto-generate on itinerary creation? Or wait for user request?
   - If auto-generate, when? (After first trip item added? After confirmation?)

4. **Billing/Quotas:**
   - Do we have rate limits on AI API calls?
   - Cost per AI generate call? Should we cache aggressively?

---

**Status:** Ready for review and approval  
**Next Review Date:** TBD  
**Assigned To:** Frontend Team Lead + Product Manager
