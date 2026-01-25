# Emailable API Integration Guide

**Status:** Ready for implementation once PUBLIC API key is created  
**Last Updated:** January 25, 2026  
**Integration Type:** Email Verification (Supplementary to EmailJS)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create PUBLIC API Key](#step-1-create-public-api-key)
3. [Step 2: Configure Trusted Domains](#step-2-configure-trusted-domains)
4. [Step 3: Integrate with Contact Form](#step-3-integrate-with-contact-form)
5. [Step 4: Handle Rate Limiting](#step-4-handle-rate-limiting)
6. [Step 5: Test Integration](#step-5-test-integration)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)

---

## Prerequisites

Before starting the integration, ensure you have:

- ✅ Emailable account created (https://emailable.com)
- ✅ Access to Emailable dashboard
- ✅ Understanding of PUBLIC vs PRIVATE API keys
- ✅ Current EmailJS integration working (Service ID: `service_nbk0net`, Template ID: `template_azmskha`)
- ✅ Contact form located at: `src/pages/contact.astro`

### Important: API Key Types

| Key Type | Usage | Security | Where to Use |
|----------|-------|----------|--------------|
| **PUBLIC Key** | Client-side verification | Safe for frontend | Browser/JavaScript |
| **PRIVATE Key** | Server-side operations | ⚠️ NEVER expose | Backend only |

**Current Status:** The codebase contains a PRIVATE key (`live_4138dbff4cdc1a19d147`) which should be removed and replaced with a PUBLIC key.

---

## Step 1: Create PUBLIC API Key

### In Emailable Dashboard:

1. **Log in** to https://dashboard.emailable.com
2. **Navigate** to Settings → API Keys
3. **Click** "Create New API Key"
4. **Select** API Key Type: **PUBLIC**
5. **Name it:** `britzmedi-contact-form` (or similar)
6. **Copy** the generated PUBLIC key (format: `live_xxxxxxxxxxxxxxxxxxxxxxxx`)
7. **Save** it securely (you'll need it in Step 3)

### Example PUBLIC Key Format:
```
live_ffc42efd002265fef603
```

---

## Step 2: Configure Trusted Domains

### In Emailable Dashboard:

1. **Go to** Settings → API Keys → Your PUBLIC Key
2. **Find** "Trusted Domains" section
3. **Add** the following domains:
   - `britzmedi.com` (production)
   - `www.britzmedi.com` (production)
   - `localhost:3000` (development)
   - `localhost:4321` (Astro dev server)

### Why Trusted Domains?

- **Security:** Restricts API key usage to your domains only
- **CORS:** Prevents unauthorized cross-origin requests
- **Rate Limiting:** Applies per-domain, not per-key

---

## Step 3: Integrate with Contact Form

### Current Integration Status

The contact form in `src/pages/contact.astro` already has:
- ✅ EmailJS integration (lines 363-366)
- ✅ Client-side email validation (lines 401-431)
- ✅ Emailable API structure (lines 433-476)
- ⚠️ PRIVATE key that needs replacement

### Code Changes Required

**File:** `src/pages/contact.astro`

**Location:** Lines 369 (Emailable configuration)

**Current Code:**
```javascript
// Emailable API Configuration (for server-side email verification)
const EMAILABLE_PUBLIC_KEY = 'live_ffc42efd002265fef603';
```

**Replace With:**
```javascript
// Emailable API Configuration (for server-side email verification)
const EMAILABLE_PUBLIC_KEY = 'YOUR_PUBLIC_API_KEY_HERE';
```

### Step-by-Step Replacement:

1. **Open** `src/pages/contact.astro`
2. **Find** line 369 with `const EMAILABLE_PUBLIC_KEY = ...`
3. **Replace** the key value with your PUBLIC key from Step 1
4. **Save** the file
5. **Verify** no PRIVATE keys remain in the codebase

### Code Snippet: Complete Emailable Integration

The following code is already in place and handles:
- ✅ Email format validation
- ✅ Disposable email detection
- ✅ Common typo detection
- ✅ Emailable API verification
- ✅ Rate limit fallback (429 errors)
- ✅ Graceful degradation

```javascript
// Email validation function (client-side)
function validateEmail(email: string): { valid: boolean; message?: string } {
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }
  
  // Check for disposable email domains
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableEmailDomains.includes(domain)) {
    return { valid: false, message: 'Please use a business or personal email address. Temporary emails are not accepted.' };
  }
  
  // Check for common typos in popular domains
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const typoPatterns: Record<string, string[]> = {
    'gmail.com': ['gmai.com', 'gmial.com', 'gamil.com', 'gmal.com', 'gmail.co', 'gmail.cm'],
    'yahoo.com': ['yaho.com', 'yahooo.com', 'yahoo.co', 'yahoo.cm'],
    'hotmail.com': ['hotmai.com', 'hotmal.com', 'hotmail.co', 'hotmail.cm'],
    'outlook.com': ['outlok.com', 'outloo.com', 'outlook.co', 'outlook.cm'],
  };
  
  for (const [correct, typos] of Object.entries(typoPatterns)) {
    if (typos.includes(domain)) {
      return { valid: false, message: `Did you mean ${email.split('@')[0]}@${correct}?` };
    }
  }
  
  return { valid: true };
}

// Emailable API verification (with rate limit fallback)
async function verifyEmailWithEmailable(email: string): Promise<{ valid: boolean; message?: string }> {
  try {
    const response = await fetch(
      `https://api.emailable.com/v1/verify?email=${encodeURIComponent(email)}&api_key=YOUR_PUBLIC_API_KEY_HERE`
    );
    
    // Rate limited (10/day/IP on free plan) - fall back to client-side validation
    if (response.status === 429) {
      console.log('Emailable rate limit reached, using client-side validation');
      return validateEmail(email);
    }
    
    // Other errors - fall back to client-side validation
    if (!response.ok) {
      console.warn('Emailable API error, using client-side validation');
      return validateEmail(email);
    }
    
    const data = await response.json();
    
    // Check Emailable response states
    // state: 'deliverable', 'undeliverable', 'risky', 'unknown', 'catch-all'
    if (data.state === 'deliverable') {
      return { valid: true };
    }
    
    if (data.state === 'undeliverable') {
      return { valid: false, message: 'This email address appears to be invalid. Please check and try again.' };
    }
    
    if (data.state === 'risky') {
      // Accept risky emails but they passed basic validation
      return { valid: true };
    }
    
    // For 'unknown' or 'catch-all', accept if client-side validation passes
    return validateEmail(email);
    
  } catch (error) {
    console.warn('Emailable verification failed, using client-side validation:', error);
    return validateEmail(email);
  }
}
```

### Form Submission Integration

The form submission already includes Emailable verification:

```javascript
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Validate email before submission (client-side first, then Emailable API)
  const emailValue = (document.getElementById('email') as HTMLInputElement)?.value?.trim();
  
  // Quick client-side validation first
  const clientValidation = validateEmail(emailValue || '');
  if (!clientValidation.valid) {
    showStatus('error', clientValidation.message || 'Please enter a valid email address.');
    return;
  }
  
  setLoading(true);
  
  // Server-side verification via Emailable API (with graceful fallback)
  const emailableValidation = await verifyEmailWithEmailable(emailValue || '');
  if (!emailableValidation.valid) {
    showStatus('error', emailableValidation.message || 'Please enter a valid email address.');
    setLoading(false);
    return;
  }
  
  // ... rest of EmailJS submission code
});
```

---

## Step 4: Handle Rate Limiting

### Rate Limit Details

**Emailable FREE Plan:**
- 10 verifications per day per IP address
- Returns HTTP 429 (Too Many Requests)

### Graceful Degradation Strategy

The integration automatically handles rate limiting:

1. **First Attempt:** Calls Emailable API
2. **If Rate Limited (429):** Falls back to client-side validation
3. **If API Error:** Falls back to client-side validation
4. **Client-Side Validation:** Checks format, disposable domains, typos

### User Experience

```
User enters email → Client-side validation (instant)
                 ↓
              Valid format? → No → Show error
                 ↓ Yes
              Emailable API call
                 ↓
         Rate limited (429)? → Yes → Use client-side validation
                 ↓ No
         API error? → Yes → Use client-side validation
                 ↓ No
         Check response state
                 ↓
    Deliverable/Risky → Allow submission
    Undeliverable → Show error
    Unknown/Catch-all → Use client-side validation
```

### Monitoring Rate Limits

Add this to your monitoring/logging:

```javascript
// In verifyEmailWithEmailable function
if (response.status === 429) {
  // Log rate limit hit for monitoring
  console.warn('Emailable rate limit reached', {
    timestamp: new Date().toISOString(),
    email: email.split('@')[1], // Log domain only, not full email
    ip: 'client-side (not available)',
  });
  
  // Optionally notify admin
  // await notifyAdmin('Emailable rate limit reached');
}
```

---

## Step 5: Test Integration

### Testing Checklist

#### ✅ Pre-Integration Tests

- [ ] Verify PRIVATE key has been removed from codebase
- [ ] Confirm PUBLIC key is created in Emailable dashboard
- [ ] Confirm trusted domains are configured
- [ ] Run `npm run build` to check for errors

#### ✅ Unit Tests

Test each validation scenario:

```javascript
// Test 1: Valid email
const result1 = validateEmail('john@company.com');
console.assert(result1.valid === true, 'Valid email should pass');

// Test 2: Invalid format
const result2 = validateEmail('invalid-email');
console.assert(result2.valid === false, 'Invalid format should fail');

// Test 3: Disposable email
const result3 = validateEmail('test@tempmail.com');
console.assert(result3.valid === false, 'Disposable email should fail');

// Test 4: Common typo
const result4 = validateEmail('john@gmai.com');
console.assert(result4.valid === false, 'Gmail typo should fail');
```

#### ✅ Integration Tests

Test the complete flow:

1. **Open** contact form at `https://localhost:4321/contact`
2. **Enter** valid email: `test@company.com`
3. **Verify** green checkmark appears
4. **Submit** form
5. **Verify** success message appears
6. **Check** email received in EmailJS inbox

#### ✅ Error Handling Tests

Test error scenarios:

| Scenario | Input | Expected Result |
|----------|-------|-----------------|
| Invalid format | `invalid@` | Red X, error message |
| Disposable email | `test@tempmail.com` | Red X, error message |
| Gmail typo | `john@gmai.com` | Red X, suggestion |
| Rate limited | 11th email in day | Falls back to client-side |
| API error | Network down | Falls back to client-side |

#### ✅ Rate Limit Test

1. **Submit** 10 valid emails (should all pass)
2. **Submit** 11th email (should fall back to client-side validation)
3. **Verify** form still works with client-side validation
4. **Check** console logs for rate limit message

#### ✅ Browser Compatibility

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

#### ✅ Security Tests

- [ ] Verify no API key in network requests (check DevTools)
- [ ] Verify API key not in localStorage/sessionStorage
- [ ] Verify CORS headers are correct
- [ ] Verify trusted domains are enforced

---

## Troubleshooting

### Issue: "Invalid API Key" Error

**Symptoms:**
- API returns 401 Unauthorized
- Console shows: `Emailable API error`

**Solutions:**
1. Verify PUBLIC key is correct (not PRIVATE key)
2. Check key hasn't been revoked in dashboard
3. Verify key is enabled in dashboard
4. Check trusted domains include your domain

### Issue: Rate Limit Errors (429)

**Symptoms:**
- After 10 emails, verification fails
- Console shows: `Emailable rate limit reached`

**Solutions:**
1. This is expected behavior on FREE plan
2. Verify fallback to client-side validation works
3. Consider upgrading plan for higher limits
4. Check rate limit is per-IP, not per-user

### Issue: CORS Errors

**Symptoms:**
- Console shows: `Access to XMLHttpRequest blocked by CORS policy`
- Network tab shows failed request

**Solutions:**
1. Verify domain is in trusted domains list
2. Check domain format (include `www.` if needed)
3. For localhost, use exact format: `localhost:4321`
4. Clear browser cache and reload

### Issue: Email Validation Always Fails

**Symptoms:**
- All emails show red X
- Error message appears for valid emails

**Solutions:**
1. Check if API key is correct
2. Verify Emailable API is accessible
3. Check browser console for specific error
4. Try disabling Emailable temporarily to test client-side validation

### Issue: Form Doesn't Submit After Email Validation

**Symptoms:**
- Email validates successfully
- Form doesn't submit to EmailJS
- No error message appears

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify EmailJS is loaded correctly
3. Check EmailJS service ID and template ID
4. Verify form data is complete (all required fields)

### Issue: Emails Not Received

**Symptoms:**
- Form submits successfully
- No email received in inbox
- Success message appears

**Solutions:**
1. Check EmailJS dashboard for failed sends
2. Verify email template is correct
3. Check spam/junk folder
4. Verify recipient email address in EmailJS settings

---

## Security Best Practices

### ✅ DO

- ✅ Use PUBLIC keys for client-side code
- ✅ Configure trusted domains in Emailable dashboard
- ✅ Rotate API keys periodically
- ✅ Monitor API usage in dashboard
- ✅ Log validation failures for security monitoring
- ✅ Use HTTPS only (never HTTP)
- ✅ Implement rate limiting on your backend
- ✅ Validate email on both client and server

### ❌ DON'T

- ❌ Never expose PRIVATE keys in client-side code
- ❌ Never commit API keys to version control
- ❌ Never log full email addresses in production
- ❌ Never disable email validation
- ❌ Never trust client-side validation alone
- ❌ Never share API keys in Slack/email
- ❌ Never use same key across multiple projects

### Environment Variables (Optional)

For additional security, consider using environment variables:

```javascript
// .env.local (development)
PUBLIC_EMAILABLE_API_KEY=live_xxxxxxxxxxxxxxxxxxxxxxxx

// In code
const EMAILABLE_PUBLIC_KEY = import.meta.env.PUBLIC_EMAILABLE_API_KEY;
```

**Note:** Astro requires `PUBLIC_` prefix for client-side variables.

---

## Implementation Checklist

### Phase 1: Preparation
- [ ] Create PUBLIC API key in Emailable dashboard
- [ ] Configure trusted domains
- [ ] Review current contact.astro code
- [ ] Backup current contact.astro

### Phase 2: Integration
- [ ] Replace PRIVATE key with PUBLIC key (line 369)
- [ ] Verify no PRIVATE keys remain in codebase
- [ ] Run `npm run build` to check for errors
- [ ] Test locally on `localhost:4321`

### Phase 3: Testing
- [ ] Run all tests from Step 5 checklist
- [ ] Test on multiple browsers
- [ ] Test rate limiting behavior
- [ ] Test error handling

### Phase 4: Deployment
- [ ] Deploy to staging environment
- [ ] Test on staging domain
- [ ] Monitor for errors in first 24 hours
- [ ] Deploy to production
- [ ] Monitor production usage

### Phase 5: Monitoring
- [ ] Set up error logging
- [ ] Monitor rate limit hits
- [ ] Review validation failures weekly
- [ ] Check Emailable dashboard for usage

---

## API Response Reference

### Emailable API Response States

```javascript
{
  "state": "deliverable",      // Email is valid and deliverable
  "result": "valid",
  "reason": "accepted_email",
  "risk": "low"
}

{
  "state": "undeliverable",    // Email is invalid
  "result": "invalid",
  "reason": "invalid_email",
  "risk": "high"
}

{
  "state": "risky",            // Email might be risky
  "result": "risky",
  "reason": "catch_all",
  "risk": "medium"
}

{
  "state": "unknown",          // Cannot determine validity
  "result": "unknown",
  "reason": "timeout",
  "risk": "medium"
}

{
  "state": "catch-all",        // Domain accepts all emails
  "result": "risky",
  "reason": "catch_all",
  "risk": "medium"
}
```

---

## Support & Resources

### Emailable Documentation
- **API Docs:** https://emailable.com/docs
- **Dashboard:** https://dashboard.emailable.com
- **Status Page:** https://status.emailable.com

### BRITZMEDI Resources
- **Contact Form:** `src/pages/contact.astro`
- **EmailJS Setup:** Service ID `service_nbk0net`
- **Template ID:** `template_azmskha`

### Getting Help

1. **Check Emailable Dashboard** for API usage and errors
2. **Review Browser Console** for JavaScript errors
3. **Check Network Tab** for API request/response details
4. **Review Logs** for validation failures
5. **Contact Emailable Support** for API issues

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 25, 2026 | Initial guide created |

---

**Last Updated:** January 25, 2026  
**Status:** Ready for Implementation  
**Next Step:** Create PUBLIC API key and follow Step 1-5
