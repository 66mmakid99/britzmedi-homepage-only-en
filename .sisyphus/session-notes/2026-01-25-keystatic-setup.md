# BRITZMEDI-GLOBAL: Keystatic CMS 설치 및 퍼블리셔 에이전트 구축

**세션 시작**: 2026-01-25
**프로젝트**: britzmedi-global (Astro + Cloudflare Pages)
**작업 디렉토리**: `C:\Users\J\Projects\britzmedi-global`

---

## 📋 세션 컨텍스트 요약

### 프로젝트 현황
- **기술 스택**: Astro 5.x + Tailwind CSS 4.x + React 19.x
- **배포**: Cloudflare Pages
- **목적**: BRITZMEDI 의료기기 글로벌 웹사이트 (영문 전용)

### 발견된 문제점
1. ❌ **리소스 파일 PLACEHOLDER** - `src/content/resources.ts`의 12개 Google Drive URL이 PLACEHOLDER
2. ❌ **어드민 패널 없음** - 비개발자가 콘텐츠 수정 불가능
3. ❌ **backend/ 디렉토리 오염** - medchecker 프로젝트 코드가 잘못 복사됨
4. ❌ **퍼블리셔 에이전트 없음** - 프론트엔드 개선 및 관리 자동화 필요

### 완료된 작업
- ✅ 프로젝트 구조 분석 완료
- ✅ CMS 솔루션 조사 완료 (Keystatic 선정)
- ✅ 작업 계획 수립 완료

---

## 🎯 작업 목표 (이번 세션)

### Phase 1: Keystatic CMS 설치
- [ ] Keystatic 패키지 설치
- [ ] `keystatic.config.ts` 생성
- [ ] Astro config 업데이트
- [ ] 콘텐츠 컬렉션 마이그레이션
- [ ] 로컬 테스트

### Phase 2: 퍼블리셔 에이전트 정의
**역할**: 
- 프론트엔드 개선점 자동 탐지
- 메뉴 추가/변경 시 기존 사이트 무결성 보장
- 코드 품질 및 일관성 유지
- 자동화된 검증 및 제안

**구현 방향**:
- 정적 분석 도구 통합
- 자동화된 테스트 스크립트
- 변경 사항 검증 워크플로우

### Phase 3: 빌드 및 배포
- [ ] 로컬 빌드 테스트
- [ ] Cloudflare Pages 배포
- [ ] `/keystatic` 경로 보호 설정

---

## 📂 프로젝트 구조

```
britzmedi-global/
├── src/
│   ├── content/              # 콘텐츠 파일 (TypeScript)
│   │   ├── certifications.ts # 인증 정보
│   │   ├── company.ts        # 회사 정보
│   │   ├── faq.ts            # FAQ
│   │   ├── hero.ts           # 히어로 섹션
│   │   ├── products.ts       # 제품 카탈로그
│   │   └── resources.ts      # 리소스 (PLACEHOLDER 문제)
│   ├── pages/                # Astro 페이지
│   │   ├── index.astro       # 홈
│   │   ├── about.astro       # 회사 소개
│   │   ├── contact.astro     # 문의
│   │   ├── faq.astro         # FAQ
│   │   ├── certifications.astro
│   │   ├── resources.astro
│   │   └── products/
│   ├── components/           # UI 컴포넌트
│   │   ├── layout/
│   │   ├── sections/
│   │   └── ui/
│   └── layouts/
├── public/
│   ├── images/
│   └── robots.txt
├── backend/                  # ⚠️ 정리 필요 (medchecker 코드)
├── data/                     # 데이터 디렉토리
├── package.json
├── astro.config.mjs
└── tsconfig.json
```

---

## 🔧 Keystatic CMS 설치 계획

### 1. 패키지 설치
```bash
npx astro add react markdoc
npm install @keystatic/core @keystatic/astro
```

