# 콘텐츠 마이그레이션 가이드

**작성일**: 2026-01-25
**목적**: 기존 TypeScript 콘텐츠를 Keystatic CMS로 마이그레이션

---

## 📋 마이그레이션 개요

### 현재 상태
- **콘텐츠 형식**: TypeScript 파일 (`.ts`)
- **위치**: `src/content/`
- **관리 방식**: 코드 직접 수정

### 목표 상태
- **콘텐츠 형식**: Markdown/JSON (Keystatic 관리)
- **위치**: `src/content/` (동일)
- **관리 방식**: Keystatic UI를 통한 비개발자 친화적 관리

---

## 🎯 마이그레이션 전략

### 중요 사항
⚠️ **Keystatic은 기존 TypeScript 파일을 직접 읽지 못합니다.**

따라서 다음 두 가지 방법 중 선택:

1. **수동 마이그레이션** (추천)
   - Keystatic UI에서 새 항목 생성
   - 기존 데이터 복사/붙여넣기
   - 장점: 데이터 검증, 안전함
   - 단점: 시간 소요

2. **자동 변환 스크립트**
   - TypeScript → Markdown/JSON 변환 스크립트 작성
   - 일괄 변환
   - 장점: 빠름
   - 단점: 검증 필요, 오류 가능성

---

## 📊 마이그레이션 우선순위

### Phase 1: 간단한 컬렉션 (1-2시간)
1. **FAQ** - 가장 단순한 구조
2. **Certifications** - 구조화된 데이터

### Phase 2: 중간 복잡도 (2-3시간)
3. **Resources** - PLACEHOLDER URL 교체 필요
4. **Company** - 중첩된 객체 구조

### Phase 3: 복잡한 컬렉션 (3-4시간)
5. **Products** - 가장 복잡한 구조 (배열, 중첩 객체)

---

## 🔧 수동 마이그레이션 단계별 가이드

### 1. FAQ 마이그레이션

#### 기존 데이터 위치
`src/content/faq.ts`

#### Keystatic에서 작업
1. http://localhost:4321/keystatic 접속
2. 왼쪽 사이드바에서 "FAQ" 클릭
3. "Create FAQ" 버튼 클릭
4. 각 FAQ 항목을 하나씩 생성:

**예시 - 첫 번째 FAQ**:
```
Question: What is TORR RF and what are its main applications?
Answer: TORR RF is our flagship FDA 510(k) cleared medical device...
Category: products
```

5. "Save" 클릭
6. 다음 FAQ 항목 반복

#### 진행 상황 추적
- [ ] FAQ 1: What is TORR RF
- [ ] FAQ 2: Is TORR RF FDA cleared
- [ ] FAQ 3: What makes ULBLANC different
- [ ] FAQ 4: Can NEWCHAE SHOT be used at home
- [ ] FAQ 5: When will LUMINO WAVE be available
- [ ] FAQ 6: When was BRITZMEDI established
- [ ] FAQ 7: Where is BRITZMEDI located
- [ ] FAQ 8: Does BRITZMEDI have R&D capabilities
- [ ] FAQ 9: How to become a distributor
- [ ] FAQ 10: Minimum order quantities
- [ ] FAQ 11: International shipping
- [ ] FAQ 12: OEM/ODM services
- [ ] FAQ 13: Training provided
- [ ] FAQ 14: Warranty policy
- [ ] FAQ 15: Technical support
- [ ] FAQ 16: ISO certification
- [ ] FAQ 17: GMP certified
- [ ] FAQ 18: Regulatory approvals

**총 18개 항목**

---

### 2. Certifications 마이그레이션

#### 기존 데이터 위치
`src/content/certifications.ts`

#### Keystatic에서 작업
1. "Certifications" 컬렉션 선택
2. "Create Certification" 클릭
3. 각 인증 정보 입력:

**예시 - FDA 510(k)**:
```
Name: FDA 510(k)
Full Name: U.S. Food and Drug Administration 510(k) Clearance
Status: cleared
Region: USA
Description: FDA has determined the device to be substantially equivalent...
Products: TORR RF (MTX-C1)
Certificate No: K212561
```

