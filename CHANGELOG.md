# Changelog

All notable changes to the BRITZMEDI Global Website project.
Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [2026-05-24]

### Added
- AI draft email: new lead → Claude generates personalized follow-up → Gmail 임시보관함 저장 + 알림 메일

## [2026-02-20]

### Added
- Content Pipeline 관리자 UI (`/admin/content-pipeline`)
  - KPI 카드 (Queued, Processing, Published, Review, Failed, Avg Score)
  - 키워드 추가 폼 (단일 + 배치 모드)
  - 큐 테이블 (상태 배지, 프로세스/재시도/삭제 액션, 로그 확장)
  - Process All 버튼 (순차 실행 + 진행률 표시)
  - 배치 큐 API (`/api/admin/content-pipeline/batch`)
- AEO/GEO 모니터링 시스템 (`/admin/aeo-monitor`)
  - Claude web_search로 10개 쿼리 BRITZMEDI 언급 확인
  - D1 `aeo_checks` 테이블 (트렌드 추적)
  - 원형 진행률 그래프 + 결과 테이블 + 트렌드 표시
  - "Add to Pipeline" 버튼 (미언급 쿼리 → 콘텐츠 파이프라인 연결)
- 사이드바 네비게이션: Content 그룹에 Pipeline, Marketing 그룹에 AEO Monitor 추가

## [2026-02-12]

### Changed
- 제품 데이터를 `products.ts` 하드코딩에서 Keystatic CMS 콘텐츠 파일로 마이그레이션
  - 4개 제품 JSON 파일 생성 (`src/content/products/*/index.json`)
  - `products.ts`가 `import.meta.glob`으로 JSON 읽도록 변경 (SSR 호환)
  - Keystatic 스키마에 handpieces, differentiators, handpieceImages 필드 추가
  - `/keystatic` 관리자에서 제품 이미지+텍스트 편집 가능

### Fixed
- Site Editor 제품 이미지 프로덕션 미반영 (KV config에 imageOverrides 저장 + 타임스탬프 파일명)
- Hero 섹션 모바일 스택 레이아웃 (이미지 상단 + 텍스트 하단 분리, iPhone 14 Pro 기준)
- Content Preview 빈 페이지 (D1 세션 체크 중복 제거, KV 미들웨어 통일)
- www → non-www 301 리다이렉트 (`_redirects` + Cloudflare Page Rule)
- `/ko/*` 경로 404 → 영문 리다이렉트 (Korean not in supported languages)
- 챗봇 미답변 질문 정중한 거절 응답 (한국어 rule 11-12 추가)
- 챗봇 모바일 높이 안정성 (useRef 기반, useState 대신)

## [2026-02-11]

### Added
- GA4 Analytics 대시보드 실제 데이터 연결 (`/api/admin/analytics/traffic`)
- 홈페이지 SSR 전환 — KV에서 실시간 config 로드
- Content Hub Markdown 출력 강제 + 미리보기 개선
- UptimeRobot 모니터링 6개 URL 등록 (외부)

### Fixed
- 챗봇 한국어 fallback 응답 추가 (11개 카테고리 키워드)
- 챗봇 모바일 UI bottom sheet + 언어 감지
- 챗봇 로봇 체크 임계값 10회로 상향
- Hero 섹션 데스크톱 고정 높이 + 원본 이미지 복원
- Hero 이미지 로딩 최적화 + 반응형 레이아웃
- Contact 페이지 업데이트 (이메일, 웹사이트 필드 제거, 정적 지도 카드)
- Admin 리다이렉트 추가 + sitemap worker 라우팅 제외
- 소셜 미디어 연결 안정성 및 상태 UI 개선

### Changed
- Hero 배경: 기기 클로즈업 → 모델 사진으로 교체
- Google Maps: iframe → 정적 지도 카드 (회색 박스 이슈 해결)

## [2026-02-10]

### Added
- **Admin Redesign Phase 1-5 완료**
  - Phase 1: 사이드바 구조 변경, 설정 페이지, Analytics placeholder, All Content 테이블
  - Phase 2: Content Editor (TipTap WYSIWYG + FAQ + 발행/수정/삭제)
  - Phase 3: Leads CRM 파이프라인 (칸반 뷰, 상세 사이드바, 활동 이력)
  - Phase 4: Analytics 대시보드 (GA4 placeholder, GSC 쿼리, SEO Growth)
  - Phase 5: 소셜 토큰 갱신, 대시보드 KPI 카드, 레거시 페이지 정리
- SEO Intelligence System: 경쟁 키워드 100개 + Progress Tracker UI
- D1 migration 0012: `content_items`, `content_revisions` 테이블
- D1 migration 0013: CRM 컬럼 (`priority`, `lost_reason` 등) + `lead_activities` 테이블
- Content Hub API: generate, publish, transition, quality-check, items CRUD
- Leads CRM API: PUT /api/leads/[id] (CRM 필드), GET/POST activity
- 소셜 토큰 갱신: POST /api/admin/social/refresh
- 대시보드 API: GET /api/admin/dashboard
- Homepage Editor: 뷰포트 스위처 + inline React 프리뷰 (iframe 대체)
- Homepage Editor: 프로덕션 지원 (KV + GitHub commit)

