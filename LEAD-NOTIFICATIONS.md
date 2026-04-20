# 리드 실시간 알림 시스템 — 대시보드 + 이메일

아래를 전부 순서대로 실행해. 중간에 멈추지 마.

## Phase 0: 현재 상태 확인

```bash
# leads 테이블 구조
npx wrangler d1 execute britzmedi-db --remote --command "PRAGMA table_info(leads)" 2>&1

# 대시보드 파일 확인
ls -la src/pages/admin/index.astro src/components/admin/Dashboard* 2>/dev/null

# 이메일 관련 설정 확인
grep -rn "email\|mail\|sendgrid\|mailgun\|resend\|ses" wrangler.toml src/lib/ 2>/dev/null | head -20

# 기존 리드 알림 로직 확인
grep -rn "notification\|notify\|alert\|새.*리드\|new.*lead" src/ 2>/dev/null | head -20

# chat API에서 lead_converted 처리 확인
grep -n "lead_converted\|leadConverted" src/pages/api/chat.ts 2>/dev/null
```

결과 먼저 보여줘.

---

## Phase 1: 이메일 발송 인프라

### 1-1. Resend (또는 사용 가능한 이메일 서비스) 설정

Cloudflare Workers에서 가장 쉬운 이메일 발송은 Resend API.

먼저 확인: wrangler.toml이나 환경변수에 이메일 서비스 키가 있는지.

없으면 Resend 없이 Cloudflare Email Workers 또는 fetch로 직접 발송 가능한 방법 사용.

**방법 1 (권장): Resend API**
- RESEND_API_KEY 환경변수 필요
- 없으면 일단 이메일 발송 함수만 만들어두고, 키 없으면 콘솔 로그로 대체

**방법 2 (대안): 이메일 발송 없이 대시보드 알림만**
- RESEND_API_KEY가 없으면 이 방법으로 진행
- 나중에 키 추가하면 자동으로 이메일도 발송

### 1-2. 이메일 발송 유틸리티

파일: `src/lib/email-notifications.ts`

```typescript
const ADMIN_EMAIL = 'sh.lee@britzmedi.com';
const FROM_EMAIL = 'noreply@britzmedi.com'; // Resend 도메인 설정 필요

interface LeadNotification {
  type: 'contact_form' | 'chatbot' | 'newsletter';
  company?: string;
  name?: string;
  email?: string;
  country?: string;
  product_interest?: string;
  message?: string;
  source_url?: string;
  lead_score?: number;
}

export async function notifyNewLead(env: any, lead: LeadNotification) {
  // 1. D1에 알림 기록 저장
  await saveNotification(env, lead);
  
  // 2. 이메일 발송 시도
  const apiKey = env.RESEND_API_KEY;
  if (apiKey) {
    await sendEmailViaResend(apiKey, lead);
  } else {
    console.log('[EMAIL SKIP] RESEND_API_KEY not set. Lead notification:', JSON.stringify(lead));
  }
}

async function sendEmailViaResend(apiKey: string, lead: LeadNotification) {
  const subject = getSubject(lead);
  const html = getEmailHtml(lead);
  
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject,
        html
      })
    });
    if (!res.ok) {
      console.error('[EMAIL ERROR]', await res.text());
    }
  } catch (e) {
    console.error('[EMAIL ERROR]', e);
  }
}

function getSubject(lead: LeadNotification): string {
  const prefix = '🔔 New Lead';
  if (lead.type === 'chatbot') return `${prefix} (Chatbot) — ${lead.company || 'Unknown'}`;
  if (lead.type === 'newsletter') return `${prefix} (Newsletter) — ${lead.email}`;
  return `${prefix} — ${lead.company || lead.name || 'Unknown'}`;
}

function getEmailHtml(lead: LeadNotification): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">🔔 New Lead — BRITZMEDI</h2>
        <p style="margin: 4px 0 0; opacity: 0.9;">${lead.type === 'chatbot' ? 'Chatbot Conversion' : lead.type === 'newsletter' ? 'Newsletter Signup' : 'Contact Form'}</p>
      </div>
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          ${lead.company ? `<tr><td style="padding: 8px 0; color: #64748b; width: 120px;">Company</td><td style="padding: 8px 0; font-weight: 600;">${lead.company}</td></tr>` : ''}
          ${lead.name ? `<tr><td style="padding: 8px 0; color: #64748b;">Name</td><td style="padding: 8px 0;">${lead.name}</td></tr>` : ''}
          ${lead.email ? `<tr><td style="padding: 8px 0; color: #64748b;">Email</td><td style="padding: 8px 0;"><a href="mailto:${lead.email}">${lead.email}</a></td></tr>` : ''}
          ${lead.country ? `<tr><td style="padding: 8px 0; color: #64748b;">Country</td><td style="padding: 8px 0;">${lead.country}</td></tr>` : ''}
          ${lead.product_interest ? `<tr><td style="padding: 8px 0; color: #64748b;">Product</td><td style="padding: 8px 0;">${lead.product_interest}</td></tr>` : ''}
          ${lead.message ? `<tr><td style="padding: 8px 0; color: #64748b; vertical-align: top;">Message</td><td style="padding: 8px 0;">${lead.message}</td></tr>` : ''}
          ${lead.lead_score ? `<tr><td style="padding: 8px 0; color: #64748b;">Score</td><td style="padding: 8px 0; font-weight: 600; color: ${lead.lead_score >= 80 ? '#16a34a' : lead.lead_score >= 50 ? '#ca8a04' : '#dc2626'};">${lead.lead_score}/100</td></tr>` : ''}
        </table>
        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <a href="https://britzmedi.com/admin/leads" style="display: inline-block; background: #2563eb; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">View in Admin →</a>
        </div>
      </div>
    </div>
  `;
}
```

---

## Phase 2: 리드 알림 트리거 연결

### 2-1. Contact Form 리드

기존 contact form API (POST /api/contact 또는 유사 경로)를 찾아서:
- 리드 저장 후 `notifyNewLead(env, { type: 'contact_form', ... })` 호출

### 2-2. Chatbot 리드

src/pages/api/chat.ts에서 lead_converted = 1 업데이트하는 부분을 찾아서:
- `notifyNewLead(env, { type: 'chatbot', ... })` 호출
- 대화 내용에서 회사명, 이름, 관심 제품 추출 가능하면 포함

### 2-3. Newsletter 구독

newsletter 구독 API가 있으면:
- `notifyNewLead(env, { type: 'newsletter', email: ... })` 호출

---

## Phase 3: 알림 DB 테이블

마이그레이션 추가:

```sql
CREATE TABLE IF NOT EXISTS admin_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read INTEGER DEFAULT 0,
  data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON admin_notifications(is_read, created_at);
