# VidTube Architecture

## Overview

VidTube is organized as a two-application monorepo:

1. `vidtube-backend`: Express 5 API with MongoDB (Mongoose)
2. `vidtube-frontend`: React 19 + TypeScript SPA served by Vite

The system is intentionally layered to keep HTTP, business rules, and persistence concerns separated.

## High-Level Topology

```text
Browser (React + TS)
    |
    | HTTPS / JSON + multipart
    v
Express API (Node.js)
    |
    | Mongoose queries and aggregations
    v
MongoDB

Media assets (uploads/thumbnails)
    <-> Cloudinary
```

## Backend Architecture

### Layering

- Routes: endpoint wiring and middleware composition
- Controllers: request validation, authorization checks, orchestration
- Models: schema definition, indexes, persistence logic
- Utilities/services: shared helpers (pagination, validation, formatting, Cloudinary, logging)

### Request Pipeline

```text
requestId -> CORS -> security headers -> API rate limiting
-> request logging -> body parsing/cookies -> routes
-> error logging -> centralized error middleware
```

Notable middleware characteristics:

- `trust proxy` is enabled for reverse proxy compatibility
- route-specific limiters for auth/upload/search traffic
- request IDs are returned through `X-Request-Id`
- sensitive data is redacted before error payloads are logged

### AuthN/AuthZ

- Access tokens are validated via JWT (`verifyJWT`)
- Refresh tokens are cookie-based and rotated on refresh
- Role-based authorization is enforced via `requireRole(...)`
- Report moderation routes are currently admin-gated

### Data and Query Patterns

- Aggregation pipelines are used for high-value read paths (video details, channel profile, watch history)
- Engagement counters (`likesCount`, `commentsCount`) are denormalized on videos
- Counter updates are paired with like/comment mutations for predictable read performance
- Watch history insertion uses atomic checks to avoid duplicate view inflation

## Frontend Architecture

### Runtime Structure

- Router-driven page composition (`react-router-dom`)
- TanStack Query for server-state fetch/caching/invalidation
- Zustand for client-side state where global app state is required
- Service modules as a contract boundary between UI and HTTP API

### UI Composition

```text
Pages
  -> Feature Components
      -> Shared UI Components
          -> Service Layer / Query Hooks
```

### Data Contract Strategy

- Centralized API client for auth-aware requests
- Consistent query key usage and invalidation paths
- Route and payload alignment with backend endpoints

## Scalability Characteristics

### Current

- Stateless API requests (JWT)
- Targeted database indexes on identity and content lookup fields
- Aggregation-first retrieval for complex page payloads
- Request throttling on abuse-prone endpoints

### Planned / Next

- Redis layer for hot-read caching and token/session adjunct data
- Queue-based asynchronous workloads (notifications, heavy media tasks)
- Additional observability (APM, tracing, alerting)

## Reliability and Operations

- Health endpoint: `/health`
- Basic runtime metrics endpoint: `/metrics`
- Structured logging with environment metadata
- Graceful shutdown hooks in backend process lifecycle

## Deployment Model

- Frontend: Vercel/Cloudflare Pages-compatible static deployment
- Backend: container or Node runtime on managed hosts (Render/Railway/etc.)
- Database: MongoDB Atlas recommended for production
- Media: Cloudinary

## Architecture Decisions That Matter

- Keep controller logic explicit and defensive rather than hidden in implicit magic
- Favor stable response envelopes to reduce frontend coupling risk
- Prioritize predictable query cost and correctness over premature abstraction
- Use RBAC and resource ownership checks close to route boundaries

## Known Gaps

- Backend formatting baseline is still being normalized across legacy files
- End-to-end test coverage can be expanded further for cross-service flows
- Observability stack is currently basic and should be deepened for production scale