### Fixed
- 홈페이지 모바일 간격 과다 — `clamp()` + `!important`
- RTL 언어 드롭다운 + 모바일 메뉴 지원
- 챗봇 LTR 강제 (RTL 페이지), 할루시네이션 방지 강화

### Removed
- 레거시 Admin 페이지: youtube-to-blog/, blog-manager/, subscribers/, homepage.astro, health.astro, activity.astro, resources.astro

## [2026-02-09]

### Added
- Content Hub 시스템 (워크플로우 파이프라인 + 품질 체크)
- SNS 플랫폼별 포맷 + 통합 배포 워크플로우
- X/Twitter API v2 + LinkedIn OAuth 2.0 + Instagram Graph API 연동
- Admin 사이드바 리뉴얼 + Health Check + Activity Log + Dashboard
- Blog SVG 대표 이미지 5개, Schema.org 업데이트
- Slack 알림 + Lead Scoring + AI Research API 연결
- 뉴스 시스템 (프론트엔드 + 홈페이지)
- Image Crop Tool + 자동 WebP 최적화 (Homepage Editor)

### Fixed
- 제품 카드 이미지 홈페이지 표시
- Hero full-bleed + gradient overlay
- Blog TL;DR 필드 + 프랑스어 번역 악센트
- QA 감사 종합 수정

## [2026-02-08]

### Added
- SEO 블로그 기사 6개 (FAQ Schema 포함)
- Related Resources 섹션 (blog)

### Changed
- Blog 레이아웃 리디자인 (가독성, 다중 이미지)
- Blog 큐레이션: 품질 기사 유지, 중복 제거

### Fixed
- 제품 이미지 최적화 (21MB → 30KB, WebP)
- 홈페이지 제품 이미지 + 모바일 반응형 + hero blending

## [2026-02-07]

### Added
- 문서→블로그 파이프라인 (PDF/DOCX/PPTX + 이름 로마자 변환)
- 예약 발행 시스템 + Admin Blog Manager
- 이메일 구독 시스템 + Admin 관리 페이지
- 소셜 미디어 자동 포스팅 시스템
- 블로그 "TORR RF Lifting: In-Depth Review" 발행

### Fixed
- 블로그 제목/설명/카테고리 다국어 번역
- 의사 이름 추출 (subtitle 우선, verified 상태)

## [2026-02-06]

### Added
- YouTube to Blog 자동화 시스템 + Admin 대시보드
- Blog 미리보기 페이지
- Admin 인증 rate limiting

### Fixed
- YouTube 트랜스크립트 추출 (CF Workers 호환)
- Claude streaming API (30s 타임아웃 회피)
- GitHub API 403 (User-Agent 헤더)
- Stuck jobs: retry + cleanup
- 리다이렉트 순서 + SSR `[object Object]` 수정

## [2026-02-05]

### Added
- i18n 8개 언어 (en, ja, zh, th, vi, es, fr, ru, ar)
- 제품 상세 페이지 7개 언어 번역
- Homepage Visual Editor + 챗봇 확장 모드
- 리소스 다운로드 추적
- Google Search Console 인증

### Fixed
- Cloudflare 런타임 환경변수 인증
- D1 + KV 바인딩 설정

## [2026-02-04]

### Added
- 챗봇 후속 질문 제안 + Rate limiting
- 다국어 라우팅 (7개 언어)
- DeepL 번역 API 연동

## [2026-02-03]

### Added
- P1-P5 핵심 기능 일괄 구현 (Admin 인증, 블로그, 리드 관리, 챗봇, SEO)
- 챗봇 Sonnet 모델 + 외부 지식베이스 (`chatbot-knowledge.md`)
- 반복 질문 차단, 의심 패턴 감지, API 비용 로깅
- AdminLayout + Admin 인증 + Lead API + D1 통합

### Fixed
- 챗봇: 자연스러운 대화체, circular JSON, 스크롤 블리딩

### Removed
- Tawk.to 제거 (Claude 챗봇 전용)
- 다크모드 완전 제거 (라이트모드 전용)

## [2026-01-26]

### Added
- 제품 이미지 + 브랜드 에셋 + 갤러리
- ULBLANC 제품 이미지

### Changed
- 이미지 WebP 변환, 다크모드 클래스 제거 시작

## [2026-01-25] — v1.1.0

### Added
- FAQ 페이지 (18개 질문, 5개 카테고리, FAQ Schema)
- Resources 다운로드 센터 (Google Drive)
- Hero 섹션 (비디오/이미지/그라디언트 배경 지원)
- Email 유효성 검사 (일회용 도메인 차단, 오타 감지)
- 전화번호 국제 포맷 (20개 국가)
- Google Analytics 4 + Consent Mode v2
- Keystatic CMS + Publisher Agent
- Privacy Policy + Terms of Service
- TORR RF 리소스, FDA/Korea 인증서, ULBLANC 브로셔

## [2026-01-24] — v1.0.0

### Added
- BRITZMEDI 영문 전용 글로벌 웹사이트 초기 릴리스
- 페이지: Home, About, Products (4개), Certifications, Contact
- EmailJS 컨택 폼, 반응형 디자인, SEO 메타태그
- Cloudflare Pages 배포
