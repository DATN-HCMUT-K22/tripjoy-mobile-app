# Smart Itinerary Features - Comprehensive Brainstorm
**Date:** 2026-05-26  
**Status:** Consensus Reached  
**Implementation Approach:** Phased (6 phases)

---

## 📋 Problem Statement

Implement comprehensive itinerary management enhancements covering:

1. **Smart Geofencing & Check-in** - Proactive location-based notifications and manual check-in
2. **Trip Item Status Management** - Support PENDING, CHECKED_IN, SKIPPED states
3. **Rating & Review System** - Post-visit feedback with 1-5 star ratings and text reviews
4. **Enhanced Expense Management** - Link expenses to trip items, receipt uploads, separate payer tracking

**Current State:**
- TripItemCard exists with basic display (location, time, price, notes)
- Expense CRUD functional with categories (FOOD, TRANSPORT, ACCOMMODATION, ACTIVITY, OTHER)
- Services layer (itineraries.ts) provides API integration
- Image upload infrastructure exists (services/media.ts)
- AsyncStorage utilities available (utils/storage.ts)

**Requirements Source:**
- Original plan: `/media/ngocha/D/datn_tripjoy/.claude/plans/smart-geofencing-checkin/plan.md`
- New requirements: `/media/ngocha/D/datn_tripjoy/docs/update_after_defence_section.md`

---

## 🎯 Evaluated Approaches

### **Option 1: Monolithic Implementation**
Single large PR implementing all features together.

**Pros:**
- Full integration from start
- Single test cycle
- No version compatibility concerns

**Cons:**
- High risk, difficult review (~2000+ LOC)
- Long dev time (3-4 weeks)
- Hard rollback on issues
- Testing complexity exponential
- **Violates KISS & YAGNI principles**

**Verdict:** ❌ **REJECTED**

---

### **Option 2: Phased Implementation (6 Phases)**
Incremental delivery with independent, testable phases.

**Phase Structure:**
1. Trip Item Status Management (Foundation)
2. Basic Check-in UI & Optimistic Updates
3. Rating & Review System
4. Enhanced Expense Management
5. Geofencing Background Task
6. Polish & Edge Cases

**Pros:**
- Low risk per phase (200-400 LOC each)
- Early user feedback
- Easy rollback
- Parallel work possible (e.g., Phase 3 & 4)
- Incremental value delivery
- **Honors YAGNI, KISS, DRY**

**Cons:**
- Requires phase dependency management
- 6 PRs vs 1 (slightly more overhead)

**Verdict:** ✅ **SELECTED**

---

### **Option 3: Hybrid (Core first, enhancements later)**
Phases 1+2 together, then rest separately.

**Pros:**
- Faster core check-in delivery
- Some separation maintained

**Cons:**
- Phase 1+2 becomes large PR (600+ LOC)
- Less flexibility

**Verdict:** ⚠️ **ACCEPTABLE FALLBACK** (if timeline critical)

---

## 🏗️ Recommended Solution: Phased Implementation

### **Architecture Overview**

