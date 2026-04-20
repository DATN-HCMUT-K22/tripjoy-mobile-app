# Expense Management Feature

This plan outlines the steps for implementing the Expense management module for the TripJoy mobile app, built on top of the provided API documentation.

## User Review Required

- **Routing Strategy**: The new screen will be created at `app/itinerary/expenses.tsx`. It will navigate using `router.push({ pathname: '/itinerary/expenses', params: { itineraryId: id } })`.
- **UI Design Choices**: The design will feature a modern white/emerald theme matching the app's current style. The header will stick to the top displaying total expenses. Add/Edit actions will trigger an immersive Bottom Sheet / Modal rather than a whole new page.
- **Form Component**: The `app/itinerary/expenses.tsx` file will be self-contained for the UI (holding both the list and the add/edit modal forms).

## Proposed Changes

### 1. Data Layer & Hooks

#### [NEW] `hooks/useExpenses.ts`
Create a React Query wrapper around the API functions from `services/itineraries.ts`.
- `useExpenses(itineraryId: string)`
- `useAddExpense()`
- `useUpdateExpense()`
- `useDeleteExpense()`

### 2. Expenses Screen & UI Components

#### [NEW] `app/itinerary/expenses.tsx`
Create a new screen to manage all expenses for a specific itinerary.
- Will read `itineraryId` via `useLocalSearchParams()`.
- Display a visually appealing Total Budget / Expenses card.
- Show a Category-based summary using custom `Ionicons` (Food, Transport, Accommodation, Activities, Others) mapped from `ExpenseResponse.type`.
- Include a list of expense items.
- Include a Floating Action Button (FAB) or prominent Add Button for adding new expenses.
- Embed a React Native `Modal` to display the "Add / Edit Expense" form. This form will use `react-hook-form` or simple state for validation.

### 3. Entry Point

#### [MODIFY] `app/itinerary/[id].tsx`
Add navigating entry.
- Under the itinerary summary card (the visual card with title & dates), add a new action button: "Quản lý chi phí" (Manage Expenses).
- When pressed, it navigates to `/itinerary/expenses?itineraryId={id}`.

## Open Questions

- Should we strictly enforce categories to a predefined list (e.g., Food, Transport, Accommodation, Activity, Other), or allow free text for categories? (The plan defaults to a predefined set for better visual iconography, with fallback to "Other").
- Does the itinerary's `budget_estimate` need to be visually compared against the total tracked expenses on this new screen?

## Verification Plan

### Manual Verification
- Go to any existing itinerary.
- Tap "Quản lý chi phí" (Manage Expenses).
- Add an expense -> Check it reflects correctly in the list and updates the total amount.
- Edit the expense -> Check if fields populate correctly and PUT is successful.
- Delete the expense -> Check if it asks for confirmation and successfully DELETEs.
