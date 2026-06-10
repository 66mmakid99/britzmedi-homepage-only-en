# BRITZMEDI Admin 시스템 통합 재설계 v2.0
# "더 이상 추가 기능 없음. 지금 있는 것을 견고하게."

---

## 현재 문제 진단

### 구조적 문제
1. **Content Hub vs Blog Manager 역할 중복** — 콘텐츠 관리가 두 곳에 분산, 어디가 메인인지 불명확
2. **통제 권한 부재** — 현황은 보이는데 게시중지/삭제/편집 등 실제 액션이 없음
3. **기능 미완성** — 버튼은 있는데 동작 안 하는 것들 (Open Editor, Submit for Review, Delete 등)
4. **카테고리 혼란** — Homepage Editor가 CONTENT에 있으나 실제론 사이트 설정 도구
5. **데이터 분산** — SEO 순위, GA, GSC 데이터를 보려면 외부 창을 여러 개 열어야 함

### 기능별 문제
| 기능 | 현재 상태 | 문제 |
|------|----------|------|
| Content Hub | UI 있음, 칸반 있음 | 삭제/편집/상태전환 안 됨 |
| Blog Manager | 목록만 표시 | 게시중지/삭제/편집 불가 |
| YouTube to Blog | 작동함 | Content Hub와 분리되어 있음 |
| Leads | 목록 있음 | 대응 기록/단계 관리/액션 없음 |
| Subscribers | 페이지 있음 | 미구현 |
| Social Media | UI 있음 | 채널 연결 자꾸 끊김 |
| Dashboard | 데이터 표시 | 스타일 깨짐, 실질적 인사이트 부족 |
| Homepage Editor | 작동함 | CONTENT 카테고리에 잘못 배치 |

---

## 새로운 Admin 구조

### 사이드바 네비게이션

```
┌─────────────────────────────┐
│  B  BRITZMEDI  Admin        │
├─────────────────────────────┤
│                             │
│  🏠 Dashboard               │ ← 전체 요약 (KPI 중심)
│                             │
│  ── CONTENT ──              │
│  📋 Content Hub             │ ← 모든 콘텐츠 통합 관리 (메인)
│                             │
│  ── MARKETING ──            │
│  📊 Analytics               │ ← GA + GSC + SEO 통합 뷰
│  📱 Social Media            │ ← SNS 채널 관리 + 발행
│                             │
│  ── SALES ──                │
│  🎯 Leads                   │ ← CRM 파이프라인
│                             │
│  ── SETTINGS ──             │
│  🎨 Site Editor             │ ← Homepage/CSS 설정 (구 Homepage Editor)
│  ⚙️ Keystatic CMS           │ ← 외부 링크
│  🔧 System                  │ ← Health Check + Activity Log 통합
│                             │
│  ← Back to Site             │
│  ⊘ Logout                   │
└─────────────────────────────┘
```

### 변경 요약

| 기존 | 변경 | 이유 |
|------|------|------|
| Content Hub | **Content Hub (통합)** | 블로그+YouTube+SEO 모두 여기서 |
| Blog Posts (Blog Manager) | **삭제 → Content Hub에 흡수** | 역할 중복 제거 |
| Homepage Editor | **SETTINGS > Site Editor** | 콘텐츠가 아니라 사이트 설정 |
| YouTube to Blog | **삭제 → Content Hub에 흡수** | 소스 중 하나일 뿐 |
| Subscribers | **삭제** (또는 Leads에 통합) | 미구현, 리드와 성격 유사 |
| Health Check + Activity Log | **SETTINGS > System** | 하나로 통합 |
| (없음) | **MARKETING > Analytics** | GA+GSC+SEO 통합 뷰 신설 |

---

## 1. Dashboard — 실질적 KPI 중심

### 현재 문제
- 스타일 깨짐 (텍스트만 나열)
- 숫자만 있고 인사이트 없음