```
┌─────────────────────────────────────────────────────────┐
│                   Itinerary Detail Screen               │
│  ┌──────────────────────────────────────────────────┐  │
│  │           TripItemCard (Enhanced)                │  │
│  │  • Status Badges (PENDING/CHECKED_IN/SKIPPED)   │  │
│  │  • Check-in Button (Primary: #2BB673)           │  │
│  │  • Rating Stars (Yellow gradient 1→5)           │  │
│  │  • Rating Button (when CHECKED_IN)              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│              Status & Rating Management                 │
│  • updateTripItemStatus(status, rating?, review?)       │
│  • Optimistic UI updates                                │
│  • AsyncStorage queue for offline                       │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│                 Expense Management                      │
│  • Link to trip_item_id (nullable)                      │
│  • Upload receipt_image_urls (max 3)                    │
│  • Track paid_by & paid_at                              │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│          Geofencing Background Service                  │
│  • expo-location + TaskManager                          │
│  • Active only for current day's items                  │
│  • 1000m radius → Local Notification                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📐 Detailed Phase Breakdown

### **Phase 1: Trip Item Status Management** (Foundation)
**Timeline:** 2 days  
**LOC Estimate:** ~250 lines

**Objective:** Add status field and API integration for PENDING/CHECKED_IN/SKIPPED.

**Tasks:**
1. Update `TripItemResponse` type:
   ```typescript
   export type TripItemResponse = {
     // ... existing fields
     status?: 'PENDING' | 'CHECKED_IN' | 'SKIPPED';
     rating?: number; // 1-5, null if not rated
     review?: string; // text feedback
   };
   ```

2. Create service method:
   ```typescript
   // services/itineraries.ts
   updateTripItemStatus: (
     itineraryId: string,
     tripItemId: string,
     payload: {
       status: 'PENDING' | 'CHECKED_IN' | 'SKIPPED';
       rating?: number;
       review?: string;
     }
   ) => httpClient.patch(
     `/itineraries/${itineraryId}/items/${tripItemId}/status`,
     payload
   )
   ```

3. Create React Query hook:
   ```typescript
   // hooks/useTripItemStatus.ts
   export function useUpdateTripItemStatus() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: async (args) => { /* ... */ },
       onSuccess: (data, variables) => {
         queryClient.invalidateQueries(['itineraries', 'detail', variables.itineraryId]);
       }
     });
   }
   ```

**Success Criteria:**
- Status updates reflect in UI immediately
- API calls succeed with correct payload
- Query invalidation refreshes trip items list

---

### **Phase 2: Basic Check-in UI & Optimistic Updates**
**Timeline:** 2 days  
**LOC Estimate:** ~350 lines

**Objective:** Add check-in button, status badges, offline queue.

**Tasks:**
1. Update `TripItemCard.tsx`:
   - Add status badge display (top-right corner)
   - Add check-in button (bottom, Primary color #2BB673)
   - Add "Undo" option for CHECKED_IN → PENDING
   - Dim card when CHECKED_IN (opacity: 0.7)
   
2. Status Badge Colors:
   ```typescript
   const STATUS_STYLES = {
     PENDING: { bg: '#FEF3C7', text: '#92400E', label: 'Chưa đến' },
     CHECKED_IN: { bg: '#D1FAE5', text: '#065F46', label: 'Đã check-in' },
     SKIPPED: { bg: '#E5E7EB', text: '#374151', label: 'Đã bỏ qua' },
   };
   ```

3. Offline Queue Implementation:
   ```typescript
   // utils/checkinQueue.ts
   const QUEUE_KEY = '@tripjoy:checkinQueue';
   
   export const checkinQueue = {
     async add(item: { itineraryId: string; tripItemId: string; status: string }) {
       const queue = await this.getAll();
       queue.push({ ...item, timestamp: Date.now() });
       await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
     },
     
     async getAll() {
       const data = await AsyncStorage.getItem(QUEUE_KEY);
       return data ? JSON.parse(data) : [];
     },
     
     async processQueue() {
       const queue = await this.getAll();
       const failed = [];
       
       for (const item of queue) {
         try {
           await itineraryService.updateTripItemStatus(
             item.itineraryId, item.tripItemId, { status: item.status }
           );
         } catch {
           failed.push(item);
         }
       }
       
       await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
     }
   };
   ```

4. Background Sync Trigger:
   - `useEffect` in detail screen to process queue on mount
   - NetInfo listener to retry on network change

**Success Criteria:**
- Check-in works offline (UI updates immediately)
- Queue syncs when network returns
- Undo check-in works correctly
- Touch target >= 44px (accessibility)

---

### **Phase 3: Rating & Review System**
**Timeline:** 2 days  
**LOC Estimate:** ~300 lines

**Objective:** Allow users to rate (1-5 stars) and review trip items after check-in.

**Tasks:**
1. Create `RatingModal.tsx`:
   ```typescript
   interface RatingModalProps {
     visible: boolean;
     tripItem: TripItemResponse;
     currentRating?: number;
     currentReview?: string;
     onSave: (rating: number, review: string) => void;
     onClose: () => void;
   }
   ```

2. Star Rating Component:
   ```typescript
   // Yellow gradient: 1 star = #FDE68A → 5 stars = #F59E0B
   const STAR_COLORS = [
     '#FDE68A', // 1 star (very light yellow)
     '#FCD34D', // 2 stars
     '#FBBF24', // 3 stars
     '#F59E0B', // 4 stars
     '#D97706', // 5 stars (deep gold)
   ];
   ```

3. Display in TripItemCard:
   - Show stars + rating number when rated
   - Show "Đánh giá" button when CHECKED_IN but not rated
   - Show "Sửa đánh giá" button when already rated
   
4. Validation:
   - Rating: integer 1-5 (required)
   - Review: string, max 500 chars (optional)
   - Only allow when status = CHECKED_IN

**UI Flow:**
```
Check-in → Status becomes CHECKED_IN → "Đánh giá" button appears
→ User clicks → RatingModal opens → Select stars + write review
→ Save → PATCH /items/{id}/status with { status: 'CHECKED_IN', rating, review }
→ Modal closes → Stars display on card
```

**Success Criteria:**
- Rating modal only accessible when CHECKED_IN
- Stars display with correct yellow intensity
- Review text saves and displays correctly
- Can edit rating/review anytime after initial submission

---

### **Phase 4: Enhanced Expense Management**
**Timeline:** 3 days  
**LOC Estimate:** ~400 lines

**Objective:** Add trip item linking, receipt uploads, payer tracking.

**Tasks:**
1. Update types:
   ```typescript
   export type ExpenseRequest = {
     name: string;
     description?: string;
     amount: number;
     type?: string;
     method?: string;
     trip_item_id?: string | null; // NEW
     receipt_image_urls?: string[]; // NEW - max 3
     paid_by?: string; // NEW - UUID, defaults to current user
     paid_at?: string; // NEW - ISO timestamp, defaults to now
   };
   
   export type ExpenseResponse = {
     // ... existing fields
     trip_item_id?: string | null;
     trip_item?: TripItemResponse; // Populated by backend
     receipt_image_urls?: string[];
     paid_by?: string;
     paid_by_user?: UserSimpleResponse;
     paid_at?: string;
   };
   ```

2. Update `app/itinerary/expenses.tsx` form:
   - Add dropdown to select trip item (optional)
     - Options: trip items from current itinerary + "Không gắn địa điểm"
   - Add "Thêm ảnh hóa đơn" button (max 3 images)
     - Use existing `uploadImage` from `services/media.ts`
     - Display thumbnails with remove option
   - Add "Người thanh toán" dropdown (itinerary members)
     - Default: current user
   - Add "Thời gian thanh toán" DateTimePicker
     - Default: now

3. Receipt Upload Flow:
   ```typescript
   const handleAddReceipt = async () => {
     const result = await ImagePicker.launchImageLibraryAsync({
       mediaTypes: ImagePicker.MediaTypeOptions.Images,
       quality: 0.8,
       allowsMultipleSelection: false,
     });
     
     if (!result.canceled && result.assets[0]) {
       const uploaded = await uploadImage({
         fileUri: result.assets[0].uri,
         folder: 'expense-receipts',
         compress: true,
       });
       
       setFormData({
         ...formData,
         receipt_image_urls: [
           ...(formData.receipt_image_urls || []),
           uploaded.url,
         ].slice(0, 3), // Max 3
       });
     }
   };
   ```

4. New API Endpoints (Backend already implemented):
   - `GET /api/v1/itineraries/{id}/expenses/summary` - Total by payer
   - `GET /api/v1/itineraries/{id}/expenses?paidById={uuid}` - Filter by payer

**Success Criteria:**
- Trip item dropdown populates correctly
- Receipt upload works (max 3 enforced)
- Paid by defaults to current user
- Paid at defaults to current time
- Backend accepts all new fields

---

### **Phase 5: Geofencing Background Task**
**Timeline:** 3 days  
**LOC Estimate:** ~350 lines

**Objective:** Background location tracking + notifications when entering 1km radius.

**Tasks:**
1. Install dependencies:
   ```bash
   npx expo install expo-location expo-task-manager expo-notifications
   ```

2. Request permissions (when "Bắt đầu chuyến đi"):
   ```typescript
   // app/itinerary/detail.tsx
   const handleStartTrip = async () => {
     // Show rationale modal
     setPermissionModalVisible(true);
   };
   
   const requestLocationPermissions = async () => {
     const { status: foreground } = await Location.requestForegroundPermissionsAsync();
     if (foreground !== 'granted') {
       Alert.alert('Cần quyền vị trí', 'Vui lòng cấp quyền để sử dụng tính năng geofencing');
       return false;
     }
     
     const { status: background } = await Location.requestBackgroundPermissionsAsync();
     if (background !== 'granted') {
       Alert.alert(
         'Quyền vị trí nền',
         'Để nhận thông báo khi đến gần địa điểm, vui lòng cấp quyền "Luôn luôn"'
       );
       // Continue anyway - geofencing is optional
     }
     
     return true;
   };
   ```

3. Geofencing Task:
   ```typescript
   // tasks/geofencingTask.ts
   import * as TaskManager from 'expo-task-manager';
   import * as Location from 'expo-location';
   import * as Notifications from 'expo-notifications';
   
   const GEOFENCING_TASK = 'BACKGROUND_GEOFENCING';
   
   TaskManager.defineTask(GEOFENCING_TASK, async ({ data, error }) => {
     if (error) {
       console.error('Geofencing error:', error);
       return;
     }
     
     if (data.eventType === Location.GeofencingEventType.Enter) {
       const { region } = data;
       
       await Notifications.scheduleNotificationAsync({
         content: {
           title: '📍 Bạn sắp đến nơi!',
           body: `Bạn đang ở gần ${region.identifier}`,
           sound: true,
         },
         trigger: null, // Immediate
       });
     }
   });
   
   export async function startGeofencing(tripItems: TripItemResponse[]) {
     const today = new Date().toISOString().split('T')[0];
     
     const todayItems = tripItems.filter(item => {
       if (!item.start_time) return false;
       const itemDate = item.start_time.split('T')[0];
       return itemDate === today && item.location?.lat && item.location?.lng;
     });
     
     if (todayItems.length === 0) {
       console.log('No items for today, skipping geofencing');
       return;
     }
     
     const regions = todayItems.map(item => ({
       identifier: item.location!.name || 'Địa điểm',
       latitude: item.location!.lat!,
       longitude: item.location!.lng!,
       radius: 1000, // 1km
       notifyOnEnter: true,
       notifyOnExit: false,
     }));
     
     await Location.startGeofencingAsync(GEOFENCING_TASK, regions);
   }
   
   export async function stopGeofencing() {
     const started = await TaskManager.isTaskRegisteredAsync(GEOFENCING_TASK);
     if (started) {
       await Location.stopGeofencingAsync(GEOFENCING_TASK);
     }
   }
   ```

4. Integration in Detail Screen:
   ```typescript
   // When status changes to IN_PROGRESS
   useEffect(() => {
     if (detail?.status === 'IN_PROGRESS' && tripItems.length > 0) {
       startGeofencing(tripItems);
     }
     
     return () => {
       if (detail?.status === 'COMPLETED') {
         stopGeofencing();
       }
     };
   }, [detail?.status, tripItems]);
   ```

5. Fallback: If user denies background permission:
   - Manual check-in still works (Phase 2)
   - No notifications, but app is still functional

**Success Criteria:**
- Permission modal shows clear rationale
- Geofencing registers only for today's items
- Notification fires when entering 1km radius
- Task unregisters when trip completes
- Works without background permission (manual check-in)

---

### **Phase 6: Polish & Edge Cases**
**Timeline:** 2 days  
**LOC Estimate:** ~200 lines

**Objective:** Handle edge cases, error states, loading states.

**Tasks:**
1. Loading States:
   - Skeleton loader for TripItemCard when updating status
   - Spinner in rating modal during save
   - Disable check-in button during API call

2. Error Handling:
   - Toast on network failure → "Đã lưu offline, sẽ đồng bộ khi có mạng"
   - Retry button for failed queue items
   - Max retry count (3) before showing permanent error

3. Edge Cases:
   - No trip items for today → Don't start geofencing
   - Location permission denied → Show informative message
   - Offline rating → Queue along with status update
   - Expense with no trip items → Show "Không gắn địa điểm" label

4. Accessibility:
   - All buttons >= 44px touch target
   - Semantic labels for screen readers
   - Color contrast ratios meet WCAG AA

5. Performance:
   - Memoize expensive TripItemCard renders
   - Debounce queue processing (avoid spamming API)
   - Lazy load receipt images in expense list

**Success Criteria:**
- No crashes on permission denial
- Graceful degradation when offline
- All UI interactions feel snappy (<100ms feedback)
- Accessibility audit passes

---

## 🔧 Technical Specifications

### **Type Definitions**
```typescript
// services/itineraries.ts additions

