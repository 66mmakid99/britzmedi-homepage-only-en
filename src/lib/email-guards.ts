// Server-side email guards shared across public intake APIs
// (api/leads, api/resource-download, api/newsletter, ...).
// Single source of truth — the client-side copy in LeadForm.astro is UX-only;
// these checks are the enforcement layer.

// Re-export the comprehensive free/personal provider check so callers need
// only one import (supersedes the small ad-hoc list in resource-download.ts).
export { isFreeEmail, FREE_EMAIL_DOMAINS } from './email-validation';

// Disposable/temporary email domains — hard block for all public intake.
// Ported from the client-side blocklist in LeadForm.astro (+ known aliases).
export const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'mailinator.com',
  'throwaway.email', '10minutemail.com', 'trashmail.com', 'fakeinbox.com',
  'yopmail.com', 'maildrop.cc', 'dispostable.com', 'getnada.com',
  'mohmal.com', 'tempail.com', 'tempmailaddress.com', 'burnermail.io',
  'sharklasers.com', 'guerrillamailblock.com', 'tempinbox.com',
];

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return !!domain && DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

// Escape user-supplied values before interpolating into HTML email bodies.
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