### 새로운 Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                                    Feb 10, 2026      │
│                                                                 │
│  ┌─ Content ──────┬─ Traffic ──────┬─ Leads ───────┬─ SEO ────┐│
│  │ 📝 9 posts     │ 👁 2,340      │ 🎯 5 total    │ 📈 12    ││
│  │ 2 drafts       │ visitors/wk   │ 2 hot (A)     │ keywords ││
│  │ 7 published    │ ▲12% vs last  │ +1 this week  │ ranking  ││
│  └────────────────┴───────────────┴───────────────┴──────────┘│
│                                                                 │
│  ── Quick Actions ──                                            │
│  [+ New Content]  [View Leads]  [Check Analytics]               │
│                                                                 │
│  ── Recent Activity ──                                          │
│  • "RF Skin Tightening Guide" moved to Draft — 10 min ago      │
│  • New lead from contact form (MedTech Corp) — 2 hours ago     │
│  • Weekly SEO collection completed — Today 09:00                │
│                                                                 │
│  ── Alerts ──                                                   │
│  ⚠ Social Media: Instagram connection needs refresh             │
│  ⚠ 2 leads pending response for >48 hours                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 구현 포인트
- 4개 KPI 카드 (Content, Traffic, Leads, SEO) — 각각 해당 API에서 데이터 fetch
- 카드 클릭 시 해당 섹션으로 이동
- Recent Activity: content_items + leads 테이블의 최근 변경
- Alerts: 시스템 이슈 자동 감지 (SNS 연결 끊김, 미응답 리드 등)
- API 연결 실패 시 해당 카드만 "unavailable" 표시 (전체 크래시 방지)

---

## 2. Content Hub — 모든 콘텐츠의 단일 관리 센터

### 역할
- Blog Manager 기능 흡수 (Published 글 관리, 게시중지, 삭제)
- YouTube to Blog 기능 흡수 (소스 탭으로)
- SEO Brief 기반 콘텐츠 생성
- 콘텐츠 편집기 (마크다운)
- 발행/게시중지/삭제 통제

### 탭 구조

```
┌─────────┬─────────────┬────────────┬──────────┬─────────┐
│Pipeline │ All Content │ SEO Briefs │ Progress │ Quality │
└─────────┴─────────────┴────────────┴──────────┴─────────┘
```

### 2.1 Pipeline 탭 (칸반)

```
Brief(0) → Generating(0) → Draft(2) → Review(0) → Approved(0) → Published(7)
                             │                                      │
                             ├─ [Edit] [Preview]                    ├─ [Unpublish]
                             ├─ [Submit for Review]                 ├─ [Edit]  
                             ├─ [Delete]                            ├─ [Delete]
                             │                                      ├─ [View Post ↗]
                             │                                      └─ SEO 성과 표시
```

**핵심: 모든 카드에 액션 버튼 제공**

| 상태 | 가능한 액션 |
|------|------------|
| Brief | Generate Content, Delete |
| Generating | (자동 진행, 취소만 가능) |
| Draft | Edit, Preview, Submit for Review, Delete |
| Review | Approve, Reject (→Draft), Delete |
| Approved | Publish, Edit, Delete |
| Published | Unpublish (→Draft), Edit, View Post, Delete |

### 2.2 All Content 탭 (테이블 뷰)

기존 Blog Manager의 기능을 여기로:

```
┌─────────────────────────────────────────────────────────────────────┐
│ All Content                                        7 published      │
│                                                                     │
│ [All 9] [Drafts 2] [Published 7]  │ Source: [All][YouTube][SEO]    │
│                                                                     │
│ Search: [________________________]                                  │
│                                                                     │
│ ☐ │ Title                              │Status   │Source│Date      │Actions│
│───┼────────────────────────────────────┼─────────┼─────┼──────────┼───────│
│ ☐ │ RF Skin Tightening Complete Guide  │🔵Draft  │ SEO │Feb 10    │⋮     │
│ ☐ │ RF Skin Tightening Complete Guide  │🔵Draft  │ SEO │Feb 10    │⋮     │
│ ☐ │ TORR RF: Understanding FDA 510(k) │🟢Pub    │File │Feb 8     │⋮     │
│ ☐ │ Microneedle RF vs Monopolar RF... │🟢Pub    │File │Feb 8     │⋮     │
│ ☐ │ What Is Multi-Wave RF Technology? │🟢Pub    │File │Feb 8     │⋮     │
│ ☐ │ RF Device Buyer Guide: 7 Criteria │🟢Pub    │File │Feb 8     │⋮     │
│ ☐ │ Top 5 RF Technologies 2026        │🟢Pub    │File │Feb 8     │⋮     │
│                                                                     │
│ Selected: 0  │ Bulk: [Delete] [Unpublish] [Export]                  │
│                                                                     │
│ ⋮ 메뉴 (각 행):                                                     │
│   Edit │ Preview │ View Post ↗ │ Unpublish │ Duplicate │ Delete    │
└─────────────────────────────────────────────────────────────────────┘
```

