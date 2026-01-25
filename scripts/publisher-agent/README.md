# Publisher Agent

Frontend quality monitoring system for BRITZMEDI Global. Automatically detects issues, validates changes, and ensures site integrity.

## Features

- **Link Validation** - Scans Astro pages for broken internal links and anchors
- **Menu Validation** - Verifies menu structure, detects duplicates, checks dark mode compatibility
- **Accessibility Checks** - Validates alt attributes, heading hierarchy, ARIA labels, form accessibility
- **Performance Analysis** - Measures bundle sizes, identifies large files, suggests optimizations

## Installation

No external dependencies required - uses Node.js built-in modules only.

```bash
# Ensure Node.js 18+ is installed
node --version
```

## Usage

### Run All Checks

```bash
npm run publisher:check
```

### Run Individual Checks

```bash
npm run publisher:links   # Link validation
npm run publisher:menu    # Menu validation
npm run publisher:a11y    # Accessibility checks
npm run publisher:perf    # Performance analysis
```

### Command Line Options

```bash
# Verbose output
npm run publisher:check -- --verbose

# Fail on warnings (for CI)
npm run publisher:check -- --fail-on-warning

# Combine options
npm run publisher:check -- -v -w
```

## Output Format

```
╔════════════════════════════════════════════════════════════╗
║           🔍 Publisher Agent Report                        ║
║           BRITZMEDI Global - Quality Monitor               ║
╚════════════════════════════════════════════════════════════╝

🔗 Link Validation
   ✅ PASSED
   Summary: 45 valid, 0 broken, 12 skipped

📋 Menu Validation
   ✅ PASSED
   Summary: 8 valid, 0 missing, 0 duplicates

♿ Accessibility Check
   ⚠️  WARNINGS
   Warnings (2):
   • [heading-skip] /src/pages/about.astro:42
     Heading level skipped from h2 to h4

⚡ Performance Analysis
   ✅ PASSED
   📊 Build Metrics
   Total Size:     1.2 MB
   JavaScript:     450 KB (12 files)
   CSS:            85 KB (3 files)

═══════════════════════════════════════════════════════════════
                         SUMMARY
═══════════════════════════════════════════════════════════════

   Link Validation:      ✅ PASSED
   Menu Validation:      ✅ PASSED
   Accessibility:        ⚠️  WARNING
   Performance:          ✅ PASSED

───────────────────────────────────────────────────────────────
   Overall: 2 WARNING
   Consider addressing warnings for better quality
───────────────────────────────────────────────────────────────
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | Critical issues found |
| 2 | Warnings found (with `--fail-on-warning`) |

## Check Details

### Link Validation (`check-links.js`)

Scans all `.astro`, `.tsx`, `.jsx` files for:
- Internal links (`href` attributes)
- Component links (`to` attributes)
- Anchor links (`#section`)

Validates against:
- Pages in `src/pages/`
- Static files in `public/`

### Menu Validation (`validate-menu.js`)

Finds Header component and validates:
- Menu items point to existing pages
- No duplicate menu entries
- Dark mode compatibility (inline color styles)

### Accessibility Checks (`check-accessibility.js`)

Validates:
- **Images**: Missing `alt` attributes
- **Headings**: Proper hierarchy (h1 → h2 → h3)
- **ARIA**: Valid ARIA attributes
- **Forms**: Labels for inputs
- **Keyboard**: Click handlers on non-interactive elements
- **Language**: `lang` attribute on `<html>`

### Performance Analysis (`analyze-performance.js`)

Analyzes `dist/` output for:
- Total bundle size
- Large JavaScript/CSS files
- Unoptimized images
- Image format recommendations (WebP)

Also checks source code for:
- Console statements
- TODO/FIXME comments
- Large inline styles

## CI/CD Integration

### GitHub Actions

```yaml
name: Quality Check

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run Publisher Agent
        run: npm run publisher:check -- --fail-on-warning
```

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

npm run publisher:check

if [ $? -ne 0 ]; then
  echo "Publisher Agent found issues. Please fix before committing."
  exit 1
fi
```

## Customization

### Size Thresholds

Edit `analyze-performance.js`:

```javascript
const THRESHOLDS = {
  JS_WARNING: 100 * 1024,      // 100KB
  JS_CRITICAL: 500 * 1024,     // 500KB
  CSS_WARNING: 50 * 1024,      // 50KB
  IMAGE_WARNING: 200 * 1024,   // 200KB
  // ...
};
```

### Adding Custom Checks

Create a new check file:

```javascript
#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function myCustomCheck(options = {}) {
  const projectRoot = options.projectRoot || join(__dirname, '../..');
  
  const results = {
    passed: true,
    issues: []
  };
  
  // Your check logic here
  
  return results;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  myCustomCheck().then(results => {
    process.exit(results.passed ? 0 : 1);
  });
}
```

Then import and add to `index.js`.

## License

MIT
