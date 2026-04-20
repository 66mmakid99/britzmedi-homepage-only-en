# Skill: BRITZMEDI Content Manager

## Metadata

- **Name**: britzmedi-content-manager
- **Category**: Content
- **Triggers**: "add faq", "update product", "edit hero", "change content", "modify text"

## Description

Manages content updates for BRITZMEDI Global website. All content is stored in TypeScript files in `src/content/` with strong typing.

## Supported Content Types

| File | Content Type | Items |
|------|--------------|-------|
| `faq.ts` | FAQ Items | 18 items |
| `products.ts` | Products | 4 products |
| `hero.ts` | Hero Section | 1 config |
| `company.ts` | Company Info | Metadata |
| `certifications.ts` | Certifications | Multiple |

**Out of Scope**: `resources.ts` (Google Drive links are placeholder)

## Content Operations

### 1. FAQ Management

**File**: `src/content/faq.ts`

#### Add New FAQ

```typescript
// Add to faqItems array
{
  id: 'unique-kebab-case-id',
  question: 'What is the question?',
  answer: 'Detailed answer here. Can include multiple sentences.',
  category: 'products',  // products | company | ordering | technical | certifications
}
```

#### Edit Existing FAQ

1. Find item by `id` in `faqItems` array
2. Update `question`, `answer`, or `category`
3. Keep `id` unchanged

#### Delete FAQ

1. Remove entire object from `faqItems` array
2. Update FAQ count in documentation

#### FAQ Categories

| Category | Description |
|----------|-------------|
| `products` | Product-related questions |
| `company` | Company information |
| `ordering` | Orders, shipping, distribution |
| `technical` | Technical support |
| `certifications` | Regulatory, certifications |

### 2. Product Management

**File**: `src/content/products.ts`

#### Product Interface

```typescript
interface ProductItem {
  id: string;              // kebab-case
  name: string;            // Display name
  model: string;           // Model number
  tagline: string;         // Short description
  category: 'medical-device' | 'consumer';
  status: 'available' | 'coming-soon';
  keyTechnologies: string[];
  targetAreas: string[];
  specifications: Record<string, string>;
  certifications: string[];
  images: {
    main: string;
    gallery: string[];
  };
}
```

#### Add New Product

```typescript
{
  id: 'new-product',
  name: 'New Product Name',
  model: 'MODEL-123',
  tagline: 'Short compelling description',
  category: 'medical-device',
  status: 'coming-soon',
  keyTechnologies: ['Technology 1', 'Technology 2'],
  targetAreas: ['Face', 'Body'],
  specifications: {
    'Power': '50W',
    'Frequency': '1MHz',
  },
  certifications: ['FDA 510(k)', 'CE Mark'],
  images: {
    main: '/images/products/new-product.jpg',
    gallery: [],
  },
}
```

#### Update Product Status

```typescript
// Change from coming-soon to available
status: 'coming-soon' → 'available'
```

### 3. Hero Section Management

**File**: `src/content/hero.ts`

#### Change Background Type

```typescript
backgroundType: 'gradient',  // Options: 'gradient' | 'image' | 'video'
```

#### Update Background Image

```typescript
backgroundImage: 'https://example.com/new-hero.jpg',
backgroundImageAlt: 'Description for accessibility',
```

#### Update Content

```typescript
badge: 'FDA 510(k) Cleared Medical Devices',
headline: 'Innovative Aesthetic',
highlightText: 'Medical Technology',
subheadline: 'from Korea',
description: 'Long description text...',
```

#### Update CTAs

```typescript
primaryCTA: {
  text: 'Explore Products',
  href: '/products',
},
secondaryCTA: {
  text: 'Contact Sales',
  href: '/contact',
},
```

### 4. Company Information

**File**: `src/content/company.ts`

#### Update Contact Info

```typescript
contact: {
  email: 'sh.lee@britzmedi.com',
  phone: '+82-31-XXX-XXXX',
  address: 'Full address here',
}
```

#### Add Milestone

```typescript
milestones: [
  { year: 2017, event: 'Company founded' },
  { year: 2024, event: 'FDA 510(k) clearance' },
  { year: 2026, event: 'New milestone' },  // Add new
]
```

## Validation Rules

### FAQ
- `id`: Unique, kebab-case, no spaces
- `question`: End with `?`
- `answer`: Complete sentences
- `category`: Must be valid enum value

### Products
- `id`: Unique, kebab-case
- `model`: Match official model number
- `status`: Only `available` or `coming-soon`
- `certifications`: Verify accuracy

### Hero
- `backgroundType`: Valid enum
- `backgroundImage`: Valid URL or path
- `overlayOpacity`: 0-100

## Content Workflow

### Making Changes

1. **Edit** the appropriate TypeScript file
2. **Save** the file
3. **Verify** in browser (dev server auto-refreshes)
4. **Test** the page thoroughly
5. **Commit** with descriptive message

### Example Commit Messages

```
content: Add new FAQ about shipping times
content: Update TORR RF specifications
content: Change hero section to image background
content: Add Q2 2026 milestone
```

## Helper Functions

### Get Product by ID

```typescript
import { products, getProductById } from '../content/products';

const product = getProductById('torr-rf');
```

### Get FAQs by Category

```typescript
import { faqItems, getFAQsByCategory } from '../content/faq';

const productFAQs = getFAQsByCategory('products');
```

### Get Available Products

```typescript
import { getAvailableProducts } from '../content/products';

const available = getAvailableProducts();
```

## Troubleshooting

### TypeScript Errors

```bash
# Check for type errors
bunx astro check
```

Common issues:
- Missing required field
- Invalid enum value
- Incorrect type (string vs number)

### Content Not Updating

1. Check file was saved
2. Check dev server is running
3. Hard refresh browser (Ctrl+Shift+R)
4. Check browser console for errors

### Build Fails After Content Change

1. Check TypeScript types match interface
2. Verify all required fields present
3. Check for syntax errors (missing commas)

## Related Files

- `src/content/faq.ts` - FAQ items
- `src/content/products.ts` - Product catalog
- `src/content/hero.ts` - Hero configuration
- `src/content/company.ts` - Company info
- `src/content/certifications.ts` - Certification data

---

**Last Updated**: 2026-01-25