**핵심 기능:**
- **체크박스 선택 → 벌크 액션** (여러 개 삭제/게시중지)
- **⋮ 메뉴**: Edit, Preview, View Post, Unpublish, Duplicate, Delete
- **Published 글 관리**: Unpublish 하면 Draft로 돌아감
- **Source 필터**: 어디서 만든 글인지 (YouTube, File, SEO, Manual)
- **검색**: 제목/키워드/카테고리

### 2.3 SEO Briefs 탭

현재와 동일하되, 순위 데이터 통합:
- 각 Brief 카드에 현재 순위/노출/클릭 표시
- Generate Content → 모달 자동 채움
- 생성된 콘텐츠와 연결 표시 (이미 만들었으면 "Content exists" 뱃지)

### 2.4 Progress 탭

CLAUDE-SEO-COMPETITIVE-KEYWORDS.md의 설계 그대로:
- 주간 순위 변화 추적
- 카테고리별 진행 현황
- 마일스톤 알림

### 2.5 Quality 탭

기존 quality-checker 활용:
- SEO 점수 체크
- 읽기 시간, 키워드 밀도
- 내부 링크 현황

### 2.6 콘텐츠 에디터 (Edit 클릭 시)

```
/admin/content-hub/edit/[id]

┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Content Hub              [Save Draft] [Publish]      │
│                                                                 │
│  ┌─ Editor (70%) ──────────────────┬─ Preview (30%) ──────────┐│
│  │                                 │                          ││
│  │ Title:                          │  (실시간 미리보기)        ││
│  │ [RF Skin Tightening: Complete  ]│                          ││
│  │                                 │  RF Skin Tightening:     ││
│  │ Slug: rf-skin-tightening-guide  │  Complete Guide          ││
│  │ Category: [aesthetic-technology]│                          ││
│  │ Tags: [RF, skin, tightening]    │  RF skin tightening      ││
│  │                                 │  harnesses radio-        ││
│  │ ── Content (Markdown) ──        │  frequency energy...     ││
│  │ │ ## Introduction               │                          ││
│  │ │                               │                          ││
│  │ │ RF skin tightening harnesses  │                          ││
│  │ │ radiofrequency energy to...   │                          ││
│  │ │                               │                          ││
│  │ │ ## How RF Technology Works    │                          ││
│  │ │ ...                           │                          ││
│  │                                 │                          ││
│  │ ── SEO Info ──                  │                          ││
│  │ Keyword: rf skin tightening     │                          ││
│  │ Meta: [150 chars description]   │                          ││
│  │ FAQ: 5 items [Edit FAQs]        │                          ││
│  │                                 │                          ││
│  └─────────────────────────────────┴──────────────────────────┘│
│                                                                 │
│  [Save Draft] [Submit for Review] [Delete]     Status: Draft    │
└─────────────────────────────────────────────────────────────────┘
```

**구현 요구사항:**
- 마크다운 텍스트 에디터 (textarea + 실시간 미리보기)
- 메타 정보 편집 (slug, category, tags, excerpt)
- SEO 정보 편집 (keyword, meta description, FAQ)
- 저장 = content_items UPDATE (DB)
- 발행 = Keystatic JSON 생성 → GitHub commit
- 라이브러리: 간단한 markdown preview (marked 또는 showdown)
- 복잡한 WYSIWYG 에디터 불필요 — textarea + preview로 충분

---

## 3. Analytics — GA + GSC + SEO 통합 뷰

### 역할
마케터가 **하나의 화면에서** 트래픽, 검색 성과, SEO 진행 상황을 모두 확인

### 3.1 Google Analytics 연동 방식

**방법 A: iframe embed (가장 간단)**
```
GA4 → 보고서 → 공유 → 내장 링크 복사 → iframe으로 표시
```
장점: 구현 5분, GA 기능 그대로
단점: 로그인 필요, 커스터마이징 불가

