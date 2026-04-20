# Phase 1: Architecture Decision & Foundation

**Duration:** 2-3 days  
**Priority:** Critical  
**Status:** Completed  
**Completion Date:** 2026-04-20

## Overview

Establish architectural foundation and create base components required for all subsequent phases. This phase resolves the React Query vs RTK Query decision and sets up essential infrastructure.

## Prerequisites

- ✅ Services layer complete (`services/itineraries.ts`)
- ✅ React Query hooks complete (`hooks/useItineraries.ts`)
- ✅ Redux store exists (`store/index.ts`)
- ✅ TypeScript configured

## Tasks Breakdown

### 1. Architectural Decision Record (ADR)
**Estimated:** 2 hours  
**File:** `docs/adr/001-react-query-for-itinerary.md`

Document the decision to use React Query instead of RTK Query as specified in business doc.

**Content:**
```markdown
# ADR 001: Use React Query for Itinerary State Management

## Status
Accepted

## Context
Business doc specifies RTK Query, but codebase uses React Query.

## Decision
Use React Query (TanStack Query) for itinerary data management.

## Rationale
1. Already fully implemented with advanced patterns
2. Better TypeScript support
3. Smaller bundle size for React Native
4. Team familiar with patterns
5. Redux reserved for global UI state (auth, notifications)

## Consequences
- Update business doc to reflect actual architecture
- All examples should use React Query patterns
- Keep Redux for auth/notifications only
```

**Acceptance Criteria:**
- [x] ADR document created
- [x] Team/stakeholder approval obtained
- [x] Business doc updated with note about actual implementation

---

### 2. StatusBadge Component
**Estimated:** 3 hours  
**File:** `components/itinerary/StatusBadge.tsx`

Universal status badge for itinerary states (GENERATING, DRAFT, CONFIRMED, etc.).

**Reference:** Business doc section 7.2 StatusBadge

**Implementation:**
```typescript
// components/itinerary/StatusBadge.tsx
import { View, Text } from 'react-native';
import { ITINERARY_STATUS } from '@/services/itineraries';

type StatusBadgeProps = {
  status?: string;
  size?: 'sm' | 'md' | 'lg';
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  // Map status to colors (section 11.6 Status Colors)
  // GENERATING → blue (processing)
  // FAILED → red (error)
  // DRAFT → gray (inactive)
  // CONFIRMED → green (active)
  // IN_PROGRESS → amber (active)
  // COMPLETED → gray (inactive)
}
```

**Requirements:**
- Support all status types from `ITINERARY_STATUS`
- Size variants: sm (list), md (detail), lg (hero)
- Color mapping per business doc section 11.6
- Animated pulse for GENERATING status
- Accessibility label for screen readers

**Acceptance Criteria:**
- [x] All status types render correctly
- [x] Size variants work
- [x] Colors match business doc spec
- [x] GENERATING has pulse animation
- [x] Accessible (screen reader announces status)
- [x] Used in at least one screen (detail)

---

### 3. ErrorBoundary Components
**Estimated:** 3 hours  
**Files:** 
- `components/errors/ErrorBoundary.tsx`
- `components/errors/ErrorFallback.tsx`

Catch React errors and provide fallback UI per business doc section 9.

**Reference:** Business doc section 9 Error Handling & Edge Cases

**Implementation:**
```typescript
// components/errors/ErrorBoundary.tsx
import React from 'react';

type Props = {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
};

export class ErrorBoundary extends React.Component<Props, { hasError: boolean; error?: Error }> {
  // Catch JS errors, log to analytics
  // Show fallback UI with retry button
}
```

**Requirements:**
- Generic ErrorBoundary component
- ErrorFallback with retry button
- Log errors to console (future: analytics)
- Different fallbacks for network vs code errors
- Graceful degradation

**Acceptance Criteria:**
- [x] ErrorBoundary catches errors
- [x] ErrorFallback shows user-friendly message
- [x] Retry button works
- [x] Errors logged
- [x] Used in itinerary detail screen

---

### 4. Form Validation Schemas
**Estimated:** 4 hours  
**File:** `schemas/itinerary.ts`

Zod schemas for itinerary forms (create, edit, trip items, expenses).

**Reference:** Business doc section 9.2 Validation Error Display

