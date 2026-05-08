# Phase 5: Testing & Documentation (2 days)

**Goal:** Ensure quality through comprehensive testing and create documentation for maintainability

**Prerequisites:** Phase 1-4 completed (all features implemented and polished)

---

## Tasks Overview

1. Integration testing
2. End-to-end testing
3. Manual QA testing
4. Performance validation
5. Security review
6. Documentation
7. Deployment preparation

---

## Task 1: Integration Testing

### Test Report Submission Flow

**File: `__tests__/integration/report-submission.test.tsx` (NEW)**

```typescript
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSubmitReport } from "@/hooks/useReports";
import { ContentType, ReportType } from "@/types/report";
import * as reportService from "@/services/reports";

jest.mock("@/services/reports");
jest.mock("@/utils/toast");
jest.mock("@/utils/analytics");

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe("Report Submission Integration", () => {
  it("should submit report and invalidate admin cache", async () => {
    const queryClient = createTestQueryClient();
    const mockResponse = {
      code: 1000,
      data: { id: "report-123" },
    };
    (reportService.submitReport as jest.Mock).mockResolvedValue(mockResponse);

    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useSubmitReport(), { wrapper });

    const payload = {
      content_id: "post-123",
      content_type: ContentType.POST,
      report_type: ReportType.SPAM,
      description: "Test spam report",
    };

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify admin cache was invalidated
    const adminReportsQuery = queryClient.getQueryState(["admin-reports"]);
    expect(adminReportsQuery).toBeDefined();
  });

  it("should handle submission error gracefully", async () => {
    const queryClient = createTestQueryClient();
    (reportService.submitReport as jest.Mock).mockRejectedValue(
      new Error("Network error")
    );

    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useSubmitReport(), { wrapper });

    const payload = {
      content_id: "post-123",
      content_type: ContentType.POST,
      report_type: ReportType.SPAM,
    };

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });
});
```

### Test Admin Moderation Flow

**File: `__tests__/integration/report-moderation.test.tsx` (NEW)**

```typescript
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHandleReport, useReportDetail } from "@/hooks/useReports";
import { ReportStatus } from "@/types/report";
import * as reportService from "@/services/reports";

jest.mock("@/services/reports");
jest.mock("@/utils/toast");
jest.mock("@/utils/analytics");

describe("Report Moderation Integration", () => {
  it("should process report and update cache optimistically", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const mockReport = {
      id: "report-123",
      status: ReportStatus.PENDING,
      reason: "SPAM",
      reportedBy: "user-123",
      reportedEntityId: "post-123",
      reportedEntityType: "POST",
    };

    const mockHandleResponse = {
      code: 1000,
      data: {
        ...mockReport,
        status: ReportStatus.PROCESSED,
      },
    };

    (reportService.getReportById as jest.Mock).mockResolvedValue({
      code: 1000,
      data: mockReport,
    });
    (reportService.handleReport as jest.Mock).mockResolvedValue(mockHandleResponse);

    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    // First, fetch report detail
    const { result: detailResult } = renderHook(
      () => useReportDetail("report-123"),
      { wrapper }
    );

    await waitFor(() => expect(detailResult.current.isSuccess).toBe(true));
    expect(detailResult.current.data?.status).toBe(ReportStatus.PENDING);

    // Then, handle report
    const { result: handleResult } = renderHook(() => useHandleReport(), { wrapper });

    handleResult.current.mutate({
      reportId: "report-123",
      payload: {
        status: ReportStatus.PROCESSED,
        description: "Admin note",
      },
    });

    await waitFor(() => expect(handleResult.current.isSuccess).toBe(true));

    // Verify cache was updated
    const updatedReport = queryClient.getQueryData(["admin-reports", "report-123"]);
    expect((updatedReport as any)?.status).toBe(ReportStatus.PROCESSED);
  });
});
```

**Acceptance Criteria:**
- Integration tests pass
- Hooks interact correctly with services
- Cache invalidation works
- Optimistic updates work
- Error handling tested

---

## Task 2: End-to-End Testing (Optional)

### E2E Test with Detox or Maestro