**방법 B: GA4 Data API (추천)**
```
Google Analytics Data API → Cloudflare Workers → 프론트엔드
- 서비스 계정으로 인증 (GSC와 같은 방식)
- 필요한 데이터만 가져와서 커스텀 대시보드
```
장점: 완전 커스텀, 로그인 불필요
단점: API 개발 필요 (이미 GSC 연동 패턴 있으므로 재활용 가능)

**방법 C: Looker Studio embed (중간)**
```
Looker Studio에서 GA4 연결 → 대시보드 만들기 → embed URL → iframe
```
장점: 커스텀 가능 + 별도 개발 불필요
단점: Looker Studio 설정 필요

**추천: 방법 B (GA4 Data API)**
GSC 연동과 같은 패턴이라 구현 가능. 서비스 계정에 GA4 속성 권한 추가하면 됨.

### 3.2 Analytics 페이지 구조

```
/admin/analytics

┌─────────────────────────────────────────────────────────────────┐
│  Analytics                              Period: [Last 7 days ▼] │
│                                                                 │
│  ┌──────────┬──────────────┬────────────┐                      │
│  │ Traffic  │ Search (GSC) │ SEO Growth │  ← 서브 탭           │
│  └──────────┴──────────────┴────────────┘                      │
│                                                                 │
│  ═══ Traffic 탭 (GA4 Data API) ═══                              │
│                                                                 │
│  ┌─ KPI Cards ───────────────────────────────────────────────┐ │
│  │ Users: 1,234  │ Sessions: 2,456  │ Pageviews: 5,678      │ │
│  │ ▲12%          │ ▲8%              │ ▲15%                   │ │
│  │ Bounce: 45%   │ Avg Duration: 2m │ Pages/Session: 2.3    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Traffic Chart (7일) ──────────────────────────────────────┐│
│  │  📈 일별 방문자 + 페이지뷰 라인 차트                        ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─ Top Pages ─────────────────────────────────┐               │
│  │ /blog/rf-device-buyer-guide    456 views    │               │
│  │ /products/torr-rf              312 views    │               │
│  │ /                              289 views    │               │
│  │ /blog/multi-wave-rf-guide      234 views    │               │
│  └─────────────────────────────────────────────┘               │
│                                                                 │
│  ┌─ Traffic Sources ───────────────────────────┐               │
│  │ Organic Search: 45%  █████████              │               │
│  │ Direct: 30%          ██████                 │               │
│  │ Social: 15%          ███                    │               │
│  │ Referral: 10%        ██                     │               │
│  └─────────────────────────────────────────────┘               │
│                                                                 │
│  ═══ Search (GSC) 탭 ═══                                       │
│                                                                 │
│  ┌─ Search Performance ──────────────────────────────────────┐ │
│  │ Total Clicks: 234   │ Total Impressions: 12,456           │ │
│  │ Avg CTR: 1.9%       │ Avg Position: 45.2                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Top Search Queries ────────────────────────────────────────┐│
│  │ Query                        Position  Imp    Clicks  CTR  ││
│  │ rf skin tightening           #87       234    3       1.3% ││
│  │ monopolar rf treatment       #34       189    8       4.2% ││
│  │ korean aesthetic device      #23       156    12      7.7% ││
│  │ ...                                                        ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ═══ SEO Growth 탭 ═══                                         │
│  (= Content Hub의 Progress 탭과 동일 데이터, 마케터 뷰)        │
│                                                                 │
│  키워드별 순위 변화, 마일스톤, 카테고리별 진행 현황              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 GA4 API 연동 구현

```
1. Google Cloud Console에서 Analytics Data API 활성화
2. 기존 서비스 계정(britzmedi-seo-monitor)에 GA4 속성 권한 추가
3. SEO Workers에 GA4 데이터 수집 엔드포인트 추가
   (또는 별도 Workers — 선택)
4. britzmedi-global에서 프록시로 호출