export type TripItemStatus = 'PENDING' | 'CHECKED_IN' | 'SKIPPED';

export type TripItemResponse = {
  id?: string;
  location_id?: string;
  duration?: number;
  note?: string;
  location?: LocationResponse;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  start_time?: string;
  status?: TripItemStatus;      // NEW
  rating?: number;              // NEW (1-5)
  review?: string;              // NEW
};

export type UpdateTripItemStatusRequest = {
  status: TripItemStatus;
  rating?: number;
  review?: string;
};

export type ExpenseRequest = {
  name: string;
  description?: string;
  amount: number;
  type?: string;
  method?: string;
  trip_item_id?: string | null;     // NEW
  receipt_image_urls?: string[];    // NEW
  paid_by?: string;                 // NEW
  paid_at?: string;                 // NEW
};

export type ExpenseResponse = {
  id?: string;
  name?: string;
  description?: string;
  amount?: number;
  type?: string;
  method?: string;
  user?: UserSimpleResponse;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  trip_item_id?: string | null;     // NEW
  trip_item?: TripItemResponse;     // NEW
  receipt_image_urls?: string[];    // NEW
  paid_by?: string;                 // NEW
  paid_by_user?: UserSimpleResponse; // NEW
  paid_at?: string;                 // NEW
};
```

### **UI/UX Specifications**

**Colors:**
- Primary (Check-in button): `#2BB673`
- Status Badges:
  - PENDING: Background `#FEF3C7`, Text `#92400E`
  - CHECKED_IN: Background `#D1FAE5`, Text `#065F46`
  - SKIPPED: Background `#E5E7EB`, Text `#374151`