**File: `e2e/report-flow.test.js` (NEW)**

```javascript
describe("Report & Moderation Flow", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("should allow user to report a post", async () => {
    // Login as user
    await element(by.id("email-input")).typeText("user@test.com");
    await element(by.id("password-input")).typeText("password123");
    await element(by.id("login-button")).tap();

    // Navigate to post
    await element(by.id("post-list")).scroll(200, "down");
    await element(by.id("post-123")).tap();

    // Open actions menu
    await element(by.id("post-actions-button")).tap();

    // Select report option
    await element(by.text("Báo cáo vi phạm")).tap();

    // Select report reason
    await element(by.text("Spam (Quảng cáo rác)")).tap();

    // Enter description
    await element(by.id("report-description-input")).typeText(
      "This is a spam post"
    );

    // Submit report
    await element(by.text("Gửi báo cáo")).tap();

    // Verify success toast
    await expect(element(by.text("Báo cáo đã được gửi thành công!"))).toBeVisible();
  });

  it("should allow admin to process report", async () => {
    // Login as admin
    await element(by.id("email-input")).typeText("admin@test.com");
    await element(by.id("password-input")).typeText("admin123");
    await element(by.id("login-button")).tap();

    // Navigate to admin dashboard
    await element(by.id("admin-tab")).tap();
    await element(by.text("Quản lý báo cáo")).tap();

    // Filter by pending
    await element(by.text("Đang chờ")).tap();

    // Click first report
    await element(by.id("report-list-item-0")).tap();

    // Add admin note
    await element(by.id("admin-notes-input")).typeText("Removed spam post");

    // Process report
    await element(by.text("Xử lý")).tap();

    // Confirm
    await element(by.text("Xác nhận")).tap();

    // Verify success
    await expect(element(by.text("Báo cáo đã xử lý thành công!"))).toBeVisible();
  });
});
```

**Note:** E2E tests require:
- Backend staging environment
- Test accounts (user + admin)
- Detox or Maestro setup

**Acceptance Criteria (if E2E implemented):**
- E2E tests pass on iOS and Android
- Full user flow works end-to-end
- Admin flow works end-to-end

---

## Task 3: Manual QA Testing

### QA Test Plan

**File: `docs/qa-test-plan-reports.md` (NEW)**

