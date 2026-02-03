/**
 * URL validation utilities for BRITZMEDI Lead Form
 */

export interface UrlValidationResult {
  valid: boolean;
  message?: string;
  normalizedUrl?: string;
}

/**
 * Validates URL format for company website field
 * - Accepts: domain.com, www.domain.com, https://domain.com
 * - Auto-prepends https:// for normalization
 * - Blocks localhost and IP addresses
 */
export function validateUrl(url: string): UrlValidationResult {
  if (!url || !url.trim()) {
    return { valid: false, message: 'Company website is required.' };
  }

  let normalizedUrl = url.trim();

  // Remove leading/trailing slashes
  normalizedUrl = normalizedUrl.replace(/^\/+|\/+$/g, '');

  // Auto-prepend https:// if missing protocol
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  try {
    const urlObj = new URL(normalizedUrl);

    // Must be http or https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, message: 'Please enter a valid website URL.' };
    }

    // Must have a valid domain (at least x.y, e.g., example.com)
    // Handle www. prefix and multi-level TLDs like .co.kr
    const hostname = urlObj.hostname.toLowerCase();
    const hostParts = hostname.split('.');

    // Minimum 2 parts (domain.tld) or 3+ for www.domain.tld or domain.co.kr
    if (hostParts.length < 2 || hostParts.some(p => p.length === 0)) {
      return { valid: false, message: 'Please enter a valid website URL.' };
    }

    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return { valid: false, message: 'Please enter a valid business website URL.' };
    }

    // Block IP addresses
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return { valid: false, message: 'Please enter a valid business website URL.' };
    }

    return { valid: true, normalizedUrl };
  } catch {
    return { valid: false, message: 'Please enter a valid website URL.' };
  }
}
