# 리드 폼 이메일 정책 강화 + 자동 기업 조사 + 영업 리포트

전부 순서대로 실행해. 중간에 멈추지 마.

---

## Phase 0: 현재 상태 확인

```bash
# 리드 제출 API 확인
cat src/pages/api/leads/index.ts

# 리드 스코링 로직 확인
grep -rn "score\|scoring\|lead_score" src/lib/ src/pages/api/ 2>/dev/null | head -20

# 이메일 검증 로직 확인
grep -rn "gmail\|yahoo\|hotmail\|naver\|free.*email\|portal.*email" src/ 2>/dev/null | head -20

# 리드 알림 이메일 템플릿 확인
grep -rn "notifyNewLead\|email.*notification\|lead.*email" src/lib/ 2>/dev/null | head -20

# leads 테이블 구조
npx wrangler d1 execute britzmedi-db --remote --command "PRAGMA table_info(leads)" 2>&1
```

결과 먼저 보여줘.

---

## Phase 1: 이메일 정책 강화

### 1-1. 무료 이메일 도메인 목록

파일: `src/lib/email-validation.ts`

```typescript
export const FREE_EMAIL_DOMAINS = [
  // 글로벌
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.kr', 'yahoo.co.jp',
  'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
  'aol.com', 'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me',
  'zoho.com', 'yandex.com', 'mail.com',
  'gmx.com', 'gmx.net',
  'tutanota.com', 'fastmail.com',
  // 한국
  'naver.com', 'hanmail.net', 'daum.net', 'kakao.com',
  'nate.com', 'empal.com', 'dreamwiz.com', 'korea.com',
  // 중국
  'qq.com', '163.com', '126.com', 'sina.com',
  // 일본
  'docomo.ne.jp', 'ezweb.ne.jp', 'softbank.ne.jp',
  // 동남아
  'rediffmail.com',
];

export function isFreeEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return FREE_EMAIL_DOMAINS.includes(domain);
}

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}
```

### 1-2. 서버 사이드 정책 (API)

`src/pages/api/leads/index.ts` 수정:

무료 이메일은 **저장은 하되, 별도 표시 + 낮은 점수** 부여:

```typescript
import { isFreeEmail, isValidEmailFormat, getEmailDomain } from '../../lib/email-validation';

// POST 핸들러 내부:

// 1. 이메일 형식 검증 — 형식 틀리면 거부
if (!isValidEmailFormat(email)) {
  return new Response(JSON.stringify({ 
    error: 'Invalid email format',
    field: 'email'
  }), { status: 400 });
}

// 2. 무료 이메일 체크 — 저장은 하지만 flag 처리
const isFree = isFreeEmail(email);
// leads 테이블에 is_free_email 컬럼으로 저장
// 스코어링에서 감점

// 3. 필수 필드 검증
const requiredFields = ['companyName', 'name', 'email', 'country', 'interestedIn'];
for (const field of requiredFields) {
  if (!body[field] || (Array.isArray(body[field]) && body[field].length === 0)) {
    return new Response(JSON.stringify({ 
      error: `${field} is required`,
      field 
    }), { status: 400 });
  }
}
```

### 1-3. 프론트엔드 강화 (LeadForm.astro)

무료 이메일 입력 시 **강한 경고 + 제출은 가능**:

기존 안내문이 약함. 변경:

```html
<!-- 이메일 입력 필드 아래 경고 -->
<div id="email-warning" class="hidden mt-1 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
  ⚠️ <strong>Company email recommended.</strong> Free email addresses (Gmail, Yahoo, etc.) result in lower priority processing. Please use your company email for faster response.
</div>
```

```javascript
// 실시간 이메일 검증
emailInput.addEventListener('input', function() {
  const domain = this.value.split('@')[1]?.toLowerCase();
  const freedomains = ['gmail.com','yahoo.com','hotmail.com','outlook.com','naver.com','hanmail.net','daum.net','kakao.com','qq.com','163.com','icloud.com','protonmail.com'];
  const warning = document.getElementById('email-warning');
  if (freedomains.includes(domain)) {
    warning.classList.remove('hidden');
  } else {
    warning.classList.add('hidden');
  }
});
```

---

## Phase 2: DB 스키마 확장

leads 테이블에 컬럼 추가 (없으면):