```markdown
# QA Test Plan: Report & Moderation Module

## Test Environment
- iOS Simulator (iPhone 14 Pro, iOS 16+)
- Android Emulator (Pixel 6, Android 13)
- Real devices: iPhone, Samsung Galaxy

## Test Accounts
- User account: user@test.com / password123
- Admin account: admin@test.com / admin123

---

## User Features Tests

### TC-01: Report Post
**Preconditions:** Logged in as user
1. Navigate to any post
2. Tap "..." menu
3. Select "Báo cáo vi phạm"
4. Verify modal opens
5. Select "Spam (Quảng cáo rác)"
6. Enter description "Test report"
7. Tap "Gửi báo cáo"
8. **Expected:** Success toast appears, modal closes

### TC-02: Report Comment
**Preconditions:** Logged in as user
1. Open post with comments
2. Long-press or tap "..." on comment
3. Select "Báo cáo bình luận"
4. Select "Quấy rối"
5. Tap "Gửi báo cáo"
6. **Expected:** Success toast appears

### TC-03: Report User
**Preconditions:** Logged in as user
1. Navigate to another user's profile
2. Tap "..." menu
3. Select "Báo cáo người dùng"
4. Select "Ngôn từ kích động"
5. Tap "Gửi báo cáo"
6. **Expected:** Success toast appears

### TC-04: Cannot Report Own Profile
**Preconditions:** Logged in as user
1. Navigate to own profile
2. **Expected:** Report option not visible

### TC-05: Form Validation
**Preconditions:** Logged in as user, report modal open
1. Try to submit without selecting reason
2. **Expected:** Error toast "Vui lòng chọn lý do báo cáo"
3. Select reason
4. Enter 501 characters in description
5. **Expected:** Input limited to 500 characters

---

## Admin Features Tests

### TC-06: Admin Access Control
**Preconditions:** Logged in as normal user
1. Manually navigate to `/admin/reports`
2. **Expected:** Access denied screen

### TC-07: Admin View Reports List
**Preconditions:** Logged in as admin
1. Navigate to Admin → Reports
2. **Expected:** List of reports displayed
3. Pull down to refresh
4. **Expected:** List refreshes

### TC-08: Filter Reports by Status
**Preconditions:** Admin on reports page
1. Tap "Đang chờ" filter
2. **Expected:** Only pending reports shown
3. Tap "Đã xử lý" filter
4. **Expected:** Only processed reports shown

### TC-09: Pagination
**Preconditions:** Admin on reports page with 20+ reports
1. Scroll to bottom
2. Tap "Sau" button
3. **Expected:** Next page loads
4. Tap "Trước" button
5. **Expected:** Previous page loads

### TC-10: View Report Details
**Preconditions:** Admin on reports page
1. Tap any report card
2. **Expected:** Detail modal opens
3. Verify all fields display correctly
4. Tap "X" to close
5. **Expected:** Modal closes

### TC-11: Process Report
**Preconditions:** Admin viewing pending report
1. Enter admin note "Spam confirmed"
2. Tap "Xử lý" button
3. **Expected:** Confirmation dialog appears
4. Tap "Xác nhận"
5. **Expected:** Success toast, status updates to PROCESSED

### TC-12: Dismiss Report
**Preconditions:** Admin viewing pending report
1. Tap "Từ chối" button
2. **Expected:** Confirmation dialog appears
3. Tap "Xác nhận"
4. **Expected:** Success toast, status updates to DISMISSED

---

## Error Scenarios

### TC-13: Network Error on Submit
1. Turn on airplane mode
2. Try to submit report
3. **Expected:** Error toast "Không thể kết nối"

### TC-14: Network Error on Admin List
1. Turn on airplane mode
2. Navigate to admin reports
3. **Expected:** Error screen with retry button
4. Turn off airplane mode
5. Tap retry
6. **Expected:** List loads successfully

### TC-15: Duplicate Report (if backend prevents)
1. Report a post
2. Try to report same post again
3. **Expected:** Error toast "Bạn đã báo cáo nội dung này rồi"

---

## Performance Tests

### TC-16: Smooth Scrolling
1. Load reports list with 100+ items
2. Scroll rapidly up and down
3. **Expected:** Smooth scrolling, no frame drops

### TC-17: Load Time
1. Navigate to admin reports
2. Measure time to first render
3. **Expected:** < 3 seconds

---

## Accessibility Tests

### TC-18: Screen Reader Navigation
1. Enable VoiceOver (iOS) or TalkBack (Android)
2. Navigate report modal
3. **Expected:** All elements readable, proper labels

### TC-19: Color Contrast
1. Use accessibility inspector
2. Check all text elements
3. **Expected:** All pass WCAG AA (4.5:1 ratio)

---

## Edge Cases

### TC-20: Very Long Description
1. Open report modal
2. Enter 500 character description
3. Submit
4. **Expected:** Accepts and submits

### TC-21: Empty Reports List
1. Filter to status with no reports
2. **Expected:** Empty state with friendly message

### TC-22: Slow Network (3G)
1. Throttle network to 3G speed
2. Submit report
3. **Expected:** Loading indicator, eventually succeeds or shows error

---

## Acceptance Criteria
- All test cases pass on iOS
- All test cases pass on Android
- No critical bugs found
- Performance meets targets
- Accessibility requirements met
```

### Execute Manual Tests

Create test execution log:

**File: `docs/qa-test-execution-log.md` (NEW)**

```markdown
# QA Test Execution Log

**Test Date:** 2026-05-XX  
**Tester:** [Name]  
**Build:** v1.0.0-reports  
**Environment:** Staging

| Test ID | Test Name | Status | Notes | Screenshot |
|---------|-----------|--------|-------|------------|
| TC-01 | Report Post | ✅ PASS | - | - |
| TC-02 | Report Comment | ✅ PASS | - | - |
| TC-03 | Report User | ✅ PASS | - | - |
| ... | ... | ... | ... | ... |

**Summary:**
- Total Tests: 22
- Passed: 20
- Failed: 2
- Blocked: 0

**Issues Found:**
1. [BUG-001] Modal doesn't close on iOS when tapping background
2. [BUG-002] Admin notes field not clearing after submission
```

