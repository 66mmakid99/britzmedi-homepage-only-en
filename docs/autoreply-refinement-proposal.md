# 리드 깔때기(폼+자동답장) 개선 — 구현 기록

> 2026-06-09 · 로컬 소스 반영 완료 · **빌드 PASS** (9개 언어, 에러 0) · **미배포** (britzmedi.com 반영은 별도 승인)
> 불변 원칙: 자동답장은 **draft만 생성 · 자동발송 아님 · sh.lee가 Gmail에서 검수 후 발송** — 유지(자동발송 전환 X)

## 비즈니스 모델 확정 (오너, 2026-06-09)
- 유통 제품: **TORR RF**(의료기기), **NEWCHAE SHOT**(개인용 미용기기) — 판매중
- **ULBLANC** = 버전업 중, **LUMINO WAVE** = 출시 전 → 둘 다 "Coming soon"
- **OEM/ODM 안 받음** → **국가별 디스트리뷰터(총판) 제안만** B2B 거래형태
- 원칙: "받을 수 있는 문의를 정확히" → 폼(입력)부터 비즈니스 현실과 일치시킴

## 입력 측 — 리드폼 (`src/components/features/LeadForm.astro`)
- 제품 체크박스: TORR RF·NEWCHAE SHOT(판매중) + ULBLANC·LUMINO WAVE(**"Coming soon" 배지**, 관심등록 가능, 정렬상 뒤로). 렌더 검증: `dist/contact/index.html`에 배지 2개·제품 4개 확인.
- **OEM/ODM·Distribution 체크박스 제거** (렌더 검증: form 내 0건).
- **신규 "What are you looking for?" 라디오(필수)**: `distributor`(국가별 총판) / `product_info`(제품정보·구매처). 클라 검증 + payload `inquiry_type` 추가.

## 입력 측 — i18n (9개 언어)
- 신규 키: `contact.form.inquiryType`, `contact.form.comingSoon`, `contact.inquiryType.{distributor,distributorDesc,productInfo}`, `contact.validation.inquiryTypeRequired`.
- EN 원본 + 8개 언어(ja/zh/th/vi/es/fr/ru/ar) 번역 추가. "country distributor"는 각 언어의 독점 총판 용어 사용.
- 구 키 `distributionPartnership`/`oemOdm`은 미사용 dead key로 잔존(무해).

## 답장 측 — API (`src/pages/api/leads/index.ts` §6)
- `PRODUCT_CATALOG` 단일 소스(상태 포함) + `displayInterest()` helper 추가.
- subject: `Thank you for your interest in {표시명} – BRITZMEDI` (raw slug 제거).
- `initialScoring.grade/total` 프롬프트 주입(리서치 안 기다림) → 등급별 톤/길이.
- `inquiry_type`을 `enrichment_data` JSON에 저장(마이그레이션 불필요).
- **프롬프트 전면 재작성**:
  - 제품 단일소스 + ULBLANC/LUMINO "준비중·출시 시 안내"(부정/리다이렉트 금지)
  - **OEM/ODM 정중 거절 + 총판 전환**
  - 규제안전: TORR RF FDA 510(k)·CE만 단언, 특정 적응증/국가승인은 "확인 후 회신"
  - 의도 분기: distributor / product_info / coming-soon
  - 받은 정보 재요청 금지 · 가짜 폼 약속 금지 · 각 질문 응답(모르면 "확인 후 회신") · 리드 언어 대응

## 감사 → 조치 (P0/P1)
P0-1 ULBLANC 모순→단일소스+준비중안내 / P0-2 정보재요구→재요청금지 / P0-3 폼링크부재→폼약속제거 / P0-4 질문무시→각질문응답 / P0-5 OEM오인→거절+총판 / P0-6 규제허위→검증분리. P1 등급미반영→주입 / 언어→대응 / import license→총판한정 / subject→표시명.

## 검증
- 빌드: `npm run build` → Complete!, 9개 언어, 에러 0.
- 렌더: `dist/contact/index.html` 신규 필드·배지 확인, OEM/ODM 0건.
- 답장: 8-페르소나 시뮬레이션 재검증(별도). ⚠️ 실 claude/Gmail 호출 아님 → 실발송 전 임시보관함 1~2건 육안 확인 권장.

## 배포 (승인 후)
`npx wrangler pages deploy` (또는 기존 파이프라인). draft 파이프라인만 영향, Resend 자동ack·스코어링 비동기 로직과 분리.

## 후속 권장 (범위 밖 — 별도 결정)
1. **OEM/ODM 마케팅 콘텐츠 정리**: `src/content/faq.ts`의 `oem-odm-services` FAQ + 블로그 `oem-odm-...distributors.json`이 OEM/ODM을 홍보 → "받을 수 없는 문의" 유발 입구. 단, 블로그는 SEO 자산이라 삭제 신중(리다이렉트/리포지셔닝 검토).
2. **ULBLANC/LUMINO 제품 페이지 상태**: 폼·답장은 coming-soon 처리했으나 글로벌 제품 페이지(`content/products`)는 그대로 → site-wide "준비중" 표기 일치 여부 결정.
3. **폼 locale를 payload에 추가**(`locale: currentLang`): 빈 메시지 비영어권 언어정확도↑(현재는 메시지 언어+country 폴백).
