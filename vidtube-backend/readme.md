# VidTube Backend

Express 5 API service for the VidTube platform.

## Quick Start

```bash
npm install
npm run dev
```

Default local server port is `8080` unless `PORT` is provided.

## Environment Variables

Create `vidtube-backend/.env` with values similar to:

```env
PORT=8080
MONGODB_URI=mongodb://127.0.0.1:27017/VidTubeDB
ACCESS_TOKEN_SECRET=replace-with-strong-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=replace-with-strong-secret
REFRESH_TOKEN_EXPIRY=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
METRICS_TOKEN=optional-metrics-token
REDIS_URL=rediss://default:password@your-redis-host:6379
CACHE_ENABLED=true
CACHE_PREFIX=vidtube
CACHE_DEFAULT_TTL_SECONDS=60
RATE_LIMIT_REDIS_ENABLED=true
RATE_LIMIT_PREFIX=vidtube:ratelimit:
NODE_ENV=development
```

## Scripts

- `npm run dev`: start backend in watch mode
- `npm start`: run production entrypoint
- `npm test`: run Jest with coverage
- `npm run test:watch`: run Jest in watch mode
- `npm run test:verbose`: run Jest verbose output
- `npm run format`: run Prettier write on backend source
- `npm run format:check`: check Prettier formatting

## Deploy on Render

This repository includes a Render Blueprint at [../render.yaml](../render.yaml).

Manual setup steps in Render:

1. Create a new Web Service from this repository.
2. Set Root Directory to `vidtube-backend`.
3. Use Build Command `npm install`.
4. Use Start Command `npm start`.
5. Set Health Check Path to `/health`.
6. Add environment variables from [.env.example](./.env.example).

Required environment variables for production:

- `MONGODB_URI`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `FRONTEND_URL` (your frontend production URL)

Recommended additional variables:

- `ALLOWED_ORIGINS`
- `METRICS_TOKEN`
- `BODY_SIZE_LIMIT=1mb`
- `ENABLE_DEBUG_ROUTES=false`
- `LOG_LEVEL=info`
- `REDIS_URL` (for distributed cache)
- `CACHE_ENABLED=true`
- `CACHE_PREFIX=vidtube`
- `CACHE_DEFAULT_TTL_SECONDS=60`
- `RATE_LIMIT_REDIS_ENABLED=true`
- `RATE_LIMIT_PREFIX=vidtube:ratelimit:`

If your Upstash plan allows only one Redis database, you can still use it safely across projects by assigning unique prefixes per app/environment:

- `CACHE_PREFIX` for response cache keys
- `RATE_LIMIT_PREFIX` for rate-limit keys

Example shared-prefix strategy:

- `CACHE_PREFIX=vidtube:prod:api:cache`
- `RATE_LIMIT_PREFIX=vidtube:prod:api:ratelimit:`

## Architecture Snapshot

- Routes: endpoint and middleware composition
- Controllers: request orchestration and domain validation
- Models: Mongoose schemas and indexing
- Middlewares: auth, authorization, logging, security, rate limiting, error handling
- Utilities: API response wrappers, validation helpers, logging, media helpers

See [../docs/root/ARCHITECTURE.md](../docs/root/ARCHITECTURE.md) for full details.

## Route Groups

- `/api/v1/users`
- `/api/v1/videos`
- `/api/v1/comments`
- `/api/v1/likes`
- `/api/v1/playlists`
- `/api/v1/notifications`
- `/api/v1/reports`

System endpoints:

- `GET /health`
- `GET /metrics` (token-gated in production)
- `GET /metrics/realtime` (token-gated in production)
- `GET /metrics/cache` (token-gated in production)

Full endpoint reference: [../docs/backend/API_DOCUMENTATION.md](../docs/backend/API_DOCUMENTATION.md)

## Security Highlights

- JWT access token validation + cookie-based refresh token rotation
- RBAC support (`requireRole`) for admin-gated moderation routes
- Route-specific rate limiting for auth/upload/search and critical mutation endpoints
- Redis-backed distributed limiter store is used when configured
- Request ID tracing and sensitive-field log redaction

Security documentation: [../SECURITY.md](../SECURITY.md)

## Testing and Validation

```bash
npm test
npm run format:check
```

Testing guide: [../docs/root/TESTING_GUIDE.md](../docs/root/TESTING_GUIDE.md)