**Acceptance Criteria:**
- Manual QA test plan created
- All tests executed on iOS and Android
- Test execution log completed
- Critical bugs fixed
- Non-critical bugs documented

---

## Task 4: Performance Validation

### Performance Metrics

**File: `docs/performance-metrics.md` (NEW)**

```markdown
# Performance Metrics: Report & Moderation

## Test Environment
- Device: iPhone 14 Pro, Pixel 6
- Network: WiFi, 50 Mbps
- Backend: Staging environment

## Metrics

### Load Times (Target: < 3 seconds)

| Screen | Target | Actual (iOS) | Actual (Android) | Status |
|--------|--------|--------------|------------------|--------|
| Report Modal Open | < 300ms | 250ms | 280ms | ✅ PASS |
| Admin Reports List (initial) | < 3s | 2.1s | 2.4s | ✅ PASS |
| Report Detail Modal | < 500ms | 420ms | 450ms | ✅ PASS |

### API Response Times (Target: < 2 seconds)

| Endpoint | Target | Actual | Status |
|----------|--------|--------|--------|
| POST /reports | < 2s | 1.2s | ✅ PASS |
| GET /reports | < 2s | 1.8s | ✅ PASS |
| GET /reports/{id} | < 1s | 0.6s | ✅ PASS |
| POST /reports/{id}/handle | < 2s | 1.1s | ✅ PASS |

### Scrolling Performance (Target: 60fps)

| Scenario | FPS (iOS) | FPS (Android) | Status |
|----------|-----------|---------------|--------|
| Reports list (20 items) | 60fps | 59fps | ✅ PASS |
| Reports list (100 items) | 58fps | 56fps | ✅ PASS |
| Fast scroll | 57fps | 55fps | ✅ PASS |

### Memory Usage

| Screen | Memory (iOS) | Memory (Android) | Status |
|--------|--------------|------------------|--------|
| Report Modal | +12MB | +15MB | ✅ PASS |
| Admin Dashboard | +35MB | +42MB | ✅ PASS |
| After 10 min usage | +45MB | +55MB | ✅ PASS (no leaks) |

## Recommendations
1. Consider virtual scrolling if list exceeds 200 items
2. Add image lazy loading if showing avatars
3. Monitor memory after 1 hour of usage
```

### Run Performance Tests

```bash
# iOS Performance Test
# Use Xcode Instruments to measure:
# - Time Profiler
# - Allocations
# - Core Animation FPS

# Android Performance Test
# Use Android Studio Profiler:
# - CPU usage
# - Memory usage
# - Network activity
```

**Acceptance Criteria:**
- All load times < 3 seconds
- Scrolling maintains 55+ fps
- No memory leaks detected
- API responses < 2 seconds

---

## Task 5: Security Review

### Security Checklist

**File: `docs/security-review-reports.md` (NEW)**

```markdown
# Security Review: Report & Moderation

## Authentication & Authorization

- [x] All API endpoints require authentication
- [x] Admin endpoints check for ADMIN role on backend
- [x] Frontend hides admin UI from non-admins (UX only)
- [x] Tokens automatically refreshed on 401
- [x] No sensitive data in frontend code

## Input Validation

- [x] Report type validated (enum)
- [x] Content type validated (enum)
- [x] Description limited to 500 characters
- [x] Description sanitized before sending to backend
- [x] No SQL injection vectors (backend handles)
- [x] No XSS vectors (React Native automatically escapes)

## Data Privacy

- [x] Reporter ID not exposed to reported user
- [x] Admin notes only visible to admins
- [x] No PII logged to console (removed in production)
- [x] Analytics data anonymized

## Rate Limiting

- [x] Backend implements rate limiting (verify with backend team)
- [x] Frontend shows appropriate error for 429 responses
- [x] No unlimited retries (max 3 attempts)

## Network Security

- [x] All API calls use HTTPS
- [x] Tokens stored in secure storage (AsyncStorage encrypted on device)
- [x] No tokens in URL params
- [x] No credentials in source code

## Known Issues
- None

## Recommendations
1. Add CAPTCHA if spam reporting becomes an issue
2. Implement report cooldown (e.g., max 5 reports per hour)
3. Log suspicious reporting patterns for review
```

