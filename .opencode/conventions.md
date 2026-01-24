# BRITZMEDI Global - Coding Conventions

## File Naming

### General Rules

| Type | Convention | Example |
|------|------------|---------|
| **Pages** | kebab-case | `contact.astro`, `faq.astro` |
| **Components** | PascalCase | `Header.astro`, `Footer.astro` |
| **Content Files** | kebab-case | `products.ts`, `faq.ts` |
| **Utilities** | kebab-case | `utils.ts` |
| **Styles** | kebab-case | `global.css` |

### Directory Structure

```
src/
├── components/
│   └── layout/          # Layout components (Header, Footer)
├── content/             # TypeScript content files
├── layouts/             # Page layouts
├── pages/               # Route pages
│   └── products/        # Nested routes
└── styles/              # Global styles
```

## TypeScript Conventions

### Interfaces

```typescript
// Use PascalCase for interface names
export interface ProductItem {
  id: string;
  name: string;
  model: string;
  category: 'medical-device' | 'consumer';
  status: 'available' | 'coming-soon';
}

// Use readonly for immutable data
export interface CompanyInfo {
  readonly name: string;
  readonly founded: number;
}
```

### Type Exports

```typescript
// Export types and data from content files
export type ProductCategory = 'medical-device' | 'consumer';
export type FAQCategory = 'products' | 'company' | 'ordering' | 'technical' | 'certifications';

export const products: ProductItem[] = [...];
export const faqItems: FAQItem[] = [...];
```

### Naming

| Type | Convention | Example |
|------|------------|---------|
| Interfaces | PascalCase | `ProductItem`, `FAQItem` |
| Types | PascalCase | `ProductCategory` |
| Constants | camelCase | `products`, `faqItems` |
| Functions | camelCase | `getProductById()` |

## Astro Component Conventions

### File Structure

```astro
---
// 1. Imports
import BaseLayout from '../layouts/BaseLayout.astro';
import { products } from '../content/products';

// 2. Props interface (if needed)
interface Props {
  title: string;
  description?: string;
}

// 3. Props destructuring
const { title, description = 'Default description' } = Astro.props;

// 4. Data fetching / processing
const featuredProducts = products.filter(p => p.status === 'available');
---

<!-- 5. Template -->
<BaseLayout title={title}>
  <main>
    <h1>{title}</h1>
    {featuredProducts.map(product => (
      <div>{product.name}</div>
    ))}
  </main>
</BaseLayout>

<!-- 6. Scoped styles (if needed) -->
<style>
  h1 {
    color: var(--color-primary);
  }
</style>

<!-- 7. Client-side scripts (if needed) -->
<script>
  // Client-side JavaScript
</script>
```

### Component Props

```astro
---
// Always define Props interface
interface Props {
  title: string;
  isActive?: boolean;  // Optional props use ?
  variant?: 'primary' | 'secondary';  // Use union types for variants
}

// Provide defaults for optional props
const { 
  title, 
  isActive = false, 
  variant = 'primary' 
} = Astro.props;
---
```

## Tailwind CSS Conventions

### Class Organization

```html
<!-- Order: Layout → Spacing → Typography → Colors → Effects → States -->
<div class="
  flex flex-col items-center justify-center
  p-4 md:p-8 gap-4
  text-lg font-medium
  bg-white dark:bg-slate-900 text-slate-900 dark:text-white
  rounded-lg shadow-md
  hover:shadow-lg transition-shadow
">
```

### Responsive Design

```html
<!-- Mobile-first approach -->
<div class="
  text-sm md:text-base lg:text-lg
  p-4 md:p-6 lg:p-8
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
">
```

### Dark Mode

```html
<!-- Always include dark: variants for theme support -->
<div class="bg-white dark:bg-slate-900">
  <p class="text-slate-900 dark:text-white">
    Content
  </p>
</div>
```

### Custom CSS Variables

```css
/* src/styles/global.css */
:root {
  --color-primary: #2563eb;
  --color-secondary: #64748b;
}

.dark {
  --color-primary: #3b82f6;
  --color-secondary: #94a3b8;
}
```

## Content File Conventions

### Structure

```typescript
// src/content/products.ts

// 1. Type definitions
export interface ProductItem {
  id: string;
  name: string;
  // ...
}

// 2. Type aliases (if needed)
export type ProductStatus = 'available' | 'coming-soon';

// 3. Data array
export const products: ProductItem[] = [
  {
    id: 'torr-rf',
    name: 'TORR RF',
    // ...
  },
];

// 4. Helper functions (optional)
export function getProductById(id: string): ProductItem | undefined {
  return products.find(p => p.id === id);
}

export function getAvailableProducts(): ProductItem[] {
  return products.filter(p => p.status === 'available');
}
```

### ID Naming

```typescript
// Use kebab-case for IDs
{
  id: 'torr-rf',           // ✅ Good
  id: 'torrRF',            // ❌ Bad (camelCase)
  id: 'TORR_RF',           // ❌ Bad (SCREAMING_SNAKE)
}
```

## Git Conventions

### Commit Messages

```
<type>: <short description>

<optional body with details>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples**:
```
feat: Add dark mode toggle to header
fix: Correct email validation regex
docs: Update README with deployment instructions
refactor: Extract contact form validation into separate function
```

### Branch Naming

```
main              # Production branch
feature/dark-mode # New features
fix/email-validation # Bug fixes
docs/readme-update # Documentation
```

## Error Handling

### Client-Side API Calls

```typescript
async function verifyEmail(email: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.emailable.com/v1/verify?...`);
    
    // Handle rate limiting
    if (response.status === 429) {
      console.warn('Rate limited, using fallback');
      return fallbackValidation(email);
    }
    
    // Handle other errors
    if (!response.ok) {
      console.error('API error:', response.status);
      return fallbackValidation(email);
    }
    
    const data = await response.json();
    return data.state === 'deliverable';
    
  } catch (error) {
    // Network errors
    console.error('Network error:', error);
    return fallbackValidation(email);
  }
}
```

### Form Validation

```typescript
function validateEmail(email: string): { valid: boolean; message?: string } {
  // Format check
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }
  
  // Disposable domain check
  if (DISPOSABLE_DOMAINS.includes(getDomain(email))) {
    return { valid: false, message: 'Please use a business email' };
  }
  
  return { valid: true };
}
```

## Comments

### When to Comment

```typescript
// ✅ Complex business logic
// Check if user is in a supported region for shipping
const isEligible = SUPPORTED_REGIONS.includes(userRegion) && orderTotal > MIN_ORDER;

// ✅ Non-obvious implementation details
// Using debounce to prevent API spam during typing
const debouncedValidate = debounce(validateEmail, 500);

// ✅ TODO/FIXME markers
// TODO: Add phone validation for international formats
// FIXME: Rate limiting not working on Safari

// ❌ Obvious code (don't comment)
// Set the title
const title = 'BRITZMEDI';  // This comment is unnecessary
```

### JSDoc for Functions

```typescript
/**
 * Validates an email address and returns validation result.
 * @param email - The email address to validate
 * @returns Object with valid boolean and optional message
 * @example
 * const result = validateEmail('test@example.com');
 * if (!result.valid) console.log(result.message);
 */
function validateEmail(email: string): { valid: boolean; message?: string } {
  // ...
}
```

---

**Last Updated**: 2026-01-25
