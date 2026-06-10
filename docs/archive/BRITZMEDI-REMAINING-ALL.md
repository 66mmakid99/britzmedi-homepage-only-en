# BRITZMEDI 남은 작업 전부 실행

전부 순서대로 실행. 하나 실패해도 다음으로 넘어가. 중간에 멈추지 마.
마지막에 종합 결과표 보여줘.

---

## TASK 1: 논문 인용 출처 강화

현재 문제: 본문에 "Taub 등(2020)", "Gold 등(2022)" 식으로 부실 인용. 저널명, 볼륨, DOI 없음.

### 1-1. 생성 프롬프트에 인용 규칙 추가

content-angles.ts, content-pipeline.ts의 Claude 프롬프트에 추가:

```
CITATION RULES (MANDATORY):
- When citing research, use abbreviated inline format: "Taub et al. (2020)"
- At the END of every article, include a "References" section with FULL citations in AMA format:
  Author(s). Article title. Journal Name. Year;Volume(Issue):Pages. doi:xxxxx
  Example: Taub AF, Garretson CB. Treatment of acne scars by sublative bipolar radiofrequency. J Clin Aesthet Dermatol. 2020;13(1):28-34. doi:10.xxxxx
- Every inline citation MUST have a matching entry in References
- If you cannot provide exact DOI/volume/pages, write "doi: [verification needed]" — do NOT fabricate citation details
- PubMed links are acceptable: "PMID: 12345678"
- Minimum 3 references per article, maximum 10
```

### 1-2. PubMed 리서치 결과 → 생성 단계 전달 강화

content-pipeline.ts의 pipelineStep1_research()에서 PubMed 검색 결과를 저장할 때, 각 논문의 full citation 정보를 포함:
- 제목, 저자, 저널, 연도, 볼륨, 페이지, DOI, PMID

pipelineStep2_generate()에서 이 정보를 프롬프트에 주입:
```
AVAILABLE RESEARCH (use these citations with EXACT details in References):
1. Taub AF et al. "Treatment of acne scars..." J Clin Aesthet Dermatol. 2020;13(1):28-34. PMID: xxxxx
2. ...
```

### 1-3. 후처리에 인용 검증 추가

content-postprocess.ts에 checkCitations() 함수 추가:
- 본문에 "et al." 또는 "등" 패턴 감지
- References 섹션 존재 여부 확인
- References 없으면 → blocking issue
- 인용 개수와 References 개수 불일치 → warning

### 1-4. 기존 발행글 인용 수정

발행된 글(content_items WHERE status='published')에서:
- 부실 인용 패턴 검색 (저널명만 있고 DOI/볼륨 없는 것)
- 각 인용의 저자+저널+연도로 PubMed 검색
- 정확한 인용 정보로 교체
- References 섹션 추가
- 수정된 글 다시 발행 (GitHub JSON 업데이트 + 커밋)

---

## TASK 2: Admin Preview 제목 중복 수정

프로덕션 사이트는 고쳐졌는데 Admin Content Hub의 Preview에서 아직 H1이 두 번 나옴.

### 2-1. Admin Preview 렌더링 코드 찾기

ContentEditor.tsx 또는 관련 컴포넌트에서 Preview 렌더링 부분 찾기.
markdown/HTML을 렌더링할 때 첫 번째 H1을 제거하는 로직 추가.

프로덕션 [slug].astro에서 사용한 stripFirstH1()과 동일한 로직을 Admin Preview에도 적용.

---

## TASK 3: 발행글 품질 점검 + 수정

현재 발행된 글 전부 확인:

```bash
npx wrangler d1 execute britzmedi-db --remote --command "SELECT id, title, status FROM content_items WHERE status='published'"
```

각 글에 대해:
1. 글 길이 확인 — 2500단어 초과하면 트리밍
2. H1 중복 확인 — 본문에 H1 있으면 제거
3. BRITZMEDI 노출 확인 — 너무 노골적이면 톤 조정
4. 비교표 확인 — 비교 글인데 비교표 없으면 추가
5. CTA 확인 — 2개 미만이면 추가
6. 인용 확인 — References 없으면 추가 (TASK 1에서 처리)
7. FAQ Schema 확인 — FAQ 있으면 JSON-LD 포함되는지

수정된 글은 GitHub JSON 업데이트 + 커밋.

---

## TASK 4: 리드 스코링 실 테스트

### 4-1. 테스트 리드 제출 (회사 이메일)

