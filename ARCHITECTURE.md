# BRITZMEDI Architecture

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Astro 5.x | Hybrid SSR + static |
| UI | React 19 | Interactive admin components (`client:only="react"`) |
| Styling | Tailwind CSS 4.x | Light mode only |
| Hosting | Cloudflare Pages | + Workers for SSR |
| Database | Cloudflare D1 (SQLite) | `britzmedi-leads` |
| Cache/Sessions | Cloudflare KV | `SESSION` namespace |
| Object Storage | Cloudflare R2 | `BLOG_IMAGES` bucket |
| AI | Claude API (Sonnet 4) | Chatbot + content generation |
| AI (Secondary) | Gemini API | Translation, research, image gen |
| Email | Resend | Approval workflow, notifications |
| CMS | Keystatic (Git-based) | Local mode |
| Search | Pagefind | Client-side static search |

---

## File Structure

```
src/
├── pages/
│   ├── index.astro                   # Homepage (SSR, reads KV config)
│   ├── [lang]/                       # i18n pages (ja, zh, th, vi, es, fr, ru, ar)
│   │   ├── index.astro
│   │   ├── blog/[slug].astro
│   │   └── products/[id].astro
│   ├── blog/
│   │   ├── index.astro               # Blog listing
│   │   └── [slug].astro              # Blog post (static + dynamic JSON)
│   ├── admin/
│   │   ├── index.astro               # Dashboard
│   │   ├── login.astro               # Auth page
│   │   ├── leads.astro               # CRM pipeline
│   │   ├── analytics.astro           # GA4 + GSC dashboard
│   │   ├── content-hub/              # Content management
│   │   │   ├── index.astro
│   │   │   ├── edit/[id].astro
│   │   │   └── preview/[id].astro
│   │   ├── social/                   # SNS management
│   │   │   └── index.astro
│   │   └── settings/
│   │       ├── index.astro
│   │       └── site-editor.astro     # Homepage visual editor
│   └── api/                          # See API Endpoints below
├── components/
│   ├── admin/                        # Admin React components
│   │   ├── HomepageEditor.tsx
│   │   ├── HomepagePreview.tsx
│   │   ├── ImageCropModal.tsx
│   │   ├── ContentHubDashboard.tsx
│   │   ├── ContentEditor.tsx
│   │   ├── LeadsPipeline.tsx
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── SocialDashboard.tsx
│   │   ├── ContentPipeline.tsx
│   │   └── AEOMonitor.tsx
│   ├── blog/                         # Blog UI components
│   │   ├── BlogCard.astro
│   │   └── BlogHero.astro
│   ├── features/                     # Interactive features
│   │   ├── Chatbot.tsx
│   │   └── LeadForm.astro
│   ├── layout/                       # Header, Footer
│   └── ui/                           # Reusable UI
├── layouts/
│   ├── BaseLayout.astro              # Public pages
│   └── AdminLayout.astro             # Admin pages (sidebar nav)
├── lib/
│   ├── activity-log.ts               # Activity logging utility
│   ├── lead-score.ts                 # Lead scoring algorithm (0-100, A/B/C/D)
│   ├── slack.ts                      # Slack webhook notifications
│   ├── html-to-markdown.ts           # Content conversion
│   ├── youtube-to-blog/              # Blog pipeline utilities
│   │   ├── github.ts                 # commitFileToGitHub, deleteFileFromGitHub
│   │   ├── queue.ts
│   │   └── name-romanization.ts
│   └── social/                       # SNS posting utilities
│       ├── auto-post.ts
│       └── channels/                 # Per-platform posters
├── i18n/
│   ├── config.ts                     # Languages: en, ja, zh, th, vi, es, fr, ru, ar
│   ├── translations/                 # UI string translations per language
│   └── product-translations.ts       # Product content translations
├── data/
│   ├── homepage.json                 # Homepage config (KV-backed)
│   ├── homepage.types.ts
│   ├── chatbot-knowledge.md          # Chatbot knowledge base
│   └── countries.ts
├── content/
│   ├── products/                     # Static product data
│   └── blog/                         # Published blog JSON files
├── styles/
│   └── global.css                    # Global styles + blog article CSS
└── middleware.ts                      # Admin auth (KV session validation)

public/
├── images/                           # Static images (products, hero, blog)
├── videos/                           # Hero videos
├── _redirects                        # Cloudflare Pages redirects
└── robots.txt
```

