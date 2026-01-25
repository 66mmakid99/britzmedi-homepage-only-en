#!/usr/bin/env node

/**
 * validate-menu.js - Menu Structure Validation
 * 
 * Extracts menu structure from Header component and validates:
 * - All menu items have corresponding pages
 * - No duplicate menu entries
 * - Menu hierarchy consistency
 * - Dark mode compatibility
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

/**
 * Find Header component file
 */
function findHeaderComponent(srcDir) {
  const possiblePaths = [
    join(srcDir, 'components', 'layout', 'Header.astro'),
    join(srcDir, 'components', 'Header.astro'),
    join(srcDir, 'components', 'layout', 'Navigation.astro'),
    join(srcDir, 'components', 'Navigation.astro'),
    join(srcDir, 'components', 'layout', 'Navbar.astro'),
    join(srcDir, 'components', 'Navbar.astro'),
  ];
  
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }
  
  // Search recursively for any header-like component
  function searchDir(dir) {
    if (!existsSync(dir)) return null;
    
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        const found = searchDir(fullPath);
        if (found) return found;
      } else if (entry.toLowerCase().includes('header') && entry.endsWith('.astro')) {
        return fullPath;
      }
    }
    return null;
  }
  
  return searchDir(join(srcDir, 'components'));
}

/**
 * Extract menu items from Header component
 */
function extractMenuItems(content, filePath) {
  const menuItems = [];
  const lines = content.split('\n');
  
  // Patterns for navigation links
  const linkPatterns = [
    /href=["']([^"']+)["'][^>]*>([^<]*)</gi,
    /to=["']([^"']+)["'][^>]*>([^<]*)</gi,
  ];
  
  // Track if we're in a nav section
  let inNav = false;
  let navDepth = 0;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check for nav opening/closing
    if (/<nav/i.test(line)) {
      inNav = true;
      navDepth++;
    }
    if (/<\/nav>/i.test(line)) {
      navDepth--;
      if (navDepth <= 0) {
        inNav = false;
        navDepth = 0;
      }
    }
    
    // Also check for navigation-related class names
    const isNavSection = inNav || 
      /class=["'][^"']*(?:nav|menu|header)[^"']*["']/i.test(line);
    
    if (isNavSection) {
      for (const pattern of linkPatterns) {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const href = match[1];
          const text = match[2].trim();
          
          // Skip empty text or template expressions
          if (!text || text.includes('{') || href.includes('{')) {
            continue;
          }
          
          menuItems.push({
            href,
            text,
            line: lineNum,
            file: filePath,
            context: line.trim().substring(0, 100)
          });
        }
        pattern.lastIndex = 0;
      }
    }
  });
  
  return menuItems;
}

/**
 * Get all valid page routes
 */
function getValidRoutes(pagesDir) {
  const routes = new Set(['/']);
  
  function scanPages(dir, basePath = '') {
    if (!existsSync(dir)) return;
    
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (entry.startsWith('[') && entry.endsWith(']')) {
          continue; // Skip dynamic routes
        }
        scanPages(fullPath, `${basePath}/${entry}`);
      } else {
        const ext = extname(entry).toLowerCase();
        if (['.astro', '.md', '.mdx'].includes(ext)) {
          let routePath = basePath;
          const name = entry.replace(ext, '');
          
          if (name === 'index') {
            routePath = basePath || '/';
          } else {
            routePath = `${basePath}/${name}`;
          }
          
          routes.add(routePath);
          routes.add(routePath + '/');
        }
      }
    }
  }
  
  scanPages(pagesDir);
  return routes;
}

/**
 * Check for dark mode compatibility
 */
