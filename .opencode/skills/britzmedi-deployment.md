# Skill: BRITZMEDI Deployment

## Metadata

- **Name**: britzmedi-deployment
- **Category**: DevOps
- **Triggers**: "deploy", "build", "publish", "release", "cloudflare", "wrangler"

## Description

Manages build and deployment workflows for BRITZMEDI Global website. Handles both automatic GitHub deployments and manual Wrangler CLI deployments.

## Prerequisites

- Git configured with GitHub access
- Wrangler CLI installed (`npm install -g wrangler`)
- Cloudflare Pages project: `britzmedi-homepage-only-en`

## Deployment Methods

### 1. Automatic Deployment (Recommended)

**Trigger**: Git push to `main` branch

**Flow**:
```
Local Changes → git push → GitHub → Cloudflare Pages Build → Live Site
```

**Steps**:
```bash
# 1. Make changes locally
# 2. Test locally
bun run dev

# 3. Build to verify no errors
bun run build

# 4. Commit changes
git add .
git commit -m "feat: description of changes"

# 5. Push to main
git push origin main

# 6. Cloudflare auto-deploys in ~2 minutes
# 7. Verify at: https://britzmedi-homepage-only-en.pages.dev
```

### 2. Manual Deployment (Wrangler CLI)

**Use When**:
- Need immediate deployment
- Automatic deployment failed
- Testing specific build

**Steps**:
```bash
# 1. Build production bundle
bun run build

# 2. Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=britzmedi-homepage-only-en

# 3. Verify deployment
# URL shown in terminal output
```

## Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] No console.log statements left
- [ ] All imports are used
- [ ] No commented-out code

### Testing
- [ ] `bun run build` succeeds
- [ ] `bun test` passes (if tests exist)
- [ ] Manual testing on localhost:4321
- [ ] Dark mode works
- [ ] Mobile responsive

### Content
- [ ] All links work
- [ ] Images load correctly
- [ ] Contact form submits
- [ ] FAQ accordion works
- [ ] Tawk.to widget appears

### SEO
- [ ] Meta titles are set
- [ ] Meta descriptions are set
- [ ] Open Graph tags present
- [ ] Structured data valid

## Verification Commands

```bash
# Build production bundle
bun run build

# Preview production build locally
bun run preview

# Check TypeScript types
bunx astro check

# Run tests
bun test

# Check bundle size
du -sh dist/

# List all output files
ls -la dist/
```

## Rollback Procedure

### Via GitHub

```bash
# Find previous working commit
git log --oneline -10

# Revert to specific commit
git revert HEAD

# Or reset to specific commit (use carefully)
git reset --hard <commit-hash>
git push origin main --force
```

### Via Cloudflare Dashboard

1. Go to Cloudflare Pages dashboard
2. Select `britzmedi-homepage-only-en` project
3. Go to "Deployments" tab
4. Find previous successful deployment
5. Click "..." → "Rollback to this deployment"

## Environment Variables

**Note**: This is a static site. There are no server-side environment variables.

All configuration is in code:
- `astro.config.mjs` - Astro settings
- `src/content/*.ts` - Content data
- `src/layouts/BaseLayout.astro` - API keys (public only)

## Cloudflare Pages Settings

**Project Name**: `britzmedi-homepage-only-en`
**Production Branch**: `main`
**Build Command**: `npm run build`
**Build Output Directory**: `dist`
**Node Version**: 18 (or later)

## Monitoring Deployment

### Cloudflare Dashboard

1. Go to https://dash.cloudflare.com
2. Select account
3. Go to Workers & Pages
4. Click `britzmedi-homepage-only-en`
5. View "Deployments" for build logs

### Build Failure Debugging

Common issues:
1. **TypeScript errors**: Run `bun run build` locally
2. **Missing dependencies**: Check `package.json`
3. **Import errors**: Verify file paths
4. **Node version**: Ensure 18+

## Performance Optimization

### Build Output

```bash
# Check bundle size
du -sh dist/

# Analyze what's in the bundle
ls -laR dist/
```

### Image Optimization

- Use WebP format when possible
- Compress images before commit
- Use lazy loading for below-fold images

### Caching

Cloudflare Pages handles caching automatically:
- HTML: Short cache
- Assets: Long cache with hash

## Deployment Schedule

**Recommended**: Deploy during low-traffic hours (Korean time: 2-6 AM)

**Frequency**: As needed (no specific schedule for static site)

## Troubleshooting

### Build Fails on Cloudflare

1. Check build logs in Cloudflare dashboard
2. Compare with local build output
3. Verify Node version matches
4. Check for environment-specific code

### Site Not Updating

1. Clear browser cache
2. Check Cloudflare dashboard for deployment status
3. Verify push reached GitHub
4. Wait 2-3 minutes for CDN propagation

### Wrangler Auth Issues

```bash
# Re-authenticate
npx wrangler login

# Verify authentication
npx wrangler whoami
```

## Related Files

- `astro.config.mjs` - Build configuration
- `package.json` - Build scripts
- `wrangler.jsonc` - Cloudflare configuration
- `.github/` - GitHub Actions (if any)

---

**Last Updated**: 2026-01-25