### 2. Astro Config 업데이트
```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import markdoc from '@astrojs/markdoc'
import keystatic from '@keystatic/astro'
import cloudflare from '@astrojs/cloudflare'

export default defineConfig({
  integrations: [react(), markdoc(), keystatic()],
  output: 'hybrid', // Keystatic 사용 시 필요
  adapter: cloudflare()
})
```

### 3. Keystatic Config 생성
```typescript
// keystatic.config.ts
import { config, collection, fields } from '@keystatic/core'

export default config({
  storage: { kind: 'local' },
  collections: {
    products: collection({
      label: 'Products',
      slugField: 'name',
      path: 'src/content/products/*',
      format: { contentField: 'description' },
      schema: {
        name: fields.slug({ name: { label: 'Product Name' } }),
        model: fields.text({ label: 'Model' }),
        tagline: fields.text({ label: 'Tagline' }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Medical Device', value: 'medical-device' },
            { label: 'Cosmetic', value: 'cosmetic' }
          ],
          defaultValue: 'medical-device'
        }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Available', value: 'available' },
            { label: 'Coming Soon', value: 'coming-soon' }
          ],
          defaultValue: 'available'
        }),
        featured: fields.checkbox({ label: 'Featured' }),
        overview: fields.text({ label: 'Overview', multiline: true }),
        description: fields.markdoc({ label: 'Description' }),
        // ... 추가 필드
      }
    }),
    faq: collection({
      label: 'FAQ',
      slugField: 'question',
      path: 'src/content/faq/*',
      schema: {
        question: fields.slug({ name: { label: 'Question' } }),
        answer: fields.text({ label: 'Answer', multiline: true }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Products', value: 'products' },
            { label: 'Company', value: 'company' },
            { label: 'Ordering', value: 'ordering' },
            { label: 'Technical', value: 'technical' },
            { label: 'Certifications', value: 'certifications' }
          ],
          defaultValue: 'products'
        })
      }
    }),
    resources: collection({
      label: 'Resources',
      slugField: 'title',
      path: 'src/content/resources/*',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        description: fields.text({ label: 'Description', multiline: true }),
        type: fields.select({
          label: 'Type',
          options: [
            { label: 'PDF', value: 'pdf' },
            { label: 'PPT', value: 'ppt' },
            { label: 'Video', value: 'video' },
            { label: 'Image', value: 'image' },
            { label: 'Brochure', value: 'brochure' }
          ],
          defaultValue: 'pdf'
        }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Product Brochure', value: 'product-brochure' },
            { label: 'Technical Docs', value: 'technical-docs' },
            { label: 'Marketing', value: 'marketing' },
            { label: 'Certificates', value: 'certificates' },
            { label: 'Videos', value: 'videos' }
          ],
          defaultValue: 'product-brochure'
        }),
        driveUrl: fields.url({ label: 'Google Drive URL' }),
        fileSize: fields.text({ label: 'File Size (e.g., 5.2 MB)' }),
        language: fields.text({ label: 'Language', defaultValue: 'English' }),
        product: fields.text({ label: 'Related Product (optional)' })
      }
    }),
    // company, certifications, hero 등 추가 예정
  }
})
```

### 4. 콘텐츠 마이그레이션 전략
- 기존 TypeScript 파일 → Markdown/JSON 변환
- 점진적 마이그레이션 (한 번에 하나씩)
- 기존 파일 백업 유지

---

## 🤖 퍼블리셔 에이전트 설계

### 역할 정의
1. **프론트엔드 품질 관리**
   - 코드 일관성 검증
   - 접근성 검사
   - 성능 모니터링
   - SEO 검증

2. **변경 사항 검증**
   - 메뉴 추가/변경 시 링크 무결성 확인
   - 레이아웃 깨짐 방지
   - 다크모드 호환성 검증
   - 반응형 디자인 검증

