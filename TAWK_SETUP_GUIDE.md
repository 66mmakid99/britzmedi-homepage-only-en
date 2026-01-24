# Tawk.to Setup Guide for BRITZMEDI

## Account Information

- **Property ID**: `69750b239602761980a882d2`
- **Widget ID**: `1jfoj70v5`
- **Dashboard**: https://dashboard.tawk.to

## Widget Installation

The Tawk.to widget has been automatically integrated into the BRITZMEDI website through `src/layouts/BaseLayout.astro`. The widget will appear on all pages.

## Knowledge Base Setup

### Step 1: Access Tawk.to Dashboard

1. Go to https://dashboard.tawk.to
2. Log in with your BRITZMEDI account credentials
3. Select your property from the dashboard

### Step 2: Import FAQs to Knowledge Base

The FAQ content has been exported to `tawk-faq-export.json`. You can manually add these to Tawk.to:

1. Navigate to **Administration** > **Knowledge Base**
2. Click **Add Article** for each FAQ item
3. Use the categories provided in the export:
   - Products
   - Company
   - Ordering & Distribution
   - Technical Support
   - Certifications

### Step 3: Set Up AI Assist (Optional - Paid Feature)

If you have Tawk.to's AI Assist feature:

1. Go to **Administration** > **AI Assist**
2. Enable AI Assist for your property
3. The AI will automatically use your Knowledge Base articles to answer visitor questions

### Step 4: Configure Quick Responses

Add these quick responses for common queries:

1. Go to **Administration** > **Shortcuts**
2. Add shortcuts for:
   - `/hello` - Greeting message
   - `/pricing` - Pricing inquiry response
   - `/contact` - Contact information
   - `/distributor` - Distributor inquiry response

Example shortcuts are provided in `tawk-faq-export.json` under `quick_responses`.

## Widget Customization

### Appearance Settings

1. Go to **Administration** > **Chat Widget**
2. Recommended settings:
   - **Widget Color**: Match BRITZMEDI brand (Primary: #0066CC)
   - **Position**: Bottom Right
   - **Welcome Message**: "Welcome to BRITZMEDI! How can we help you today?"

### Business Hours

1. Go to **Administration** > **Chat Widget** > **Scheduler**
2. Set business hours (Korean Standard Time):
   - Monday - Friday: 9:00 AM - 6:00 PM KST
3. Enable offline form for after-hours inquiries

### Pre-Chat Survey (Optional)

1. Go to **Administration** > **Chat Widget** > **Pre-Chat Survey**
2. Suggested fields:
   - Name (required)
   - Email (required)
   - Company Name (optional)
   - Inquiry Type (dropdown: Sales, Support, Partnership, Other)

## Triggers and Automation

### Suggested Auto-Triggers

1. **Welcome Message** (after 10 seconds on page):
   ```
   "Hi there! Looking for information about our medical devices? I'm here to help!"
   ```

2. **Exit Intent** (when user moves to close tab):
   ```
   "Before you go, is there anything I can help you with? Feel free to leave your contact and we'll get back to you."
   ```

3. **Contact Page Trigger** (on /contact page):
   ```
   "Need help filling out the contact form? Let me know if you have any questions!"
   ```

## Integration Notes

### Widget Code Location
The Tawk.to widget script is located in:
```
src/layouts/BaseLayout.astro
```

Inside the `<head>` section, just before the closing `</head>` tag.

### Testing the Widget

1. Run `bun run dev` to start the development server
2. Open http://localhost:4321 in your browser
3. The Tawk.to widget should appear in the bottom-right corner
4. Click to open and test the chat functionality

### Troubleshooting

**Widget not appearing?**
- Clear browser cache
- Check if ad blockers are disabled
- Verify the Property ID and Widget ID are correct
- Check browser console for errors

**Chat offline?**
- Ensure at least one agent is online in the Tawk.to dashboard
- Check scheduler settings for business hours

## Mobile Responsiveness

The widget is automatically responsive. On mobile devices, it will:
- Display as a floating button
- Open in full-screen chat mode when clicked
- Respect user's zoom preferences

## Analytics

Monitor chat performance in Tawk.to dashboard:
- **Visitor History**: See all visitor interactions
- **Chat History**: Review past conversations
- **Reports**: Track response times, satisfaction ratings, and volume

## Support

For Tawk.to platform issues:
- Tawk.to Help Center: https://help.tawk.to
- Email: support@tawk.to

For BRITZMEDI website issues:
- Email: contact@britzmedi.co.kr
