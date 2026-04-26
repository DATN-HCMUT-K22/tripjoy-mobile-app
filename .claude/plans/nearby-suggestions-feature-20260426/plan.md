# Nearby Suggestions Feature - Implementation Plan

**Date**: 2026-04-26  
**Status**: Ready for Implementation  
**Timeline**: 3-4 days  
**Approach**: Google Places API Only (MVP)

---

## Executive Summary

Implement a **Nearby Suggestions Feature** that displays restaurants, lodging, and transportation options within 1-3km of itinerary locations. Users tap category icons on `TripItemCard` components to open a bottom sheet with 5-10 curated suggestions powered by Google Places API.

**Key Features**:
- 3 categories: 🍴 Restaurants, 🏠 Lodging, 🚗 Transportation
- Smart caching with React Query (30min stale time)
- Modern, image-rich UI with bottom sheet pattern
- Distance display, skeleton loading, pull-to-refresh
- No new dependencies - reuses existing infrastructure

**Tech Stack**:
- React Native + Expo + TypeScript
- @tanstack/react-query v5.90.12 (already installed)
- @gorhom/bottom-sheet (already installed)
- Google Places API (New)

---

## Problem Statement

**Goal**: Enhance itinerary planning UX by providing contextual nearby suggestions when users are viewing trip locations.

**Current State**: 
- `TripItemCard` shows location details but no contextual discovery
- Users must manually search for nearby restaurants, hotels, transportation

**Desired State**:
- Single tap on category icon → instant suggestions
- Rich data from Google Places: photos, ratings, editorial summaries
- Cached results for fast repeat access

**Context from Spec Doc**: `/media/ngocha/New Volume/datn_tripjoy/docs/NEARBY_SUGGESTIONS_FEATURE.md`

---

## Solution Architecture

### Approach Selected: Google Places API Only

**Why**:
- ✅ Rich data quality (photos, ratings, descriptions)
- ✅ Already integrated in codebase (`services/googlePlaces.ts`)
- ✅ React Query caching mitigates quota concerns
- ✅ Proven reliability for production use

**Alternatives Considered**:
- Backend API Only: Lower data quality, missing photos
- Hybrid (Backend + Google): Over-engineering for MVP (YAGNI violation)

### Key Technical Decisions

1. **API Layer**: Extend existing `searchNearbyPlacesForTrip()` with category-specific `searchNearbyByCategory()`
2. **Data Layer**: React Query hook `useNearbySuggestions` with smart caching
3. **UI Layer**: Reuse `AppBottomSheet`, create new `SuggestionCard` component
4. **Integration**: Modify `TripItemCard` to add 3 icon buttons

### File Structure

```
services/
├── googlePlaces.ts                [MODIFY] Add searchNearbyByCategory()

hooks/
├── useNearbySuggestions.ts        [CREATE] React Query hook

components/itinerary/
├── TripItemCard.tsx               [MODIFY] Add category icons + sheet
├── NearbySuggestionsSheet.tsx     [CREATE] Bottom sheet container
├── SuggestionCard.tsx             [CREATE] Individual result card
└── SuggestionCardSkeleton.tsx     [CREATE] Loading skeleton (Phase 2)
```

---

## Implementation Phases

### Phase 1: Core MVP (Day 1) - CRITICAL PATH
**Goal**: Working restaurant, lodging, transportation suggestions with basic UI

**Files**: 5 files (1 modify, 4 create)
- Extend `services/googlePlaces.ts`
- Create `hooks/useNearbySuggestions.ts`
- Create `components/itinerary/SuggestionCard.tsx`
- Create `components/itinerary/NearbySuggestionsSheet.tsx`
- Modify `components/itinerary/TripItemCard.tsx`

**Deliverable**: User can tap icon → see 5-10 suggestions → tap card (console log)

**Details**: See `phase-1-core-mvp.md`

---

### Phase 2: Polish & Edge Cases (Day 2)
**Goal**: Production-ready UX with loading states, error handling, distance display

**Files**: 3 files (3 modify, 1 create)
- Create `components/itinerary/SuggestionCardSkeleton.tsx`
- Enhance `NearbySuggestionsSheet.tsx` (skeleton, pull-to-refresh)
- Enhance `hooks/useNearbySuggestions.ts` (error handling, exponential backoff)
- Enhance `SuggestionCard.tsx` (distance calculation)

**Deliverable**: Smooth UX with skeleton loading, friendly errors, distance info

**Details**: See `phase-2-polish.md`

---

### Phase 3: Enhancement (Day 3-4) - OPTIONAL
**Goal**: Advanced features for increased engagement

**Files**: 2-3 files (modify existing + analytics)
- Quick-add to itinerary button
- Analytics tracking (sheet opens, suggestion taps)
- A/B testing different radii (2km vs 3km)
- Adaptive radius (retry with 5km if 0 results)

