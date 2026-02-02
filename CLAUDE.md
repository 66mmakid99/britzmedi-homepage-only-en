# BRITZMEDI Global Website Project

## Project Vision

**"정적 카탈로그 → AI 검색 시대의 24/7 글로벌 세일즈 플랫폼"**

### 전략
1. BRITZMEDI 웹사이트로 성과 증명 (AEO/GEO 최적화)
2. 성공사례 만들기 (6개월)
3. SaaS 빌더로 확장 → 해외영업 기업에 판매

### 32주 로드맵
- P1 (1-4주): 기본 구축, CMS, 리드 폼 ✅
- P2 (5-8주): AEO 콘텐츠, 블로그 ✅
- P3 (9-12주): 리드 자동화, AI 조사 ✅
- P4 (13-16주): AI 챗봇, SNS 연동 ✅
- P5 (17-20주): 최적화, 대시보드 ✅
- P6 (21-24주): 성과 검증
- P7 (25-32주): SaaS 빌더 MVP

### 현재 Phase: P5 완료 (Week 17-20)
- [x] Keystatic 스키마 + 블로그 컬렉션
- [x] Admin 인증 시스템 (Basic Auth)
- [x] 다국어 기본 구조 (8개 언어)
- [x] ~~테마 시스템 (다크모드)~~ → 라이트모드 전용으로 변경 (2026-02-03)
- [x] 블로그 시스템 + TL;DR
- [x] D1 리드 저장 + Lead Score
- [x] Slack 알림
- [x] AI 챗봇 (Claude Sonnet 4) - 개선됨 (2026-02-03)
- [x] Core Web Vitals 최적화
- [x] SEO 메타태그 강화

---

## 리드 폼 필수 7개 필드

| 필드 | 타입 | 검증 | AI 조사 활용 |
|------|------|------|-------------|
| Company Name | Text | Required | 웹검색 키워드 |
| Company Website | URL | URL형식 + 접속확인 | 업종, 규모, 서비스 파악 |
| Your Name | Text | Required | LinkedIn 검색 |
| Job Title | Text | Required | 의사결정권 판단 |
| Business Email | Email | 회사도메인 필수 | 도메인으로 회사 확인 |
| Country | Dropdown | ISO 국가코드 | 시장/규제 파악 |
| Interested In | Checkbox | 1개 이상 | 영업 방향 |

---

## Tech Stack

### Frontend
- **Framework**: Astro 5.x + React 19
- **Styling**: Tailwind CSS 4.x (Light mode only)
- **CMS**: Keystatic (Git-based)
- **Search**: Pagefind

### Backend
- **Hosting**: Cloudflare Pages
- **API**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare KV

### External APIs
- **AI Chatbot**: Claude API (Sonnet 4) - 업그레이드됨
- **Lead Enrichment**: Claude API + Web Search
- **Translation**: DeepL API (8 languages)
- **Email**: EmailJS / Resend

---

## Folder Structure

```
britzmedi-global/
├── src/
│   ├── pages/           # 페이지 라우팅
│   │   ├── api/         # API 엔드포인트 (leads, chat)
│   │   ├── admin/       # 관리자 페이지 (leads dashboard)
│   │   └── blog/        # 블로그 페이지
│   ├── components/      # 재사용 컴포넌트
│   │   ├── layout/      # Header, Footer
│   │   ├── ui/          # Button, Form, LanguageSwitcher
│   │   ├── features/    # LeadForm, Chatbot
│   │   └── seo/         # SEOHead, WebVitals
│   ├── layouts/         # BaseLayout, BlogLayout
│   ├── content/         # Keystatic 콘텐츠
│   │   ├── products/    # 제품 데이터
│   │   ├── blog/        # 블로그 포스트
│   │   └── pages/       # 정적 페이지
│   ├── data/            # 정적 데이터 파일
│   │   ├── chatbot-knowledge.md  # 챗봇 지식베이스
│   │   └── countries.ts          # 국가 목록
│   ├── i18n/            # 다국어 시스템 (8개 언어)
│   ├── lib/             # 유틸리티 함수
│   │   ├── db/          # D1 스키마
│   │   ├── lead-score.ts
│   │   └── slack.ts
│   └── styles/          # global.css
├── public/              # 정적 파일
├── keystatic.config.ts  # CMS 설정
├── astro.config.mjs     # Astro 설정
└── CLAUDE.md            # 이 파일
```

---

## Coding Standards

### 파일 명명
- Components: `PascalCase.astro` (예: `LeadForm.astro`)
- Pages: `kebab-case.astro` (예: `about-us.astro`)
- Utils: `camelCase.ts` (예: `formatDate.ts`)

