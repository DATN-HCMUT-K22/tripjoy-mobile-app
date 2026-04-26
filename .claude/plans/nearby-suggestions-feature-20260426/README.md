# Nearby Suggestions Feature - Implementation Plan

**Created**: 2026-04-26  
**Status**: Ready for Implementation  
**Based on**: `/media/ngocha/New Volume/datn_tripjoy/docs/NEARBY_SUGGESTIONS_FEATURE.md`

---

## Quick Start

1. **Read the spec**: Review `/media/ngocha/New Volume/datn_tripjoy/docs/NEARBY_SUGGESTIONS_FEATURE.md`
2. **Start with Phase 1**: See `phase-1-core-mvp.md` for MVP implementation (Day 1)
3. **Verify Google API**: Ensure Places API (New) is enabled in Google Cloud Console
4. **Test thoroughly**: Each phase has a detailed testing checklist

---

## Plan Structure

| File | Description | Priority |
|------|-------------|----------|
| `plan.md` | Executive summary and overview | Read First |
| `phase-1-core-mvp.md` | Core implementation (5 files, 1 day) | CRITICAL |
| `phase-2-polish.md` | Production polish (4 files, 1 day) | HIGH |
| `phase-3-enhancement.md` | Advanced features (optional, 2 days) | OPTIONAL |

---

## Implementation Timeline

```
Day 1: Phase 1 - Core MVP (CRITICAL PATH)
├── services/googlePlaces.ts          [MODIFY] Add searchNearbyByCategory()
├── hooks/useNearbySuggestions.ts     [CREATE] React Query hook
├── components/itinerary/
│   ├── SuggestionCard.tsx            [CREATE] Card component
│   ├── NearbySuggestionsSheet.tsx    [CREATE] Bottom sheet
│   └── TripItemCard.tsx              [MODIFY] Add icons + integration
└── ✅ Deliverable: Working suggestions for 3 categories

Day 2: Phase 2 - Polish & Edge Cases
├── components/itinerary/
│   ├── SuggestionCardSkeleton.tsx    [CREATE] Loading skeleton
│   ├── NearbySuggestionsSheet.tsx    [ENHANCE] Pull-to-refresh
│   ├── SuggestionCard.tsx            [ENHANCE] Distance display
│   └── TripItemCard.tsx              [ENHANCE] Location validation
├── hooks/useNearbySuggestions.ts     [ENHANCE] Error handling
└── ✅ Deliverable: Production-ready UX

Day 3-4: Phase 3 - Enhancement (OPTIONAL)
├── Analytics tracking                [IMPLEMENT]
├── Quick-add to itinerary           [IMPLEMENT]
├── A/B testing framework            [IMPLEMENT]
└── ✅ Deliverable: Data-driven feature
```

---

## Files Changed

### New Files (7)
- `hooks/useNearbySuggestions.ts`
- `components/itinerary/SuggestionCard.tsx`
- `components/itinerary/SuggestionCardSkeleton.tsx`
- `components/itinerary/NearbySuggestionsSheet.tsx`
- `utils/analytics.ts` (Phase 3, may already exist)

### Modified Files (2)
- `services/googlePlaces.ts`
- `components/itinerary/TripItemCard.tsx`

---

## Key Technical Decisions

1. **Google Places API Only**: Rich data quality > backend API
2. **React Query Caching**: 30min staleTime balances freshness vs quota
3. **Lazy Loading**: Only fetch when sheet opens (`enabled` flag)
4. **No New Dependencies**: Reuses existing infrastructure
5. **Skeleton > Spinner**: Better perceived performance

---

## Success Criteria

### Launch Criteria
- [ ] P95 load time < 2s
- [ ] Cache hit rate > 80%
- [ ] 0 crashes in 100 test sessions
- [ ] Average 5+ results per category

### Post-Launch KPIs
- Icon click-through rate > 30%
- API cost < $0.10 per user/month

---

## Getting Started

### Prerequisites
1. Google Places API (New) enabled
2. Valid API key in `.env`
3. Test itinerary with locations

### Implementation Order
1. Read `plan.md` for context
2. Implement `phase-1-core-mvp.md` (6-8 hours)
3. Test Phase 1 checklist
4. Implement `phase-2-polish.md` (4-6 hours)
5. Test Phase 2 checklist
6. (Optional) Implement `phase-3-enhancement.md` (6-8 hours)

---

## Need Help?

- **Spec questions**: Re-read `/media/ngocha/New Volume/datn_tripjoy/docs/NEARBY_SUGGESTIONS_FEATURE.md`
- **Technical questions**: Check phase docs for troubleshooting sections
- **API issues**: Google Cloud Console → APIs & Services → Places API (New)

---

## Notes

- This is a **high-confidence plan** - all dependencies exist, patterns verified
- Follow the phases in order - don't skip Phase 1 or 2
- Phase 3 is truly optional - feature is production-ready after Phase 2
- Each phase has detailed testing checklists - use them!