**Deliverable**: Data-driven feature with conversion optimization

**Details**: See `phase-3-enhancement.md`

---

## Success Metrics

### Launch Criteria (Must Pass)
- [ ] P95 load time < 2s (icon click → first result)
- [ ] Cache hit rate > 80% after initial load
- [ ] 0 crashes in 100 test sessions
- [ ] Average 5+ results per category (urban locations)

### Post-Launch KPIs (2 Week Tracking)
- **Engagement**: Icon click-through rate > 30%
- **Conversion**: Suggestion → add to itinerary > 20% (if Phase 3)
- **Cost**: API cost < $0.10 per active user/month

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| API quota exceeded | High | 30min cache, 2km radius limit, quota monitoring |
| Slow network | Medium | Skeleton loading, 5s timeout, retry w/ backoff |
| No results | Low | Friendly empty state, adaptive radius (Phase 3) |
| API key exposure | High | Secure env var, never logged, restricted in console |

---

## Dependencies

**External**:
- Google Places API (New) - must be enabled in Google Cloud Console
- API key with Places API quota (default 1000/day may need increase)

**Internal** (all already installed):
- `@tanstack/react-query@5.90.12`
- `@gorhom/bottom-sheet@5.2.9`
- `@expo/vector-icons@15.0.3`
- `expo-image@3.0.10`

**New**: None

---

## Quality Standards

- **TypeScript**: Full type safety, no `any` except error handlers
- **Code Style**: Match existing patterns (`useGroups.ts`, `useItineraries.ts`)
- **Naming**: camelCase, descriptive (e.g., `searchNearbyByCategory` not `searchNearby`)
- **Comments**: JSDoc for public functions, explain complex logic
- **Accessibility**: All touchables have `accessibilityLabel`
- **Localization**: Vietnamese labels (match app)

---

## Critical Files for Implementation

**Priority Order**:
1. `/media/ngocha/New Volume/datn_tripjoy/services/googlePlaces.ts` - Foundation
2. `/media/ngocha/New Volume/datn_tripjoy/hooks/useNearbySuggestions.ts` - Data layer
3. `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/NearbySuggestionsSheet.tsx` - UI orchestration
4. `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/TripItemCard.tsx` - Integration point
5. `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/SuggestionCard.tsx` - Presentation

---

## Deployment Plan

### Pre-Launch Checklist
- [ ] Google Places API (New) enabled and tested
- [ ] API quota confirmed sufficient (1000/day default)
- [ ] `.env` has valid `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] All phase testing checklists passed
- [ ] No crashes in 100 test sessions

### Staged Rollout Strategy

<!-- Updated: Validation Session 1 - Added staged rollout to manage quota -->

**Stage 1: 10% Rollout (Days 1-2)**
- Deploy to 10% of users via feature flag or A/B framework
- Monitor quota usage: Target < 100 requests/day
- Check error rate: Must be < 5%
- Monitor P95 load time: Must be < 2s
- **Go/No-Go**: If metrics pass → proceed to Stage 2

**Stage 2: 50% Rollout (Days 3-4)**
- Expand to 50% of users
- Monitor quota usage: Target < 500 requests/day
- Verify cache hit rate: Should be > 80%
- Check user feedback/support tickets
- **Go/No-Go**: If metrics pass → proceed to Stage 3

**Stage 3: 100% Rollout (Days 5-7)**
- Deploy to all users
- Monitor quota usage: Should stay < 1000 requests/day with 30min cache
- Set up alerts for quota at 80% threshold
- **Rollback Plan**: If quota exceeded, reduce to 50% or disable feature temporarily

### Quota Monitoring

**Daily Checks (Week 1)**:
- Google Cloud Console → APIs & Services → Places API (New) → Quotas
- Track requests/day trend
- Alert at 80% quota usage

**Weekly Checks (Week 2+)**:
- API cost per active user (target < $0.10/month)
- Empty result rate (should decrease with adaptive radius in Phase 2)
- Cache hit rate (should increase over time as users revisit locations)

### Rollback Triggers
- Quota exceeds 900 requests/day (90% threshold)
- Error rate > 10% for > 1 hour
- P95 load time > 5s consistently
- Critical crashes reported

## Next Steps

1. **Review Plan**: Ensure alignment with product requirements
2. **Pre-Implementation**:
   - **Test Google Places API (New)**: Verify it works with current API key
   - Check API quota settings (increase if needed)
   - Confirm `.env` has valid `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
3. **Begin Phase 1**: Start with `services/googlePlaces.ts` extension
4. **Test Continuously**: Manual testing checklist in each phase doc
5. **Deploy Gradually**: Follow staged rollout plan (10% → 50% → 100%)

---

## References