```bash
curl -X POST https://britzmedi.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Dermatech Solutions",
    "companyWebsite": "https://dermatech.co.th",
    "name": "Somchai Prasertsuk",
    "jobTitle": "Managing Director",
    "email": "somchai@dermatech.co.th",
    "country": "TH",
    "interestedIn": ["torr-rf", "distribution"],
    "message": "We are a medical device distributor in Thailand with 15 years experience. Interested in TORR RF exclusive distribution for ASEAN.",
    "source": "contact_form"
  }'
```

### 4-2. 결과 확인

```bash
npx wrangler d1 execute britzmedi-db --remote --command "SELECT id, company_name, lead_score, lead_grade, is_free_email, research_status FROM leads ORDER BY id DESC LIMIT 3"
```

3분 후:
```bash
npx wrangler d1 execute britzmedi-db --remote --command "SELECT id, company_name, lead_grade, research_status, score_breakdown FROM leads ORDER BY id DESC LIMIT 1"
```

### 4-3. 테스트 결과 보고

- Score: ?/100
- Grade: ?
- Score Breakdown 5개 항목
- Company Research 완료 여부
- 이메일 발송 여부

테스트 리드는 보고 후 삭제:
```bash
npx wrangler d1 execute britzmedi-db --remote --command "DELETE FROM leads WHERE company_name='Dermatech Solutions'"
```

---

## TASK 5: SNS 포스트 자동 생성

블로그 발행 시 LinkedIn + X 포스트 자동 생성. 초기에는 Admin에서 Copy to Clipboard 방식.

### 5-1. social_posts 테이블

```sql
CREATE TABLE IF NOT EXISTS social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_item_id INTEGER,
  platform TEXT NOT NULL CHECK(platform IN ('linkedin', 'twitter')),
  content TEXT NOT NULL,
  hashtags TEXT,
  url TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### 5-2. social-publisher.ts 모듈

src/lib/social-publisher.ts 생성:

generateSocialPosts(env, article) 함수:
- Claude API로 LinkedIn 포스트 (150-200 words, B2B 톤, 4-6 해시태그) + X 포스트 (280자 이내) 생성
- social_posts 테이블에 draft 상태로 저장

### 5-3. 파이프라인 연동

content-pipeline.ts의 publish 단계 끝에:
- publish 성공 후 generateSocialPosts() 호출
- SNS 실패해도 발행은 유지

### 5-4. Admin Social Media 페이지

/admin/social-media 페이지 (사이드바에 이미 있을 수 있음):
- 탭: All | LinkedIn | X
- 각 포스트 카드: Platform 배지, 원본 블로그 링크, 포스트 내용 (편집 가능), 해시태그, Status
- 버튼: [Copy to Clipboard] [Edit] [Delete]
- Copy 클릭 → 클립보드에 복사 + status를 'published'로 변경

### 5-5. API

- GET /api/admin/social-media — 전체 목록 (platform, status 필터)
- PUT /api/admin/social-media/:id — 수정
- DELETE /api/admin/social-media/:id — 삭제

---

## TASK 6: Analytics 대시보드

자체 페이지뷰 트래킹 + 대시보드. GA4 등 외부 서비스 안 씀.

### 6-1. page_views 테이블

```sql
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  device TEXT,
  session_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pv_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_pv_created ON page_views(created_at);
```

### 6-2. 트래킹 API

POST /api/analytics/pageview (Auth 없음 — 공개 API):
- Body: { path, referrer, sessionId }
- CF-IPCountry, User-Agent에서 country, device 추출
- page_views에 INSERT
- Admin 페이지(/admin/*) 경로는 무시

### 6-3. 트래킹 스크립트

src/components/PageTracker.astro 생성:
- 페이지 로드 시 POST /api/analytics/pageview
- sessionStorage에 session_id (30분)
- sendBeacon 사용 (가벼움)
- Admin 페이지에서는 제외

BaseLayout.astro (또는 메인 레이아웃)에 <PageTracker /> 추가.
단, /admin/ 경로에서는 렌더링하지 않음.

### 6-4. Analytics API

GET /api/admin/analytics/overview?period=7d:
```json
{
  "total_views": 0,
  "unique_sessions": 0,
  "top_pages": [{"path": "/blog/...", "views": 0}],
  "top_countries": [{"country": "US", "views": 0}],
  "top_referrers": [{"referrer": "google.com", "views": 0}],
  "daily_views": [{"date": "2026-02-20", "views": 0}]
}
```

### 6-5. Admin Analytics 페이지

/admin/analytics 페이지:
- 기간 선택: [7일] [30일] [90일]
- KPI 카드: Total Views, Unique Visitors, Top Country, Avg Pages/Session
- 일별 차트 (CSS bar chart — 외부 라이브러리 X)
- Top Pages 테이블 (상위 10개)
- Top Countries 테이블
- Top Referrers 테이블
- Content Performance: 블로그 글별 조회수 순위

---

## TASK 7: AEO Engine 대시보드

/admin/aeo-engine 페이지 — 전체 사이클 현황을 한눈에.

### 7-1. API

- GET /api/admin/aeo-engine/status — 최신 사이클 결과 (aeo_cycles 테이블에서)
- GET /api/admin/aeo-engine/history — 사이클 이력 (최근 30일)
- POST /api/admin/aeo-engine/run — 수동 사이클 실행 (mode: full|diagnose|produce|analyze)

### 7-2. 대시보드 UI

```
AEO Growth Engine:
- 🎯 Mention Rate: 0% → ?% (추이 표시)
- Last Cycle: 날짜시간
- Next Cycle: 내일 00:00 KST

