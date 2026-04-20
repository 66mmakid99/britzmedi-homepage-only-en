# Skill: BRITZMEDI AEO/GEO/SEO Audit

## Metadata

- **Name**: britzmedi-aeo-geo-seo-audit
- **Category**: Optimization
- **Triggers**: "seo audit", "aeo check", "geo optimization", "search optimization", "schema markup", "meta tags"

## Description

Comprehensive audit skill for Answer Engine Optimization (AEO), Geographic SEO (GEO), and traditional Search Engine Optimization (SEO) for BRITZMEDI Global website.

## Audit Categories

### AEO (Answer Engine Optimization)

Optimizes content for AI assistants and featured snippets.

**Focus Areas**:
- FAQ structured data
- Question-answer format content
- Concise, direct answers
- Schema.org markup

### GEO (Geographic/Global SEO)

Optimizes for international audience targeting.

**Focus Areas**:
- hreflang tags (if multi-language)
- Local business schema
- Regional content targeting
- International SEO signals

### SEO (Search Engine Optimization)

Traditional search engine optimization.

**Focus Areas**:
- Meta tags
- Heading structure
- Image optimization
- Core Web Vitals
- Mobile-friendliness

## Audit Checklist

### AEO Checks

#### FAQ Schema
- [ ] FAQPage schema implemented on `/faq` page
- [ ] All 18 FAQ items included in schema
- [ ] Schema validates at schema.org validator
- [ ] Rich results eligible (test at Google Rich Results)

**File**: `src/pages/faq.astro`
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Question text?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Answer text."
      }
    }
  ]
}
```

#### Organization Schema
- [ ] Organization schema in BaseLayout
- [ ] Company name, logo, contact info
- [ ] Social media links (if available)

**File**: `src/layouts/BaseLayout.astro`
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BRITZMEDI",
  "url": "https://britzmedi.com",
  "logo": "https://britzmedi.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "sh.lee@britzmedi.com",
    "contactType": "sales"
  }
}
```

#### Product Schema (Future)
- [ ] Product schema for each product
- [ ] Name, description, image
- [ ] Offers (pricing if applicable)
- [ ] Certification references

### GEO Checks

#### Language/Region Targeting
- [ ] `<html lang="en">` set
- [ ] Content is in English only
- [ ] No hreflang needed (single language)

#### Local Business (Optional)
- [ ] Address in South Korea format
- [ ] Country code for phone (+82)
- [ ] Timezone considerations for contact

#### International Signals
- [ ] Currency mentions (USD for international)
- [ ] Shipping/distribution mentions
- [ ] International certifications (FDA, CE)

### SEO Checks

#### Meta Tags
- [ ] Unique `<title>` for each page (50-60 chars)
- [ ] Unique `<meta description>` (150-160 chars)
- [ ] `<meta keywords>` (optional, low priority)
- [ ] Canonical URL set

**Template**:
```html
<title>Page Title | BRITZMEDI</title>
<meta name="description" content="Clear description with keywords...">
<link rel="canonical" href="https://britzmedi.com/page">
```

#### Open Graph
- [ ] `og:title` set
- [ ] `og:description` set
- [ ] `og:image` set (1200x630 recommended)
- [ ] `og:url` set
- [ ] `og:type` set

#### Twitter Cards
- [ ] `twitter:card` set (summary_large_image)
- [ ] `twitter:title` set
- [ ] `twitter:description` set
- [ ] `twitter:image` set

#### Headings
- [ ] Single `<h1>` per page
- [ ] Logical heading hierarchy (h1 → h2 → h3)
- [ ] Keywords in headings
- [ ] Descriptive headings

#### Images
- [ ] All images have `alt` text
- [ ] Descriptive filenames
- [ ] Appropriate file sizes (<500KB)
- [ ] WebP format where possible
- [ ] Lazy loading for below-fold images

#### Technical SEO
- [ ] `robots.txt` exists and is correct
- [ ] `sitemap.xml` exists and is valid
- [ ] No broken links (404s)
- [ ] HTTPS enabled
- [ ] Fast load times (<3s)

## Audit Commands

### Validate Schema

```bash
# Test FAQ schema
curl https://britzmedi.com/faq | grep -A 50 "FAQPage"

# Or use online validator:
# https://validator.schema.org/
# https://search.google.com/test/rich-results
```

### Check Meta Tags

```bash
# View page source and search for meta tags
curl -s https://britzmedi.com | grep -E "<title>|<meta"
```

### Performance Check

```bash
# Use Lighthouse CLI
npx lighthouse https://britzmedi.com --output=html --view

# Or online:
# https://pagespeed.web.dev/
# https://gtmetrix.com/
```

### Broken Link Check

```bash
# Use linkchecker
npx broken-link-checker https://britzmedi.com -ro
```

## Current Status

### Implemented ✅
- [x] FAQ Schema on /faq page
- [x] Organization Schema in BaseLayout
- [x] robots.txt
- [x] sitemap.xml
- [x] Meta titles and descriptions
- [x] Open Graph tags
- [x] Twitter Cards
- [x] Responsive design
- [x] HTTPS via Cloudflare

### Needs Improvement ⚠️
- [ ] Product schema for individual products
- [ ] Image alt text audit needed
- [ ] Core Web Vitals optimization
- [ ] Structured data for certifications

### Not Applicable ❌
- hreflang (single language site)
- Local business schema (B2B, not local)
- Store locator (no physical stores)

## Recommendations

### High Priority
1. Add Product schema to product pages
2. Audit all image alt texts
3. Test rich results eligibility

### Medium Priority
4. Optimize Core Web Vitals
5. Add breadcrumb schema
6. Improve internal linking

### Low Priority
7. Add video schema (if videos added)
8. Add review schema (if testimonials added)
9. Consider AMP pages (mobile)

## Tools

### Free Tools
- [Google Search Console](https://search.google.com/search-console)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Schema Validator](https://validator.schema.org/)

### Paid Tools (Optional)
- Ahrefs
- SEMrush
- Moz Pro

## Related Files

- `src/layouts/BaseLayout.astro` - Meta tags, structured data
- `src/pages/faq.astro` - FAQ schema
- `public/robots.txt` - Crawling rules
- `public/sitemap.xml` - Page index

---

**Last Updated**: 2026-01-25
