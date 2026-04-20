# Privacy Enforcement Verification Checklist

**Purpose:** Ensure backend properly enforces PRIVATE post visibility before Phase 1 deployment.

**Date Created:** 2026-04-20  
**Status:** ⚠️ PENDING VERIFICATION  

---

## Critical Requirements

Privacy enforcement MUST be handled by the backend. Frontend privacy settings are only UI controls - the backend is responsible for:

1. Filtering PRIVATE posts from unauthorized users in list endpoints
2. Returning 403 Forbidden for unauthorized access to individual PRIVATE posts
3. Allowing post creators to always see their own PRIVATE posts
4. Allowing group members to access PRIVATE posts linked to their itineraries (Phase 7 feature)

---

## Manual Testing Protocol

### Test Setup

**Required:**
- 2 test accounts (User A, User B)
- API testing tool (Postman, curl, or similar)
- Backend API running locally or on staging environment

**Test Data:**
- User A ID: `[INSERT_USER_A_ID]`
- User B ID: `[INSERT_USER_B_ID]`
- User A Auth Token: `[INSERT_TOKEN_A]`
- User B Auth Token: `[INSERT_TOKEN_B]`

---

## Test Cases

### TC1: Create PRIVATE Post

**Objective:** Verify PRIVATE posts can be created and visibility flag is stored correctly.

**Steps:**
1. Authenticate as User A
2. Create a post with `visibility: "PRIVATE"`

```bash
curl -X POST https://api.tripjoy.com/posts \
  -H "Authorization: Bearer [USER_A_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a private test post",
    "visibility": "PRIVATE",
    "media_urls": ["https://example.com/test.jpg"]
  }'
```

**Expected Result:**
- HTTP 200/201 response
- Response includes `visibility: "PRIVATE"`
- Response includes `creator_id: "[USER_A_ID]"`
- Note the `post_id` for subsequent tests: `[INSERT_POST_ID]`

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

**Notes:**
```
[Your test results here]
```

---

### TC2: Creator Can View Own PRIVATE Post (List)

**Objective:** User A can see their own PRIVATE posts in feed.

**Steps:**
1. Authenticate as User A
2. Fetch posts list

```bash
curl -X GET https://api.tripjoy.com/posts \
  -H "Authorization: Bearer [USER_A_TOKEN]"
```

**Expected Result:**
- HTTP 200 response
- Response includes the PRIVATE post created in TC1
- Post visibility is `"PRIVATE"`

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

**Notes:**
```
[Your test results here]
```

---

### TC3: Creator Can View Own PRIVATE Post (Detail)

**Objective:** User A can access their PRIVATE post by ID.

**Steps:**
1. Authenticate as User A
2. Fetch specific post by ID

```bash
curl -X GET https://api.tripjoy.com/posts/[POST_ID] \
  -H "Authorization: Bearer [USER_A_TOKEN]"
```

**Expected Result:**
- HTTP 200 response
- Returns full post details
- Visibility is `"PRIVATE"`

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

**Notes:**
```
[Your test results here]
```

---

### TC4: Unauthorized User Cannot See PRIVATE Post (List)

**Objective:** User B cannot see User A's PRIVATE posts in feed.

**Steps:**
1. Authenticate as User B
2. Fetch posts list

```bash
curl -X GET https://api.tripjoy.com/posts \
  -H "Authorization: Bearer [USER_B_TOKEN]"
```

**Expected Result:**
- HTTP 200 response
- Response does NOT include User A's PRIVATE post
- Only PUBLIC posts or User B's own posts are returned

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

**Notes:**
```
[Your test results here]
```

---

### TC5: Unauthorized User Cannot Access PRIVATE Post (Detail)

**Objective:** User B cannot access User A's PRIVATE post by ID.

**Steps:**
1. Authenticate as User B
2. Attempt to fetch User A's PRIVATE post

```bash
curl -X GET https://api.tripjoy.com/posts/[POST_ID] \
  -H "Authorization: Bearer [USER_B_TOKEN]"
```

**Expected Result:**
- HTTP 403 Forbidden OR HTTP 404 Not Found
- Error message: "You do not have permission to view this post" (or similar)

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

**Notes:**
```
[Your test results here]
```

---

### TC6: Unauthenticated User Cannot See PRIVATE Post (List)

**Objective:** Anonymous users cannot see PRIVATE posts.

**Steps:**
1. Do NOT send Authorization header
2. Fetch posts list

```bash
curl -X GET https://api.tripjoy.com/posts
```

**Expected Result:**
- HTTP 200 response
- Response does NOT include any PRIVATE posts
- Only PUBLIC posts are returned

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

**Notes:**
```
[Your test results here]
```

---

