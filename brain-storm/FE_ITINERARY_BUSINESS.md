# Itinerary Module - Tài liệu Business & Hướng dẫn FE Implementation (React Native)

> **Mục đích**: Tài liệu toàn diện về module Itinerary cho FE team phát triển ứng dụng React Native, bao gồm business logic, user flows, Redux architecture, component patterns, và UX best practices.

---

## 1. Business Concept & Goals

### 1.1. Khái niệm

Module **Itinerary (Lịch trình)** là trái tim của ứng dụng TripJoy - nơi người dùng lên kế hoạch, quản lý và theo dõi chuyến đi của mình. Module hỗ trợ 2 cách tạo lịch trình:

1. **AI Generation**: AI tự động tạo lịch trình chi tiết dựa trên điểm đến, ngày đi, ngân sách
2. **Manual Creation**: Người dùng tự tạo và tùy chỉnh từng chi tiết

### 1.2. Tính năng chính

- ✅ **Tạo lịch trình** (AI hoặc thủ công)
- ✅ **Quản lý trip items** (điểm tham quan theo timeline)
- ✅ **Theo dõi chi phí** (budget vs actual)
- ✅ **Favorite** lịch trình
- ✅ **Collaboration** (group itineraries)
- ✅ **AI Modify** (thay thế địa điểm bằng AI)
- ✅ **Travel Notebook** (hướng dẫn du lịch AI)

### 1.3. Business Goals

- Giảm thời gian lên kế hoạch từ vài giờ xuống **< 5 phút** với AI
- Tăng engagement qua tính năng collaboration
- Cải thiện UX với real-time updates và intuitive mobile interface
- Giúp người dùng kiểm soát ngân sách tốt hơn

---

## 2. User Personas

### Persona 1: **Solo Traveler** (Du khách độc lập)
- **Nhu cầu**: Lên kế hoạch nhanh, linh hoạt, budget-conscious
- **Use case**: Tạo lịch bằng AI, tự điều chỉnh theo ý thích
- **Pain points**: Không biết nên đi đâu, làm gì ở điểm đến mới

### Persona 2: **Group Organizer** (Người tổ chức nhóm)
- **Nhu cầu**: Quản lý lịch trình phức tạp, phối hợp nhiều người
- **Use case**: Tạo lịch cho group, mời thành viên, chia sẻ chi phí
- **Pain points**: Khó đồng bộ thông tin, theo dõi ai đã thanh toán

### Persona 3: **Experience Collector** (Người sưu tập trải nghiệm)
- **Nhu cầu**: Lưu lại những chuyến đi, favorite các điểm đến hay
- **Use case**: Browse lịch cũ, favorite itineraries từ người khác
- **Pain points**: Quên chi tiết chuyến đi, khó tìm lại thông tin

---

## 3. Feature Overview

| Feature | Mô tả | Priority | Complexity |
|---------|-------|----------|------------|
| AI Generation | Tạo lịch tự động bằng AI | 🔥 Critical | High |
| Manual Creation | Tạo lịch thủ công | 🔥 Critical | Medium |
| Trip Items Management | Quản lý điểm trong lịch trình | 🔥 Critical | High |
| Expense Tracking | Theo dõi chi phí | ⚡ High | Medium |
| Favorites | Lưu lịch yêu thích | ⚡ High | Low |
| Group Collaboration | Chia sẻ lịch với group | ⚡ High | Medium |
| AI Modify | Thay thế địa điểm bằng AI | ⭐ Medium | High |
| Travel Notebook | Hướng dẫn du lịch AI | ⭐ Medium | Low |

---

## 4. Detailed User Flows

### 4.1. AI Generation Flow (Async với Polling)

```
[User] Nhấn "Create with AI"
   ↓
[Screen] AIGenerateScreen
   ↓
[User] Nhập: Destination, Dates, Budget, Themes
   ↓
[Action] Dispatch generateItinerary() → POST /api/v1/itineraries/ai-generate
   ↓
[Response] 202 Accepted + itineraryId, status: GENERATING
   ↓
[UI] Show LoadingScreen với progress indicator
   ↓
[RTK Query] Auto-polling với pollingInterval: 2000ms
   │   GET /api/v1/itineraries/{id} every 2s
   ↓
[Backend] AI đang xử lý (10-30s)
   ↓
┌─── Status: GENERATING → Continue polling
│
├─── Status: DRAFT (Success!)
│      ↓
│    [UI] Navigate → ItineraryDetailScreen
│      ↓
│    [Animation] Success celebration 🎉
│
└─── Status: FAILED
       ↓
     [UI] Show ErrorScreen với options:
       - Retry (gọi lại AI)
       - Create manually (fallback)
       - Cancel
```

**Key Points:**
- **Async pattern**: Không block UI, user có thể back về home
- **Polling**: RTK Query tự động poll đến khi không còn `GENERATING`
- **Error recovery**: 3 options khi fail

---

### 4.2. Manual Creation Flow

```
[User] Nhấn "Create Manually"
   ↓
[Screen] CreateItineraryScreen (Step-by-step form)
   │
   ├─ Step 1: Basic Info
   │    - Name (required)
   │    - Description
   │    - Dates (start_date, end_date) ✅ Date validation
   │    - People quantity
   │    - Budget estimate
   │
   ├─ Step 2: Destination (Optional)
   │    - Search location từ module Location
   │    - Chọn themes (Beach, Food, Culture, etc.)
   │
   └─ Step 3: Group (Optional)
       - Link to existing group
       - Or create individual trip
   ↓
[Action] Dispatch createItinerary() → POST /api/v1/itineraries
   ↓
[Response] 200 OK + ItineraryResponse
   ↓
[UI] Navigate → ItineraryDetailScreen
   ↓
[Toast] "Itinerary created! Add your first trip item"
```

**Validation Rules:**
- Name: required, max 255 chars
- Dates: start_date < end_date
- Budget: >= 0
- People: > 0 if provided

---

### 4.3. View Itinerary Detail Flow