function checkDarkModeCompatibility(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  // Check for dark mode support
  const hasDarkClass = /class=["'][^"']*dark:/i.test(content);
  const hasDarkModeLogic = /dark|theme|color-scheme/i.test(content);
  
  // Check for hardcoded colors that might not work in dark mode
  const hardcodedColorPattern = /(?:color|background|background-color|border-color):\s*(?:#[0-9a-f]{3,6}|rgb|white|black|gray)/gi;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check for inline styles with hardcoded colors
    if (/style=["']/.test(line)) {
      let match;
      while ((match = hardcodedColorPattern.exec(line)) !== null) {
        issues.push({
          type: 'warning',
          message: 'Inline color style may not adapt to dark mode',
          line: lineNum,
          file: filePath,
          context: line.trim().substring(0, 80)
        });
      }
      hardcodedColorPattern.lastIndex = 0;
    }
  });
  
  return {
    hasDarkModeSupport: hasDarkClass || hasDarkModeLogic,
    issues
  };
}

/**
 * Main validation function
 */
export async function validateMenu(options = {}) {
  const projectRoot = options.projectRoot || join(__dirname, '../..');
  const verbose = options.verbose || false;
  
  console.log(`${colors.cyan}${colors.bold}📋 Menu Validation${colors.reset}`);
  console.log(`${colors.dim}   Scanning: ${projectRoot}${colors.reset}\n`);
  
  const results = {
    passed: true,
    totalMenuItems: 0,
    validItems: 0,
    issues: [],
    duplicates: [],
    darkModeIssues: []
  };
  
  const srcDir = join(projectRoot, 'src');
  const pagesDir = join(srcDir, 'pages');
  
  // Find Header component
  const headerPath = findHeaderComponent(srcDir);
  
  if (!headerPath) {
    console.log(`${colors.yellow}   ⚠️  No Header component found${colors.reset}`);
    console.log(`${colors.dim}   Searched in: ${srcDir}/components${colors.reset}\n`);
    return results;
  }
  
  console.log(`${colors.dim}   Found Header: ${headerPath.replace(projectRoot, '')}${colors.reset}\n`);
  
  // Get valid routes
  const validRoutes = getValidRoutes(pagesDir);
  
  // Read and parse Header
  const headerContent = readFileSync(headerPath, 'utf-8');
  const menuItems = extractMenuItems(headerContent, headerPath);
  
  // Check dark mode compatibility
  const darkModeCheck = checkDarkModeCompatibility(headerContent, headerPath);
  results.darkModeIssues = darkModeCheck.issues;
  
  // Track for duplicates
  const seenItems = new Map();
  
  for (const item of menuItems) {
    results.totalMenuItems++;
    
    // Check for duplicates
    const itemKey = `${item.text.toLowerCase()}|${item.href}`;
    if (seenItems.has(itemKey)) {
      const existing = seenItems.get(itemKey);
      results.duplicates.push({
        text: item.text,
        href: item.href,
        locations: [
          { file: existing.file, line: existing.line },
          { file: item.file, line: item.line }
        ]
      });
    } else {
      seenItems.set(itemKey, item);
    }
    
    // Skip external links
    if (item.href.startsWith('http://') || item.href.startsWith('https://') || item.href.startsWith('//')) {
      results.validItems++;
      continue;
    }
    
    // Skip special links
    if (item.href.startsWith('#') || item.href.startsWith('javascript:') || 
        item.href.startsWith('mailto:') || item.href.startsWith('tel:')) {
      results.validItems++;
      continue;
    }
    
    // Validate page exists
    const normalizedHref = item.href.replace(/\/$/, '') || '/';
    const hrefWithSlash = normalizedHref + '/';
    
    if (!validRoutes.has(normalizedHref) && !validRoutes.has(hrefWithSlash)) {
      // Check public directory
      const publicPath = join(projectRoot, 'public', item.href);
      if (!existsSync(publicPath)) {
        results.passed = false;
        results.issues.push({
          type: 'error',
          message: `Menu item "${item.text}" links to missing page`,
          line: item.line,
          file: item.file,
          href: item.href
        });
        continue;
      }
    }
    
    results.validItems++;
  }
  
  // Check for duplicates
  if (results.duplicates.length > 0) {
    results.passed = false;
  }
  
  // Print results
  const hasErrors = results.issues.length > 0 || results.duplicates.length > 0;
  
  if (hasErrors) {
    console.log(`${colors.red}${colors.bold}   ❌ FAILED${colors.reset}`);
    
    if (results.issues.length > 0) {
      console.log(`\n${colors.dim}   Missing pages:${colors.reset}`);
      for (const issue of results.issues) {
        const relativePath = issue.file.replace(projectRoot, '').replace(/\\/g, '/');
        console.log(`   ${colors.red}•${colors.reset} ${colors.bold}${relativePath}:${issue.line}${colors.reset}`);
        console.log(`     ${issue.message}`);
        console.log(`     ${colors.dim}href: ${issue.href}${colors.reset}`);
      }
    }
    
    if (results.duplicates.length > 0) {
      console.log(`\n${colors.dim}   Duplicate menu entries:${colors.reset}`);
      for (const dup of results.duplicates) {
        console.log(`   ${colors.yellow}•${colors.reset} "${dup.text}" (${dup.href})`);
        for (const loc of dup.locations) {
          const relativePath = loc.file.replace(projectRoot, '').replace(/\\/g, '/');
          console.log(`     ${colors.dim}at ${relativePath}:${loc.line}${colors.reset}`);
        }
      }
    }
  } else {
    console.log(`${colors.green}${colors.bold}   ✅ PASSED${colors.reset}`);
  }
  
  // Print dark mode warnings
  if (results.darkModeIssues.length > 0 && verbose) {
    console.log(`\n${colors.yellow}   ⚠️  Dark mode compatibility warnings:${colors.reset}`);
    for (const issue of results.darkModeIssues.slice(0, 5)) {
      const relativePath = issue.file.replace(projectRoot, '').replace(/\\/g, '/');
      console.log(`   ${colors.yellow}•${colors.reset} ${relativePath}:${issue.line}`);
      console.log(`     ${colors.dim}${issue.message}${colors.reset}`);
    }
  }
  
  if (!darkModeCheck.hasDarkModeSupport && verbose) {
    console.log(`\n${colors.blue}   ℹ️  No dark mode support detected in Header${colors.reset}`);
  }
  
  console.log(`\n${colors.dim}   Summary: ${results.validItems} valid, ${results.issues.length} missing, ${results.duplicates.length} duplicates${colors.reset}`);
  console.log(`${colors.dim}   Total menu items: ${results.totalMenuItems}${colors.reset}\n`);
  
  return results;
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
  
  validateMenu({ verbose }).then(results => {
    process.exit(results.passed ? 0 : 1);
  }).catch(err => {
    console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
    process.exit(1);
  });
}
