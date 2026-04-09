# Contributing to VidTube

Thanks for contributing. This guide defines the expected engineering workflow and quality standards.

## Workflow

1. Fork and clone the repository
2. Create a focused branch from `main`
3. Implement a single coherent change set
4. Run validation commands locally
5. Open a pull request with context and verification notes

Recommended branch naming:

- `feat/<short-description>`
- `fix/<short-description>`
- `docs/<short-description>`
- `chore/<short-description>`

## Local Setup

Follow setup in [README.md](./README.md), then run:

```bash
cd vidtube-backend && npm install
cd ../vidtube-frontend && npm install
```

## Coding Standards

- Keep changes small and intentional
- Preserve existing architecture boundaries (routes/controllers/models/services)
- Prefer explicit behavior over hidden side effects
- Validate input and authorization on every mutation path
- Update docs when public behavior changes

## Commit Message Standard

Use Conventional Commits where possible:

```text
type(scope): short summary
```

Examples:

- `feat(video): add watch-history dedupe guard`
- `fix(auth): tighten refresh token rotation`
- `docs(api): sync reports endpoints`

## Pull Request Requirements

Each PR should include:

1. Problem statement
2. Scope of changes
3. Verification steps executed
4. Risk and rollback notes (for non-trivial backend changes)

## Required Local Verification

```bash
# backend
cd vidtube-backend
npm test

# frontend
cd ../vidtube-frontend
npm run lint
npm run build
```

If your PR touches backend formatting significantly, include `npm run format:check` output context.

## Review Checklist

- [ ] Change is scoped and understandable
- [ ] API behavior remains backward compatible or is documented
- [ ] Security implications were reviewed
- [ ] Validation and authorization checks are present where needed
- [ ] Tests/lint/build results included in PR description
- [ ] Relevant docs updated

## Reporting Bugs and Requesting Features

Open issues with:

- concise title
- expected vs actual behavior
- reproduction steps
- environment details
- logs/screenshots where relevant

For major feature proposals, describe domain impact and migration/backward compatibility considerations.
