# BRITZMEDI Global - Chatbot Integration Session

**Session Date**: 2026-01-25  
**Session ID**: ses_40f11b1c3ffeIe4TRwOVapKyEc  
**Agent**: Metis (Pre-Planning Consultant)  
**Status**: Gap Analysis Complete, Awaiting User Actions

---

## Session Overview

Planning OH-MY-OPENCODE setup for BRITZMEDI Global website with focus on Crisp chatbot integration and FAQ knowledge base training.

### Project Context
- **Repository**: C:\Users\J\Projects\britzmedi-global
- **Live Site**: https://britzmedi-homepage-only-en.pages.dev
- **Tech Stack**: Astro 5.16.15 + Tailwind CSS 4.1.18 + React 19.2.3
- **Hosting**: Cloudflare Pages (auto-deploy from GitHub)
- **Version**: 1.1.0

---

## Primary Objectives

### 1. Crisp Chatbot Integration (Priority 1)
**Goal**: Integrate Crisp live chat widget with AI chatbot trained on FAQ knowledge base

**Requirements**:
- Embed Crisp widget via script tag
- Train AI on FAQ content (18 items from `src/content/faq.ts`)
- Configure email notifications to sh.lee@britzmedi.co.kr
- Enable Knowledge Base feature

**Current Status**:
- ✅ FAQ content exists: 18 items across 5 categories
- ✅ Tawk.to widget already integrated (Property ID: 69750b239602761980a882d2)
- ⚠️ Crisp account NOT YET CREATED
- ⚠️ FAQ count discrepancy: Requirements stated 25 items, actual file has 18

**Blocking Issues**:
1. **Crisp Account Creation Required**
   - Need Website ID for widget embed
   - Need access to AI Hub for FAQ training
   - Need dashboard access for email notification setup

2. **Crisp Plan Confirmation Needed**
   - AI features require Unlimited plan ($95/month) or higher
   - Free plan only includes basic live chat

3. **FAQ Training Method**
   - Crisp AI cannot be trained programmatically via API
   - Requires manual upload via dashboard OR Help Desk articles
   - Skill can only PREPARE content, not DEPLOY it

### 2. Emailable API Integration
**Goal**: Add email verification to contact form

**Requirements**:
- Integrate Emailable API for email validation
- Preserve existing EmailJS integration
- Handle rate limiting gracefully (10 verifications/day/IP on free tier)

**Current Status**:
- ✅ EmailJS already integrated (service_nbk0net, template_azmskha)
- ✅ Contact form has sophisticated client-side validation
- ⚠️ Provided API key is PRIVATE key (security risk)
- ⚠️ Need PUBLIC API key with trusted domains

**Security Issues**:
- API Key `live_4138dbff4cdc1a19d147` is a PRIVATE key (starts with `live_`)
- MUST create PUBLIC API key in Emailable dashboard
- MUST configure trusted domains (britzmedi.com, localhost)
- Public keys are rate-limited to 10 verifications/day/IP

### 3. Custom OH-MY-OPENCODE Skills (4 skills)

**Priority Order**:
1. `britzmedi-ai-chatbot` - Crisp integration + FAQ knowledge base
2. `britzmedi-deployment` - Build/deploy automation
3. `britzmedi-aeo-geo-seo-audit` - Combined AEO/GEO/SEO checker
4. `britzmedi-content-manager` - Content updates (products, FAQ, resources)

**Current Status**:
- ✅ Skills directory exists: `.opencode/skills/`
- ✅ 5 skill files already created:
  - britzmedi-ai-chatbot.md
  - britzmedi-deployment.md
  - britzmedi-aeo-geo-seo-audit.md
  - britzmedi-content-manager.md
  - britzmedi-frontend-publishing.md

### 4. .opencode Context Files
**Goal**: Generate project documentation files

**Current Status**:
- ✅ README.md - Complete (106 lines)
- ✅ architecture.md - Exists
- ✅ conventions.md - Exists
- ✅ workflows.md - Exists
- ✅ skills/ directory - 5 skills documented

---

## Gap Analysis Results

### CRITICAL Gaps (Blocking)