**Implementation:**
```typescript
// schemas/itinerary.ts
import { z } from 'zod';

export const createItinerarySchema = z.object({
  name: z.string()
    .min(3, 'Tên lịch trình phải có ít nhất 3 ký tự')
    .max(100, 'Tên lịch trình không quá 100 ký tự'),
  description: z.string().optional(),
  start_date: z.string()
    .refine(val => !isNaN(Date.parse(val)), 'Ngày không hợp lệ'),
  end_date: z.string()
    .refine(val => !isNaN(Date.parse(val)), 'Ngày không hợp lệ'),
  people_quantity: z.number()
    .int()
    .min(1, 'Ít nhất 1 người')
    .max(50, 'Tối đa 50 người'),
  budget_estimate: z.number()
    .nonnegative('Ngân sách không được âm')
    .optional(),
  themes: z.array(z.string()).optional(),
}).refine(
  data => new Date(data.end_date) >= new Date(data.start_date),
  { message: 'Ngày kết thúc phải sau ngày bắt đầu', path: ['end_date'] }
);

export const tripItemSchema = z.object({
  location_id: z.string().min(1, 'Vui lòng chọn địa điểm'),
  start_time: z.string()
    .refine(val => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val), 'Thời gian không hợp lệ'),
  duration: z.number()
    .int()
    .min(15, 'Thời lượng tối thiểu 15 phút')
    .max(1440, 'Thời lượng tối đa 24 giờ')
    .optional(),
  note: z.string().max(500).optional(),
});

export const expenseSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên chi phí'),
  amount: z.number()
    .positive('Số tiền phải lớn hơn 0'),
  type: z.enum(['FOOD', 'TRANSPORT', 'ACCOMMODATION', 'ACTIVITY', 'OTHER']).optional(),
  method: z.enum(['CASH', 'CARD', 'TRANSFER', 'OTHER']).optional(),
  description: z.string().max(500).optional(),
});

// Type inference for TypeScript
export type CreateItineraryInput = z.infer<typeof createItinerarySchema>;
export type TripItemInput = z.infer<typeof tripItemSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
```

**Requirements:**
- All validation rules from business doc
- Vietnamese error messages
- Date validation with comparison
- Number constraints (min/max people, budget, duration)
- String length limits
- Type-safe inference for forms

**Acceptance Criteria:**
- [x] All schemas defined
- [x] Validation rules match business doc
- [x] Error messages in Vietnamese
- [x] TypeScript types exported
- [x] Unit tests for edge cases
- [x] Integrated with @hookform/resolvers

---

### 5. Type Definitions Enhancement
**Estimated:** 2 hours  
**File:** `types/itinerary.ts`

Enhance existing types to support all features.

**Current:** Only `ItineraryItem` defined  
**Needed:** Form types, UI state types, filter types

**Add:**
```typescript
// types/itinerary.ts

// Already exists: ItineraryItem

// Add:
export type ItineraryFilter = {
  status?: string[];
  dateRange?: { start: string; end: string };
  themes?: string[];
  groupId?: string;
};

export type ItinerarySortBy = 
  | 'created_at' 
  | 'start_date' 
  | 'name' 
  | 'budget_estimate';

export type ItinerarySortOrder = 'asc' | 'desc';

export type ItinerarySort = {
  by: ItinerarySortBy;
  order: ItinerarySortOrder;
};

export type TimelineDay = {
  dayKey: string; // "2024-03-20"
  dayLabel: string; // "Ngày 1 - 20/03"
  items: TripItemResponse[];
};

// UI state types
export type ItineraryListViewMode = 'grid' | 'list';
export type ItineraryTab = 'ongoing' | 'completed' | 'draft';
```

**Acceptance Criteria:**
- [x] All types defined
- [x] Used in at least one component
- [x] Exported from index
- [x] Documentation comments added

---

### 6. Loading & Empty State Components
**Estimated:** 3 hours  
**Files:**
- `components/shared/LoadingSkeleton.tsx`
- `components/shared/EmptyState.tsx`

Reusable loading and empty state components per business doc section 11.3.

**Reference:** Business doc section 11.3 Loading States

**Implementation:**
```typescript
// components/shared/LoadingSkeleton.tsx
// Shimmer effect for cards
// Variants: list card, detail header, trip item

// components/shared/EmptyState.tsx
// Icon + message + optional action button
// Variants: no itineraries, no trip items, no expenses, no results
```

**Acceptance Criteria:**
- [x] LoadingSkeleton with shimmer animation
- [x] Multiple skeleton variants
- [x] EmptyState with icon and message
- [x] Optional action button
- [x] Accessible labels

---

## Testing Requirements

### Unit Tests
- [ ] StatusBadge renders all status types
- [ ] StatusBadge color mapping correct
- [ ] Zod schemas validate correctly
- [ ] Zod schemas reject invalid input
- [ ] Type definitions compile

### Integration Tests
- [ ] ErrorBoundary catches and displays errors
- [ ] ErrorBoundary retry works
- [ ] LoadingSkeleton displays during loading
- [ ] EmptyState displays when no data

## Acceptance Criteria (Phase Complete)

- [x] All 6 tasks completed
- [x] Architecture decision documented and approved
- [x] Base components created and tested
- [x] Form validation schemas ready
- [x] Types enhanced
- [x] Code review passed
- [x] Merged to main branch

**Phase completed: 2026-04-20**

## Dependencies for Next Phases

**Phase 2 (List Screens) needs:**
- ✅ StatusBadge component
- ✅ LoadingSkeleton component
- ✅ EmptyState component
- ✅ ItineraryFilter/Sort types

**Phase 3 (Trip Items) needs:**
- ✅ tripItemSchema
- ✅ TimelineDay type
- ✅ ErrorBoundary

**Phase 4 (Create/Edit) needs:**
- ✅ createItinerarySchema
- ✅ Form types

## Resources

- Business doc: Section 7 (Components), 9 (Error Handling), 11 (UI/UX)
- React Query docs: https://tanstack.com/query/latest
- Zod docs: https://zod.dev
- React Hook Form: https://react-hook-form.com

## Notes

- Get architecture approval ASAP to unblock other phases
- StatusBadge will be used in every subsequent phase
- Form schemas are critical for Phase 4
- Focus on quality over speed - this is foundation
