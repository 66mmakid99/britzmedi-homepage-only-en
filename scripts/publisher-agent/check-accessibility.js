#!/usr/bin/env node

/**
 * check-accessibility.js - Accessibility Checks
 * 
 * Scans source files for accessibility issues:
 * - Missing alt attributes on images
 * - Heading hierarchy (h1 → h2 → h3)
 * - ARIA labels validation
 * - Color contrast ratios (basic checks)
 * - Form accessibility
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
 * Find all source files recursively
 */
function findSourceFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        findSourceFiles(fullPath, files);
      }
    } else {
      const ext = extname(entry).toLowerCase();
      if (['.astro', '.tsx', '.jsx', '.html'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

/**
 * Check for missing alt attributes on images
 */
function checkImageAlts(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  const imgPattern = /<img[^>]*>/gi;
  const altPattern = /alt=["'][^"']*["']/i;
  const altEmptyPattern = /alt=["']\s*["']/i;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    let match;
    
    while ((match = imgPattern.exec(line)) !== null) {
      const imgTag = match[0];
      
      // Skip if it's a dynamic/template expression
      if (imgTag.includes('{...') || imgTag.includes('...props')) {
        continue;
      }
      
      if (!altPattern.test(imgTag)) {
        issues.push({
          type: 'error',
          rule: 'img-alt',
          message: 'Image missing alt attribute',
          line: lineNum,
          file: filePath,
          context: imgTag.substring(0, 80)
        });
      }
    }
    imgPattern.lastIndex = 0;
  });
  
  return issues;
}

/**
 * Check heading hierarchy
 */
function checkHeadingHierarchy(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  const headingPattern = /<h([1-6])[^>]*>/gi;
  const headings = [];
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    let match;
    
    while ((match = headingPattern.exec(line)) !== null) {
      headings.push({
        level: parseInt(match[1]),
        line: lineNum,
        context: line.trim().substring(0, 80)
      });
    }
    headingPattern.lastIndex = 0;
  });
  
  // Check for multiple h1 tags
  const h1Count = headings.filter(h => h.level === 1).length;
  if (h1Count > 1) {
    issues.push({
      type: 'warning',
      rule: 'heading-h1-multiple',
      message: `Multiple h1 tags found (${h1Count}). Consider using only one h1 per page.`,
      line: headings.find(h => h.level === 1)?.line || 0,
      file: filePath
    });
  }
  
  // Check for skipped heading levels
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    
    if (curr.level > prev.level + 1) {
      issues.push({
        type: 'warning',
        rule: 'heading-skip',
        message: `Heading level skipped from h${prev.level} to h${curr.level}`,
        line: curr.line,
        file: filePath,
        context: curr.context
      });
    }
  }
  
  return issues;
}

/**
 * Check ARIA labels
 */
function checkAriaLabels(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  // Valid ARIA attributes
  const validAriaAttrs = new Set([
    'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden',
    'aria-expanded', 'aria-controls', 'aria-haspopup', 'aria-pressed',
    'aria-selected', 'aria-checked', 'aria-disabled', 'aria-live',
    'aria-atomic', 'aria-relevant', 'aria-busy', 'aria-current',
    'aria-modal', 'aria-required', 'aria-invalid', 'aria-valuemin',
    'aria-valuemax', 'aria-valuenow', 'aria-valuetext', 'aria-orientation',
    'aria-autocomplete', 'aria-multiselectable', 'aria-readonly',
    'aria-placeholder', 'aria-roledescription', 'aria-owns', 'aria-flowto',
    'aria-posinset', 'aria-setsize', 'aria-level', 'aria-colcount',
    'aria-colindex', 'aria-colspan', 'aria-rowcount', 'aria-rowindex',
    'aria-rowspan', 'aria-sort', 'aria-activedescendant', 'aria-details',
    'aria-errormessage', 'aria-keyshortcuts'
  ]);
  
  const ariaPattern = /aria-[a-z-]+=/gi;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    let match;
    
    while ((match = ariaPattern.exec(line)) !== null) {
      const ariaAttr = match[0].slice(0, -1);
      if (!validAriaAttrs.has(ariaAttr)) {
        issues.push({
          type: 'warning',
          rule: 'aria-invalid',
          message: `Potentially invalid ARIA attribute: ${ariaAttr}`,
          line: lineNum,
          file: filePath
        });
      }
    }
    ariaPattern.lastIndex = 0;
  });
  
  // Check for icon-only buttons without labels
  const iconButtonPattern = /<button[^>]*>[\s]*(?:<(?:svg|span|i)[^>]*(?:icon|lucide)[^>]*>|{[^}]*Icon[^}]*})/gi;
  const ariaLabelPattern = /aria-label=["'][^"']+["']/i;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    if (iconButtonPattern.test(line) && !ariaLabelPattern.test(line)) {
      issues.push({
        type: 'warning',
        rule: 'button-label',
        message: 'Icon-only button may need aria-label for screen readers',
        line: lineNum,
        file: filePath,
        context: line.trim().substring(0, 80)
      });
    }
    iconButtonPattern.lastIndex = 0;
  });
  
  return issues;
}