### TC7: Unauthenticated User Cannot Access PRIVATE Post (Detail)

**Objective:** Anonymous users cannot access PRIVATE posts by ID.

**Steps:**
1. Do NOT send Authorization header
2. Attempt to fetch PRIVATE post

```bash
curl -X GET https://api.tripjoy.com/posts/[POST_ID]
```

**Expected Result:**
- HTTP 401 Unauthorized OR HTTP 403 Forbidden OR HTTP 404 Not Found
- Error message about authentication/authorization required

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

**Notes:**
```
[Your test results here]
```

---

### TC8: Update Post Visibility (PUBLIC → PRIVATE)

**Objective:** Changing visibility to PRIVATE immediately hides post from unauthorized users.

**Steps:**
1. Create a PUBLIC post as User A
2. Verify User B can see it
3. Update post to PRIVATE
4. Verify User B can NO LONGER see it

```bash
# Step 1: Create PUBLIC post
curl -X POST https://api.tripjoy.com/posts \
  -H "Authorization: Bearer [USER_A_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Public post",
    "visibility": "PUBLIC"
  }'
# Note the new_post_id

# Step 2: User B fetches list (should see it)
curl -X GET https://api.tripjoy.com/posts \
  -H "Authorization: Bearer [USER_B_TOKEN]"

# Step 3: Update to PRIVATE
curl -X PUT https://api.tripjoy.com/posts/[NEW_POST_ID] \
  -H "Authorization: Bearer [USER_A_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"visibility": "PRIVATE"}'

# Step 4: User B fetches list again (should NOT see it)
curl -X GET https://api.tripjoy.com/posts \
  -H "Authorization: Bearer [USER_B_TOKEN]"
```

**Expected Result:**
- Before update: User B sees the post
- After update: User B does NOT see the post
- User A still sees it

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

**Notes:**
```
[Your test results here]
```

---

## Test Summary

| Test Case | Status | Blocker? |
|-----------|--------|----------|
| TC1: Create PRIVATE Post | ⬜ | Yes |
| TC2: Creator View Own (List) | ⬜ | Yes |
| TC3: Creator View Own (Detail) | ⬜ | Yes |
| TC4: Unauthorized Cannot See (List) | ⬜ | Yes |
| TC5: Unauthorized Cannot See (Detail) | ⬜ | Yes |
| TC6: Unauthenticated Cannot See (List) | ⬜ | No |
| TC7: Unauthenticated Cannot See (Detail) | ⬜ | No |
| TC8: Update Visibility | ⬜ | No |

**Overall Status:** ⬜ Not Started | ⚠️ In Progress | ✅ All Passed | ❌ Has Failures

---

## Backend Contract Verification

**Required Backend Behavior:**

- [ ] `GET /posts` endpoint filters results by visibility:
  - Unauthenticated: only PUBLIC posts
  - Authenticated: PUBLIC posts + own PRIVATE posts
  - No user should see another user's PRIVATE posts (unless group member in Phase 7)

- [ ] `GET /posts/{id}` endpoint enforces access control:
  - Returns 403/404 if post is PRIVATE and requester is not the creator
  - Returns post if requester is the creator
  - Returns post if post is PUBLIC

- [ ] `POST /posts` endpoint:
  - Accepts `visibility` field
  - Defaults to PUBLIC if not specified
  - Stores visibility correctly in database

- [ ] `PUT /posts/{id}` endpoint:
  - Allows updating visibility
  - Only post creator can update
  - Visibility changes take effect immediately

---

## Findings

### Backend Ready: ⬜ Yes | ⬜ No | ⬜ Partially

**Issues Found:**
```
[Document any privacy leaks or issues discovered during testing]
```

**Recommended Actions:**
```
[What needs to be fixed before Phase 1 can proceed]
```

---

## Sign-off

**Tested By:** `[Your Name]`  
**Test Date:** `[YYYY-MM-DD]`  
**Backend Version:** `[Version/Commit Hash]`  
**Environment:** `[Local/Staging/Production]`

**Decision:**
- [ ] ✅ Backend privacy enforcement verified - safe to proceed with Phase 1
- [ ] ⚠️ Backend has minor issues - can proceed with known limitations
- [ ] ❌ Backend privacy is broken - BLOCKER for Phase 1 deployment

**Notes:**
```
[Any additional context or recommendations]
```

---

## Phase 7 Considerations (Future)

When implementing itinerary group member access (Phase 7), additional tests will be needed:

- Group member can see PRIVATE posts linked to their shared itinerary
- Non-group-member cannot see PRIVATE posts even if itinerary_id is known
- Removing a user from a group immediately revokes access to PRIVATE posts

These tests are OUT OF SCOPE for Phase 1.