- Rating Stars: `['#FDE68A', '#FCD34D', '#FBBF24', '#F59E0B', '#D97706']`

**Animations:**
- Status transitions: 150-300ms ease-in-out
- Check-in button press: Scale 0.95, 100ms
- Card dim effect: Opacity 0.7 when CHECKED_IN
- Rating stars: Scale 1.2 on press, spring animation

**Touch Targets:**
- All interactive elements: >= 44x44 dp
- Check-in button: 48 height, full width
- Rating stars: 48x48 each
- Menu buttons: 44x44 hitSlop

---

## 🚨 Implementation Risks & Mitigations

### **Risk 1: Background Location Drains Battery**
**Mitigation:**
- Only activate geofencing for current day's items
- Use 1km radius (not too small)
- Stop geofencing when trip status ≠ IN_PROGRESS
- Document battery impact in user consent modal

### **Risk 2: Offline Queue Corruption**
**Mitigation:**
- JSON validation before parsing AsyncStorage
- Try/catch around all queue operations
- Max queue size limit (100 items)
- Clear queue option in settings

### **Risk 3: Receipt Image Upload Failures**
**Mitigation:**
- Show upload progress indicator
- Allow retry on failure
- Save form data even if upload fails (upload later)
- Compress images before upload (existing in media.ts)