- **Spec Document**: `/media/ngocha/New Volume/datn_tripjoy/docs/NEARBY_SUGGESTIONS_FEATURE.md`
- **Google Places API**: [New Places API - searchNearby](https://developers.google.com/maps/documentation/places/web-service/search-nearby)
- **React Query Docs**: [Caching Strategies](https://tanstack.com/query/latest/docs/react/guides/caching)
- **Bottom Sheet UX**: [Material Design Guidelines](https://m3.material.io/components/bottom-sheets)

---

## Validation Log

### Session 1 — 2026-04-26
**Trigger:** Pre-implementation validation  
**Questions asked:** 7

#### Questions & Answers

1. **[Assumptions]** The plan assumes Google Places API (New) is already enabled in your Google Cloud Console. What's the current status?
   - Options: Already enabled and tested | Enabled but not tested | Not enabled yet | Don't have access to Google Cloud Console
   - **Answer:** Enabled but not tested (Recommended)
   - **Rationale:** Confirms API is ready but needs verification during Phase 1 implementation. Add API testing to Phase 1 checklist.

2. **[Architecture]** The plan sets a 30-minute cache staleTime for suggestions. How frequently do you expect itinerary locations to change during active trip planning?
   - Options: Rarely change (30min is fine) | Change frequently (need shorter) | Never change once created
   - **Answer:** Rarely change (30min is fine)
   - **Rationale:** Validates the 30min cache strategy - users plan once, view multiple times. Optimal balance between freshness and quota.

3. **[Scope]** Phase 3 includes analytics tracking but is marked optional. How important is measuring user engagement with this feature post-launch?
   - Options: Critical - include in Phase 1 | Important - include in Phase 2 | Optional - keep in Phase 3 | Not needed
   - **Answer:** Optional - keep in Phase 3 (Recommended)
   - **Rationale:** Confirms Phase 3 analytics is truly optional. Ship core feature first, add measurement later if needed.

4. **[Architecture]** The plan uses a 2km default search radius. Do you have any data about your users' typical location density (urban vs rural)?
   - Options: Mostly urban users | Mixed urban/rural | Mostly rural users | Unknown user distribution
   - **Answer:** Mixed urban/rural
   - **Rationale:** CRITICAL - Mixed users means adaptive radius (Phase 2) is essential, not nice-to-have. Promote adaptive radius from Phase 2 enhancement to Phase 2 requirement.

5. **[Assumptions]** The plan assumes GooglePlaceListItem already has latitude/longitude fields for distance calculation. Have you verified this type definition?
   - Options: Yes, fields exist | No, need to check | Know they don't exist
   - **Answer:** Yes, fields exist
   - **Rationale:** Confirms type safety assumption. Distance calculation in Phase 2 can proceed as planned.

6. **[Risks]** The default API quota is 1000 requests/day. With 30min caching, ~50 active users could hit this limit. What's your launch plan?
   - Options: Staged rollout (10% → 50% → 100%) | Request quota increase before launch | Launch to all users, monitor | Small user base (<100), not concerned
   - **Answer:** Staged rollout (10% → 50% → 100%)
   - **Rationale:** Smart mitigation strategy. Add rollout plan to deployment section. Monitor quota at each stage before expanding.

7. **[Architecture]** Phase 2 adds a 5-second timeout to API calls. How should the feature behave on very slow networks (3G, rural)?
   - Options: Show error after timeout | Longer timeout (10s) | Show cached results if available | Disable feature on slow network
   - **Answer:** Show error after timeout (Recommended)
   - **Rationale:** Confirms 5s timeout + error state approach. Simple, predictable UX. Pull-to-refresh gives manual retry option.

#### Confirmed Decisions
- **API Setup**: Google Places API (New) enabled but needs Phase 1 verification test
- **Cache Strategy**: 30min staleTime confirmed optimal for use case
- **Analytics Scope**: Keep in Phase 3 (optional) - ship feature first
- **Search Radius**: 2km default + adaptive retry essential for mixed urban/rural users
- **Type Safety**: GooglePlaceListItem.latitude/longitude confirmed available
- **Launch Strategy**: Staged rollout 10% → 50% → 100% to manage quota
- **Slow Network**: 5s timeout → error state with pull-to-refresh recovery

#### Action Items
- [x] Add "Test Google Places API" to Phase 1 prerequisites checklist
- [x] Elevate adaptive radius from "enhancement" to "requirement" in Phase 2
- [x] Add staged rollout plan to deployment section
- [ ] Monitor quota usage at each rollout stage (10%, 50%, 100%)

#### Impact on Phases
- **Phase 1**: Add API verification test before main implementation
- **Phase 2**: Adaptive radius (retry with 5km if 0 results) is now REQUIRED, not optional
- **Phase 3**: No changes - analytics remains optional
- **Deployment**: Add staged rollout section with quota monitoring checkpoints