3. **자동화된 개선 제안**
   - 이미지 최적화 제안
   - 번들 크기 분석
   - 사용하지 않는 코드 탐지
   - 보안 취약점 스캔

### 구현 도구
- **ESLint + Prettier**: 코드 품질
- **Lighthouse CI**: 성능/접근성/SEO
- **Astro Check**: TypeScript 타입 검증
- **Custom Scripts**: 링크 검증, 메뉴 무결성 등

### 에이전트 스크립트 위치
```
scripts/
├── publisher-agent/
│   ├── check-links.js        # 링크 무결성 검증
│   ├── validate-menu.js      # 메뉴 구조 검증
│   ├── check-accessibility.js # 접근성 검사
│   ├── analyze-performance.js # 성능 분석
│   └── suggest-improvements.js # 개선 제안
```

---

## 📝 작업 체크리스트

### 사전 작업
- [x] 프로젝트 구조 분석
- [x] CMS 솔루션 조사
- [x] 세션 노트 작성
- [ ] backend/ 디렉토리 정리
- [ ] nul 파일 삭제

### Keystatic 설치
- [ ] React, Markdoc 통합 추가
- [ ] Keystatic 패키지 설치
- [ ] `keystatic.config.ts` 생성
- [ ] `astro.config.mjs` 업데이트
- [ ] 로컬 서버 실행 테스트 (`npm run dev`)
- [ ] `/keystatic` 접속 확인

### 콘텐츠 마이그레이션
- [ ] Products 컬렉션 마이그레이션
- [ ] FAQ 컬렉션 마이그레이션
- [ ] Resources 컬렉션 마이그레이션
- [ ] Company 정보 마이그레이션
- [ ] Certifications 마이그레이션
- [ ] Hero 설정 마이그레이션

### 퍼블리셔 에이전트
- [ ] 에이전트 스크립트 디렉토리 생성
- [ ] 링크 검증 스크립트 작성
- [ ] 메뉴 무결성 검증 스크립트 작성
- [ ] 접근성 검사 스크립트 작성
- [ ] CI/CD 통합

### 빌드 및 배포
- [ ] 로컬 빌드 테스트 (`npm run build`)
- [ ] 빌드 에러 수정
- [ ] Cloudflare Pages 배포
- [ ] `/keystatic` 경로 보호 설정 (Cloudflare Access)
- [ ] 프로덕션 테스트

---

## 🚨 주의사항

1. **기존 콘텐츠 백업**
   - 마이그레이션 전 `src/content/` 전체 백업
   - Git commit으로 변경 이력 관리

2. **점진적 마이그레이션**
   - 한 번에 모든 콘텐츠를 옮기지 말 것
   - 하나씩 테스트하며 진행

3. **Cloudflare Pages 설정**
   - `output: 'hybrid'` 모드 필요 (Keystatic 동작 위해)
   - 환경 변수 확인

4. **보안**
   - `/keystatic` 경로는 반드시 인증 보호
   - Cloudflare Access 또는 Basic Auth 설정

---

## 🔗 참고 자료

- [Keystatic 공식 문서](https://keystatic.com/docs)
- [Keystatic + Astro 가이드](https://keystatic.com/docs/installation-astro)
- [Cloudflare Pages 배포](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)

---

## 📊 진행 상황

**현재 단계**: Phase 1 - Keystatic 설치 준비 완료
**다음 단계**: 패키지 설치 및 설정 파일 생성
**예상 소요 시간**: 2-3시간

---

## 💬 세션 재개 시 확인 사항

1. 이 파일 읽기: `.sisyphus/session-notes/2026-01-25-keystatic-setup.md`
2. 작업 디렉토리 확인: `C:\Users\J\Projects\britzmedi-global`
3. 마지막 체크리스트 항목 확인
4. Git 상태 확인: `git status`
5. 진행 중이던 작업 이어가기

---

**마지막 업데이트**: 2026-01-25
**작성자**: Atlas (Orchestrator Agent)
