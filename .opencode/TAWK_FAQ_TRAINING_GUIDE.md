# Tawk.to FAQ Training Guide - BRITZMEDI

**Last Updated:** January 25, 2026  
**Purpose:** Enable the Tawk.to chatbot to provide accurate, consistent responses to customer inquiries using the BRITZMEDI FAQ Knowledge Base.

---

## Current Tawk.to Setup

### Integration Details
- **Property ID:** `69750b239602761980a882d2`
- **Widget ID:** `1jfoj70v5`
- **Location:** `BaseLayout.astro` (lines 146-154)
- **Status:** ✅ Active and working
- **Plan:** Free tier (includes Knowledge Base feature)

### Available FAQ Content
- **Total Items:** 18 FAQs
- **Categories:** 5 (Products, Company, Ordering & Distribution, Technical Support, Certifications)
- **Source File:** `.opencode/crisp-faq-training.md`

---

## Step 1: Access Tawk.to Dashboard

### Login Instructions

1. **Navigate to Tawk.to**
   - Go to https://www.tawk.to
   - Click **"Sign In"** (top right)

2. **Enter Credentials**
   - Email: Use the account email associated with BRITZMEDI
   - Password: Enter your Tawk.to account password
   - Click **"Sign In"**

3. **Select Property**
   - After login, you'll see your properties list
   - Click on the **BRITZMEDI property** (Property ID: `69750b239602761980a882d2`)
   - You'll be taken to the main dashboard

### Dashboard Overview
- **Left Sidebar:** Navigation menu with all features
- **Main Panel:** Chat conversations and analytics
- **Top Menu:** Settings, integrations, and admin options

---

## Step 2: Navigate to Knowledge Base

### Accessing Knowledge Base

1. **From Dashboard**
   - Look for the **left sidebar menu**
   - Scroll down to find **"Knowledge Base"** or **"Help Center"**
   - Click on **"Knowledge Base"**

2. **Alternative Path**
   - Click **Settings** (gear icon, top right)
   - Select **"Knowledge Base"** from the settings menu
   - Click **"Manage Articles"** or **"Articles"**

### Knowledge Base Interface
- **Articles Tab:** View all existing articles
- **Categories Tab:** Manage article categories
- **Add Article Button:** Create new articles (usually top right)
- **Search Bar:** Find existing articles quickly

---

## Step 3: Add FAQ Articles

### Creating Articles from BRITZMEDI FAQ

#### Method 1: Add Articles One by One (Recommended for Organization)

1. **Click "Add Article" or "New Article"**
   - Button location: Top right of Knowledge Base section
   - A form will appear

2. **Fill in Article Details**
   - **Title:** Use the Q&A question (e.g., "What is TORR RF and what are its main applications?")
   - **Category:** Select or create category (see categories below)
   - **Content:** Paste the answer text from the FAQ
   - **Tags:** Add relevant tags (e.g., "products", "torr-rf", "fda-cleared")
   - **Status:** Set to **"Published"** to make it live

3. **Save Article**
   - Click **"Save"** or **"Publish"**
   - Article will be added to Knowledge Base

#### Method 2: Bulk Import (If Tawk.to Supports)

1. **Check for Import Option**
   - In Knowledge Base settings, look for **"Import"** or **"Bulk Upload"**
   - If available, you can upload a CSV or formatted file

2. **Prepare Data**
   - Format: Title, Category, Content, Tags
   - One article per row

3. **Upload and Map Fields**
   - Follow the import wizard
   - Map columns to appropriate fields
   - Review and confirm import

### BRITZMEDI FAQ Articles to Add

#### Category 1: Products (5 Articles)

**Article 1.1: What is TORR RF and what are its main applications?**
- **Category:** Products
- **Tags:** torr-rf, radiofrequency, aesthetic, fda-cleared
- **Content:**
  ```
  TORR RF is our flagship FDA 510(k) cleared medical device that uses innovative 
  Multi-Wave Radiofrequency technology to deliver thermal energy into the dermal 
  and subcutaneous layers. It is primarily used for non-invasive aesthetic treatments 
  including skin tightening, wrinkle reduction, and body contouring. The device 
  features patented segmented electrode designs for precise energy delivery.
  ```

**Article 1.2: Is TORR RF FDA cleared?**
- **Category:** Products
- **Tags:** torr-rf, fda-cleared, regulatory, certifications
- **Content:**
  ```
  Yes, TORR RF has received FDA 510(k) clearance (K212561) in 2022. This clearance 
  confirms that the device meets the safety and effectiveness standards required by 
  the U.S. Food and Drug Administration for marketing in the United States.
  ```

