/**
 * Email validation utilities for BRITZMEDI contact form
 * Extracted for testability and reusability
 */

// Disposable email domains list (common ones)
export const disposableEmailDomains = [
  'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'mailinator.com',
  'throwaway.email', '10minutemail.com', 'trashmail.com', 'fakeinbox.com',
  'yopmail.com', 'maildrop.cc', 'dispostable.com', 'getnada.com',
  'mohmal.com', 'tempail.com', 'tempmailaddress.com', 'burnermail.io',
  'sharklasers.com', 'guerrillamailblock.com', 'tempinbox.com'
];

// Common typo patterns for popular domains
export const typoPatterns: Record<string, string[]> = {
  'gmail.com': ['gmai.com', 'gmial.com', 'gamil.com', 'gmal.com', 'gmail.co', 'gmail.cm'],
  'yahoo.com': ['yaho.com', 'yahooo.com', 'yahoo.co', 'yahoo.cm'],
  'hotmail.com': ['hotmai.com', 'hotmal.com', 'hotmail.co', 'hotmail.cm'],
  'outlook.com': ['outlok.com', 'outloo.com', 'outlook.co', 'outlook.cm'],
};

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validates email address using client-side rules
 * - Basic format validation
 * - Disposable email domain blocking
 * - Common typo detection with suggestions
 */
export function validateEmail(email: string): ValidationResult {
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }
  
  // Check for disposable email domains
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableEmailDomains.includes(domain)) {
    return { 
      valid: false, 
      message: 'Please use a business or personal email address. Temporary emails are not accepted.' 
    };
  }
  
  // Check for common typos in popular domains
  for (const [correct, typos] of Object.entries(typoPatterns)) {
    if (typos.includes(domain)) {
      return { 
        valid: false, 
        message: `Did you mean ${email.split('@')[0]}@${correct}?` 
      };
    }
  }
  
  return { valid: true };
}

/**
 * Verifies email using Emailable API with graceful fallback
 * Rate limit: 10 requests/day/IP on free plan
 */
export async function verifyEmailWithEmailable(
  email: string, 
  apiKey: string
): Promise<ValidationResult> {
  try {
    const response = await fetch(
      `https://api.emailable.com/v1/verify?email=${encodeURIComponent(email)}&api_key=${apiKey}`
    );
    
    // Rate limited - fall back to client-side validation
    if (response.status === 429) {
      console.log('Emailable rate limit reached, using client-side validation');
      return validateEmail(email);
    }
    
    // Other errors - fall back to client-side validation
    if (!response.ok) {
      console.warn('Emailable API error, using client-side validation');
      return validateEmail(email);
    }
    
    const data = await response.json();
    
    // Check Emailable response states
    if (data.state === 'deliverable') {
      return { valid: true };
    }
    
    if (data.state === 'undeliverable') {
      return { 
        valid: false, 
        message: 'This email address appears to be invalid. Please check and try again.' 
      };
    }
    
    if (data.state === 'risky') {
      // Accept risky emails but they passed basic validation
      return { valid: true };
    }
    
    // For 'unknown' or 'catch-all', accept if client-side validation passes
    return validateEmail(email);
    
  } catch (error) {
    console.warn('Emailable verification failed, using client-side validation:', error);
    return validateEmail(email);
  }
}
