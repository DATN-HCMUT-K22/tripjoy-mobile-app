# Itinerary Module Implementation Plan

## Overview

Complete implementation of the Itinerary module based on business requirements in `/media/ngocha/New Volume/datn_tripjoy/brain-storm/FE_ITINERARY_BUSINESS.md`.

**Timeline:** 20-27 days  
**Status:** In Progress  
**Last Updated:** 2026-04-20

## Critical Architectural Decision

### React Query vs RTK Query

**Current State:** Codebase uses React Query (TanStack Query)  
**Business Doc Spec:** RTK Query (Redux Toolkit Query)

**Recommendation:** **Keep React Query**

**Rationale:**
1. ✅ Already fully implemented with advanced patterns
2. ✅ Polling, optimistic updates, cache management working
3. ✅ Better TypeScript support and simpler API
4. ✅ Smaller bundle size (better for React Native)
5. ✅ Team already familiar (see `hooks/useItineraries.ts`)
6. ✅ Redux store exists but focused on auth/notifications (good separation)

**Action Required:** Document this decision in Phase 1 ADR

## Current Implementation Status

### ✅ Complete (as of 2026-04-20)
- **Services Layer** (`services/itineraries.ts`) - All API endpoints implemented
- **React Query Hooks** (`hooks/useItineraries.ts`, `hooks/useTripItems.ts`) - Complete with polling
- **Screens** - Detail ([id].tsx), list (index.tsx), expenses, notebook
- **Notebook Feature** - Generation UI, markdown rendering
- **Map Integration** - react-native-maps configured and integrated
- **Phase 1** - StatusBadge, ErrorBoundary, schemas (zod), types
- **Phase 2** - List screen, tab navigation, ItineraryCard, search, pull-to-refresh
- **Phase 3** - TripItemCard, CRUD operations, timeline grouping

### 🚧 In Progress / Remaining
- Manual create/edit screens (Phase 4)
- AI Modify UI (Phase 5)
- Favorite/Unfavorite UI (Phase 6)
- Performance optimizations (Phase 7)
- Accessibility features (Phase 7)
- Test coverage (Phase 7)

## Implementation Phases

### Phase 1: Architecture Decision & Foundation ✅
**Duration:** 2-3 days  
**Priority:** Critical  
**Status:** Completed (2026-04-20)  
**Deliverable:** Architecture documentation and base components

- ✅ Architectural Decision Record (ADR)
- ✅ StatusBadge component
- ✅ ErrorBoundary components
- ✅ Form validation schemas (zod)
- ✅ Type definitions completion

**File:** [phase-1.md](./phase-1.md)

---

### Phase 2: Browse & List Screens ✅
**Duration:** 3-4 days  
**Priority:** High  
**Status:** Completed (2026-04-20)  
**Deliverable:** My Trips screen with full functionality

- ✅ Itinerary list screen
- ✅ Tab navigation (ongoing/completed/draft)
- ✅ Enhanced ItineraryCard component
- ✅ Pull-to-refresh
- ✅ Empty states, loading skeletons
- ✅ Search with debounce

**File:** [phase-2.md](./phase-2.md)

---

### Phase 3: Trip Items & Timeline ✅
**Duration:** 4-5 days  
**Priority:** High  
**Status:** Completed (2026-04-20)  
**Deliverable:** Complete trip item management

- ✅ TripItemCard component
- ✅ Timeline view with day grouping
- ✅ Add/Edit/Delete trip items
- ✅ CRUD operations via hooks
- ✅ Map integration for route visualization

**File:** [phase-3.md](./phase-3.md)

---

### Phase 4: Manual Create/Edit Flow
**Duration:** 3-4 days  
**Priority:** High  
**Deliverable:** Full CRUD for itineraries

- Manual create screen with forms
- Edit itinerary screen
- Form validation with react-hook-form
- Date picker integration
- Theme/category selector
- Image upload for cover

**File:** [phase-4.md](./phase-4.md)

---

### Phase 5: AI Features & Polish
**Duration:** 3-4 days  
**Priority:** Medium  
**Deliverable:** Complete AI integration

- AI Modify UI (remove unwanted places)
- Status polling refinement
- Progress indicators during generation
- Error handling for AI failures
- Retry mechanisms
- Loading states polish

**File:** [phase-5.md](./phase-5.md)

---

### Phase 6: Favorite & Social Features
**Duration:** 2-3 days  
**Priority:** Medium  
**Deliverable:** User engagement features

- Favorite/Unfavorite with optimistic updates
- Share itinerary functionality
- Social integration hooks
- Analytics event tracking

**File:** [phase-6.md](./phase-6.md)

---

### Phase 7: Quality & Accessibility
**Duration:** 3-4 days  
**Priority:** Medium  
**Deliverable:** Production-ready quality

