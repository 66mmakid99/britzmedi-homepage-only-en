#!/usr/bin/env node

/**
 * analyze-performance.js - Performance Analysis
 * 
 * Analyzes frontend performance:
 * - Measure bundle sizes
 * - Identify large dependencies
 * - Check for unused code patterns
 * - Suggest image optimization opportunities
 * - Report performance metrics
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
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

// Size thresholds (in bytes)
const THRESHOLDS = {
  JS_WARNING: 100 * 1024,
  JS_CRITICAL: 500 * 1024,
  CSS_WARNING: 50 * 1024,
  CSS_CRITICAL: 200 * 1024,
  IMAGE_WARNING: 200 * 1024,
  IMAGE_CRITICAL: 1024 * 1024,
  TOTAL_WARNING: 2 * 1024 * 1024,
  TOTAL_CRITICAL: 5 * 1024 * 1024
};

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Recursively find all files
 */
function findFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      findFiles(fullPath, files);
    } else {
      files.push({
        path: fullPath,
        name: entry,
        size: stat.size,
        ext: extname(entry).toLowerCase()
      });
    }
  }
  return files;
}

/**
 * Analyze dist/build output
 */
function analyzeDistOutput(distDir) {
  const issues = [];
  const metrics = {
    totalSize: 0,
    js: { totalSize: 0, fileCount: 0, largeFiles: [] },
    css: { totalSize: 0, fileCount: 0, largeFiles: [] },
    html: { totalSize: 0, fileCount: 0 },
    images: { totalSize: 0, fileCount: 0, largeFiles: [], byFormat: {} },
    other: { totalSize: 0, fileCount: 0 }
  };
  
  if (!existsSync(distDir)) {
    return { issues, metrics, exists: false };
  }
  
  const files = findFiles(distDir);
  
  for (const file of files) {
    metrics.totalSize += file.size;
    
    if (file.ext === '.js' || file.ext === '.mjs') {
      metrics.js.totalSize += file.size;
      metrics.js.fileCount++;
      
      if (file.size > THRESHOLDS.JS_CRITICAL) {
        issues.push({
          type: 'error',
          message: `Large JavaScript bundle: ${formatBytes(file.size)}`,
          file: file.path,
          suggestion: 'Consider code splitting or lazy loading'
        });
        metrics.js.largeFiles.push(file);
      } else if (file.size > THRESHOLDS.JS_WARNING) {
        issues.push({
          type: 'warning',
          message: `JavaScript bundle approaching size limit: ${formatBytes(file.size)}`,
          file: file.path
        });
        metrics.js.largeFiles.push(file);
      }
    } else if (file.ext === '.css') {
      metrics.css.totalSize += file.size;
      metrics.css.fileCount++;
      
      if (file.size > THRESHOLDS.CSS_CRITICAL) {
        issues.push({
          type: 'error',
          message: `Large CSS bundle: ${formatBytes(file.size)}`,
          file: file.path,
          suggestion: 'Consider splitting CSS or removing unused styles'
        });
        metrics.css.largeFiles.push(file);
      } else if (file.size > THRESHOLDS.CSS_WARNING) {
        issues.push({
          type: 'warning',
          message: `CSS bundle approaching size limit: ${formatBytes(file.size)}`,
          file: file.path
        });
      }
    } else if (file.ext === '.html') {
      metrics.html.totalSize += file.size;
      metrics.html.fileCount++;
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.avif'].includes(file.ext)) {
      metrics.images.totalSize += file.size;
      metrics.images.fileCount++;
      
      const format = file.ext.substring(1).toUpperCase();
      metrics.images.byFormat[format] = (metrics.images.byFormat[format] || 0) + 1;
      
      if (file.size > THRESHOLDS.IMAGE_CRITICAL) {
        issues.push({
          type: 'error',
          message: `Very large image: ${formatBytes(file.size)}`,
          file: file.path,
          suggestion: 'Compress or use responsive images'
        });
        metrics.images.largeFiles.push(file);
      } else if (file.size > THRESHOLDS.IMAGE_WARNING) {
        issues.push({
          type: 'warning',
          message: `Large image: ${formatBytes(file.size)}`,
          file: file.path
        });
        metrics.images.largeFiles.push(file);
      }
      
      // Suggest WebP for non-WebP images
      if (['.jpg', '.jpeg', '.png'].includes(file.ext) && file.size > 50 * 1024) {
        issues.push({
          type: 'info',
          message: `Consider WebP format for ${file.name}`,
          file: file.path,
          suggestion: 'WebP typically provides ~30% better compression'
        });
      }
    } else {
      metrics.other.totalSize += file.size;
      metrics.other.fileCount++;
    }
  }
  
  // Check total size
  if (metrics.totalSize > THRESHOLDS.TOTAL_CRITICAL) {
    issues.push({
      type: 'error',
      message: `Total build size is very large: ${formatBytes(metrics.totalSize)}`,
      suggestion: 'Implement code splitting and optimize assets'
    });
  } else if (metrics.totalSize > THRESHOLDS.TOTAL_WARNING) {
    issues.push({
      type: 'warning',
      message: `Total build size is large: ${formatBytes(metrics.totalSize)}`,
      suggestion: 'Consider optimizing assets'
    });
  }
  
  return { issues, metrics, exists: true };
}

