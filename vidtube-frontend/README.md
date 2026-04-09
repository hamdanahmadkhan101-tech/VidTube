# VidTube Frontend

React 19 + TypeScript single-page application for VidTube.

## Quick Start

```bash
npm install
npm run dev
```

Default Vite local URL: `http://localhost:5173`

## Environment Variables

Create `vidtube-frontend/.env`.

Use one of these API variables (first one has priority if both are set):

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
# or
VITE_API_URL=http://localhost:8080/api/v1
```

## Scripts

- `npm run dev`: start Vite development server
- `npm run lint`: run ESLint
- `npm run build`: run TypeScript build and Vite production build
- `npm run preview`: preview production build
- `npm start`: preview on host/port for deployment environments

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- Zustand
- React Router
- Framer Motion
- React Hook Form + Zod

## Runtime Highlights

- API client with automatic access-token refresh flow
- Query cache and invalidation strategies for server-state consistency
- Modular service layer for API contract stability
- Video playback with HLS support path
- Speed Insights instrumentation for production telemetry

## Validation

```bash
npm run lint
npm run build
```

## Related Docs

- [../README.md](../README.md)
- [../docs/backend/API_DOCUMENTATION.md](../docs/backend/API_DOCUMENTATION.md)
- [../docs/root/ARCHITECTURE.md](../docs/root/ARCHITECTURE.md)
- [../docs/root/TESTING_GUIDE.md](../docs/root/TESTING_GUIDE.md)
- [../docs/frontend/VERCEL_SPEED_INSIGHTS.md](../docs/frontend/VERCEL_SPEED_INSIGHTS.md)