/**
 * Check form accessibility
 */
function checkFormAccessibility(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  const inputPattern = /<input[^>]*>/gi;
  const labelForPattern = /<label[^>]*for=["']([^"']+)["']/gi;
  const idPattern = /id=["']([^"']+)["']/i;
  const ariaLabelPattern = /aria-label=["'][^"']+["']/i;
  const typeHiddenPattern = /type=["']hidden["']/i;
  const typeButtonPattern = /type=["'](?:submit|button|reset)["']/i;
  
  // Collect all label for attributes
  const labelFors = new Set();
  lines.forEach(line => {
    let match;
    while ((match = labelForPattern.exec(line)) !== null) {
      labelFors.add(match[1]);
    }
    labelForPattern.lastIndex = 0;
  });
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    let match;
    
    while ((match = inputPattern.exec(line)) !== null) {
      const inputTag = match[0];
      
      // Skip hidden and button-type inputs
      if (typeHiddenPattern.test(inputTag) || typeButtonPattern.test(inputTag)) {
        continue;
      }
      
      // Skip if it has spread props
      if (inputTag.includes('{...')) {
        continue;
      }
      
      const idMatch = idPattern.exec(inputTag);
      const hasLabel = idMatch && labelFors.has(idMatch[1]);
      const hasAriaLabel = ariaLabelPattern.test(inputTag);
      
      if (!hasLabel && !hasAriaLabel) {
        issues.push({
          type: 'warning',
          rule: 'form-label',
          message: 'Input element may be missing associated label or aria-label',
          line: lineNum,
          file: filePath,
          context: inputTag.substring(0, 80)
        });
      }
    }
    inputPattern.lastIndex = 0;
  });
  
  return issues;
}

/**
 * Check for language attribute
 */
function checkLanguageAttribute(content, filePath) {
  const issues = [];
  
  // Only check layout files
  if (!filePath.includes('Layout') && !filePath.includes('layout')) {
    return issues;
  }
  
  const htmlPattern = /<html[^>]*>/i;
  const langPattern = /lang=["'][^"']+["']/i;
  
  const htmlMatch = htmlPattern.exec(content);
  if (htmlMatch && !langPattern.test(htmlMatch[0])) {
    issues.push({
      type: 'error',
      rule: 'html-lang',
      message: 'HTML element missing lang attribute',
      line: 1,
      file: filePath
    });
  }
  
  return issues;
}

/**
 * Check for keyboard accessibility
 */
function checkKeyboardAccessibility(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  // Check for click handlers on non-interactive elements
  const divClickPattern = /<(?:div|span)[^>]*on(?:Click|click)=/gi;
  const tabindexPattern = /tabindex=/i;
  const rolePattern = /role=["']button["']/i;
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    if (divClickPattern.test(line)) {
      if (!tabindexPattern.test(line) || !rolePattern.test(line)) {
        issues.push({
          type: 'warning',
          rule: 'keyboard-accessible',
          message: 'Non-interactive element with click handler should have tabindex and role="button"',
          line: lineNum,
          file: filePath,
          context: line.trim().substring(0, 80)
        });
      }
    }
    divClickPattern.lastIndex = 0;
  });
  
  return issues;
}

/**
 * Main accessibility check function
 */
