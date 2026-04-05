---
name: group-detail-itineraries
description: >-
  Implements real group-scoped itineraries on the group detail screen (Thông tin nhóm),
  replacing mock data and wiring API + React Query. Use when the user says /ck, ck,
  asks to implement itineraries for group detail, or to connect Lịch trình đã đi on
  app/groups/[id]/info.tsx to the backend.
---

# Group detail — itineraries (/ck)

## Intent

Wire **“Lịch trình đã đi”** on `app/groups/[id]/info.tsx` to real data for the current `groupId` (`useLocalSearchParams` `id`). Remove or bypass `useMockItinerariesByTab` once API is available.

## Project anchors

- Screen: `app/groups/[id]/info.tsx` — mock hook `useMockItinerariesByTab`, tabs `ongoing` | `completed` | `draft`, `ItineraryItem` UI.
- Service: `services/itineraries.ts` — `itineraryService.getItineraries()` is currently **GET `/itineraries`** (no group filter in code).
- Hook pattern: `hooks/useItineraries.ts` — `useQuery`, `EXPO_PUBLIC_MOCK_DATA`, `mapApiItineraryToDisplay`, `queryKey: ["itineraries"]`.
- API shape: `ItineraryResponse` (`title`, `start_date`, `end_date`, `group_id`, `status`, …).

## Workflow

1. **Confirm backend contract** (read API docs or try requests):
   - Preferred: `GET /itineraries?group_id={uuid}` or `GET /groups/{groupId}/itineraries`.
   - If only global `GET /itineraries` exists, filter client-side by `group_id` on each `ItineraryResponse`.

2. **Service layer**
   - Add a dedicated function (e.g. `getItinerariesByGroupId(groupId)`) or extend `getItineraries` with optional `params` — keep types aligned with `ItineraryResponse[]` and existing `ApiEnvelope`.

3. **Hook**
   - Add `useGroupItineraries(groupId: string | undefined)` in `hooks/useItineraries.ts` (or colocated file) with:
     - `queryKey: ["itineraries", "group", groupId]` (or equivalent) so cache is per group.
     - Same mock branch as `useItineraries` when `EXPO_PUBLIC_MOCK_DATA` (filter mock list by `groupId` if mocks carry `groupId`).
     - Reuse or share `mapApiItineraryToDisplay`; extend mapping if the info screen needs `image`, `budget`, `createdAtLabel` from API fields.

4. **Tab bucketing**
   - Map API `status` (and/or date range vs “today”) into `ongoing` | `completed` | `draft`.
   - If API has no status: define explicit rules (e.g. draft = no start_date; ongoing = start ≤ today ≤ end; completed = end < today) and document in code briefly.
   - **Tab labels**: derive counts from `filteredLists.length`; remove hardcoded `TAB_CONFIG` `count` values tied to mock data.

5. **Screen (`info.tsx`)**
   - Replace `useMockItinerariesByTab(id)` with data from `useGroupItineraries(id)`.
   - Handle `isLoading` / `error` / empty states without breaking layout.
   - **Errors**: follow project rule — no ad-hoc `Alert.alert` for API failures; reuse the app’s shared error/toast pattern.
   - **Scope**: change only what’s needed for itineraries on this screen; do not refactor unrelated cards.

6. **Navigation (optional)**
   - If product requires: on card press, `router.push` to existing itinerary detail route (discover path under `app/`); otherwise leave press disabled or no-op until route exists.

## Checklist

- [ ] API filter or client filter by `group_id` matches backend.
- [ ] React Query keys scoped by `groupId`; invalidation after create/update if those flows touch this list.
- [ ] Tabs and counts reflect real lists, not mock constants.
- [ ] Mock mode still works when `EXPO_PUBLIC_MOCK_DATA` is true.
- [ ] No duplicate confirmation modals or noisy alerts for API errors.

## Note on `/ck`

Cursor discovers skills by **description**, not by registering slash commands. Users can type **/ck** or **ck** in chat as a shorthand; the description above includes those tokens so the agent picks up this skill when relevant.
