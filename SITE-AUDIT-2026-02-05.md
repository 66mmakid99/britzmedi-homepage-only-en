# BRITZMEDI 사이트 종합 감사 리포트

**작성일:** 2026-02-05
**대상:** britzmedi.com (Astro 5.x + Cloudflare Pages)
**지원 언어:** EN, JA, ZH, TH, VI, ES, FR, RU, AR (9개)

---

## 요약 대시보드

| 영역 | 등급 | 주요 이슈 |
|------|------|-----------|
| SEO | **A-** | sitemap 언어 설정 불일치, Breadcrumb/Product JSON-LD 누락 |
| 콘텐츠 | **B+** | 리소스 8개 Placeholder URL, 번역은 완벽 |
| 성능 | **B** | 404 페이지 누락, 이미지 width/height 미설정 |
| 보안 | **C+** | 보안 헤더 누락, 관리자 인증 취약 |

---

## 1. SEO 감사

### 1.1 메타 태그 (Title / Description) ✅ 우수

- `SEOHead.astro` 공용 컴포넌트가 모든 페이지에 적용
- 모든 페이지에 고유한 `<title>`, `<meta name="description">`, `<meta name="keywords">` 설정됨
- 다국어 페이지: `[lang]/index.astro`에 8개 언어별 SEO 타이틀/설명 구현

### 1.2 Open Graph / Twitter Card ✅ 우수

- `og:type`, `og:url`, `og:title`, `og:description`, `og:image` (1200x630) 완비
- `og:locale`, `og:site_name` 설정됨
- Twitter: `summary_large_image` 카드 타입
- 블로그: `article:published_time`, `article:author`, `article:tag` 등 추가 OG 태그

### 1.3 Sitemap ⚠️ 수정 필요

- Astro sitemap 플러그인으로 자동 생성됨
- `robots.txt`에서 sitemap-index.xml 참조

**문제:** `astro.config.mjs`의 sitemap i18n 설정이 현재 언어 구성과 불일치
- 현재 설정: en, **ko**, ja, zh, th, vi, es, ar (8개) — `ko` 포함, `fr`/`ru` 누락
- 실제 지원: en, ja, zh, th, vi, es, **fr**, **ru**, ar (9개)
- **조치:** `astro.config.mjs` sitemap locales에서 `ko` 제거, `fr`/`ru` 추가

### 1.4 robots.txt ✅ 정상

```
User-agent: *
Allow: /
Crawl-delay: 1
Disallow: /api/
Disallow: /keystatic
Disallow: /_astro/
Sitemap: https://britzmedi.com/sitemap-index.xml
```

### 1.5 구조화 데이터 (JSON-LD) ⚠️ 부분 구현

| 스키마 | 상태 | 위치 |
|--------|------|------|
| MedicalOrganization | ✅ 구현됨 | BaseLayout.astro |
| Article + Blog | ✅ 구현됨 | blog/[slug].astro, blog/index.astro |
| FAQPage | ✅ 구현됨 | blog/[slug].astro (FAQ 있는 글만) |
| **BreadcrumbList** | ❌ **누락** | 시각적 breadcrumb만 있고 JSON-LD 없음 |
| **Product** | ❌ **누락** | 제품 상세 페이지에 Product 스키마 없음 |

### 1.6 Canonical URL ✅ 우수

- `SEOHead.astro`에서 모든 페이지에 자동 생성
- custom canonicalUrl prop 오버라이드 지원

### 1.7 hreflang 태그 ⚠️ 부분 구현

- `SEOHead.astro`에서 `supportedLanguages` 기반 자동 생성
- `x-default` → English 설정됨

**문제:**
- 영문 기본 페이지(`/about`, `/products` 등)에서 hreflang 태그가 생성되지만, sitemap 설정 불일치로 검색엔진 혼란 가능
- **조치:** sitemap i18n 설정을 config.ts와 동기화

### 1.8 기타 SEO ✅

- Google Search Console 인증 메타태그 ✅
- Google Analytics 4 (G-0G1PVS4XCN) ✅
- Geo 태그 (KR-41, Seongnam-si) ✅
- DNS prefetch / preconnect ✅

---

## 2. 콘텐츠 감사

### 2.1 내부 링크 ✅ 정상

- Header, Footer 네비게이션 모든 링크 유효
- 9개 언어 라우트 모두 정상 생성 확인

### 2.2 번역 누락 ✅ 완벽

- 9개 언어 파일 모두 `TranslationKeys` 타입 인터페이스 완전 구현
- 누락된 번역 키 없음
- product-translations.ts도 모든 언어 포함

