# BRITZMEDI 콘텐츠 통합 시스템 설계서 v1.0
## SEO Intelligence + Content Hub + Blog 발행 통합

---

## 1. 현재 시스템 현황

### 1.1 britzmedi-seo (Workers) — ✅ 배포 완료
- URL: https://britzmedi-seo.mmakid.workers.dev
- 역할: 키워드 모니터링, 순위 추적, 갭 분석
- Stack: Hono + D1 + KV + Cron
- 데이터: 50개 타겟 키워드, 주간 순위 수집, Gap Score 자동 산정

### 1.2 britzmedi-global (Pages) — 🟡 진행 중
- URL: britzmedi-homepage-only-en.pages.dev / britzmedi.com
- 역할: 글로벌 B2B 웹사이트 + 어드민 대시보드
- Stack: Astro 5 + React 19 + Tailwind 4 + Keystatic CMS
- GitHub: 66mmakid99/britzmedi-homepage-only-en

### 1.3 기존 어드민 기능 (britzmedi-global 내)

| 경로 | 상태 | 기능 |
|------|------|------|
| /admin | ✅ | 메인 대시보드 |
| /admin/homepage | ✅ | 홈페이지 관리 |
| /admin/youtube-to-blog | ✅ | YouTube → 블로그 변환 파이프라인 |
| /admin/content-hub | 🟡 | 콘텐츠 관리 (quality check, 상태전환) |
| /admin/social | 🟡 | SNS 연동 (설계 완료, 일부 구현) |
| /admin/subscribers | 🔴 | 미구현 |
| /admin/resources | ✅ | 리소스 관리 |

### 1.4 기존 Content Hub 구조

```
src/pages/admin/content-hub/    → 콘텐츠 관리 페이지
src/pages/api/admin/content-hub/ → API (quality-check, transition)
src/lib/youtube-to-blog/        → YouTube → Blog 파이프라인
  ├── youtube.ts                → YouTube 데이터 추출
  ├── claude.ts                 → Claude API 글 생성
  ├── gemini.ts                 → Gemini Vision 이미지 분석
  ├── images.ts                 → AI 이미지 생성
  ├── github.ts                 → GitHub 커밋
  └── file-parsers/             → PDF/DOCX/PPTX (설계만 됨)
```

---