필요한 GA4 메트릭:
- activeUsers, sessions, screenPageViews
- bounceRate, averageSessionDuration, screenPageViewsPerSession
- 일별 추이 (dateRange: last7days, last30days)
- 페이지별 조회수 (dimension: pagePath)
- 유입 소스 (dimension: sessionDefaultChannelGroup)
```

---

## 4. Leads — CRM 파이프라인

### 현재 문제
- 리드 목록만 보임
- 대응 기록 없음
- 단계 관리 없음
- 취할 수 있는 액션 없음

### 새로운 Leads 시스템

```
/admin/leads

┌─────────────────────────────────────────────────────────────────┐
│  Leads                                    5 total │ +1 this week│
│                                                                 │
│  ┌──────────┬──────────┐                                       │
│  │ Pipeline │ All Leads│  ← 두 가지 뷰                         │
│  └──────────┴──────────┘                                       │
│                                                                 │
│  ═══ Pipeline 뷰 (칸반) ═══                                    │
│                                                                 │
│  New(1)    │ Contacted(2)  │ Qualified(1)  │ Proposal(1) │ Won │
│  ──────────┼───────────────┼───────────────┼─────────────┼─────│
│  MedTech   │ Dubai Clinic  │ Bangkok Dist  │ Vietnam     │     │
│  Corp 🔴   │ 📧 replied    │ 📞 call done  │ Medical 📄  │     │
│  2h ago    │ 1d ago        │ 3d ago        │ sent quote  │     │
│            │               │               │             │     │
│            │ Singapore     │               │             │     │
│            │ Aesthetics    │               │             │     │
│            │ 📧 2 emails   │               │             │     │
│                                                                 │
│  🔴 = 48시간 이상 미대응 경고                                    │
│                                                                 │
│  ═══ Lead 상세 (클릭 시) ═══                                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ MedTech Corp                              Stage: New 🔴  │  │
│  │                                                          │  │
│  │ Contact: John Smith, Purchasing Director                 │  │
│  │ Email: john@medtech.com                                  │  │
│  │ Country: UAE │ Product Interest: TORR RF                 │  │
│  │ Source: Contact Form │ Submitted: Feb 10, 2026           │  │
│  │ Website: medtech.com                                     │  │
│  │                                                          │  │
│  │ ── Actions ──                                            │  │
│  │ [📧 Send Email] [📞 Log Call] [📝 Add Note]             │  │
│  │ [→ Move to Contacted] [→ Move to Qualified]              │  │
│  │ [❌ Mark as Lost]                                        │  │
│  │                                                          │  │
│  │ ── Activity Timeline ──                                  │  │
│  │ Feb 10, 10:00 — Lead submitted via contact form          │  │
│  │ Feb 10, 12:00 — Auto-reply email sent ✓                  │  │
│  │ (no further action — 2 hours ago ⚠)                     │  │
│  │                                                          │  │
│  │ ── Notes ──                                              │  │
│  │ (Add internal notes about this lead)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Leads DB 스키마 개선

```sql
-- 기존 leads 테이블에 컬럼 추가
ALTER TABLE leads ADD COLUMN stage TEXT DEFAULT 'new'
  CHECK(stage IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost'));
ALTER TABLE leads ADD COLUMN priority TEXT DEFAULT 'normal'
  CHECK(priority IN ('hot', 'warm', 'normal', 'cold'));
ALTER TABLE leads ADD COLUMN last_contacted_at DATETIME;
ALTER TABLE leads ADD COLUMN next_action TEXT;
ALTER TABLE leads ADD COLUMN next_action_date DATETIME;
ALTER TABLE leads ADD COLUMN assigned_to TEXT;
ALTER TABLE leads ADD COLUMN lost_reason TEXT;

-- 리드 활동 기록 테이블
CREATE TABLE IF NOT EXISTS lead_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('email_sent', 'email_received', 'call', 'note', 'stage_change', 'auto_action')),
  title TEXT NOT NULL,
  description TEXT,
  created_by TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);
```

### Leads API

```
GET    /api/admin/leads              — 리드 목록 (필터: stage, priority)
GET    /api/admin/leads/[id]         — 리드 상세 + activities
PATCH  /api/admin/leads/[id]         — 리드 수정 (stage 변경 등)
POST   /api/admin/leads/[id]/activity — 활동 기록 추가 (이메일, 콜, 노트)
DELETE /api/admin/leads/[id]         — 리드 삭제
```

---

## 5. Social Media — 채널 안정화

### 현재 문제
- 채널 연결이 자꾸 끊김