### 2.3 Placeholder / TODO ⚠️ 수정 필요

**리소스 Placeholder URL 8개** (`src/content/resources.ts`):

| 줄 | 리소스 | URL |
|----|--------|-----|
| 54 | NEWCHAE SHOT Brochure | `PLACEHOLDER` |
| 78 | TORR RF Spec Sheet | `PLACEHOLDER` |
| 113 | Company Presentation | `PLACEHOLDER` |
| 123 | TORR RF Product Images | `PLACEHOLDER` |
| 176 | ISO 13485 Certificate | `PLACEHOLDER` |
| 185 | GMP Certificate | `PLACEHOLDER` |
| 196 | TORR RF Demo Video | `PLACEHOLDER` |
| 207 | Company Intro Video | `PLACEHOLDER` |

**TODO 1개** (`src/components/features/LeadForm.astro:231`):
```
const EMAILJS_TEMPLATE_ID = 'template_azmskha'; // TODO: Create new template_leadform
```

### 2.4 이미지 누락 ✅ 정상

- 모든 제품 이미지(21+ WebP) 존재 확인
- Hero, 로고, 파비콘 모두 정상

### 2.5 빈 페이지 / 스텁 ✅ 없음

- 모든 페이지에 실질적 콘텐츠 존재
- "Coming Soon"은 LUMINO WAVE 제품(2026 H2 출시 예정)에만 — 의도적

---

## 3. 성능 감사

### 3.1 이미지 최적화

| 항목 | 상태 | 상세 |
|------|------|------|
| WebP 사용 | ✅ | 21개 제품/히어로 이미지 WebP 변환 완료 |
| PNG 잔여 | ⚠️ | 로고 2개만 (허용 범위) |
| width/height 속성 | ❌ **누락** | 대부분 `<img>` 태그에 미설정 → CLS 유발 |
| lazy loading | ⚠️ 부분 | 갤러리 이미지만 적용, 제품 목록/홈페이지 미적용 |
| 대용량 파일 | ✅ | 500KB 초과 파일 없음 |

**수정 필요 파일:**
- `src/pages/index.astro` — 히어로 이미지 width/height 추가
- `src/pages/products/[id].astro` — 메인/갤러리 이미지 width/height 추가
- `src/pages/products/index.astro` — 제품 카드 이미지 `loading="lazy"` 추가

### 3.2 404 페이지 ❌ 누락

- `src/pages/404.astro` 파일 없음
- 존재하지 않는 URL 접근 시 Astro 기본 에러 페이지 노출
- **조치:** 브랜드 404 페이지 생성 필요

### 3.3 모바일 반응형 ✅ 우수

- viewport 메타태그 정상 설정
- Tailwind 반응형 breakpoint 전체 활용 (`sm:`, `md:`, `lg:`, `xl:`)
- 모바일 메뉴: 슬라이드 패널 + 오버레이 + Escape 키 지원 + ARIA 접근성

### 3.4 폰트 로딩 ✅ 최적화됨

- Google Fonts (Inter) — preload + `font-display: swap`
- DNS prefetch + preconnect 설정
- FOIT 방지 완료

### 3.5 외부 스크립트

| 스크립트 | 로딩 방식 | 영향 |
|----------|-----------|------|
| Google Analytics | `async` | 낮음 ✅ |
| Consent Manager | **동기(sync)** | **중간 ⚠️ — 렌더링 차단 가능** |
| Google Fonts | preload + stylesheet | 낮음 ✅ |
| EmailJS | 동적 로딩 (폼 있을 때만) | 낮음 ✅ |

**조치:** Consent Manager 스크립트에 `async` 속성 추가 권장

### 3.6 비디오

- `homepage.json`에서 `/videos/hero-bg.mp4` 참조하나 실제 파일 미존재
- 이미지 fallback으로 정상 동작 중
- 비디오 추가 시 WebM 포맷 병행 및 5MB 이하 권장

### 3.7 Core Web Vitals ✅

- `WebVitals.astro` 컴포넌트로 LCP, FID/INP, CLS, TTFB 모니터링
- Google Analytics 연동 리포팅

---

## 4. 보안 / 도메인 감사

### 4.1 HTTPS / www 리다이렉트 ⚠️ 설정 누락

- `public/_redirects` 파일 없음
- HTTP → HTTPS 리다이렉트 미설정 (Cloudflare 대시보드에서 "Always Use HTTPS" 확인 필요)
- www → non-www 리다이렉트 미설정

**조치:** Cloudflare Pages 대시보드에서 확인하거나 `_redirects` 파일 추가

### 4.2 보안 헤더 ❌ 누락