## 2. 통합 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    britzmedi-global (Admin)                      │
│                                                                 │
│  /admin/content-hub (통합 콘텐츠 관리)                            │
│  ┌──────────┬──────────┬──────────┬──────────┐                 │
│  │ All      │ YouTube  │ File     │ SEO      │  ← 소스별 탭    │
│  │ Contents │ to Blog  │ to Blog  │ Briefs   │                 │
│  └──────────┴──────────┴──────────┴──────────┘                 │
│                                                                 │
│  콘텐츠 파이프라인 (공통):                                        │
│  Draft → Review → Edit → Approve → Publish → Track             │
│                                                                 │
│  ┌───────────────────────────────────────────┐                 │
│  │ Claude API: 콘텐츠 생성/리라이트 엔진      │                 │
│  └───────────────────────────────────────────┘                 │
│                                                                 │
│  발행 → Keystatic (src/content/blog/*.json)                     │
│       → GitHub commit → Cloudflare Pages 재배포                 │
│                                                                 │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ API 호출 (fetch)
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│              britzmedi-seo (Workers API)                         │
│                                                                 │
│  제공하는 데이터:                                                 │
│  GET /api/gaps          → 갭 분석 결과 (콘텐츠 브리프)            │
│  GET /api/keywords      → 타겟 키워드 목록                       │
│  GET /api/overview      → 전체 SEO 현황                         │
│  POST /api/content-map  → 콘텐츠 발행 후 매핑 등록 (NEW)         │
│                                                                 │
│  자동화:                                                         │
│  Cron 월요일 09:00 → 주간 순위 수집                              │
│  Cron 월요일 10:00 → 갭 분석 실행                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. SEO Brief → Content Hub 연동 흐름

### 3.1 전체 플로우

```
[SEO Workers]                    [Content Hub]                 [Blog]
     │                                │                           │
     │  1. 주간 갭 분석                │                           │
     │  gap_score 계산                 │                           │
     │  recommended_title 생성         │                           │
     │                                │                           │
     │  ─── GET /api/gaps ──────────→ │                           │
     │                                │                           │
     │                    2. 어드민이 SEO Briefs 탭 확인            │
     │                       gap_score 높은 순 정렬                │
     │                       "Generate Content" 클릭               │
     │                                │                           │
     │                    3. Claude API로 콘텐츠 생성              │
     │                       - 타겟 키워드                         │
     │                       - 추천 제목                           │
     │                       - 콘텐츠 타입 (blog/faq/guide)       │
     │                       - Schema.org 타입                    │
     │                       - AEO 최적화 포함                     │
     │                                │                           │
     │                    4. Draft 상태로 저장                     │
     │                       → 어드민이 Review/Edit                │
     │                                │                           │
     │                    5. Approve → Publish                    │
     │                       → Keystatic JSON 생성    ──────────→ │
     │                       → GitHub commit                ← 블로그 발행
     │                                │                           │
     │  ←── POST /api/content-map ──  │                           │
     │  6. 발행 콘텐츠 매핑 등록       │                           │
     │     keyword_id ↔ content_path  │                           │
     │     position_before 기록        │                           │
     │                                │                           │
     │  7. 다음 주 순위 수집           │                           │
     │     position_after 업데이트     │                           │
     │     성과 측정                   │                           │
```

### 3.2 SEO Brief 데이터 구조

Content Hub가 SEO Workers에서 받는 데이터:

```typescript
interface SEOBrief {
  // SEO Workers gap_analysis 테이블에서
  keyword_id: number;
  keyword: string;
  tier: 1 | 2 | 3 | 4;
  category: string;           // product, technology, comparison, aeo...
  gap_score: number;          // 0~100
  current_position: number | null;
  target_position: number;
  
  // 콘텐츠 생성 가이드
  recommended_title: string;
  recommended_content_type: string; // blog, faq, guide, product_page
  
  // Claude 프롬프트에 전달할 추가 컨텍스트
  related_keywords: string[];  // 같은 카테고리의 다른 키워드들
  target_regions: string[];    // 타겟 지역
}
```

---

## 4. Content Hub 통합 UI 설계

### 4.1 탭 구조

```
/admin/content-hub

┌─────────────────────────────────────────────────────────────┐
│  Content Hub                              [+ New Content]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────┬──────────┬──────────┬──────────┬─────────────┐ │
│  │  All   │ YouTube  │  File    │  SEO     │  Published  │ │
│  │  (23)  │  (8)     │  (3)     │  (12)    │  (5)        │ │
│  └────────┴──────────┴──────────┴──────────┴─────────────┘ │
│                                                             │
│  [SEO Briefs 탭 선택 시]                                     │
│                                                             │
│  ┌─ Filters ─────────────────────────────────────────────┐ │
│  │ Tier: [All] [T1] [T2] [T3] [T4]                      │ │
│  │ Status: [All] [Pending] [In Progress] [Done]          │ │
│  │ Sort: [Gap Score ▼] [Tier] [Priority]                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Brief Card ──────────────────────────────────────────┐ │
│  │ T1  gap:95  ⚠ NOT RANKING                            │ │
│  │                                                       │ │
│  │ "toroidal rf technology"                              │ │
│  │ Understanding Toroidal RF Technology: Deep-Dive        │ │
│  │                                                       │ │
│  │ Type: blog │ Target: #1 │ Category: technology        │ │
│  │ Related: toroidal rf device, torr rf                  │ │
│  │                                                       │ │
│  │ [Generate Content]  [Skip]  [Edit Brief]              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Brief Card ──────────────────────────────────────────┐ │
│  │ T4  gap:95  ⚠ NOT RANKING                            │ │
│  │                                                       │ │
│  │ "what is toroidal rf technology"                       │ │
│  │ What Is Toroidal RF Technology? - Expert Answer        │ │
│  │                                                       │ │
│  │ Type: faq │ Target: #1 │ Category: aeo                │ │
│  │                                                       │ │
│  │ [Generate Content]  [Skip]  [Edit Brief]              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 "Generate Content" 클릭 시

```
┌─────────────────────────────────────────────────────────────┐
│  Generate SEO Content                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Target Keyword: toroidal rf technology                     │
│  Content Type: Blog Post                                    │
│  Recommended Title: Understanding Toroidal RF Technology    │
│                                                             │
│  ── Title (editable) ──                                     │
│  [Understanding Toroidal RF Technology: A Complete Guide   ]│
│                                                             │
│  ── Additional Keywords to Include ──                       │
│  ☑ toroidal rf device                                       │
│  ☑ torr rf                                                  │
│  ☑ sonoillumination technology                              │
│  ☐ rf skin tightening device for clinic                     │
│                                                             │
│  ── Content Instructions (optional) ──                      │
│  [Include clinical data, comparison with traditional RF    ]│
│  [Target audience: medical device distributors             ]│
│                                                             │
│  ── Options ──                                              │
│  ☑ Include Schema.org markup (FAQPage / Article)            │
│  ☑ Include FAQ section for AEO                              │
│  ☑ Generate AI featured image                               │
│  ☐ Include video embed (if available)                       │
│                                                             │
│  Word Count: [1500] (recommended: 1200-2000)                │
│  Tone: [Professional / Technical]                           │
│                                                             │
│  [Cancel]                          [Generate Draft]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 생성 후 → 기존 편집 플로우

```
Draft 생성 완료 → content-hub의 기존 워크플로우 합류:

  Draft → Review → Edit (마크다운 에디터) → Approve → Publish
                                                      │
                                              Keystatic JSON 생성
                                              GitHub commit
                                              SEO Workers에 매핑 등록
```

---

## 5. 필요한 코드 변경

### 5.1 britzmedi-seo Workers (변경사항)

#### CORS 수정 (필수)
```typescript
// src/index.ts
app.use('/api/*', cors({ origin: '*' }));
```

#### 새 API 엔드포인트 추가
```typescript
// src/routes/api.ts

// SEO Briefs 전용 (Content Hub가 호출)
api.get('/briefs', async (c) => {
  // gap_analysis에서 pending 상태 + keyword 정보 조인
  // gap_score 높은 순 정렬
  // related_keywords 포함
});

// 콘텐츠 발행 후 매핑 등록
api.post('/content-map', async (c) => {
  const { keyword_id, content_path, content_title, content_type, schema_type } = await c.req.json();
  // content_mapping 테이블에 저장
  // 현재 순위를 position_before에 기록
});

// 갭 분석 상태 업데이트
api.patch('/gaps/:id/status', async (c) => {
  // pending → in_progress → done
});
```

### 5.2 britzmedi-global (변경사항)

#### 5.2.1 새로운 파일 추가

```
src/
├── lib/
│   └── content-pipeline/
│       ├── seo-brief.ts        # SEO Workers API 클라이언트
│       ├── content-generator.ts # Claude API 콘텐츠 생성 (SEO 최적화)
│       ├── schema-generator.ts  # Schema.org 자동 생성
│       └── publisher.ts         # Keystatic JSON 생성 + GitHub commit
│
├── pages/
│   └── api/
│       └── admin/
│           └── content-hub/
│               ├── briefs.ts        # GET: SEO briefs 프록시
│               ├── generate.ts      # POST: 콘텐츠 생성 트리거
│               ├── publish.ts       # POST: 블로그 발행
│               └── content-map.ts   # POST: SEO 매핑 등록
│
├── components/
│   └── admin/
│       └── content-hub/
│           ├── ContentHubTabs.tsx    # 통합 탭 (All/YouTube/File/SEO/Published)
│           ├── SEOBriefsList.tsx     # SEO Briefs 목록
│           ├── SEOBriefCard.tsx      # 개별 Brief 카드
│           ├── GenerateModal.tsx     # 콘텐츠 생성 모달
│           ├── ContentEditor.tsx     # 마크다운 편집기 (기존 재활용)
│           ├── ContentPreview.tsx    # 미리보기
│           └── PublishButton.tsx     # 발행 버튼
```

#### 5.2.2 Claude API 프롬프트 (SEO 콘텐츠 생성용)

```typescript
// src/lib/content-pipeline/content-generator.ts

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

const SEO_CONTENT_PROMPT = `
You are a content strategist for BRITZMEDI, a Korean medical device company 
specializing in RF aesthetic devices. Write content optimized for Google search 
and AI search engines (AEO/GEO).

## Target Keyword
Primary: {keyword}
Secondary: {additional_keywords}
Content Type: {content_type}

## Requirements
1. Title must include the primary keyword naturally
2. Use H2/H3 headers that include secondary keywords
3. Write {word_count} words in professional, authoritative tone
4. Target audience: medical device distributors, clinic owners, aesthetic practitioners
5. Include specific data, clinical evidence, and comparisons where relevant
6. BRITZMEDI's TORR RF device should be mentioned naturally (not forced)

## SEO Structure
- Meta description (150-160 chars, includes primary keyword)
- Introduction with keyword in first 100 words
- 3-5 H2 sections with relevant subheadings
- Internal linking suggestions (to /products/torr-rf, /about, etc.)
- Call-to-action for distributors

## AEO Optimization
{if include_faq}
- Include 5 FAQ questions and concise answers
- Questions should be natural language queries people ask
- Answers should be definitive, 2-3 sentences each
{endif}

## Schema.org
{if include_schema}
- Suggest appropriate Schema type: Article, FAQPage, HowTo, or Product
- Provide structured data snippet
{endif}

## Output Format
Return JSON:
{
  "title": "...",
  "slug": "...",
  "meta_description": "...",
  "content": "... (full markdown) ...",
  "faq": [{ "question": "...", "answer": "..." }],
  "schema_type": "Article|FAQPage|HowTo",
  "internal_links": [{ "text": "...", "url": "..." }],
  "estimated_read_time": "X min",
  "primary_keyword": "...",
  "secondary_keywords": ["..."]
}
`;
```

#### 5.2.3 Keystatic Blog Schema 호환

기존 블로그 콘텐츠 구조에 맞춰 생성:

```typescript
// src/lib/content-pipeline/publisher.ts

interface BlogPost {
  // 기존 Keystatic blog 스키마와 동일
  title: string;
  slug: string;
  date: string;           // ISO format
  category: string;       // rf-technology, market-insights, clinical-evidence, etc.
  excerpt: string;        // meta_description
  content: string;        // markdown
  featured_image?: string;
  author: string;         // "BRITZMEDI Research Team"
  tags: string[];
  
  // SEO 확장 필드
  seo_keyword?: string;
  seo_secondary_keywords?: string[];
  schema_type?: string;
  faq?: Array<{ question: string; answer: string }>;
}

// 발행 프로세스:
// 1. BlogPost JSON 생성
// 2. src/content/blog/{slug}.json 에 저장
// 3. GitHub API로 commit + push
// 4. Cloudflare Pages 자동 재배포
// 5. SEO Workers에 content_mapping 등록
```

---

## 6. DB 스키마 변경

### 6.1 britzmedi-global D1 (content_hub 테이블 추가/수정)

```sql
-- 콘텐츠 통합 관리 테이블
CREATE TABLE IF NOT EXISTS content_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 소스 정보
  source_type TEXT NOT NULL CHECK(source_type IN ('youtube', 'file', 'seo_brief', 'manual')),
  source_id TEXT,              -- youtube_video_id 또는 seo_keyword_id
  source_url TEXT,             -- YouTube URL 또는 파일 URL
  
  -- 콘텐츠 기본 정보
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  content TEXT,                -- 마크다운 본문
  excerpt TEXT,                -- 발췌/메타 설명
  category TEXT,
  tags TEXT,                   -- JSON array
  featured_image TEXT,
  
  -- SEO 정보 (seo_brief 소스일 때)
  seo_keyword TEXT,
  seo_secondary_keywords TEXT, -- JSON array
  seo_gap_score INTEGER,
  seo_target_position INTEGER,
  schema_type TEXT,
  faq TEXT,                    -- JSON array of {question, answer}
  
  -- 워크플로우
  status TEXT DEFAULT 'draft' CHECK(status IN (
    'brief',        -- SEO brief만 있는 상태 (콘텐츠 미생성)
    'generating',   -- Claude가 생성 중
    'draft',        -- 초안 생성 완료
    'review',       -- 검토 중
    'approved',     -- 승인됨 (발행 대기)
    'published',    -- 발행 완료
    'archived'      -- 보관
  )),
  
  -- 메타
  author TEXT DEFAULT 'BRITZMEDI Research Team',
  word_count INTEGER,
  estimated_read_time TEXT,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 콘텐츠 리비전 (편집 히스토리)
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
CREATE INDEX IF NOT EXISTS idx_content_seo_keyword ON content_items(seo_keyword);
```

### 6.2 britzmedi-seo D1 (변경 없음, 기존 스키마 활용)

기존 테이블 그대로 사용:
- `gap_analysis` → briefs 데이터 제공
- `content_mapping` → 발행 후 매핑 저장
- `keyword_rankings` → 성과 추적

---

## 7. API 엔드포인트 정리

### 7.1 britzmedi-seo Workers

| Method | Path | 설명 | 호출자 |
|--------|------|------|--------|
| GET | /api/briefs | 콘텐츠 필요 키워드 목록 (gap 기반) | Content Hub |
| GET | /api/gaps | 전체 갭 분석 결과 | SEO Dashboard |
| GET | /api/keywords | 키워드 목록 | SEO Dashboard |
| POST | /api/content-map | 콘텐츠 발행 매핑 등록 | Content Hub |
| PATCH | /api/gaps/:id/status | 갭 상태 업데이트 | Content Hub |
| GET | /api/keywords/:id/history | 순위 히스토리 | Dashboard |

### 7.2 britzmedi-global API

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/admin/content-hub/items | 콘텐츠 목록 (필터: source_type, status) |
| POST | /api/admin/content-hub/items | 새 콘텐츠 생성 (수동) |
| GET | /api/admin/content-hub/items/[id] | 콘텐츠 상세 |
| PATCH | /api/admin/content-hub/items/[id] | 콘텐츠 수정 |
| POST | /api/admin/content-hub/items/[id]/transition | 상태 전환 |
| POST | /api/admin/content-hub/seo-briefs | SEO briefs 가져오기 (프록시) |
| POST | /api/admin/content-hub/generate | Claude로 콘텐츠 생성 |
| POST | /api/admin/content-hub/publish | Keystatic 발행 |

---

## 8. 구현 순서 (Claude Code 작업 플랜)

### Phase A: SEO Workers 보강 (30분)
1. CORS origin: '*' 수정
2. GET /api/briefs 엔드포인트 추가
3. POST /api/content-map 엔드포인트 추가
4. PATCH /api/gaps/:id/status 엔드포인트 추가
5. 재배포

### Phase B: Content Hub DB + API (1시간)
1. content_items 테이블 생성 (D1)
2. CRUD API 엔드포인트 구현
3. SEO briefs 프록시 API 구현
4. 상태 전환 로직 구현

### Phase C: Claude 콘텐츠 생성 엔진 (1시간)
1. content-generator.ts — SEO 최적화 프롬프트
2. schema-generator.ts — Schema.org 자동 생성
3. POST /api/admin/content-hub/generate 구현
4. 생성 결과 → content_items에 draft로 저장

### Phase D: Content Hub UI (1시간)
1. ContentHubTabs.tsx — 통합 탭 UI
2. SEOBriefsList.tsx — SEO Briefs 목록 (gap_score 순)
3. SEOBriefCard.tsx — Brief 카드 + "Generate Content" 버튼
4. GenerateModal.tsx — 콘텐츠 생성 옵션 모달
5. 기존 에디터/미리보기 컴포넌트 재활용

### Phase E: 발행 파이프라인 (1시간)
1. publisher.ts — Keystatic JSON 생성
2. GitHub API로 commit (기존 github.ts 재활용)
3. SEO Workers에 content_mapping 등록
4. PublishButton.tsx UI

### Phase F: 테스트 + 연동 확인 (30분)
1. SEO Workers → Content Hub 데이터 흐름 테스트
2. 콘텐츠 생성 → 발행 → 순위 추적 E2E 테스트
3. 기존 YouTube to Blog와 충돌 없는지 확인

---

## 9. 환경변수 (추가 필요)

### britzmedi-global
```
# 기존
ANTHROPIC_API_KEY=...     # Claude API (콘텐츠 생성)
GEMINI_API_KEY=...        # Gemini (이미지 분석)
GITHUB_TOKEN=...          # GitHub API (발행)

# 추가
SEO_API_URL=https://britzmedi-seo.mmakid.workers.dev/api
```

### britzmedi-seo Workers
```
# 기존 (변경 없음)
GSC_CLIENT_EMAIL=...
GSC_PRIVATE_KEY=...
GSC_SITE_URL=https://www.britzmedi.com/
```

---

## 10. 성공 기준

| 지표 | 목표 |
|------|------|
| SEO Brief → Draft 생성 | 버튼 클릭 후 60초 이내 |
| 생성된 콘텐츠 품질 | 1500자 이상, 키워드 자연 삽입, FAQ 포함 |
| 발행 프로세스 | Draft → Published 5분 이내 (수동 검토 포함) |
| SEO 매핑 | 발행 즉시 자동 등록 |
| 순위 추적 | 발행 1주 후 position_after 자동 업데이트 |

---

## Claude Code 실행 명령어

이 문서를 Claude Code에 전달할 때 아래처럼 입력:

```
이 설계서를 따라 구현해줘. Phase A부터 순서대로 진행.
현재 프로젝트: C:\Users\J\Projects\britzmedi-global (Astro 5 프로젝트)
SEO Workers: C:\Users\J\Projects\britzmedi-seo (이미 배포 완료)
```

*작성일: 2026-02-10 | v1.0*
