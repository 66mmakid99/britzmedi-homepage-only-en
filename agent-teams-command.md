# BRITZMEDI Agent Teams 작업 명령어

이 작업을 Agent Team으로 병렬 진행해줘.

## 프로젝트 비전
BRITZMEDI 글로벌 홈페이지는 해외영업 마케팅의 전초기지.
RF의료기기/고주파 미용의료기기 시장에서 "기술력 + 가격효율성 + 제품 견고함"으로 브랜드를 알리는 것이 목표.
모든 콘텐츠와 기능은 AEO/GEO/SEO 최적화를 최우선으로 설계할 것.

---

## Teammate 1: Blog UI & i18n (프론트엔드)

### 담당 파일
- src/pages/blog/index.astro (리스트 UI 전면 개선)
- src/pages/[lang]/blog/index.astro
- src/pages/[lang]/blog/[slug].astro
- src/components/blog/ (새 폴더: BlogCard.astro, BlogHero.astro, Pagination.astro, CategoryFilter.astro, SubscribeInline.astro)
- public/images/blog/placeholder-*.svg (카테고리별 플레이스홀더 6개)

### 작업 내용

#### 블로그 리스트 UI 개선
- Featured Articles 섹션 제거, 단일 그리드로 통합
- 모든 포스트 발행일 기준 최신순(desc) 정렬
- 최신 1개: 히어로 카드 (가로 풀폭, 큰 썸네일 + 제목 + 요약 오버레이)
- 나머지: 3열 그리드 (데스크탑), 2열 (태블릿), 1열 (모바일)
- 카드 디자인: 썸네일 상단 + 카테고리 배지 + 날짜 + 제목 + 요약 2줄 + Read More
- 필터 탭 유지: All Posts, Industry News, Product Updates, Technology, Clinical Studies, Education
- 페이지네이션 (한 페이지 9개)

#### 썸네일 시스템
- 블로그 포스트 frontmatter에 thumbnail 필드 추가
- 썸네일 없을 때 카테고리별 기본 플레이스홀더 이미지 표시 (현재 깨진 이미지 아이콘 대신)
- 카테고리별 placeholder SVG: technology(파랑), clinical-studies(초록), industry-news(주황), product-updates(골드), education(보라), default(그레이)

#### i18n 완성
- [lang]/blog/[slug].astro 완성 (현재 진행 중이던 작업 마무리)
- 비영어 페이지 언어 배너 동작 확인
- 블로그 관련 UI 텍스트 전부 i18n 키 사용

---

## Teammate 2: Document to Blog (백엔드 파이프라인)

### 담당 파일
- src/lib/youtube-to-blog/file-parsers/ (새 폴더)
  - index.ts (파일 타입별 라우팅)
  - pptx.ts (PPT 파서)
  - pdf.ts (PDF 파서)
  - docx.ts (DOCX 파서)
  - image.ts (이미지 분석 - Gemini Vision)
- src/lib/youtube-to-blog/content-types/ (새 폴더)
  - presentation.ts (PPT → 블로그)
  - paper.ts (논문 → 블로그)
  - whitepaper.ts (리포트/백서 → 블로그)
- src/pages/api/blog/upload.ts (파일 업로드 API)
- src/pages/api/blog/queue/[id]/step/extract-file.ts
- src/pages/api/blog/queue/[id]/step/analyze-images.ts
- src/components/admin/youtube-to-blog/FileUpload.tsx (드래그앤드롭)
- src/components/admin/youtube-to-blog/SourceTabs.tsx (YouTube/File 탭 전환)
- src/components/admin/youtube-to-blog/ContentTypeSelect.tsx

### 작업 내용

#### 파일 파싱
- PDF: pdf-parse로 텍스트 추출 + Gemini Flash로 OCR (이미지 포함 PDF 대응)
- DOCX: mammoth.js로 HTML/텍스트 + 구조 추출
- PPTX: pptx-parser + JSZip으로 슬라이드별 텍스트/이미지/노트 추출
- 모든 포맷에서 표(table), 수치 데이터, 인용문 구조적 추출

#### AEO/GEO 최적화 블로그 변환
Claude API(Opus)로 변환 시 다음 구조 강제:
- H1: SEO 최적화 제목 (RF medical device, aesthetic equipment 등 핵심 키워드 포함)
- 도입부: 핵심 요약 (AI 스니펫 타겟, 2-3문장)
- H2 섹션들: 문서 내용 기반 체계적 분석
- 데이터/수치 하이라이트 (표, 인용 - 원본 근거 명시)
- Key Takeaways 섹션
- FAQ 섹션 (최소 3개, JSON-LD schema markup 포함)
- CTA (제품 페이지 또는 Contact 연결)
- 의료기기 업계 전문성 있는 톤, 디스트리뷰터/클리닉 오너 타겟

