import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  validateEmail, 
  verifyEmailWithEmailable, 
  disposableEmailDomains, 
  typoPatterns 
} from './email-validation';

describe('validateEmail', () => {
  describe('basic format validation', () => {
    it('should reject empty string', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('valid email');
    });

    it('should reject email without @', () => {
      const result = validateEmail('test.example.com');
      expect(result.valid).toBe(false);
    });

    it('should reject email without domain', () => {
      const result = validateEmail('test@');
      expect(result.valid).toBe(false);
    });

    it('should reject email without local part', () => {
      const result = validateEmail('@example.com');
      expect(result.valid).toBe(false);
    });

    it('should reject email with spaces', () => {
      const result = validateEmail('test @example.com');
      expect(result.valid).toBe(false);
    });

    it('should accept valid email format', () => {
      const result = validateEmail('user@example.com');
      expect(result.valid).toBe(true);
    });

    it('should accept email with subdomain', () => {
      const result = validateEmail('user@mail.example.com');
      expect(result.valid).toBe(true);
    });

    it('should accept email with plus sign', () => {
      const result = validateEmail('user+tag@example.com');
      expect(result.valid).toBe(true);
    });

    it('should accept email with dots in local part', () => {
      const result = validateEmail('first.last@example.com');
      expect(result.valid).toBe(true);
    });
  });

  describe('disposable email blocking', () => {
    it('should reject common disposable email domains', () => {
      const testDomains = ['tempmail.com', 'mailinator.com', 'yopmail.com'];
      
      testDomains.forEach(domain => {
        const result = validateEmail(`test@${domain}`);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('Temporary emails are not accepted');
      });
    });

    it('should accept non-disposable domains', () => {
      const result = validateEmail('test@britzmedi.com');
      expect(result.valid).toBe(true);
    });

    it('should be case-insensitive for domain check', () => {
      const result = validateEmail('test@TEMPMAIL.COM');
      // Domain is lowercased before check
      expect(result.valid).toBe(false);
    });
  });

  describe('typo detection', () => {
    it('should suggest gmail.com for common typos', () => {
      const typos = ['gmai.com', 'gmial.com', 'gamil.com'];
      
      typos.forEach(typo => {
        const result = validateEmail(`user@${typo}`);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('user@gmail.com');
      });
    });

    it('should suggest yahoo.com for common typos', () => {
      const result = validateEmail('user@yaho.com');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('user@yahoo.com');
    });

    it('should suggest hotmail.com for common typos', () => {
      const result = validateEmail('user@hotmai.com');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('user@hotmail.com');
    });

    it('should suggest outlook.com for common typos', () => {
      const result = validateEmail('user@outlok.com');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('user@outlook.com');
    });

    it('should accept correct popular domains', () => {
      const validDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
      
      validDomains.forEach(domain => {
        const result = validateEmail(`user@${domain}`);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('business email validation', () => {
    it('should accept corporate email domains', () => {
      const corporateEmails = [
        'john@britzmedi.com',
        'contact@company.co.kr',
        'sales@medical-devices.eu',
        'info@hospital.org',
      ];

      corporateEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
      });
    });
  });
});

describe('verifyEmailWithEmailable', () => {
  const mockApiKey = 'test_api_key';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return valid for deliverable emails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ state: 'deliverable' }),
    } as Response);

    const result = await verifyEmailWithEmailable('valid@example.com', mockApiKey);
    expect(result.valid).toBe(true);
  });

  it('should return invalid for undeliverable emails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ state: 'undeliverable' }),
    } as Response);

    const result = await verifyEmailWithEmailable('invalid@example.com', mockApiKey);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('invalid');
  });

  it('should accept risky emails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ state: 'risky' }),
    } as Response);

    const result = await verifyEmailWithEmailable('risky@example.com', mockApiKey);
    expect(result.valid).toBe(true);
  });

  it('should fall back to client-side validation on rate limit (429)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as Response);

    // Valid email should pass client-side validation
    const result = await verifyEmailWithEmailable('user@gmail.com', mockApiKey);
    expect(result.valid).toBe(true);

    // Disposable email should fail client-side validation
    const result2 = await verifyEmailWithEmailable('user@tempmail.com', mockApiKey);
    expect(result2.valid).toBe(false);
  });

  it('should fall back to client-side validation on API error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const result = await verifyEmailWithEmailable('user@gmail.com', mockApiKey);
    expect(result.valid).toBe(true);
  });

  it('should fall back to client-side validation on network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const result = await verifyEmailWithEmailable('user@gmail.com', mockApiKey);
    expect(result.valid).toBe(true);
  });

  it('should use client-side validation for unknown state', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ state: 'unknown' }),
    } as Response);

    // Valid email passes client-side
    const result = await verifyEmailWithEmailable('user@company.com', mockApiKey);
    expect(result.valid).toBe(true);
  });

  it('should include email in API request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ state: 'deliverable' }),
    } as Response);

    await verifyEmailWithEmailable('test@example.com', mockApiKey);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('email=test%40example.com')
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`api_key=${mockApiKey}`)
    );
  });
});

describe('data integrity', () => {
  it('should have disposable domains list populated', () => {
    expect(disposableEmailDomains.length).toBeGreaterThan(10);
  });

  it('should have typo patterns for major providers', () => {
    expect(typoPatterns).toHaveProperty('gmail.com');
    expect(typoPatterns).toHaveProperty('yahoo.com');
    expect(typoPatterns).toHaveProperty('hotmail.com');
    expect(typoPatterns).toHaveProperty('outlook.com');
  });

  it('should have typo arrays populated', () => {
    Object.values(typoPatterns).forEach(typos => {
      expect(typos.length).toBeGreaterThan(0);
    });
  });
});
