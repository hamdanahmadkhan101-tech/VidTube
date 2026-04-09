# VidTube

VidTube is a full-stack video sharing platform with a React + TypeScript frontend and an Express + MongoDB backend.

This repository now includes a hardened API surface, improved performance paths, cleaner frontend query contracts, and updated project documentation.

## Repository Structure

```
VidTube-main/
|- vidtube-backend/   # Express API, MongoDB models, Jest tests
|- vidtube-frontend/  # React 19 + Vite + TypeScript application
|- docs/              # Detailed technical documentation (root/backend/frontend)
`- *.md               # Governance and entry-point documentation
```

## Documentation Map

- [docs/README.md](./docs/README.md): Documentation index and ownership map
- [SECURITY.md](./SECURITY.md): Security policy and deployment checklist
- [CHANGELOG.md](./CHANGELOG.md): Keep-a-changelog release history
- [CONTRIBUTING.md](./CONTRIBUTING.md): Contribution and PR quality standards

Detailed technical docs:

- [docs/root/QUICK_REFERENCE.md](./docs/root/QUICK_REFERENCE.md): Commands, routes, and daily workflow shortcuts
- [docs/backend/API_DOCUMENTATION.md](./docs/backend/API_DOCUMENTATION.md): HTTP endpoints, auth model, and request/response contracts
- [docs/root/ARCHITECTURE.md](./docs/root/ARCHITECTURE.md): System design, data flow, and scaling direction
- [docs/root/TESTING_GUIDE.md](./docs/root/TESTING_GUIDE.md): Test/lint/build verification and CI guidance
- [docs/root/PERFORMANCE_OPTIMIZATIONS.md](./docs/root/PERFORMANCE_OPTIMIZATIONS.md): Implemented optimizations and next tuning steps
- [docs/root/BUG_FIXES_SUMMARY.md](./docs/root/BUG_FIXES_SUMMARY.md): Consolidated remediation summary for this hardening cycle
- [docs/frontend/VERCEL_SPEED_INSIGHTS.md](./docs/frontend/VERCEL_SPEED_INSIGHTS.md): Frontend RUM integration notes

## Current Engineering Baseline

- Backend tests: passing (5 suites, 35 tests)
- Frontend tests: passing (1 file, 2 tests)
- Frontend lint: passing
- Frontend production build: passing
- Backend format check: known legacy baseline still pending full repo normalization

## Core Capabilities

- Authentication with JWT access tokens and refresh-token rotation
- Video upload, playback metadata, search, and owner management
- Comments with replies and engagement sorting
- Like system for videos and comments
- Playlist management and video curation
- Notification flows for engagement events
- Reporting workflow with admin-only moderation routes

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- Zustand
- React Router

### Backend

- Node.js + Express 5
- MongoDB + Mongoose
- JWT + cookie-parser
- Helmet + express-rate-limit
- Multer + Cloudinary
- Winston logging
- Jest + Supertest

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance (local or Atlas)
- Cloudinary account for media upload

## Local Setup

1. Clone and install dependencies:

```bash
git clone <your-repo-url>
cd VidTube-main

cd vidtube-backend
npm install

cd ../vidtube-frontend
npm install
```

2. Configure backend environment variables in `vidtube-backend/.env`:

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
NODE_ENV=development
```

3. Configure frontend environment variables in `vidtube-frontend/.env`:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

4. Run services:

```bash
# terminal 1
cd vidtube-backend
npm run dev

# terminal 2
cd vidtube-frontend
npm run dev
```

## Development Commands

### Backend

```bash
cd vidtube-backend
npm run dev
npm test
npm run test:watch
npm run format
npm run format:check
```

### Frontend

```bash
cd vidtube-frontend
npm run dev
npm run test
npm run lint
npm run build
npm run preview
```

## Validation Workflow

Run this sequence before opening a PR:

```bash
# backend
cd vidtube-backend
npm test

# frontend
cd ../vidtube-frontend
npm run test
npm run lint
npm run build
```

## Deployment Notes

- Backend defaults to `PORT=8080` if not provided
- Render backend deployment blueprint is available at `render.yaml`
- `trust proxy` is enabled for reverse-proxy deployments
- In production, `/metrics` requires `x-metrics-token`
- In production, `/metrics/realtime` and `/metrics/cache` also require `x-metrics-token`
- Development diagnostics route `/test-cloudinary` is disabled in production unless explicitly enabled

## Security and Operational Notes

- Report moderation endpoints are role-gated (`admin`)
- Sensitive request fields are redacted from logs
- Rate limits are route-specific (API/auth/upload/search)
- Refresh tokens are rotated and bounded in persisted history

## License

No license file is currently defined in this repository.
