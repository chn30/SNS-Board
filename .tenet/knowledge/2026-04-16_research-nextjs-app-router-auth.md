# research-nextjs-app-router-auth

type: knowledge
source_job: 89fa9b5d-bf97-4ee1-924e-8cb9453474a6
job_name: eval-mo168f4i
confidence: decision-only
created: 2026-04-16T08:10:27.015Z

## Findings

- **topic**: Next.js App Router + NextAuth v5 + Prisma patterns
- **key_findings**: ["NextAuth v5 (next-auth@5 / Auth.js) uses auth() helper in server components and middleware","Server Actions with 'use server' for mutations (create post, add comment, toggle like, report)","Prisma Client singleton pattern for Next.js to avoid exhausting connection pool in dev","middleware.ts for auth checks — redirect to /login if no session","Route groups: (auth) for login, (main) for authenticated pages, (admin) for admin pages","Prisma soft delete via middleware or manual isDeleted checks","Cursor-based pagination for infinite scroll (createdAt + id cursor)","NextAuth PrismaAdapter for user/session/account storage"]
- **limitations**: ["NextAuth v5 middleware runs on Edge — cannot use Prisma directly in middleware, use JWT strategy","Server Actions cannot return complex JSX, only serializable data","Prisma connection_limit default is 10, sufficient for 200 users"]
- **recommended_approach**: Use NextAuth v5 with JWT strategy + Prisma adapter for account storage. Server Actions for all mutations. Route groups for auth/main/admin separation. Middleware for auth redirect only (no DB calls).