```sql
ALTER TABLE leads ADD COLUMN is_free_email INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN company_research TEXT;
ALTER TABLE leads ADD COLUMN research_status TEXT DEFAULT 'pending';
ALTER TABLE leads ADD COLUMN lead_grade TEXT DEFAULT 'C';
ALTER TABLE leads ADD COLUMN score_breakdown TEXT;
```

D1 remote 적용. 한 줄씩 별도 실행.

---

## Phase 3: 지능형 리드 스코링

파일: `src/lib/lead-scoring.ts`

```typescript
export interface ScoreBreakdown {
  email_quality: { score: number; max: 20; reason: string };
  company_info: { score: number; max: 20; reason: string };
  product_interest: { score: number; max: 20; reason: string };
  engagement_signals: { score: number; max: 20; reason: string };
  market_fit: { score: number; max: 20; reason: string };
  total: number;
  grade: 'A' | 'B' | 'C' | 'D';
}

export function scoreLead(data: {
  email: string;
  companyName: string;
  companyWebsite?: string;
  jobTitle?: string;
  country: string;
  interestedIn: string[];
  message?: string;
  source?: string;
  isFreeEmail: boolean;
  companyResearch?: any;
}): ScoreBreakdown {

  const breakdown: ScoreBreakdown = {
    email_quality: { score: 0, max: 20, reason: '' },
    company_info: { score: 0, max: 20, reason: '' },
    product_interest: { score: 0, max: 20, reason: '' },
    engagement_signals: { score: 0, max: 20, reason: '' },
    market_fit: { score: 0, max: 20, reason: '' },
    total: 0,
    grade: 'C'
  };

  // === 1. 이메일 품질 (20점) ===
  if (data.isFreeEmail) {
    breakdown.email_quality = { score: 5, max: 20, reason: `Free email (${data.email.split('@')[1]}) — low trust signal` };
  } else {
    const domain = data.email.split('@')[1];
    // 이메일 도메인과 회사 웹사이트 일치 여부
    const websiteDomain = data.companyWebsite?.replace(/https?:\/\//, '').replace(/www\./, '').split('/')[0];
    if (websiteDomain && domain?.includes(websiteDomain.split('.')[0])) {
      breakdown.email_quality = { score: 20, max: 20, reason: `Company email matching website domain` };
    } else {
      breakdown.email_quality = { score: 15, max: 20, reason: `Company email (${domain})` };
    }
  }

  // === 2. 회사 정보 충실도 (20점) ===
  let companyScore = 0;
  const companyReasons: string[] = [];
  
  if (data.companyName && data.companyName.length > 2) {
    companyScore += 5;
    companyReasons.push('Company name provided');
  }
  if (data.companyWebsite && data.companyWebsite.includes('.')) {
    companyScore += 5;
    companyReasons.push('Website provided');
  }
  if (data.jobTitle && data.jobTitle.length > 1) {
    companyScore += 5;
    companyReasons.push('Job title provided');
    // 의사결정권자 보너스
    const decisionMaker = /ceo|cto|coo|cfo|director|president|owner|founder|vp|vice president|general manager|head of|chief/i;
    if (decisionMaker.test(data.jobTitle)) {
      companyScore += 5;
      companyReasons.push('Decision-maker role');
    }
  }
  breakdown.company_info = { score: Math.min(companyScore, 20), max: 20, reason: companyReasons.join(', ') };

  // === 3. 제품 관심도 (20점) ===
  let productScore = 0;
  const productReasons: string[] = [];
  
  if (data.interestedIn.length > 0) {
    productScore += 5;
    productReasons.push(`${data.interestedIn.length} product(s) selected`);
  }
  // TORR RF 관심 = 주력 제품
  if (data.interestedIn.some(p => /torr/i.test(p))) {
    productScore += 5;
    productReasons.push('Interested in flagship TORR RF');
  }
  // Distribution/Partnership = 높은 가치
  if (data.interestedIn.some(p => /distribution|partner/i.test(p))) {
    productScore += 5;
    productReasons.push('Distribution/Partnership interest');
  }
  // OEM/ODM = 높은 가치
  if (data.interestedIn.some(p => /oem|odm/i.test(p))) {
    productScore += 5;
    productReasons.push('OEM/ODM inquiry');
  }
  breakdown.product_interest = { score: Math.min(productScore, 20), max: 20, reason: productReasons.join(', ') };

  // === 4. 인게이지먼트 신호 (20점) ===
  let engagementScore = 0;
  const engagementReasons: string[] = [];
  
  if (data.message && data.message.length > 50) {
    engagementScore += 10;
    engagementReasons.push('Detailed message provided');
  } else if (data.message && data.message.length > 10) {
    engagementScore += 5;
    engagementReasons.push('Brief message provided');
  }
  if (data.source && data.source !== 'unknown') {
    engagementScore += 5;
    engagementReasons.push(`Source: ${data.source}`);
  }
  // 챗봇에서 전환된 리드 보너스 (추후 확인)
  breakdown.engagement_signals = { score: Math.min(engagementScore, 20), max: 20, reason: engagementReasons.join(', ') || 'No additional signals' };

  // === 5. 시장 적합성 (20점) ===
  let marketScore = 0;
  const marketReasons: string[] = [];
  
  // 주요 타겟 시장 국가
  const tierOne = ['US', 'DE', 'GB', 'FR', 'JP', 'AU', 'CA', 'IT', 'ES', 'NL', 'SE', 'CH', 'AT', 'AE', 'SA', 'KW', 'QA'];
  const tierTwo = ['TH', 'VN', 'ID', 'MY', 'PH', 'SG', 'IN', 'BR', 'MX', 'TR', 'PL', 'CZ', 'RO', 'HU', 'EG', 'ZA', 'NG'];
  const tierThree = ['KR', 'CN']; // 국내/중국은 별도 채널
  
  const country = data.country?.toUpperCase();
  if (tierOne.includes(country)) {
    marketScore += 15;
    marketReasons.push(`Tier 1 market (${country})`);
  } else if (tierTwo.includes(country)) {
    marketScore += 10;
    marketReasons.push(`Tier 2 market (${country})`);
  } else if (tierThree.includes(country)) {
    marketScore += 3;
    marketReasons.push(`Domestic/China market (${country}) — use separate channel`);
  } else {
    marketScore += 7;
    marketReasons.push(`Other market (${country})`);
  }

  // 회사 조사 결과 반영 (Phase 4에서 추가)
  if (data.companyResearch) {
    const research = data.companyResearch;
    if (research.is_medical_business) {
      marketScore += 5;
      marketReasons.push('Confirmed medical/aesthetic business');
    }
  }

  breakdown.market_fit = { score: Math.min(marketScore, 20), max: 20, reason: marketReasons.join(', ') };

  // === 총점 + 등급 ===
  breakdown.total = breakdown.email_quality.score + breakdown.company_info.score + 
    breakdown.product_interest.score + breakdown.engagement_signals.score + breakdown.market_fit.score;
  
  if (breakdown.total >= 80) breakdown.grade = 'A';
  else if (breakdown.total >= 60) breakdown.grade = 'B';
  else if (breakdown.total >= 40) breakdown.grade = 'C';
  else breakdown.grade = 'D';

  return breakdown;
}
```