#### 어드민 UI
- 기존 YouTube to Blog 탭 옆에 "Document to Blog" 탭 추가
- 파일 드래그앤드롭 업로드 영역
- 문서 타입 자동 감지 (확장자 기반)
- 추출된 원본 내용 미리보기
- 타겟 키워드 입력 필드 (선택사항)
- 블로그 카테고리 선택 드롭다운
- Generate → 미리보기/편집 → Publish 플로우

#### 한국인 이름 영문표기 정확도 개선

기존 doctor research 로직(gemini.ts, claude.ts)에 영문이름 검증 파이프라인 추가:

```
한글 이름 + 병원명 추출
    ↓
① D1 name_mappings 테이블 조회 → 있으면 즉시 반환
    ↓ (없으면)
② 유튜브 채널 about/소개 페이지에서 영문이름 확인
    ↓
③ 웹 검색: "{병원명} {이름} 원장" → 병원 홈페이지/블로그/네이버플레이스에서 영문표기 추출
    ↓
④ 학회 사이트 검색 (대한피부과학회, 대한성형외과학회 등)
    ↓
⑤ 매칭 실패 시 → 한국 관용 로마자 변환 (김→Kim, 이→Lee, 박→Park, 최→Choi, 정→Jung, 강→Kang 등) + verified=false 플래그
    ↓
⑥ 결과를 name_mappings DB에 저장
```

D1 테이블:
```sql
CREATE TABLE name_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ko TEXT NOT NULL,
  name_en TEXT NOT NULL,
  affiliation_ko TEXT,
  affiliation_en TEXT,
  specialty TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_source TEXT,  -- 'youtube', 'hospital_website', 'naver', 'conference', 'manual'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

어드민 블로그 편집 화면에:
- 전문가 이름 옆 verified/unverified 배지 표시
- unverified인 경우 수동 수정 가능 + 수정 시 verified=true, source='manual'로 업데이트
- name_mappings 관리 페이지 (검색, 수정, 삭제)

---

## Teammate 3: 예약 배포 시스템 (CMS + Worker)

### 담당 파일
- keystatic.config.ts (스키마 업데이트: thumbnail, scheduledDate, status 필드)
- src/content/blog/ 관련 타입 정의
- worker/scheduled-publish.ts (새 파일: Cron Trigger)
- src/pages/admin/blog-manager/ (새 폴더)
  - index.astro (블로그 관리 메인)
  - [id]/edit.astro (편집)
- src/components/admin/blog-manager/ (새 폴더)
  - BlogList.tsx (상태별 필터 목록)
  - BlogStatusBadge.tsx
  - DateTimePicker.tsx
  - PublishOptions.tsx (즉시발행/예약/임시저장)
- .github/workflows/scheduled-build.yml (GitHub Actions cron)

### 작업 내용

#### Keystatic 스키마 업데이트
기존 블로그 스키마에 필드 추가:
```yaml
thumbnail: image field (optional)
status: select - "draft" | "scheduled" | "published"
scheduledDate: datetime field (optional, required when status=scheduled)
publishDate: datetime field
```

#### 예약 배포 동작
- status: draft → 어드민에서만 보임, 사이트에 미노출
- status: scheduled + scheduledDate 설정 → 해당 시간 이후 published로 자동 전환
- status: published → 블로그에 공개
- 빌드 시점에 status 체크: draft/scheduled(미래)는 필터링

#### 자동 발행 메커니즘
1. Cloudflare Workers Cron Trigger: 매 시간 실행
   - scheduledDate <= now() AND status='scheduled' 인 포스트 → published로 변경
   - GitHub API로 자동 빌드 트리거
2. GitHub Actions cron: 매일 09:00 KST 자동 빌드 (백업)
   - .github/workflows/scheduled-build.yml

#### 어드민 블로그 관리 UI
- 블로그 목록: 상태별 탭 (All / Draft / Scheduled / Published)
- 각 포스트 카드: 제목, 카테고리, 상태 배지, 날짜, 썸네일 미리보기
- 편집 화면:
  - "즉시 발행" 버튼 → status=published, publishDate=now
  - "예약 발행" → DateTimePicker로 날짜/시간 선택 → status=scheduled
  - "임시 저장" → status=draft
- Scheduled 포스트는 예약 시간 카운트다운 + "지금 발행" 바로가기

---

## Teammate 4: 이메일 구독 & 알림 시스템 (풀스택)

### 담당 파일
- src/pages/api/subscribers/ (새 폴더)
  - subscribe.ts (POST: 구독 신청)
  - confirm.ts (GET: 이메일 확인 - double opt-in)
  - unsubscribe.ts (GET: 구독 해지)
  - notify.ts (POST: 새 포스트 알림 발송 - internal)
  - list.ts (GET: 어드민용 구독자 목록)
  - export.ts (GET: CSV 내보내기)
- src/components/blog/SubscribeForm.tsx (새 파일)
- src/components/footer/NewsletterForm.tsx (기존 푸터 폼 연동)
- src/pages/unsubscribe.astro (새 파일: 구독 해지 페이지)
- src/pages/confirm-subscription.astro (새 파일: 구독 확인 페이지)
- src/pages/admin/subscribers/ (새 폴더)
  - index.astro (구독자 관리 대시보드)
- src/components/admin/subscribers/ (새 폴더)
  - SubscriberStats.tsx (통계 카드)
  - SubscriberList.tsx (목록 + 검색/필터)
  - SubscriberExport.tsx (CSV 내보내기)
- worker/subscriber-notify.ts (새 파일: 포스트 발행 시 알림)

### 작업 내용

#### D1 테이블
```sql
CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  language TEXT DEFAULT 'en',
  categories TEXT DEFAULT '[]',  -- JSON: ["technology","clinical_studies"]
  status TEXT DEFAULT 'pending',  -- pending, active, unsubscribed
  confirmation_token TEXT UNIQUE,
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME,
  unsubscribed_at DATETIME
);

