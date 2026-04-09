# Quick Reference

This file is a practical command and workflow cheat sheet for day-to-day development.

## Start Locally

```bash
# backend
cd vidtube-backend
npm install
npm run dev

# frontend (new terminal)
cd vidtube-frontend
npm install
npm run dev
```

## Verify Changes

```bash
# backend tests
cd vidtube-backend
npm test

# frontend quality gates
cd ../vidtube-frontend
npm run test
npm run lint
npm run build
```

## Common Scripts

### Backend (`vidtube-backend/package.json`)

- `npm run dev`: start API in watch mode
- `npm start`: run production server entrypoint
- `npm test`: run Jest with coverage
- `npm run test:watch`: run Jest in watch mode
- `npm run format`: apply Prettier to backend source
- `npm run format:check`: verify backend formatting

### Frontend (`vidtube-frontend/package.json`)

- `npm run dev`: start Vite dev server
- `npm run test`: run Vitest test suite
- `npm run test:watch`: run Vitest in watch mode
- `npm run lint`: run ESLint
- `npm run build`: run TypeScript build + Vite production bundle
- `npm run preview`: preview production build

## API Base Paths

- Base URL (local default): `http://localhost:8080/api/v1`
- Health: `GET /health`
- Metrics: `GET /metrics` (token required in production)
- Realtime metrics: `GET /metrics/realtime` (same token policy as `/metrics`)

## Route Map

- Users: `/users/*`
- Videos: `/videos/*`
- Comments: `/comments/*`
- Likes: `/likes/*`
- Playlists: `/playlists/*`
- Notifications: `/notifications/*`
- Reports: `/reports/*`

Use [API_DOCUMENTATION.md](../backend/API_DOCUMENTATION.md) for full endpoint definitions.

## Environment Variables (Minimal)

### Backend

- `PORT`
- `MONGODB_URI`
- `ACCESS_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRY`
- `REFRESH_TOKEN_SECRET`
- `REFRESH_TOKEN_EXPIRY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Frontend

- `VITE_API_URL`

## Operational Notes

- Reports read/update/delete endpoints are admin-only.
- Access tokens can be supplied as `Authorization: Bearer <token>`.
- Refresh token is managed via secure HTTP-only cookie.
- Request IDs are attached to responses via `X-Request-Id`.
- Realtime notification channel uses Socket.io user rooms (`user:<userId>`).

## Known Baseline Notes

- Backend Jest tests, frontend lint, and frontend production build are passing.
- Backend `format:check` still reports broad legacy formatting drift across existing files.
