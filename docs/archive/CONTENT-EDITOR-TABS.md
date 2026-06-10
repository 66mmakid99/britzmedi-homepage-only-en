# Content Editor 고도화 — 백엔드 확인 + 프론트엔드 탭 구축 + 배포

아래를 전부 순서대로 실행해. 중간에 멈추지 마.

## Phase 0: 현재 상태 확인

```bash
# DB 테이블 확인
npx wrangler d1 execute britzmedi-db --remote --command "SELECT name FROM sqlite_master WHERE type='table'" 2>&1

# content_items 컬럼 확인
npx wrangler d1 execute britzmedi-db --remote --command "PRAGMA table_info(content_items)" 2>&1

# content_revisions 테이블 존재 여부
npx wrangler d1 execute britzmedi-db --remote --command "SELECT count(*) FROM content_revisions" 2>&1

# API 파일 존재 확인
ls -la src/pages/api/admin/content-hub/analyze.ts 2>/dev/null
ls -la src/pages/api/admin/content-hub/rewrite.ts 2>/dev/null
ls -la src/pages/api/admin/content-hub/suggest-section.ts 2>/dev/null
ls -la src/pages/api/admin/content-hub/items/\[id\]/revisions.ts 2>/dev/null

# ContentEditor 현재 탭 구조 확인
grep -n "tab\|Tab\|research\|analysis\|revision" src/components/admin/ContentEditor.tsx 2>/dev/null | head -30
```

결과를 먼저 보여줘. 그 결과를 기반으로 아래 단계 중 누락된 것만 실행해.

---

## Phase 1: 백엔드 (누락된 것만 구현)

### 1-1. DB 마이그레이션 (content_items에 research_data, analysis_data 컬럼 없으면)

마이그레이션 파일 생성 + remote 적용:

```sql
ALTER TABLE content_items ADD COLUMN research_data TEXT;
ALTER TABLE content_items ADD COLUMN analysis_data TEXT;

CREATE TABLE IF NOT EXISTS content_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER REFERENCES content_items(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  title TEXT,
  meta_description TEXT,
  faqs TEXT,
  change_summary TEXT,
  word_count INTEGER,
  score INTEGER,
  created_by TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_revisions_content ON content_revisions(content_id, version);
```

주의: ALTER TABLE은 한 줄씩 별도 실행. D1은 한 번에 여러 ALTER 못 함.

### 1-2. API 엔드포인트 (없는 것만 생성)

#### POST /api/admin/content-hub/analyze
- content_id로 content_items에서 콘텐츠 + 키워드 가져옴
- Claude API 호출 (ANTHROPIC_API_KEY 환경변수 사용, 모델: claude-sonnet-4-20250514)
- 프롬프트:
```
You are an SEO content quality analyst for BRITZMEDI, a Korean aesthetic medical device manufacturer.
Analyze this blog post and score it on 5 dimensions (0-100):
- SEO: keyword usage, meta tags, headings, internal links
- Readability: sentence length, jargon level, flow
- Completeness: topic coverage, depth, word count
- Originality: unique perspective, not generic, BRITZMEDI-specific insights
- Structure: headings hierarchy, sections flow, intro/conclusion

Keyword: {keyword}
Content:
{content}

Return ONLY valid JSON (no markdown):
{
  "scores": { "seo": 0, "readability": 0, "completeness": 0, "originality": 0, "structure": 0, "overall": 0 },
  "suggestions": [
    { "priority": "high|medium|low", "title": "...", "description": "...", "auto_fixable": true|false, "category": "seo|readability|completeness|originality|structure" }
  ],
  "summary": "한 줄 요약"
}
```
- 결과를 analysis_data 컬럼에 JSON 저장
- 응답으로 분석 결과 반환

#### POST /api/admin/content-hub/rewrite
- body: { content_id, mode: 'full' | 'section', section_index?: number, instructions?: string }
- 리라이트 전 현재 버전을 content_revisions에 자동 저장
- Claude API로 개선된 마크다운 반환
- DB에는 저장하지 않음 (프론트에서 확인 후 저장)

#### POST /api/admin/content-hub/suggest-section
- body: { content_id, suggestion_type: string }
- suggestion_type: 'britzmedi_perspective' | 'clinical_evidence' | 'faq_expansion' | 'comparison' | 'cost_analysis'
- 해당 섹션만 마크다운으로 반환

#### GET /api/admin/content-hub/items/[id]/revisions
- content_revisions에서 해당 content_id의 목록 반환 (ORDER BY version DESC)

#### POST /api/admin/content-hub/items/[id]/revisions
- body: { change_summary?: string }
- 현재 content_items 상태를 새 revision으로 저장
- version 자동 증가

### 1-3. 기존 Save API 수정
- 콘텐츠 저장(PUT) 시 자동으로 revision 생성
- change_summary: "Manual save"

---

## Phase 2: 프론트엔드 — Content Editor 탭 3개 추가

현재 ContentEditor.tsx (또는 해당 편집 컴포넌트)에 탭 3개 추가.
기존 Write/Preview 탭은 유지하고, 아래 3개를 추가:

### 탭 구조
```
[ Write ] [ Preview ] [ Research ] [ AI Analysis ] [ Revisions ]
```

### 2-1. Research 탭

