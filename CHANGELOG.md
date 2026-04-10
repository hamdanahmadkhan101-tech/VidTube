# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Role-based authorization middleware and admin gating for report moderation routes
- Production-gated metrics token enforcement for `/metrics`
- Documentation refresh across root technical guides
- Cursor-based shorts feed endpoint with strict projection and Redis slice caching
- Watch-later persistence (model + endpoints + UI routes)
- Batch watch-progress endpoint to reduce write amplification

### Changed

- Refresh token handling and rotation behavior in auth flow
- Frontend service contracts to match backend endpoint behavior
- Query key and invalidation consistency in frontend data fetching paths
- Search now uses weighted text index first with regex fallback

### Fixed

- Multiple endpoint contract mismatches between frontend and backend
- Counter consistency around likes/comments and comment-tree deletion behavior
- Watch-history insertion logic to prevent duplicate view counting under concurrency
- Logging sanitization for sensitive request payload fields

### Performance

- Optimized backend aggregation and watch-history retrieval paths
- Reduced unnecessary frontend refetch/polling behavior in key user flows

### Validation

- Backend Jest suites passing
- Frontend lint passing
- Frontend production build passing

## [1.2.0] - 2025

### Added

- Mobile-focused UX and runtime optimizations
- Functional video-card action menu and playlist interaction improvements
- Speed Insights integration for production frontend telemetry

### Fixed

- Playlist interaction method mismatch in frontend service layer
- Mobile rendering bottlenecks tied to animation-heavy views

## [1.1.0] - 2025

### Added

- Notification workflows and unread indicators
- Dashboard analytics enhancements
- Optimistic interaction updates for selected social actions

### Fixed

- Comment sorting correctness for engagement-based ordering
- Search parameter compatibility and mapping consistency

## [1.0.0] - 2024

### Added

- Initial full-stack platform baseline (React + Express + MongoDB)
- Core domain modules: auth, videos, likes, comments, playlists, notifications, reports
- Validation, middleware, and custom error handling foundations