- `public/_headers` 파일 없음
- 누락된 주요 헤더:
  - `Content-Security-Policy` (CSP)
  - `Strict-Transport-Security` (HSTS)
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`

**조치:** `public/_headers` 파일 생성 필요 (아래 권장 설정)

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 4.3 API 키 관리 ⚠️ 주의

- `.env`는 `.gitignore`에 포함되어 git 추적 안 됨 ✅
- `.env.example`에 실제 값 없이 placeholder만 있음 ✅
- EmailJS 공개키는 프론트엔드 노출 — EmailJS 설계상 정상

**권장:**
- API 키 정기 로테이션 체계 마련
- 프로덕션 키는 Cloudflare Dashboard 환경변수로만 관리

### 4.4 관리자 인증 ⚠️ 개선 필요

| 항목 | 현재 상태 | 권장 |
|------|-----------|------|
| 비밀번호 저장 | 평문 비교 | bcrypt 해싱 |
| 세션 토큰 | 고정값 (secret 재사용) | crypto.randomBytes 사용 |
| 세션 만료 | 7일 | 24시간으로 단축 |
| 로그인 시도 제한 | 없음 | 5회 실패 → 15분 잠금 |
| CSRF 보호 | 없음 | 토큰 검증 추가 |
| 2FA/MFA | 없음 | 장기적 도입 권장 |

### 4.5 폼 보안

**잘된 점:**
- 리드폼: 개인 이메일 차단 (Gmail, Yahoo 등) ✅
- 리드폼: 일회용 이메일 필터링 ✅
- API: 파라미터화된 쿼리 (SQL 인젝션 방지) ✅
- 챗봇: XSS/SQL 인젝션 패턴 감지 ✅
- 챗봇: IP 기반 레이트 리밋 (10회/분, 60회/시) ✅

**개선 필요:**
- 리드폼 `/api/leads` 엔드포인트: 레이트 리밋 없음
- 리드폼: CSRF 토큰 미적용
- 챗봇 레이트 리밋: 인메모리 저장 (서버 재시작 시 초기화)

### 4.6 CORS ⚠️

- API 라우트에 CORS 헤더 미설정
- Cloudflare Pages 기본 same-origin 정책에 의존 중

---

## 조치 우선순위

### 즉시 (이번 주)

| # | 항목 | 파일 | 난이도 |
|---|------|------|--------|
| 1 | `astro.config.mjs` sitemap 언어 설정 수정 (ko→fr,ru) | astro.config.mjs | 쉬움 |
| 2 | `public/_headers` 보안 헤더 파일 생성 | public/_headers | 쉬움 |
| 3 | 404 페이지 생성 | src/pages/404.astro | 쉬움 |
| 4 | 이미지 width/height 속성 추가 | products/[id].astro, index.astro | 쉬움 |
| 5 | Consent Manager 스크립트 `async` 추가 | BaseLayout.astro | 쉬움 |

### 단기 (1-2주)

| # | 항목 | 파일 | 난이도 |
|---|------|------|--------|
| 6 | 리소스 Placeholder URL 8개 실제 링크로 교체 | resources.ts | 쉬움 |
| 7 | 제품 상세 페이지 Product JSON-LD 추가 | products/[id].astro | 보통 |
| 8 | Breadcrumb JSON-LD 추가 | products/[id].astro, blog/[slug].astro | 보통 |
| 9 | 리드폼 레이트 리밋 추가 | api/leads/index.ts | 보통 |
| 10 | 제품 목록 이미지 lazy loading | products/index.astro | 쉬움 |

### 중기 (2-4주)

| # | 항목 | 파일 | 난이도 |
|---|------|------|--------|
| 11 | 관리자 비밀번호 bcrypt 해싱 | api/admin/login.ts | 보통 |
| 12 | 세션 토큰 랜덤 생성 + 만료 단축 | api/admin/login.ts | 보통 |
| 13 | CSRF 토큰 구현 | LeadForm.astro, api/ | 보통 |
| 14 | 챗봇 레이트 리밋 KV 저장소 전환 | api/chat.ts | 보통 |
| 15 | HTTPS/www 리다이렉트 확인 및 설정 | Cloudflare Dashboard | 쉬움 |

---

## 참고: OptimizedImage 컴포넌트

`src/components/ui/OptimizedImage.astro` 컴포넌트가 존재하지만 대부분 페이지에서 직접 `<img>` 태그 사용 중. 일관된 이미지 최적화를 위해 이 컴포넌트 활용 확대 권장.

---

*리포트 생성: 2026-02-05 | 도구: Claude Code 자동 감사*
