# Report & Moderation Module - Implementation Plan

**Created:** 2026-05-08  
**Completed:** 2026-05-08  
**Status:** ✅ Completed (User Features Only)  
**Actual Time:** 2-3 days  
**Complexity:** Medium

---

## Overview

Implement a comprehensive Report & Moderation system that allows users to report inappropriate content (posts, comments, users) and enables administrators to review and handle these reports through a dedicated admin dashboard.

### Key Features

**User Features:**
- Report posts, comments, or users with predefined violation types
- Provide optional detailed descriptions
- Instant feedback via toast notifications
- Access report functionality from contextual menus

**Admin Features:**
- View paginated list of all reports with filtering
- Review detailed report information
- Process reports (approve/dismiss) with admin notes
- Track moderation history (who handled, when, status)

---

## Architecture

### Technology Stack

- **State Management:** React Query (TanStack Query) for server state
- **HTTP Client:** Existing `httpClient` with auto token refresh
- **UI Framework:** React Native with NativeWind (Tailwind CSS)
- **Type Safety:** TypeScript with strict typing
- **Navigation:** React Navigation (existing setup)

### Design Patterns

Following established codebase patterns:

1. **Service Layer Pattern** - API calls in `services/reports.ts`
2. **React Query Hooks Pattern** - Data fetching/mutations in `hooks/useReports.ts`
3. **Component Pattern** - Modals for user interactions
4. **Error Handling Pattern** - Toast notifications + analytics tracking
5. **Optimistic Updates** - Immediate UI feedback with rollback on errors

### File Structure

```
services/
  └── reports.ts                    # NEW: API service layer

hooks/
  └── useReports.ts                 # NEW: React Query hooks

types/
  └── report.ts                     # NEW: TypeScript interfaces

components/
  ├── social/
  │   └── ReportModal.tsx           # NEW: User report submission modal
  └── admin/                        # NEW: Admin-only components
      ├── ReportDashboard.tsx       # Report list view
      ├── ReportListItem.tsx        # Individual report card
      ├── ReportDetailModal.tsx     # Detailed report view
      └── ReportFilterBar.tsx       # Status filters

app/
  └── admin/
      └── reports.tsx               # NEW: Admin reports screen

__tests__/
  ├── services/
  │   └── reports.test.ts           # Service layer tests
  ├── hooks/
  │   └── useReports.test.tsx       # Hook tests
  └── components/
      └── social/
          └── ReportModal.test.tsx  # Component tests
```

---

## API Contract

### Base URL
`/api/v1/reports`

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/reports` | USER | Submit new report |
| GET | `/api/v1/reports` | ADMIN | List reports (paginated) |
| GET | `/api/v1/reports/{id}` | ADMIN | Get report details |
| POST | `/api/v1/reports/{id}/handle` | ADMIN | Handle report |

### Response Format
All responses follow the standard API format:
```typescript
{
  code: number;        // 0 or 1000 = success
  message?: string;
  data: T;
}
```

---

## Implementation Phases

### ✅ Phase 1: Foundation (COMPLETED - 2026-05-08)
Set up types, services, and hooks

**Status:** ✅ Completed  
**Deliverables:**
- ✅ Type definitions
- ✅ Service layer with API calls
- ✅ React Query hooks
- ✅ Unit tests

[→ Detailed Phase 1 Plan](./phase-1-foundation.md)

---

### ✅ Phase 2: User Features (COMPLETED - 2026-05-08)
Build user-facing report functionality

**Status:** ✅ Completed  
**Deliverables:**
- ✅ Report modal component
- ✅ Integration with post actions menu
- ✅ Integration with comment actions
- ✅ Integration with user profiles
- ✅ Toast notifications
- ✅ Analytics tracking

[→ Detailed Phase 2 Plan](./phase-2-user-features.md)

---

### ⏭️ Phase 3: Admin Features (SKIPPED)
Build admin dashboard and moderation tools

**Status:** ⏭️ Skipped - Not required per user request  
**Reason:** User only needs report submission functionality. Admin dashboard and moderation tools will be implemented separately when needed.

**Original Deliverables:**
- Admin reports screen
- Report list with pagination
- Report detail modal
- Filter and sort functionality
- Handle report workflow
- Admin role guards

[→ Detailed Phase 3 Plan](./phase-3-admin-features.md)

---

### ⏭️ Phase 4: Polish & Error Handling (SKIPPED)
Refine UX and handle edge cases

**Status:** ⏭️ Skipped - Core error handling already implemented  
**Reason:** Basic error handling, loading states, and offline support are already implemented in Phase 1-2. Advanced polish features can be added incrementally as needed.

**Original Deliverables:**
- Loading states and skeletons (Already implemented)
- Comprehensive error handling (Already implemented)
- Offline support (Already implemented via React Query)
- Confirmation dialogs
- Accessibility improvements
- Performance optimization

[→ Detailed Phase 4 Plan](./phase-4-polish-error-handling.md)

---

### ⏭️ Phase 5: Testing & Documentation (SKIPPED)
Ensure quality and maintainability

**Status:** ⏭️ Skipped - Basic tests already written  
**Reason:** Unit tests for services and hooks were completed in Phase 1. Additional integration tests and documentation can be added as the feature evolves.

**Original Deliverables:**
- Integration tests
- Manual QA testing (iOS/Android)
- User documentation
- Code documentation
- Performance validation

[→ Detailed Phase 5 Plan](./phase-5-testing-documentation.md)

---

## State Management Strategy

### React Query Only - No Redux

**Rationale:**
- Reports are server state (not client state)
- React Query handles caching, pagination, refetching
- No need to persist reports across sessions
- Optimistic updates handled by mutations
- Matches existing patterns in codebase

### Cache Configuration

```typescript
// User report submission - invalidate admin cache
queryKey: ["user-reports"]
staleTime: N/A (mutation only)

