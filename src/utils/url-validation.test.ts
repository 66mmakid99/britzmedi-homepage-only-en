import { describe, it, expect } from 'vitest';
import { validateUrl } from './url-validation';

describe('validateUrl', () => {
  describe('valid URLs', () => {
    it('should accept domain only (britzmedi.co.kr)', () => {
      const result = validateUrl('britzmedi.co.kr');
      expect(result.valid).toBe(true);
      expect(result.normalizedUrl).toBe('https://britzmedi.co.kr');
    });

    it('should accept www prefix (www.britzmedi.co.kr)', () => {
      const result = validateUrl('www.britzmedi.co.kr');
      expect(result.valid).toBe(true);
      expect(result.normalizedUrl).toBe('https://www.britzmedi.co.kr');
    });

    it('should accept https URL', () => {
      const result = validateUrl('https://britzmedi.co.kr');
      expect(result.valid).toBe(true);
      expect(result.normalizedUrl).toBe('https://britzmedi.co.kr');
    });

    it('should accept https with www', () => {
      const result = validateUrl('https://www.britzmedi.co.kr');
      expect(result.valid).toBe(true);
      expect(result.normalizedUrl).toBe('https://www.britzmedi.co.kr');
    });

    it('should accept http URL', () => {
      const result = validateUrl('http://example.com');
      expect(result.valid).toBe(true);
      expect(result.normalizedUrl).toBe('http://example.com');
    });

    it('should accept simple domain (example.com)', () => {
      const result = validateUrl('example.com');
      expect(result.valid).toBe(true);
      expect(result.normalizedUrl).toBe('https://example.com');
    });

    it('should accept domain with path', () => {
      const result = validateUrl('example.com/page');
      expect(result.valid).toBe(true);
      expect(result.normalizedUrl).toBe('https://example.com/page');
    });
  });

  describe('invalid URLs', () => {
    it('should reject empty string', () => {
      const result = validateUrl('');
      expect(result.valid).toBe(false);
    });

    it('should reject localhost', () => {
      const result = validateUrl('localhost');
      expect(result.valid).toBe(false);
    });

    it('should reject IP addresses', () => {
      const result = validateUrl('192.168.1.1');
      expect(result.valid).toBe(false);
    });

    it('should reject single word without TLD', () => {
      const result = validateUrl('example');
      expect(result.valid).toBe(false);
    });
  });
});