/**
 * Analyze source code for potential issues
 */
function analyzeSourceCode(srcDir) {
  const issues = [];
  
  if (!existsSync(srcDir)) {
    return issues;
  }
  
  function scanDir(dir) {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!entry.startsWith('.') && entry !== 'node_modules') {
          scanDir(fullPath);
        }
      } else {
        const ext = extname(entry).toLowerCase();
        if (['.astro', '.tsx', '.jsx', '.ts', '.js'].includes(ext)) {
          const content = readFileSync(fullPath, 'utf-8');
          
          // Check for console.log statements
          const consoleMatches = content.match(/console\.(log|debug|info)\(/g);
          if (consoleMatches && consoleMatches.length > 3) {
            issues.push({
              type: 'info',
              message: `Found ${consoleMatches.length} console statements`,
              file: fullPath,
              suggestion: 'Remove console statements for production'
            });
          }
          
          // Check for TODO/FIXME comments
          const todoMatches = content.match(/\/\/\s*(TODO|FIXME|HACK|XXX)/gi);
          if (todoMatches && todoMatches.length > 0) {
            issues.push({
              type: 'info',
              message: `Found ${todoMatches.length} TODO/FIXME comments`,
              file: fullPath
            });
          }
          
          // Check for large inline styles
          const inlineStyleMatches = content.match(/style=["'][^"']{100,}["']/g);
          if (inlineStyleMatches && inlineStyleMatches.length > 0) {
            issues.push({
              type: 'info',
              message: `Found ${inlineStyleMatches.length} large inline style(s)`,
              file: fullPath,
              suggestion: 'Consider moving to CSS classes'
            });
          }
        }
      }
    }
  }
  
  scanDir(srcDir);
  return issues;
}

/**
 * Analyze public assets
 */
function analyzePublicAssets(publicDir) {
  const issues = [];
  const metrics = {
    totalSize: 0,
    images: { totalSize: 0, fileCount: 0, largeFiles: [] }
  };
  
  if (!existsSync(publicDir)) {
    return { issues, metrics };
  }
  
  const files = findFiles(publicDir);
  
  for (const file of files) {
    metrics.totalSize += file.size;
    
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.avif'].includes(file.ext)) {
      metrics.images.totalSize += file.size;
      metrics.images.fileCount++;
      
      if (file.size > THRESHOLDS.IMAGE_CRITICAL) {
        issues.push({
          type: 'warning',
          message: `Large public asset: ${formatBytes(file.size)}`,
          file: file.path,
          suggestion: 'Consider optimizing before build'
        });
        metrics.images.largeFiles.push(file);
      }
    }
  }
  
  return { issues, metrics };
}

/**
 * Main performance analysis function
 */
