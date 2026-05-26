# Phase 1: Trip Item Status Management (Foundation)

**Status:** Completed ✅  
**Timeline:** 2 days  
**LOC Estimate:** ~250 lines  
**Complexity:** Low  
**Dependencies:** None

This phase establishes the foundation for all subsequent features by adding status tracking to trip items.

## Overview

Trip items need to track their state during a trip:
- **PENDING**: Not yet visited (default)
- **CHECKED_IN**: User confirmed they visited
- **SKIPPED**: User decided to skip this location

This status drives UI states, geofencing, and rating workflows in later phases.

## Type Definitions

### File: `services/itineraries.ts`

**Add near other type exports (around line 20):**

```typescript
// Trip item status enum
export type TripItemStatus = 'PENDING' | 'CHECKED_IN' | 'SKIPPED';

// Request payload for status updates
export type UpdateTripItemStatusRequest = {
  status: TripItemStatus;
  rating?: number;      // 1-5, for Phase 3
  review?: string;      // for Phase 3
};
```

**Update existing `TripItemResponse` type (around line 110):**

```typescript
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
  
  // NEW FIELDS
  status?: TripItemStatus;      // Trip item status
  rating?: number;              // 1-5 stars (Phase 3)
  review?: string;              // Review text (Phase 3)
  checked_in_at?: string;       // ISO timestamp when checked in
};
```

## Service Layer

### File: `services/itineraries.ts`

**Add to `itineraryService` object (around line 280):**

```typescript
/**
 * Update trip item status (check-in, skip, or reset to pending).
 * Also accepts rating and review for Phase 3.
 */
updateTripItemStatus: (
  itineraryId: string,
  tripItemId: string,
  payload: UpdateTripItemStatusRequest
) =>
  httpClient.patch<ApiEnvelope<TripItemResponse>>(
    `/itineraries/${itineraryId}/items/${tripItemId}/status`,
    payload
  ),
```

## React Query Hook

### File: `hooks/useTripItemStatus.ts` (NEW)

**Create new file:**

```typescript
import { itineraryService, UpdateTripItemStatusRequest, TripItemResponse } from '@/services/itineraries';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateTripItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      itineraryId: string;
      tripItemId: string;
      payload: UpdateTripItemStatusRequest;
    }) => {
      const res = await itineraryService.updateTripItemStatus(
        args.itineraryId,
        args.tripItemId,
        args.payload
      );
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || 'Không cập nhật được trạng thái');
      }
      return res.data;
    },

    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['itineraries', 'detail', variables.itineraryId, 'items'],
      });

      // Snapshot previous value
      const previousItems = queryClient.getQueryData<TripItemResponse[]>([
        'itineraries',
        'detail',
        variables.itineraryId,
        'items',
      ]);

      // Optimistically update to the new value
      if (previousItems) {
        queryClient.setQueryData<TripItemResponse[]>(
          ['itineraries', 'detail', variables.itineraryId, 'items'],
          (old) =>
            old?.map((item) =>
              item.id === variables.tripItemId
                ? {
                    ...item,
                    status: variables.payload.status,
                    rating: variables.payload.rating,
                    review: variables.payload.review,
                    checked_in_at:
                      variables.payload.status === 'CHECKED_IN'
                        ? new Date().toISOString()
                        : item.checked_in_at,
                  }
                : item
            ) ?? []
        );
      }

      return { previousItems };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(
          ['itineraries', 'detail', variables.itineraryId, 'items'],
          context.previousItems
        );
      }
      showErrorToast('Lỗi', error);
    },

    onSuccess: (data, variables) => {
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ['itineraries', 'detail', variables.itineraryId, 'items'],
      });

      // Success message based on status
      const messages = {
        CHECKED_IN: 'Đã check-in thành công',
        SKIPPED: 'Đã bỏ qua địa điểm',
        PENDING: 'Đã hoàn tác',
      };
      showSuccessToast(messages[variables.payload.status] || 'Đã cập nhật');
    },
  });
}
```

## Testing Checklist

- [ ] `updateTripItemStatus` service method calls correct endpoint
- [ ] Hook performs optimistic update immediately
- [ ] Hook rolls back on API error
- [ ] Query invalidation refreshes trip items list
- [ ] Toast notifications display correctly
- [ ] Status transitions work: PENDING → CHECKED_IN → PENDING
- [ ] Status transitions work: PENDING → SKIPPED → PENDING
- [ ] `checked_in_at` timestamp saves correctly

## Acceptance Criteria

1. ✅ Status field added to `TripItemResponse` type
2. ✅ PATCH endpoint integrated in service layer
3. ✅ React Query hook created with optimistic updates
4. ✅ Status updates reflect in UI immediately (tested in Phase 2)
5. ✅ API calls succeed with correct payload structure
6. ✅ Error handling rolls back optimistic updates
7. ✅ Success toasts display appropriate messages

## Backend Coordination Needed

<!-- Updated: Validation Session 1 - Backend coordination meeting recommended before Phase 1 -->

**⚠️ PREREQUISITE: Schedule 30-min backend coordination meeting before starting Phase 1**

**Confirm with backend team:**

1. **Endpoint:** PATCH `/itineraries/{itineraryId}/items/{tripItemId}/status`
2. **Request Body:**
   ```json
   {
     "status": "CHECKED_IN" | "SKIPPED" | "PENDING",
     "rating": 5,          // Optional, 1-5
     "review": "Great!"    // Optional, max 500 chars
   }
   ```
3. **Response:** Standard `ApiEnvelope<TripItemResponse>` with updated status
4. **Status Code:** 200 OK on success
5. **Error Cases:**
   - 404: Trip item not found
   - 400: Invalid status value
   - 403: User not authorized to update

**Meeting Agenda:**
- [ ] Verify endpoint is deployed and accessible
- [ ] Test actual request/response payloads match type definitions
- [ ] Confirm error code mappings
- [ ] Check rate limiting and auth requirements

## Next Steps

After Phase 1 is complete and tested:
→ Move to [Phase 2: Basic Check-in UI & Optimistic Updates](./phase-2.md)