research_data가 있으면 표시, 없으면 "No research data. Generate content with research to see this." 메시지.

research_data JSON 구조:
```json
{
  "keyword_analysis": { "primary": "...", "secondary": [...], "search_intent": "..." },
  "competitors": [{ "url": "...", "title": "...", "word_count": 0, "strengths": "...", "gaps": "..." }],
  "strategy": { "angle": "...", "differentiator": "..." },
  "sources": [{ "title": "...", "type": "pubmed|web|internal", "url": "..." }],
  "topics_to_cover": [{ "topic": "...", "covered": true|false }]
}
```

UI:
- 키워드 분석 카드 (primary keyword, intent, secondary keywords)
- 경쟁자 분석 테이블 (URL, 제목, 단어수, 강점, 갭)
- 전략 카드 (차별화 각도)
- 참고 자료 목록 (PubMed 논문 등)
- 다뤄야 할 토픽 체크리스트 (covered 여부 표시)

### 2-2. AI Analysis 탭

상단: [Run AI Analysis] 버튼 → POST /api/admin/content-hub/analyze 호출

분석 결과 표시:
- 전체 점수 (큰 숫자 + 원형 프로그레스)
- 5개 항목 점수 (바 차트 또는 레이더 차트)
  - 80+ → 초록 ✅
  - 60-79 → 노랑 ⚠️  
  - 60 미만 → 빨강 ❌
- 개선 제안 목록:
  - priority별 정렬 (high → medium → low)
  - high = 빨간 배지, medium = 노란 배지, low = 회색 배지
  - auto_fixable이 true면 [Apply Fix] 버튼 표시
  - [Apply Fix] 클릭 → POST /api/admin/content-hub/rewrite 호출 (해당 suggestion의 instructions로)

하단:
- [Full Rewrite] 버튼 → 전체 리라이팅
- [Suggest Section] 드롭다운 → 섹션 타입 선택 → 생성
- 리라이트/섹션 결과는 모달로 표시 + [Apply to Editor] 버튼

### 2-3. Revisions 탭

GET /api/admin/content-hub/items/{id}/revisions 호출

표시:
- 버전 목록 (최신순)
- 각 버전: version 번호, change_summary, word_count, score, created_at
- [View] → 모달에서 해당 버전 내용 표시
- [Restore] → 확인 대화상자 후 해당 버전으로 콘텐츠 복원 (PUT + 새 revision 생성)
- 현재 버전에는 "Current" 배지

### 2-4. 사이드바 Content Score 위젯

에디터 사이드바(오른쪽)에 간단한 점수 위젯 추가:
- analysis_data 있으면 점수 표시
- 없으면 "Not analyzed" + [Run Analysis] 버튼
- 점수 클릭하면 AI Analysis 탭으로 이동

---

## Phase 3: 스타일링

- 기존 admin 스타일과 일관성 유지 (Tailwind 클래스 사용)
- 다크 테마가 있으면 다크 테마 지원
- 점수 색상: 초록(80+), 노랑(60-79), 빨강(60 미만)
- 로딩 중: 스피너 + "Analyzing..." 텍스트
- API 에러: 빨간 알림 배너

---

## Phase 4: 빌드 + 테스트 + 배포

```bash
# 빌드
npm run build

# API 테스트 (빌드 성공 후)
# 분석
curl -X POST https://britzmedi.com/api/admin/content-hub/analyze \
  -H "Content-Type: application/json" \
  -H "Cookie: session=테스트세션" \
  -d '{"content_id": 1}'

# 리비전 목록
curl https://britzmedi.com/api/admin/content-hub/items/1/revisions

# 배포
git add -A
git commit -m "feat: Content Editor - Research/AI Analysis/Revisions tabs + backend APIs"
git push
```

빌드 실패하면 에러 수정 후 재빌드.
배포 후 프로덕션에서 Content Editor 열어서 3개 탭 확인.

---

## Phase 5: 문서 업데이트

CHANGELOG.md에 추가:
```
## [2026-02-19]
### Added
- Content Editor: Research tab (키워드 분석, 경쟁자 분석, 전략, 참고자료 표시)
- Content Editor: AI Analysis tab (5개 항목 점수 + 개선 제안 + 원클릭 리라이트)
- Content Editor: Revisions tab (버전 히스토리 + 복원)
- Content Score sidebar widget
- API: POST /api/admin/content-hub/analyze
- API: POST /api/admin/content-hub/rewrite
- API: POST /api/admin/content-hub/suggest-section
- API: GET/POST /api/admin/content-hub/items/[id]/revisions
- DB: content_revisions table
- DB: content_items.research_data, analysis_data columns
```

ARCHITECTURE.md API 목록 업데이트.

---

## 핵심 규칙

1. Phase 0 결과를 반드시 먼저 확인하고, 이미 있는 건 다시 만들지 마
2. Claude API 호출은 반드시 ANTHROPIC_API_KEY 환경변수 사용
3. Claude API 모델은 claude-sonnet-4-20250514
4. API 응답은 반드시 JSON
5. 프론트엔드는 기존 ContentEditor.tsx에 탭을 추가하는 방식 (별도 페이지 X)
6. 안 되는 부분은 안 된다고 보고하고 나머지는 계속 진행
7. 빌드 성공 + 배포까지 완료해야 끝