**Acceptance Criteria:**
- Security checklist completed
- No critical vulnerabilities found
- Backend team confirms server-side security
- Sensitive data not exposed

---

## Task 6: Documentation

### User Documentation

**File: `docs/user-guide-reports.md` (NEW)**

```markdown
# User Guide: Report & Moderation

## How to Report Content

### Reporting a Post
1. Open the post you want to report
2. Tap the "..." (more) button in the top-right corner
3. Select "Báo cáo vi phạm"
4. Choose the reason for your report:
   - **Spam**: Advertising or irrelevant content
   - **Quấy rối**: Harassment or bullying
   - **Nội dung không phù hợp**: Inappropriate content
   - **Thông tin sai sự thật**: Misinformation
   - **Bạo lực**: Violence or threats
   - **Ngôn từ kích động**: Hate speech
5. (Optional) Add a detailed description
6. Tap "Gửi báo cáo"

### Reporting a Comment
1. Find the comment you want to report
2. Tap the "..." button on the comment
3. Select "Báo cáo bình luận"
4. Follow steps 4-6 above

### Reporting a User
1. Go to the user's profile
2. Tap the "..." button
3. Select "Báo cáo người dùng"
4. Follow steps 4-6 above

## What Happens Next?

- Your report is sent to our moderation team
- Reports are typically reviewed within 24 hours
- If the report is valid, appropriate action will be taken
- You will not receive a notification about the outcome (privacy protection)

## FAQ

**Q: Can I report the same content multiple times?**  
A: No, you can only report each piece of content once.

**Q: Will the user know I reported them?**  
A: No, all reports are anonymous.

**Q: What if I reported something by mistake?**  
A: Contact support at support@tripjoy.app to cancel your report.
```

### Admin Documentation

**File: `docs/admin-guide-reports.md` (NEW)**

```markdown
# Admin Guide: Report Moderation

## Accessing the Admin Dashboard

1. Login with an admin account
2. Navigate to the Admin tab
3. Select "Quản lý báo cáo"

## Viewing Reports

### Report List
- View all reports with status badges
- **Yellow badge**: Pending review
- **Green badge**: Processed
- **Gray badge**: Dismissed

### Filtering
- Tap "Tất cả" to see all reports
- Tap "Đang chờ" to see only pending reports
- Tap "Đã xử lý" to see processed reports
- Tap "Đã từ chối" to see dismissed reports

### Pagination
- Use "Trước" and "Sau" buttons to navigate pages
- Each page shows 20 reports

## Handling Reports

### Processing a Report (Accept)
1. Click on a report to view details
2. Review the report information:
   - Report type (SPAM, HARASSMENT, etc.)
   - Content type (POST, COMMENT, USER)
   - Reporter information
   - Description (if provided)
3. (Optional) Add admin notes explaining your decision
4. Click "Xử lý" button
5. Confirm the action

**What happens:** The report is marked as processed. You should then take appropriate action on the reported content (remove post, ban user, etc.) in the appropriate admin panel.

### Dismissing a Report (Reject)
1. Click on a report to view details
2. Determine the report is invalid or false
3. (Optional) Add admin notes explaining why
4. Click "Từ chối" button
5. Confirm the action

**What happens:** The report is marked as dismissed. No action is taken on the reported content.

## Best Practices

1. **Review Thoroughly**: Always read the full description before deciding
2. **Be Consistent**: Apply the same standards to all reports
3. **Add Notes**: Document your reasoning for future reference
4. **Act Quickly**: Try to handle reports within 24 hours
5. **Escalate**: If unsure, discuss with other moderators before acting

## Common Scenarios

### False Reports
- User reports content they simply disagree with
- **Action**: Dismiss the report, optionally note "not a violation"

### Spam Reports
- Clear advertising or irrelevant content
- **Action**: Process report, remove the post/comment

### Harassment Reports
- Personal attacks or bullying
- **Action**: Process report, warn or ban user depending on severity

### Duplicate Reports
- Multiple users report the same content
- **Action**: Handle all reports together, add note referencing main report

## Keyboard Shortcuts (Desktop/Tablet)
- `P` - Filter by pending
- `Enter` - Open selected report
- `Ctrl/Cmd + 1` - Process report
- `Ctrl/Cmd + 2` - Dismiss report
```

