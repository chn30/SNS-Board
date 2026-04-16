# Harness: Quality Contract

## Formatting & Linting
formatter: prettier (2-space indent, single quotes, trailing comma all)
linter: eslint with @next/eslint-plugin-next, typescript-eslint
enforcement: pre-commit + eval gate

## Testing Requirements
unit_test_coverage: >= 60% for new code (MVP target)
test_framework: Playwright (e2e), Vitest (unit)
e2e_coverage: All 8 success scenarios + 7 anti-scenarios

## Architecture Rules
- Next.js App Router only (no Pages Router)
- Server Actions for all mutations (no API routes for CRUD)
- Prisma singleton pattern (lib/prisma.ts)
- Zod validation on all Server Action inputs
- All DB queries go through service layer (lib/services/*.ts), not directly in actions
- Components in src/components/, pages in src/app/
- Server Components by default, "use client" only when needed (interactivity)

## Code Principles
- Prefer composition over inheritance
- Explicit over implicit
- Functions do one thing
- No user PII in API responses (no userId, email, ssoId to frontend)
- All user-facing text in Korean
- Read .tenet/DESIGN.md before writing any frontend CSS/components

## Danger Zones (do not modify)
- .tenet/ (all tenet state files)
- prisma/migrations/ (only prisma migrate generates these)
- .env (credentials)
- middleware.ts (only modify with explicit auth changes)

## Iron Laws
- API responses MUST NEVER contain userId, email, ssoId, or any PII
- All user inputs MUST be validated with Zod before DB operations
- All DB writes MUST go through Server Actions (no client-side direct DB calls)
- Soft delete: set isDeleted=true, never hard delete user content
- Unique constraint on Like(userId, targetType, targetId) — enforced at DB level
- Unique constraint on Report(reporterId, targetType, targetId) — enforced at DB level
- Report threshold (3 unique reports) triggers automatic isHidden=true
- Admin operations MUST create AdminLog entries
- middleware.ts MUST redirect unauthenticated users to /login
- Admin routes MUST check role=ADMIN in middleware or layout
