#!/usr/bin/env node

/**
 * Publisher Agent - Main Orchestrator
 * 
 * Runs all quality checks in sequence and generates a summary report.
 * Exit codes:
 *   0 - All checks passed
 *   1 - Critical issues found
 *   2 - Warnings only (with --fail-on-warning)
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { checkLinks } from './check-links.js';
import { validateMenu } from './validate-menu.js';
import { checkAccessibility } from './check-accessibility.js';
import { analyzePerformance } from './analyze-performance.js';

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
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

/**
 * Print header banner
 */
function printHeader() {
  console.log();
  console.log(`${colors.cyan}${colors.bold}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}║${colors.reset}           ${colors.magenta}${colors.bold}🔍 Publisher Agent Report${colors.reset}                       ${colors.cyan}${colors.bold}║${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}║${colors.reset}           ${colors.dim}BRITZMEDI Global - Quality Monitor${colors.reset}             ${colors.cyan}${colors.bold}║${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log();
}

/**
 * Print summary section
 */
function printSummary(results) {
  const { links, menu, accessibility, performance } = results;
  
  console.log(`${colors.cyan}${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}                         SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log();
  
  const getStatus = (passed, hasWarnings = false) => {
    if (passed && !hasWarnings) return `${colors.green}✅ PASSED${colors.reset}`;
    if (passed && hasWarnings) return `${colors.yellow}⚠️  WARNING${colors.reset}`;
    return `${colors.red}❌ FAILED${colors.reset}`;
  };
  
  // Print check results
  console.log(`   ${colors.bold}Link Validation:${colors.reset}      ${getStatus(links.passed)}`);
  if (!links.passed) {
    console.log(`   ${colors.dim}   └─ ${links.brokenLinks.length} broken link(s) found${colors.reset}`);
  } else {
    console.log(`   ${colors.dim}   └─ ${links.validLinks} links checked${colors.reset}`);
  }
  
  console.log(`   ${colors.bold}Menu Validation:${colors.reset}      ${getStatus(menu.passed)}`);
  if (!menu.passed) {
    const issueCount = menu.issues.length + menu.duplicates.length;
    console.log(`   ${colors.dim}   └─ ${issueCount} issue(s) found${colors.reset}`);
  } else {
    console.log(`   ${colors.dim}   └─ ${menu.totalMenuItems} menu items checked${colors.reset}`);
  }
  
  const a11yHasWarnings = accessibility.warnings.length > 0;
  console.log(`   ${colors.bold}Accessibility:${colors.reset}        ${getStatus(accessibility.passed, a11yHasWarnings)}`);
  if (!accessibility.passed) {
    console.log(`   ${colors.dim}   └─ ${accessibility.errors.length} error(s), ${accessibility.warnings.length} warning(s)${colors.reset}`);
  } else if (a11yHasWarnings) {
    console.log(`   ${colors.dim}   └─ ${accessibility.warnings.length} warning(s)${colors.reset}`);
  } else {
    console.log(`   ${colors.dim}   └─ ${accessibility.summary.imagesChecked} images, ${accessibility.summary.headingsChecked} headings checked${colors.reset}`);
  }
  
  const perfHasWarnings = performance.warnings.length > 0;
  console.log(`   ${colors.bold}Performance:${colors.reset}          ${getStatus(performance.passed, perfHasWarnings)}`);
  if (!performance.passed) {
    console.log(`   ${colors.dim}   └─ ${performance.errors.length} critical issue(s)${colors.reset}`);
  } else if (perfHasWarnings) {
    console.log(`   ${colors.dim}   └─ ${performance.warnings.length} warning(s)${colors.reset}`);
  }
  
  console.log();
  
  // Overall status
  const criticalCount = 
    (links.passed ? 0 : links.brokenLinks.length) +
    (menu.passed ? 0 : menu.issues.length + menu.duplicates.length) +
    accessibility.errors.length +
    performance.errors.length;
  
  const warningCount = 
    accessibility.warnings.length +
    performance.warnings.length +
    menu.darkModeIssues.length;
  
  console.log(`${colors.cyan}${colors.bold}───────────────────────────────────────────────────────────────${colors.reset}`);
  
  if (criticalCount > 0) {
    console.log(`   ${colors.red}${colors.bold}Overall: ${criticalCount} CRITICAL${colors.reset}${warningCount > 0 ? `, ${warningCount} WARNING` : ''}`);
    console.log(`   ${colors.dim}Fix critical issues before deployment${colors.reset}`);
  } else if (warningCount > 0) {
    console.log(`   ${colors.yellow}${colors.bold}Overall: ${warningCount} WARNING${colors.reset}`);
    console.log(`   ${colors.dim}Consider addressing warnings for better quality${colors.reset}`);
  } else {
    console.log(`   ${colors.green}${colors.bold}Overall: ALL CHECKS PASSED ✨${colors.reset}`);
    console.log(`   ${colors.dim}Site is ready for deployment${colors.reset}`);
  }
  
  console.log(`${colors.cyan}${colors.bold}───────────────────────────────────────────────────────────────${colors.reset}`);
  console.log();
  
  return { criticalCount, warningCount };
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    verbose: args.includes('--verbose') || args.includes('-v'),
    failOnWarning: args.includes('--fail-on-warning') || args.includes('-w'),
    help: args.includes('--help') || args.includes('-h'),
    linksOnly: args.includes('--links'),
    menuOnly: args.includes('--menu'),
    a11yOnly: args.includes('--a11y'),
    perfOnly: args.includes('--perf')
  };
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
${colors.bold}Publisher Agent - BRITZMEDI Global Quality Monitor${colors.reset}

${colors.bold}Usage:${colors.reset}
  node scripts/publisher-agent/index.js [options]

${colors.bold}Options:${colors.reset}
  -v, --verbose         Show detailed output
  -w, --fail-on-warning Exit with error code on warnings
  -h, --help            Show this help message

${colors.bold}Individual Checks:${colors.reset}
  --links               Run only link validation
  --menu                Run only menu validation
  --a11y                Run only accessibility checks
  --perf                Run only performance analysis

${colors.bold}npm Scripts:${colors.reset}
  npm run publisher:check   Run all checks
  npm run publisher:links   Link validation only
  npm run publisher:menu    Menu validation only
  npm run publisher:a11y    Accessibility checks only
  npm run publisher:perf    Performance analysis only

${colors.bold}Examples:${colors.reset}
  npm run publisher:check
  npm run publisher:check -- --verbose
  npm run publisher:check -- --fail-on-warning
`);
}

/**
 * Main orchestrator function
 */
async function main() {
  const args = parseArgs();
  
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  
  const projectRoot = join(__dirname, '../..');
  const options = { projectRoot, verbose: args.verbose };
  
  const runAll = !args.linksOnly && !args.menuOnly && !args.a11yOnly && !args.perfOnly;
  
  printHeader();
  
  const results = {
    links: { passed: true, brokenLinks: [], validLinks: 0 },
    menu: { passed: true, issues: [], duplicates: [], darkModeIssues: [], totalMenuItems: 0 },
    accessibility: { passed: true, errors: [], warnings: [], summary: { imagesChecked: 0, headingsChecked: 0 } },
    performance: { passed: true, errors: [], warnings: [] }
  };
  
  try {
    if (runAll || args.linksOnly) {
      results.links = await checkLinks(options);
    }
    
    if (runAll || args.menuOnly) {
      results.menu = await validateMenu(options);
    }
    
    if (runAll || args.a11yOnly) {
      results.accessibility = await checkAccessibility(options);
    }
    
    if (runAll || args.perfOnly) {
      results.performance = await analyzePerformance(options);
    }
    
    if (runAll) {
      const { criticalCount, warningCount } = printSummary(results);
      
      if (criticalCount > 0) {
        process.exit(1);
      } else if (args.failOnWarning && warningCount > 0) {
        process.exit(2);
      } else {
        process.exit(0);
      }
    } else {
      const checkResult = args.linksOnly ? results.links :
                         args.menuOnly ? results.menu :
                         args.a11yOnly ? results.accessibility :
                         results.performance;
      
      process.exit(checkResult.passed ? 0 : 1);
    }
    
  } catch (error) {
    console.error(`${colors.red}${colors.bold}Error running publisher agent:${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}`);
    if (args.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