```

D1 remote 적용.

notifyNewLead 함수에서 admin_notifications에도 INSERT:
```typescript
async function saveNotification(env: any, lead: LeadNotification) {
  await env.DB.prepare(
    'INSERT INTO admin_notifications (type, title, message, link, data) VALUES (?, ?, ?, ?, ?)'
  ).bind(
    'new_lead',
    `New ${lead.type} lead: ${lead.company || lead.name || lead.email || 'Unknown'}`,
    lead.message?.substring(0, 200) || '',
    '/admin/leads',
    JSON.stringify(lead)
  ).run();
}
```

---

## Phase 4: 대시보드 실시간 알림 UI

### 4-1. 알림 API

GET /api/admin/notifications
- 최신 알림 20개 반환
- ?unread=true → 읽지 않은 것만

PUT /api/admin/notifications/[id]/read
- is_read = 1로 업데이트

PUT /api/admin/notifications/read-all
- 전체 읽음 처리

### 4-2. 대시보드 알림 표시

Admin 대시보드(메인 페이지)에 추가:

1. **상단 헤더 알림 벨** (모든 admin 페이지에서 보임)
   - 🔔 아이콘 + 읽지 않은 알림 수 배지 (빨간 원)
   - 클릭하면 드롭다운: 최신 알림 5개 + "View All" 링크
   - 각 알림 클릭하면 해당 리드 페이지로 이동 + 읽음 처리

2. **대시보드 "Recent Leads" 섹션**
   - 최신 리드 5개 카드
   - 각 카드: 회사명, 이름, 국가 국기, 관심 제품, 시간 (2분 전), 소스 배지(Form/Chatbot/Newsletter)
   - "View All Leads →" 링크

3. **대시보드 KPI 카드 업데이트** (이미 있으면 데이터 연결)
   - Today's Leads 수
   - This Week's Leads 수
   - Chatbot Conversations (오늘)
   - Lead Conversion Rate

### 4-3. 자동 새로고침

대시보드에서 30초마다 알림 API 폴링:
```typescript
useEffect(() => {
  const interval = setInterval(fetchNotifications, 30000);
  return () => clearInterval(interval);
}, []);
```

---

## Phase 5: 빌드 + 배포

```bash
npm run build
git add -A
git commit -m "feat: Lead notification system - email alerts + dashboard notifications"
git push
```

빌드 실패하면 수정 후 재빌드.

---

## 핵심 규칙

1. 이메일 수신자: sh.lee@britzmedi.com (고정)
2. RESEND_API_KEY가 없으면 이메일은 스킵하되 대시보드 알림은 반드시 동작
3. 모든 리드 소스(contact form, chatbot, newsletter)에서 알림 발생
4. admin_notifications 테이블에 반드시 기록
5. 대시보드에서 실시간 확인 가능해야 함
6. 안 되는 부분은 보고하고 나머지 계속 진행
7. CHANGELOG.md, ARCHITECTURE.md 업데이트