---

## API Endpoints

### Public APIs

| Path | Method | Description |
|------|--------|-------------|
| `/api/chat` | POST | AI 챗봇 (Claude Sonnet 4) |
| `/api/leads` | POST | 리드 폼 제출 (D1 저장 + Slack 알림) |
| `/api/leads/[id]` | GET, PUT | 리드 조회/수정 |
| `/api/leads/stats` | GET | 리드 통계 |
| `/api/newsletter` | POST | 뉴스레터 구독 |
| `/api/translate` | POST | DeepL 번역 |
| `/api/resource-download` | POST | 리소스 다운로드 추적 |
| `/api/resources/track` | POST | 리소스 추적 |
| `/api/resources/stats` | GET | 리소스 통계 |
| `/api/subscribers/subscribe` | POST | 구독 신청 |
| `/api/subscribers/confirm` | GET | 구독 확인 (토큰) |
| `/api/subscribers/unsubscribe` | GET | 구독 해지 (토큰) |
| `/api/blog/approve` | GET | 블로그 승인 (토큰) |
| `/api/blog-manifest.json` | GET | 블로그 매니페스트 |

### Blog Pipeline APIs (Admin)

| Path | Method | Description |
|------|--------|-------------|
| `/api/blog/queue` | GET, POST | 작업 큐 조회/생성 |
| `/api/blog/queue/[id]` | GET, DELETE | 작업 상세/삭제 |
| `/api/blog/queue/[id]/step/extract` | POST | 트랜스크립트 추출 |
| `/api/blog/queue/[id]/step/extract-file` | POST | 파일 텍스트 추출 |
| `/api/blog/queue/[id]/step/translate` | POST | 번역 |
| `/api/blog/queue/[id]/step/generate` | POST | 블로그 생성 (Claude) |
| `/api/blog/queue/[id]/step/research` | POST | 의사/전문가 조사 |
| `/api/blog/queue/[id]/step/image` | POST | 이미지 생성 |
| `/api/blog/queue/[id]/step/analyze-images` | POST | 이미지 분석 |
| `/api/blog/queue/[id]/step/finalize` | POST | 최종 발행 |
| `/api/blog/posts` | GET | 블로그 목록 |
| `/api/blog/posts/[id]` | GET, PUT | 블로그 조회/수정 |
| `/api/blog/posts/[id]/publish` | POST | 발행 (GitHub commit) |
| `/api/blog/posts/[id]/unpublish` | POST | 발행 취소 |
| `/api/blog/posts/[id]/approve` | POST | 승인 |
| `/api/blog/posts/[id]/send-approval` | POST | 승인 메일 발송 |
| `/api/blog/posts/[id]/upload-image` | POST | 이미지 업로드 (R2) |
| `/api/blog/posts/[id]/regenerate-image` | POST | 이미지 재생성 |
| `/api/blog/posts/[id]/research-doctor` | POST | 의사 프로필 조사 |
| `/api/blog/upload` | POST | 파일 업로드 |
| `/api/blog/images/[...path]` | GET | R2 이미지 프록시 |
| `/api/youtube/channel` | GET | YouTube 채널 조회 |

### Admin Core APIs

| Path | Method | Description |
|------|--------|-------------|
| `/api/admin/login` | POST | 로그인 (KV 세션 생성) |
| `/api/admin/logout` | POST | 로그아웃 |
| `/api/admin/dashboard` | GET | 대시보드 KPI + 최근 활동 |
| `/api/admin/health-check` | GET, POST | 시스템 헬스 체크 |
| `/api/admin/activity` | GET | 활동 로그 |
| `/api/admin/analytics/traffic` | GET | GA4 트래픽 데이터 |

