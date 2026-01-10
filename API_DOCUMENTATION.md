# VidTube API Documentation

Base URL: `http://localhost:8080/api/v1`

## Authentication

All protected endpoints require a valid JWT token in cookies (`accessToken`).

## Response Format

### Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "requestId": "uuid-string"
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "error": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "requestId": "uuid-string"
}
```

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per hour per IP
- **Upload**: 2 uploads per hour per IP

Rate limit headers:

- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Remaining requests
- `RateLimit-Reset`: Time when limit resets

---

## User Endpoints

### Register User

```http
POST /users/register
Content-Type: multipart/form-data
```

**Request Body:**

- `fullName` (string, required): User's full name
- `username` (string, required, 3-20 chars, alphanumeric + underscore)
- `email` (string, required, valid email)
- `password` (string, required, min 8 chars)
- `avatar` (file, optional): Profile image
- `coverImage` (file, optional): Cover image

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "fullName": "John Doe"
    }
  }
}
```

### Login

```http
POST /users/login
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "john@example.com", // or "username": "johndoe"
  "password": "password123"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "jwt-token"
  }
}
```

### Get Current User

```http
GET /users/current
Authorization: Bearer {token}
```

**Response:** `200 OK`

### Update Profile

```http
PATCH /users/profile
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:**

- `fullName` (string, optional)
- `bio` (string, optional, max 500 chars)
- `avatar` (file, optional)
- `coverImage` (file, optional)
- `socialLinks` (object, optional)

**Response:** `200 OK`

### Change Password

```http
POST /users/change-password
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "oldPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

**Response:** `200 OK`

---

## Video Endpoints

### Get All Videos

```http
GET /videos?page=1&limit=20&sortBy=createdAt&sortType=desc
```

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 10, max: 50)
- `sortBy` (string: "createdAt" | "views" | "title", default: "createdAt")
- `sortType` (string: "asc" | "desc", default: "desc")

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "docs": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalDocs": 100,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Get Video by ID

```http
GET /videos/:videoId
```

**Response:** `200 OK`

### Search Videos

```http
GET /videos/search?q=search+query&page=1&limit=20
```

**Query Parameters:**

- `q` (string, required): Search query
- `page`, `limit` (optional)

**Response:** `200 OK`

### Upload Video

```http
POST /videos/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:**

- `title` (string, required, max 200 chars)
- `description` (string, optional, max 5000 chars)
- `video` (file, required): Video file (max 500MB)
- `thumbnail` (file, optional): Thumbnail image (max 10MB)
- `videoformat` (string, required): e.g., "mp4"
- `duration` (number, required): Duration in seconds
- `privacy` (string, optional): "public" | "unlisted" | "private"
- `category` (string, optional)
- `tags` (array, optional)

**Response:** `201 Created`

### Update Video

```http
PATCH /videos/:videoId
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

- `title` (string, optional)
- `description` (string, optional)
- `privacy` (string, optional)
- `category` (string, optional)
- `tags` (array, optional)

**Response:** `200 OK`

### Delete Video

```http
DELETE /videos/:videoId
Authorization: Bearer {token}
```

**Response:** `200 OK`

### Get User's Videos

```http
GET /videos/user/:userId?page=1&limit=20
```

**Response:** `200 OK`

---

## Like Endpoints

### Like/Unlike Video

```http
POST /likes/video/:videoId
Authorization: Bearer {token}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "likesCount": 42
  }
}
```

### Get User's Liked Videos

```http
GET /likes/user
Authorization: Bearer {token}
```

**Response:** `200 OK`

---

## Comment Endpoints

### Get Video Comments

```http
GET /comments/video/:videoId?page=1&limit=20
```

**Response:** `200 OK`

### Create Comment

```http
POST /comments/video/:videoId
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "content": "Great video!"
}
```

**Response:** `201 Created`

### Update Comment

```http
PATCH /comments/:commentId
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "content": "Updated comment"
}
```

### Delete Comment

```http
DELETE /comments/:commentId
Authorization: Bearer {token}
```

**Response:** `200 OK`

---

## Subscription Endpoints

### Subscribe/Unsubscribe

```http
POST /subscriptions/:channelId
Authorization: Bearer {token}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "isSubscribed": true,
    "subscribersCount": 1000
  }
}
```

### Get User Subscriptions

```http
GET /subscriptions/user
Authorization: Bearer {token}
```

**Response:** `200 OK`

### Get Channel Subscribers

```http
GET /subscriptions/channel/:channelId
```

**Response:** `200 OK`

---

## Playlist Endpoints

### Create Playlist

```http
POST /playlists
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "My Favorites",
  "description": "Videos I like",
  "isPublic": true
}
```

### Get User Playlists

```http
GET /playlists/user/:userId
```

### Get Playlist by ID

```http
GET /playlists/:playlistId
```

### Add Video to Playlist

```http
POST /playlists/:playlistId/videos/:videoId
Authorization: Bearer {token}
```

---

## Notification Endpoints

### Get Notifications

```http
GET /notifications?page=1&limit=15&unreadOnly=false
Authorization: Bearer {token}
```

---

## Report Endpoints

### Create Report

```http
POST /reports
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "type": "video",
  "reportedItem": "videoId",
  "reason": "spam",
  "description": "This is spam"
}
```

---

## Error Codes

| Code | Description                             |
| ---- | --------------------------------------- |
| 200  | Success                                 |
| 201  | Created                                 |
| 400  | Bad Request - Validation error          |
| 401  | Unauthorized - Invalid/missing token    |
| 403  | Forbidden - Insufficient permissions    |
| 404  | Not Found - Resource doesn't exist      |
| 409  | Conflict - Resource already exists      |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error                   |

---

## Pagination

All list endpoints support pagination:

```
?page=1&limit=20
```

Response includes pagination metadata:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalDocs": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null
  }
}
```

---

## Validation Rules

### User Registration

- `fullName`: 2-100 characters
- `username`: 3-20 characters, alphanumeric + underscore only
- `email`: Valid email format
- `password`: 8-128 characters

### Video Upload

- `title`: 1-200 characters
- `description`: Max 5000 characters
- `video`: Max 500MB, video/\* types
- `thumbnail`: Max 10MB, image/\* types
- `duration`: Positive number, max 86400 seconds (24 hours)

### Comments

- `content`: 1-1000 characters

---

**Last Updated**: 2024
**API Version**: v1
