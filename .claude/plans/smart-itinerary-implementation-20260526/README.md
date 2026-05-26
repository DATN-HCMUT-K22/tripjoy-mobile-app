# Smart Itinerary Features Implementation Plan

**Created:** 2026-05-26  
**Plan Directory:** `.claude/plans/smart-itinerary-implementation-20260526/`

## Quick Start

View the main plan:
```bash
cat .claude/plans/smart-itinerary-implementation-20260526/plan.md
```

Start implementation with Phase 1:
```bash
cat .claude/plans/smart-itinerary-implementation-20260526/phase-1.md
```

## Phase Overview

| Phase | Description | Timeline | LOC | Dependencies |
|-------|-------------|----------|-----|--------------|
| 1 | Trip Item Status Management | 2 days | ~250 | None |
| 2 | Basic Check-in UI & Offline Queue | 2 days | ~350 | Phase 1 |
| 3 | Rating & Review System | 2 days | ~300 | Phase 2 |
| 4 | Enhanced Expense Management | 3 days | ~400 | None (independent) |
| 5 | Geofencing Background Task | 3 days | ~350 | Phase 2 |
| 6 | Polish & Edge Cases | 2 days | ~200 | Phases 3, 4, 5 |

**Total:** 14 days (sequential) or 11 days (2 devs parallelized)

## Implementation Order

**Sequential (1 developer):**
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

**Parallel (2 developers):**
- **Dev 1:** Phase 1 → Phase 2 → Phase 5 → Phase 6
- **Dev 2:** Wait for Phase 2 → Phase 3 || Phase 4

## Files Reference

### Plan Files
- `plan.md` - Executive summary and overview
- `phase-1.md` - Trip Item Status Management (Foundation)
- `phase-2.md` - Basic Check-in UI & Optimistic Updates
- `phase-3.md` - Rating & Review System
- `phase-4.md` - Enhanced Expense Management
- `phase-5.md` - Geofencing Background Task
- `phase-6.md` - Polish & Edge Cases

### New Files to Create (7)
- `hooks/useTripItemStatus.ts`
- `utils/checkinQueue.ts`
- `hooks/useCheckinSync.ts`
- `components/itinerary/RatingModal.tsx`
- `components/itinerary/LocationPermissionModal.tsx`
- `tasks/geofencingTask.ts`

### Files to Modify (5)
- `services/itineraries.ts`
- `components/itinerary/TripItemCard.tsx`
- `components/itinerary/StatusBadge.tsx`
- `components/itinerary/ExpensesOverlay.tsx`
- `app/itinerary/[id].tsx` & `detail.tsx`

## Backend Requirements

**New endpoint needed:**
- PATCH `/itineraries/{itineraryId}/items/{tripItemId}/status`

**Request body:**
```json
{
  "status": "CHECKED_IN" | "SKIPPED" | "PENDING",
  "rating": 5,       // Optional, 1-5
  "review": "Great!" // Optional, max 500 chars
}
```

**Expense fields to support:**
- `trip_item_id` (string, nullable)
- `receipt_image_urls` (string[], max 3)
- `paid_by` (string, user UUID)
- `paid_at` (string, ISO timestamp)

## Testing Strategy

**After each phase:**
- Run unit tests for new utilities
- Test integration with existing features
- Verify accessibility (VoiceOver/TalkBack)
- Check offline behavior
- Monitor performance (React DevTools)

**Before production:**
- Full E2E test suite
- Battery drain test (2+ hours of geofencing)
- Accessibility audit (WCAG AA compliance)
- Performance profiling (60fps requirement)

## Start Implementing

**To begin Phase 1:**
```bash
# View detailed implementation steps
cat .claude/plans/smart-itinerary-implementation-20260526/phase-1.md

# Or use cook command (if available)
# /cook --plan=smart-itinerary-implementation-20260526 --phase=1
```

## Notes

- All code examples include proper TypeScript types
- Follows existing codebase patterns (React Query, Expo Router)
- Accessibility-first design (44px touch targets, VoiceOver labels)
- Offline-first architecture with AsyncStorage queue
- Battery-optimized geofencing (today-only, auto-stop)
