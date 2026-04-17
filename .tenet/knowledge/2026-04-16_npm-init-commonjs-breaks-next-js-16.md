# npm init commonjs breaks Next.js 16

type: knowledge
source_job: 1ea1890c-9f5c-4f55-ac45-38b7a35276cc
job_name: Project Setup + Prisma Schema
confidence: implemented-and-tested
created: 2026-04-16T08:45:18.224Z

## Findings

- **insight**: npm init -y sets type:commonjs by default. Next.js 16 with Turbopack requires ESM imports. The type field must be removed or set to module, otherwise Turbopack fails with 'Specified module format (CommonJs) is not matching the module format of the source code (EcmaScript Modules)' on all .ts/.tsx files.
- **applies_to**: Next.js 16+ project setup
