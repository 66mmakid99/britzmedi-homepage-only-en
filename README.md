# BRITZMEDI Global Website

Professional medical device company website for international distributors and buyers.

![Astro](https://img.shields.io/badge/Astro-5.16-orange?logo=astro)
![React](https://img.shields.io/badge/React-19.2-blue?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-Latest-3178C6?logo=typescript)
![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?logo=cloudflare)

## Overview

BRITZMEDI Global is a static website built for showcasing medical devices to international distributors and buyers. The site features product catalogs, certification information, FAQ, contact forms, AI-powered chatbot, and downloadable resources.

**Live Site**: [https://britzmedi.com](https://britzmedi.com)

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [Astro](https://astro.build) | 5.16.15 | Static Site Generator (SSG) |
| [React](https://react.dev) | 19.2.3 | Interactive Components |
| [Tailwind CSS](https://tailwindcss.com) | 4.1.18 | Utility-first Styling (Light mode only) |
| [TypeScript](https://typescriptlang.org) | Latest | Type Safety |
| [Keystatic](https://keystatic.com) | 5.0.6 | Content Management System |
| [Claude API](https://anthropic.com) | Sonnet 4 | AI Chatbot |
| [Cloudflare Pages](https://pages.cloudflare.com) | - | Hosting & CDN |
| [Cloudflare D1](https://developers.cloudflare.com/d1/) | - | Database |
| [EmailJS](https://emailjs.com) | - | Contact Form Email Service |
| [Vitest](https://vitest.dev) | 3.2.3 | Unit Testing |

## Project Structure

```
britzmedi-global/
├── public/
│   ├── images/
│   │   ├── hero/              # Hero section images
│   │   ├── logos/             # Company logos
│   │   └── products/          # Product images (WebP optimized)
│   ├── robots.txt
│   └── sitemap.xml
│
├── src/
│   ├── components/
│   │   ├── layout/            # Header, Footer
│   │   ├── ui/                # Button, Form, LanguageSwitcher
│   │   ├── features/          # LeadForm, Chatbot
│   │   └── seo/               # SEOHead, WebVitals
│   │
│   ├── content/               # TypeScript content data
│   │   ├── products.ts        # Product catalog
│   │   ├── certifications.ts  # Certification info
│   │   ├── faq.ts             # FAQ content (18 Q&As)
│   │   ├── resources.ts       # Downloadable resources
│   │   ├── company.ts         # Company information
│   │   └── hero.ts            # Hero section config
│   │
│   ├── data/                  # Static data files
│   │   ├── chatbot-knowledge.md  # AI Chatbot knowledge base
│   │   └── countries.ts          # Country list
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro   # Base layout with SEO
│   │
│   ├── pages/
│   │   ├── api/               # API endpoints
│   │   │   ├── chat.ts        # AI chatbot endpoint
│   │   │   └── leads.ts       # Lead submission
│   │   ├── admin/             # Admin pages
│   │   │   └── leads.astro    # Lead dashboard
│   │   ├── index.astro        # Homepage
│   │   ├── about.astro        # About company
│   │   ├── contact.astro      # Contact form
│   │   ├── certifications.astro
│   │   ├── faq.astro
│   │   ├── privacy.astro
│   │   ├── resources.astro    # Download center
│   │   ├── terms.astro
│   │   └── products/
│   │       ├── index.astro    # Product listing
│   │       └── [id].astro     # Dynamic product detail
│   │
│   ├── styles/
│   │   └── global.css         # Tailwind & custom styles
│   │
│   └── lib/                   # Utilities
│       ├── db/                # D1 database schema
│       ├── lead-score.ts      # Lead scoring algorithm
│       └── slack.ts           # Slack notifications
│
├── astro.config.mjs
├── keystatic.config.ts
├── tsconfig.json
├── vitest.config.ts
├── CLAUDE.md                  # Development documentation
└── package.json
```

## Features

### AI Chatbot (Claude Sonnet 4)
- Natural conversational responses
- External knowledge base (`src/data/chatbot-knowledge.md`)
- Product context injection
- Spam protection (3x repeated question blocking)
- Security (XSS/injection pattern detection)
- "I'm not a robot" verification after 10 messages
- Monthly API cost monitoring logs
- Automatic contact form link (`/contact`) suggestions

### Lead Management
- 7-field lead form with business email validation
- Personal email blocking (Gmail, Yahoo, etc.)
- Lead scoring algorithm (A/B/C/D grades, 0-100 score)
- Admin dashboard (`/admin/leads`)
- Slack webhook notifications
- Cloudflare D1 database storage

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Homepage | `/` | Hero section, product highlights, CTAs |
| About | `/about` | Company overview, milestones, philosophy |
| Products | `/products` | Product catalog listing |
| Product Detail | `/products/[id]` | Individual product information |
| Certifications | `/certifications` | FDA, ISO, KFDA certificates |
| FAQ | `/faq` | 18 Q&As in 5 categories |
| Contact | `/contact` | Lead form with validation |
| Resources | `/resources` | Download center (Google Drive) |
| Privacy | `/privacy` | Privacy policy |
| Terms | `/terms` | Terms of service |
| Admin Leads | `/admin/leads` | Lead management dashboard |

### Products

| Product | Model | Status | Key Features |
|---------|-------|--------|--------------|
| **TORR RF** | MTX-C1 | Available | FDA 510(k) cleared, Multi-wave RF technology |
| **ULBLANC** | - | Available | Dual-frequency ultrasound, i-Booster technology |
| **NEWCHAE SHOT** | - | Available | 3-in-1 personal beauty device |
| **LUMINO WAVE** | - | Coming Soon | Ultrasound + Laser combination (2026 H2) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/66mmakid99/britzmedi-homepage-only-en.git
cd britzmedi-homepage-only-en

# Install dependencies
npm install
```

### Environment Variables

Create `.env` file:

```env
ANTHROPIC_API_KEY=sk-ant-...
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
```

### Development

```bash
# Start development server (localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Open test UI dashboard
npm run test:ui
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | AI chatbot (Claude Sonnet 4) |
| `/api/leads` | POST | Lead form submission |

### Chat API Request

```json
{
  "message": "Tell me about TORR RF",
  "history": [],
  "context": {
    "product": "torr-rf",
    "page": "products"
  }
}
```

### Chat API Response

```json
{
  "message": "TORR RF is our flagship...",
  "fallback": false
}
```

## Deployment

### Cloudflare Pages (Automatic)

The site automatically deploys to Cloudflare Pages on push to the `main` branch.

### Manual Deployment

```bash
npm run build
npx wrangler pages deploy dist --project-name=britzmedi-homepage-only-en
```

## Key Features

### Email Validation
- RFC 5322 format validation
- Disposable email blocking (19 domains)
- Business email requirement (personal emails blocked)
- Typo detection for major providers

### SEO Optimization
- Meta tags (title, description, keywords)
- OpenGraph & Twitter Card tags
- Organization Schema.org structured data
- FAQPage Schema for FAQ page
- Sitemap.xml & robots.txt

### Security
- XSS pattern detection in chatbot
- Input sanitization
- Rate limiting via session tracking
- Basic auth for admin pages

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Recent Updates (2026-02-03)

### AI Chatbot Improvements
- Upgraded from Claude Haiku to Claude Sonnet 4
- External knowledge base file for easy maintenance
- Natural conversational style (no excessive markdown)
- Spam protection and security features
- API cost monitoring

### UI/UX Updates
- Removed dark mode (light mode only)
- Consistent design system
- Mobile responsive improvements

## Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed development documentation and history.

## License

Proprietary - BRITZMEDI Co., Ltd. All rights reserved.

## Contact

- **Website**: [https://britzmedi.com](https://britzmedi.com)
- **Email**: contact@britzmedi.com
- **Phone**: +82-70-4348-7244
