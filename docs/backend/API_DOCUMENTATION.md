# VidTube API Documentation

This document reflects the current backend routes in `vidtube-backend/src/routes`.

## Base URLs

- Local backend default: `http://localhost:8080`
- API prefix: `/api/v1`
- Effective local API root: `http://localhost:8080/api/v1`

## Authentication Model

Protected endpoints require a valid access token.

Accepted access token locations:

1. `Authorization: Bearer <accessToken>` header
2. `accessToken` cookie

Refresh workflow:

- Login returns a short-lived access token in response body
- Login also sets `refreshToken` as an HTTP-only cookie
- `POST /users/refresh-token` reads refresh token from cookie and issues a new access token

## Standard Response Envelope

### Success

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {},
  "requestId": "uuid"
}
```

### Error

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": [
    {
      "field": "email",
      "message": "Invalid email"
    }
  ],
  "requestId": "uuid"
}
```

## Rate Limits

Rate limiting is enforced by middleware and may return `429` with `RateLimit-*` headers.

- General API: `500 requests / 15 minutes / IP`
- Auth endpoints: `5 requests / 15 minutes / IP` (successful requests are skipped)
- Upload endpoint: `10 requests / hour / IP`
- Search endpoints: `30 requests / minute / IP`

## System Endpoints

| Method | Path               | Auth                               | Notes                                                             |
| ------ | ------------------ | ---------------------------------- | ----------------------------------------------------------------- |
| GET    | `/health`          | Public                             | Service health and runtime status                                 |
| GET    | `/metrics`         | Public in dev, token-gated in prod | In production requires `x-metrics-token` matching `METRICS_TOKEN` |
| GET    | `/test-cloudinary` | Dev only by default                | Disabled in production unless `ENABLE_DEBUG_ROUTES=true`          |

## Users

| Method | Path                                    | Auth     | Notes                                                     |
| ------ | --------------------------------------- | -------- | --------------------------------------------------------- |
| POST   | `/users/register`                       | Public   | Multipart; supports `avatar` and `coverImage`             |
| POST   | `/users/login`                          | Public   | Accepts email or username + password                      |
| POST   | `/users/refresh-token`                  | Public   | Reads refresh token from cookie                           |
| GET    | `/users/check-username/:username`       | Public   | Username availability check                               |
| GET    | `/users/check-email/:email`             | Public   | Email availability check                                  |
| POST   | `/users/logout`                         | Required | Clears refresh token cookie and DB token reference        |
| GET    | `/users/profile`                        | Required | Current user profile                                      |
| PATCH  | `/users/update-profile`                 | Required | Update profile fields                                     |
| PATCH  | `/users/avatar`                         | Required | Multipart `avatar` upload                                 |
| PATCH  | `/users/cover-image`                    | Required | Multipart `coverImage` upload                             |
| PATCH  | `/users/change-password`                | Required | Requires `currentPassword`, `newPassword`                 |
| GET    | `/users/c/:username`                    | Optional | Public channel profile with optional subscription context |
| POST   | `/users/toggle-subscription/:channelId` | Required | Subscribe/unsubscribe toggle                              |
| GET    | `/users/watch-history`                  | Required | Paginated watch history                                   |

## Videos

| Method | Path                              | Auth     | Notes                                                 |
| ------ | --------------------------------- | -------- | ----------------------------------------------------- |
| GET    | `/videos`                         | Optional | List published videos; pagination + sort              |
| GET    | `/videos/search`                  | Optional | Supports `q` or `query`                               |
| GET    | `/videos/suggestions`             | Public   | Query-based title suggestions                         |
| GET    | `/videos/user/:userId`            | Optional | Owner sees all; others see published only             |
| GET    | `/videos/:videoId`                | Optional | Unpublished videos restricted to owner                |
| POST   | `/videos/upload`                  | Required | Multipart (`video`, optional `thumbnail`)             |
| PATCH  | `/videos/toggle/publish/:videoId` | Required | Owner-only publish status toggle                      |
| PATCH  | `/videos/:videoId`                | Required | Owner-only metadata and optional thumbnail update     |
| DELETE | `/videos/:videoId`                | Required | Owner-only delete with media cleanup                  |
| POST   | `/videos/:videoId/watch`          | Required | Adds to watch history; increments view if first watch |