- Performance optimization (memoization, FlatList)
- Accessibility (screen readers, dynamic type)
- Error boundaries around features
- Unit tests for hooks
- Integration tests for flows
- E2E tests for critical paths

**File:** [phase-7.md](./phase-7.md)

---

## Dependencies Graph

```
Phase 1 (Foundation)
    ↓
Phase 2 (List Screens) ←→ Phase 3 (Trip Items)
    ↓                           ↓
Phase 4 (Create/Edit)    Phase 5 (AI Features)
    ↓                           ↓
    └──────→ Phase 6 (Social) ←┘
                ↓
         Phase 7 (Quality)
```

## Key Files Reference

### Critical Files
- `services/itineraries.ts` - API client (✅ complete)
- `hooks/useItineraries.ts` - Data hooks (✅ complete)
- `app/itinerary/[id].tsx` - Detail screen (🔨 enhance)
- `app/itinerary/expenses.tsx` - Expenses (✅ complete)
- `app/itinerary/notebook.tsx` - Notebook (✅ complete)

### Files Created
- ✅ `app/itinerary/index.tsx` - List screen
- ✅ `components/itinerary/StatusBadge.tsx`
- ✅ `components/itinerary/TripItemCard.tsx`
- ✅ `components/group/ItineraryCard.tsx` (enhanced)
- ✅ `schemas/itinerary.ts` - Zod validation schemas
- ✅ `types/itinerary.ts` - Enhanced type definitions
- ✅ `components/errors/ErrorBoundary.tsx`
- ✅ `components/errors/ErrorFallback.tsx`
- ✅ `components/shared/LoadingSkeleton.tsx`
- ✅ `components/shared/EmptyState.tsx`
- ✅ `hooks/useTripItems.ts` - Trip item CRUD hooks
- ✅ `docs/adr/001-react-query-for-itinerary.md` - Architecture decision

### Files to Create (Remaining Phases)
- `app/itinerary/create.tsx` - Manual create (Phase 4)
- `app/itinerary/edit.tsx` - Edit screen (Phase 4)

### Reference Patterns
- `app/create/ai-wait.tsx` - Polling pattern ✅
- `components/notebook/` - Component structure ✅
- `hooks/useNotebook.ts` - Hook patterns ✅

## Business Requirements Mapping

| Business Doc Section | Implementation Phase |
|---------------------|---------------------|
| 4.1 AI Generation Flow | Phase 5 |
| 4.2 Manual Creation Flow | Phase 4 |
| 4.3 View Itinerary Detail | Phase 3 |
| 4.4 Add Trip Item Flow | Phase 3 |
| 4.5 Expense Tracking | ✅ Complete |
| 4.6 Favorite/Unfavorite | Phase 6 |
| 4.7 Browse My Trips | Phase 2 |
| 4.8 Error Handling | Phase 5, 7 |
| 7. Component Architecture | Phase 1, 2, 3 |
| 8. State Management | Phase 1 |
| 10. Performance | Phase 7 |
| 11. UI/UX Guidelines | All phases |
| 14. Testing Strategy | Phase 7 |
| 15. Accessibility | Phase 7 |

## Success Metrics

### Phase Completion Criteria
- [x] Phase 1 completed (2026-04-20)
- [x] Phase 2 completed (2026-04-20)
- [x] Phase 3 completed (2026-04-20)
- [ ] Phase 4 - Manual Create/Edit
- [ ] Phase 5 - AI Features & Polish
- [ ] Phase 6 - Favorite & Social
- [ ] Phase 7 - Quality & Accessibility

### Overall Progress: 43% (3/7 phases complete)

### Overall Success
- [x] Browse My Trips flow implemented
- [x] View Itinerary Detail implemented
- [x] Trip Items CRUD implemented
- [ ] Manual creation/edit flows
- [ ] AI features complete
- [ ] Performance targets met (FlatList, memoization)
- [ ] Accessibility score > 90%
- [ ] Test coverage > 70%
- [ ] No critical bugs
- [ ] User acceptance testing passed

## Risk Management

### High Risk
- **Architecture decision not approved** → Mitigation: Get approval in Phase 1
- **API changes during implementation** → Mitigation: Service layer abstracts API

### Medium Risk
- **Performance issues on large lists** → Mitigation: FlatList + memoization from start
- **Map integration complexity** → Mitigation: Reuse existing patterns

### Low Risk
- **Form validation edge cases** → Mitigation: Comprehensive zod schemas
- **Polling failures** → Mitigation: Retry logic + error boundaries

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Approve architecture decision** (React Query)
3. **Start Phase 1** - Foundation work
4. **Daily standups** to track progress
5. **Demo after each phase** for feedback

## Notes

- Business doc is comprehensive (1896 lines) - reference it frequently
- Existing code quality is high - maintain standards
- Mobile-first approach per business doc section 11
- Test on real devices for map + polling features