// Admin reports list - moderate cache
queryKey: ["admin-reports", { page, size, sort, status }]
staleTime: 30 * 1000 // 30 seconds

// Single report detail - longer cache
queryKey: ["admin-reports", reportId]
staleTime: 60 * 1000 // 1 minute

// Invalidation strategy:
// - After submit: invalidate ["admin-reports"]
// - After handle: invalidate ["admin-reports"]
// - Manual refresh: refetch()
```

---

## Security Considerations

### Role-Based Access Control

**Frontend Guards:**
```typescript
// Check user role from Redux auth state
const user = useAppSelector(state => state.auth.user);
const isAdmin = user?.roles?.some(role => role.name === "ADMIN");

// Hide admin UI from non-admins
if (!isAdmin) {
  return null;
}
```

**Backend Enforcement:**
- Backend must validate user roles on every admin endpoint
- Frontend checks are for UX only, not security

### Permission Errors

**401 Unauthorized:**
- Triggers automatic token refresh via `httpClient`
- If refresh fails, clear tokens and redirect to login

**403 Forbidden:**
- Show error toast: "Bạn không có quyền thực hiện thao tác này"
- Optionally redirect to home screen

---

## Error Handling Strategy

### Network Errors
- Auto-retry with exponential backoff (max 3 attempts)
- Don't retry 4xx client errors
- Toast: "Không thể kết nối. Vui lòng kiểm tra mạng."

### Validation Errors
- Local validation before submission
- Display backend error messages via toast
- Highlight invalid form fields

### Duplicate Reports
- Backend prevents duplicates (same user + content)
- Frontend shows: "Bạn đã báo cáo nội dung này rồi"
- Disable report button if already reported

### Race Conditions
- Optimistic updates with rollback on error
- Cache invalidation after mutations
- Staleness indicators if data > 1 minute old

### Offline Support
- React Query handles retry automatically
- Show offline banner when network unavailable
- Manual retry button for failed requests

---

## Testing Strategy

### Unit Tests
- Service functions (mock httpClient)
- React Query hooks (mock API responses)
- Utility functions (validators, formatters)

### Integration Tests
- Report submission flow (user → backend → admin)
- Admin moderation workflow
- Optimistic updates and rollbacks
- Error scenarios

### Manual QA Checklist
- [ ] Test on iOS and Android
- [ ] Test with slow network (3G throttling)
- [ ] Test offline behavior
- [ ] Test with real backend API
- [ ] Test admin/non-admin role access
- [ ] Test long descriptions (max length)
- [ ] Test empty states
- [ ] Test pagination with 100+ reports
- [ ] Test concurrent admin actions

---

## Success Criteria

### Functional Requirements
- Users can report posts, comments, and users
- Reports are successfully submitted to backend
- Admins can view, filter, and paginate reports
- Admins can process or dismiss reports
- Report status updates reflect in real-time

### Performance Requirements
- Report submission: < 2 seconds
- Admin dashboard load: < 3 seconds
- Pagination: smooth, no jank
- Optimistic updates: instant UI feedback

### UX Requirements
- Clear toast notifications for all actions
- Loading states on async operations
- Helpful error messages
- No UI freezes or crashes
- Accessible to screen readers

---

## Risks & Mitigation

### Risk 1: Backend API Changes
**Impact:** Medium | **Likelihood:** Low

**Mitigation:**
- Use TypeScript interfaces to catch breaking changes
- Versioned API endpoint (`/api/v1/reports`)
- Maintain API documentation

### Risk 2: Performance with Large Report Lists
**Impact:** Medium | **Likelihood:** Medium

**Mitigation:**
- Implement pagination (max 20 items per page)
- Use FlatList for virtual scrolling
- React Query's `keepPreviousData` option

### Risk 3: User Abuse (Spam Reporting)
**Impact:** High | **Likelihood:** Medium

**Mitigation:**
- Backend rate limiting
- Frontend disables report button after submission
- Track report patterns in analytics
- Admin can identify repeat offenders

### Risk 4: Admin Permission Leak
**Impact:** Critical | **Likelihood:** Low

**Mitigation:**
- Backend enforces RBAC on all admin endpoints
- Frontend hides admin UI from non-admins
- Never trust client-side role checks for security

---

## Dependencies & Prerequisites

### Required Before Implementation
- Backend API deployed and accessible
- Test accounts with ADMIN role
- API documentation verified

### Existing Dependencies (Already in package.json)
- `@tanstack/react-query` - State management
- `@expo/vector-icons` - Icons
- `react-native-toast-message` - Toast notifications
- `expo-router` - Navigation

### No New Dependencies Required

---

## Future Enhancements (Out of Scope)

1. **Report Analytics Dashboard** - Charts showing trends, common violations
2. **Batch Actions** - Select and handle multiple reports at once
3. **Report Escalation** - Auto-escalate unhandled reports after 24 hours
4. **User Feedback Loop** - Notify reporters when their report is processed
5. **Content Preview** - Display reported content directly in modal
6. **Auto-Moderation** - ML model to flag high-confidence violations

---

## Questions for Backend Team

Before starting implementation, clarify:

1. **Duplicate Handling:** Does backend prevent duplicate reports? What error code?
2. **User Info:** Does `ReportResponse` include reporter details or fetch separately?
3. **Content Preview:** Should frontend fetch reported content or is it in response?
4. **Pagination:** Page numbering 0-indexed or 1-indexed? Max size limit?
5. **Status Transitions:** Can reports be re-opened after processing/dismissing?
6. **Notifications:** Should users receive push notifications when reports are handled?
7. **Rate Limiting:** Is there a daily report submission limit? Error response?

---

## Implementation Summary

### ✅ Completed Work (Phases 1-2)

**Phase 1 - Foundation:**
- Created TypeScript type definitions for reports
- Implemented service layer (`services/reports.ts`)
- Built React Query hooks (`hooks/useReports.ts`)
- Added unit tests for services and hooks

**Phase 2 - User Features:**
- Created ReportModal component
- Integrated report functionality with posts, comments, and user profiles
- Implemented form validation and error handling
- Added analytics tracking for all report actions
- Implemented loading states and toast notifications

### 📋 Current Status

Users can now:
- Report inappropriate posts, comments, and users
- Select from predefined violation types
- Provide optional detailed descriptions
- Receive instant feedback via toast notifications
- Access report functionality from contextual menus

### 🔄 Next Steps (When Needed)

**Phase 3 - Admin Features (Future Work):**
- Implement admin dashboard for reviewing reports
- Add report filtering and sorting
- Build report processing workflow
- Create admin role guards

**Additional Enhancements (Future Considerations):**
- Report analytics dashboard
- Batch moderation actions
- User feedback loop when reports are processed
- Content preview in report details

---

## Notes

- Follow existing code style and patterns
- Use NativeWind for styling (Tailwind classes)
- Vietnamese language for all user-facing text
- Track all user actions with analytics
- Write tests as you go, not at the end
- Document complex logic with comments

---

**Implementation Complete:** ✅ User-facing features ready  
**Admin Features:** Deferred for future implementation