---

## Phase 4: 자동 기업 조사 모듈

파일: `src/lib/lead-research.ts`

리드 들어오면 Claude API + Web Search로 회사 자동 조사:

```typescript
export async function researchCompany(env: any, data: {
  companyName: string;
  companyWebsite?: string;
  email: string;
  country: string;
  jobTitle?: string;
  interestedIn: string[];
}): Promise<CompanyResearch> {
  try {
    const emailDomain = data.email.split('@')[1];
    
    const prompt = `Research this company that submitted an inquiry to BRITZMEDI (Korean aesthetic medical device manufacturer).

Company: ${data.companyName}
Website: ${data.companyWebsite || 'Not provided'}
Email domain: ${emailDomain}
Country: ${data.country}
Contact job title: ${data.jobTitle || 'Not provided'}
Products interested in: ${data.interestedIn.join(', ')}

Search the web and provide a structured intelligence report. Return JSON only, no markdown:

{
  "company_overview": {
    "full_name": "Official company name",
    "website_status": "active|inactive|not_found",
    "industry": "aesthetic clinic|distributor|hospital|manufacturer|unknown",
    "business_type": "clinic|distributor|wholesaler|hospital_group|individual|unknown",
    "estimated_size": "small (<10)|medium (10-50)|large (50-200)|enterprise (200+)|unknown",
    "year_established": "YYYY or unknown",
    "location": "City, Country"
  },
  "relevance_assessment": {
    "is_medical_business": true/false,
    "is_aesthetic_focused": true/false,
    "is_potential_distributor": true/false,
    "is_existing_clinic": true/false,
    "has_existing_rf_devices": "yes|no|unknown",
    "competitor_devices_used": ["Device names if found"],
    "assessment_summary": "1-2 sentence assessment of this lead's potential value"
  },
  "market_context": {
    "country_market_size": "Brief note on aesthetic device market in their country",
    "regulatory_environment": "Brief note on medical device regulations in their country",
    "distribution_landscape": "Who are major distributors in their market"
  },
  "red_flags": [
    "Any concerns: fake company, mismatch between email and company, suspicious patterns"
  ],
  "recommended_action": "Priority follow-up within 24h|Standard follow-up within 3 days|Low priority — verify first|Likely spam — do not pursue",
  "talking_points": [
    "Suggested conversation starters based on research",
    "Key questions to ask this lead"
  ],
  "confidence_score": 0-100
}