### **Risk 4: Rating Validation Conflicts**
**Mitigation:**
- Backend enforces status = CHECKED_IN requirement
- Frontend disables rating UI when status ≠ CHECKED_IN
- Show clear error message if validation fails
- Gray out rating button with tooltip when unavailable

### **Risk 5: Phase Dependencies Break**
**Mitigation:**
- Phase 1 must complete before Phase 2 (status API required)
- Phase 2 before Phase 3 (rating needs check-in)
- Phase 4 independent (can parallel with Phase 3)
- Phase 5 independent (can parallel with Phase 3/4)
- Clear dependency graph in implementation plan

---

## ✅ Success Metrics

### **Phase 1 Success:**
- [ ] Status field added to TripItemResponse
- [ ] PATCH endpoint integrated
- [ ] React Query hook created and tested
- [ ] Status updates reflect in UI

### **Phase 2 Success:**
- [ ] Check-in button functional offline
- [ ] Queue syncs when network returns
- [ ] Undo check-in works
- [ ] Touch targets >= 44px
- [ ] No crashes in airplane mode

### **Phase 3 Success:**
- [ ] Rating modal only shows when CHECKED_IN
- [ ] Stars display correct yellow gradient
- [ ] Review saves successfully
- [ ] Can edit rating anytime after initial submit
- [ ] Rating displays on card

### **Phase 4 Success:**
- [ ] Trip item dropdown populated
- [ ] Receipt upload works (max 3)
- [ ] Paid by defaults to current user
- [ ] Paid at defaults to now
- [ ] All new fields save to backend

