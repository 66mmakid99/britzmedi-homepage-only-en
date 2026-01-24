# Skill: BRITZMEDI AI Chatbot

## Metadata

- **Name**: britzmedi-ai-chatbot
- **Category**: Integration
- **Triggers**: "add chatbot", "integrate tawk.to", "setup customer service", "chatbot", "live chat"
- **Cost**: FREE (Tawk.to 100% free forever)

## Description

Manages Tawk.to chatbot integration for BRITZMEDI Global website. Handles widget installation, Knowledge Base management, and AI assistant configuration.

## Prerequisites

- Tawk.to account (https://www.tawk.to)
- Property ID and Widget ID from Tawk.to dashboard
- 18 FAQ items prepared in `src/content/faq.ts`

## Current Configuration

- **Property ID**: `69750b239602761980a882d2`
- **Widget ID**: `1jfoj70v5`
- **Widget URL**: `https://embed.tawk.to/69750b239602761980a882d2/1jfoj70v5`
- **AI Features**: 100 free messages/month
- **Knowledge Base**: Manual entry (18 FAQ items)
- **Notifications**: sh.lee@britzmedi.co.kr

## Tasks

### 1. Widget Integration

**Location**: `src/layouts/BaseLayout.astro`

**Code**:
```html
<!-- Tawk.to Chat Widget -->
<script type="text/javascript">
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

### 2. Knowledge Base Setup

**Steps**:
1. Log into Tawk.to dashboard
2. Click Knowledge Base icon (book) in top menu
3. Create new Knowledge Base: "BRITZMEDI Help Center"
4. Create 5 categories:
   - Products
   - Company
   - Ordering & Distribution
   - Technical Support
   - Certifications
5. Add 18 FAQ items from `src/content/faq.ts`
6. Publish Knowledge Base

### 3. AI Assistant Activation

**Steps**:
1. Go to Settings → AI Assist
2. Enable AI Assistant
3. Connect Knowledge Base
4. Configure response tone: Professional
5. Test with sample questions

### 4. Notification Setup

**Steps**:
1. Go to Settings → Notifications
2. Add email: sh.lee@britzmedi.co.kr
3. Enable:
   - New conversation notifications
   - Missed conversation alerts
   - Daily summary (optional)

## Usage Examples

### Add Tawk.to to New Page

```astro
---
// The widget is already in BaseLayout.astro
// Any page using BaseLayout will have the widget
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Page Title">
  <!-- Widget appears automatically -->
</BaseLayout>
```

### Programmatic Control (Optional)

```javascript
// Open chat programmatically
Tawk_API.maximize();

// Close chat
Tawk_API.minimize();

// Hide widget
Tawk_API.hideWidget();

// Show widget
Tawk_API.showWidget();

// Set visitor name
Tawk_API.setAttributes({
  name: 'Visitor Name',
  email: 'visitor@example.com'
});
```

### Custom Styling (Optional)

```javascript
// Change widget position
Tawk_API.onLoad = function(){
  Tawk_API.setAttributes({
    'position': 'bl'  // bottom-left (default: br = bottom-right)
  });
};
```

## FAQ Export Format

For bulk entry into Tawk.to Knowledge Base:

```json
{
  "categories": ["Products", "Company", "Ordering", "Technical", "Certifications"],
  "items": [
    {
      "category": "Products",
      "title": "What products does BRITZMEDI offer?",
      "content": "BRITZMEDI offers FDA-cleared medical aesthetic devices including..."
    }
  ]
}
```

See `.opencode/tawk-faq-export.json` for complete export.

## Troubleshooting

### Widget Not Appearing

1. Check browser console for errors
2. Verify Property ID and Widget ID are correct
3. Check if ad blocker is blocking `embed.tawk.to`
4. Ensure script is in `<head>` section
5. Clear browser cache

### AI Not Responding

1. Verify Knowledge Base is published
2. Check AI Assist is enabled
3. Ensure within 100 messages/month limit
4. Test AI in Tawk.to dashboard first

### Notifications Not Arriving

1. Check spam folder
2. Verify email address in settings
3. Check notification settings are enabled
4. Test by sending message from website

## Cost

| Feature | Price |
|---------|-------|
| Live Chat | FREE |
| Knowledge Base | FREE |
| AI Assistant | 100 msgs/month FREE |
| Unlimited Agents | FREE |
| Mobile Apps | FREE |
| Ticketing | FREE |

**Total: $0/month** (sufficient for low-volume B2B inquiries)

## Related Files

- `src/layouts/BaseLayout.astro` - Widget integration
- `src/content/faq.ts` - FAQ source data
- `.opencode/tawk-faq-export.json` - Exportable FAQ format
- `.opencode/TAWK_SETUP_GUIDE.md` - Detailed setup instructions

---

**Last Updated**: 2026-01-25