If you cannot find information about this company, say so honestly. Do NOT fabricate company details.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const apiData = await response.json();
    const textContent = apiData.content
      ?.filter(b => b.type === 'text')
      ?.map(b => b.text)
      ?.join('\n') || '';

    // JSON 추출
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { error: 'Could not parse research results', raw: textContent };
  } catch (e: any) {
    console.error('Company research error:', e);
    return { error: e.message };
  }
}
```

---

## Phase 5: 영업 리포트 이메일 템플릿

파일: `src/lib/email-notifications.ts` 수정

기존 notifyNewLead 이메일을 **영업 인텔리전스 리포트** 형식으로 업그레이드:

```typescript
export function buildLeadReportEmail(data: {
  lead: any;
  scoring: ScoreBreakdown;
  research: any;
}): { subject: string; html: string } {
  const { lead, scoring, research } = data;
  
  const gradeColor = {
    'A': '#16a34a', // green
    'B': '#2563eb', // blue
    'C': '#d97706', // amber
    'D': '#dc2626', // red
  }[scoring.grade] || '#6b7280';

  const gradeEmoji = { 'A': '🔥', 'B': '👍', 'C': '📋', 'D': '⚠️' }[scoring.grade] || '📋';

  const subject = `${gradeEmoji} New Lead [${scoring.grade}] — ${lead.companyName} (${lead.country})`;

  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
    
    <!-- Header -->
    <div style="background: ${gradeColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 20px;">New Lead — BRITZMEDI</h1>
      <p style="margin: 4px 0 0; opacity: 0.9;">Grade ${scoring.grade} · Score ${scoring.total}/100 · ${lead.country}</p>
    </div>

    <!-- Lead Info -->
    <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0;">
      <h2 style="margin: 0 0 12px; font-size: 16px; color: #1e293b;">📇 Lead Information</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 120px;">Company</td><td style="padding: 6px 0; font-weight: bold;">${lead.companyName}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Website</td><td style="padding: 6px 0;">${lead.companyWebsite || '—'}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Name</td><td style="padding: 6px 0;">${lead.name}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Title</td><td style="padding: 6px 0;">${lead.jobTitle || '—'}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Email</td><td style="padding: 6px 0;"><a href="mailto:${lead.email}">${lead.email}</a>${lead.isFreeEmail ? ' ⚠️ Free email' : ''}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Country</td><td style="padding: 6px 0;">${lead.country}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Products</td><td style="padding: 6px 0;">${lead.interestedIn?.join(', ') || '—'}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Message</td><td style="padding: 6px 0;">${lead.message || '—'}</td></tr>
      </table>
    </div>

    <!-- Score Breakdown -->
    <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
      <h2 style="margin: 0 0 12px; font-size: 16px; color: #1e293b;">📊 Score Breakdown (${scoring.total}/100)</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0;">Email Quality</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold;">${scoring.email_quality.score}/${scoring.email_quality.max}</td>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px; padding-left: 8px;">${scoring.email_quality.reason}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0;">Company Info</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold;">${scoring.company_info.score}/${scoring.company_info.max}</td>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px; padding-left: 8px;">${scoring.company_info.reason}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0;">Product Interest</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold;">${scoring.product_interest.score}/${scoring.product_interest.max}</td>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px; padding-left: 8px;">${scoring.product_interest.reason}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0;">Engagement</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold;">${scoring.engagement_signals.score}/${scoring.engagement_signals.max}</td>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px; padding-left: 8px;">${scoring.engagement_signals.reason}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0;">Market Fit</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold;">${scoring.market_fit.score}/${scoring.market_fit.max}</td>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px; padding-left: 8px;">${scoring.market_fit.reason}</td>
        </tr>
      </table>
    </div>

    <!-- Company Research (AI) -->
    ${research && !research.error ? `
    <div style="background: #f0f9ff; padding: 20px; border: 1px solid #bae6fd; border-top: none;">
      <h2 style="margin: 0 0 12px; font-size: 16px; color: #0c4a6e;">🔍 AI Company Research</h2>
      
      <p style="margin: 0 0 8px;"><strong>Industry:</strong> ${research.company_overview?.industry || 'Unknown'}</p>
      <p style="margin: 0 0 8px;"><strong>Business Type:</strong> ${research.company_overview?.business_type || 'Unknown'}</p>
      <p style="margin: 0 0 8px;"><strong>Size:</strong> ${research.company_overview?.estimated_size || 'Unknown'}</p>
      <p style="margin: 0 0 8px;"><strong>Website Status:</strong> ${research.company_overview?.website_status || 'Unknown'}</p>
      
      ${research.relevance_assessment?.assessment_summary ? 
        `<p style="margin: 12px 0 8px; padding: 10px; background: white; border-left: 3px solid #0ea5e9; border-radius: 4px;">
          <strong>Assessment:</strong> ${research.relevance_assessment.assessment_summary}
        </p>` : ''}
      
      ${research.relevance_assessment?.competitor_devices_used?.length > 0 ? 
        `<p style="margin: 0 0 8px;"><strong>Current Devices:</strong> ${research.relevance_assessment.competitor_devices_used.join(', ')}</p>` : ''}
      
      ${research.red_flags?.length > 0 ? 
        `<div style="margin-top: 8px; padding: 10px; background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 4px;">
          <strong>⚠️ Red Flags:</strong><br>${research.red_flags.join('<br>')}
        </div>` : ''}

      <div style="margin-top: 12px; padding: 10px; background: white; border-radius: 4px;">
        <strong>📌 Recommended Action:</strong><br>
        ${research.recommended_action || 'Standard follow-up'}
      </div>

      ${research.talking_points?.length > 0 ? 
        `<div style="margin-top: 12px;">
          <strong>💬 Suggested Talking Points:</strong>
          <ul style="margin: 4px 0; padding-left: 20px;">
            ${research.talking_points.map(tp => `<li style="margin: 4px 0;">${tp}</li>`).join('')}
          </ul>
        </div>` : ''}

      ${research.market_context?.country_market_size ? 
        `<div style="margin-top: 12px; font-size: 13px; color: #64748b;">
          <strong>Market Context:</strong> ${research.market_context.country_market_size}
        </div>` : ''}
    </div>
    ` : `
    <div style="background: #fff7ed; padding: 20px; border: 1px solid #fed7aa; border-top: none;">
      <p style="margin: 0; color: #9a3412;">⚠️ Company research unavailable. Manual verification recommended.</p>
    </div>
    `}

    <!-- CTA -->
    <div style="padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <a href="https://britzmedi.com/admin/leads" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Admin →</a>
    </div>
  </div>`;

  return { subject, html };
}
```

---

## Phase 6: 리드 제출 플로우 통합

`src/pages/api/leads/index.ts`의 POST 핸들러 전체 흐름:

```typescript
// 1. 유효성 검사 (이메일 형식, 필수 필드)
// 2. 무료 이메일 체크
const isFree = isFreeEmail(body.email);

// 3. leads 테이블에 저장
const insertResult = await env.DB.prepare(
  `INSERT INTO leads (company_name, company_website, name, job_title, email, country, interested_in, message, source, is_free_email, research_status, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
).bind(/* ... */).run();
const leadId = insertResult.meta.last_row_id;

// 4. 1차 스코어링 (회사 조사 전)
const initialScoring = scoreLead({
  email: body.email,
  companyName: body.companyName,
  companyWebsite: body.companyWebsite,
  jobTitle: body.jobTitle,
  country: body.country,
  interestedIn: body.interestedIn,
  message: body.message,
  source: body.source,
  isFreeEmail: isFree,
});

// 5. 즉시 1차 알림 이메일 발송 (스코어링만, 조사 전)
// → 영업팀이 빨리 확인할 수 있도록

// 6. 비동기로 회사 조사 실행 (시간 소요)
// waitUntil 사용 (Cloudflare Workers)
const ctx = locals?.runtime?.ctx;
if (ctx?.waitUntil) {
  ctx.waitUntil((async () => {
    try {
      // 회사 조사
      const research = await researchCompany(env, {
        companyName: body.companyName,
        companyWebsite: body.companyWebsite,
        email: body.email,
        country: body.country,
        jobTitle: body.jobTitle,
        interestedIn: body.interestedIn
      });

      // 조사 결과로 재스코어링
      const finalScoring = scoreLead({
        ...initialScoringInput,
        companyResearch: research
      });

      // DB 업데이트
      await env.DB.prepare(
        `UPDATE leads SET company_research = ?, research_status = 'completed', lead_grade = ?, score_breakdown = ?, lead_score = ? WHERE id = ?`
      ).bind(
        JSON.stringify(research),
        finalScoring.grade,
        JSON.stringify(finalScoring),
        finalScoring.total,
        leadId
      ).run();

      // 2차 알림: 완전한 리포트 이메일
      const { subject, html } = buildLeadReportEmail({
        lead: { ...body, isFreeEmail: isFree },
        scoring: finalScoring,
        research
      });
      
      await sendEmail(env, {
        to: 'sh.lee@britzmedi.com',
        subject,
        html
      });

      // admin_notifications 업데이트
      await env.DB.prepare(
        `INSERT INTO admin_notifications (type, title, message, link, data) VALUES (?, ?, ?, ?, ?)`
      ).bind(
        'lead_researched',
        `🔍 Lead Research Complete: ${body.companyName}`,
        `Grade ${finalScoring.grade} (${finalScoring.total}/100) — ${research.recommended_action || 'Review needed'}`,
        `/admin/leads`,
        JSON.stringify({ lead_id: leadId, grade: finalScoring.grade, score: finalScoring.total })
      ).run();

    } catch (e) {
      console.error('Lead research failed:', e);
      await env.DB.prepare(
        `UPDATE leads SET research_status = 'failed' WHERE id = ?`
      ).bind(leadId).run();
    }
  })());
}

// 7. 즉시 응답 (조사는 백그라운드에서 진행)
return new Response(JSON.stringify({ success: true, leadId }), { status: 200 });
```

---

## Phase 7: Admin Leads 페이지 업데이트

/admin/leads 페이지에서 리서치 결과 표시:

- 리드 목록에 Grade 배지 (A/B/C/D 색상)
- 리드 상세에서 Company Research 섹션 표시
- research_status: pending → 🔄 Researching... | completed → ✅ | failed → ❌ Retry

---

## Phase 8: 빌드 + 배포

```bash
npm run build
git add -A
git commit -m "feat: Intelligent lead scoring + automated company research + sales intelligence report email"
git push
```

---

## Phase 9: 테스트

1. Contact Form에서 Gmail로 제출:
   - 경고 메시지 표시되는지
   - DB에 is_free_email=1로 저장되는지
   - 스코어에서 email_quality 감점되는지

2. Contact Form에서 회사 이메일로 제출:
   - 스코어 높은지
   - 회사 조사 이메일이 오는지 (1차 즉시 + 2차 조사 완료 후)

3. sh.lee@britzmedi.com에 오는 이메일 확인:
   - Score Breakdown 5개 항목
   - AI Company Research 섹션
   - Recommended Action
   - Talking Points

---

## 핵심 규칙

1. 무료 이메일은 저장은 하되 감점 + 경고 표시
2. 회사 조사는 비동기 (waitUntil) — 사용자 응답 지연 X
3. 1차 알림은 즉시 발송 (스코어만), 2차 리포트는 조사 완료 후
4. 가짜 회사 정보 감지 시 red_flags에 표시
5. 스코어링 5개 축: 이메일, 회사정보, 제품관심, 인게이지먼트, 시장적합성
6. Claude API web_search로 실제 회사 조사 — 허위 정보 생성 금지
7. 안 되는 부분은 보고하고 나머지 계속 진행
8. 빌드 + 배포까지 완료해야 끝