**Article 1.3: What makes ULBLANC different from other ultrasound devices?**
- **Category:** Products
- **Tags:** ulblanc, ultrasound, skincare, acoustic-cavitation
- **Content:**
  ```
  ULBLANC is a comprehensive skincare workstation that combines dual-frequency 
  ultrasound technology with acoustic cavitation for transdermal drug delivery 
  (i-Booster technology). This unique combination allows for both skin tightening 
  effects and enhanced absorption of skincare products, making it a versatile 
  solution for aesthetic clinics.
  ```

**Article 1.4: Can NEWCHAE SHOT be used at home?**
- **Category:** Products
- **Tags:** newchae-shot, home-care, personal-device, beauty
- **Content:**
  ```
  Yes, NEWCHAE SHOT is specifically designed as a 3-in-1 personal beauty device 
  for home care use. It integrates professional-grade medical technologies into 
  a compact, user-friendly form factor with multi-channel energy delivery, allowing 
  consumers to achieve professional-level skincare results at home.
  ```

**Article 1.5: When will LUMINO WAVE be available?**
- **Category:** Products
- **Tags:** lumino-wave, upcoming, convergence-therapy, launch
- **Content:**
  ```
  LUMINO WAVE is scheduled for launch in the second half of 2026. This next-generation 
  device features our innovative Convergence Therapy technology, combining Ultrasound 
  and Laser to maximize skin penetration. Contact our sales team to be notified when 
  it becomes available.
  ```

#### Category 2: Company (3 Articles)

**Article 2.1: When was BRITZMEDI established?**
- **Category:** Company
- **Tags:** company-info, history, founded, korea
- **Content:**
  ```
  BRITZMEDI Co., Ltd. was established on October 23, 2017, in South Korea. We started 
  as a Company-Affiliated Research Institute and have grown into a global medical 
  device manufacturer with FDA clearance, ISO 13485 certification, and Venture 
  Enterprise designation.
  ```

**Article 2.2: Where is BRITZMEDI located?**
- **Category:** Company
- **Tags:** company-info, headquarters, location, korea
- **Content:**
  ```
  Our headquarters and manufacturing facility are located at 1211, 388, Dunchon-daero, 
  Jungwon-gu, Seongnam-si, Gyeonggi-do, Republic of Korea (Postal Code: 13403). 
  We operate a GMP-certified manufacturing facility with integrated R&D capabilities.
  ```

**Article 2.3: Does BRITZMEDI have its own R&D capabilities?**
- **Category:** Company
- **Tags:** company-info, research, innovation, patents
- **Content:**
  ```
  Yes, BRITZMEDI operates a Company-Affiliated Research Institute with dedicated R&D 
  personnel. We have registered 11+ patents (10 domestic, 1 international) and 5 
  trademarks. Our R&D type Venture Enterprise designation confirms our commitment to 
  innovation in aesthetic medical technology.
  ```

#### Category 3: Ordering & Distribution (4 Articles)

**Article 3.1: How can I become a BRITZMEDI distributor?**
- **Category:** Ordering & Distribution
- **Tags:** distribution, partnership, sales, distributor
- **Content:**
  ```
  We welcome partnership inquiries from qualified distributors worldwide. To become 
  a distributor, please contact our sales team through the Contact page with 
  information about your company, territory of interest, and relevant experience in 
  medical device distribution. We will review your application and arrange a 
  consultation.
  ```

**Article 3.2: What are the minimum order quantities?**
- **Category:** Ordering & Distribution
- **Tags:** ordering, moq, minimum-order, sales
- **Content:**
  ```
  Minimum order quantities vary by product and market. Please contact our sales team 
  for specific MOQ information based on your territory and requirements. We offer 
  flexible arrangements for qualified distributors and can discuss sample units for 
  evaluation purposes.
  ```

**Article 3.3: Do you ship internationally?**
- **Category:** Ordering & Distribution
- **Tags:** shipping, international, logistics, distribution
- **Content:**
  ```
  Yes, we ship to distributors and partners worldwide. Our products are manufactured 
  in our GMP-certified facility in Korea and shipped according to international 
  medical device shipping standards. Shipping terms and logistics will be discussed 
  during partnership negotiations.
  ```

**Article 3.4: Do you offer OEM/ODM services?**
- **Category:** Ordering & Distribution
- **Tags:** oem, odm, manufacturing, contract-manufacturer
- **Content:**
  ```
  Yes, BRITZMEDI is an FDA-registered contract manufacturer (Owner Operator Number: 
  10088936) offering comprehensive OEM/ODM services. We provide end-to-end development 
  services from design to manufacturing, leveraging our GMP-certified facility and 
  experienced R&D team. Contact us to discuss your specific requirements.
  ```