### 원인 분석 + 해결

```
SNS 연결 끊기는 일반적 원인:

1. OAuth 토큰 만료
   - Twitter: 토큰 자동 갱신 안 됨 → refresh_token 로직 필요
   - LinkedIn: 60일 만료 → 만료 전 자동 갱신
   - Instagram: 60일 만료 → 만료 전 자동 갱신

2. API 키가 환경변수에만 있고 갱신 로직 없음

3. 연결 상태 체크 없음 → 끊겨도 모름
```

### 해결 방안

```typescript
// 1. 토큰 갱신 자동화 (Cron)
// src/cron/social-token-refresh.ts

// 매일 토큰 유효성 체크
// 만료 7일 전이면 자동 갱신
// 갱신 실패하면 → Dashboard 알림에 경고 표시

// 2. 연결 상태 헬스 체크
// GET /api/admin/social/health
// 각 채널에 테스트 API 호출 → 연결 상태 반환

// 3. Social Media 페이지에 연결 상태 명확히 표시
// 🟢 Connected (token valid until Mar 15)
// 🟡 Expiring Soon (7 days left — auto-refresh scheduled)
// 🔴 Disconnected (click to reconnect)
```

### Social Media 페이지 개선

```
┌─────────────────────────────────────────────────────────────┐
│  Social Media                                               │
│                                                             │
│  ── Channel Status ──                                       │
│  🟢 Twitter    @britzmedi    Connected    Expires: Mar 15   │
│  🔴 LinkedIn   BRITZMEDI    Disconnected  [Reconnect]       │
│  🟡 Instagram  @britzmedi   Expiring Soon (5 days)          │
│                                                             │
│  ── Recent Posts ──                                         │
│  (Content Hub에서 발행된 글의 SNS 자동 포스팅 현황)           │
│                                                             │
│  ── Schedule ──                                             │
│  (예약 발행 현황)                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Settings

### 6.1 Site Editor (구 Homepage Editor)
- 기존 Homepage Editor 기능 유지
- 경로: /admin/settings/site-editor
- CONTENT 카테고리에서 SETTINGS로 이동

### 6.2 System (Health Check + Activity Log 통합)
```
/admin/settings/system

┌──────────┬──────────────┐
│ Health   │ Activity Log │
└──────────┴──────────────┘

Health: API 상태, DB 상태, 외부 서비스 연결 상태
Activity Log: 최근 시스템 활동 로그
```

---

## 7. 삭제/통합 대상

| 항목 | 처리 |
|------|------|
| /admin/blog-posts (Blog Manager) | 삭제 → Content Hub > All Content 탭으로 대체 |
| /admin/youtube-to-blog | 삭제 → Content Hub > Pipeline에서 YouTube 소스로 생성 |
| /admin/subscribers | 삭제 (미구현, 필요 시 Leads에 통합) |
| /admin/homepage | /admin/settings/site-editor로 이동 |
| /admin/health-check | /admin/settings/system으로 이동 |
| /admin/activity-log | /admin/settings/system으로 이동 |

---

## 8. 파일 구조 정리

### 삭제할 파일/페이지
```
src/pages/admin/blog-posts.astro          → 삭제
src/pages/admin/youtube-to-blog.astro     → 삭제 (기능은 Content Hub에 흡수)
src/pages/admin/subscribers.astro         → 삭제
```

### 이동할 파일
```
src/pages/admin/homepage.astro            → src/pages/admin/settings/site-editor.astro
src/pages/admin/health-check.astro        → src/pages/admin/settings/system.astro (통합)
src/pages/admin/activity-log.astro        → src/pages/admin/settings/system.astro (통합)
```

### 새로 만들 파일
```
src/pages/admin/content-hub/edit/[id].astro  — 콘텐츠 에디터 페이지
src/pages/admin/analytics.astro               — Analytics 통합 뷰
src/pages/admin/settings/site-editor.astro    — 사이트 에디터 (이동)
src/pages/admin/settings/system.astro         — 시스템 (통합)

src/components/admin/content-hub/
├── ContentEditor.tsx          — 마크다운 에디터 + 미리보기
├── AllContentTable.tsx        — 테이블 뷰 (벌크 액션)
├── ContentActions.tsx         — 액션 버튼 컴포넌트
├── DeleteConfirmModal.tsx     — 삭제 확인 모달
└── StatusTransition.tsx       — 상태 전환 버튼

