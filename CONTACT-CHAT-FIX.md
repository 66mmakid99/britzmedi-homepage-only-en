# Contact Form 수정 + 이메일 검증 + 챗봇 알림 확장

전부 순서대로 실행해. 중간에 멈추지 마.

---

## 1. Contact Form "Failed to submit" 수정

Contact Form 제출 시 "Failed to submit" 에러 발생.

1-1. LeadForm.astro에서 폼 제출이 어디로 POST하는지 확인
1-2. 해당 API 엔드포인트 존재하는지, 응답이 정상인지 curl로 테스트:
```bash
curl -X POST https://britzmedi.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Test Corp","companyWebsite":"www.test.com","name":"John","jobTitle":"CEO","email":"test@test.com","country":"Hungary","interestedIn":["TORR RF"],"message":"test","source":"Google Search"}'
```
1-3. EmailJS 제거하면서 폼 제출 로직이 깨졌을 가능성 높음. fetch URL, request body 형식, 응답 처리 전부 확인
1-4. 에러 원인 찾아서 수정 — 폼 제출이 정상 동작하고 "Thank you" 메시지 표시되어야 함
1-5. 제출 성공 시:
  - leads 테이블에 저장
  - notifyNewLead → admin_notifications 저장 + Resend 이메일 sh.lee@britzmedi.com
  - 고객에게 자동 확인 이메일 발송 (Thank you for contacting BRITZMEDI)

---

## 2. 이메일 유효성 검사

현재 아무 이메일이나 통과됨. 서버 + 클라이언트 양쪽에서 검증 추가.

2-1. 서버 사이드 (API):
- 이메일 형식 regex 검증
- 필수 필드 빈 값 체크 (companyName, name, email, country, interestedIn)
- 실패 시 구체적인 에러 메시지 반환: { error: "Invalid email format" }

2-2. 프론트엔드 (LeadForm.astro):
- 이메일 입력 시 실시간 형식 검증
- 필수 필드 빈 값 시 Submit 버튼 비활성화 또는 인라인 에러
- 무료 이메일(gmail.com, yahoo.com, hotmail.com 등) 사용 시: 
  "We recommend using your company email for faster response" 안내 메시지 (제출은 허용)

---

## 3. 챗봇 대화 알림 확장

현재: lead_converted일 때만 알림 발송.
변경: 모든 새 챗봇 대화 시작 시 알림 + 리드 전환 시 추가 알림.

3-1. chat.ts에서 새 conversation INSERT 직후 알림 발송:
```typescript
await notifyNewLead(env, {
  type: 'chatbot',
  message: userMessage.substring(0, 200), // 첫 질문 내용
  country: visitorCountry || 'Unknown',
  source_url: request.headers.get('referer') || 'https://britzmedi.com'
});
```

3-2. 이메일 제목: "💬 New Chatbot Conversation — [국가]"

3-3. lead_converted 시에는 별도 추가 알림:
```typescript
await notifyNewLead(env, {
  type: 'chatbot',
  message: '🔥 Chatbot visitor converted to lead! Clicked contact link.',
  country: visitorCountry || 'Unknown',
  lead_score: 90
});
```
이메일 제목: "🔥 Chatbot Lead Converted!"

3-4. 중복 방지: 같은 conversation에서 첫 메시지 알림은 1번만 (conversation 생성 시점에만)

---

## 4. 빌드 + 배포

```bash
npm run build
git add -A
git commit -m "fix: Contact Form submission + email validation + chatbot notifications for all conversations"
git push
```

---

## 5. 테스트

5-1. Contact Form 테스트:
```bash
curl -X POST https://britzmedi.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Test Corp","companyWebsite":"www.test.com","name":"Test User","jobTitle":"CEO","email":"test@testcorp.com","country":"US","interestedIn":["TORR RF"],"message":"Testing form submission","source":"Google Search"}'
```
→ 200 응답 + leads 테이블에 저장 + sh.lee@britzmedi.com에 이메일 도착

5-2. 잘못된 이메일 테스트:
```bash
curl -X POST https://britzmedi.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Test","name":"Test","email":"notanemail","country":"US","interestedIn":["TORR RF"]}'
```
→ 400 에러 + "Invalid email format" 메시지

5-3. admin_notifications 확인:
```bash
npx wrangler d1 execute britzmedi-db --remote --command "SELECT * FROM admin_notifications ORDER BY id DESC LIMIT 5"
```

5-4. 대시보드에서 알림 벨 + Recent Leads 표시 확인

---

## 핵심 규칙

- Contact Form 제출이 반드시 성공해야 함 (현재 깨져있음, 최우선)
- 모든 알림은 admin_notifications DB + Resend 이메일 양쪽 다
- 챗봇은 새 대화마다 알림 (첫 메시지 시점에 1번만)
- 안 되는 부분은 보고하고 나머지 계속 진행
- CHANGELOG.md 업데이트