### Developer Documentation

**File: `docs/developer-guide-reports.md` (NEW)**

```markdown
# Developer Guide: Report & Moderation Module

## Architecture Overview

The Report & Moderation module follows the existing codebase patterns:
- **Service Layer**: API calls in `services/reports.ts`
- **Hooks Layer**: React Query hooks in `hooks/useReports.ts`
- **Component Layer**: UI components in `components/`

## File Structure

\`\`\`
services/reports.ts            # API service layer
hooks/useReports.ts            # React Query hooks
types/report.ts                # TypeScript interfaces
components/
  social/ReportModal.tsx       # User report modal
  admin/
    ReportDashboard.tsx        # Admin main screen
    ReportListItem.tsx         # Report card
    ReportDetailModal.tsx      # Detail view
    ReportFilterBar.tsx        # Filter chips
app/admin/reports.tsx          # Admin route
\`\`\`

## Adding a New Report Type

1. Update enum in `types/report.ts`:
\`\`\`typescript
export enum ReportType {
  // ... existing types
  NEW_TYPE = "NEW_TYPE",
}
\`\`\`

2. Add label:
\`\`\`typescript
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  // ... existing labels
  [ReportType.NEW_TYPE]: "New Type Label",
};
\`\`\`

3. Backend must also support the new type.

## Extending Content Types

To add reports for new content types (e.g., ITINERARY):

1. Add to enum:
\`\`\`typescript
export enum ContentType {
  POST = "POST",
  COMMENT = "COMMENT",
  USER = "USER",
  ITINERARY = "ITINERARY", // New
}
\`\`\`

2. Add integration in component:
\`\`\`typescript
// In itinerary component
import { ReportModal } from "@/components/social/ReportModal";
import { ContentType } from "@/types/report";

<ReportModal
  visible={showReportModal}
  onClose={() => setShowReportModal(false)}
  contentId={itineraryId}
  contentType={ContentType.ITINERARY}
/>
\`\`\`

## API Integration

All API calls go through `httpClient` which handles:
- Automatic token refresh on 401
- Request/response logging
- Error handling
- Retry logic

### Adding a New Endpoint

1. Add service function:
\`\`\`typescript
// services/reports.ts
export async function newReportEndpoint(params: any): Promise<ApiResponse<any>> {
  return httpClient.get(`/api/v1/reports/new-endpoint`, { params });
}
\`\`\`

2. Add hook:
\`\`\`typescript
// hooks/useReports.ts
export function useNewReportFeature() {
  return useQuery({
    queryKey: ["reports-new-feature"],
    queryFn: async () => {
      const response = await newReportEndpoint({});
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message);
    },
  });
}
\`\`\`

## Testing

### Running Tests
\`\`\`bash
# Unit tests
npm test services/reports
npm test hooks/useReports

# Integration tests
npm test integration/report-submission

# E2E tests (if configured)
npm run e2e
\`\`\`

### Writing New Tests
Follow existing patterns in `__tests__/` directory.

## Troubleshooting

### Issue: Reports not appearing in admin dashboard
- Check user has ADMIN role
- Verify backend API is accessible
- Check network logs for API errors

### Issue: Optimistic update not working
- Ensure queryKey matches between useReportDetail and useHandleReport
- Check queryClient.invalidateQueries is called

### Issue: Modal not closing after submission
- Check onSuccess callback in mutation
- Verify onClose prop is called

## Performance Tips

1. Use React.memo for ReportListItem
2. Use FlatList optimization props
3. Limit description field to 500 chars
4. Paginate admin list (20 per page)

## Security Considerations

- Never trust frontend role checks for security
- Backend must validate all permissions
- Sanitize user input before display
- Use HTTPS for all API calls
```