### Content Hub APIs

| Path | Method | Description |
|------|--------|-------------|
| `/api/admin/content-hub/items` | GET, POST | 콘텐츠 목록/생성 |
| `/api/admin/content-hub/items/[id]` | GET, PUT, DELETE | 콘텐츠 CRUD |
| `/api/admin/content-hub/items/[id]/transition` | POST | 상태 전환 |
| `/api/admin/content-hub/generate` | POST | AI 콘텐츠 생성 |
| `/api/admin/content-hub/publish` | POST | GitHub 발행 |
| `/api/admin/content-hub/quality-check` | POST | 품질 체크 |
| `/api/admin/content-hub/news` | GET | 뉴스 피드 |
| `/api/admin/content-hub/sns-preview` | POST | SNS 미리보기 |
| `/api/admin/content-hub/seo-briefs` | GET | SEO 브리프 |
| `/api/admin/content-hub/seo/progress` | GET | SEO 진행 상황 (프록시) |
| `/api/admin/content-hub/seo/discovered` | GET | 발견된 키워드 (프록시) |
| `/api/admin/content-hub/seo/history/[id]` | GET | 키워드 히스토리 (프록시) |
| `/api/admin/content-hub/transition` | POST | 레거시 상태 전환 |

### Social Media APIs

| Path | Method | Description |
|------|--------|-------------|
| `/api/admin/social/accounts` | GET, POST | SNS 계정 목록/추가 |
| `/api/admin/social/accounts/[id]` | PUT, DELETE | 계정 수정/삭제 |
| `/api/admin/social/posts` | GET | SNS 포스트 이력 |
| `/api/admin/social/[id]` | GET | 포스트 상세 |
| `/api/admin/social/[id]/repost` | POST | 재게시 |
| `/api/admin/social/post` | POST | 새 포스트 (멀티채널) |
| `/api/admin/social/status` | GET | 계정 연결 상태 |
| `/api/admin/social/refresh` | POST | 토큰 갱신 |
| `/api/admin/social/linkedin/authorize` | GET | LinkedIn OAuth 시작 |
| `/api/admin/social/linkedin/callback` | GET | LinkedIn OAuth 콜백 |
| `/api/admin/social/linkedin/disconnect` | POST | LinkedIn 연결 해제 |

### Content Pipeline APIs

| Path | Method | Description |
|------|--------|-------------|
| `/api/admin/content-pipeline/queue` | GET, POST | 파이프라인 큐 조회/키워드 추가 |
| `/api/admin/content-pipeline/queue/[id]` | DELETE | 큐 아이템 삭제 |
| `/api/admin/content-pipeline/process/[id]` | POST | 개별 키워드 처리 (연구→생성→분석→품질) |
| `/api/admin/content-pipeline/process-next` | POST | 다음 대기 키워드 자동 처리 |
| `/api/admin/content-pipeline/batch` | POST | 키워드 배치 추가 |
| `/api/admin/content-pipeline/stats` | GET | 파이프라인 통계 |
| `/api/admin/content-pipeline/logs` | GET | 파이프라인 로그 |
| `/api/admin/aeo-check` | GET, POST | AEO 모니터 조회/실행 |

### Homepage Editor APIs

| Path | Method | Description |
|------|--------|-------------|
| `/api/admin/homepage` | GET, PUT | 홈페이지 config (KV) |
| `/api/admin/homepage/upload` | POST | 이미지 업로드 (R2 + GitHub) |

### Leads CRM APIs

| Path | Method | Description |
|------|--------|-------------|
| `/api/admin/leads/research` | POST | AI 리드 조사 |
| `/api/admin/leads/[id]/activity` | GET, POST | 리드 활동 이력 |
| `/api/admin/blog/posts` | GET | 블로그 포스트 (Admin 뷰) |
| `/api/admin/blog/[id]` | GET, PUT | 블로그 포스트 (Admin) |
| `/api/admin/blog/file-posts/[slug]` | DELETE | 파일 기반 포스트 삭제 |
| `/api/subscribers/list` | GET | 구독자 목록 |
| `/api/subscribers/export` | GET | 구독자 CSV 내보내기 |
| `/api/subscribers/notify` | POST | 구독자 알림 발송 |