#### 진행 상황 추적
- [ ] FDA 510(k)
- [ ] ISO 13485:2016
- [ ] GMP
- [ ] MFDS License
- [ ] MFDS Certification
- [ ] KC (EMC)
- [ ] Venture Enterprise

**총 7개 항목**

---

### 3. Resources 마이그레이션

#### 중요: PLACEHOLDER URL 교체 필요

**작업 전 준비**:
1. Google Drive에 실제 파일 업로드
2. 각 파일의 공유 링크 생성
3. 링크 목록 준비

#### Keystatic에서 작업
1. "Resources" 컬렉션 선택
2. 각 리소스 생성 시 **실제 Google Drive URL** 입력

**예시 - TORR RF Brochure**:
```
Title: TORR RF Product Brochure
Description: Comprehensive product brochure for TORR RF...
Type: pdf
Category: product-brochure
Drive URL: https://drive.google.com/file/d/ACTUAL_FILE_ID/view
File Size: 5.2 MB
Language: English
Product: TORR RF
```

#### 진행 상황 추적
- [ ] TORR RF Brochure (PDF 업로드 필요)
- [ ] ULBLANC Brochure (PDF 업로드 필요)
- [ ] NEWCHAE SHOT Brochure (PDF 업로드 필요)
- [ ] TORR RF User Manual (PDF 업로드 필요)
- [ ] TORR RF Spec Sheet (PDF 업로드 필요)
- [ ] Company Presentation (PPT 업로드 필요)
- [ ] TORR RF Product Images (이미지 업로드 필요)
- [ ] FDA 510(k) Certificate (PDF 업로드 필요)
- [ ] ISO 13485 Certificate (PDF 업로드 필요)
- [ ] GMP Certificate (PDF 업로드 필요)
- [ ] TORR RF Demo Video (비디오 업로드 필요)
- [ ] Company Intro Video (비디오 업로드 필요)

**총 12개 항목 + 파일 업로드 필요**

---

### 4. Company 마이그레이션

#### 기존 데이터 위치
`src/content/company.ts`

#### Keystatic에서 작업
1. "Company Info" 컬렉션 선택
2. 회사 정보 입력 (중첩된 객체 주의)

**주의사항**:
- Address 객체: 각 필드 개별 입력
- Contact 객체: 각 필드 개별 입력
- Milestones 배열: "Add milestone" 버튼으로 추가

#### 진행 상황 추적
- [ ] 기본 정보 (name, nameKo, CEO, establishment)
- [ ] Description
- [ ] Philosophy
- [ ] Address (5개 필드)
- [ ] Contact (3개 필드)
- [ ] Milestones (5개 항목)

---

### 5. Products 마이그레이션

#### 기존 데이터 위치
`src/content/products.ts`

#### Keystatic에서 작업
**가장 복잡한 컬렉션** - 시간 충분히 확보

1. "Products" 컬렉션 선택
2. 각 제품 생성 (배열 필드 주의)

**예시 - TORR RF**:
```
Name: TORR RF
Model: MTX-C1
Tagline: Innovative Multi-Wave RF Workstation
Category: medical-device
Status: available
Featured: ✓
Overview: TORR RF is a non-invasive medical device...
Description: [Markdoc 에디터에서 작성]

Key Technologies: [Add technology 버튼]
  - Name: Auto Circular Motion Head
    Description: The handpiece features...
  
Indications: [Add indication 버튼]
  - Lifting & Skin Tightening
  - Body Contouring & Cellulite
  ...

Specifications: [Add specification 버튼]
  - Label: Frequency
    Value: 1 MHz ± 10%
    Note: Stable deep heating frequency
  ...
```

#### 진행 상황 추적
- [ ] TORR RF (가장 복잡 - 3개 기술, 4개 적응증, 10개 사양)
- [ ] ULBLANC (중간 복잡도)
- [ ] NEWCHAE SHOT (중간 복잡도)
- [ ] LUMINO WAVE (간단)

**총 4개 제품**

---

## 🤖 자동 변환 스크립트 (선택사항)