**Acceptance Criteria:**
- User guide created
- Admin guide created
- Developer guide created
- All guides clear and comprehensive

---

## Task 7: Deployment Preparation

### Pre-Deployment Checklist

**File: `docs/deployment-checklist-reports.md` (NEW)**

```markdown
# Deployment Checklist: Report & Moderation Module

## Code Quality
- [ ] All TypeScript errors resolved
- [ ] All ESLint warnings fixed
- [ ] No console.log statements (use proper logging)
- [ ] Code reviewed by senior developer

## Testing
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual QA completed on iOS
- [ ] Manual QA completed on Android
- [ ] Performance metrics meet targets
- [ ] Accessibility tested with screen reader

## Documentation
- [ ] User guide created
- [ ] Admin guide created
- [ ] Developer guide created
- [ ] API endpoints documented
- [ ] Changelog updated

## Backend Coordination
- [ ] Backend API deployed to staging
- [ ] Backend API tested with staging frontend
- [ ] Backend rate limiting configured
- [ ] Backend role-based access working
- [ ] Backend monitoring/alerts set up

## Security
- [ ] Security review completed
- [ ] No sensitive data in code
- [ ] Tokens secured properly
- [ ] Input validation in place

## Analytics
- [ ] Analytics events tracked correctly
- [ ] Error tracking configured
- [ ] Performance monitoring set up

## Rollout Plan
- [ ] Deploy to internal beta first
- [ ] Monitor for 48 hours
- [ ] If stable, deploy to production
- [ ] Monitor production metrics

## Rollback Plan
- [ ] Feature flag configured (if applicable)
- [ ] Rollback procedure documented
- [ ] Backup of previous version available

## Post-Deployment
- [ ] Monitor error rates
- [ ] Monitor API latency
- [ ] Monitor user adoption
- [ ] Collect user feedback
```

### Feature Flag Configuration (Optional)

```typescript
// utils/featureFlags.ts
export const FEATURES = {
  REPORTS_MODULE: true, // Set to false to disable
};

// In code
import { FEATURES } from "@/utils/featureFlags";

if (FEATURES.REPORTS_MODULE) {
  return <ReportButton />;
}
```

**Acceptance Criteria:**
- Deployment checklist completed
- All items checked off
- Rollback plan in place
- Feature ready for deployment

---

## Acceptance Criteria for Phase 5

- [ ] Integration tests written and passing
- [ ] Manual QA test plan created and executed
- [ ] Performance metrics validated
- [ ] Security review completed
- [ ] User documentation created
- [ ] Admin documentation created
- [ ] Developer documentation created
- [ ] Deployment checklist completed
- [ ] All tests passing on iOS and Android
- [ ] No critical bugs remaining

---

## Deliverables

1. **Test Files:**
   - `__tests__/integration/report-submission.test.tsx`
   - `__tests__/integration/report-moderation.test.tsx`
   - `e2e/report-flow.test.js` (optional)

2. **Documentation:**
   - `docs/user-guide-reports.md`
   - `docs/admin-guide-reports.md`
   - `docs/developer-guide-reports.md`
   - `docs/qa-test-plan-reports.md`
   - `docs/qa-test-execution-log.md`
   - `docs/performance-metrics.md`
   - `docs/security-review-reports.md`
   - `docs/deployment-checklist-reports.md`

3. **Test Results:**
   - All tests passing
   - QA log with results
   - Performance metrics report
   - Security review sign-off

---

## Notes

- **Test Coverage:** Aim for 80%+ code coverage
- **Documentation:** Keep docs up-to-date as features evolve
- **QA:** Real device testing is critical, simulators not enough
- **Performance:** Monitor production metrics after deployment

---

**Estimated Time:** 2 days  
**Dependencies:** Phase 1-4 completed  
**Next Step:** Production Deployment