### **Phase 5 Success:**
- [ ] Permission modal clear and non-scary
- [ ] Geofencing registers for today only
- [ ] Notification fires at 1km
- [ ] Task stops when trip completes
- [ ] Manual check-in works without background permission

### **Phase 6 Success:**
- [ ] No crashes on edge cases
- [ ] Graceful offline behavior
- [ ] All interactions < 100ms feedback
- [ ] Accessibility audit passes
- [ ] Performance acceptable (60fps scrolling)

---

## 📊 Development Estimates

| Phase | Description | Days | LOC | Complexity |
|-------|-------------|------|-----|------------|
| 1 | Status Management | 2 | 250 | Low |
| 2 | Check-in UI & Queue | 2 | 350 | Medium |
| 3 | Rating & Review | 2 | 300 | Medium |
| 4 | Enhanced Expenses | 3 | 400 | Medium-High |
| 5 | Geofencing | 3 | 350 | High |
| 6 | Polish & Edge Cases | 2 | 200 | Low-Medium |
| **TOTAL** | | **14 days** | **~1850** | |

**Assumptions:**
- 1 developer, full-time
- Backend APIs ready (status endpoint exists)
- No major blockers
- Includes testing time per phase

**Parallelization Potential:**
- Phase 3 & 4 can run in parallel (2 devs → save 3 days)
- Phase 5 can start after Phase 2 (background task independent of rating/expenses)
- **Optimized Timeline:** 11 days with 2 developers

---

## 🎯 Next Steps

1. **Get User Approval** on phased approach ✅ (you're reading this)
2. **Create Detailed Implementation Plan** using `/plan` command
3. **Set Up Phase 1 Branch** (`feat/trip-item-status-management`)
4. **Begin Phase 1 Development** (2 days)
5. **PR Review & Merge** (1 day)
6. **Repeat for Phases 2-6**

---

## 🔗 Dependencies & Prerequisites

**External Packages (Already Installed):**
- ✅ `@react-native-async-storage/async-storage`
- ✅ `expo-image-picker`
- ✅ `@tanstack/react-query`
- ✅ `react-native-keyboard-aware-scroll-view`

**New Packages Required:**
- [ ] `expo-location` (Phase 5)
- [ ] `expo-task-manager` (Phase 5)
- [ ] `expo-notifications` (Phase 5)

**Backend Requirements:**
- ✅ PATCH `/api/v1/itineraries/{itineraryId}/items/{tripItemId}/status`
- ✅ Fields: `status`, `rating`, `review` (backend confirmed ready)
- ✅ Expense fields: `trip_item_id`, `receipt_image_urls`, `paid_by`, `paid_at`
- ✅ GET `/api/v1/itineraries/{itineraryId}/expenses/summary`
- ✅ GET `/api/v1/itineraries/{itineraryId}/expenses?paidById={uuid}`

---

## 📝 Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Rating Timing** | After check-in, editable anytime | Max flexibility for users |
| **Expense Linking** | Optional (trip_item_id nullable) | Supports general expenses (e.g., visiting relatives) |
| **Geofencing Scope** | Current day only | Battery conservation, avoid spam notifications |
| **Receipt Limit** | Max 3 images | Balance storage cost vs. user needs |
| **Offline Queue** | AsyncStorage + Background Retry | Simple, reliable, no external deps |
| **Rating Display** | Yellow stars, increasing saturation | User requested, visually intuitive |
| **Rating Trigger** | Button on checked-in card | Non-invasive, user-controlled |
| **Backend API** | Use existing PATCH status endpoint | Reuse infrastructure, less backend work |

---

## 🧠 Architectural Principles Applied

### **YAGNI (You Aren't Gonna Need It)**
- No over-engineered queue system (AsyncStorage sufficient)
- No complex state machine for status (simple string enum)
- No premature optimization (profile first if slow)

### **KISS (Keep It Simple, Stupid)**
- Phased approach (small, testable units)
- Reuse existing `uploadImage` for receipts
- Leverage React Query for caching/invalidation

### **DRY (Don't Repeat Yourself)**
- Single `updateTripItemStatus` function for all status changes
- Reuse `TripItemCard` component with prop variations
- Common `checkinQueue` utility for offline sync

---

**End of Brainstorm Report**

*Ready for implementation plan creation via `/plan` command.*