#### Category 4: Technical Support (3 Articles)

**Article 4.1: Do you provide training for your devices?**
- **Category:** Technical Support
- **Tags:** training, support, device-operation, protocols
- **Content:**
  ```
  Yes, we provide comprehensive training programs for all our medical devices. Training 
  includes device operation, treatment protocols, safety procedures, and maintenance. 
  Training can be conducted on-site, at our facility in Korea, or through our digital 
  training platform. Contact your local distributor or our support team for training 
  arrangements.
  ```

**Article 4.2: What is your warranty policy?**
- **Category:** Technical Support
- **Tags:** warranty, support, coverage, defects
- **Content:**
  ```
  BRITZMEDI products come with a standard manufacturer warranty. Warranty terms and 
  coverage vary by product and region. Our warranty covers manufacturing defects and 
  includes technical support. Extended warranty options are available. Please refer to 
  your purchase documentation or contact our support team for specific warranty 
  information.
  ```

**Article 4.3: How can I get technical support?**
- **Category:** Technical Support
- **Tags:** support, contact, technical-help, channels
- **Content:**
  ```
  Technical support is available through multiple channels:
  
  1. Contact your local authorized distributor
  2. Email our support team at sh.lee@britzmedi.com
  3. Call us at +82-70-4348-7244 during business hours (9:00 AM - 6:00 PM KST, Monday-Friday)
  
  We aim to respond to all inquiries within 1-2 business days.
  ```

#### Category 5: Certifications (3 Articles)

**Article 5.1: Is BRITZMEDI ISO certified?**
- **Category:** Certifications
- **Tags:** iso, certifications, quality, standards
- **Content:**
  ```
  Yes, BRITZMEDI is ISO 13485:2016 certified, which is the international standard for 
  medical device quality management systems. This certification demonstrates our 
  commitment to consistent quality and regulatory compliance in the design, development, 
  and manufacturing of medical devices.
  ```

**Article 5.2: Is your manufacturing facility GMP certified?**
- **Category:** Certifications
- **Tags:** gmp, manufacturing, certifications, quality
- **Content:**
  ```
  Yes, our manufacturing facility is GMP (Good Manufacturing Practice) certified by 
  the Korean Ministry of Food and Drug Safety (MFDS). We obtained this certification 
  in 2021, and it ensures that our products are consistently produced and controlled 
  according to quality standards.
  ```

**Article 5.3: What regulatory approvals do your products have?**
- **Category:** Certifications
- **Tags:** regulatory, approvals, fda, mfds, certifications
- **Content:**
  ```
  Our products hold various regulatory approvals depending on the market. TORR RF has 
  FDA 510(k) clearance for the US market and Korea MFDS approval. All products have 
  Korea MFDS approval. We are continuously expanding our regulatory portfolio and can 
  provide specific certification information for your target market upon request.
  ```

---

## Step 4: Enable AI Responses Using Knowledge Base

### Configure Chatbot to Use Knowledge Base

1. **Access Chatbot Settings**
   - From Dashboard, click **Settings** (gear icon, top right)
   - Select **"Chatbot"** or **"AI"** from the menu
   - Look for **"Knowledge Base"** or **"AI Training"** section

2. **Enable Knowledge Base Integration**
   - Find the toggle or checkbox for **"Use Knowledge Base"** or **"Enable AI Training"**
   - Toggle it **ON**
   - Save changes

3. **Configure AI Behavior**
   - **Response Mode:** Set to "Use Knowledge Base first" or "Hybrid mode"
   - **Confidence Threshold:** Set to medium-high (so chatbot only responds when confident)
   - **Fallback Response:** Set a message like "I'm not sure about that. Let me connect you with a specialist."

4. **Set Up Keywords (Optional but Recommended)**
   - In chatbot settings, look for **"Keywords"** or **"Triggers"**
   - Add keywords that map to your FAQ categories:
     - "TORR RF", "ULBLANC", "NEWCHAE SHOT", "LUMINO WAVE" → Products
     - "distributor", "partnership", "order" → Ordering & Distribution
     - "training", "support", "warranty" → Technical Support
     - "FDA", "ISO", "certified", "GMP" → Certifications
     - "founded", "location", "R&D" → Company

5. **Save Configuration**
   - Click **"Save"** or **"Apply Changes"**
   - Chatbot will now reference Knowledge Base articles

