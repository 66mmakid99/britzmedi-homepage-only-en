#!/usr/bin/env node

/**
 * check-links.js - Link Integrity Validation
 * 
 * Scans Astro pages for internal links and validates they point to existing pages/anchors.
 * Reports dead links with file locations and line numbers.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve, extname } from 'path';
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
 * Recursively find all files with given extensions
 */
function findFiles(dir, extensions, files = []) {
  if (!existsSync(dir)) return files;
  
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and hidden directories
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        findFiles(fullPath, extensions, files);
      }
    } else {
      const ext = extname(entry).toLowerCase();
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

/**
 * Extract all links from content with line numbers
 */
function extractLinks(content, filePath) {
  const links = [];
  const lines = content.split('\n');
  
  // Regex patterns for different link types
  const hrefPattern = /href=["']([^"']+)["']/g;
  const toPattern = /to=["']([^"']+)["']/g;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Extract href attributes
    let match;
    while ((match = hrefPattern.exec(line)) !== null) {
      links.push({
        url: match[1],
        type: 'href',
        line: lineNum,
        file: filePath,
        context: line.trim().substring(0, 100)
      });
    }
    hrefPattern.lastIndex = 0;
    
    // Extract to attributes (for Link components)
    while ((match = toPattern.exec(line)) !== null) {
      links.push({
        url: match[1],
        type: 'to',
        line: lineNum,
        file: filePath,
        context: line.trim().substring(0, 100)
      });
    }
    toPattern.lastIndex = 0;
  });
  
  return links;
}

/**
 * Extract all anchor IDs from content
 */
function extractAnchors(content) {
  const anchors = new Set();
  
  // Match id attributes
  const idPattern = /id=["']([^"']+)["']/g;
  let match;
  while ((match = idPattern.exec(content)) !== null) {
    anchors.add(match[1]);
  }
  
  return anchors;
}

/**
 * Get all valid page routes from src/pages
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
        // Handle dynamic routes like [slug]
        if (entry.startsWith('[') && entry.endsWith(']')) {
          // Dynamic routes - we can't validate these statically
          continue;
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
          routes.add(routePath + '/'); // With trailing slash
        }
      }
    }
  }
  
  scanPages(pagesDir);
  return routes;
}

/**
 * Validate a single link
 */
function validateLink(link, projectRoot, validRoutes, allAnchors) {
  const { url, file } = link;
  
  // Skip external links
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return { valid: true, type: 'external', skipped: true };
  }
  
  // Skip javascript:, mailto:, tel: links
  if (url.startsWith('javascript:') || url.startsWith('mailto:') || url.startsWith('tel:')) {
    return { valid: true, type: 'special', skipped: true };
  }
  
  // Skip data: URIs
  if (url.startsWith('data:')) {
    return { valid: true, type: 'data-uri', skipped: true };
  }
  
  // Skip template expressions
  if (url.includes('{') || url.includes('$')) {
    return { valid: true, type: 'dynamic', skipped: true };
  }
  
  // Handle anchor-only links
  if (url.startsWith('#')) {
    const anchorId = url.substring(1);
    if (!anchorId) {
      return { valid: true, type: 'anchor', skipped: true };
    }
    
    // Check if anchor exists in the same file
    const fileContent = readFileSync(file, 'utf-8');
    const fileAnchors = extractAnchors(fileContent);
    
    if (fileAnchors.has(anchorId)) {
      return { valid: true, type: 'anchor' };
    }
    return { valid: false, type: 'anchor', reason: `Anchor #${anchorId} not found in file` };
  }
  
  // Handle relative paths
  let pathPart = url;
  let anchorPart = '';
  
  // Separate path from anchor
  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    pathPart = url.substring(0, hashIndex);
    anchorPart = url.substring(hashIndex + 1);
  }
  
  // Normalize path
  let normalizedPath = pathPart;
  if (!normalizedPath.startsWith('/')) {
    // Relative path - resolve from current file
    const fileDir = dirname(file).replace(projectRoot, '').replace(/\\/g, '/');
    normalizedPath = resolve(fileDir, pathPart).replace(/\\/g, '/');
  }
  
  // Remove trailing slash for comparison
  const pathWithoutSlash = normalizedPath.replace(/\/$/, '') || '/';
  const pathWithSlash = pathWithoutSlash + '/';
  
  // Check if route exists
  if (!validRoutes.has(pathWithoutSlash) && !validRoutes.has(pathWithSlash)) {
    // Check if it's a static file in public/
    const publicPath = join(projectRoot, 'public', pathPart);
    if (existsSync(publicPath)) {
      return { valid: true, type: 'static' };
    }
    
    return { valid: false, type: 'page', reason: `Page not found: ${pathPart}` };
  }
  
  return { valid: true, type: 'internal' };
}

