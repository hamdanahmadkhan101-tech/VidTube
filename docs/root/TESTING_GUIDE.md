# Testing Guide

This guide covers the current validation workflow for the VidTube monorepo.

## Quality Gates

Primary gates currently used:

1. Backend unit/integration tests (`Jest + Supertest`)
2. Frontend static analysis (`ESLint + TypeScript`)
3. Frontend production build (`vite build`)

## Prerequisites

- Install dependencies in both packages
- Configure environment variables
- Ensure MongoDB and Cloudinary config are available for integration paths

```bash
cd vidtube-backend && npm install
cd ../vidtube-frontend && npm install
```

## Backend Validation

Run full test suite with coverage:

```bash
cd vidtube-backend
npm test
```

Useful variants:

```bash
npm run test:watch
npm run test:verbose
```

Formatting checks:

```bash
npm run format:check
```

Note: formatting check still surfaces legacy baseline issues across existing files. This is tracked separately from functional correctness.

## Frontend Validation

Run lint:

```bash
cd vidtube-frontend
npm run lint
```

Run production build:

```bash
npm run build
```

Preview build output locally:

```bash
npm run preview
```

## Recommended Pre-PR Sequence

```bash
# backend
cd vidtube-backend
npm test

# frontend
cd ../vidtube-frontend
npm run lint
npm run build
```

## Manual Smoke Checklist

After local startup, verify:

1. Registration/login/refresh/logout flow
2. Video upload and playback detail load
3. Like and comment interactions
4. Playlist add/remove flow
5. Notifications load and mark-as-read actions
6. Report creation and admin moderation route behavior

## API Smoke Commands (Optional)

```bash
# Health
curl http://localhost:8080/health

# Public videos
curl http://localhost:8080/api/v1/videos
```

Authenticated route examples should include bearer token or valid cookies.

## CI Guidance

Suggested pipeline order:

1. Install dependencies for both packages
2. Run backend tests
3. Run frontend lint
4. Run frontend build
5. Optionally run backend format check as non-blocking until baseline cleanup is complete

## Troubleshooting

- If tests fail due to missing dependencies: re-run `npm install` in both packages
- If frontend build fails: run lint first and fix type/lint errors
- If auth tests fail: verify token secrets and cookie settings are present in environment