```
[User] Tap itinerary từ list
   ↓
[Screen] ItineraryDetailScreen
   │
   ├─ Header Section
   │    - Title, dates, status badge
   │    - Favorite button (❤️)
   │    - Edit button (✏️)
   │    - Share button (for groups)
   │
   ├─ Tab: Overview
   │    - Description
   │    - Destination info
   │    - People quantity
   │    - Budget overview (estimate vs actual)
   │    - Themes tags
   │
   ├─ Tab: Timeline (Default)
   │    - Map view (Google Maps) showing all locations
   │    - Trip items sorted by start_time
   │    - Each item: Location, Time, Duration, Note
   │    - FAB: "Add Trip Item" ➕
   │
   ├─ Tab: Expenses
   │    - Budget bar (spent/total)
   │    - List of expenses by category
   │    - Each expense: Name, Amount, User, Date
   │    - FAB: "Add Expense" 💰
   │
   └─ Tab: Travel Guide
       - Link to Travel Notebook (if exists)
       - Button: "Generate AI Guide"
```

**Interactive Elements:**
- Swipeable tabs (React Native Tab View)
- Pull-to-refresh on all tabs
- Long-press on trip item → Quick actions menu
- Tap expense → Edit modal

---

### 4.4. Add Trip Item Flow

```
[User] Nhấn FAB "Add Trip Item" từ Timeline tab
   ↓
[Screen] AddTripItemScreen
   │
   ├─ Select Location (Required)
   │    - Search từ Location module
   │    - Hiển thị: Name, Address, Category, Icon
   │    - Preview on mini map
   │
   ├─ Set Time (Required)
   │    - Start time picker (date + time)
   │    - Duration picker (hours + minutes)
   │    - Auto-calculate end time
   │
   └─ Add Note (Optional)
       - Multiline text input
       - Max 500 chars
   ↓
[Action] Dispatch addTripItem() → POST /api/v1/itineraries/{id}/items
   ↓
[Response] 200 OK + TripItemResponse
   ↓
[Redux] Invalidate 'TripItems' tag → Auto refetch list
   ↓
[UI] Navigate back → Timeline updated with new item
   ↓
[Map] Animate to new location pin
```

**UX Enhancements:**
- **Smart suggestions**: Suggest time slots based on existing items
- **Conflict detection**: Warn if time overlaps with other items
- **Map integration**: Show all existing items + new item preview

---

### 4.5. Expense Tracking Flow

```
[User] Nhấn FAB "Add Expense" từ Expenses tab
   ↓
[Screen] AddExpenseScreen (Modal or Bottom Sheet)
   │
   ├─ Name (Required) - "Dinner at Beach Restaurant"
   ├─ Amount (Required) - Number input with currency
   ├─ Category (Optional) - Dropdown:
   │    [Food, Hotel, Transport, Activities, Shopping, Other]
   ├─ Payment Method (Optional) - Dropdown:
   │    [Cash, Card, E-wallet, Bank Transfer]
   └─ Description (Optional) - Multiline text
   ↓
[Action] Dispatch addExpense() → POST /api/v1/itineraries/{id}/expenses
   ↓
[Response] 200 OK + ExpenseResponse (includes user info)
   ↓
[Redux] Invalidate 'Expenses' tag → Auto refetch
   ↓
[UI] Dismiss modal → Expenses list updated
   ↓
[Animation] Budget bar animates to new percentage
   ↓
[Notification] If budget exceeded → Show warning
```

**Budget Monitoring:**
- Green bar: < 80% budget
- Yellow bar: 80-100% budget  
- Red bar: > 100% budget (overspent)
- Push notification khi sắp hết budget (90%, 100%, 110%)

---

### 4.6. Favorite/Unfavorite Flow

```
[User] Tap ❤️ icon trên itinerary card hoặc detail screen
   ↓
[Current State] isFavorited: false
   ↓
[Action] Dispatch favoriteItinerary() → POST /api/v1/itineraries/{id}/favorites
   ↓
[Optimistic Update] Redux immediately sets isFavorited: true
   ↓
[UI] Icon changes: ❤️ (filled red) + haptic feedback
   ↓
[Response] 200 OK
   ↓
[Redux] Invalidate 'Favorites' tag → Refetch favorites list

─── Unfavorite (reverse flow) ───
[Action] DELETE /api/v1/itineraries/{id}/favorites
   ↓
[Optimistic Update] isFavorited: false
   ↓
[UI] Icon changes: ♡ (outline)
```

**Optimistic UI:**
- Update UI trước khi API response
- Rollback nếu request fails
- Haptic feedback cho instant feel

---

### 4.7. Browse My Trips Flow

```
[User] Mở app → ItineraryListScreen (Home)
   ↓
[Tab] "My Trips" (Default active)
   ↓
[RTK Query] useGetMyItinerariesQuery() → GET /api/v1/itineraries/me
   ↓
[Redux Cache] Check cache (5 minutes TTL)
   │
   ├─ Cache HIT → Render immediately from cache
   │
   └─ Cache MISS → Fetch from API
   ↓
[UI] Render list với states:
   │
   ├─ Loading: Skeleton cards (3-4 placeholders)
   │
   ├─ Empty: EmptyState component
   │    - Illustration
   │    - "Start planning your first trip!"
   │    - CTA: "Create with AI" / "Create Manually"
   │
   └─ Success: FlatList của ItineraryCard
       │
       ├─ Each card:
       │    - Cover image (from destination or first location)
       │    - Title, dates
       │    - Status badge (DRAFT, CONFIRMED, IN_PROGRESS, COMPLETED)
       │    - Budget progress (if has expenses)
       │    - Favorite icon
       │    - Group badge (if group_id exists)
       │
       └─ Pull-to-refresh → Refetch
```

**Sorting Options:**
- Default: Upcoming trips first (by start_date ASC)
- Toggle: Past trips (by start_date DESC)
- Filter by status: [All, Draft, Confirmed, In Progress, Completed]

---

### 4.8. Error Handling & Recovery

#### Case 1: Network Error (No Internet)
```
[Trigger] Any API call fails với network error
   ↓
[UI] Show inline error banner:
   "⚠️ No internet connection. Some features may be unavailable."
   ↓
[Behavior] 
   - Disable create/edit actions
   - Show cached data (if available)
   - Show "Retry" button
   ↓
[User] Tap "Retry"
   ↓
[Action] Re-trigger failed request
```

#### Case 2: AI Generation Failed
```
[Trigger] Polling returns status: FAILED
   ↓
[Screen] AIGenerationErrorScreen
   │
   ├─ Icon: ❌ or 😢
   ├─ Title: "Couldn't generate itinerary"
   ├─ Message: "AI service is busy. Please try again."
   │
   └─ Actions:
       ├─ "Retry with AI" → Call generateItinerary() again
       ├─ "Create Manually" → Navigate to CreateItineraryScreen
       └─ "Cancel" → Navigate back to home
```

