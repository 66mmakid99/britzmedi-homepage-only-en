# BRITZMEDI Global Website - AI Assistant Context

## Project Overview

**BRITZMEDI Global** is an English-only website for BRITZMEDI, a South Korean medical device manufacturer. The site targets international buyers, distributors, and partners interested in aesthetic medical devices.

**Live Site**: https://britzmedi-homepage-only-en.pages.dev
**Repository**: https://github.com/66mmakid99/britzmedi-homepage-only-en

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Astro** | 5.16.15 | Static Site Generator |
| **Tailwind CSS** | 4.1.18 | Styling (CSS-in-JS via Vite plugin) |
| **React** | 19.2.3 | Interactive Components |
| **TypeScript** | - | Type Safety |
| **Cloudflare Pages** | - | Hosting & CDN |
| **EmailJS** | - | Contact Form Email Delivery |
| **Tawk.to** | - | Live Chat & AI Chatbot |
| **Emailable** | - | Email Verification API |

## Key Directories

```
britzmedi-global/
├── .opencode/              # AI assistant context files (THIS DIRECTORY)
│   ├── skills/             # Custom OH-MY-OPENCODE skills
│   ├── README.md           # Project overview (this file)
│   ├── architecture.md     # System architecture
│   ├── conventions.md      # Coding standards
│   └── workflows.md        # Development workflows
├── public/                 # Static assets (robots.txt, sitemap.xml, images)
├── src/
│   ├── components/         # Astro/React components
│   │   └── layout/         # Header, Footer
│   ├── content/            # TypeScript content files (FAQ, products, etc.)
│   ├── layouts/            # Page layouts (BaseLayout.astro)
│   ├── pages/              # Route pages
│   └── styles/             # Global CSS
├── astro.config.mjs        # Astro configuration
├── package.json            # Dependencies
├── DEVELOPMENT.md          # Development documentation
└── CHANGELOG.md            # Version history
```

## Content Management

All content is managed via **TypeScript files** in `src/content/`:

| File | Purpose | Items |
|------|---------|-------|
| `company.ts` | Company info, milestones, core technologies | - |
| `products.ts` | Product catalog | 4 products |
| `faq.ts` | FAQ content | 18 items, 5 categories |
| `resources.ts` | Downloadable resources | 16 items |
| `hero.ts` | Hero section settings | Background type, content |
| `certifications.ts` | Certification data | FDA, MFDS, ISO 13485, GMP |

## Products

1. **TORR RF** (MTX-C1) - Monopolar RF device, FDA 510(k) cleared
2. **ULBLANC** (i-Booster) - Ultrasound skincare workstation
3. **NEWCHAE SHOT** - 3-in-1 home beauty device
4. **LUMINO WAVE** (LSR-10) - Convergence LED device (Coming H2 2026)

## Integrations

### EmailJS (Contact Form)
- **Service ID**: `service_nbk0net`
- **Template ID**: `template_azmskha`
- **Recipient**: sh.lee@britzmedi.co.kr

### Tawk.to (Live Chat)
- **Property ID**: `69750b239602761980a882d2`
- **Widget ID**: `1jfoj70v5`
- **Features**: Live chat, AI chatbot (100 free messages/month), Knowledge Base

### Emailable (Email Verification)
- **API Type**: PUBLIC key (client-side safe)
- **Rate Limit**: 10 verifications/day/IP
- **Fallback**: Client-side validation on rate limit

## Deployment

**Automatic**: Git push to `main` → Cloudflare Pages auto-deploy

**Manual**:
```bash
bun run build
npx wrangler pages deploy dist --project-name=britzmedi-homepage-only-en
```

## Related Documentation

- [DEVELOPMENT.md](../DEVELOPMENT.md) - Detailed development guide
- [CHANGELOG.md](../CHANGELOG.md) - Version history
- [architecture.md](./architecture.md) - System architecture
- [conventions.md](./conventions.md) - Coding standards
- [workflows.md](./workflows.md) - Development workflows

---

**Last Updated**: 2026-01-25
**Version**: 1.1.0