CREATE TABLE notification_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriber_id INTEGER,
  blog_post_slug TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'sent',  -- sent, failed, bounced
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
);
```

#### 구독 플로우 (Double Opt-in)
1. 구독 폼에서 이메일 입력 + Subscribe
2. API → subscribers 테이블에 status='pending' + confirmation_token 생성
3. 확인 이메일 발송 (Resend API): "Confirm your subscription" + 확인 링크
4. 확인 링크 클릭 → /confirm-subscription?token={token}
5. status='active', confirmed_at=now()
6. 환영 이메일 발송: "Welcome to BRITZMEDI Insights"

#### 구독 폼 배치
- 블로그 리스트 페이지 하단 (Teammate 1의 작업 후 삽입 위치만 확보)
- 개별 블로그 포스트 본문 아래
- 푸터 "Stay Updated with BRITZMEDI" 섹션 (기존 폼과 통합)
- 카테고리별 선택 구독 체크박스 (선택사항)

#### 새 포스트 알림 발송
- 블로그 포스트가 published 될 때 트리거 (Teammate 3의 예약 배포와 연동)
- Cloudflare Workers에서 처리:
  1. 포스트의 카테고리 확인
  2. 해당 카테고리 구독 + status='active' 구독자 조회
  3. 구독자의 language에 맞는 언어로 이메일 발송
- Resend API 사용 (기존 시스템과 통일)
- 이메일 템플릿:
  - BRITZMEDI 로고 + 브랜드 헤더
  - 포스트 썸네일
  - 제목 + 요약 2-3줄
  - "Read Full Article" CTA 버튼 (구독자 language에 맞는 URL로)
  - Unsubscribe 링크 (필수)
  - List-Unsubscribe 헤더 포함

#### 구독 해지
- 모든 알림 이메일 하단에 one-click unsubscribe 링크
- /unsubscribe?token={token} → 즉시 해지 + 확인 페이지
- List-Unsubscribe 헤더로 Gmail 등에서 자동 해지 버튼 지원

#### 어드민 구독자 관리 UI
- 통계 카드: 전체 구독자, 활성, 미확인(pending), 해지
- 구독자 목록: 이메일, 이름, 언어, 카테고리, 구독일, 상태
- 검색 + 필터 (상태별, 언어별, 카테고리별)
- CSV 내보내기 버튼
- 알림 발송 이력 (notification_log)

---

## 공통 규칙

1. 파일 충돌 방지: 위 파일 분배를 엄격히 지킬 것. keystatic.config.ts는 Teammate 3만 수정.
2. 코딩 스타일: TypeScript, 2칸 들여쓰기, 작은따옴표
3. UI 일관성: 기존 BRITZMEDI 어드민 디자인 시스템 따를 것 (다크 테마, 골드 액센트)
4. AEO 최적화: 모든 블로그 콘텐츠에 JSON-LD schema, FAQ schema 필수
5. 다국어: 새로 추가되는 UI 텍스트는 전부 i18n 키로 작성, 8개 언어 번역 포함
6. 에러 핸들링: API 호출 실패 시 재시도 로직 + 사용자 친화적 에러 메시지

각 teammate가 작업 완료하면 개별적으로 git commit해줘. 커밋 메시지 형식:
- Teammate 1: feat(blog-ui): ...
- Teammate 2: feat(doc2blog): ...
- Teammate 3: feat(scheduled): ...
- Teammate 4: feat(subscriber): ...