## Comments

| Method | Path                           | Auth     | Notes                                                |
| ------ | ------------------------------ | -------- | ---------------------------------------------------- | -------- |
| POST   | `/comments/:videoId`           | Required | Create comment; supports optional `parent` for reply |
| GET    | `/comments/:videoId`           | Optional | Get top-level comments (`sortBy=top                  | newest`) |
| GET    | `/comments/:commentId/replies` | Optional | Paginated replies for a parent comment               |
| PATCH  | `/comments/c/:commentId`       | Required | Update own comment                                   |
| DELETE | `/comments/c/:commentId`       | Required | Delete own comment, or video owner can delete        |

## Likes

| Method | Path                         | Auth     | Notes                  |
| ------ | ---------------------------- | -------- | ---------------------- |
| POST   | `/likes/toggle/v/:videoId`   | Required | Toggle video like      |
| POST   | `/likes/toggle/c/:commentId` | Required | Toggle comment like    |
| GET    | `/likes/videos`              | Required | Paginated liked videos |

## Playlists

| Method | Path                                     | Auth     | Notes                                 |
| ------ | ---------------------------------------- | -------- | ------------------------------------- |
| POST   | `/playlists`                             | Required | Create playlist                       |
| GET    | `/playlists/user`                        | Required | Current user's playlists              |
| GET    | `/playlists/user/:userId`                | Public   | Public playlists unless owner context |
| GET    | `/playlists/:playlistId`                 | Public   | Private playlists restricted to owner |
| PATCH  | `/playlists/:playlistId`                 | Required | Owner-only update                     |
| DELETE | `/playlists/:playlistId`                 | Required | Owner-only delete                     |
| POST   | `/playlists/:playlistId/videos/:videoId` | Required | Owner-only add video                  |
| DELETE | `/playlists/:playlistId/videos/:videoId` | Required | Owner-only remove video               |

## Notifications

| Method | Path                                  | Auth     | Notes                                     |
| ------ | ------------------------------------- | -------- | ----------------------------------------- |
| GET    | `/notifications`                      | Required | Supports pagination and `unreadOnly=true` |
| DELETE | `/notifications`                      | Required | Delete all user notifications             |
| GET    | `/notifications/unread/count`         | Required | Unread notification count                 |
| PATCH  | `/notifications/:notificationId/read` | Required | Mark single notification as read          |
| PATCH  | `/notifications/read-all`             | Required | Mark all unread notifications as read     |
| DELETE | `/notifications/:notificationId`      | Required | Delete single notification                |

## Reports

| Method | Path                  | Auth             | Notes                            |
| ------ | --------------------- | ---------------- | -------------------------------- |
| POST   | `/reports`            | Required         | Create report                    |
| GET    | `/reports/my-reports` | Required         | Current user's submitted reports |
| GET    | `/reports`            | Required + admin | Admin moderation list            |
| GET    | `/reports/:reportId`  | Required + admin | Admin fetch by ID                |
| PATCH  | `/reports/:reportId`  | Required + admin | Admin status update              |
| DELETE | `/reports/:reportId`  | Required + admin | Admin delete                     |

## Pagination

Most list endpoints support `page` and `limit` query parameters.

Typical response shape includes pagination metadata in `data.pagination`.

```json
{
  "data": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Common HTTP Status Codes

- `200` success
- `201` created
- `400` validation or malformed request
- `401` authentication required / invalid token
- `403` authorization failure
- `404` resource not found
- `409` conflict (duplicate or already exists)
- `429` rate limit exceeded
- `500` internal server error