Cycle Status:
[Diagnose ✅] → [Plan ✅] → [Produce ✅] → [Analyze ✅]

버튼: [Run Full Cycle] [Run Diagnose Only] [Run Produce Only]

Query Results (최근 진단):
✅ "TORR RF reviews" — mentioned
❌ "Best RF machines" — not mentioned (InMode 언급됨)

Content Pipeline:
Queued: ? | Processing: ? | Published: ?
Avg Quality Score: ?

Growth Timeline:
Week 1: 0% → Week 2: ?% → Week 3: ?%

AI Recommendations:
1. ...
2. ...
```

---

## TASK 8: 기존 글 썸네일 추가

발행된 글에 썸네일이 없는 것들:

1. /images/products/ 폴더에서 TORR RF 제품 이미지 확인
2. 각 글의 카테고리에 맞는 제품 이미지를 featured_image로 설정
3. 제품 이미지가 없으면 BRITZMEDI 로고 + 카테고리명 텍스트 조합 SVG 생성

```bash
# 썸네일 없는 글 찾기
npx wrangler d1 execute britzmedi-db --remote --command "SELECT id, title, featured_image FROM content_items WHERE status='published' AND (featured_image IS NULL OR featured_image = '')"
```

각 글에 적절한 이미지 설정 후 GitHub JSON 업데이트.

---

## TASK 9: 빌드 + 배포

```bash
npm run build
git add -A
git commit -m "feat: citation system, SNS publishing, analytics dashboard, AEO engine dashboard, thumbnail setup"
git push
```

배포 후 확인:
```bash
curl -s -o /dev/null -w "%{http_code}" https://britzmedi.com/admin/analytics
curl -s -o /dev/null -w "%{http_code}" https://britzmedi.com/admin/aeo-engine
curl -s -o /dev/null -w "%{http_code}" https://britzmedi.com/admin/social-media
```
3개 다 200이면 성공.

---

## TASK 10: 종합 결과 보고

```
=== BRITZMEDI 작업 종합 결과 ===

TASK 1: 논문 인용 출처 강화
- 프롬프트 수정: [완료/실패]
- 후처리 검증: [완료/실패]
- 기존 글 수정: [?건 수정]

TASK 2: Admin Preview 제목 중복
- [수정됨/미수정]

TASK 3: 발행글 품질 점검
- 총 ?건 확인
- 수정: ?건 (길이 트리밍 ?건, CTA 추가 ?건, 인용 수정 ?건)

TASK 4: 리드 스코링 테스트
- Score: ?/100 (Grade ?)
- Company Research: [완료/실패]
- 이메일 알림: [발송/미발송]

TASK 5: SNS 포스트
- social_posts 테이블: [생성됨/실패]
- Social Media 페이지: [구현됨/실패]

TASK 6: Analytics 대시보드
- page_views 테이블: [생성됨/실패]
- 트래킹 스크립트: [삽입됨/실패]
- Analytics 페이지: [구현됨/실패]

TASK 7: AEO Engine 대시보드
- API: [동작/실패]
- 대시보드 페이지: [구현됨/실패]

TASK 8: 기존 글 썸네일
- ?건 설정 완료

빌드: [성공/실패]
배포: [성공/실패]
Admin 페이지 접근: analytics [200/xxx], aeo-engine [200/xxx], social-media [200/xxx]
```

---

## 핵심 규칙

1. 전부 순서대로 실행. 하나 실패해도 보고하고 다음으로 넘어가
2. AI 생성 이미지 절대 사용 금지 (신뢰 비즈니스)
3. 논문 인용은 정확한 출처만. 모르면 "[verification needed]" 표시
4. Analytics는 자체 구현 (외부 서비스 X)
5. SNS는 Copy to Clipboard 방식 (API 토큰 없음)
6. 모든 admin 페이지는 기존 레이아웃/스타일 따라가
7. 테스트 리드는 결과 보고 후 삭제
8. 빌드 + 배포까지 완료해야 끝
