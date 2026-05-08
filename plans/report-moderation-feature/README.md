# Report & Moderation Module - Implementation Plan

Complete implementation plan for adding Report & Moderation features to the TripJoy mobile app.

## Overview

This plan provides a comprehensive roadmap for implementing user report functionality and admin moderation dashboard, following existing codebase patterns and best practices.

**Total Estimated Time:** 13-17 days (2.5-3.5 weeks)

## Documents

### Main Plan
- **[plan.md](./plan.md)** - High-level overview, architecture, and roadmap

### Phase Documents
1. **[Phase 1: Foundation](./phase-1-foundation.md)** (2-3 days)
   - Type definitions
   - Service layer (API calls)
   - React Query hooks
   - Unit tests

2. **[Phase 2: User Features](./phase-2-user-features.md)** (3-4 days)
   - ReportModal component
   - Integration with post/comment/user menus
   - Analytics tracking
   - Form validation

3. **[Phase 3: Admin Features](./phase-3-admin-features.md)** (4-5 days)
   - Admin navigation route
   - ReportDashboard with pagination
   - Report detail modal
   - Handle report workflow
   - Role-based access control

4. **[Phase 4: Polish & Error Handling](./phase-4-polish-error-handling.md)** (2-3 days)
   - Loading skeletons
   - Comprehensive error handling
   - Offline support
   - Confirmation dialogs
   - Accessibility improvements
   - Performance optimization

5. **[Phase 5: Testing & Documentation](./phase-5-testing-documentation.md)** (2 days)
   - Integration tests
   - Manual QA testing
   - Performance validation
   - Security review
   - User/Admin/Developer documentation

## Quick Start

### Prerequisites
- Backend API deployed at `/api/v1/reports`
- Test accounts with USER and ADMIN roles
- Development environment set up

### Getting Started

1. **Read the main plan:**
   ```bash
   cat plan.md
   ```

2. **Start with Phase 1:**
   ```bash
   cat phase-1-foundation.md
   ```

3. **Follow phases sequentially** - Each phase builds on the previous one

4. **Check acceptance criteria** at the end of each phase before proceeding

## Key Features

### User Features
- Report posts, comments, and users
- Predefined violation types (SPAM, HARASSMENT, etc.)
- Optional detailed description (500 chars max)
- Instant feedback via toast notifications
- Cannot report own content

### Admin Features
- View all reports with pagination (20 per page)
- Filter by status (ALL/PENDING/PROCESSED/DISMISSED)
- View detailed report information
- Process reports (approve) or dismiss (reject)
- Add admin notes when handling reports
- Track who handled reports and when

## Architecture Highlights

### Technology Stack
- **State Management:** React Query (TanStack Query)
- **HTTP Client:** Existing `httpClient` with auto token refresh
- **UI Framework:** React Native + NativeWind (Tailwind CSS)
- **Type Safety:** TypeScript with strict typing

### Design Patterns
- Service layer pattern (`services/reports.ts`)
- React Query hooks pattern (`hooks/useReports.ts`)
- Component pattern (modals, cards)
- Optimistic updates with rollback
- Error handling with toast notifications

### File Structure
```
services/reports.ts              # API calls
hooks/useReports.ts              # React Query hooks
types/report.ts                  # TypeScript interfaces
components/
  social/ReportModal.tsx         # User report modal
  admin/
    ReportDashboard.tsx          # Admin list view
    ReportListItem.tsx           # Report card
    ReportDetailModal.tsx        # Detail view
    ReportFilterBar.tsx          # Filters
app/admin/reports.tsx            # Admin route
```

## Implementation Tips

### Following Existing Patterns
- **Services:** Look at `services/social.ts` for examples
- **Hooks:** Look at `hooks/useSocial.ts` for patterns
- **Modals:** Look at `components/social/ShareModal.tsx` for UI patterns
- **Error Handling:** Use `showErrorToast()` and `showSuccessToast()`
- **Analytics:** Use `trackEvent()` and `trackError()`

### Code Style
- Use NativeWind (Tailwind) for styling
- Vietnamese for all user-facing text
- Strict TypeScript typing
- JSDoc comments for exported functions
- No console.log in production code

### Testing Strategy
- Write tests as you implement (don't wait until the end)
- Test happy paths and error scenarios
- Manual testing on both iOS and Android
- Performance testing with large datasets

## Success Criteria

### Functional
- Users can report content successfully
- Admins can view and handle reports
- Reports update in real-time
- Role-based access works correctly

### Performance
- Report submission: < 2 seconds
- Admin dashboard load: < 3 seconds
- Smooth scrolling (55+ fps)
- No memory leaks

### UX
- Clear feedback for all actions
- Loading states everywhere
- Helpful error messages
- Accessible to screen readers

## Questions?

### Backend Integration
See API contract in [plan.md](./plan.md#api-contract) section

### Troubleshooting
Check [phase-5-testing-documentation.md](./phase-5-testing-documentation.md) for common issues

### Security Concerns
Review [phase-5-testing-documentation.md](./phase-5-testing-documentation.md#task-5-security-review)

## Contact

For questions or clarifications about this plan:
- Review the specification: `/media/ngocha/D/datn_tripjoy/docs/frontend-report-moderation-implementation-guide.md`
- Check backend docs: `/media/ngocha/D/tripjoy-api/docs/report_api_integration_guide.md`
- Consult with backend team for API-related questions

---

**Plan Created:** 2026-05-08  
**Status:** Ready for Implementation ✅  
**Approved By:** [Pending Approval]
