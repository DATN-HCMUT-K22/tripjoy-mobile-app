# Post Module - Business Specification

> **Document Type**: Business Requirements & User Stories  
> **Audience**: Business Analysts, Product Owners, Stakeholders  
> **Last Updated**: 2026-04-20  
> **Status**: Active  
> **Related Technical Docs**: [Post API Reference](./post.md)

---

## 📌 Table of Contents

1. [Overview & Core Concepts](#1-overview--core-concepts)
2. [Business Rules & Validation](#2-business-rules--validation)
3. [User Workflows & Stories](#3-user-workflows--stories)
4. [Feature Requirements](#4-feature-requirements)
5. [Integration Points](#5-integration-points)

---

## 1. Overview & Core Concepts

### 1.1 Module Purpose

The Post module enables TripJoy users to share travel experiences, trip plans, and recommendations with the community. It serves as the primary content discovery and social engagement layer, allowing users to:
- Document and share completed trips or upcoming itineraries
- Discover travel inspiration through search and filtering
- Engage socially via likes, saves, and comments
- Build a personal travel portfolio

### 1.2 Business Value

- **User Engagement**: Keeps users active through social interactions and content discovery
- **Content Virality**: Hashtag system and search enable organic content spread
- **Trip Planning Aid**: Links to itineraries help users plan based on real experiences
- **Community Building**: Social features (like/save/comment) foster user connections

### 1.3 Key Entities & Relationships

**Post** (core entity)
- **Attributes**: 
  - Content (text, required)
  - Media URLs (images/videos, optional, multi-upload)
  - Visibility (PUBLIC/PRIVATE, defaults PUBLIC)
  - Share quantity (counter, initialized to 0)
  - Soft delete info (for recovery/audit)
- **Relationships**:
  - `creator` → User (1:1, required) — who created the post
  - `itinerary` → Itinerary (1:0..1, optional) — linked trip plan
  - `hashtags` → Hashtag (N:M) — discoverability tags
  - `comments` → Comment (1:N) — user reactions in text
  - `likeUsers` → User (N:M) — users who liked
  - `saveUsers` → User (N:M) — users who bookmarked

**Data Model Notes**:
- Hashtags are normalized (lowercased, '#' prefix removed) and shared across posts
- Media URLs reference Cloudinary CDN (pre-upload required via `/media/upload` endpoint)
- Soft delete preserves content for audit; `isDeleted=true` hides from feeds

### 1.4 Visibility Modes

| Mode | Description | Current Implementation Status |
|------|-------------|-------------------------------|
| **PUBLIC** | Visible to all users in feeds, search results | ✅ Fully implemented (default) |
| **PRIVATE** | Visible only to creator and group members (if linked to group itinerary) | ⚠️ Field exists, filtering NOT implemented |

**Important**: As of current version, PRIVATE visibility is stored but not enforced in queries. All posts appear in public feeds regardless of visibility setting. Future enhancement required.

---

## 2. Business Rules & Validation

### 2.1 Post Creation Rules

| Rule ID | Rule | Validation |
|---------|------|------------|
| **R-POST-01** | Content is mandatory | `@NotBlank` validation; reject empty/whitespace-only content |
| **R-POST-02** | Visibility defaults to PUBLIC if not specified | Server-side default in `PostRequest.visibility` |
| **R-POST-03** | Media URLs must be pre-uploaded to Cloudinary | No validation on URL format currently; client responsibility to call `/api/v1/media/upload` first |
| **R-POST-04** | Hashtags are normalized before storage | Strip '#' prefix, lowercase, deduplicate (handled by `HashtagService.syncHashtags()`) |
| **R-POST-05** | Itinerary link is optional | If provided, must reference existing itinerary; throws `RESOURCE_NOT_FOUND` if invalid UUID |
| **R-POST-06** | Share quantity initializes to 0 | Server-managed; not editable by user |
| **R-POST-07** | Creator is auto-set to authenticated user | Derived from JWT; cannot be spoofed |

### 2.2 Authorization & Ownership Rules

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| **R-AUTH-01** | Only creator can update their post | `validateOwnership()` checks `creator.id == currentUser.id`; throws `UNAUTHORIZED` if mismatch |
| **R-AUTH-02** | Only creator can delete their post | Same as R-AUTH-01; soft delete via `markAsDeleted()` |
| **R-AUTH-03** | Any authenticated user can like/save any post | No ownership check; idempotent (Set-based storage prevents duplicates) |
| **R-AUTH-04** | Guest users (unauthenticated) can view PUBLIC posts | `currentUserId` is optional in `getPosts()`; `is_liked`/`is_saved` default to `false` |
| **R-AUTH-05** | PRIVATE posts should only be visible to creator + related group members | ⚠️ **NOT IMPLEMENTED** — all posts currently visible in public feeds |

### 2.3 Soft Delete Behavior

| Aspect | Behavior |
|--------|----------|
| **Trigger** | `DELETE /posts/{postId}` sets `softDeleteInfo.isDeleted = true` and `deletedBy = currentUserId` |
| **Feed Visibility** | Excluded from all feeds (`findBySoftDeleteInfoIsDeletedFalse()`) |
| **Direct Access** | `GET /posts/{postId}` returns `RESOURCE_NOT_FOUND` if deleted |
| **Cascade** | Comments remain in database but hidden via post exclusion (no explicit cascade delete) |
| **Recovery** | Manual database update required (no UI/API for undelete currently) |

### 2.4 Social Interaction Constraints

| Interaction | Constraint | Implementation |
|-------------|-----------|----------------|
| **Like** | User can like a post only once | Many-to-Many `Set<User> likeUsers` ensures uniqueness; re-liking is no-op |
| **Unlike** | User can unlike only if previously liked | `remove()` from Set is idempotent; no error if not present |
| **Save** | User can save a post only once | Same as Like; `Set<User> saveUsers` |
| **Unsave** | User can unsave only if previously saved | Idempotent `remove()` |
| **Comment** | No limit on comments per user/post | Business decision: unlimited engagement allowed |

### 2.5 Itinerary Integration Rules

| Rule ID | Rule | Rationale |
|---------|------|-----------|
| **R-ITIN-01** | Post can link to zero or one itinerary | `@ManyToOne` relationship; optional foreign key |
| **R-ITIN-02** | Linked itinerary must exist at creation/update time | Foreign key constraint + validation throws `RESOURCE_NOT_FOUND` |
| **R-ITIN-03** | Unlinking itinerary is allowed (set to `null` in update) | Business rule: post can exist standalone after itinerary is removed |
| **R-ITIN-04** | If itinerary is deleted, post remains but link is nullified | ⚠️ **Verify**: Likely handled by database ON DELETE SET NULL or application-level cleanup |
| **R-ITIN-05** | Search can filter posts by itinerary attributes (dates, budget, people count, locations) | Joins to itinerary table in `searchPosts()` native query |

### 2.6 Hashtag Normalization Rules

| Input | Normalized Output | Notes |
|-------|-------------------|-------|
| `#DaLat` | `dalat` | Lowercase, strip '#' |
| `beach` | `beach` | Already normalized |
| `#FOOD, Food, food` | `food` (deduplicated) | Case-insensitive deduplication |
| ` #travel ` | `travel` | Trimmed whitespace |

**Implementation**: `HashtagService.syncHashtags()` handles normalization and creates/retrieves existing hashtag entities.

### 2.7 Search & Filter Validation

| Filter Param | Validation | Error Handling |
|-------------|-----------|----------------|
| `q` (keyword) | Trimmed; null if blank | Null treated as "no keyword filter" |
| `hashtag` | Stripped '#', trimmed | Null if not provided |
| `min_budget` / `max_budget` | `@Min(0)` | HTTP 400 if negative |
| `min_days` / `max_days` | `@Min(0)` | HTTP 400 if negative |
| `min_people` / `max_people` | `@Min(1)` | HTTP 400 if < 1 |
| `sort` | `@Pattern(regexp="relevance\|newest")` | HTTP 400 if invalid; defaults to "newest" |
| `start_date` / `end_date` | ISO-8601 DateTime | Parse error → HTTP 400 |

---

## 3. User Workflows & Stories

### Story 1: Creating & Sharing a Post

**As a** TripJoy user  
**I want to** create a post sharing my travel experience  
**So that** I can inspire others and build my travel portfolio

#### Acceptance Criteria (Detailed)

**Scenario 1.1: Create post with text-only content**

**Given** I am authenticated  
**And** I have written post content: "Amazing sunset at Nha Trang beach! 🌅"  
**When** I submit the post without media or itinerary link  
**Then** the post is created with:
- `content` = "Amazing sunset at Nha Trang beach! 🌅"
- `visibility` = PUBLIC (default)
- `creator` = my user ID
- `shareQuantity` = 0
- `mediaUrls` = empty list
- `itinerary` = null
- `hashtags` = empty set

**And** the post appears in my profile feed  
**And** the post appears in the global feed for all users

**Scenario 1.2: Create post with media and hashtags**

**Given** I am authenticated  
**And** I have uploaded 3 images to Cloudinary:
- `https://res.cloudinary.com/tripjoy/image/upload/v1/trip1.jpg`
- `https://res.cloudinary.com/tripjoy/image/upload/v1/trip2.jpg`
- `https://res.cloudinary.com/tripjoy/image/upload/v1/trip3.jpg`

**And** I write content: "Best pho in Hanoi! #hanoi #food #vietnam"  
**When** I submit the post with:
```json
{
  "content": "Best pho in Hanoi! #hanoi #food #vietnam",
  "media_urls": ["https://res.cloudinary.com/tripjoy/image/upload/v1/trip1.jpg", ...],
  "hashtags": ["hanoi", "food", "vietnam"],
  "visibility": "PUBLIC"
}
```

**Then** the post is created with:
- `mediaUrls` contains all 3 URLs in order
- `hashtags` = [hanoi, food, vietnam] (normalized, lowercased)
- All hashtag entities exist in `hashtag` table (created if new, reused if existing)

**And** the post is searchable by any of the hashtags  
**And** images are displayed in the feed in the order uploaded

**Scenario 1.3: Create post linked to itinerary**

**Given** I am authenticated  
**And** I have an itinerary with ID `abc-123-def` (status: COMPLETED)  
**And** I write content: "5 days in Da Nang - full itinerary attached!"  
**When** I submit the post with:
```json
{
  "content": "5 days in Da Nang - full itinerary attached!",
  "itinerary_id": "abc-123-def",
  "hashtags": ["danang", "itinerary"]
}
```

**Then** the post is created with:
- `itinerary` linked to itinerary `abc-123-def`
- Post inherits itinerary metadata (name, duration, budget) for search filtering

**And** the itinerary summary appears in the post card UI  
**And** clicking the itinerary link navigates to itinerary detail page

**Scenario 1.4: Attempt to create post with invalid itinerary ID**

**Given** I am authenticated  
**When** I submit a post with `itinerary_id = "nonexistent-uuid"`  
**Then** the API returns HTTP 404 with:
```json
{
  "code": 1005,
  "message": "Resource not found"
}
```

**And** no post is created

**Scenario 1.5: Attempt to create post with blank content**

**Given** I am authenticated  
**When** I submit a post with `content = "   "` (whitespace only)  
**Then** the API returns HTTP 400 with:
```json
{
  "code": 1003,
  "message": "Content must not be blank"
}
```

**And** no post is created

---

### Story 2: Discovering Posts (Search & Filter)

**As a** TripJoy user  
**I want to** search and filter posts by various criteria  
**So that** I can find relevant travel inspiration for my trip planning

#### Acceptance Criteria (Detailed)

**Scenario 2.1: Browse all posts (no filters)**

**Given** I am authenticated (or guest)  
**When** I request `GET /api/v1/posts?page=0&size=20`  
**Then** the API returns:
- All non-deleted posts
- Ordered by `created_at` DESC (newest first)
- Paginated (20 items per page)
- Each post includes `is_liked`, `is_saved` (false for guest, actual values for authenticated user)

**Scenario 2.2: Full-text search on content**

**Given** the database has posts:
- Post A: "Amazing coffee in Da Lat! #dalat #coffee"
- Post B: "Beach vibes in Da Nang #danang #beach"
- Post C: "Best street food in Da Lat #dalat #food"

**When** I search `GET /api/v1/posts?q=Da Lat`  
**Then** the results contain Post A and Post C  
**And** the results are ranked by relevance (full-text search score)  
**And** Post B is excluded

**Scenario 2.3: Filter by hashtag**

**Given** the database has posts with hashtags:
- Post A: [dalat, coffee]
- Post B: [danang, beach]
- Post C: [dalat, food]

**When** I request `GET /api/v1/posts?hashtag=dalat`  
**Then** the results contain Post A and Post C  
**And** Post B is excluded  

**When** I request `GET /api/v1/posts?hashtag=#dalat` (with '#' prefix)  
**Then** the results are identical (normalized to `dalat`)

**Scenario 2.4: Filter by creator**

**Given** User Alice (ID: `alice-123`) created Post A and Post C  
**And** User Bob (ID: `bob-456`) created Post B  
**When** I request `GET /api/v1/posts?creator_id=alice-123`  
**Then** the results contain only Post A and Post C

**Scenario 2.5: Filter by itinerary budget range**

**Given** the database has posts linked to itineraries:
- Post A → Itinerary 1 (budget: 5,000,000 VND)
- Post B → Itinerary 2 (budget: 15,000,000 VND)
- Post C → Itinerary 3 (budget: 8,000,000 VND)

**When** I request `GET /api/v1/posts?min_budget=7000000&max_budget=10000000`  
**Then** the results contain only Post C  
**And** Post A and Post B are excluded

**Scenario 2.6: Combine multiple filters (AND logic)**

**Given** the database has:
- Post A: content="Da Lat coffee trip", hashtags=[dalat, coffee], itinerary budget=5M VND
- Post B: content="Da Nang beach resort", hashtags=[danang, beach], itinerary budget=12M VND
- Post C: content="Da Lat food tour", hashtags=[dalat, food], itinerary budget=3M VND

**When** I request:
```
GET /api/v1/posts?q=Da Lat&hashtag=dalat&min_budget=4000000&max_budget=6000000
```

**Then** the results contain only Post A  
**And** Post C is excluded (budget < 4M)  
**And** Post B is excluded (different hashtag and keyword)

**Scenario 2.7: Sort by relevance (FTS ranking)**

**Given** I search `GET /api/v1/posts?q=cafe&sort=relevance`  
**When** multiple posts match the keyword  
**Then** posts with "cafe" in title/early content rank higher than posts with "cafe" buried in text  
**And** posts with exact match rank higher than partial matches

**Scenario 2.8: Sort by newest (default)**

**Given** I request `GET /api/v1/posts` or `GET /api/v1/posts?sort=newest`  
**Then** posts are ordered by `created_at` DESC  
**And** pagination applies (page 0 = most recent 20 posts)

**Scenario 2.9: Empty result set**

**Given** no posts match the filter criteria  
**When** I request `GET /api/v1/posts?hashtag=nonexistent`  
**Then** the API returns HTTP 200 with:
```json
{
  "code": 1000,
  "message": "Success",
  "data": {
    "content": [],
    "totalElements": 0,
    "totalPages": 0,
    "empty": true
  }
}
```

---

### Story 3: Engaging with Posts (Like, Save, Comment)

**As a** TripJoy user  
**I want to** interact with posts via likes, saves, and comments  
**So that** I can express appreciation, bookmark for later, and engage in discussions

#### Acceptance Criteria (Detailed)

**Scenario 3.1: Like a post**

**Given** I am authenticated (User ID: `user-123`)  
**And** Post `post-abc` exists with `like_count = 5`  
**And** I have not previously liked this post  
**When** I request `POST /api/v1/posts/post-abc/likes`  
**Then** the API returns HTTP 200 with:
```json
{
  "code": 1000,
  "message": "Post liked"
}
```

**And** the post's `like_count` increments to 6  
**And** my user ID is added to `post.likeUsers` Set  
**And** a `PostLikedEvent` is published to the notification system  
**And** the post creator receives a notification: "user-123 liked your post"

**Scenario 3.2: Unlike a post**

**Given** I am authenticated (User ID: `user-123`)  
**And** Post `post-abc` exists with `like_count = 6`  
**And** I previously liked this post (my ID is in `post.likeUsers`)  
**When** I request `DELETE /api/v1/posts/post-abc/likes`  
**Then** the API returns HTTP 200 with:
```json
{
  "code": 1000,
  "message": "Post unliked"
}
```

**And** the post's `like_count` decrements to 5  
**And** my user ID is removed from `post.likeUsers` Set  
**And** no notification is sent (unlike does not trigger notification)

**Scenario 3.3: Attempt to like the same post twice**

**Given** I am authenticated  
**And** I already liked Post `post-abc`  
**When** I request `POST /api/v1/posts/post-abc/likes` again  
**Then** the API returns HTTP 200 (idempotent operation)  
**And** `like_count` remains unchanged (Set prevents duplicate)  
**And** no duplicate notification is sent

**Scenario 3.4: Save a post (bookmark)**

**Given** I am authenticated (User ID: `user-123`)  
**And** Post `post-abc` exists  
**And** I have not previously saved this post  
**When** I request `POST /api/v1/posts/post-abc/saves`  
**Then** the API returns HTTP 200 with:
```json
{
  "code": 1000,
  "message": "Post saved"
}
```

**And** my user ID is added to `post.saveUsers` Set  
**And** the post appears in `GET /api/v1/posts/saves` (my saved posts feed)

**Scenario 3.5: Unsave a post**

**Given** I am authenticated  
**And** I previously saved Post `post-abc`  
**When** I request `DELETE /api/v1/posts/post-abc/saves`  
**Then** the API returns HTTP 200  
**And** my user ID is removed from `post.saveUsers`  
**And** the post no longer appears in `GET /api/v1/posts/saves`

**Scenario 3.6: View my saved posts**

**Given** I am authenticated  
**And** I have saved Post A, Post C, and Post D  
**When** I request `GET /api/v1/posts/saves?page=0&size=20`  
**Then** the API returns:
- Only posts I saved (Post A, C, D)
- Ordered by save date DESC (most recently saved first)
- Paginated

**Scenario 3.7: Comment on a post**

**Given** I am authenticated  
**And** Post `post-abc` exists  
**When** I request `POST /api/v1/posts/post-abc/comments` with:
```json
{
  "content": "This place looks amazing! Adding to my bucket list.",
  "post_id": "post-abc"
}
```

**Then** the API returns HTTP 200 with the created comment  
**And** the comment is saved with:
- `post_id` = "post-abc"
- `created_by` = my user ID
- `parent_comment_id` = null (root comment)

**And** the post's `comment_count` increments by 1  
**And** the comment appears in `GET /api/v1/posts/post-abc/comments`

**Scenario 3.8: View comments on a post**

**Given** Post `post-abc` has 15 root comments  
**When** I request `GET /api/v1/posts/post-abc/comments?page=0&size=10`  
**Then** the API returns:
- First 10 root comments (paginated)
- Each comment includes:
  - `created_by_user` (username, avatar)
  - `like_count`
  - `reply_count`
  - `is_liked` (if I'm authenticated)
  - `latest_replies` (up to 2 recent replies)

**And** older comments appear on subsequent pages

**Scenario 3.9: Contextual flags (is_liked, is_saved)**

**Given** I am authenticated  
**And** I liked Post A but not Post B  
**And** I saved Post B but not Post A  
**When** I request `GET /api/v1/posts` (feed)  
**Then** Post A response includes:
```json
{
  "id": "post-a",
  "is_liked": true,
  "is_saved": false
}
```

**And** Post B response includes:
```json
{
  "id": "post-b",
  "is_liked": false,
  "is_saved": true
}
```

---

### Story 4: Managing Own Posts (Edit & Delete)

**As a** post creator  
**I want to** edit or delete my posts  
**So that** I can correct mistakes or remove outdated content

#### Acceptance Criteria (Detailed)

**Scenario 4.1: Update post content**

**Given** I am authenticated (User ID: `user-123`)  
**And** I created Post `post-abc` with content: "Original content"  
**When** I request `PUT /api/v1/posts/post-abc` with:
```json
{
  "content": "Updated content with new details",
  "visibility": "PUBLIC",
  "hashtags": ["updated", "newhashtag"]
}
```

**Then** the API returns HTTP 200 with updated post  
**And** the post's `content` = "Updated content with new details"  
**And** the post's `hashtags` = [updated, newhashtag] (replaced, not merged)  
**And** the post's `updated_at` timestamp is refreshed  
**And** the post's `created_at` remains unchanged (audit trail)

**Scenario 4.2: Update post to add itinerary link**

**Given** I created Post `post-abc` originally without itinerary link  
**And** I later create Itinerary `itin-xyz`  
**When** I update Post `post-abc` with:
```json
{
  "content": "Same content",
  "itinerary_id": "itin-xyz"
}
```

**Then** the post now links to `itin-xyz`  
**And** the post becomes searchable by itinerary filters (budget, dates, etc.)

**Scenario 4.3: Update post to remove itinerary link**

**Given** Post `post-abc` is linked to Itinerary `itin-xyz`  
**When** I update Post `post-abc` with:
```json
{
  "content": "Same content",
  "itinerary_id": null
}
```

**Then** the itinerary link is removed  
**And** the post no longer appears in searches filtering by `itinerary_id`

**Scenario 4.4: Attempt to update someone else's post**

**Given** I am authenticated (User ID: `user-123`)  
**And** User `user-456` created Post `post-abc`  
**When** I request `PUT /api/v1/posts/post-abc` with any payload  
**Then** the API returns HTTP 403 with:
```json
{
  "code": 1009,
  "message": "Unauthorized"
}
```

**And** no changes are made to the post

**Scenario 4.5: Soft delete own post**

**Given** I am authenticated (User ID: `user-123`)  
**And** I created Post `post-abc`  
**When** I request `DELETE /api/v1/posts/post-abc`  
**Then** the API returns HTTP 200 with:
```json
{
  "code": 1000,
  "message": "Post deleted successfully"
}
```

**And** the post's `softDeleteInfo.isDeleted` = true  
**And** the post's `softDeleteInfo.deletedBy` = "user-123"  
**And** the post no longer appears in any feeds  
**And** `GET /api/v1/posts/post-abc` returns HTTP 404

**Scenario 4.6: Attempt to delete someone else's post**

**Given** I am authenticated (User ID: `user-123`)  
**And** User `user-456` created Post `post-abc`  
**When** I request `DELETE /api/v1/posts/post-abc`  
**Then** the API returns HTTP 403 Unauthorized  
**And** the post remains active (not deleted)

**Scenario 4.7: Cascade behavior when post is deleted**

**Given** Post `post-abc` has:
- 10 likes
- 5 saves
- 8 comments

**When** the creator soft-deletes Post `post-abc`  
**Then**:
- All likes/saves remain in database (for audit) but post is hidden from feeds
- Comments remain in database but are inaccessible (post not found)
- No notifications are sent to users who liked/saved/commented

**Scenario 4.8: Update media URLs**

**Given** I created Post `post-abc` with 2 media URLs  
**When** I update with 5 new media URLs  
**Then** the old 2 URLs are replaced (not merged)  
**And** the new 5 URLs are stored in order  
**And** the post displays the updated media in the feed

---

## 4. Feature Requirements

### 4.1 Functional Requirements by Capability

#### FR-1: Post Creation
- **FR-1.1**: User SHALL be able to create a post with text content (required)
- **FR-1.2**: User MAY attach 0 to N media files (images/videos) via Cloudinary URLs
- **FR-1.3**: User MAY add 0 to N hashtags for discoverability
- **FR-1.4**: User MAY link post to an existing itinerary (optional)
- **FR-1.5**: User MAY specify visibility (PUBLIC/PRIVATE); defaults to PUBLIC
- **FR-1.6**: System SHALL auto-assign creator to authenticated user
- **FR-1.7**: System SHALL initialize `shareQuantity` to 0

#### FR-2: Post Discovery & Search
- **FR-2.1**: User SHALL be able to browse all public posts in paginated feed
- **FR-2.2**: User SHALL be able to search posts by keyword (full-text search on content)
- **FR-2.3**: User SHALL be able to filter posts by:
  - Hashtag (exact match, case-insensitive)
  - Creator (user ID)
  - Itinerary ID
  - Itinerary budget range (min/max VND)
  - Itinerary date range (start/end)
  - Itinerary duration (min/max days)
  - Itinerary group size (min/max people)
  - Origin/destination location
- **FR-2.4**: User SHALL be able to combine multiple filters (AND logic)
- **FR-2.5**: User SHALL be able to sort results by:
  - Newest first (default)
  - Relevance (FTS score, requires keyword)
- **FR-2.6**: System SHALL exclude soft-deleted posts from all feeds and searches

#### FR-3: Social Interactions
- **FR-3.1**: Authenticated user SHALL be able to like/unlike any post
- **FR-3.2**: Like action SHALL be idempotent (duplicate likes have no effect)
- **FR-3.3**: System SHALL publish `PostLikedEvent` when a post is liked (for notifications)
- **FR-3.4**: Authenticated user SHALL be able to save/unsave any post (bookmark)
- **FR-3.5**: Save action SHALL be idempotent
- **FR-3.6**: User SHALL be able to view their saved posts in a dedicated feed
- **FR-3.7**: Authenticated user SHALL be able to comment on any post
- **FR-3.8**: Comments SHALL support nested replies (handled by Comment module)

#### FR-4: Post Management
- **FR-4.1**: Creator SHALL be able to update their own post (content, media, hashtags, itinerary, visibility)
- **FR-4.2**: Creator SHALL be able to soft-delete their own post
- **FR-4.3**: System SHALL prevent non-creators from updating/deleting posts (403 Unauthorized)
- **FR-4.4**: System SHALL preserve audit trail (created_at, updated_at, deleted_by)

#### FR-5: Context-Aware Response
- **FR-5.1**: Post response SHALL include `is_liked` flag (true if current user liked the post)
- **FR-5.2**: Post response SHALL include `is_saved` flag (true if current user saved the post)
- **FR-5.3**: Post response SHALL include aggregated counts: `like_count`, `comment_count`
- **FR-5.4**: Post response SHALL include `latest_comments` (up to N recent comments)
- **FR-5.5**: Post response SHALL include creator details (username, avatar)
- **FR-5.6**: Post response SHALL include linked itinerary summary (if applicable)

### 4.2 Edge Cases & Error Scenarios

| Edge Case ID | Scenario | Expected Behavior |
|-------------|----------|-------------------|
| **EC-01** | User tries to create post with blank content | HTTP 400 Bad Request; error code 1003 |
| **EC-02** | User tries to link to nonexistent itinerary | HTTP 404 Not Found; error code 1005 |
| **EC-03** | User tries to update/delete another user's post | HTTP 403 Forbidden; error code 1009 |
| **EC-04** | User searches with invalid sort parameter | HTTP 400 Bad Request; validation error |
| **EC-05** | User provides negative budget/days/people in filters | HTTP 400 Bad Request; `@Min` validation error |
| **EC-06** | User tries to like the same post multiple times | HTTP 200 OK; idempotent (no change to like_count) |
| **EC-07** | User accesses deleted post by direct ID | HTTP 404 Not Found; treated as nonexistent |
| **EC-08** | Guest user (unauthenticated) browses public feed | HTTP 200 OK; `is_liked`/`is_saved` default to false |
| **EC-09** | Search/filter returns 0 results | HTTP 200 OK; empty `content[]` array |
| **EC-10** | User uploads media without calling `/media/upload` first | No validation; broken URL displays in feed (client responsibility) |
| **EC-11** | User creates PRIVATE post | Stored successfully but currently visible in public feeds (⚠️ known limitation) |

### 4.3 Performance Considerations

| Aspect | Requirement | Implementation Notes |
|--------|-------------|----------------------|
| **Pagination** | Default 20 items/page; max 100 items/page | Spring `Pageable` parameter; prevents OOM on large result sets |
| **FTS Performance** | Full-text search executes only when `q` parameter provided | `PostQueryParams.isEmpty()` fast-path skips expensive FTS query |
| **N+1 Query Prevention** | Eager load hashtags, creator, itinerary in single query | `@BatchSize(20)` on hashtags; `FetchType.LAZY` + JOIN FETCH |
| **Index Coverage** | Database indexes on: `created_at`, `creator_id`, `soft_delete_info.is_deleted` | Ensures fast feed retrieval and ownership checks |
| **Cache Strategy** | Consider Redis cache for popular hashtags feed | Future enhancement; not implemented yet |

### 4.4 Non-Functional Requirements

| NFR ID | Requirement | Acceptance |
|--------|-------------|-----------|
| **NFR-01** | Post feed SHALL load within 500ms for 20 items (avg) | Measured at 95th percentile under normal load |
| **NFR-02** | FTS search SHALL return results within 1 second for 10,000+ posts | Database full-text index on `content` field |
| **NFR-03** | Like/Save/Comment actions SHALL be atomic (no race conditions) | JPA transaction isolation + Set-based storage |
| **NFR-04** | Soft-deleted posts SHALL be recoverable via database access | Admin-level recovery; no user-facing UI |
| **NFR-05** | System SHALL support 10,000 concurrent users browsing feeds | Load balancer + stateless API design |

### 4.5 Future Enhancements

| Priority | Enhancement | Rationale |
|----------|-------------|-----------|
| **High** | Implement PRIVATE visibility filtering | Currently stored but not enforced; privacy concern |
| **High** | Post sharing feature (increment `shareQuantity`) | Field exists but no endpoint to share |
| **Medium** | Post reactions beyond like (e.g., love, laugh, wow) | Richer engagement options |
| **Medium** | Post reporting & moderation workflow | User safety and content quality |
| **Low** | Post scheduling (publish at future date/time) | Marketing and content planning |
| **Low** | Post analytics (view count, engagement rate) | Creator insights and gamification |

---

## 5. Integration Points

### 5.1 Itinerary Module

**Integration Type**: Data Linkage (Foreign Key Relationship)

**Dependencies**:
- Post references `Itinerary` entity via `itinerary_id` (optional)
- Post search filters leverage itinerary attributes: `budget_estimate`, `start_date`, `end_date`, `people_quantity`, `origin_id`, `destination_id`

**Business Rules**:
- Itinerary must exist when linked at post creation/update (validated via `ItineraryRepository.findById()`)
- If itinerary is deleted, post should remain but link nullified (⚠️ verify ON DELETE behavior)
- Post inherits itinerary metadata for search discoverability

**API Contracts**:
- `POST /posts` with `itinerary_id` → validates itinerary existence
- `PUT /posts/{postId}` with `itinerary_id = null` → unlinks itinerary
- `GET /posts?itinerary_id={id}` → filters posts by linked itinerary

### 5.2 Notification System

**Integration Type**: Event-Driven (Asynchronous)

**Event Published**:
- `PostLikedEvent` when user likes a post

**Event Payload**:
```java
PostLikedEvent {
  Post post;        // The post that was liked
  User liker;       // User who liked the post
}
```

**Notification Flow**:
1. User A likes Post created by User B
2. `PostService.likePost()` publishes `PostLikedEvent(post, userA)`
3. `NotificationListener` consumes event
4. Notification sent to User B: "User A liked your post '{truncated content}'"
5. Real-time notification delivered via Socket.IO (if User B is online)

**Business Rules**:
- Only like (not unlike) triggers notification
- No notification if user likes their own post (⚠️ verify implementation)
- Notification includes post preview and liker's profile

### 5.3 Media Service (Cloudinary)

**Integration Type**: External API (Synchronous)

**Upload Flow**:
1. Client uploads media via `POST /api/v1/media/upload/image` or `/video`
2. Media service uploads to Cloudinary CDN
3. Media service returns secure URL: `https://res.cloudinary.com/tripjoy/...`
4. Client includes URL in `POST /posts` payload's `media_urls[]` array

**Business Rules**:
- Post module does NOT validate media URLs (client responsibility)
- Broken/expired URLs display as missing images in feed
- Media deletion is NOT cascaded when post is deleted (orphaned media in Cloudinary)

**Future Enhancement**:
- Validate media URLs belong to authenticated user (prevent URL spoofing)
- Cascade delete media from Cloudinary when post is soft-deleted

### 5.4 Hashtag Service

**Integration Type**: Internal Service (Synchronous)

**Normalization Flow**:
1. User submits `hashtags: ["#DaLat", "FOOD", " beach "]`
2. `HashtagService.syncHashtags()` normalizes:
   - Strip '#' prefix
   - Lowercase
   - Trim whitespace
   - Deduplicate
3. For each normalized tag:
   - Query `hashtag` table for existing entity
   - If not found, create new `Hashtag` entity
   - If found, reuse existing entity
4. Return `Set<Hashtag>` entities
5. Post persists many-to-many relationship in `post_hashtag_mapping` table

**Business Rules**:
- Hashtags are globally shared (not post-specific)
- Hashtag popularity can be tracked via count of linked posts
- Empty hashtag list is valid (post without hashtags)

### 5.5 Comment Module

**Integration Type**: Data Linkage (One-to-Many Relationship)

**Dependencies**:
- Comment references `Post` entity via `post_id` (required)
- Post response includes `latest_comments[]` (up to N recent comments)

**API Contracts**:
- `POST /posts/{postId}/comments` → creates root comment on post
- `GET /posts/{postId}/comments` → retrieves paginated root comments
- `POST /comments/{commentId}/replies` → creates reply to comment (nested)

**Business Rules**:
- Comments cascade soft-delete when post is deleted (hidden, not purged)
- Comment count increments when root comment added
- Post response includes up to 2 latest comments for preview

### 5.6 User/Authentication Module

**Integration Type**: Identity & Access Management

**Dependencies**:
- All write operations require authenticated user (JWT token)
- Post response includes `created_by_user` (username, avatar, full name)
- Like/Save operations link to `User` entity via many-to-many relationship

**Authorization**:
- `SecurityUtils.getCurrentUserId()` extracts user ID from JWT
- `validateOwnership()` checks `post.creator.id == currentUserId` for update/delete

**Anonymous Access**:
- Public feeds allow unauthenticated access (`currentUserId = null`)
- `is_liked`, `is_saved` default to `false` for guest users

---

## ✅ Success Metrics & Validation Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Post Creation Success Rate** | > 99% | Track API success rate for `POST /posts` |
| **Search Response Time** | < 1s (p95) | Monitor FTS query execution time |
| **Feed Load Time** | < 500ms (p95) | Track `GET /posts` latency for 20 items |
| **User Engagement** | > 30% of users like/save/comment | Analytics on social interaction rates |
| **Zero Authorization Bypasses** | 100% enforcement | Security audit: attempt unauthorized update/delete |
| **PRIVATE Visibility Enforcement** | 100% (future) | ⚠️ Currently 0%; requires implementation |

---

## 📝 Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-20 | Business Analyst Team | Initial business specification |

---

## 🔗 Related Documents

- [Post API Reference](./post.md) — Technical endpoint documentation
- [Comment Module Spec](./comment.md) — Comment integration details
- [Itinerary Module Spec](./itinerary.md) — Itinerary linkage
- [Notification System Guide](../NOTIFICATION_SYSTEM_GUIDE.md) — Event-driven notifications
- [Spring Security with JWT](../spring-security-jwt.md) — Authentication flow

---

**End of Business Specification**
