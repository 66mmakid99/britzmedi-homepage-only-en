# CLAUDE-CONTENT-HUB.md
# 이 파일을 britzmedi-global 프로젝트 루트에 넣고
# Claude Code에서 아래 명령 실행:
# claude "CLAUDE-CONTENT-HUB.md 읽고 Phase A부터 순서대로 구현해줘. 에이전트 사용해서 병렬로 진행해."

---

## 프로젝트 컨텍스트

- **현재 프로젝트**: britzmedi-global (Astro 5 + React 19 + Tailwind 4)
- **SEO Workers**: britzmedi-seo (이미 배포됨, https://britzmedi-seo.mmakid.workers.dev)
- **GitHub**: 66mmakid99/britzmedi-homepage-only-en
- **목표**: Content Hub에 YouTube/File/SEO Brief 통합, 블로그 발행까지 자동화

---

## 현재 파일 구조 (참고)

```
src/
├── pages/admin/content-hub/    → 기존 콘텐츠 관리 (수정 필요)
├── pages/api/admin/content-hub/ → 기존 API (확장 필요)
├── lib/youtube-to-blog/        → 기존 YouTube 파이프라인 (재활용)
├── components/admin/           → 기존 어드민 컴포넌트
├── content/blog/               → Keystatic 블로그 JSON 파일들
└── i18n/                       → 다국어
```

---

## 작업 플랜 (순서대로 실행)

### Phase A: SEO Workers 보강
**⚠️ 별도 프로젝트 (britzmedi-seo)에서 작업 필요**
**이 Phase는 건너뛰고 Phase B부터 시작해도 됨** (SEO API 없이도 Content Hub 기본 기능은 작동)

만약 britzmedi-seo 프로젝트 접근 가능하면:
1. `src/index.ts` — CORS origin을 `'*'`로 변경
2. `src/routes/api.ts`에 추가:
   - `GET /api/briefs` — gap_analysis + target_keywords JOIN, gap_score DESC 정렬
   - `POST /api/content-map` — keyword_id, content_path, content_title 저장
   - `PATCH /api/gaps/:id/status` — pending/in_progress/done 상태 변경
3. `wrangler deploy`

### Phase B: Content Hub DB + API

#### B-1. D1 테이블 생성

```sql
-- 이 SQL을 wrangler d1 execute로 실행
CREATE TABLE IF NOT EXISTS content_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL CHECK(source_type IN ('youtube', 'file', 'seo_brief', 'manual')),
  source_id TEXT,
  source_url TEXT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  content TEXT,
  excerpt TEXT,
  category TEXT,
  tags TEXT,
  featured_image TEXT,
  seo_keyword TEXT,
  seo_secondary_keywords TEXT,
  seo_gap_score INTEGER,
  seo_target_position INTEGER,
  schema_type TEXT,
  faq TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('brief','generating','draft','review','approved','published','archived')),
  author TEXT DEFAULT 'BRITZMEDI Research Team',
  word_count INTEGER,
  estimated_read_time TEXT,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER REFERENCES content_items(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  editor TEXT,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_source ON content_items(source_type);
```

#### B-2. API 엔드포인트 구현

파일: `src/pages/api/admin/content-hub/items.ts`
```typescript
// GET: 콘텐츠 목록 (쿼리: ?source_type=seo_brief&status=draft)
// POST: 새 콘텐츠 생성
```

파일: `src/pages/api/admin/content-hub/items/[id].ts`
```typescript
// GET: 콘텐츠 상세
// PATCH: 콘텐츠 수정
// DELETE: 콘텐츠 삭제
```

파일: `src/pages/api/admin/content-hub/items/[id]/transition.ts`
```typescript
// POST: 상태 전환 { action: 'submit_review' | 'approve' | 'reject' | 'publish' | 'archive' }
// 전환 규칙:
//   brief → generating (콘텐츠 생성 시작)
//   generating → draft (생성 완료)
//   draft → review
//   review → approved | draft (반려)
//   approved → published
//   published → archived
```

파일: `src/pages/api/admin/content-hub/seo-briefs.ts`
```typescript
// GET: SEO Workers API 프록시
// fetch('https://britzmedi-seo.mmakid.workers.dev/api/briefs') 또는
// fetch('https://britzmedi-seo.mmakid.workers.dev/api/gaps') 호출
// SEO API 연결 안 되면 빈 배열 반환 (graceful fallback)
```

파일: `src/pages/api/admin/content-hub/generate.ts`
```typescript
// POST: Claude API로 콘텐츠 생성
// body: { keyword, title, content_type, additional_keywords, instructions, word_count, include_faq, tone }
// 1. Claude Sonnet 호출 (아래 프롬프트 사용)
// 2. 결과를 content_items에 draft로 저장
// 3. content_id 반환
```

파일: `src/pages/api/admin/content-hub/publish.ts`
```typescript
// POST: Keystatic 발행
// body: { content_id }
// 1. content_items에서 데이터 로드
// 2. src/content/blog/{slug}.json 생성
// 3. 기존 github.ts 활용하여 GitHub commit
// 4. status → published, published_at 기록
// 5. (optional) SEO Workers에 content-map 등록
```

### Phase C: Claude 콘텐츠 생성 엔진

파일: `src/lib/content-pipeline/content-generator.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';

interface GenerateRequest {
  keyword: string;
  title: string;
  content_type: 'blog' | 'faq' | 'guide' | 'product_page';
  additional_keywords: string[];
  instructions?: string;
  word_count?: number;
  include_faq: boolean;
  include_schema: boolean;
  tone: string;
}

interface GenerateResult {
  title: string;
  slug: string;
  meta_description: string;
  content: string;           // full markdown
  faq: Array<{ question: string; answer: string }>;
  schema_type: string;
  internal_links: Array<{ text: string; url: string }>;
  estimated_read_time: string;
  word_count: number;
}

// Claude Sonnet 4 사용 (Opus는 타임아웃 우려)
// 모델: claude-sonnet-4-5-20250929

const SYSTEM_PROMPT = `You are a content strategist for BRITZMEDI, a Korean medical device company specializing in RF aesthetic devices (TORR RF, UlBlanc, NewChae, LuminoWave).

Target audience: medical device distributors, clinic owners, aesthetic practitioners worldwide.

BRITZMEDI products:
- TORR RF: Toroidal RF technology, monopolar RF for skin tightening, FDA 510(k) clearance pending
- UlBlanc: Fractional RF microneedling device
- NewChae: LED therapy device
- LuminoWave: Sonoillumination technology (ultrasound + light)

Always write in professional, authoritative English. Include clinical evidence and data where relevant. Naturally mention BRITZMEDI products when contextually appropriate (don't force it).`;

// 이 함수를 generate API에서 호출
export async function generateSEOContent(req: GenerateRequest): Promise<GenerateResult> {
  // Claude API 호출
  // JSON 파싱하여 GenerateResult 반환
}
```

파일: `src/lib/content-pipeline/publisher.ts`

```typescript
// 기존 src/lib/youtube-to-blog/github.ts 패턴 재활용
// 1. content_items 데이터 → Keystatic blog JSON 변환
// 2. GitHub API로 src/content/blog/{slug}.json 커밋
// 3. featured_image가 있으면 public/images/blog/에도 커밋

interface KeystaticBlogPost {
  title: string;
  slug: string;
  date: string;
  category: string;
  excerpt: string;
  content: string;
  featured_image: string;
  author: string;
  tags: string[];
}
```

### Phase D: Content Hub UI

**핵심: 기존 /admin/content-hub 페이지를 확장**

파일: `src/components/admin/content-hub/ContentHubDashboard.tsx`

```
주요 구조:

┌─────────────────────────────────────────────────────┐
│  Content Hub                        [+ New Content] │
│                                                     │
│  ┌─────┬─────────┬──────┬──────┬───────────┐       │
│  │ All │ YouTube │ File │ SEO  │ Published │       │
│  └─────┴─────────┴──────┴──────┴───────────┘       │
│                                                     │
│  [Status Filter] [Category Filter] [Search]         │
│                                                     │
│  ┌─ Content Card ─────────────────────────────────┐ │
│  │ 🔵 DRAFT │ source: seo_brief │ T1             │ │
│  │ Understanding Toroidal RF Technology            │ │
│  │ keyword: toroidal rf technology │ gap: 95      │ │
│  │ 1,523 words │ 7 min read                      │ │
│  │ [Edit] [Preview] [Submit Review]               │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ SEO Brief Card (미생성) ──────────────────────┐ │
│  │ 📋 BRIEF │ T4 │ gap: 95                       │ │
│  │ "what is toroidal rf technology"                │ │
│  │ Recommended: FAQ │ Target: #1                  │ │
│  │ [Generate Content] [Skip] [Edit Brief]         │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

UI 기술 요구사항:
- React 19 (기존 프로젝트와 동일)
- Tailwind 4 (기존 스타일 시스템 따르기)
- 기존 admin 페이지의 다크 테마 및 컴포넌트 스타일 참조
- fetch로 API 호출 (axios 사용 안 함)
- 모달은 React portal 또는 간단한 state toggle

### Phase E: 발행 파이프라인

1. "Publish" 버튼 클릭 시:
   - `/api/admin/content-hub/publish` 호출
   - Keystatic JSON 파일 생성 → GitHub commit
   - content_items status → 'published'
   - (optional) SEO Workers content-map 등록

2. 기존 `src/lib/youtube-to-blog/github.ts`의 `commitToGitHub()` 함수 재활용

### Phase F: 테스트

1. `npm run build` 에러 없는지 확인
2. `npm run dev` 로 서버 띄우고:
   - `/admin/content-hub` 접속 확인
   - 탭 전환 작동 확인
   - 수동으로 콘텐츠 생성 테스트 (ANTHROPIC_API_KEY 필요)
3. API 테스트:
   - `GET /api/admin/content-hub/items` → 200
   - `POST /api/admin/content-hub/items` → 201
   - `POST /api/admin/content-hub/generate` → 200 (Claude API 호출)

---

## 에이전트 팀 구성 (병렬 작업)

Claude Code에서 에이전트 사용 시 이렇게 분배:

```
Agent 1 (Backend): Phase B 전체
  - D1 테이블 생성
  - API 엔드포인트 구현
  - 기존 API와 충돌 없는지 확인
  작업 파일: src/pages/api/admin/content-hub/*

Agent 2 (Content Engine): Phase C 전체
  - content-generator.ts
  - publisher.ts
  - schema-generator.ts (optional)
  작업 파일: src/lib/content-pipeline/*

Agent 3 (Frontend): Phase D 전체
  - ContentHubDashboard.tsx 및 하위 컴포넌트
  - 기존 admin 스타일 참조
  작업 파일: src/components/admin/content-hub/*
            src/pages/admin/content-hub.astro (수정)
```

이 3개 에이전트는 파일 충돌 없이 병렬 진행 가능.

---

## 중요 주의사항

1. **기존 코드 건드리지 않기**: youtube-to-blog 기존 파일 수정 금지, 새 파일로 추가
2. **D1 바인딩**: wrangler.toml에 이미 D1 바인딩이 있는지 확인 후 사용
3. **환경변수**: ANTHROPIC_API_KEY가 이미 설정되어 있는지 확인
4. **import 경로**: 기존 프로젝트의 tsconfig paths 설정 따르기
5. **빌드 확인**: 각 Phase 완료 후 `npm run build` 실행하여 에러 없는지 확인
6. **SEO API 연결 실패 시**: graceful fallback (빈 데이터 반환, UI에 "SEO 연결 안됨" 표시)
