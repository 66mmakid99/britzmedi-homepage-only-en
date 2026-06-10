# CLAUDE-ADMIN-REDESIGN.md
# Admin 시스템 통합 재설계 실행 지침
# 실행: claude "CLAUDE-ADMIN-REDESIGN.md 읽고 Phase 1부터 순서대로 구현해"

## 핵심 원칙
- 기능 추가 금지. 지금 있는 것을 견고하게.
- 보기만 가능한 화면 금지. 모든 데이터에 통제 액션 제공.
- 외부 API 실패해도 다른 기능 정상 작동.

## 상세 설계서 참고
BRITZMEDI-ADMIN-REDESIGN-v2.md에 전체 설계 있음. 반드시 읽고 시작할 것.

---

## Phase 1: 즉시 수정 (버그 + 구조)

### 1-1. Content Hub 버그 수정

**A. Submit for Review 에러**
- 증상: "action is required" alert
- 원인: transition API 호출 시 body에 action이 안 보내짐
- 수정: 프론트엔드에서 fetch body에 { action: 'submit_review' } 확실히 포함
- transition API도 확인: action 파라미터 검증 로직

**B. Open Editor 리다이렉트**
- 증상: Edit 버튼 누르면 /admin/dashboard로 감
- 수정: /admin/content-hub/edit/[id] 페이지 생성
  - 마크다운 textarea + 실시간 미리보기 (split view)
  - 메타 편집 (title, slug, category, tags, excerpt)
  - SEO 편집 (keyword, meta description)
  - [Save Draft] [Submit for Review] [Delete] 버튼
  - marked 또는 showdown 라이브러리로 마크다운 렌더링

**C. 삭제 기능**
- 모든 콘텐츠 카드/상세에 Delete 버튼 추가
- 확인 모달: "이 콘텐츠를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다."
- DELETE /api/admin/content-hub/items/[id] 호출
- Published 글은 추가 경고: "발행된 글입니다. Keystatic에서도 삭제됩니다."

### 1-2. 사이드바 구조 변경

기존:
```
CONTENT: Content Hub, Homepage Editor, Blog Posts, YouTube to Blog
SALES: Leads, Subscribers, Resources
MARKETING: Social Media
SYSTEM: Health Check, Activity Log
SETTINGS: Keystatic CMS
```

변경:
```
Dashboard
CONTENT: Content Hub (유일)
MARKETING: Analytics (신설), Social Media
SALES: Leads (유일)
SETTINGS: Site Editor (구 Homepage Editor), Keystatic CMS, System (Health+Log 통합)
```

작업:
- Sidebar 컴포넌트 수정 (메뉴 아이템 변경)
- Blog Posts 메뉴 삭제 (Content Hub에 흡수)
- YouTube to Blog 메뉴 삭제 (Content Hub에 흡수) 
- Subscribers 메뉴 삭제
- Resources 메뉴 삭제 또는 SETTINGS로 이동
- Homepage Editor → SETTINGS > Site Editor로 이동
- Health Check + Activity Log → SETTINGS > System으로 통합
- 기존 URL에 접근하면 새 URL로 리다이렉트

### 1-3. All Content 탭 개선 (Blog Manager 흡수)

기존 Blog Manager의 기능을 Content Hub > All Content 탭에 통합:
- Published 포함 전체 콘텐츠 테이블 뷰
- 각 행에 ⋮ 메뉴: Edit, Preview, View Post, Unpublish, Delete
- 상단 필터: [All] [Drafts] [Published] + Source 필터
- 검색 기능
- 체크박스 + 벌크 액션 (선택 삭제, 선택 게시중지)