### Testing AI Responses

- Ask the chatbot a question from the FAQ
- Verify it provides the correct answer from the Knowledge Base
- Check that responses are formatted properly
- Ensure links to full articles are provided (if applicable)

---

## Step 5: Test the Chatbot

### Pre-Launch Testing Checklist

#### ✅ Knowledge Base Verification
- [ ] All 18 FAQ articles are published in Knowledge Base
- [ ] Articles are organized into 5 categories
- [ ] Each article has appropriate tags
- [ ] Search function finds articles by title and keywords
- [ ] Article content is accurate and matches source FAQ

#### ✅ Chatbot Response Testing
- [ ] Chatbot responds to product-related questions (e.g., "What is TORR RF?")
- [ ] Chatbot responds to company questions (e.g., "When was BRITZMEDI established?")
- [ ] Chatbot responds to ordering questions (e.g., "How do I become a distributor?")
- [ ] Chatbot responds to technical support questions (e.g., "How can I get support?")
- [ ] Chatbot responds to certification questions (e.g., "Is BRITZMEDI ISO certified?")

#### ✅ Response Quality Testing
- [ ] Responses are accurate and match FAQ content
- [ ] Responses are formatted clearly (no excessive text)
- [ ] Responses include contact information when relevant
- [ ] Chatbot gracefully handles questions it doesn't know
- [ ] Fallback responses are professional and helpful

#### ✅ Edge Cases
- [ ] Chatbot handles typos and variations (e.g., "torr rf" vs "TORR RF")
- [ ] Chatbot handles partial questions (e.g., "FDA cleared?" instead of full question)
- [ ] Chatbot handles follow-up questions (e.g., "Tell me more about TORR RF")
- [ ] Chatbot doesn't provide false information
- [ ] Chatbot offers to escalate to human agent when needed

#### ✅ Widget Integration
- [ ] Chatbot widget appears on website
- [ ] Widget loads without errors
- [ ] Chat history is preserved
- [ ] Offline message works if chatbot is unavailable
- [ ] Mobile responsiveness is good

#### ✅ Analytics
- [ ] Chat conversations are logged in Tawk.to dashboard
- [ ] You can see which FAQ articles are being referenced
- [ ] Response satisfaction ratings are available
- [ ] Conversation history is searchable

### Test Scenarios

**Scenario 1: Product Inquiry**
- User: "What is TORR RF?"
- Expected: Chatbot provides full TORR RF description from Knowledge Base
- Verify: Response matches Article 1.1 content

**Scenario 2: Regulatory Question**
- User: "Is TORR RF FDA approved?"
- Expected: Chatbot confirms FDA 510(k) clearance with reference number
- Verify: Response matches Article 1.2 content

**Scenario 3: Support Request**
- User: "How do I get technical support?"
- Expected: Chatbot provides contact channels and response time
- Verify: Response matches Article 4.3 content with all contact details

**Scenario 4: Unknown Question**
- User: "What's your favorite color?"
- Expected: Chatbot politely declines and offers to help with BRITZMEDI products
- Verify: Fallback response is professional

**Scenario 5: Multi-Step Conversation**
- User: "Tell me about your devices"
- Chatbot: Provides overview
- User: "Which one is best for home use?"
- Expected: Chatbot references NEWCHAE SHOT (Article 1.4)
- Verify: Conversation context is maintained

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Chatbot Not Responding to FAQ Questions
**Symptoms:** Chatbot says "I don't know" even though article exists
**Solutions:**
1. Verify article is **Published** (not Draft)
2. Check that Knowledge Base integration is **Enabled** in chatbot settings
3. Verify article keywords/tags match user's question
4. Try rephrasing the question
5. Wait 5-10 minutes for Knowledge Base to sync

#### Issue 2: Responses Are Inaccurate or Incomplete
**Symptoms:** Chatbot provides wrong information or cuts off mid-sentence
**Solutions:**
1. Check article content for typos or formatting issues
2. Verify article length isn't too long (Tawk.to may have character limits)
3. Break long articles into multiple shorter articles
4. Check that article is properly formatted (no special characters causing issues)
5. Re-save the article to refresh

#### Issue 3: Chatbot Responding to Unrelated Questions
**Symptoms:** Chatbot provides FAQ answers to questions it shouldn't
**Solutions:**
1. Increase confidence threshold in AI settings
2. Add more specific keywords/tags to articles
3. Review and refine article titles to be more specific
4. Disable Knowledge Base for certain question types
5. Set up keyword filters to prevent false matches

