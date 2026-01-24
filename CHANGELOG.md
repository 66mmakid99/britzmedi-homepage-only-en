# Changelog

All notable changes to the BRITZMEDI Global Website will be documented in this file.

## [1.1.0] - 2026-01-25

### Added
- **Dark Mode / Light Mode Toggle**: Theme toggle button in header (desktop & mobile) with localStorage persistence
- **FAQ Page**: Comprehensive FAQ with 18 questions across 5 categories (Products, Company, Ordering, Technical, Certifications)
  - SEO-optimized with FAQ Schema markup for Google rich snippets
  - Smooth accordion animations
  - Category navigation with anchor links
- **Resources Page (Download Center)**: 
  - Google Drive integration for file downloads
  - Category filtering (Product Brochures, Technical Docs, Marketing, Certificates, Videos)
  - File type badges and thumbnails
- **Hero Section Enhancement**: 
  - Support for video, image, or gradient backgrounds
  - Configurable via `src/content/hero.ts`
  - Overlay options for video/image backgrounds
- **Email Validation**: 
  - Real-time client-side validation
  - Disposable email domain blocking (19 common domains)
  - Common typo detection (gmail, yahoo, hotmail, outlook)
  - Visual feedback with icons
- **Phone Number International Format**:
  - Country code selector (20 countries)
  - Dynamic format hints based on selected country
- **SEO/AEO/GEO Optimization**:
  - `robots.txt` with sitemap reference
  - `sitemap.xml` with all pages
  - FAQ Schema.org structured data
  - Updated Organization schema with new address

### Changed
- **Company Address Updated**: 
  - New: 1211, 388, Dunchon-daero, Jungwon-gu, Seongnam-si, Gyeonggi-do, Republic of Korea
  - Postal Code: 13403
- **Navigation Menu**: Added "Resources" and "FAQ" links
- **Footer**: Updated links to include FAQ and Resources sections
- **EmailJS Template**: Updated to `template_azmskha` with new service

### Technical
- Added dark mode CSS variables and class-based theming
- Created content files: `faq.ts`, `resources.ts`, `hero.ts`
- Contact form improvements with better UX feedback

---

## [1.0.1] - 2026-01-24

### Fixed
- Mobile menu z-index and overlay issues
- EmailJS SDK dynamic loading to prevent initialization errors

### Changed
- Removed Business Hours section from contact page

---

## [1.0.0] - 2026-01-24

### Initial Release
- Complete English-only global website for BRITZMEDI
- Pages: Home, About, Products (4 products), Certifications, Contact
- Premium design with medical device industry aesthetics
- EmailJS contact form integration
- Responsive design (mobile, tablet, desktop)
- SEO optimization with meta tags and structured data
- Deployed on Cloudflare Pages

---

## Tech Stack
- **Framework**: Astro 5.x
- **Styling**: Tailwind CSS 4.x
- **Hosting**: Cloudflare Pages
- **Email**: EmailJS
- **React**: For interactive components