---

## Database Schema (D1)

Database: `britzmedi-leads` (Cloudflare D1 / SQLite)

### leads
리드(영업 문의) 관리. 7개 필수 필드 + 스코어링 + CRM 파이프라인.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| company_name | TEXT NOT NULL | |
| company_website | TEXT | |
| contact_name | TEXT NOT NULL | |
| job_title | TEXT NOT NULL | |
| email | TEXT NOT NULL UNIQUE | |
| country | TEXT NOT NULL | ISO code |
| interested_products | TEXT NOT NULL | JSON array |
| message | TEXT | |
| lead_score | INTEGER | 0-100 |
| lead_grade | TEXT | A/B/C/D |
| status | TEXT | new/contacted/qualified/proposal/won/lost |
| priority | TEXT | normal/high/urgent (migration 0013) |
| assigned_to | TEXT | |
| notes | TEXT | |
| ai_research | TEXT | JSON |
| source | TEXT | website/resource_download/newsletter |
| utm_source/medium/campaign | TEXT | |
| last_contacted_at | DATETIME | (migration 0013) |
| next_action | TEXT | (migration 0013) |
| lost_reason | TEXT | (migration 0013) |
| created_at / updated_at | TEXT | |

### lead_activities (migration 0013)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| lead_id | INTEGER FK | → leads.id |
| type | TEXT NOT NULL | note/email/call/meeting/status_change |
| title | TEXT NOT NULL | |
| description | TEXT | |
| created_by | TEXT | |
| created_at | DATETIME | |

### content_items (migration 0012)
Content Hub 콘텐츠 아이템.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| source_type | TEXT | youtube/file/seo_brief/manual |
| source_id / source_url | TEXT | |
| title | TEXT NOT NULL | |
| slug | TEXT UNIQUE | |
| content | TEXT | Markdown/HTML |
| excerpt | TEXT | |
| category | TEXT | |
| tags | TEXT | JSON array |
| featured_image | TEXT | |
| seo_keyword | TEXT | Primary keyword |
| seo_secondary_keywords | TEXT | JSON array |
| faq | TEXT | JSON array [{question, answer}] |
| status | TEXT | brief/generating/draft/review/approved/published/archived |
| author | TEXT | |
| word_count | INTEGER | |
| published_at | DATETIME | |
| created_at / updated_at | DATETIME | |

### content_revisions (migration 0012)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| content_id | INTEGER FK | → content_items.id |
| title / content | TEXT | |
| editor / note | TEXT | |
| created_at | DATETIME | |

### blog_posts
YouTube/File → Blog 생성 결과물.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID |
| title / slug | TEXT | |
| content | TEXT | HTML body |
| status | TEXT | draft/review/approved/scheduled/published/unpublished/archived |
| doctor_name/title/image | TEXT | Expert attribution |
| featured_image | TEXT | R2 key or URL |
| category / tags / keywords | TEXT | JSON |
| published_at | TEXT | |
| github_commit_sha | TEXT | |

### blog_jobs
YouTube/File → Blog 작업 큐.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID |
| youtube_url / youtube_id | TEXT | |
| status | TEXT | pending → extracting → ... → completed/failed |
| transcript_text | TEXT | |
| translated_text | TEXT | |
| blog_post_id | TEXT | |

