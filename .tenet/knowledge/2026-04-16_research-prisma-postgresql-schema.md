# research-prisma-postgresql-schema

type: knowledge
source_job: 89fa9b5d-bf97-4ee1-924e-8cb9453474a6
job_name: eval-mo168f4i
confidence: decision-only
created: 2026-04-16T08:10:33.824Z

## Findings

- **topic**: Prisma + PostgreSQL schema design for anonymous board
- **key_findings**: ["User table: id, ssoId (unique), role enum (USER/ADMIN), createdAt","Post table: id, authorId (FK User), title, content, category enum, isDeleted, isHidden, likeCount (denormalized), commentCount (denormalized), viewCount, createdAt","Comment table: id, authorId (FK User), postId (FK Post), content, isDeleted, likeCount (denormalized), createdAt","Like table: id, userId (FK User), targetType enum (POST/COMMENT), targetId, createdAt — unique(userId, targetType, targetId)","Report table: id, reporterId (FK User), targetType enum (POST/COMMENT), targetId, reason enum, createdAt — unique(reporterId, targetType, targetId)","AdminLog table: id, adminId (FK User), action, targetType, targetId, createdAt","Denormalized likeCount/commentCount updated via Server Actions for performance","Index on Post(createdAt DESC) for latest feed, composite index for popular feed"]
- **recommended_approach**: Denormalize like/comment counts on Post and Comment for feed performance. Use unique constraints to prevent duplicate likes/reports. Soft delete via isDeleted boolean.