Keystatic의 기존 블로그 글(7개 published)도 여기서 보여야 함:
- src/content/blog/*.json 파일들을 읽어서 표시
- 또는 content_items 테이블에 기존 published 글을 초기 데이터로 등록

---

## Phase 2: 통제 권한 강화

### 2-1. Published 글 관리

- Unpublish 기능: Published → Draft 로 되돌림
  - Keystatic JSON 파일 삭제 (GitHub API commit)
  - content_items status → draft
  - 사이트에서 해당 글 내려감

- Edit 기능: Published 글도 편집 가능
  - 편집 후 저장 → Keystatic JSON 업데이트 → GitHub commit
  - 사이트 자동 재배포

- Delete 기능: 완전 삭제
  - content_items에서 DELETE
  - Keystatic JSON 파일 삭제
  - GitHub commit

### 2-2. 콘텐츠 에디터 완성

/admin/content-hub/edit/[id] 페이지:

```
필수 요소:
1. Title 입력 (text input)
2. Slug 입력 (auto-generate from title, 수동 수정 가능)
3. Category 선택 (dropdown)
4. Tags 입력 (comma-separated)
5. Content 편집 (textarea, 마크다운)
6. Content 미리보기 (실시간 렌더링)
7. Excerpt / Meta Description (textarea, 160자 제한 표시)
8. SEO Keyword (text input)
9. FAQ 편집 (동적 폼: question + answer 쌍 추가/삭제)
10. 액션 버튼: Save Draft, Submit for Review, Publish, Delete
11. 현재 상태 표시 (Draft, Review, Published 등)
12. 마지막 수정 시간
```

기술:
- textarea로 충분 (WYSIWYG 불필요)
- marked 라이브러리로 미리보기 렌더링
- Auto-save 고려 (5분마다 또는 blur 시)

---

## Phase 3: Leads CRM

### 3-1. DB 스키마

기존 leads 테이블 컬럼 추가:
```sql
ALTER TABLE leads ADD COLUMN stage TEXT DEFAULT 'new';
ALTER TABLE leads ADD COLUMN priority TEXT DEFAULT 'normal';  
ALTER TABLE leads ADD COLUMN last_contacted_at DATETIME;
ALTER TABLE leads ADD COLUMN next_action TEXT;
ALTER TABLE leads ADD COLUMN next_action_date DATETIME;
ALTER TABLE leads ADD COLUMN lost_reason TEXT;
```

새 테이블:
```sql
CREATE TABLE IF NOT EXISTS lead_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3-2. API

```
GET    /api/admin/leads              — 목록 (필터: stage, priority)
GET    /api/admin/leads/[id]         — 상세 + activities
PATCH  /api/admin/leads/[id]         — 수정 (stage, priority 등)
POST   /api/admin/leads/[id]/activity — 활동 추가
DELETE /api/admin/leads/[id]         — 삭제
```

### 3-3. UI

- Pipeline 뷰 (칸반): New → Contacted → Qualified → Proposal → Won/Lost
- 카드 드래그 or 버튼으로 단계 이동
- 상세 패널: 리드 정보 + 활동 타임라인 + 액션 버튼
- 48시간 미대응 경고 (🔴 표시)

---

## Phase 4: Analytics 페이지

### 4-1. GA4 연동 (서비스 계정)

1. Google Cloud Console > Analytics Data API 활성화
2. 서비스 계정(britzmedi-seo-monitor)에 GA4 속성 뷰어 권한 추가
3. GA4 Property ID를 환경변수에 추가: GA4_PROPERTY_ID

SEO Workers에 GA4 엔드포인트 추가:
```typescript
// GET /api/analytics/traffic
// Google Analytics Data API 호출
// 반환: users, sessions, pageviews, bounce_rate, avg_duration
//       daily_trend (7일), top_pages, traffic_sources
```

### 4-2. Analytics 페이지 UI

3개 서브탭: Traffic (GA4) | Search (GSC) | SEO Growth

**Traffic**: KPI 카드 4개 + 일별 차트 + Top Pages + Traffic Sources
**Search**: GSC 서치 퍼포먼스 (queries, position, impressions, clicks)
**SEO Growth**: Progress 탭과 동일 데이터

### 4-3. 차트 라이브러리

Recharts 사용 (이미 React 프로젝트):
```bash
npm install recharts
```

---

## Phase 5: 안정화

### 5-1. Social Media 토큰

각 SNS 서비스의 토큰 만료 체크 + 자동 갱신:
- /api/admin/social/health — 각 채널 연결 상태 반환
- 만료 임박 시 Dashboard 알림
- 가능한 경우 refresh_token으로 자동 갱신

### 5-2. Dashboard 개선

4개 KPI 카드 (Content, Traffic, Leads, SEO):
- 각 섹션 API에서 데이터 fetch
- API 실패 시 해당 카드만 "unavailable" (전체 크래시 방지)

Recent Activity + Alerts 섹션

### 5-3. 정리

- 불필요 페이지 삭제 (blog-posts.astro, youtube-to-blog.astro, subscribers.astro)
- 기존 URL → 새 URL 리다이렉트 설정
- npm run build 전체 빌드 성공 확인
- 모든 페이지 접근 테스트

---

## 에이전트 분배 (병렬 작업)

```
Agent 1 (Core Fix): Phase 1 전체
  - Content Hub 버그 3개 수정
  - 사이드바 구조 변경
  - All Content 탭 개선
  작업 파일: src/components/admin/Sidebar, content-hub/*, pages/admin/*

Agent 2 (Editor + Content Control): Phase 2 전체
  - 콘텐츠 에디터 페이지
  - Published 글 관리 (Unpublish, Edit, Delete)
  - 벌크 액션
  작업 파일: src/pages/admin/content-hub/edit/*, API transition/publish/unpublish

Agent 3 (Leads + Analytics): Phase 3 + 4
  - Leads CRM (DB, API, UI)
  - Analytics 페이지 (GA4 연동은 API만, 실제 연결은 나중에)
  작업 파일: src/pages/admin/leads/*, analytics/*, api/admin/leads/*
```

---

## 주의사항

1. 기존 YouTube to Blog 파이프라인 코드는 삭제하지 않음 (Content Hub에서 재활용)
2. src/content/blog/ 의 기존 Keystatic 글 7개 건드리지 않음
3. 사이드바 변경 시 모든 admin 페이지의 layout 확인
4. GA4 API 연결은 Phase 4에서 — 먼저 UI 틀만 만들고, API는 서비스 계정 설정 후
5. 각 Phase 완료 후 반드시 npm run build 확인