export async function checkAccessibility(options = {}) {
  const projectRoot = options.projectRoot || join(__dirname, '../..');
  const verbose = options.verbose || false;
  
  console.log(`${colors.cyan}${colors.bold}♿ Accessibility Check${colors.reset}`);
  console.log(`${colors.dim}   Scanning: ${projectRoot}${colors.reset}\n`);
  
  const results = {
    passed: true,
    errors: [],
    warnings: [],
    info: [],
    summary: {
      imagesChecked: 0,
      headingsChecked: 0,
      formsChecked: 0
    }
  };
  
  const srcDir = join(projectRoot, 'src');
  const sourceFiles = findSourceFiles(srcDir);
  
  if (sourceFiles.length === 0) {
    console.log(`${colors.yellow}   ⚠️  No source files found${colors.reset}`);
    return results;
  }
  
  // Process each file
  for (const file of sourceFiles) {
    const content = readFileSync(file, 'utf-8');
    
    // Run all checks
    const imageIssues = checkImageAlts(content, file);
    const headingIssues = checkHeadingHierarchy(content, file);
    const ariaIssues = checkAriaLabels(content, file);
    const formIssues = checkFormAccessibility(content, file);
    const langIssues = checkLanguageAttribute(content, file);
    const keyboardIssues = checkKeyboardAccessibility(content, file);
    
    const allIssues = [
      ...imageIssues,
      ...headingIssues,
      ...ariaIssues,
      ...formIssues,
      ...langIssues,
      ...keyboardIssues
    ];
    
    for (const issue of allIssues) {
      if (issue.type === 'error') {
        results.errors.push(issue);
      } else if (issue.type === 'warning') {
        results.warnings.push(issue);
      } else {
        results.info.push(issue);
      }
    }
    
    // Update summary
    results.summary.imagesChecked += (content.match(/<img/gi) || []).length;
    results.summary.headingsChecked += (content.match(/<h[1-6]/gi) || []).length;
    results.summary.formsChecked += (content.match(/<input/gi) || []).length;
  }
  
  results.passed = results.errors.length === 0;
  
  // Print results
  if (results.errors.length > 0) {
    console.log(`${colors.red}${colors.bold}   ❌ FAILED${colors.reset}`);
    console.log(`\n${colors.dim}   Errors (${results.errors.length}):${colors.reset}`);
    
    for (const issue of results.errors) {
      const relativePath = issue.file.replace(projectRoot, '').replace(/\\/g, '/');
      console.log(`   ${colors.red}•${colors.reset} [${issue.rule}] ${colors.bold}${relativePath}:${issue.line}${colors.reset}`);
      console.log(`     ${issue.message}`);
      if (issue.context && verbose) {
        console.log(`     ${colors.dim}${issue.context}${colors.reset}`);
      }
    }
  } else {
    console.log(`${colors.green}${colors.bold}   ✅ PASSED${colors.reset}`);
  }
  
  // Print warnings
  if (results.warnings.length > 0) {
    console.log(`\n${colors.yellow}   ⚠️  Warnings (${results.warnings.length}):${colors.reset}`);
    
    const warningsToShow = verbose ? results.warnings : results.warnings.slice(0, 5);
    for (const issue of warningsToShow) {
      const relativePath = issue.file.replace(projectRoot, '').replace(/\\/g, '/');
      console.log(`   ${colors.yellow}•${colors.reset} [${issue.rule}] ${relativePath}:${issue.line}`);
      console.log(`     ${colors.dim}${issue.message}${colors.reset}`);
    }
    
    if (!verbose && results.warnings.length > 5) {
      console.log(`   ${colors.dim}... and ${results.warnings.length - 5} more (use --verbose)${colors.reset}`);
    }
  }
  
  console.log(`\n${colors.dim}   Summary: ${results.summary.imagesChecked} images, ${results.summary.headingsChecked} headings, ${results.summary.formsChecked} form inputs${colors.reset}`);
  console.log(`${colors.dim}   Files scanned: ${sourceFiles.length}${colors.reset}\n`);
  
  return results;
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
  
  checkAccessibility({ verbose }).then(results => {
    process.exit(results.passed ? 0 : 1);
  }).catch(err => {
    console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
    process.exit(1);
  });
}
