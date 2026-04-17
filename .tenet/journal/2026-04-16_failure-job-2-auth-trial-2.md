# failure-job-2-auth-trial-2

type: journal
source_job: 72d4eae5-1f74-425e-9df5-49064d2575c4
job_name: Auth (NextAuth + Mock SSO + Middleware)
created: 2026-04-16T08:54:17.979Z

## Findings

- **trial**: 2
- **code_critic**: PASS
- **test_critic**: FAIL — all 16 tests are source-code string matching (readFileSync + toContain), not behavioral tests. Zero functions imported or called.
- **playwright_eval**: FAIL — middleware does not redirect unauthenticated users. Root / returns 200 instead of 302→/login. Missing `authorized` callback in NextAuth config.
- **root_cause_1**: auth.ts lacks `authorized` callback in callbacks section. Without it, `export { auth as middleware }` only attaches session data but does not enforce authentication.
- **root_cause_2**: Worker wrote tests using readFileSync to check source strings instead of importing and calling functions with mocks.
- **fix_required**: ["Add `authorized({ auth }) { return !!auth?.user; }` callback to NextAuth config","Rewrite tests as behavioral: mock prisma/bcrypt, import and call authorize/callbacks/auth-utils functions","Verify middleware actually redirects unauthenticated requests to /login"]
