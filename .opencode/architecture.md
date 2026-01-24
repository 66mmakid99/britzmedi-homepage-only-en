# BRITZMEDI Global - System Architecture

## Overview

BRITZMEDI Global is a **static website** built with Astro, deployed to Cloudflare Pages. It has NO backend server and NO database.

```
┌─────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   GitHub    │────▶│  Cloudflare │────▶│   Browser   │       │
│  │ Repository  │     │    Pages    │     │   (User)    │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│        │                                        │               │
│        │ git push                               │               │
│        ▼                                        ▼               │
│  ┌─────────────┐                         ┌─────────────┐       │
│  │ Auto Build  │                         │  External   │       │
│  │   (Astro)   │                         │   APIs      │       │
│  └─────────────┘                         └─────────────┘       │
│                                                 │               │
│                                    ┌───────────┼───────────┐   │
│                                    ▼           ▼           ▼   │
│                              ┌─────────┐ ┌─────────┐ ┌───────┐ │
│                              │ EmailJS │ │ Tawk.to │ │Emailable│ │
│                              └─────────┘ └─────────┘ └───────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Static Site Architecture

### What This Means

| Capability | Status | Explanation |
|------------|--------|-------------|
| Server-side code | ❌ No | No Node.js, no API routes |
| Database | ❌ No | Content stored in TypeScript files |
| Authentication | ❌ No | No user accounts |
| API endpoints | ❌ No | All API calls are client-side |
| Environment variables | ⚠️ Limited | Public only (exposed in client) |

### Why Static?

1. **Performance**: Pre-rendered HTML, served from CDN edge
2. **Security**: No server to hack, no database to breach
3. **Cost**: Cloudflare Pages free tier is sufficient
4. **Simplicity**: No DevOps, no server maintenance

## Build Pipeline

```
Source Files          Build Process           Output
─────────────────────────────────────────────────────────
src/pages/*.astro  ─┐
src/content/*.ts   ─┼──▶ Astro SSG ──▶ dist/*.html
src/components/*   ─┤      │
src/layouts/*      ─┘      │
                           ▼
                    Tailwind CSS ──▶ dist/styles.css
                           │
                           ▼
                    Cloudflare ──▶ Global CDN
```

### Build Commands

```bash
# Development (hot reload)
bun run dev          # localhost:4321

# Production build
bun run build        # outputs to ./dist/

# Preview production
bun run preview      # localhost:4321 (production bundle)
```

## Content Management System

### File-Based CMS

All content is stored in TypeScript files with strong typing:

```
src/content/
├── company.ts      # Company metadata, milestones
├── products.ts     # Product catalog (4 items)
├── faq.ts          # FAQ items (18 items, 5 categories)
├── resources.ts    # Download resources (16 items)
├── hero.ts         # Hero section configuration
└── certifications.ts # Certification data
```

### Content Flow

```
TypeScript Files ──▶ Imported in Pages ──▶ Rendered as HTML
     │
     └── Type-safe interfaces ensure data integrity
```

### Example: Adding Content

```typescript
// src/content/faq.ts
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'products' | 'company' | 'ordering' | 'technical' | 'certifications';
}

export const faqItems: FAQItem[] = [
  {
    id: 'new-faq',
    question: 'What is the question?',
    answer: 'Here is the answer.',
    category: 'products',
  },
];
```

## External Integrations

### 1. EmailJS (Contact Form)

```
User submits form ──▶ Client-side JS ──▶ EmailJS API ──▶ sh.lee@britzmedi.co.kr
                           │
                           └── No server required
```

**Configuration**:
- Public Key: `qZJl-FQP1CJJqGvNp`
- Service ID: `service_nbk0net`
- Template ID: `template_azmskha`

### 2. Tawk.to (Live Chat)

```
Page Load ──▶ Tawk.to Widget Script ──▶ Tawk.to Servers
                      │
                      └── Chat data stored on Tawk.to
```

**Configuration**:
- Property ID: `69750b239602761980a882d2`
- Widget ID: `1jfoj70v5`
- Knowledge Base: 18 FAQ items (manual upload)

### 3. Emailable (Email Verification)

```
User enters email ──▶ Client-side API call ──▶ Emailable API
                              │
                              ├── Success: "deliverable"
                              ├── Rate limit (429): Fallback to client validation
                              └── Error: Fallback to client validation
```

**Configuration**:
- API Key Type: PUBLIC (safe for client-side)
- Rate Limit: 10/day/IP
- Fallback: Regex + disposable domain check

## Page Routing

Astro uses file-based routing:

```
src/pages/
├── index.astro           →  /
├── about.astro           →  /about
├── contact.astro         →  /contact
├── certifications.astro  →  /certifications
├── faq.astro             →  /faq
├── resources.astro       →  /resources
└── products/
    ├── index.astro       →  /products
    └── [id].astro        →  /products/:id (dynamic)
```

## Styling Architecture

### Tailwind CSS 4.x

```
Global CSS (src/styles/global.css)
     │
     ├── CSS Variables (--color-*, --font-*)
     ├── Dark Mode (.dark class)
     └── Base Styles
           │
           ▼
Tailwind via Vite Plugin (@tailwindcss/vite)
           │
           ▼
Component Styles (utility classes in templates)
```

### Dark Mode Implementation

```javascript
// Theme stored in localStorage
localStorage.getItem('theme')  // 'light' | 'dark' | null

// Applied via class on <html>
document.documentElement.classList.add('dark');

// CSS Variables switch automatically
:root { --bg-primary: white; }
.dark { --bg-primary: #0f172a; }
```

## SEO Architecture

### Structured Data

```
BaseLayout.astro
     │
     ├── <meta> tags (title, description, keywords)
     ├── Open Graph (<meta property="og:*">)
     ├── Twitter Cards (<meta name="twitter:*">)
     └── JSON-LD Scripts
           │
           ├── Organization Schema
           ├── FAQ Schema (on /faq page)
           └── Product Schema (planned)
```

### Files

| File | Purpose |
|------|---------|
| `public/robots.txt` | Crawling rules |
| `public/sitemap.xml` | Page index |
| `BaseLayout.astro` | Meta tags, structured data |

## Security Considerations

### Client-Side API Keys

⚠️ **All API keys are exposed in client-side code**

| Key | Risk Level | Mitigation |
|-----|------------|------------|
| EmailJS Public Key | Low | Service-level restrictions |
| Emailable PUBLIC Key | Low | Domain restrictions, rate limits |
| Tawk.to IDs | Low | Only identifies widget |

### Best Practices

1. **Never use PRIVATE keys** in client-side code
2. **Configure domain restrictions** on all API services
3. **Implement rate limiting fallbacks** in code
4. **Monitor API usage** for abuse

---

**Last Updated**: 2026-01-25
