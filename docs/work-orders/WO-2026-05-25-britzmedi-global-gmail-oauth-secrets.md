# WO-2026-05-25-britzmedi-global-gmail-oauth-secrets

> **파일 배치 지시**
> 본 WO 파일을 `C:\medcode\britzmedi-global\docs\work-orders\` 폴더로 **이동**(복사 X)한 후 작업 시작.
> 폴더가 없으면 생성. 모든 작업 결과는 본 파일 최하단 "작업결과기록" 섹션에 append.

---

## 배경

- 5dda6942 커밋으로 Gmail Drafts 저장 + 알림 발송 코드 배포 완료.
- 사용자가 Google Cloud Console에서 OAuth 셋업 완료:
  - GCP 프로젝트: britzmedi-ai
  - OAuth Client: britzmedi-lead-draft (Web application 타입)
  - 동의 화면: 외부 + 테스트 모드, 테스트 사용자 sh.lee@britzmedi.com 등록
  - Scope 부여: gmail.compose + gmail.send
  - OAuth Playground에서 refresh token 발급 완료 (offline access type)
- 사용자가 본 WO 진행 시 **bkit 프롬프트에 직접 시크릿 값 3개를 붙여넣음**.
- 저장소 어디에도 시크릿이 남으면 안 됨.

## 목표

1. 로컬 `.env`에 Gmail OAuth 3종 시크릿 안전하게 저장.
2. Cloudflare Workers/Pages 환경변수에도 동일하게 등록 (배포 환경에서 사용).
3. 리드 폼 제출 → Gmail Drafts에 AI 응대 초안 자동 저장 + 알림 발송 end-to-end 테스트.
4. 모든 단계에서 시크릿 평문 노출/커밋 0건 보증.

## 사용자가 bkit에게 전달할 시크릿 (사용자가 본인이 직접 채워서 bkit 프롬프트에 붙여넣음)

```
GOOGLE_CLIENT_ID=<<여기에 직접 붙여넣기>>
GOOGLE_CLIENT_SECRET=<<여기에 직접 붙여넣기>>
GOOGLE_REFRESH_TOKEN=<<여기에 직접 붙여넣기>>
GMAIL_USER_EMAIL=sh.lee@britzmedi.com
```

> ⚠️ 사용자 본인이 메모장에 보관한 값을 위 4줄 형태로 만들어서 bkit 프롬프트에 직접 붙여넣음.
> Claude.ai 채팅에는 절대 평문으로 입력하지 않음.

## 수행 태스크

### Task 1. .env 파일 검증 및 시크릿 저장

1. `C:\medcode\britzmedi-global\.gitignore` 확인:
   - `.env`, `.env.*`, `!.env.example` 패턴 존재 여부 검증.
   - 누락 시 추가 후 결과 보고.
2. `C:\medcode\britzmedi-global\.env` 파일 존재 여부 확인:
   - 없으면 생성.
   - 있으면 기존 내용 보존하면서 위 4개 키를 추가/갱신 (이미 있으면 갱신).
3. `C:\medcode\britzmedi-global\.env.example` 갱신:
   - 위 4개 키를 빈 값 placeholder로 추가 (`GOOGLE_CLIENT_ID=`, etc).
   - 실제 값은 절대 들어가면 안 됨.
4. `git status`로 .env가 untracked 상태인지 확인. 만약 추적되고 있으면 즉시 보고하고 중단.

### Task 2. 코드에서 시크릿 사용 방식 검증

1. `src/lib/gmail-draft.ts` (또는 동등 파일)에서 환경변수 참조 방식 확인:
   - `process.env.GOOGLE_CLIENT_ID` 또는 `import.meta.env.GOOGLE_CLIENT_ID` 또는 Cloudflare `env.GOOGLE_CLIENT_ID` 중 어떤 방식인지 보고.
   - Astro+Cloudflare 환경에서는 일반적으로 런타임 `env` 객체 (Worker context) 사용 권장.
2. 시크릿이 코드에 하드코딩되어 있는지 grep 검증:
   - `grep -r "GOCSPX" src/` → 결과 0건이어야 함
   - `grep -r "1//0g" src/` → 결과 0건이어야 함
   - 결과 보고.

### Task 3. Cloudflare 환경변수 등록 (배포용)

1. `wrangler.toml` 확인 → 프로젝트 이름과 환경 (production / preview) 확인 후 보고.
2. 다음 명령으로 Cloudflare에 secret 등록 (사용자가 콘솔에서 실행):
   ```bash
   cd C:\medcode\britzmedi-global
   npx wrangler secret put GOOGLE_CLIENT_ID
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   npx wrangler secret put GOOGLE_REFRESH_TOKEN
   npx wrangler secret put GMAIL_USER_EMAIL
   ```
   - 각 명령 실행 시 값을 묻는 프롬프트가 뜨면 사용자가 직접 붙여넣음.
   - bkit는 명령만 안내하고 값을 받지 않음.
3. 사용자에게 위 명령 순서대로 실행하라고 안내. 각 명령 실행 후 success 메시지 확인.

### Task 4. End-to-End 테스트

1. 로컬에서 dev 서버 기동: `npm run dev` 또는 `npx wrangler pages dev`.
2. 리드 폼 (https://britzmedi.com/contact 또는 동등 경로) 또는 API 엔드포인트 (`/api/leads`)에 테스트 페이로드 전송:
   - 회사명: "TEST_CO_2026_05_25"
   - 이름: "Test User"
   - 이메일: 본인 테스트용 이메일 (사용자 확인 후 결정)
   - 직책, 국가, 관심제품, 웹사이트: 임의 값
3. 검증:
   - sh.lee@britzmedi.com Gmail 임시보관함(Drafts)에 AI 응대 초안이 생성되었는가? → 사용자에게 확인 요청
   - 알림 이메일이 정상 발송되었는가? → 사용자에게 확인 요청
   - Cloudflare Workers 로그(`wrangler tail`)에 에러 없는가?
4. 실패 시:
   - 401 Unauthorized → refresh token 또는 scope 문제. 재발급 안내.
   - 403 Forbidden → Gmail API가 GCP 프로젝트에서 enabled되지 않은 것. 활성화 안내.
   - 400 Bad Request → 페이로드 형식 문제. 코드 디버깅.

### Task 5. 프로덕션 배포 + 프로덕션 환경 재테스트

1. 로컬 테스트 PASS 시에만 진행.
2. `npx wrangler pages deploy` (또는 기존 배포 명령) 실행.
3. 프로덕션 URL에서 동일 테스트 페이로드로 재검증.
4. 결과 보고.

## GT 제약

- **READ-ONLY 시크릿**: bkit는 시크릿 값을 어떤 파일에도 평문으로 쓰지 않음. .env 외에는 절대 등장 금지.
- `git add .env`, `git commit .env` 절대 금지.
- 커밋 전 `git diff --cached` 로 시크릿 패턴 (`GOCSPX-`, `1//0g`, `apps.googleusercontent.com`) grep 검증 필수.
- 위반 시 즉시 commit 취소하고 사용자에게 보고.
- 본 WO 결과 회신 시에도 시크릿 값 평문 절대 포함 금지 (마스킹된 형태만 허용: `GOCSPX-***`).

## 결과 보고 형식

다음 항목을 모두 포함하여 본 파일 최하단 "작업결과기록" 섹션에 append:

1. Task별 PASS/FAIL/SKIP 상태 + 근거
2. `.env`, `.env.example`, `.gitignore` diff 요약 (시크릿 마스킹된 형태로)
3. Cloudflare secret put 명령 실행 결과 (사용자 보고 기반)
4. End-to-End 테스트 결과 (Gmail Drafts 생성 확인, 알림 이메일 수신 확인)
5. 발견된 이슈 / 후속 조치 필요 사항
6. 다음 단계 제안

## 다음 단계 분기

- **모든 Task PASS** → MEDCODE Hub `hub_work_logs`에 본 WO 결과 기록 (workorder_ref: WO-2026-05-25-britzmedi-global-gmail-oauth-secrets), 본 WO 완료 처리.
- **Task 4 FAIL (인증 에러)** → 별도 R1 WO 발행으로 분기. 무리하게 진행하지 말 것.
- **Task 5 FAIL (프로덕션만 실패)** → wrangler.toml 환경 분리 확인 후 별도 WO.

---

## 작업결과기록

(bkit가 작업 완료 후 본 섹션에 결과를 append)