src/components/admin/analytics/
├── AnalyticsDashboard.tsx     — Analytics 메인
├── TrafficTab.tsx             — GA4 데이터
├── SearchTab.tsx              — GSC 데이터  
└── SEOGrowthTab.tsx           — SEO Progress

src/components/admin/leads/
├── LeadsPipeline.tsx          — 칸반 뷰
├── LeadDetail.tsx             — 상세 + 타임라인
├── LeadActions.tsx            — 액션 버튼 (이메일, 콜, 노트)
└── ActivityTimeline.tsx       — 활동 기록 타임라인

src/components/admin/
├── Sidebar.tsx                — 새 사이드바 (구조 변경)
└── Dashboard.tsx              — 새 대시보드 (KPI 카드)
```

### API 정리

```
src/pages/api/admin/
├── content-hub/
│   ├── items.ts              — GET/POST (목록/생성)
│   ├── items/[id].ts         — GET/PATCH/DELETE (상세/수정/삭제)
│   ├── items/[id]/transition.ts — POST (상태 전환) ← 버그 수정
│   ├── generate.ts           — POST (Claude AI 생성)
│   ├── publish.ts            — POST (Keystatic 발행)
│   ├── unpublish.ts          — POST (게시 중지)
│   └── seo/                  — SEO Workers 프록시
│       ├── overview.ts
│       ├── briefs.ts
│       ├── progress.ts
│       └── performance/[id].ts
├── analytics/
│   ├── traffic.ts            — GA4 Data API 프록시
│   ├── search.ts             — GSC 데이터 프록시
│   └── seo-growth.ts         — SEO progress 프록시
├── leads/
│   ├── index.ts              — GET/POST
│   ├── [id].ts               — GET/PATCH/DELETE
│   └── [id]/activity.ts      — POST (활동 기록)
├── social/
│   ├── accounts.ts           — 채널 목록 + 상태
│   ├── health.ts             — 연결 상태 체크
│   └── refresh-token.ts      — 토큰 갱신
└── system/
    ├── health.ts             — 시스템 헬스 체크
    └── activity-log.ts       — 활동 로그
```

---

## 9. 구현 우선순위

### Phase 1: 핵심 수정 (즉시)
1. ⚠️ Content Hub 버그 수정
   - Submit for Review "action is required" 에러
   - Open Editor 리다이렉트 문제
   - 삭제 버튼 추가
2. ⚠️ 사이드바 구조 변경
3. ⚠️ Blog Manager 기능을 Content Hub All Content 탭으로 흡수

### Phase 2: 통제 권한 (1일)
4. Content Hub 에디터 페이지 (/admin/content-hub/edit/[id])
5. Published 글 관리 (Unpublish, Edit, Delete)
6. 벌크 액션 (체크박스 + 일괄 삭제/게시중지)
7. 중복 콘텐츠 삭제 정리

### Phase 3: Leads CRM (1일)
8. Leads 파이프라인 (stage 필드 추가)
9. 활동 기록 (lead_activities 테이블)
10. 리드 상세 + 액션 버튼 (이메일, 콜, 노트, 단계 변경)

### Phase 4: Analytics (1일)
11. GA4 API 연동 (기존 서비스 계정 활용)
12. Analytics 통합 페이지 (Traffic + Search + SEO Growth)

### Phase 5: 안정화 (반나절)
13. Social Media 토큰 갱신 로직 + 연결 상태 표시
14. Dashboard KPI 카드 + 알림
15. 불필요 페이지 삭제 + 리다이렉트 설정
16. 전체 빌드 테스트 + QA

---

## 10. 원칙

1. **기능 추가 금지** — 지금 있는 것만 제대로 작동하게
2. **하나의 센터** — 콘텐츠는 Content Hub, 마케팅 데이터는 Analytics
3. **모든 데이터에 액션** — 보기만 가능한 화면 없음, 반드시 통제 가능
4. **실패 내성** — 외부 API 연결 실패해도 다른 기능은 정상 작동
5. **일관된 UX** — 다크 테마, 같은 컴포넌트, 같은 패턴