#### Issue 4: Knowledge Base Articles Not Appearing
**Symptoms:** Articles don't show up in Knowledge Base list
**Solutions:**
1. Verify you're in the correct property
2. Check article status is **Published** (not Draft)
3. Refresh the page (Ctrl+R or Cmd+R)
4. Clear browser cache
5. Try logging out and back in
6. Check user permissions (may need admin access)

#### Issue 5: Chatbot Widget Not Showing on Website
**Symptoms:** Chat widget doesn't appear on BRITZMEDI website
**Solutions:**
1. Verify widget code is correctly installed in BaseLayout.astro
2. Check Property ID and Widget ID are correct
3. Verify widget is **Enabled** in Tawk.to settings
4. Check browser console for JavaScript errors
5. Verify website domain is whitelisted in Tawk.to settings
6. Try different browser or incognito mode
7. Contact Tawk.to support if issue persists

#### Issue 6: Slow Response Times
**Symptoms:** Chatbot takes a long time to respond
**Solutions:**
1. Reduce number of articles in Knowledge Base (archive old ones)
2. Simplify article content (shorter, more concise)
3. Check Tawk.to server status
4. Verify internet connection speed
5. Reduce number of concurrent chat sessions
6. Contact Tawk.to support for performance optimization

#### Issue 7: Articles Not Updating
**Symptoms:** Changes to articles don't appear in chatbot responses
**Solutions:**
1. Save article changes and wait 5-10 minutes for sync
2. Clear browser cache
3. Restart chatbot widget (refresh page)
4. Log out and back into Tawk.to
5. Try editing article again
6. Check if article is locked by another user

---

## Best Practices for FAQ Management

### Organization Tips

1. **Use Consistent Naming**
   - Article titles should be questions (e.g., "What is TORR RF?")
   - Avoid abbreviations in titles (spell out full names)
   - Use title case for consistency

2. **Tag Strategically**
   - Use 3-5 tags per article
   - Use lowercase tags for consistency
   - Include product names, categories, and keywords
   - Example tags: "torr-rf", "products", "fda-cleared", "aesthetic"

3. **Organize by Category**
   - Create 5 main categories (as per BRITZMEDI FAQ)
   - Use subcategories if needed (e.g., "Products > Radiofrequency")
   - Keep category names short and descriptive

4. **Keep Content Fresh**
   - Review articles quarterly
   - Update product information as new devices launch
   - Add new FAQs based on customer inquiries
   - Archive outdated articles

5. **Monitor Performance**
   - Check which articles are most viewed
   - Track which questions customers ask most
   - Identify gaps in Knowledge Base
   - Add new articles based on customer feedback

### Maintenance Schedule

- **Weekly:** Monitor chatbot conversations for unanswered questions
- **Monthly:** Review article performance and update as needed
- **Quarterly:** Full Knowledge Base audit and refresh
- **Annually:** Comprehensive review and reorganization

---

## Next Steps

### After Training is Complete

1. **Go Live**
   - Announce trained chatbot to team
   - Monitor initial conversations
   - Gather feedback from customers

2. **Continuous Improvement**
   - Track which questions chatbot handles well
   - Identify questions that need human escalation
   - Add new FAQs based on customer inquiries
   - Refine existing articles based on feedback

3. **Expand Knowledge Base**
   - Add product-specific troubleshooting guides
   - Create video tutorials (if Tawk.to supports)
   - Add case studies and success stories
   - Include pricing and package information

4. **Integration with Other Systems**
   - Connect Tawk.to to CRM for lead tracking
   - Set up automated ticket creation for escalations
   - Integrate with email for follow-ups
   - Connect to analytics for performance tracking

---

## Support Resources

### Tawk.to Documentation
- **Help Center:** https://help.tawk.to
- **Knowledge Base:** https://docs.tawk.to
- **Video Tutorials:** https://www.tawk.to/resources/

### BRITZMEDI Support
- **Email:** sh.lee@britzmedi.com
- **Phone:** +82-70-4348-7244
- **Hours:** 9:00 AM - 6:00 PM KST, Monday-Friday

### FAQ Source
- **File:** `.opencode/crisp-faq-training.md`
- **Last Updated:** January 25, 2026
- **Total Items:** 18 FAQs across 5 categories

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 25, 2026 | Initial guide created with 18 FAQ articles and complete training instructions |

---

**Created by:** Claude Code  
**For:** BRITZMEDI Global  
**Purpose:** Enable Tawk.to chatbot training with comprehensive FAQ Knowledge Base  
**Status:** ✅ Ready for Implementation
