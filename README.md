# BRITZMEDI Global Website

Professional medical device company website for international distributors and buyers.

![Astro](https://img.shields.io/badge/Astro-5.16-orange?logo=astro)
![React](https://img.shields.io/badge/React-19.2-blue?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-Latest-3178C6?logo=typescript)
![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?logo=cloudflare)

## Overview

BRITZMEDI Global is a static website built for showcasing medical devices to international distributors and buyers. The site features product catalogs, certification information, FAQ, contact forms, and downloadable resources.

**Live Site**: [https://britzmedi.com](https://britzmedi.com)

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [Astro](https://astro.build) | 5.16.15 | Static Site Generator (SSG) |
| [React](https://react.dev) | 19.2.3 | Interactive Components |
| [Tailwind CSS](https://tailwindcss.com) | 4.1.18 | Utility-first Styling |
| [TypeScript](https://typescriptlang.org) | Latest | Type Safety |
| [Keystatic](https://keystatic.com) | 5.0.6 | Content Management System |
| [Cloudflare Pages](https://pages.cloudflare.com) | - | Hosting & CDN |
| [EmailJS](https://emailjs.com) | - | Contact Form Email Service |
| [Vitest](https://vitest.dev) | 3.2.3 | Unit Testing |

## Project Structure

```
britzmedi-homepage-only-en/
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
│   │   └── layout/
│   │       ├── Header.astro   # Navigation header
│   │       └── Footer.astro   # Site footer
│   │
│   ├── content/               # TypeScript content data
│   │   ├── products.ts        # Product catalog
│   │   ├── certifications.ts  # Certification info
│   │   ├── faq.ts             # FAQ content (18 Q&As)
│   │   ├── resources.ts       # Downloadable resources
│   │   ├── company.ts         # Company information
│   │   └── hero.ts            # Hero section config
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro   # Base layout with SEO
│   │
│   ├── pages/
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
│   └── utils/
│       ├── email-validation.ts
│       └── email-validation.test.ts
│
├── scripts/
│   └── publisher-agent/       # Quality check tools
│       ├── index.js
│       ├── check-links.js
│       ├── validate-menu.js
│       ├── check-accessibility.js
│       └── analyze-performance.js
│
├── astro.config.mjs
├── keystatic.config.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Homepage | `/` | Hero section, product highlights, CTAs |
| About | `/about` | Company overview, milestones, philosophy |
| Products | `/products` | Product catalog listing |
| Product Detail | `/products/[id]` | Individual product information |
| Certifications | `/certifications` | FDA, ISO, KFDA certificates |
| FAQ | `/faq` | 18 Q&As in 5 categories |
| Contact | `/contact` | EmailJS-powered contact form |
| Resources | `/resources` | Download center (Google Drive) |
| Privacy | `/privacy` | Privacy policy |
| Terms | `/terms` | Terms of service |

## Products

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

### Publisher Agent (Quality Checks)

```bash
# Run all quality checks
npm run publisher:check

# Individual checks
npm run publisher:links    # Validate all links
npm run publisher:menu     # Validate navigation
npm run publisher:a11y     # Accessibility audit
npm run publisher:perf     # Performance analysis
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
- Typo detection for major providers (Gmail, Yahoo, Hotmail, Outlook)
- Optional server-side verification via Emailable API

### SEO Optimization
- Meta tags (title, description, keywords)
- OpenGraph & Twitter Card tags
- Organization Schema.org structured data
- FAQPage Schema for FAQ page
- Sitemap.xml & robots.txt

### Contact Form
- EmailJS integration
- Real-time email validation
- Country code selection (20 countries)
- Product interest selection

### Resources/Downloads
- Google Drive integration
- Categorized resources (Brochures, Technical Docs, Certificates, Videos)
- Multi-language support indicator

## Configuration Files

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro configuration with Cloudflare adapter |
| `keystatic.config.ts` | CMS collections and fields |
| `tsconfig.json` | TypeScript configuration |
| `vitest.config.ts` | Test runner configuration |

## External Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| EmailJS | Contact form emails | Service ID: `service_nbk0net` |
| Google Drive | Resource downloads | Public folder links |
| Cloudflare Pages | Hosting & CDN | Auto-deploy on push |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - BRITZMEDI Co., Ltd. All rights reserved.

## Contact

- **Website**: [https://britzmedi.com](https://britzmedi.com)
- **Email**: contact@britzmedi.com