### Other Tables
| Table | Description |
|-------|-------------|
| `subscribers` | 이메일 구독자 (pending/active/unsubscribed) |
| `notification_log` | 구독자 알림 발송 이력 |
| `social_accounts` | SNS 계정 (twitter/linkedin/instagram) |
| `social_posts` | SNS 포스팅 이력 |
| `resource_downloads` | 리소스 다운로드 추적 |
| `youtube_channels` | YouTube 채널 관리 |
| `youtube_videos` | YouTube 비디오 처리 추적 |
| `name_mappings` | 한국어→로마자 이름 매핑 |
| `activity_log` | 시스템 활동 로그 (migration 0011) |
| `content_queue` | 콘텐츠 파이프라인 큐 (migration 0015) |
| `pipeline_logs` | 파이프라인 처리 로그 (migration 0015) |
| `aeo_checks` | AEO/GEO AI 검색 노출 확인 이력 |

---

## Cloudflare Bindings

```jsonc
// wrangler.jsonc
{
  "d1_databases": [{ "binding": "DB", "database_name": "britzmedi-leads" }],
  "kv_namespaces": [{ "binding": "SESSION", "id": "27c7cd..." }],
  "r2_buckets": [{ "binding": "BLOG_IMAGES", "bucket_name": "britzmedi-blog-images" }]
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ADMIN_USERNAME` | Admin 로그인 username |
| `ADMIN_PASSWORD` | Admin 로그인 password |
| `ADMIN_SESSION_SECRET` | 세션 fallback secret |
| `ADMIN_EMAIL` | 관리자 이메일 (승인 메일 수신) |
| `ANTHROPIC_API_KEY` | Claude API (챗봇 + 콘텐츠 생성) |
| `GEMINI_API_KEY` | Gemini API (번역, 리서치, 이미지) |
| `GITHUB_TOKEN` | GitHub API (블로그 발행, 이미지 업로드) |
| `GITHUB_REPO` | GitHub repo (e.g., `user/repo`) |
| `RESEND_API_KEY` | Resend 이메일 API |
| `SLACK_WEBHOOK_URL` | Slack 알림 webhook |
| `DEEPL_API_KEY` | DeepL 번역 (비활성) |
| `TWITTER_API_KEY` | X/Twitter OAuth 1.0a |
| `TWITTER_API_SECRET` | X/Twitter secret |
| `TWITTER_ACCESS_TOKEN` | X/Twitter access token |
| `TWITTER_ACCESS_SECRET` | X/Twitter access secret |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth 2.0 |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn secret |
| `LINKEDIN_PERSON_URN` | LinkedIn person URN |
| `INSTAGRAM_USER_ID` | Instagram user ID |
| `INSTAGRAM_APP_ID` | Instagram/Meta app ID |
| `INSTAGRAM_APP_SECRET` | Instagram/Meta app secret |
| `INSTAGRAM_ACCESS_TOKEN` | Instagram long-lived token |
| `FACEBOOK_PAGE_TOKEN` | Facebook page token (placeholder) |
| `FACEBOOK_PAGE_ID` | Facebook page ID (placeholder) |
| `GA4_PROPERTY_ID` | Google Analytics 4 속성 ID |
| `GA4_CREDENTIALS` | GA4 서비스 계정 JSON |
| `LINKEDIN_PERSON_URN` | LinkedIn person URN (포스팅 author) |

---

## External Services

| Service | Purpose |
|---------|---------|
| [SEO Worker](https://britzmedi-seo.mmakid.workers.dev) | 별도 CF Worker, 경쟁 키워드 100개 추적, GSC 데이터 수집 |
| UptimeRobot | 6개 URL 모니터링 |
| Google Search Console | 검색 성과 데이터 |
| Google Analytics 4 | 트래픽 분석 |

---

## Deployment

```bash
# Build
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=britzmedi-homepage-only-en

# D1 migration (manual)
npx wrangler d1 execute britzmedi-leads --remote --file=migrations/XXXX.sql
```

## Auth Flow

1. POST `/api/admin/login` → validates credentials → creates KV session (`session:{token}`, 24h TTL)
2. Sets `admin_session` cookie
3. `middleware.ts` intercepts `/admin/*` and `/api/admin/*` → validates KV session
4. Fallback: `ADMIN_SESSION_SECRET` env var for static token auth
