# AX Tech본부 Blind

사내 익명 SNS 게시판 서비스입니다. 모든 게시글과 댓글은 익명으로 작성되며, 자기 글에 본인이 댓글을 달 경우에만 "글쓴이"로 표시됩니다.

## 주요 기능

### 게시판

- 익명 게시글 작성 (자유 / 질문 / 정보 카테고리)
- 최신순 / 인기순 정렬
- 좋아요 10개 이상 게시글 HOT 배지 표시
- 무한 스크롤 피드

### 댓글

- 익명 댓글 작성
- 대댓글 (무한 depth) 지원 + 접기/펼치기
- 자기 글에 자기가 댓글 시 "글쓴이" 뱃지 표시

### 관리자

- 모든 게시글/댓글 삭제 권한
- 게시글 숨김/복원
- 신고 관리 (접수/무시)
- 관리자 대시보드 (`/admin`)

### 기타

- 게시글/댓글 좋아요
- 게시글/댓글 신고 (욕설, 스팸, 부적절, 개인정보, 기타)
- 오른쪽 사이드바: 인기 급상승 TOP 3, 게시판 통계 (오늘 작성 / 전체 게시글 / 활성 사용자)
- 로그인 실패 시 에러 알림 표시
- 로그아웃 기능

## 기술 스택

| 구분       | 기술                               |
| ---------- | ---------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack) |
| Language   | TypeScript 6                       |
| Database   | PostgreSQL 15+                     |
| ORM        | Prisma 5                           |
| Auth       | NextAuth.js v5 (Credentials)       |
| Styling    | Tailwind CSS 3                     |
| Validation | Zod 4                              |
| Test       | Vitest (Unit), Playwright (E2E)    |

## 프로젝트 구조

```
src/
├── actions/            # Server Actions (post, comment, like, report, admin, stats)
├── app/
│   ├── (admin)/        # 관리자 페이지
│   ├── (auth)/         # 로그인 페이지
│   ├── (main)/         # 메인 피드, 글쓰기, 게시글 상세
│   └── api/auth/       # NextAuth API Route
├── components/
│   ├── comments/       # CommentList, CommentItem, CommentInput
│   ├── feed/           # PostCard, PostCardSkeleton
│   └── layout/         # LeftPanel, RightPanel
└── lib/
    ├── auth.ts          # NextAuth 설정
    ├── auth-utils.ts    # 인증 유틸 (requireAuth, requireAdmin)
    ├── prisma.ts        # Prisma Client 싱글톤
    ├── services/        # 비즈니스 로직 (post, comment, admin, like, report)
    └── validations/     # Zod 스키마 (post, comment)

prisma/
├── schema.prisma       # DB 스키마
└── seed.ts             # 테스트 데이터 시드
```

## 시작하기

### 사전 요구사항

- **Node.js** 18 이상
- **Docker Desktop** (PostgreSQL 컨테이너용)
- **pnpm** 또는 **npm** 패키지 매니저

### 1. 저장소 클론

```bash
git clone https://github.com/<your-org>/sns-board.git
cd sns-board
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성합니다:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sns_board
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
```

> **주의**: `NEXTAUTH_SECRET`은 운영 환경에서 반드시 안전한 랜덤 문자열로 변경하세요.
> 생성 예시: `openssl rand -base64 32`

### 4. PostgreSQL 실행

Docker로 PostgreSQL 컨테이너를 실행합니다:

```bash
docker run -d \
  --name sns-board-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=sns_board \
  -p 5432:5432 \
  postgres:15
```

컨테이너가 이미 존재하는 경우:

```bash
docker start sns-board-postgres
```

### 5. DB 스키마 적용

```bash
npx prisma db push
```

### 6. Prisma Client 생성

```bash
npx prisma generate
```

### 7. 테스트 데이터 시드 (선택)

```bash
npx ts-node --compiler-options '{"module":"CommonJS","types":["node"]}' prisma/seed.ts
```

시드 데이터로 생성되는 테스트 계정:

| 구분            | 이메일                                          | 비밀번호   |
| --------------- | ----------------------------------------------- | ---------- |
| 일반 사용자 1~5 | `test-user-1@test.com` ~ `test-user-5@test.com` | `password` |
| 관리자          | `test-admin-1@test.com`                         | `password` |

### 8. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 접속 가능합니다.

### 9. 프로덕션 빌드 및 실행

```bash
npm run build
npm run start
```

## 운영 서버 배포 가이드

### Docker Compose로 배포하기

프로젝트 루트에 `docker-compose.yml`을 작성합니다:

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: <강력한_비밀번호>
      POSTGRES_DB: sns_board
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  app:
    build: .
    restart: always
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://postgres:<강력한_비밀번호>@db:5432/sns_board
      NEXTAUTH_SECRET: <openssl rand -base64 32 결과>
      NEXTAUTH_URL: https://your-domain.com
    ports:
      - '3000:3000'

volumes:
  pgdata:
```

```bash
docker compose up -d
```

### 환경별 체크리스트

- [ ] `NEXTAUTH_SECRET`을 안전한 랜덤 값으로 변경
- [ ] `NEXTAUTH_URL`을 실제 도메인으로 변경
- [ ] PostgreSQL 비밀번호를 강력한 값으로 변경
- [ ] SSO(OIDC/OAuth2) 연동 설정 (관리자에게 Client ID, Client Secret, Issuer URL 확인)
- [ ] HTTPS 설정 (Nginx reverse proxy 등)

## 스크립트

| 명령어             | 설명                       |
| ------------------ | -------------------------- |
| `npm run dev`      | 개발 서버 실행 (Turbopack) |
| `npm run build`    | 프로덕션 빌드              |
| `npm run start`    | 프로덕션 서버 실행         |
| `npm run lint`     | ESLint 실행                |
| `npm run test`     | Vitest 단위 테스트         |
| `npm run test:e2e` | Playwright E2E 테스트      |
| `npm run seed`     | DB 시드 데이터 삽입        |

## DB 관리

```bash
# 스키마 변경 후 DB에 적용
npx prisma db push

# Prisma Client 재생성
npx prisma generate

# Prisma Studio (DB GUI)
npx prisma studio

# DB 초기화 (데이터 전부 삭제 후 재생성)
npx prisma db push --force-reset
```

## 향후 계획

- [ ] 사내 SSO (OIDC/OAuth2) 연동
- [ ] 실시간 알림 (WebSocket)
- [ ] 이미지 첨부 기능
- [ ] 검색 기능