### 코드 스타일
- 들여쓰기: 2칸
- 세미콜론: 사용
- 따옴표: 작은따옴표 (')
- 언어: TypeScript 우선

### 커밋 메시지
```
feat: 새 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드, 설정 변경
```

---

## 구현된 핵심 기능

### 1. AEO/GEO 최적화 콘텐츠 ✅
- FAQ Schema 적용
- TL;DR 섹션
- 구조화된 데이터 (JSON-LD)
- AI가 인용하기 좋은 형식

### 2. AI 챗봇 (Claude Sonnet 4) ✅ - 2026-02-03 업그레이드
- 제품 문의 응대
- 파트너십 안내
- Fallback 응답 시스템
- 제품별 컨텍스트 주입
- **외부 지식베이스 파일** (`src/data/chatbot-knowledge.md`)
- **자연스러운 대화체** (마크다운 포맷팅 최소화)
- **스팸 방지**: 반복 질문 3회 차단
- **보안**: 의심 패턴 감지 + "I'm not a robot" 인증
- **비용 모니터링**: 월간 API 토큰 사용량 로깅

### 3. 리드 관리 시스템 ✅
- D1 데이터베이스 스키마
- Lead Score 알고리즘 (0-100, A/B/C/D 등급)
- 리드 대시보드 (/admin/leads)
- Slack 웹훅 알림
- **Contact 폼 링크 자동 안내**

### 4. 다국어 지원 ✅
- 8개 언어: EN, KO, ZH, JA, ES, PT-BR, DE, AR
- 언어 스위처 컴포넌트
- hreflang 태그

### 5. 성능 최적화 ✅
- Core Web Vitals 모니터링
- 이미지 최적화 컴포넌트
- DNS prefetch, preconnect
- Font loading 최적화

### 6. UI/UX ✅ - 2026-02-03 업데이트
- **라이트모드 전용** (다크모드 제거)
- 일관된 디자인 시스템
- 모바일 반응형

---

## 성공 지표 (6개월)

| 지표 | 현재 | 목표 |
|------|------|------|
| AI 검색 노출 | 0 | ChatGPT/Perplexity 언급 |
| 월간 방문자 | 1,000 | 15,000 |
| 월간 리드 | 5 | 100 |
| 리드→미팅 전환 | 10% | 30% |

---

## Commands

```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# 프리뷰
npm run preview

# 테스트
npm run test

# Keystatic Admin
# http://localhost:4321/keystatic
```

---

## References

- Masterplan: Claude.ai 대화 기록 참조
- GitHub: 66mmakid99/britzmedi-homepage-only-en
- Deploy: britzmedi-homepage-only-en.pages.dev
- Keystatic: /keystatic

---

## Important Notes

1. **빌더화 설계**: 모든 설정은 하드코딩 ❌ → config 파일로
2. **Multi-tenant 준비**: tenant_id 고려
3. **개인 이메일 차단**: gmail, yahoo 등 리드 폼에서 경고
4. **API 키 관리**: 환경변수 사용 (.env)
5. **다크모드 제거됨**: 라이트모드만 지원 (2026-02-03)

---

## 개발 이력 (Development History)

### 2026-02-03 - AI 챗봇 고도화 및 UI 최적화

#### 변경 사항

| 커밋 | 설명 |
|------|------|
| `deeb864` | 챗봇 응답 자연스럽게 개선 (마크다운 최소화) |
| `dec0049` | 지식베이스 외부 파일로 분리 (`chatbot-knowledge.md`) |
| `20ffb17` | Contact 폼 링크 (`/contact`) 자동 안내 |
| `67d8d3f` | 반복 질문 3회 연속 차단 기능 |
| `2cdd4d1` | 의심 패턴 감지 + "I'm not a robot" 인증 |
| `b61b406` | 월간 API 비용 모니터링 로그 |
| `6d95434` | Header 다크모드 제거 |
| `5b9742d` | 전체 다크모드 제거, 라이트모드 전용 |

#### 테스트 결과

| # | 테스트 항목 | 결과 |
|---|------------|------|
| 1 | 빌드 성공 | ✅ Pass |
| 2 | 챗봇 기본 응답 | ✅ Pass |
| 3 | 가격 문의 → /contact 안내 | ✅ Pass |
| 4 | 반복 질문 차단 | ✅ Pass |
| 5 | XSS 공격 차단 | ✅ Pass |
| 6 | 지식베이스 정확성 | ✅ Pass |
| 7 | dark: 클래스 완전 제거 | ✅ Pass |

#### 파일 변경 목록

**신규 파일:**
- `src/data/chatbot-knowledge.md` - 챗봇 지식베이스

**삭제 파일:**
- `src/components/ui/ThemeToggle.astro` - 다크모드 토글 제거

**수정 파일:**
- `src/pages/api/chat.ts` - 챗봇 API 전면 개선
- `src/components/features/Chatbot.tsx` - 인증 버튼 추가
- `src/components/features/LeadForm.astro` - 다크모드 제거
- `src/components/layout/Header.astro` - 다크모드 제거
- `src/styles/global.css` - 다크모드 CSS 제거
- 외 10개 페이지 파일 다크모드 클래스 제거

---

*Last Updated: 2026-02-03*
