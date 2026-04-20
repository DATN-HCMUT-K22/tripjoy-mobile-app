# Post Module - API Documentation

**Module:** Social Post System  
**Version:** 1.0  
**Last Updated:** 2026-04-20  
**Base URL:** `/api/v1`

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [REST API Endpoints](#rest-api-endpoints)
4. [Socket.IO Events](#socketio-events)
5. [Request/Response Examples](#requestresponse-examples)
6. [Error Codes](#error-codes)
7. [Rate Limiting](#rate-limiting)
8. [Best Practices](#best-practices)

---

## API Overview

The Post Module provides REST APIs for CRUD operations and Socket.IO events for real-time updates.

### Key Features
- Create posts with multi-media (up to 5 images)
- Edit and delete own posts
- Search and filter posts
- Like, comment, save, and share posts
- Real-time notifications via Socket.IO
- Privacy controls (PUBLIC/PRIVATE)
- Itinerary integration

### Base URL
```
Production: https://api.tripjoy.com/api/v1
Development: http://localhost:8080/api/v1
```

---

## Authentication

All endpoints require authentication via Bearer token unless specified otherwise.

### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Getting Access Token
```typescript
// Login to get access token
POST /auth/login
{
  "username": "user@example.com",
  "password": "password123"
}

// Response
{
  "code": 200,
  "message": "Success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

### Handling 401 Unauthorized
When receiving 401, refresh token and retry:
```typescript
// Refresh token
POST /auth/refresh
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## REST API Endpoints

### Posts

#### 1. Get All Posts (Paginated)

**Endpoint:** `GET /posts`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 0 | Page number (0-indexed) |
| size | number | No | 20 | Items per page (max: 100) |
| sort | string | No | created_at,desc | Sort field and direction |

**Response:** `200 OK`
```typescript
{
  "code": 200,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": "post-123",
        "content": "Amazing trip to Da Nang! #danang #beach",
        "hashtags": ["danang", "beach"],
        "media_url": "https://res.cloudinary.com/tripjoy/image/upload/v1/posts/image1.jpg",
        "visibility": "PUBLIC",
        "created_at": "2026-04-20T10:30:00Z",
        "updated_at": "2026-04-20T10:30:00Z",
        "created_by": "user-456",
        "created_by_user": {
          "id": "user-456",
          "username": "johndoe",
          "fullName": "John Doe",
          "avatarUrl": "https://..."
        },
        "itinerary": {
          "id": "iti-789",
          "name": "Da Nang 3 Days"
        },
        "like_count": 42,
        "comment_count": 12,
        "shared_quantity": 5,
        "is_liked": false,
        "is_saved": true,
        "latest_comments": [
          {
            "id": "comment-001",
            "content": "Looks amazing!",
            "created_at": "2026-04-20T11:00:00Z",
            "created_by_user": {
              "id": "user-789",
              "username": "jane",
              "fullName": "Jane Smith",
              "avatarUrl": "https://..."
            },
            "like_count": 3,
            "is_liked": false,
            "reply_count": 2
          }
        ]
      }
    ],
    "totalPages": 10,
    "totalElements": 200,
    "size": 20,
    "number": 0,
    "first": true,
    "last": false,
    "empty": false
  }
}
```

#### 2. Get Single Post

**Endpoint:** `GET /posts/{postId}`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| postId | string | Yes | Post ID |

**Response:** `200 OK` (Same structure as post object above)

**Error:** `404 Not Found`
```typescript
{
  "code": 404,
  "message": "Post not found",
  "data": null
}
```

#### 3. Create Post

**Endpoint:** `POST /posts`

**Request Body:**
```typescript
{
  "content": string,              // Required, min 1 char, max 5000 chars
  "hashtags": string[],           // Optional, extracted from content if not provided
  "media_url": string,            // Required, Cloudinary URL (single image) or comma-separated URLs
  "itinerary_id": string,         // Optional, link to itinerary
  "visibility": "PUBLIC" | "PRIVATE"  // Optional, default: PUBLIC
}
```

**Example Request:**
```json
{
  "content": "Just completed an amazing 3-day trip to Da Nang! The beaches are stunning and the food is incredible. #danang #vietnam #travel",
  "hashtags": ["danang", "vietnam", "travel", "beach", "food"],
  "media_url": "https://res.cloudinary.com/tripjoy/image/upload/v1/posts/image1.jpg,https://res.cloudinary.com/tripjoy/image/upload/v1/posts/image2.jpg",
  "itinerary_id": "iti-789",
  "visibility": "PUBLIC"
}
```

**Response:** `201 Created` (Same structure as post object)

**Validation Errors:** `400 Bad Request`
```typescript
{
  "code": 400,
  "message": "Validation failed",
  "data": {
    "errors": [
      {
        "field": "content",
        "message": "Content is required"
      },
      {
        "field": "media_url",
        "message": "At least one media URL is required"
      }
    ]
  }
}
```

#### 4. Update Post

**Endpoint:** `PUT /posts/{postId}`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| postId | string | Yes | Post ID |

**Request Body:** (Same as Create Post)

**Authorization:** Only post creator can update

**Response:** `200 OK` (Updated post object)

**Error:** `403 Forbidden`
```typescript
{
  "code": 403,
  "message": "You are not authorized to update this post",
  "data": null
}
```

#### 5. Delete Post

**Endpoint:** `DELETE /posts/{postId}`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| postId | string | Yes | Post ID |

**Authorization:** Only post creator can delete

**Response:** `204 No Content`

**Error:** `403 Forbidden` (Same structure as Update Post error)

**Note:** Soft delete - post is marked as deleted but not removed from database

---

### Post Interactions

#### 6. Like Post

**Endpoint:** `POST /posts/{postId}/likes`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| postId | string | Yes | Post ID |

**Response:** `200 OK`
```typescript
{
  "code": 200,
  "message": "Post liked successfully",
  "data": {}
}
```

**Note:** Idempotent - liking again has no effect

#### 7. Unlike Post

**Endpoint:** `DELETE /posts/{postId}/likes`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| postId | string | Yes | Post ID |

**Response:** `200 OK`
```typescript
{
  "code": 200,
  "message": "Post unliked successfully",
  "data": {}
}
```

#### 8. Save Post

**Endpoint:** `POST /posts/{postId}/saves`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| postId | string | Yes | Post ID |

**Response:** `200 OK`
```typescript
{
  "code": 200,
  "message": "Post saved successfully",
  "data": {}
}
```

#### 9. Unsave Post

**Endpoint:** `DELETE /posts/{postId}/saves`

**Response:** `200 OK`

#### 10. Get Saved Posts

**Endpoint:** `GET /posts/saves`

**Query Parameters:** (Same as Get All Posts)

**Response:** `200 OK` (Same structure as Get All Posts)

**Note:** Returns only posts saved by current user

---

### Comments

#### 11. Get Post Comments

**Endpoint:** `GET /posts/{postId}/comments`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 0 | Page number |
| size | number | No | 20 | Items per page |

**Response:** `200 OK`
```typescript
{
  "code": 200,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": "comment-001",
        "content": "Looks amazing!",
        "created_at": "2026-04-20T11:00:00Z",
        "created_by": "user-789",
        "created_by_user": {
          "id": "user-789",
          "username": "jane",
          "fullName": "Jane Smith",
          "avatarUrl": "https://..."
        },
        "post_id": "post-123",
        "parent_comment_id": null,
        "like_count": 3,
        "is_liked": false,
        "reply_count": 2,
        "latest_replies": [
          {
            "id": "comment-002",
            "content": "Thanks!",
            "created_at": "2026-04-20T11:05:00Z",
            "created_by_user": { "..." },
            "parent_comment_id": "comment-001",
            "like_count": 1,
            "is_liked": false,
            "reply_count": 0
          }
        ]
      }
    ],
    "totalPages": 3,
    "totalElements": 50,
    "size": 20,
    "number": 0
  }
}
```

#### 12. Create Comment

**Endpoint:** `POST /posts/{postId}/comments`

**Request Body:**
```typescript
{
  "content": string,              // Required, min 1 char
  "post_id": string,              // Required, must match path param
  "parent_comment_id": string     // Optional, for replies
}
```

**Response:** `201 Created` (Comment object)

---

### Search & Filters

#### 13. Search Posts

**Endpoint:** `GET /posts/search`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| keyword | string | No | Search in content and hashtags |
| hashtags | string | No | Comma-separated hashtags |
| budget_min | number | No | Minimum budget (from itinerary) |
| budget_max | number | No | Maximum budget |
| start_date | string | No | Trip start date (ISO 8601) |
| end_date | string | No | Trip end date (ISO 8601) |
| duration_min | number | No | Minimum trip duration (days) |
| duration_max | number | No | Maximum trip duration (days) |
| people_count | number | No | Number of people |
| page | number | No | Page number |
| size | number | No | Items per page |

**Example Request:**
```
GET /posts/search?keyword=beach&hashtags=danang,vietnam&budget_min=1000000&budget_max=5000000&page=0&size=20
```

**Response:** `200 OK` (Same structure as Get All Posts)

#### 14. Get Popular Hashtags

**Endpoint:** `GET /posts/hashtags/popular`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | number | No | 20 | Number of hashtags to return |

**Response:** `200 OK`
```typescript
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "hashtag": "danang",
      "count": 152
    },
    {
      "hashtag": "vietnam",
      "count": 128
    },
    {
      "hashtag": "beach",
      "count": 95
    }
  ]
}
```

---

## Socket.IO Events

### Connection

#### Connect to Socket.IO Server

**URL:** `ws://localhost:8085` (Development) or `wss://socket.tripjoy.com` (Production)

**Namespace:** `/` (default)

**Authentication:**
```typescript
import io from 'socket.io-client';

const socket = io('ws://localhost:8085', {
  auth: {
    token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
```

### Events to Listen

#### 1. POST_LIKED

**Event Name:** `POST_LIKED`

**Trigger:** When someone likes your post

**Payload:**
```typescript
{
  "id": "notification-123",
  "type": "POST_LIKED",
  "title": "New Like",
  "message": "John Doe liked your post",
  "data": {
    "postId": "post-123",
    "userId": "user-456",
    "userName": "John Doe",
    "userAvatar": "https://...",
    "timestamp": "2026-04-20T10:30:00Z"
  },
  "created_at": "2026-04-20T10:30:00Z",
  "is_read": false
}
```

**Client Handling:**
```typescript
socket.on('POST_LIKED', (notification) => {
  // Update like count in cache
  queryClient.setQueryData(['post', notification.data.postId], (oldData) => ({
    ...oldData,
    like_count: oldData.like_count + 1
  }));
  
  // Show notification
  showNotification(notification.message);
  
  // Mark as read when user clicks
  markNotificationAsRead(notification.id);
});
```

**Note:** 
- Creator does NOT receive notification for their own likes
- Notification includes liker's name and avatar
- Click notification to navigate to post

#### 2. POST_COMMENTED

**Event Name:** `POST_COMMENTED`

**Trigger:** When someone comments on your post

**Payload:**
```typescript
{
  "id": "notification-124",
  "type": "POST_COMMENTED",
  "title": "New Comment",
  "message": "Jane Smith commented on your post",
  "data": {
    "postId": "post-123",
    "commentId": "comment-001",
    "userId": "user-789",
    "userName": "Jane Smith",
    "userAvatar": "https://...",
    "commentContent": "Looks amazing!",
    "timestamp": "2026-04-20T11:00:00Z"
  },
  "created_at": "2026-04-20T11:00:00Z",
  "is_read": false
}
```

#### 3. POST_SHARED

**Event Name:** `POST_SHARED`

**Trigger:** When someone shares your post to a group

**Payload:**
```typescript
{
  "id": "notification-125",
  "type": "POST_SHARED",
  "title": "Post Shared",
  "message": "Your post was shared to Travel Group",
  "data": {
    "postId": "post-123",
    "userId": "user-890",
    "userName": "Mike Johnson",
    "groupId": "group-456",
    "groupName": "Travel Group",
    "timestamp": "2026-04-20T12:00:00Z"
  },
  "created_at": "2026-04-20T12:00:00Z",
  "is_read": false
}
```

### Events to Emit

**Note:** Post Module uses REST APIs only. No client-side Socket.IO emissions required.

Socket.IO is used exclusively for receiving real-time notifications.

---

## Request/Response Examples

### Complete Create Post Flow

**Step 1: Upload Images to Cloudinary**
```typescript
// Frontend: Upload image
const formData = new FormData();
formData.append('file', imageFile);
formData.append('upload_preset', 'posts_preset');

const response = await fetch(
  'https://api.cloudinary.com/v1_1/tripjoy/image/upload',
  {
    method: 'POST',
    body: formData
  }
);

const data = await response.json();
const imageUrl = data.secure_url; // "https://res.cloudinary.com/tripjoy/..."
```

**Step 2: Create Post**
```typescript
// Frontend: Create post with Cloudinary URLs
POST /api/v1/posts
{
  "content": "Amazing trip! #danang #beach",
  "hashtags": ["danang", "beach"],
  "media_url": "https://res.cloudinary.com/tripjoy/image/upload/v1/posts/img1.jpg,https://res.cloudinary.com/tripjoy/image/upload/v1/posts/img2.jpg",
  "itinerary_id": "iti-789",
  "visibility": "PUBLIC"
}

// Response
{
  "code": 201,
  "message": "Post created successfully",
  "data": {
    "id": "post-123",
    "content": "Amazing trip! #danang #beach",
    "hashtags": ["danang", "beach"],
    "media_url": "https://res.cloudinary.com/tripjoy/image/upload/v1/posts/img1.jpg,https://res.cloudinary.com/tripjoy/image/upload/v1/posts/img2.jpg",
    "visibility": "PUBLIC",
    "created_at": "2026-04-20T10:30:00Z",
    "created_by_user": { "..." },
    "itinerary": { "..." },
    "like_count": 0,
    "comment_count": 0,
    "is_liked": false,
    "is_saved": false
  }
}
```

### Complete Like Post Flow with Socket.IO

**Client A: Like Post**
```typescript
// Client A (user-456) likes post
POST /api/v1/posts/post-123/likes

// Response
{
  "code": 200,
  "message": "Post liked successfully",
  "data": {}
}
```

**Creator: Receive Socket.IO Notification**
```typescript
// Client B (post creator, user-789) receives Socket.IO event
socket.on('POST_LIKED', (notification) => {
  console.log(notification);
  // {
  //   "id": "notification-123",
  //   "type": "POST_LIKED",
  //   "message": "John Doe liked your post",
  //   "data": {
  //     "postId": "post-123",
  //     "userId": "user-456",
  //     "userName": "John Doe",
  //     "userAvatar": "https://...",
  //     "timestamp": "2026-04-20T10:30:00Z"
  //   },
  //   "is_read": false
  // }
  
  // Update cache
  queryClient.setQueryData(['post', 'post-123'], (old) => ({
    ...old,
    like_count: old.like_count + 1
  }));
});
```

### Search with Multiple Filters

**Request:**
```
GET /api/v1/posts/search?keyword=beach&hashtags=danang,vietnam&budget_min=1000000&budget_max=5000000&start_date=2026-05-01&end_date=2026-05-31&duration_min=3&duration_max=7&people_count=2&page=0&size=20
```

**Response:**
```typescript
{
  "code": 200,
  "message": "Success",
  "data": {
    "content": [
      // Posts matching ALL filters (AND logic)
    ],
    "totalPages": 2,
    "totalElements": 35,
    "size": 20,
    "number": 0
  }
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Resource deleted successfully |
| 400 | Bad Request | Validation failed or malformed request |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Application Error Codes

| Code | Message | Action |
|------|---------|--------|
| 1001 | Content is required | Provide post content |
| 1002 | Media URL is required | Upload at least one image |
| 1003 | Maximum 5 media files allowed | Remove extra media |
| 1004 | Invalid hashtag format | Use alphanumeric characters only |
| 1005 | Post not found | Check post ID |
| 1006 | Unauthorized to update post | Only creator can update |
| 1007 | Unauthorized to delete post | Only creator can delete |
| 1008 | Itinerary not found | Check itinerary ID |
| 1009 | Invalid visibility value | Use PUBLIC or PRIVATE |
| 1010 | Content too long | Max 5000 characters |

### Error Response Format

```typescript
{
  "code": 400,
  "message": "Validation failed",
  "data": {
    "errors": [
      {
        "field": "content",
        "code": 1001,
        "message": "Content is required"
      }
    ]
  }
}
```

---

## Rate Limiting

### Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /posts | 10 requests | 1 hour |
| PUT /posts/{id} | 20 requests | 1 hour |
| DELETE /posts/{id} | 10 requests | 1 hour |
| POST /posts/{id}/likes | 100 requests | 1 minute |
| GET /posts | 1000 requests | 1 hour |
| GET /posts/search | 500 requests | 1 hour |

### Rate Limit Headers

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1619020800
```

### Rate Limit Exceeded Response

```typescript
{
  "code": 429,
  "message": "Too many requests. Please try again later.",
  "data": {
    "retryAfter": 3600
  }
}
```

---

## Best Practices

### 1. Use Pagination
Always paginate large lists to avoid performance issues:
```typescript
GET /posts?page=0&size=20
```

### 2. Implement Retry Logic
Retry failed requests with exponential backoff:
```typescript
const retryRequest = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error; // Don't retry 4xx errors
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};
```

### 3. Use Optimistic Updates
Update UI immediately, rollback on error:
```typescript
const { mutate } = useMutation({
  mutationFn: likePost,
  onMutate: async (postId) => {
    // Optimistic update
    queryClient.setQueryData(['post', postId], (old) => ({
      ...old,
      like_count: old.like_count + 1,
      is_liked: true
    }));
  },
  onError: (error, postId) => {
    // Rollback on error
    queryClient.invalidateQueries(['post', postId]);
  }
});
```

### 4. Compress Images Before Upload
Reduce image size by 60-80%:
```typescript
import * as ImageManipulator from 'expo-image-manipulator';

const compressImage = async (uri: string) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1920 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
};
```

### 5. Handle Socket.IO Reconnection
Implement reconnection logic:
```typescript
socket.on('disconnect', () => {
  console.log('Socket disconnected, attempting reconnect...');
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  // Refresh data
  queryClient.invalidateQueries(['posts']);
});
```

### 6. Validate Before Sending
Validate on client side before API call:
```typescript
const validatePost = (data) => {
  const errors = [];
  
  if (!data.content || data.content.trim().length === 0) {
    errors.push('Content is required');
  }
  
  if (data.content.length > 5000) {
    errors.push('Content must be less than 5000 characters');
  }
  
  if (!data.media_url || data.media_url.length === 0) {
    errors.push('At least one media file is required');
  }
  
  return errors;
};
```

### 7. Use Debouncing for Search
Debounce search input to reduce API calls:
```typescript
import { useDebouncedValue } from '@/hooks/useDebounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebouncedValue(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    searchPosts(debouncedSearch);
  }
}, [debouncedSearch]);
```

### 8. Cache Popular Hashtags
Cache popular hashtags for 1 hour:
```typescript
const { data: hashtags } = useQuery({
  queryKey: ['hashtags', 'popular'],
  queryFn: fetchPopularHashtags,
  staleTime: 1000 * 60 * 60, // 1 hour
  cacheTime: 1000 * 60 * 60 * 24 // 24 hours
});
```

---

## Changelog

### Version 1.0 (2026-04-20)
- Initial release
- POST /posts endpoint
- GET /posts endpoint with pagination
- PUT /posts/{id} endpoint
- DELETE /posts/{id} endpoint
- Like/unlike functionality
- Save/unsave functionality
- Comment functionality
- Search and filter endpoints
- Socket.IO POST_LIKED event
- Socket.IO POST_COMMENTED event
- Socket.IO POST_SHARED event

---

## Support

**Documentation:** [docs/modules/post.md](../../docs/modules/post.md)  
**Backend API Docs:** http://localhost:8080/swagger-ui.html  
**Issues:** Contact backend team

---

**Last Updated:** 2026-04-20  
**Maintained By:** TripJoy Development Team