export async function analyzePerformance(options = {}) {
  const projectRoot = options.projectRoot || join(__dirname, '../..');
  const verbose = options.verbose || false;
  
  console.log(`${colors.cyan}${colors.bold}⚡ Performance Analysis${colors.reset}`);
  console.log(`${colors.dim}   Scanning: ${projectRoot}${colors.reset}\n`);
  
  const results = {
    passed: true,
    errors: [],
    warnings: [],
    info: [],
    metrics: null
  };
  
  const distDir = join(projectRoot, 'dist');
  const srcDir = join(projectRoot, 'src');
  const publicDir = join(projectRoot, 'public');
  
  // Analyze dist output
  const distAnalysis = analyzeDistOutput(distDir);
  
  if (!distAnalysis.exists) {
    console.log(`${colors.yellow}   ⚠️  No dist/ directory found. Run 'npm run build' first.${colors.reset}`);
    console.log(`${colors.dim}   Analyzing source and public directories instead...${colors.reset}\n`);
  }
  
  results.metrics = distAnalysis.metrics;
  
  // Analyze source code
  const sourceIssues = analyzeSourceCode(srcDir);
  
  // Analyze public assets
  const publicAnalysis = analyzePublicAssets(publicDir);
  
  // Collect all issues
  const allIssues = [
    ...distAnalysis.issues,
    ...sourceIssues,
    ...publicAnalysis.issues
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
  
  results.passed = results.errors.length === 0;
  
  // Print results
  if (results.errors.length > 0) {
    console.log(`${colors.red}${colors.bold}   ❌ CRITICAL ISSUES${colors.reset}`);
    for (const issue of results.errors) {
      const relativePath = issue.file ? issue.file.replace(projectRoot, '').replace(/\\/g, '/') : '';
      console.log(`   ${colors.red}•${colors.reset} ${issue.message}`);
      if (relativePath) {
        console.log(`     ${colors.dim}File: ${relativePath}${colors.reset}`);
      }
      if (issue.suggestion) {
        console.log(`     ${colors.dim}Suggestion: ${issue.suggestion}${colors.reset}`);
      }
    }
    console.log();
  } else if (results.warnings.length > 0) {
    console.log(`${colors.yellow}${colors.bold}   ⚠️  WARNINGS${colors.reset}`);
  } else {
    console.log(`${colors.green}${colors.bold}   ✅ PASSED${colors.reset}`);
  }
  
  // Print warnings
  if (results.warnings.length > 0) {
    const warningsToShow = verbose ? results.warnings : results.warnings.slice(0, 5);
    for (const issue of warningsToShow) {
      const relativePath = issue.file ? issue.file.replace(projectRoot, '').replace(/\\/g, '/') : '';
      console.log(`   ${colors.yellow}•${colors.reset} ${issue.message}`);
      if (relativePath) {
        console.log(`     ${colors.dim}File: ${relativePath}${colors.reset}`);
      }
    }
    if (!verbose && results.warnings.length > 5) {
      console.log(`   ${colors.dim}... and ${results.warnings.length - 5} more warnings${colors.reset}`);
    }
    console.log();
  }
  
  // Print metrics if dist exists
  if (distAnalysis.exists && results.metrics) {
    const m = results.metrics;
    console.log(`${colors.bold}   📊 Build Metrics${colors.reset}`);
    console.log(`   ${colors.dim}─────────────────────────────────────${colors.reset}`);
    console.log(`   Total Size:     ${colors.bold}${formatBytes(m.totalSize)}${colors.reset}`);
    console.log(`   ${colors.dim}─────────────────────────────────────${colors.reset}`);
    console.log(`   JavaScript:     ${formatBytes(m.js.totalSize)} (${m.js.fileCount} files)`);
    console.log(`   CSS:            ${formatBytes(m.css.totalSize)} (${m.css.fileCount} files)`);
    console.log(`   HTML:           ${formatBytes(m.html.totalSize)} (${m.html.fileCount} files)`);
    console.log(`   Images:         ${formatBytes(m.images.totalSize)} (${m.images.fileCount} files)`);
    
    if (Object.keys(m.images.byFormat).length > 0) {
      console.log(`   ${colors.dim}─────────────────────────────────────${colors.reset}`);
      console.log(`   ${colors.dim}Image formats:${colors.reset}`);
      for (const [format, count] of Object.entries(m.images.byFormat)) {
        console.log(`     ${format}: ${count} files`);
      }
    }
  }
  
  console.log();
  
  return results;
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
  
  analyzePerformance({ verbose }).then(results => {
    process.exit(results.passed ? 0 : 1);
  }).catch(err => {
    console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
    process.exit(1);
  });
}