수동 작업이 너무 많다면 변환 스크립트 작성 가능:

### 스크립트 개요
```javascript
// scripts/migrate-to-keystatic.js
import fs from 'fs';
import path from 'path';

// TypeScript 파일 읽기
const faqData = await import('../src/content/faq.ts');

// Keystatic 형식으로 변환
faqData.faqItems.forEach(item => {
  const filename = `${item.id}.mdoc`;
  const content = `---
question: ${item.question}
category: ${item.category}
---

${item.answer}
`;
  
  fs.writeFileSync(
    path.join('src/content/faq', filename),
    content
  );
});
```

**주의**: 이 스크립트는 예시이며, 실제 사용 시 Keystatic의 정확한 파일 형식에 맞춰 수정 필요.

---

## ✅ 마이그레이션 체크리스트

### 사전 준비
- [ ] 기존 콘텐츠 백업 (`cp -r src/content src/content.backup`)
- [ ] Google Drive 파일 업로드 (Resources용)
- [ ] 공유 링크 목록 준비

### Phase 1: FAQ (예상 1-2시간)
- [ ] 18개 FAQ 항목 Keystatic에 생성
- [ ] 카테고리 정확히 설정
- [ ] 저장 후 파일 생성 확인

### Phase 2: Certifications (예상 30분)
- [ ] 7개 인증 정보 생성
- [ ] 인증 번호, 유효기간 정확히 입력

### Phase 3: Resources (예상 2-3시간)
- [ ] 12개 리소스 생성
- [ ] **PLACEHOLDER → 실제 Google Drive URL 교체**
- [ ] 파일 크기, 언어 정보 입력

### Phase 4: Company (예상 1시간)
- [ ] 회사 기본 정보 입력
- [ ] Address, Contact 객체 입력
- [ ] 5개 Milestones 추가

### Phase 5: Products (예상 3-4시간)
- [ ] TORR RF 생성 (가장 복잡)
- [ ] ULBLANC 생성
- [ ] NEWCHAE SHOT 생성
- [ ] LUMINO WAVE 생성

### 마무리
- [ ] 모든 컬렉션 데이터 확인
- [ ] 빌드 테스트 (`npm run build`)
- [ ] 로컬 미리보기 확인
- [ ] Git commit & push
- [ ] 프로덕션 배포 확인

---

## 🚨 주의사항

1. **백업 필수**
   - 마이그레이션 전 반드시 백업
   - Git commit으로 변경 이력 관리

2. **점진적 진행**
   - 한 번에 모든 컬렉션 마이그레이션 X
   - 하나씩 완료 후 테스트

3. **데이터 검증**
   - 각 항목 저장 후 파일 생성 확인
   - 빌드 에러 없는지 확인

4. **PLACEHOLDER 주의**
   - Resources의 모든 PLACEHOLDER URL 교체 필수
   - 실제 파일 업로드 후 링크 생성

---

## 📊 예상 소요 시간

| 컬렉션 | 항목 수 | 예상 시간 |
|--------|---------|-----------|
| FAQ | 18 | 1-2시간 |
| Certifications | 7 | 30분 |
| Resources | 12 | 2-3시간 (파일 업로드 포함) |
| Company | 1 | 1시간 |
| Products | 4 | 3-4시간 |
| **총계** | **42** | **8-11시간** |

---

## 💡 팁

1. **효율적인 작업 순서**
   - 간단한 것부터 시작 (FAQ, Certifications)
   - 복잡한 것은 나중에 (Products)

2. **복사/붙여넣기 활용**
   - 기존 TypeScript 파일 열어두기
   - 데이터 복사하여 Keystatic에 붙여넣기

3. **정기적인 저장**
   - 각 항목 작성 후 즉시 저장
   - 브라우저 새로고침 전 저장 확인

4. **Git 활용**
   - 컬렉션별로 commit
   - 문제 발생 시 롤백 가능

---

**다음 단계**: Keystatic UI에서 FAQ 마이그레이션 시작

**현재 상태**: 마이그레이션 대기 중 (사용자 작업 필요)
