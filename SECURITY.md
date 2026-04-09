# VidTube Security Documentation

This document summarizes the currently implemented security controls and recommended production hardening steps.

## Security Principles

- Deny by default for protected resources
- Validate input at API boundaries
- Minimize sensitive data exposure in logs/responses
- Apply layered defenses (auth, rate limiting, headers, ownership checks)

## Authentication

- Access tokens: JWT, verified on protected routes
- Refresh tokens: HTTP-only cookie, validated against persisted token list
- Refresh token rotation: old token removed on use, new token issued
- Refresh token history is bounded to prevent unbounded growth

## Authorization

- Protected endpoints require `verifyJWT`
- Resource-level ownership checks are enforced in controllers
- Role-based checks are implemented via `requireRole(...)`
- Admin-only moderation routes are enforced on report management endpoints

## Session and Cookie Security

Refresh token cookie options are environment-sensitive:

- `httpOnly: true`
- `secure: true` in production
- `sameSite: None` in production, `Lax` in development
- explicit root `path`

## Request Validation and Input Safety

- Zod-based validation is used in validators and endpoint-level checks
- ObjectId and payload constraints are validated in controller paths
- File uploads are constrained by multer route handlers and server-side checks
- Invalid or malformed input returns structured API errors

## Rate Limiting

Route classes are independently throttled:

- General API traffic
- Authentication routes
- Upload routes
- Search routes

This reduces brute-force, abuse, and accidental overuse risks.

## HTTP Header Hardening

Security middleware applies:

- Helmet baseline protections
- Content security policy directives
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection`
- `Referrer-Policy`
- HSTS in production

## CORS Controls

- Explicit allowlist model with environment-driven extensions
- Credentials are enabled for cookie-based refresh flow
- Required headers and methods are explicitly configured

## Logging and Secrets Hygiene

- Structured logging via Winston
- Request IDs for traceability
- Redaction of sensitive keys before logging (`password`, token fields, authorization headers, cookies)
- Avoid storing secrets in source control

## Endpoint Exposure Controls

- `/metrics` is token-gated in production using `x-metrics-token`
- `/test-cloudinary` is disabled in production unless explicitly enabled

## Dependency and Supply Chain Hygiene

Recommended routine:

```bash
npm audit
npm audit fix
```

Run per package (`vidtube-backend`, `vidtube-frontend`) and review major upgrades manually.

## Production Security Checklist

- [ ] Set strong and unique `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`
- [ ] Serve backend and frontend over HTTPS only
- [ ] Configure production CORS allowlist (no wildcards)
- [ ] Configure `METRICS_TOKEN` and restrict metrics access
- [ ] Confirm rate limiting is enabled in deployed environment
- [ ] Verify log retention and access controls
- [ ] Rotate secrets on a defined cadence
- [ ] Run periodic dependency vulnerability scans
- [ ] Perform regular access review for admin accounts

## Incident Reporting

Do not open public issues for security vulnerabilities.

Report privately with:

1. Description and impact
2. Reproduction steps
3. Affected endpoints/components
4. Optional remediation proposal
