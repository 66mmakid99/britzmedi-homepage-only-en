# BRITZMEDI Crisp Chatbot Integration Guide

**Status:** Ready to implement  
**Last Updated:** January 25, 2026  
**Current Chat Widget:** Tawk.to (Property ID: 69750b239602761980a882d2)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create Crisp Account](#step-1-create-crisp-account)
3. [Step 2: Get Your Website ID](#step-2-get-your-website-id)
4. [Step 3: Replace Tawk.to with Crisp](#step-3-replace-tawkto-with-crisp)
5. [Step 4: Upload FAQ Content](#step-4-upload-faq-content)
6. [Step 5: Configure AI Chatbot](#step-5-configure-ai-chatbot)
7. [Step 6: Test Integration](#step-6-test-integration)
8. [Troubleshooting](#troubleshooting)
9. [Tawk.to vs Crisp Comparison](#tawkto-vs-crisp-comparison)

---

## Prerequisites

Before starting the Crisp integration, ensure you have:

- [ ] Access to the BRITZMEDI website codebase (Astro project)
- [ ] Admin access to the website hosting/deployment
- [ ] A valid email address for Crisp account creation
- [ ] The `crisp-faq-training.md` file (18 FAQ items, 5 categories)
- [ ] Approximately 30 minutes for complete setup and testing
- [ ] A modern web browser (Chrome, Firefox, Safari, or Edge)

**Optional but Recommended:**
- [ ] Crisp Unlimited plan ($95/month) for full AI capabilities
- [ ] Team member access for testing and monitoring

---

## Step 1: Create Crisp Account

### 1.1 Sign Up for Crisp

1. Go to **https://crisp.chat**
2. Click **"Start Free"** or **"Sign Up"** button
3. Enter your email address and create a strong password
4. Verify your email address (check your inbox for verification link)
5. Complete your profile:
   - Company Name: `BRITZMEDI Co., Ltd.`
   - Website URL: `https://britzmedi.com`
   - Industry: Select **"Medical / Healthcare"** or **"B2B SaaS"**
   - Company Size: Select appropriate size

### 1.2 Choose Your Plan

**Free Plan:**
- Basic chat widget
- Limited AI capabilities
- Up to 1 agent
- Good for testing

**Unlimited Plan ($95/month):**
- Full AI chatbot capabilities
- Unlimited agents
- Knowledge Base / Help Desk
- Advanced analytics
- **Recommended for production**

For BRITZMEDI, we recommend the **Unlimited plan** to leverage:
- Advanced AI training on FAQ content
- Knowledge Base for customer self-service
- Better analytics for customer insights
- CRM features for lead management

### 1.3 Complete Initial Setup

After signup, you'll be guided through:
- Website verification (add your domain)
- Chat widget customization
- Team member invitations
- Integration options

---

## Step 2: Get Your Website ID

### 2.1 Locate Your Website ID

1. Log in to your Crisp dashboard: **https://app.crisp.chat**
2. Navigate to **Settings** → **Website** (left sidebar)
3. Look for **"Website ID"** - it will be a string like: `abc123def456`
4. Copy this ID - you'll need it for the code integration

### 2.2 Verify Website Settings

While in Settings → Website, verify:
- [ ] Website name is set to "BRITZMEDI"
- [ ] Website URL is `https://britzmedi.com`
- [ ] Website language is set to English
- [ ] Timezone is set correctly (KST for Korea operations)

### 2.3 Save Your Website ID

**Store this securely:**
```
Website ID: YOUR_WEBSITE_ID_HERE
```

You'll use this in Step 3 when replacing the Tawk.to code.

---

## Step 3: Replace Tawk.to with Crisp

### 3.1 Current Tawk.to Integration

The current integration in `src/layouts/BaseLayout.astro` (lines 143-154):

```javascript
<!-- Tawk.to Chat Widget -->
<script is:inline>
  var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
  (function(){
    var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
    s1.async=true;
    s1.src='https://embed.tawk.to/69750b239602761980a882d2/1jfoj70v5';
    s1.charset='UTF-8';
    s1.setAttribute('crossorigin','*');
    s0.parentNode.insertBefore(s1,s0);
  })();
</script>
```

### 3.2 Replace with Crisp Code

**File:** `src/layouts/BaseLayout.astro`

**Location:** Replace lines 143-154 (the Tawk.to script block)

**New Code:**

```javascript
<!-- Crisp Chat Widget -->
<script is:inline>
  window.$crisp=[];
  window.CRISP_WEBSITE_ID="YOUR_WEBSITE_ID_HERE";
  (function(){
    d=document;
    s=d.createElement("script");
    s.src="https://client.crisp.chat/l.js";
    s.async=1;
    d.getElementsByTagName("head")[0].appendChild(s);
  })();
</script>
```

### 3.3 Update the Website ID

Replace `YOUR_WEBSITE_ID_HERE` with your actual Website ID from Step 2.

**Example:**
```javascript
window.CRISP_WEBSITE_ID="abc123def456xyz789";
```

### 3.4 Verify the Change

After updating:

1. Save the file
2. Commit the change to git:
   ```bash
   git add src/layouts/BaseLayout.astro
   git commit -m "Replace Tawk.to with Crisp chat widget"
   ```
3. Deploy to staging/production
4. Test that the chat widget appears (see Step 6)

### 3.5 Optional: Keep Tawk.to as Fallback (Temporary)

If you want to test Crisp before fully removing Tawk.to:

```javascript
<!-- Crisp Chat Widget (Primary) -->
<script is:inline>
  window.$crisp=[];
  window.CRISP_WEBSITE_ID="YOUR_WEBSITE_ID_HERE";
  (function(){
    d=document;
    s=d.createElement("script");
    s.src="https://client.crisp.chat/l.js";
    s.async=1;
    d.getElementsByTagName("head")[0].appendChild(s);
  })();
</script>

<!-- Tawk.to (Fallback - Remove after Crisp testing) -->
<script is:inline>
  var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
  (function(){
    var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
    s1.async=true;
    s1.src='https://embed.tawk.to/69750b239602761980a882d2/1jfoj70v5';
    s1.charset='UTF-8';
    s1.setAttribute('crossorigin','*');
    s0.parentNode.insertBefore(s1,s0);
  })();
</script>
```

**Note:** Remove the Tawk.to section after confirming Crisp is working properly.

---

## Step 4: Upload FAQ Content

### 4.1 Access Knowledge Base

1. Log in to Crisp dashboard
2. Navigate to **Knowledge Base** (left sidebar)
3. Click **"Create Article"** or **"Import Content"**

### 4.2 Upload FAQ Items

You have two options:

#### Option A: Create Individual Articles (Recommended)

1. For each FAQ category in `crisp-faq-training.md`:
   - Click **"Create Article"**
   - Title: Use the Q&A question
   - Content: Use the answer text
   - Category: Assign to appropriate category (Products, Company, Ordering, Technical, Certifications)
   - Tags: Add relevant tags for better searchability

2. Categories to create:
   - **Products** (5 items)
   - **Company** (3 items)
   - **Ordering & Distribution** (4 items)
   - **Technical Support** (3 items)
   - **Certifications** (3 items)

#### Option B: Bulk Import

1. Copy the entire content from `crisp-faq-training.md`
2. In Crisp Knowledge Base, look for **"Import"** or **"Bulk Upload"** option
3. Paste the content and let Crisp parse it
4. Review and organize articles by category

### 4.3 Organize by Category

After uploading, organize articles:

1. Create category folders:
   - Products
   - Company
   - Ordering & Distribution
   - Technical Support
   - Certifications

2. Assign each article to its category
3. Set article visibility to **"Public"** (so AI can access them)
4. Enable **"Show in Help Desk"** for customer self-service

### 4.4 Verify Upload

- [ ] All 18 FAQ items uploaded
- [ ] Articles organized by 5 categories
- [ ] All articles marked as public
- [ ] Articles are searchable in Knowledge Base

---

## Step 5: Configure AI Chatbot

### 5.1 Enable AI Chatbot

1. Go to **Settings** → **AI & Automation** (or **Chatbot**)
2. Toggle **"Enable AI Chatbot"** to ON
3. Select **"Unlimited Plan"** features if available

### 5.2 Train AI on FAQ Content

1. In **AI Settings**, find **"Knowledge Base Training"** or **"AI Training"**
2. Select the Knowledge Base articles you created in Step 4
3. Enable **"Use Knowledge Base for AI responses"**
4. Set AI confidence threshold (recommended: 70-80%)

### 5.3 Configure AI Behavior

1. **AI Name:** Set to something like "BRITZMEDI Assistant" or "Medi Bot"
2. **AI Greeting:** Customize the initial message:
   ```
   "Hello! 👋 I'm the BRITZMEDI Assistant. I can help you with questions about our medical devices, certifications, ordering, and more. How can I help you today?"
   ```
3. **AI Tone:** Select "Professional" or "Friendly Professional"
4. **Fallback Behavior:** Set to "Escalate to human agent" when AI confidence is low

### 5.4 Set Up Agent Routing

1. Go to **Settings** → **Team** or **Agents**
2. Add team members who will handle escalated chats
3. Set availability hours (e.g., 9:00 AM - 6:00 PM KST, Monday-Friday)
4. Configure auto-responses for off-hours

### 5.5 Enable Canned Responses

Create quick responses for common questions:

1. Go to **Settings** → **Canned Responses**
2. Create responses for:
   - Product inquiries
   - Distributor applications
   - Technical support requests
   - Pricing/ordering questions

**Example Canned Response:**
```
Title: Distributor Inquiry
Shortcut: /distributor
Response: "Thank you for your interest in becoming a BRITZMEDI distributor! 
Please provide information about your company, territory of interest, and 
relevant experience. Our sales team will review your application and contact 
you within 1-2 business days."
```

---

## Step 6: Test Integration

### 6.1 Test Chat Widget Appearance

**On Website:**
1. Visit **https://britzmedi.com** (or staging URL)
2. Look for the Crisp chat widget (usually bottom-right corner)
3. Verify the widget loads without errors
4. Check that the widget is responsive on mobile

**Browser Console Check:**
1. Open Developer Tools (F12)
2. Go to **Console** tab
3. Type: `window.CRISP_WEBSITE_ID`
4. Should return your Website ID (not "YOUR_WEBSITE_ID_HERE")

### 6.2 Test AI Chatbot Responses

1. Click the chat widget
2. Send test messages:
   - "What is TORR RF?" (should reference FAQ)
   - "How can I become a distributor?" (should reference FAQ)
   - "Tell me about your certifications" (should reference FAQ)
   - "Random question not in FAQ" (should escalate or provide fallback)

3. Verify AI responses are:
   - [ ] Accurate and relevant
   - [ ] Using FAQ content
   - [ ] Professional in tone
   - [ ] Offering to escalate to human agent

### 6.3 Test Human Agent Escalation

1. Send a message that requires human assistance
2. Verify escalation works:
   - [ ] Chat transfers to available agent
   - [ ] Agent receives notification
   - [ ] Chat history is preserved
   - [ ] Agent can respond

### 6.4 Test on Different Devices

- [ ] Desktop (Chrome, Firefox, Safari)
- [ ] Tablet (iPad, Android tablet)
- [ ] Mobile (iPhone, Android phone)
- [ ] Different screen sizes (responsive design)

### 6.5 Test Offline Behavior

1. Set your availability to "Offline"
2. Send a chat message
3. Verify:
   - [ ] AI responds (if enabled)
   - [ ] Offline message is shown
   - [ ] Message is queued for when you're online

### 6.6 Performance Testing

1. Open DevTools → Network tab
2. Reload the page
3. Verify:
   - [ ] Crisp script loads quickly (< 2 seconds)
   - [ ] No console errors
   - [ ] No impact on page load time

### 6.7 Testing Checklist

- [ ] Chat widget appears on all pages
- [ ] Widget is responsive on mobile
- [ ] AI responds to FAQ questions correctly
- [ ] Escalation to human agent works
- [ ] No console errors
- [ ] Page load time is not affected
- [ ] Chat history is preserved
- [ ] Offline messages are queued
- [ ] Widget styling matches website design

---

## Troubleshooting

### Issue: Chat Widget Not Appearing

**Symptoms:** No chat widget visible on website

**Solutions:**
1. Verify Website ID is correct (not "YOUR_WEBSITE_ID_HERE")
2. Check browser console for errors (F12 → Console)
3. Verify Crisp script is loading:
   - Open DevTools → Network tab
   - Look for `client.crisp.chat/l.js`
   - Should return status 200
4. Clear browser cache and reload
5. Try incognito/private browsing mode
6. Check if Crisp is blocked by ad blocker or browser extensions

**Debug Command:**
```javascript
// In browser console:
console.log(window.$crisp);
console.log(window.CRISP_WEBSITE_ID);
```

### Issue: AI Not Responding to FAQ Questions

**Symptoms:** AI says "I don't know" or escalates unnecessarily

**Solutions:**
1. Verify FAQ articles are uploaded to Knowledge Base
2. Check that articles are marked as "Public"
3. Verify AI training is enabled in Settings → AI & Automation
4. Check AI confidence threshold (may be too high)
5. Retrain AI:
   - Go to Settings → AI & Automation
   - Click "Retrain AI" or "Refresh Training"
   - Wait 5-10 minutes for retraining to complete
6. Test with exact phrases from FAQ content

### Issue: Chat Widget Overlapping Content

**Symptoms:** Chat widget covers important page content

**Solutions:**
1. In Crisp Settings → Widget Appearance:
   - Adjust widget position (bottom-right, bottom-left, etc.)
   - Adjust widget offset from edges
   - Enable "Mobile-friendly positioning"
2. Test on different screen sizes
3. Consider using CSS to adjust widget position for specific pages

### Issue: Slow Chat Widget Loading

**Symptoms:** Chat widget takes > 3 seconds to load

**Solutions:**
1. Check internet connection speed
2. Verify Crisp CDN is accessible in your region
3. Check browser DevTools → Network tab for slow requests
4. Verify no other heavy scripts are blocking Crisp
5. Contact Crisp support if CDN is slow in your region

### Issue: Messages Not Being Received

**Symptoms:** Sent messages don't appear in Crisp dashboard

**Solutions:**
1. Verify you're logged in to Crisp dashboard
2. Check that your availability is set to "Online"
3. Verify notifications are enabled in browser
4. Check Crisp Settings → Notifications
5. Try sending a test message from a different browser/device
6. Check browser console for errors

### Issue: AI Responses Are Inaccurate

**Symptoms:** AI provides incorrect information

**Solutions:**
1. Review FAQ content for accuracy
2. Update FAQ articles with correct information
3. Retrain AI after updating content
4. Increase AI confidence threshold to reduce false positives
5. Add more specific training examples
6. Consider using canned responses for critical information

### Issue: Escalation to Human Agent Not Working

**Symptoms:** Chat doesn't transfer to agent

**Solutions:**
1. Verify at least one agent is added to team
2. Check agent availability status (should be "Online")
3. Verify agent has notifications enabled
4. Check browser console for errors
5. Try sending escalation request from different browser
6. Verify agent email is correct in Settings → Team

### Issue: Chat Widget Styling Doesn't Match Website

**Symptoms:** Widget colors/fonts don't match BRITZMEDI branding

**Solutions:**
1. Go to Crisp Settings → Widget Appearance
2. Customize:
   - Primary color (match BRITZMEDI brand color)
   - Widget position and size
   - Font family and size
   - Avatar image
3. Preview changes before saving
4. Test on website to verify styling

### Issue: Mobile Chat Widget Not Responsive

**Symptoms:** Chat widget is too large or poorly positioned on mobile

**Solutions:**
1. In Crisp Settings → Widget Appearance:
   - Enable "Mobile-friendly positioning"
   - Adjust mobile offset values
   - Test on actual mobile devices
2. Check CSS media queries on website
3. Verify no CSS conflicts with Crisp widget
4. Test on different mobile browsers

### Contact Crisp Support

If issues persist:
1. Go to **https://crisp.chat/support**
2. Click **"Contact Support"** or **"Chat with Support"**
3. Provide:
   - Website URL
   - Website ID
   - Browser and OS information
   - Steps to reproduce the issue
   - Screenshots/screen recordings

---

## Tawk.to vs Crisp Comparison

### Feature Comparison

| Feature | Tawk.to | Crisp |
|---------|---------|-------|
| **Pricing** | Free | Free + Unlimited ($95/mo) |
| **Chat Widget** | ✅ Yes | ✅ Yes |
| **AI Chatbot** | ⚠️ Limited | ✅ Advanced (Unlimited plan) |
| **Knowledge Base** | ❌ No | ✅ Yes (Unlimited plan) |
| **Help Desk** | ❌ No | ✅ Yes (Unlimited plan) |
| **CRM Features** | ⚠️ Basic | ✅ Advanced |
| **Analytics** | ⚠️ Basic | ✅ Advanced |
| **Team Collaboration** | ✅ Yes | ✅ Yes |
| **Mobile App** | ✅ Yes | ✅ Yes |
| **API Access** | ⚠️ Limited | ✅ Full |
| **Integrations** | ⚠️ Limited | ✅ Extensive |
| **Custom Branding** | ✅ Yes | ✅ Yes |
| **Offline Messages** | ✅ Yes | ✅ Yes |
| **Canned Responses** | ✅ Yes | ✅ Yes |
| **Visitor Tracking** | ✅ Yes | ✅ Yes |
| **Multi-language** | ✅ Yes | ✅ Yes |

### Why Crisp for BRITZMEDI

**Advantages:**
1. **Better AI Capabilities** - Train AI on FAQ content for accurate product information
2. **Knowledge Base** - Customers can self-serve for common questions
3. **CRM Features** - Track distributor inquiries and leads
4. **Advanced Analytics** - Understand customer needs and pain points
5. **Professional Image** - Crisp is used by enterprise companies
6. **Scalability** - Grows with your business needs
7. **Better Integrations** - Connect with CRM, email, Slack, etc.

**Disadvantages:**
1. **Cost** - $95/month for Unlimited plan (vs Tawk.to free)
2. **Learning Curve** - More features to configure
3. **Setup Time** - Requires FAQ upload and AI training

### Migration Timeline

**Week 1:**
- [ ] Create Crisp account
- [ ] Get Website ID
- [ ] Upload FAQ content
- [ ] Configure AI chatbot

**Week 2:**
- [ ] Test integration on staging
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Train team on Crisp dashboard

**Week 3:**
- [ ] Gather feedback from customers
- [ ] Fine-tune AI responses
- [ ] Optimize canned responses
- [ ] Remove Tawk.to integration

---

## Post-Integration Checklist

After going live with Crisp:

### Week 1
- [ ] Monitor chat volume and response times
- [ ] Review AI response accuracy
- [ ] Check for any technical issues
- [ ] Gather team feedback
- [ ] Monitor page load performance

### Week 2-4
- [ ] Analyze chat transcripts for improvement areas
- [ ] Update FAQ content based on customer questions
- [ ] Retrain AI with new content
- [ ] Optimize canned responses
- [ ] Set up analytics dashboards

### Ongoing
- [ ] Review chat analytics monthly
- [ ] Update FAQ content quarterly
- [ ] Monitor AI accuracy and retrain as needed
- [ ] Gather customer feedback on chatbot
- [ ] Plan for additional features (e.g., ticketing, surveys)

---

## Additional Resources

- **Crisp Documentation:** https://docs.crisp.chat
- **Crisp API Reference:** https://docs.crisp.chat/references/rest-api/
- **Crisp Knowledge Base:** https://help.crisp.chat
- **BRITZMEDI FAQ Content:** `.opencode/crisp-faq-training.md`
- **Current Integration:** `src/layouts/BaseLayout.astro` (lines 143-154)

---

## Support Contacts

**BRITZMEDI Support:**
- Email: contact@britzmedi.co.kr
- Phone: +82-70-4348-7244
- Hours: 9:00 AM - 6:00 PM KST, Monday-Friday

**Crisp Support:**
- Website: https://crisp.chat/support
- In-app chat support available 24/7

---

**Document Version:** 1.0  
**Last Updated:** January 25, 2026  
**Status:** Ready for Implementation  
**Next Step:** Create Crisp account and obtain Website ID
