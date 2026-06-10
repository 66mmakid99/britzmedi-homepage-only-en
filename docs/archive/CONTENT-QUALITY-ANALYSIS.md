# 파이프라인 생성 콘텐츠 품질 분석 리포트

## 분석 대상
- 제목: "Korean Aesthetic Medical Device Manufacturers: Leading Innovation in Global Beauty Technology"
- 카테고리: EVIDENCE REPORT
- 저자: BRITZMEDI Research Team

---

## 🔴 심각한 문제 (반드시 수정)

### 1. 노골적인 자사 홍보 = AI가 인용 안 함

**현재:** "BRITZMEDI Perspective: Advancing Multi-Modal Aesthetic Solutions" 섹션이 H2 레벨로 들어가 있음. TORR RF를 직접 홍보하는 구조.

**문제:** AI 검색 엔진(ChatGPT, Perplexity)은 객관적이고 중립적인 소스를 인용함. 자사 홍보 글은 "광고"로 판단해서 답변에 포함시키지 않음. 지금 구조는 "한국 미용 기기 제조사 소개합니다 → 근데 사실 우리 회사가 최고예요"인데, 이러면 AEO 효과 제로.

**개선:** BRITZMEDI 언급은 비교표 안의 한 행, 또는 "Notable manufacturers include..." 같은 자연스러운 맥락에서만. 전용 섹션 X. 글 전체가 "업계 전문가가 쓴 객관적 분석"으로 읽혀야 함.

### 2. 인용 출처가 진짜인지 검증 불가

**현재:** 글에 참고문헌이 있는 것처럼 보이지만, 파이프라인이 Claude에게 "논문 인용해줘"라고 하면 Claude가 존재하지 않는 논문을 만들어낼 수 있음 (hallucination).

**문제:** 가짜 인용이 들어가면 신뢰도가 0이 됨. 의료 분야에서 가짜 논문 인용은 치명적.

**개선:** 파이프라인의 리서치 단계에서 PubMed API로 실제 검색한 논문만 프롬프트에 전달하고, "이 논문 목록에 있는 것만 인용하라"고 명시해야 함. Claude가 자체적으로 만든 인용은 전부 제거하는 후처리 단계 필요.

### 3. 글이 너무 넓고 얕음

**현재:** "Korean aesthetic device manufacturers" 전체를 다루려고 함. RF, 초음파, 메조테라피, LED, AI, 원격의료까지 전부 언급.

**문제:** 한 글에서 모든 걸 다루면 어떤 검색어에도 깊이가 부족함. AI는 "이 글이 RF에 대해 가장 자세하다"가 아니라 "이 글은 여러 주제를 피상적으로 다룬다"로 판단.

**개선:** "Korean RF device manufacturers"처럼 좁히거나, 6가지 앵글로 각각 깊이 있게 다뤄야 함. 하나의 글에 2000단어라면 하나의 기술에 집중.

### 4. Featured Snippet 구조 없음

**현재:** Introduction이 일반적인 서론으로 시작.

**문제:** AI가 답변에 인용하려면 "핵심 정의 → 숫자 → 구체적 사실" 순서의 첫 2-3문장이 필요. 지금은 "The Korean medical device industry..." 같은 모호한 시작.

**개선:** 첫 문단을 이렇게 바꿔야:
"South Korea is the world's [N]th largest aesthetic medical device exporter, with [X]+ FDA-cleared devices as of 2025. Korean manufacturers including [Company A], [Company B], and BRITZMEDI specialize in radiofrequency, ultrasound, and LED-based technologies, with the market valued at approximately $[X] billion."
→ AI가 이 문단을 그대로 답변에 넣을 수 있는 구조.

---

## 🟡 중요한 문제 (품질에 영향)

### 5. 비교표 없음

AI 검색은 구조화된 데이터를 좋아함. "한국 미용 기기 제조사" 글에 제조사별 비교표가 없으면 핵심 정보 전달 실패.

**필요한 비교표:**
```
| Manufacturer | HQ | Key Product | Technology | FDA Status | Specialty |
|---|---|---|---|---|---|
| BRITZMEDI | Seongnam | TORR RF | Multi-wave RF | 510(k) | Skin tightening |
| Classys | Seoul | Ultraformer | HIFU | 510(k) | Lifting |
| Jeisys | Seoul | INTRAcel | RF Microneedling | 510(k) | Rejuvenation |
| Wontech | Daejeon | Picocare | Laser | 510(k) | Pigmentation |
```

### 6. 저자 "BRITZMEDI Research Team" = 신뢰도 낮음

**문제:** AI와 Google 모두 E-E-A-T (Experience, Expertise, Authority, Trust) 평가. "Research Team"은 모호함.

**개선:** 
- 임상 근거 글: "Dr. [Name], Dermatologist" 또는 "Clinical Advisory Board"
- 기술 비교 글: "BRITZMEDI Engineering Team"
- 시장 분석 글: "BRITZMEDI Market Intelligence"
- 또는 실존 의료 자문위원 이름 사용 (있으면)