#### 1. FAQ Count Discrepancy
- **Stated**: 25 FAQ items
- **Actual**: 18 items in `src/content/faq.ts`
- **Impact**: Chatbot training incomplete, user expectation mismatch
- **Action Required**: Confirm if 18 is correct OR provide 7 additional FAQs

#### 2. Crisp Account Not Created
- **Impact**: Cannot obtain Website ID, cannot access AI Hub, cannot configure notifications
- **Action Required**: User must create Crisp account and provide:
  - Website ID
  - API credentials (if using API)
  - Confirm plan tier (AI requires Unlimited plan)

#### 3. Emailable API Key Security
- **Issue**: Provided key is PRIVATE key, not safe for client-side use
- **Impact**: API key exposure risk, potential credit drain
- **Action Required**: Create PUBLIC API key with trusted domains

### HIGH Priority Gaps

#### 4. Crisp AI Training Method
- **Issue**: Cannot programmatically train Crisp AI via API
- **Impact**: Skill can only prepare content, not deploy it
- **Solution**: Generate FAQ content in Crisp-compatible format + manual upload instructions

#### 5. Emailable Rate Limiting
- **Issue**: Public API keys limited to 10 verifications/day/IP
- **Impact**: High-traffic contact form will hit limits
- **Solution**: Implement graceful degradation, fall back to client-side validation

#### 6. Contact Form Integration Point
- **Issue**: EmailJS already integrated, unclear if Emailable replaces or supplements
- **Impact**: Risk of breaking existing functionality
- **Solution**: Preserve EmailJS, ADD Emailable as supplementary validation

### MEDIUM Priority Gaps

#### 7. AEO/GEO/SEO Audit Scope Undefined
- **Issue**: No specific checks defined
- **Action Required**: Define what audit should check (Schema.org, meta tags, Core Web Vitals, etc.)

#### 8. Content Manager Scope vs CMS Deferral
- **Issue**: CMS deferred, but content manager skill expected
- **Action Required**: Clarify which files are in scope (faq.ts, products.ts, hero.ts, resources.ts?)

---

## FAQ Content Structure

**File**: `src/content/faq.ts`  
**Total Items**: 18  
**Categories**: 5

| Category | Count | Topics |
|----------|-------|--------|
| Products | 5 | TORR RF, ULBLANC, NEWCHAE SHOT, LUMINO WAVE |
| Company | 4 | History, manufacturing, quality, R&D |
| Ordering | 3 | Distribution, pricing, MOQ |
| Technical | 3 | Installation, training, support |
| Certifications | 3 | FDA, MFDS, ISO 13485 |

**Sample FAQ Items**:
1. What is TORR RF and what are its main applications?
2. Is TORR RF FDA cleared?
3. What makes ULBLANC different from other ultrasound devices?
4. Can NEWCHAE SHOT be used at home?
5. When will LUMINO WAVE be available?

---

## Integrations Status

### Current Integrations

#### EmailJS (Contact Form)
- **Status**: ✅ Active
- **Service ID**: service_nbk0net
- **Template ID**: template_azmskha
- **Recipient**: sh.lee@britzmedi.co.kr
- **Features**: Client-side validation, disposable domain blocking, typo detection

#### Tawk.to (Live Chat)
- **Status**: ✅ Active
- **Property ID**: 69750b239602761980a882d2
- **Widget ID**: 1jfoj70v5
- **Features**: Live chat, AI chatbot (100 free messages/month), Knowledge Base

### Planned Integrations

#### Crisp (Chatbot)
- **Status**: ⏸️ Blocked - Account not created
- **Plan**: Unlimited ($95/month) for AI features
- **Training**: Manual upload via dashboard

#### Emailable (Email Verification)
- **Status**: ⏸️ Blocked - Need PUBLIC API key
- **Rate Limit**: 10 verifications/day/IP
- **Integration Point**: Contact form (lines 399-428 in contact.astro)

---

## Recommended Phased Approach

