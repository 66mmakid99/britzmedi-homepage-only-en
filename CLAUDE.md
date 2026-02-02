# CLAUDE.md - AI Assistant Context

This file provides context for Claude AI when working on this project.

## Project Overview

**BRITZMEDI Global Website** is a professional static website for a Korean medical device company targeting international distributors and buyers. The site is built with modern web technologies and deployed on Cloudflare Pages.

### Business Context
- **Company**: BRITZMEDI Co., Ltd. (Korean medical device manufacturer)
- **Target Audience**: International distributors, healthcare professionals, B2B buyers
- **Language**: English only (global market focused)
- **Purpose**: Product showcase, lead generation, resource distribution

## Tech Stack Quick Reference

| Component | Technology | Key Files |
|-----------|------------|-----------|
| Framework | Astro 5.16 | `astro.config.mjs` |
| UI Library | React 19 | Components in `.astro` files |
| Styling | Tailwind CSS 4.1 | `src/styles/global.css` |
| CMS | Keystatic | `keystatic.config.ts` |
| Testing | Vitest | `vitest.config.ts` |
| Hosting | Cloudflare Pages | Auto-deploy on push |

## Directory Structure Guide

```
src/
├── components/layout/     # Header.astro, Footer.astro
├── content/               # ALL content data lives here (TypeScript)
│   ├── products.ts        # Product catalog (4 products)
│   ├── certifications.ts  # FDA, ISO, KFDA certs
│   ├── faq.ts             # 18 Q&As
│   ├── resources.ts       # Downloadable files
│   ├── company.ts         # Company info
│   └── hero.ts            # Homepage hero config
├── layouts/               # BaseLayout.astro (SEO, meta tags)
├── pages/                 # Routes (10 pages)
└── utils/                 # Email validation utility
```

## Key Patterns & Conventions

### 1. Content Management
- All content is stored in TypeScript files under `src/content/`
- Product data, FAQ, certifications are exported as typed arrays
- Keystatic CMS is configured but content is primarily in TS files

### 2. Styling
- **Tailwind CSS 4.x** with utility classes
- Custom design tokens in `global.css` using `@theme`
- Color palette: Blue (primary/medical), Gold (accent/premium), Slate (neutral)
- **NO dark mode** - light mode only (dark mode was removed)

### 3. Components
- Astro components (`.astro`) for static content
- React used only where interactivity is needed
- Lucide React for icons

### 4. Forms
- Contact form uses **EmailJS** (client-side)
- Service ID: `service_nbk0net`
- Template ID: `template_azmskha`
- Public Key: `qZJl-FQP1CJJqGvNp`

### 5. Resources/Downloads
- All downloadable files hosted on **Google Drive**
- Links stored in `src/content/resources.ts`

## Common Tasks

### Adding a New Product
1. Edit `src/content/products.ts`
2. Add product images to `public/images/products/` (WebP format preferred)
3. Product will auto-appear on `/products` and get a detail page at `/products/[id]`

### Adding FAQ Questions
1. Edit `src/content/faq.ts`
2. Add to appropriate category: Products, Company, Ordering, Technical, Certifications

### Adding Downloadable Resources
1. Upload file to Google Drive (set to "Anyone with link can view")
2. Add entry to `src/content/resources.ts` with Google Drive URL

### Modifying Navigation
1. Edit `src/components/layout/Header.astro`
2. Update both desktop and mobile navigation sections

### Updating SEO
1. Page-level: Edit individual `.astro` files (title, description props)
2. Global: Edit `src/layouts/BaseLayout.astro`

## Important Notes

### DO
- Use WebP format for images (optimized)
- Keep content in TypeScript files for type safety
- Run `npm run publisher:check` before deployment
- Test email validation changes with `npm run test`

### DON'T
- Don't add dark mode (intentionally removed)
- Don't commit `.env` files (no secrets currently needed)
- Don't use external image URLs (keep in `public/images/`)

## File Size Reference

Largest files (may need refactoring if they grow):
- `src/pages/contact.astro` (~32KB) - Complex form logic
- `src/pages/index.astro` (~23KB) - Homepage with multiple sections
- `src/pages/about.astro` (~18KB) - Company information

## Testing

```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Visual UI
```

Current test coverage: Email validation only (`src/utils/email-validation.test.ts`)

## Quality Checks (Publisher Agent)

```bash
npm run publisher:check   # All checks
npm run publisher:links   # Broken links
npm run publisher:menu    # Navigation consistency
npm run publisher:a11y    # Accessibility
npm run publisher:perf    # Performance
```

## Build & Deploy

```bash
npm run dev       # Local dev server (localhost:4321)
npm run build     # Production build to ./dist
npm run preview   # Preview production build

# Manual deploy to Cloudflare
npx wrangler pages deploy dist --project-name=britzmedi-homepage-only-en
```

## Products Summary

| ID | Name | Status |
|----|------|--------|
| `torr-rf` | TORR RF (MTX-C1) | Available |
| `ulblanc` | ULBLANC | Available |
| `newchae-shot` | NEWCHAE SHOT | Available |
| `lumino-wave` | LUMINO WAVE | Coming Soon (2026 H2) |

## Pages Summary

| Route | File | Purpose |
|-------|------|---------|
| `/` | `index.astro` | Homepage |
| `/about` | `about.astro` | Company info |
| `/products` | `products/index.astro` | Product listing |
| `/products/[id]` | `products/[id].astro` | Product detail |
| `/certifications` | `certifications.astro` | Certificates |
| `/faq` | `faq.astro` | FAQ (18 Q&As) |
| `/contact` | `contact.astro` | Contact form |
| `/resources` | `resources.astro` | Downloads |
| `/privacy` | `privacy.astro` | Privacy policy |
| `/terms` | `terms.astro` | Terms of service |

## External Dependencies

| Service | Purpose | Status |
|---------|---------|--------|
| EmailJS | Contact form | Active |
| Google Drive | File downloads | Active |
| Cloudflare Pages | Hosting | Active |
| Emailable API | Email verification | Optional |

## Recent Changes (2026-01)

- Removed dark mode functionality
- Converted images to WebP format
- Added all product images
- Added FDA and KFDA certificates
- Improved heading hierarchy for accessibility
- Added Publisher Agent quality tools

---

*Last updated: 2026-02-02*