#### Case 3: Validation Error (400 Bad Request)
```
[Trigger] createItinerary() returns 400 + validation errors
   ↓
[Response] { "code": 1001, "message": "Validation failed", "errors": {...} }
   ↓
[Redux] Parse errors, update form state
   ↓
[UI] Show inline field errors:
   - "Name is required"
   - "End date must be after start date"
   - Highlight invalid fields với red border
```

#### Case 4: Permission Error (403 Forbidden)
```
[Trigger] User tries to edit itinerary they don't own
   ↓
[Response] 403 Forbidden
   ↓
[UI] Alert modal:
   "❌ Access Denied"
   "You don't have permission to edit this itinerary."
   [OK] → Navigate back
```

---

## 5. Redux Store Architecture (RTK Query)

### 5.1. API Slice Setup

```typescript
// store/api/itineraryApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getAccessToken } from '@/utils/auth';

export const itineraryApi = createApi({
  reducerPath: 'itineraryApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.tripjoy.com/api/v1',
    prepareHeaders: async (headers) => {
      const token = await getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  
  tagTypes: ['Itinerary', 'TripItems', 'Expenses', 'Favorites'],
  
  endpoints: (builder) => ({
    
    // 🔥 AI Generation (với polling)
    generateItinerary: builder.mutation({
      query: (data: GenerateItineraryRequest) => ({
        url: '/itineraries/ai-generate',
        method: 'POST',
        body: data, // camelCase body
      }),
      invalidatesTags: ['Itinerary'],
    }),
    
    // 📊 Get itinerary với polling support
    getItinerary: builder.query({
      query: (id: string) => `/itineraries/${id}`,
      providesTags: (result, error, id) => [{ type: 'Itinerary', id }],
      // Auto-polling khi status = GENERATING
      async onCacheEntryAdded(
        id,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }
      ) {
        try {
          await cacheDataLoaded;
          const { data } = getState().itineraryApi.queries[`getItinerary("${id}")`];
          
          if (data?.status === 'GENERATING') {
            // Poll every 2 seconds
            const interval = setInterval(async () => {
              const response = await fetch(`/api/v1/itineraries/${id}`);
              const updated = await response.json();
              
              updateCachedData((draft) => {
                Object.assign(draft, updated.data);
              });
              
              // Stop polling when done
              if (updated.data.status !== 'GENERATING') {
                clearInterval(interval);
              }
            }, 2000);
            
            await cacheEntryRemoved;
            clearInterval(interval);
          }
        } catch {}
      },
    }),
    
    // 📝 CRUD Operations
    createItinerary: builder.mutation({
      query: (data: ItineraryRequest) => ({
        url: '/itineraries',
        method: 'POST',
        body: data, // snake_case body (BE mapping)
      }),
      invalidatesTags: ['Itinerary'],
    }),
    
    updateItinerary: builder.mutation({
      query: ({ id, data }: { id: string; data: ItineraryRequest }) => ({
        url: `/itineraries/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Itinerary', id }],
    }),
    
    deleteItinerary: builder.mutation({
      query: (id: string) => ({
        url: `/itineraries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Itinerary'],
    }),
    
    // 📋 Lists
    getMyItineraries: builder.query({
      query: () => '/itineraries/me',
      providesTags: ['Itinerary'],
    }),
    
    getMyFavoriteItineraries: builder.query({
      query: () => '/itineraries/favorites',
      providesTags: ['Favorites'],
    }),
    
    // ❤️ Favorites
    favoriteItinerary: builder.mutation({
      query: (id: string) => ({
        url: `/itineraries/${id}/favorites`,
        method: 'POST',
      }),
      // Optimistic update
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          itineraryApi.util.updateQueryData('getItinerary', id, (draft) => {
            // Assume isFavorited field trong response
            draft.isFavorited = true;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['Favorites'],
    }),
    
    unfavoriteItinerary: builder.mutation({
      query: (id: string) => ({
        url: `/itineraries/${id}/favorites`,
        method: 'DELETE',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          itineraryApi.util.updateQueryData('getItinerary', id, (draft) => {
            draft.isFavorited = false;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['Favorites'],
    }),
    
    // 🗺️ Trip Items
    addTripItem: builder.mutation({
      query: ({ itineraryId, data }: { itineraryId: string; data: TripItemRequest }) => ({
        url: `/itineraries/${itineraryId}/items`,
        method: 'POST',
        body: data, // snake_case
      }),
      invalidatesTags: (result, error, { itineraryId }) => [
        { type: 'TripItems', id: itineraryId },
      ],
    }),
    
    getTripItems: builder.query({
      query: (itineraryId: string) => `/itineraries/${itineraryId}/items`,
      providesTags: (result, error, itineraryId) => [
        { type: 'TripItems', id: itineraryId },
      ],
    }),
    
    updateTripItem: builder.mutation({
      query: ({ itineraryId, itemId, data }) => ({
        url: `/itineraries/${itineraryId}/items/${itemId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { itineraryId }) => [
        { type: 'TripItems', id: itineraryId },
      ],
    }),
    
    removeTripItem: builder.mutation({
      query: ({ itineraryId, itemId }) => ({
        url: `/itineraries/${itineraryId}/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { itineraryId }) => [
        { type: 'TripItems', id: itineraryId },
      ],
    }),
    
    // 💰 Expenses
    addExpense: builder.mutation({
      query: ({ itineraryId, data }: { itineraryId: string; data: ExpenseRequest }) => ({
        url: `/itineraries/${itineraryId}/expenses`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { itineraryId }) => [
        { type: 'Expenses', id: itineraryId },
      ],
    }),
    
    getExpenses: builder.query({
      query: (itineraryId: string) => `/itineraries/${itineraryId}/expenses`,
      providesTags: (result, error, itineraryId) => [
        { type: 'Expenses', id: itineraryId },
      ],
    }),
    
    updateExpense: builder.mutation({
      query: ({ itineraryId, expenseId, data }) => ({
        url: `/itineraries/${itineraryId}/expenses/${expenseId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { itineraryId }) => [
        { type: 'Expenses', id: itineraryId },
      ],
    }),
    
    removeExpense: builder.mutation({
      query: ({ itineraryId, expenseId }) => ({
        url: `/itineraries/${itineraryId}/expenses/${expenseId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { itineraryId }) => [
        { type: 'Expenses', id: itineraryId },
      ],
    }),
    
  }),
});

export const {
  useGenerateItineraryMutation,
  useGetItineraryQuery,
  useCreateItineraryMutation,
  useUpdateItineraryMutation,
  useDeleteItineraryMutation,
  useGetMyItinerariesQuery,
  useGetMyFavoriteItinerariesQuery,
  useFavoriteItineraryMutation,
  useUnfavoriteItineraryMutation,
  useAddTripItemMutation,
  useGetTripItemsQuery,
  useUpdateTripItemMutation,
  useRemoveTripItemMutation,
  useAddExpenseMutation,
  useGetExpensesQuery,
  useUpdateExpenseMutation,
  useRemoveExpenseMutation,
} = itineraryApi;
```

### 5.2. Store Configuration

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { itineraryApi } from './api/itineraryApi';

export const store = configureStore({
  reducer: {
    [itineraryApi.reducerPath]: itineraryApi.reducer,
    // Add other slices here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(itineraryApi.middleware),
});

// Enable refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

## 6. Screen Architecture & Navigation

### 6.1. Navigation Stack

```typescript
// navigation/ItineraryNavigator.tsx
import { createStackNavigator } from '@react-navigation/stack';

export type ItineraryStackParamList = {
  ItineraryList: undefined;
  ItineraryDetail: { itineraryId: string };
  CreateItinerary: undefined;
  AIGenerate: undefined;
  AIGenerating: { itineraryId: string }; // Polling screen
  EditItinerary: { itineraryId: string };
  AddTripItem: { itineraryId: string };
  EditTripItem: { itineraryId: string; itemId: string };
  LocationSearch: { 
    onSelect: (location: Location) => void;
    excludeIds?: string[]; // Exclude already added locations
  };
  AddExpense: { itineraryId: string };
  EditExpense: { itineraryId: string; expenseId: string };
  ExpenseList: { itineraryId: string };
};

const Stack = createStackNavigator<ItineraryStackParamList>();

export const ItineraryNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerBackTitleVisible: false,
      gestureEnabled: true,
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    }}
  >
    <Stack.Screen 
      name="ItineraryList" 
      component={ItineraryListScreen}
      options={{ title: 'My Trips' }}
    />
    <Stack.Screen 
      name="ItineraryDetail" 
      component={ItineraryDetailScreen}
      options={{ headerTransparent: true, title: '' }} // Custom header in screen
    />
    <Stack.Screen 
      name="CreateItinerary" 
      component={CreateItineraryScreen}
      options={{ presentation: 'modal', title: 'Create Trip' }}
    />
    <Stack.Screen 
      name="AIGenerate" 
      component={AIGenerateScreen}
      options={{ presentation: 'modal', title: 'AI Trip Planner' }}
    />
    <Stack.Screen 
      name="AIGenerating" 
      component={AIGeneratingScreen}
      options={{ 
        headerShown: false, 
        gestureEnabled: false, // Prevent back during generation
      }}
    />
    {/* ... other screens */}
  </Stack.Navigator>
);
```

### 6.2. Screen Components Overview

#### ItineraryListScreen
```typescript
interface ItineraryListScreenProps {
  navigation: StackNavigationProp<ItineraryStackParamList, 'ItineraryList'>;
}

const ItineraryListScreen: React.FC<ItineraryListScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'my' | 'favorites'>('my');
  const { data: myTrips, isLoading: isLoadingMy, refetch: refetchMy } = useGetMyItinerariesQuery();
  const { data: favorites, isLoading: isLoadingFav, refetch: refetchFav } = useGetMyFavoriteItinerariesQuery();
  
  // Components:
  // - Top Tab Bar (My Trips | Favorites)
  // - FAB: Create button (with submenu: AI / Manual)
  // - FlatList of ItineraryCard
  // - EmptyState (if no trips)
  // - Pull-to-refresh
};
```

#### ItineraryDetailScreen
```typescript
interface ItineraryDetailScreenProps {
  route: RouteProp<ItineraryStackParamList, 'ItineraryDetail'>;
  navigation: StackNavigationProp<ItineraryStackParamList, 'ItineraryDetail'>;
}

const ItineraryDetailScreen: React.FC<ItineraryDetailScreenProps> = ({ route, navigation }) => {
  const { itineraryId } = route.params;
  const { data: itinerary, isLoading } = useGetItineraryQuery(itineraryId);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'expenses' | 'guide'>('timeline');
  
  // Components:
  // - Custom Header (with cover image, title overlay)
  // - Action Bar (Favorite, Share, Edit buttons)
  // - Tab View (4 tabs)
  // - FAB per tab (Add Trip Item / Add Expense)
};
```

#### AIGeneratingScreen (Polling Screen)
```typescript
interface AIGeneratingScreenProps {
  route: RouteProp<ItineraryStackParamList, 'AIGenerating'>;
  navigation: StackNavigationProp<ItineraryStackParamList, 'AIGenerating'>;
}

const AIGeneratingScreen: React.FC<AIGeneratingScreenProps> = ({ route, navigation }) => {
  const { itineraryId } = route.params;
  
  // 🔥 RTK Query with polling
  const { data: itinerary, isLoading, isError } = useGetItineraryQuery(itineraryId, {
    pollingInterval: 2000, // Poll every 2 seconds
    skip: false,
  });
  
  // Watch status changes
  useEffect(() => {
    if (itinerary?.status === 'DRAFT') {
      // Success!
      navigation.replace('ItineraryDetail', { itineraryId });
    } else if (itinerary?.status === 'FAILED') {
      // Failed
      navigation.replace('AIGenerateError', { itineraryId });
    }
  }, [itinerary?.status]);
  
  // Components:
  // - Animated loader (Lottie animation)
  // - Progress messages: "Analyzing destination...", "Finding best spots...", "Creating timeline..."
  // - Cancel button (navigate back, optional DELETE itinerary)
};
```

---

## 7. Component Architecture (Reusable)

### 7.1. ItineraryCard
```typescript
interface ItineraryCardProps {
  itinerary: ItineraryResponse;
  onPress: () => void;
  onFavoritePress: () => void;
  showGroupBadge?: boolean;
}

const ItineraryCard: React.FC<ItineraryCardProps> = ({
  itinerary,
  onPress,
  onFavoritePress,
  showGroupBadge = true,
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      {/* Cover Image */}
      <Image source={{ uri: itinerary.coverImage }} style={styles.cover} />
      
      {/* Badges Overlay */}
      <View style={styles.badges}>
        <StatusBadge status={itinerary.status} />
        {showGroupBadge && itinerary.group_id && <GroupBadge />}
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{itinerary.title}</Text>
        <Text style={styles.dates}>
          {formatDateRange(itinerary.start_date, itinerary.end_date)}
        </Text>
        
        {/* Budget Progress (if has expenses) */}
        {itinerary.budgetEstimate && (
          <BudgetProgress 
            estimate={itinerary.budgetEstimate}
            actual={itinerary.totalExpenses}
          />
        )}
      </View>
      
      {/* Favorite Button */}
      <TouchableOpacity 
        style={styles.favoriteBtn}
        onPress={onFavoritePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon 
          name={itinerary.isFavorited ? 'heart' : 'heart-outline'} 
          size={24}
          color={itinerary.isFavorited ? '#FF4444' : '#888'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};
```

### 7.2. StatusBadge
```typescript
interface StatusBadgeProps {
  status: ItineraryStatus;
  size?: 'small' | 'medium';
}

const STATUS_CONFIG = {
  GENERATING: { label: 'Generating...', color: '#3B82F6', icon: 'sync' },
  FAILED: { label: 'Failed', color: '#EF4444', icon: 'alert-circle' },
  DRAFT: { label: 'Draft', color: '#9CA3AF', icon: 'document-text' },
  CONFIRMED: { label: 'Confirmed', color: '#10B981', icon: 'checkmark-circle' },
  IN_PROGRESS: { label: 'In Progress', color: '#F59E0B', icon: 'airplane' },
  COMPLETED: { label: 'Completed', color: '#6366F1', icon: 'flag' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'small' }) => {
  const config = STATUS_CONFIG[status];
  
  return (
    <View style={[styles.badge, { backgroundColor: config.color }]}>
      <Icon name={config.icon} size={size === 'small' ? 12 : 16} color="#FFF" />
      <Text style={styles.badgeText}>{config.label}</Text>
    </View>
  );
};
```

### 7.3. TripItemCard (Timeline Item)
```typescript
interface TripItemCardProps {
  item: TripItemResponse;
  onPress: () => void;
  onLongPress: () => void; // Quick actions
  isFirst?: boolean;
  isLast?: boolean;
}

const TripItemCard: React.FC<TripItemCardProps> = ({
  item,
  onPress,
  onLongPress,
  isFirst,
  isLast,
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.container}
    >
      {/* Timeline indicator */}
      <View style={styles.timeline}>
        {!isFirst && <View style={styles.lineTop} />}
        <View style={styles.dot} />
        {!isLast && <View style={styles.lineBottom} />}
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {/* Time */}
        <Text style={styles.time}>
          {formatTime(item.start_time)} 
          {item.duration && ` • ${formatDuration(item.duration)}`}
        </Text>
        
        {/* Location */}
        <View style={styles.location}>
          <Image 
            source={{ uri: getCategoryIcon(item.location.poi_categories) }}
            style={styles.icon}
          />
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{item.location.name}</Text>
            <Text style={styles.locationAddress}>
              {item.location.full_address}
            </Text>
          </View>
        </View>
        
        {/* Note (if exists) */}
        {item.note && (
          <Text style={styles.note} numberOfLines={2}>
            {item.note}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};
```

### 7.4. ExpenseCard
```typescript
interface ExpenseCardProps {
  expense: ExpenseResponse;
  onPress: () => void;
  showUser?: boolean; // For group itineraries
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({ 
  expense, 
  onPress,
  showUser = false,
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      {/* Icon based on category */}
      <View style={[styles.iconContainer, { backgroundColor: getCategoryColor(expense.type) }]}>
        <Icon name={getCategoryIcon(expense.type)} size={24} color="#FFF" />
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name}>{expense.name}</Text>
        <View style={styles.meta}>
          {expense.type && <Text style={styles.category}>{expense.type}</Text>}
          {expense.method && <Text style={styles.method}>• {expense.method}</Text>}
        </View>
        {showUser && (
          <Text style={styles.user}>by {expense.user.fullName}</Text>
        )}
      </View>
      
      {/* Amount */}
      <Text style={styles.amount}>
        {formatCurrency(expense.amount)}
      </Text>
    </TouchableOpacity>
  );
};
```

### 7.5. BudgetProgress
```typescript
interface BudgetProgressProps {
  estimate: number;
  actual: number;
}

const BudgetProgress: React.FC<BudgetProgressProps> = ({ estimate, actual }) => {
  const percentage = (actual / estimate) * 100;
  const color = percentage < 80 ? '#10B981' : percentage < 100 ? '#F59E0B' : '#EF4444';
  
  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.labels}>
        <Text style={styles.actual}>{formatCurrency(actual)}</Text>
        <Text style={styles.estimate}>of {formatCurrency(estimate)}</Text>
      </View>
      {percentage > 100 && (
        <Text style={styles.overBudget}>
          ⚠️ {formatCurrency(actual - estimate)} over budget
        </Text>
      )}
    </View>
  );
};
```

---

## 8. State Management Patterns

### 8.1. Form State (Create/Edit Itinerary)

```typescript
// hooks/useItineraryForm.ts
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  name: yup.string().required('Name is required').max(255),
  description: yup.string().max(1000),
  start_date: yup.date().required('Start date is required'),
  end_date: yup.date()
    .required('End date is required')
    .min(yup.ref('start_date'), 'End date must be after start date'),
  people_quantity: yup.number().positive().integer().nullable(),
  budget_estimate: yup.number().min(0).nullable(),
}).required();

export const useItineraryForm = (initialData?: Partial<ItineraryRequest>) => {
  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      start_date: initialData?.start_date || null,
      end_date: initialData?.end_date || null,
      people_quantity: initialData?.people_quantity || null,
      budget_estimate: initialData?.budget_estimate || null,
      themes: initialData?.themes || [],
      group_id: initialData?.group_id || null,
    },
  });
  
  return { control, handleSubmit, errors, watch, setValue };
};
```

### 8.2. Loading States

```typescript
// components/ItineraryDetailScreen.tsx
const ItineraryDetailScreen = ({ route }) => {
  const { itineraryId } = route.params;
  const { data, isLoading, isError, error, refetch } = useGetItineraryQuery(itineraryId);
  
  if (isLoading) {
    return <SkeletonLoader type="itinerary-detail" />;
  }
  
  if (isError) {
    return (
      <ErrorState 
        message={error?.message || 'Failed to load itinerary'}
        onRetry={refetch}
      />
    );
  }
  
  if (!data) {
    return <EmptyState message="Itinerary not found" />;
  }
  
  return <ItineraryContent itinerary={data} />;
};
```

### 8.3. Optimistic Updates (Favorite)

```typescript
// hooks/useFavoriteItinerary.ts
export const useFavoriteItinerary = () => {
  const [favorite] = useFavoriteItineraryMutation();
  const [unfavorite] = useUnfavoriteItineraryMutation();
  
  const toggleFavorite = async (itineraryId: string, currentState: boolean) => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      if (currentState) {
        await unfavorite(itineraryId).unwrap();
      } else {
        await favorite(itineraryId).unwrap();
      }
    } catch (error) {
      // Optimistic update will auto-rollback on error
      Alert.alert('Error', 'Failed to update favorite');
    }
  };
  
  return { toggleFavorite };
};
```

---

## 9. Error Handling & Edge Cases

### 9.1. Network Error Handling

```typescript
// utils/errorHandler.ts
export const handleApiError = (error: any): string => {
  if (error.status === 'FETCH_ERROR') {
    return 'No internet connection. Please check your network.';
  }
  
  if (error.status === 400) {
    return error.data?.message || 'Invalid request';
  }
  
  if (error.status === 401) {
    // Token expired - trigger refresh
    return 'Session expired. Please log in again.';
  }
  
  if (error.status === 403) {
    return 'You don\'t have permission to perform this action.';
  }
  
  if (error.status === 404) {
    return 'Resource not found';
  }
  
  if (error.status === 500) {
    return 'Server error. Please try again later.';
  }
  
  return 'Something went wrong. Please try again.';
};
```

### 9.2. Validation Error Display

```typescript
// components/FormField.tsx
interface FormFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  error?: FieldError;
  // ... other props
}

const FormField: React.FC<FormFieldProps> = ({ control, name, label, error, ...props }) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <TextInput
          value={value}
          onChangeText={onChange}
          style={[styles.input, error && styles.inputError]}
          {...props}
        />
      )}
    />
    {error && (
      <Text style={styles.errorText}>
        <Icon name="alert-circle" size={12} color="#EF4444" />
        {' '}{error.message}
      </Text>
    )}
  </View>
);
```

### 9.3. Edge Cases

| Edge Case | Handling Strategy |
|-----------|-------------------|
| **Empty trip items list** | Show EmptyState: "Add your first destination" + CTA button |
| **Zero expenses** | Show EmptyState: "Start tracking expenses" + CTA button |
| **Budget estimate = 0** | Don't show budget progress bar, show "Set a budget" link |
| **Very long itinerary name** | Truncate with ellipsis, show full name in detail screen |
| **Past trip (end_date < today)** | Badge "Completed", disable edit if not manually set |
| **Overlapping trip items** | Warning icon, yellow highlight, tooltip "Time conflict" |
| **AI generation timeout (>60s)** | Show "This is taking longer than usual" + Cancel option |
| **User leaves during AI generation** | Save itinerary ID, show notification when done |
| **Location without coordinates** | Fallback: show text address, disable map pin |
| **Group itinerary + no permission** | Hide Edit/Delete buttons, show "View Only" badge |

---

## 10. Performance Best Practices

### 10.1. List Optimization

```typescript
// components/ItineraryListScreen.tsx
import { FlashList } from '@shopify/flash-list';

const ItineraryListScreen = () => {
  const { data: itineraries } = useGetMyItinerariesQuery();
  
  const renderItem = useCallback(({ item }) => (
    <ItineraryCard 
      itinerary={item}
      onPress={() => navigation.navigate('ItineraryDetail', { itineraryId: item.id })}
      onFavoritePress={() => toggleFavorite(item.id, item.isFavorited)}
    />
  ), [navigation, toggleFavorite]);
  
  const keyExtractor = useCallback((item) => item.id, []);
  
  return (
    <FlashList
      data={itineraries}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={200} // Improve scroll performance
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    />
  );
};
```

### 10.2. Image Optimization

```typescript
// components/ItineraryCard.tsx
import FastImage from 'react-native-fast-image';

const ItineraryCard = ({ itinerary }) => (
  <FastImage
    source={{ 
      uri: itinerary.coverImage,
      priority: FastImage.priority.normal,
      cache: FastImage.cacheControl.immutable,
    }}
    resizeMode={FastImage.resizeMode.cover}
    style={styles.coverImage}
  />
);
```

### 10.3. Memoization

```typescript
// hooks/useItineraryStats.ts
import { useMemo } from 'react';

export const useItineraryStats = (itinerary: ItineraryResponse) => {
  const stats = useMemo(() => ({
    duration: calculateDuration(itinerary.start_date, itinerary.end_date),
    totalExpenses: itinerary.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0,
    budgetPercentage: itinerary.budgetEstimate 
      ? (totalExpenses / itinerary.budgetEstimate) * 100 
      : 0,
    tripItemsCount: itinerary.tripItems?.length || 0,
    isUpcoming: new Date(itinerary.start_date) > new Date(),
    isOngoing: isDateBetween(new Date(), itinerary.start_date, itinerary.end_date),
  }), [itinerary]);
  
  return stats;
};
```

---

## 11. UI/UX Guidelines (Mobile-First)

### 11.1. Touch Targets

**Minimum tap target**: 44x44 pt (iOS) / 48x48 dp (Android)

```typescript
// constants/spacing.ts
export const TOUCH_TARGET = {
  SMALL: 44,
  MEDIUM: 48,
  LARGE: 56,
};

// Usage
<TouchableOpacity 
  style={{ 
    width: TOUCH_TARGET.MEDIUM, 
    height: TOUCH_TARGET.MEDIUM 
  }}
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} // Expand touch area
>
  <Icon name="edit" size={20} />
</TouchableOpacity>
```

### 11.2. Thumb Reachability

**Primary actions at bottom** (easier to reach with thumb)

```
┌─────────────────────────────┐
│  Header (Read-only info)    │ ← Safe zone (top)
│                              │
│                              │
│  Content (Scrollable)        │ ← Comfortable zone
│                              │
│                              │
│                              │
│  FAB / Bottom Nav            │ ← Thumb zone (primary actions)
└─────────────────────────────┘
```

### 11.3. Loading States

**Skeleton Loaders** (better than spinners)

```typescript
// components/SkeletonLoader.tsx
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

export const ItineraryCardSkeleton = () => (
  <SkeletonPlaceholder>
    <View style={styles.card}>
      <View style={styles.image} />
      <View style={styles.content}>
        <View style={styles.title} />
        <View style={styles.subtitle} />
      </View>
    </View>
  </SkeletonPlaceholder>
);
```

### 11.4. Micro-interactions

**Haptic Feedback** cho important actions

```typescript
import * as Haptics from 'expo-haptics';

// Success action
const handleFavorite = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  toggleFavorite();
};

// Error action
const handleError = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  showError();
};

// Delete action
const handleDelete = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  deleteItinerary();
};
```

### 11.5. Spacing & Layout

```typescript
// constants/spacing.ts
export const SPACING = {
  XXS: 4,
  XS: 8,
  SM: 12,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
};

// Usage: Minimum 8-16pt between interactive elements
<View style={{ gap: SPACING.MD }}>
  <Button />
  <Button />
</View>
```

### 11.6. Status Colors

```typescript
// constants/colors.ts
export const STATUS_COLORS = {
  GENERATING: '#3B82F6', // Blue (info)
  FAILED: '#EF4444',     // Red (error)
  DRAFT: '#9CA3AF',      // Gray (neutral)
  CONFIRMED: '#10B981',  // Green (success)
  IN_PROGRESS: '#F59E0B', // Orange (warning)
  COMPLETED: '#6366F1',  // Purple (done)
};

export const BUDGET_COLORS = {
  SAFE: '#10B981',      // < 80%
  WARNING: '#F59E0B',   // 80-100%
  DANGER: '#EF4444',    // > 100%
};
```

---

## 12. API Integration Reference

Chi tiết kỹ thuật về API endpoints, request/response formats, validation rules → Xem **`FE_ITINERARY_MODULE.md`**

**Key Points:**
- Base URL: `/api/v1/itineraries`
- Auth: `Authorization: Bearer <token>`
- Response wrapper: `{ code, message, data }`
- **Snake_case** cho request body (trừ AI generate - dùng camelCase)
- **CamelCase** trong response

---

## 13. Sample Code Examples

### 13.1. Create Itinerary với AI

```typescript
// screens/AIGenerateScreen.tsx
import { useState } from 'react';
import { useGenerateItineraryMutation } from '@/store/api/itineraryApi';

const AIGenerateScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    destination: '',
    latitude: 0,
    longitude: 0,
    startDate: new Date(),
    endDate: new Date(),
    peopleQuantity: 1,
    budgetEstimate: 0,
    themes: [] as string[],
  });
  
  const [generateItinerary, { isLoading }] = useGenerateItineraryMutation();
  
  const handleGenerate = async () => {
    try {
      const result = await generateItinerary(formData).unwrap();
      
      // Navigate to polling screen
      navigation.navigate('AIGenerating', { itineraryId: result.id });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to generate itinerary');
    }
  };
  
  return (
    <View>
      {/* Form fields */}
      <Button 
        title="Generate with AI" 
        onPress={handleGenerate}
        loading={isLoading}
      />
    </View>
  );
};
```

### 13.2. Trip Items với Map

```typescript
// screens/ItineraryDetailScreen.tsx - Timeline Tab
import MapView, { Marker } from 'react-native-maps';

const TimelineTab = ({ itineraryId }) => {
  const { data: tripItems } = useGetTripItemsQuery(itineraryId);
  
  const mapRegion = useMemo(() => {
    if (!tripItems?.length) return null;
    
    // Calculate bounds to fit all markers
    const lats = tripItems.map(item => item.location.lat);
    const lngs = tripItems.map(item => item.location.lng);
    
    return {
      latitude: (Math.max(...lats) + Math.min(...lats)) / 2,
      longitude: (Math.max(...lngs) + Math.min(...lngs)) / 2,
      latitudeDelta: Math.max(...lats) - Math.min(...lats) + 0.02,
      longitudeDelta: Math.max(...lngs) - Math.min(...lngs) + 0.02,
    };
  }, [tripItems]);
  
  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView 
        style={styles.map}
        region={mapRegion}
        showsUserLocation
      >
        {tripItems?.map((item, index) => (
          <Marker
            key={item.id}
            coordinate={{ 
              latitude: item.location.lat, 
              longitude: item.location.lng 
            }}
            title={item.location.name}
            description={formatTime(item.start_time)}
          >
            <View style={styles.marker}>
              <Text style={styles.markerText}>{index + 1}</Text>
            </View>
          </Marker>
        ))}
      </MapView>
      
      {/* Timeline List */}
      <ScrollView style={styles.list}>
        {tripItems?.map((item, index) => (
          <TripItemCard
            key={item.id}
            item={item}
            isFirst={index === 0}
            isLast={index === tripItems.length - 1}
            onPress={() => navigation.navigate('EditTripItem', { 
              itineraryId, 
              itemId: item.id 
            })}
          />
        ))}
      </ScrollView>
      
      {/* FAB */}
      <FAB
        icon="add"
        onPress={() => navigation.navigate('AddTripItem', { itineraryId })}
      />
    </View>
  );
};
```

### 13.3. Expense Budget Tracking

```typescript
// components/ExpenseTab.tsx
const ExpenseTab = ({ itineraryId, budgetEstimate }) => {
  const { data: expenses } = useGetExpensesQuery(itineraryId);
  const [addExpense] = useAddExpenseMutation();
  
  const totalExpenses = useMemo(() => 
    expenses?.reduce((sum, e) => sum + e.amount, 0) || 0,
    [expenses]
  );
  
  const budgetPercentage = budgetEstimate 
    ? (totalExpenses / budgetEstimate) * 100 
    : 0;
  
  // Show notification when approaching budget
  useEffect(() => {
    if (budgetPercentage >= 90 && budgetPercentage < 100) {
      Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Budget Alert',
          body: `You've spent ${budgetPercentage.toFixed(0)}% of your budget!`,
        },
        trigger: null, // Immediate
      });
    }
  }, [budgetPercentage]);
  
  return (
    <View>
      <BudgetProgress estimate={budgetEstimate} actual={totalExpenses} />
      
      <FlatList
        data={expenses}
        renderItem={({ item }) => (
          <ExpenseCard 
            expense={item}
            onPress={() => navigation.navigate('EditExpense', { 
              itineraryId, 
              expenseId: item.id 
            })}
            showUser={isGroupItinerary}
          />
        )}
        ListHeaderComponent={() => (
          <ExpenseByCategory expenses={expenses} />
        )}
      />
      
      <FAB
        icon="add"
        label="Add Expense"
        onPress={() => setShowAddModal(true)}
      />
    </View>
  );
};
```

---

## 14. Testing Strategy

### 14.1. Unit Tests

```typescript
// __tests__/useItineraryForm.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useItineraryForm } from '@/hooks/useItineraryForm';

describe('useItineraryForm', () => {
  it('validates required fields', async () => {
    const { result } = renderHook(() => useItineraryForm());
    
    await act(async () => {
      const onSubmit = jest.fn();
      await result.current.handleSubmit(onSubmit)();
    });
    
    expect(result.current.errors.name).toBeDefined();
    expect(result.current.errors.start_date).toBeDefined();
  });
  
  it('validates date range', async () => {
    const { result } = renderHook(() => useItineraryForm());
    
    act(() => {
      result.current.setValue('start_date', new Date('2026-05-01'));
      result.current.setValue('end_date', new Date('2026-04-01')); // Invalid
    });
    
    await act(async () => {
      const onSubmit = jest.fn();
      await result.current.handleSubmit(onSubmit)();
    });
    
    expect(result.current.errors.end_date?.message).toContain('after start date');
  });
});
```

### 14.2. Integration Tests (RTK Query)

```typescript
// __tests__/itineraryApi.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useGetItineraryQuery } from '@/store/api/itineraryApi';
import { server } from '@/mocks/server';
import { rest } from 'msw';

describe('Itinerary API', () => {
  it('fetches itinerary successfully', async () => {
    const { result } = renderHook(() => useGetItineraryQuery('test-id'), {
      wrapper: ReduxProvider,
    });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data).toMatchObject({
      id: 'test-id',
      title: 'Test Itinerary',
    });
  });
  
  it('handles 404 error', async () => {
    server.use(
      rest.get('/api/v1/itineraries/:id', (req, res, ctx) => {
        return res(ctx.status(404));
      })
    );
    
    const { result } = renderHook(() => useGetItineraryQuery('invalid-id'), {
      wrapper: ReduxProvider,
    });
    
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error.status).toBe(404);
  });
});
```

### 14.3. E2E Tests (Detox)

```typescript
// e2e/itinerary.test.ts
describe('Itinerary Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    await login(); // Helper function
  });
  
  it('should create itinerary with AI', async () => {
    // Navigate to AI Generate
    await element(by.id('create-ai-btn')).tap();
    
    // Fill form
    await element(by.id('destination-input')).typeText('Da Nang');
    await element(by.id('start-date-picker')).tap();
    // ... select date
    
    // Submit
    await element(by.id('generate-btn')).tap();
    
    // Wait for generation (mock backend to return DRAFT immediately)
    await waitFor(element(by.id('itinerary-detail-screen')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Verify
    await expect(element(by.id('itinerary-title'))).toHaveText('Da Nang');
  });
});
```

---

## 15. Accessibility (a11y)

### 15.1. Screen Reader Support

```typescript
// components/ItineraryCard.tsx
<TouchableOpacity
  accessible={true}
  accessibilityLabel={`Itinerary: ${itinerary.title}`}
  accessibilityHint="Double tap to view details"
  accessibilityRole="button"
  onPress={onPress}