/**
 * Main check function
 */
export async function checkLinks(options = {}) {
  const projectRoot = options.projectRoot || join(__dirname, '../..');
  const verbose = options.verbose || false;
  
  console.log(`${colors.cyan}${colors.bold}🔗 Link Validation${colors.reset}`);
  console.log(`${colors.dim}   Scanning: ${projectRoot}${colors.reset}\n`);
  
  const results = {
    passed: true,
    totalLinks: 0,
    validLinks: 0,
    brokenLinks: [],
    skippedLinks: 0,
    files: []
  };
  
  const srcDir = join(projectRoot, 'src');
  const pagesDir = join(srcDir, 'pages');
  
  // Get valid routes
  const validRoutes = getValidRoutes(pagesDir);
  
  // Find all source files
  const sourceFiles = findFiles(srcDir, ['.astro', '.tsx', '.jsx', '.ts', '.js', '.md', '.mdx']);
  
  if (sourceFiles.length === 0) {
    console.log(`${colors.yellow}   ⚠️  No source files found${colors.reset}`);
    return results;
  }
  
  // Collect all anchors from all files
  const allAnchors = new Map();
  for (const file of sourceFiles) {
    const content = readFileSync(file, 'utf-8');
    allAnchors.set(file, extractAnchors(content));
  }
  
  // Process each file
  for (const file of sourceFiles) {
    const content = readFileSync(file, 'utf-8');
    const links = extractLinks(content, file);
    
    const fileResult = {
      file,
      totalLinks: links.length,
      brokenLinks: []
    };
    
    for (const link of links) {
      results.totalLinks++;
      
      const validation = validateLink(link, projectRoot, validRoutes, allAnchors);
      
      if (validation.skipped) {
        results.skippedLinks++;
        continue;
      }
      
      if (validation.valid) {
        results.validLinks++;
      } else {
        results.passed = false;
        const brokenLink = {
          ...link,
          reason: validation.reason
        };
        results.brokenLinks.push(brokenLink);
        fileResult.brokenLinks.push(brokenLink);
      }
    }
    
    results.files.push(fileResult);
  }
  
  // Print results
  if (results.brokenLinks.length > 0) {
    console.log(`${colors.red}${colors.bold}   ❌ FAILED${colors.reset}`);
    console.log(`${colors.dim}   Found ${results.brokenLinks.length} broken link(s):\n${colors.reset}`);
    
    for (const link of results.brokenLinks) {
      const relativePath = link.file.replace(projectRoot, '').replace(/\\/g, '/');
      console.log(`   ${colors.red}•${colors.reset} ${colors.bold}${relativePath}:${link.line}${colors.reset}`);
      console.log(`     ${colors.dim}Link:${colors.reset} ${link.url}`);
      console.log(`     ${colors.dim}Reason:${colors.reset} ${link.reason}`);
      if (verbose) {
        console.log(`     ${colors.dim}Context:${colors.reset} ${link.context}`);
      }
      console.log();
    }
  } else {
    console.log(`${colors.green}${colors.bold}   ✅ PASSED${colors.reset}`);
  }
  
  console.log(`${colors.dim}   Summary: ${results.validLinks} valid, ${results.brokenLinks.length} broken, ${results.skippedLinks} skipped (external/dynamic)${colors.reset}`);
  console.log(`${colors.dim}   Files scanned: ${sourceFiles.length}${colors.reset}\n`);
  
  return results;
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
  
  checkLinks({ verbose }).then(results => {
    process.exit(results.passed ? 0 : 1);
  }).catch(err => {
    console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
    process.exit(1);
  });
}