### 7. 시각 자료 제로

텍스트만 2000단어 이상. 이미지, 차트, 인포그래픽 없음.

**필요한 시각 자료:**
- 기술 비교 차트 (바 차트 또는 레이더 차트)
- 시장 규모 그래프
- 기술 작동 원리 다이어그램
- 제품 이미지 (최소한 TORR RF)

### 8. CTA가 없거나 약함

마지막에 독자가 뭘 해야 하는지 안내가 없음. B2B 사이트인데 리드 전환으로 연결 안 됨.

**필요한 CTA:**
- "Learn more about TORR RF specifications → Contact our team"
- "Download our technology comparison guide"
- "Request a product demonstration"

### 9. 내부 링크 없음

다른 블로그 글, 제품 페이지, About Us, Certifications 페이지로의 링크가 보이지 않음. 내부 링크는 SEO + 체류 시간 + 리드 전환에 직접 영향.

### 10. FAQ가 일반적

FAQ가 있지만 "What regulatory approvals do Korean aesthetic medical devices typically hold?" 같은 너무 넓은 질문. 

**개선:** 사람들이 실제로 AI에게 묻는 질문으로:
- "Is TORR RF FDA approved?"
- "Best Korean RF device for body contouring?"
- "How much does a Korean aesthetic device cost?"

---

## 🟢 긍정적인 점

- H2/H3 계층 구조는 잘 되어있음
- 카테고리 분류(EVIDENCE REPORT)가 있음  
- 기본적인 글 구조(서론→본론→결론→FAQ)는 갖춤
- 블로그 레이아웃 자체는 깔끔함

---

## 시스템 적용 개선사항 요약

### 프롬프트 개선 (content-angles.ts)

1. **객관성 강제 규칙 추가:**
   "Never create a dedicated section about BRITZMEDI. Mention BRITZMEDI only within comparison tables or as one example among 3-4 competitors. The article must read as written by an independent industry analyst, not by BRITZMEDI's marketing team."

2. **인용 무결성 규칙:**
   "ONLY cite the PubMed articles provided in the reference list below. Do NOT invent or fabricate any citations. If no relevant PubMed articles are provided, say 'Evidence suggests...' without specific citation rather than creating fake references."

3. **Featured Snippet 첫 문단 규칙:**
   "The first paragraph MUST be a direct, factual answer suitable for AI extraction. Start with a definition or key statistic. Example format: '[Topic] is [definition]. As of [year], [key statistic]. [One more specific fact with number].'"

4. **깊이 규칙:**
   "Focus narrowly on [specific subtopic]. Do NOT try to cover the entire field. Every section should go deep, not wide. Include specific numbers, percentages, clinical parameters, and technical specifications."

5. **비교표 필수:**
   "Include at least one markdown comparison table with 4+ competitors/options. BRITZMEDI should be one row among equals, not highlighted or given special treatment."

6. **내부 링크 필수:**
   "Include 3-5 internal links to relevant pages: /products/torr-rf, /certifications, /about, /contact, /blog/[related-post-slug]. Format as full URLs: https://britzmedi.com/..."

### Quality Gate 강화 (analyzeAndGate)

7. **인용 검증 단계 추가:**
   Quality Gate에서 글 속 PubMed 인용이 실제 리서치 데이터의 PMID 목록에 존재하는지 대조 검증. 없는 인용 → blocking_issue.

8. **자사 홍보 비율 체크:**
   "BRITZMEDI" 또는 "TORR RF" 멘션 횟수가 전체 단어 수의 2% 초과하면 → 경고. 전용 H2 섹션이 있으면 → blocking_issue.

9. **비교표 존재 체크:**
   마크다운에 | 패턴 (테이블)이 없으면 → completeness 점수 감점.

10. **첫 문단 AI 추출 가능성 체크:**
    첫 100단어에 숫자, 정의, 구체적 사실이 포함되어 있지 않으면 → aeo_readiness 감점.

### 후처리 단계 추가

11. **인용 검증 후처리:**
    생성된 글에서 "[Author, Year]" 패턴 추출 → PubMed API로 실제 존재하는지 확인 → 없으면 해당 인용 제거하고 "Research suggests..." 로 대체.

12. **내부 링크 자동 삽입:**
    생성된 글에 내부 링크가 없으면, 키워드 매칭으로 자동 삽입:
    - "skin tightening" → /products/torr-rf 링크
    - "FDA" or "certification" → /certifications 링크
    - "contact" or "inquiry" → /contact 링크

13. **저자명 앵글별 자동 할당:**
    - clinical_evidence → "BRITZMEDI Clinical Advisory"
    - tech_comparison → "BRITZMEDI Engineering Insights"
    - market_analysis → "BRITZMEDI Market Intelligence"
    - clinic_guide → "BRITZMEDI Clinical Education"
    - patient_education → "BRITZMEDI Patient Resources"
    - aeo_response → "BRITZMEDI Research"
