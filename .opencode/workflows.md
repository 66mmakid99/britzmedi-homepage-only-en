# BRITZMEDI Global - Development Workflows

## Development Setup

### Prerequisites

- **Node.js** 18+ or **Bun** 1.0+
- **Git**
- **VS Code** (recommended)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/66mmakid99/britzmedi-homepage-only-en.git
cd britzmedi-global

# Install dependencies
bun install   # or: npm install

# Start development server
bun run dev   # or: npm run dev

# Open in browser
# http://localhost:4321
```

## Common Tasks

### 1. Adding a New FAQ Item

**File**: `src/content/faq.ts`

```typescript
// Add to faqItems array
export const faqItems: FAQItem[] = [
  // ... existing items
  {
    id: 'new-faq-item',  // Unique kebab-case ID
    question: 'What is the new question?',
    answer: 'Here is the detailed answer with all relevant information.',
    category: 'products',  // products | company | ordering | technical | certifications
  },
];
```

**Verification**:
1. Run `bun run dev`
2. Visit http://localhost:4321/faq
3. Find your new FAQ in the appropriate category
4. Check that FAQ Schema is updated (View Page Source → search for "FAQPage")

### 2. Adding a New Product

**File**: `src/content/products.ts`

```typescript
export const products: ProductItem[] = [
  // ... existing products
  {
    id: 'new-product',
    name: 'New Product Name',
    model: 'MODEL-123',
    tagline: 'Short description',
    category: 'medical-device',  // or 'consumer'
    status: 'coming-soon',  // or 'available'
    keyTechnologies: ['Tech 1', 'Tech 2'],
    targetAreas: ['Area 1', 'Area 2'],
    // ... other fields
  },
];
```

**Verification**:
1. Visit http://localhost:4321/products
2. New product should appear in the list
3. Click to verify detail page works: `/products/new-product`

### 3. Updating Hero Section

**File**: `src/content/hero.ts`

```typescript
export const heroSettings: HeroSettings = {
  // Change background type
  backgroundType: 'image',  // 'gradient' | 'image' | 'video'
  
  // For image background
  backgroundImage: 'https://example.com/new-hero.jpg',
  backgroundImageAlt: 'Description of image',
  
  // Adjust overlay
  overlayOpacity: 50,  // 0-100
  overlayColor: 'dark',  // 'dark' | 'light' | 'primary'
  
  // Update content
  headline: 'New Headline',
  highlightText: 'Highlighted Part',
  description: 'Updated description...',
  
  // ... other settings
};
```

**Verification**:
1. Visit http://localhost:4321
2. Hero section should reflect changes
3. Test on mobile viewport

### 4. Updating Company Information

**File**: `src/content/company.ts`

For address, contact info, milestones, etc.

### 5. Adding a Download Resource

**File**: `src/content/resources.ts`

```typescript
export const resources: Resource[] = [
  {
    id: 'new-resource',
    title: 'Resource Title',
    description: 'Brief description',
    type: 'pdf',  // pdf | ppt | video | image | brochure
    category: 'product-brochure',
    driveUrl: 'https://drive.google.com/file/d/XXX/view',
    fileSize: '2.5 MB',
    product: 'TORR RF',  // optional: associate with product
  },
];
```

## Deployment Workflow

### Automatic Deployment (Recommended)

```
1. Make changes locally
2. Test with `bun run dev`
3. Commit changes: `git add . && git commit -m "feat: description"`
4. Push to main: `git push origin main`
5. Cloudflare Pages auto-deploys in ~2 minutes
6. Verify at: https://britzmedi-homepage-only-en.pages.dev
```

### Manual Deployment

```bash
# Build production bundle
bun run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=britzmedi-homepage-only-en
```

## Testing Workflow

### Local Testing

```bash
# Run tests
bun test

# Run tests with UI
bun test:ui

# Run build (catches TypeScript errors)
bun run build
```

### Manual Verification Checklist

- [ ] All pages load without errors
- [ ] Dark mode toggle works
- [ ] Contact form submits successfully
- [ ] FAQ accordion expands/collapses
- [ ] Mobile navigation works
- [ ] Tawk.to chat widget appears
- [ ] All links are functional

## Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules .astro dist
bun install
bun run build
```

### TypeScript Errors

```bash
# Check types
bunx astro check

# Or in VS Code:
# View → Problems panel
```

### Styles Not Updating

```bash
# Tailwind CSS is processed by Vite
# Try restarting dev server
bun run dev
```

### EmailJS Not Working

1. Check browser console for errors
2. Verify Public Key in contact.astro
3. Verify template ID matches EmailJS dashboard
4. Check EmailJS dashboard for failed deliveries

### Tawk.to Widget Not Appearing

1. Check browser console for errors
2. Verify Property ID and Widget ID
3. Check if ad blocker is interfering
4. Verify script is in BaseLayout.astro `<head>`

### Emailable Rate Limited

- Error 429 triggers automatic fallback
- Client-side validation continues working
- Wait 24 hours for rate limit reset
- Consider upgrading Emailable plan for higher limits

## Git Workflow

### Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ... edit files ...

# Commit with descriptive message
git add .
git commit -m "feat: Add new feature description"

# Push to remote
git push origin feature/new-feature

# Create Pull Request on GitHub
# After review, merge to main
```

### Hotfix

```bash
# Create from main
git checkout main
git pull origin main
git checkout -b fix/bug-description

# Fix the bug
# ... edit files ...

git add .
git commit -m "fix: Resolve bug description"
git push origin fix/bug-description

# Merge immediately after verification
```

## Environment Setup

### VS Code Extensions (Recommended)

- **Astro** - Astro language support
- **Tailwind CSS IntelliSense** - Class autocomplete
- **ESLint** - Linting
- **Prettier** - Code formatting

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["class\\s*=\\s*['\"]([^'\"]*)['\"]", "([^'\"\\s]*)"]
  ]
}
```

## Monitoring

### Cloudflare Analytics

- Page views, unique visitors
- Geographic distribution
- Performance metrics

### Tawk.to Dashboard

- Chat history
- AI assistant performance
- Visitor insights

### EmailJS Dashboard

- Email delivery status
- Failed deliveries
- Usage statistics

---

**Last Updated**: 2026-01-25