### Phase 0: User Actions (BLOCKING)
1. ⏸️ Create Crisp account → Provide Website ID
2. ⏸️ Create Emailable PUBLIC API key → Configure trusted domains
3. ⏸️ Confirm FAQ count (18 or 25?)
4. ⏸️ Confirm Crisp plan tier (Unlimited for AI?)

### Phase 1: No Dependencies
1. ✅ .opencode context files (COMPLETE)
2. ✅ Vitest setup (COMPLETE - package.json has test scripts)
3. Hero image update (if needed)

### Phase 2: After Phase 0
1. Emailable API integration (contact form)
2. Crisp widget embed (script tag)
3. Generate FAQ content in Crisp-compatible format

### Phase 3: After Phase 2
1. Custom skills implementation
2. Deployment automation
3. Content manager

### Phase 4: Manual Steps
1. User uploads FAQ content to Crisp dashboard
2. User configures email notifications
3. User tests chatbot responses

---

## Questions for User (Priority Order)

### Critical (Blocking):
1. **Crisp Account**: Can you create the Crisp account now and provide the Website ID?
2. **Emailable Key**: Can you create a PUBLIC API key with `britzmedi.com` as trusted domain?
3. **FAQ Count**: faq.ts has 18 items, not 25. Should we add 7 more FAQs, or is 18 correct?

### High Priority:
4. **Emailable Integration**: Should Emailable REPLACE or SUPPLEMENT the existing email validation?
5. **Crisp Plan**: Which Crisp plan will you use? AI features require Unlimited plan ($95/mo).

### Medium Priority:
6. **AEO/GEO/SEO Audit**: What specific checks should the audit skill perform?
7. **Content Manager Scope**: Which content files should the skill manage?
8. **Google Drive Links**: Are the placeholder links in resources.ts in scope?

---

## Technical Details

### Project Structure
```
britzmedi-global/
├── .opencode/
│   ├── skills/
│   │   ├── britzmedi-ai-chatbot.md
│   │   ├── britzmedi-deployment.md
│   │   ├── britzmedi-aeo-geo-seo-audit.md
│   │   ├── britzmedi-content-manager.md
│   │   └── britzmedi-frontend-publishing.md
│   ├── sessions/                    # THIS DIRECTORY
│   │   └── 2026-01-25-chatbot-integration.md
│   ├── README.md
│   ├── architecture.md
│   ├── conventions.md
│   └── workflows.md
├── src/
│   ├── content/
│   │   ├── faq.ts                   # 18 FAQ items
│   │   ├── products.ts              # 4 products
│   │   ├── company.ts
│   │   ├── hero.ts
│   │   ├── resources.ts
│   │   └── certifications.ts
│   └── pages/
│       └── contact.astro            # Lines 399-428: EmailJS integration
└── package.json
```

### Git Status
```
Branch: main (up to date with origin/main)
Untracked files:
  - backend/
  - src/lib/medical-ad-rules-extended.js
  - src/rules/
```

### Recent Commits
```
e102bdf feat: Add Frontend Publishing Specialist skill
96f5a1b fix: Improve Hero section responsive layout
eda7429 feat: Change hero background to image with 50% opacity overlay
cab9ceb Revert "feat: Remove Consentmanager - enable direct Google Analytics"
965eab2 feat: Remove Consentmanager - enable direct Google Analytics
```

---

## Next Steps

1. **User Actions Required** (Phase 0)
   - Create Crisp account
   - Create Emailable PUBLIC API key
   - Confirm FAQ count and scope

2. **Implementation Ready** (Phase 1)
   - .opencode files already complete
   - Vitest already configured
   - Skills documented

3. **Awaiting Clarification**
   - Audit scope definition
   - Content manager scope
   - Integration strategy (replace vs supplement)

---

## Related Sessions

- **Session ID**: ses_40f11b1c3ffeIe4TRwOVapKyEc
- **Related Session**: ses_40efd932cffejwkl8rGOX8HSIa (Tawk.to research)
- **Related Session**: ses_40efff5b9ffevxQ0QRlQ7vTpbu (Crisp research)

---

**Session Status**: ⏸️ Paused - Awaiting User Actions  
**Last Updated**: 2026-01-25  
**Next Action**: User to create Crisp account and provide credentials
