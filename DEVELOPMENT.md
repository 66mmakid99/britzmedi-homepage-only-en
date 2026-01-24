# BRITZMEDI Global Website - Development Documentation

## Project Overview

BRITZMEDI 영문 전용 글로벌 웹사이트입니다. 해외 바이어/디스트리뷰터를 위한 정보 제공 중심의 의료기기 기업 웹사이트입니다.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Astro | 5.x | Static Site Generator |
| Tailwind CSS | 4.x | Styling (CSS-in-JS) |
| React | 19.x | Interactive Components |
| Cloudflare Pages | - | Hosting & CDN |
| EmailJS | - | Contact Form Email Delivery |

## Project Structure

```
britzmedi-global/
├── public/
│   ├── robots.txt          # Search engine crawling rules
│   ├── sitemap.xml         # SEO sitemap
│   └── images/             # Static images
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── Header.astro    # Navigation + Theme Toggle
│   │       └── Footer.astro    # Footer Links
│   ├── content/
│   │   ├── company.ts      # Company info, milestones
│   │   ├── products.ts     # Product catalog
│   │   ├── certifications.ts # Certification data
│   │   ├── faq.ts          # FAQ content
│   │   ├── resources.ts    # Download resources
│   │   └── hero.ts         # Hero section settings
│   ├── layouts/
│   │   └── BaseLayout.astro    # Main layout with SEO
│   ├── pages/
│   │   ├── index.astro     # Homepage
│   │   ├── about.astro     # Company info
│   │   ├── contact.astro   # Contact form
│   │   ├── certifications.astro
│   │   ├── faq.astro       # FAQ page
│   │   ├── resources.astro # Downloads page
│   │   └── products/
│   │       ├── index.astro
│   │       └── [id].astro  # Dynamic product pages
│   └── styles/
│       └── global.css      # Global styles + Dark mode
├── astro.config.mjs
├── CHANGELOG.md
└── DEVELOPMENT.md
```

## Key Features

### 1. Dark Mode / Light Mode

**Implementation:**
- CSS variables in `global.css` (`:root` and `.dark` classes)
- Theme toggle buttons in Header (desktop + mobile)
- `localStorage` persistence
- System preference detection via `prefers-color-scheme`

**Usage:**
```javascript
// Toggle theme
document.documentElement.classList.toggle('dark');
localStorage.setItem('theme', isDark ? 'dark' : 'light');
```

### 2. Hero Section (Video/Image/Gradient)

**Configuration:** `src/content/hero.ts`

```typescript
export const heroSettings = {
  backgroundType: 'gradient', // 'gradient' | 'image' | 'video'
  backgroundImage: '/images/hero-bg.jpg',
  backgroundVideo: '/videos/hero-bg.mp4',
  overlayOpacity: 60,
  overlayColor: 'dark',
  // ... content settings
};
```

**Supported Types:**
- `gradient`: CSS gradient with decorative blurs
- `image`: Full-bleed background image with overlay
- `video`: Autoplaying muted video background

### 3. FAQ Page (SEO Optimized)

**Content:** `src/content/faq.ts`

**Schema Markup:** Automatically generates FAQPage structured data for Google rich snippets.

**Categories:**
- Products
- Company
- Ordering & Distribution
- Technical Support
- Certifications

### 4. Resources/Downloads Page

**Content:** `src/content/resources.ts`

**Features:**
- Google Drive link integration
- Category filtering
- File type indicators (PDF, PPT, Video, Image)
- Product association

### 5. Contact Form Validation

**Email Validation:**
- Format checking
- Disposable email blocking (19 domains)
- Common typo detection

**Phone Number:**
- Country code selector (20 countries)
- Format hints per country

### 6. SEO Optimization

| File | Purpose |
|------|---------|
| `robots.txt` | Crawling rules |
| `sitemap.xml` | Page index |
| BaseLayout.astro | Meta tags, Open Graph, Twitter Cards |
| FAQ Schema | Rich snippets for FAQ |
| Organization Schema | Company structured data |

## Development

### Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment

No `.env` file required. All configurations are in code.

### Deployment

Automatic deployment via GitHub → Cloudflare Pages integration.

**Manual deployment:**
```bash
npm run build
npx wrangler pages deploy dist --project-name=britzmedi-homepage-only-en
```

## Content Management

### Modifying Content

All content is managed via TypeScript files in `src/content/`:

1. **Company Info**: `company.ts`
2. **Products**: `products.ts`
3. **FAQ**: `faq.ts`
4. **Resources**: `resources.ts`
5. **Hero Settings**: `hero.ts`

### Adding a New FAQ

```typescript
// src/content/faq.ts
export const faqItems: FAQItem[] = [
  {
    id: 'unique-id',
    question: 'Your question?',
    answer: 'Your detailed answer.',
    category: 'products', // products | company | ordering | technical | certifications
  },
  // ...
];
```

### Adding a New Resource

```typescript
// src/content/resources.ts
export const resources: Resource[] = [
  {
    id: 'unique-id',
    title: 'Resource Title',
    description: 'Description',
    type: 'pdf', // pdf | ppt | video | image | brochure
    category: 'product-brochure',
    driveUrl: 'https://drive.google.com/file/d/...',
    fileSize: '5.2 MB',
    product: 'TORR RF', // optional
  },
  // ...
];
```

## EmailJS Configuration

**Current Settings:**
- Public Key: `qZJl-FQP1CJJqGvNp`
- Service ID: `service_nbk0net`
- Template ID: `template_azmskha`

**Template Variables:**
```
{{inquiry_type}}
{{from_name}}
{{company}}
{{from_email}}
{{phone}}
{{country}}
{{product_interest}}
{{message}}
```

## Future Improvements (Planned)

- [ ] Keystatic CMS integration for admin panel
- [ ] Multi-language support (DeepL API)
- [ ] Product image gallery
- [ ] Blog/News section
- [ ] Newsletter subscription

---

**Last Updated:** 2026-01-25
**Maintainer:** BRITZMEDI Development Team