>
  {/* Content */}
</TouchableOpacity>
```

### 15.2. Dynamic Type Support

```typescript
// styles/typography.ts
import { Platform, PixelRatio } from 'react-native';

const fontScale = PixelRatio.getFontScale();

export const TYPOGRAPHY = {
  h1: {
    fontSize: 28 * fontScale,
    lineHeight: 36 * fontScale,
  },
  body: {
    fontSize: 16 * fontScale,
    lineHeight: 24 * fontScale,
  },
};
```

### 15.3. Color Contrast (WCAG AA)

```typescript
// constants/colors.ts
export const COLORS = {
  text: {
    primary: '#000000',   // Contrast ratio: 21:1 (AAA)
    secondary: '#4B5563', // Contrast ratio: 9.73:1 (AA)
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F3F4F6',
  },
};
```

---

## 16. Deployment Checklist

### Before Release

- [ ] **API Integration**: All endpoints tested với staging environment
- [ ] **Error Handling**: All error cases có fallback UI
- [ ] **Loading States**: Skeleton loaders cho all data fetching
- [ ] **Empty States**: EmptyState components cho empty lists
- [ ] **Offline Handling**: Graceful degradation khi no internet
- [ ] **Push Notifications**: Tested cho AI generation complete
- [ ] **Deep Linking**: Itinerary detail deep links working
- [ ] **Analytics**: Event tracking cho key actions (create, favorite, expense)
- [ ] **Performance**: FlatList optimization, image caching
- [ ] **Accessibility**: Screen reader tested, dynamic type support
- [ ] **Localization**: All strings trong i18n files (Vietnamese + English)

---

## 17. Future Enhancements

### Phase 2 Features

1. **Offline Mode**: Redux Persist + sync when online
2. **Real-time Collaboration**: WebSocket updates cho group itineraries
3. **Smart Notifications**: 
   - "Your trip starts tomorrow!"
   - "Don't forget to pack: [items from packing guide]"
4. **Photo Gallery**: Upload photos cho trip items
5. **Expense Splitting**: Auto-calculate split costs cho groups
6. **Weather Integration**: Real-time weather forecasts
7. **Calendar Export**: Export to Google Calendar / Apple Calendar
8. **Social Sharing**: Share itinerary as beautiful card image

---

## 18. Resources & References

### Official Documentation
- [Redux Toolkit RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
- [React Native Best Practices](https://reactnativecoders.com/latest-article/react-native-best-practices/)
- [Mobile App Design Best Practices](https://www.rapidnative.com/blogs/mobile-app-design-best-practices)

### Internal Documentation
- **Technical API Reference**: `FE_ITINERARY_MODULE.md`
- **Location Module Guide**: `FE_LOCATION_SUGGESTION_MODULE_GUIDE.md`
- **Travel Notebook Guide**: `FE_TRAVEL_NOTEBOOK_BUSINESS.md`

### UI/UX Guidelines
- Apple Human Interface Guidelines (44x44pt tap targets)
- Material Design (48x48dp tap targets)

---

**Document Version**: 1.0.0  
**Last Updated**: 2026-04-20  
**Author**: Backend Team → Frontend Team  
**Status**: ✅ Ready for Implementation
