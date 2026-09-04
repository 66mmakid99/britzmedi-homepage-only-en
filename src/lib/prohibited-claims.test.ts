import { describe, it, expect } from 'vitest';
import { stripProhibitedClaims } from './prohibited-claims';

describe('stripProhibitedClaims', () => {
  it('leaves a clean answer untouched', () => {
    const text = 'TORR RF is FDA 510(k) cleared under K212561 and MFDS approved in Korea.';
    const result = stripProhibitedClaims(text);
    expect(result.text).toBe(text);
    expect(result.removed).toEqual([]);
  });

  it('removes the real 2026-05-20 CE-MDR sentence (chat_messages mid=56)', () => {
    const text =
      'We offer full-cycle manufacturing from initial design through mass production. ' +
      "For a European partnership, we're currently preparing for CE-MDR certification, which would be essential for your market. " +
      'The best next step would be to submit a detailed inquiry at /contact.';
    const result = stripProhibitedClaims(text);
    expect(result.removed).toHaveLength(1);
    expect(result.text).not.toMatch(/CE-MDR/);
    expect(result.text).toContain('full-cycle manufacturing');
    expect(result.text).toContain('/contact');
  });

  it('removes the "all CE requirements" sentence (chat_messages mid=58)', () => {
    const text =
      "Since you're targeting Europe, we'd work together on ensuring the device meets all CE requirements during our development process. " +
      'Our NEWCHAE SHOT is a good example of our capabilities in home-use devices, combining RF, EMS and electroporation.';
    const result = stripProhibitedClaims(text);
    expect(result.removed).toHaveLength(1);
    expect(result.text).not.toMatch(/CE requirements/);
    expect(result.text).toContain('NEWCHAE SHOT');
  });

  it('catches CE mark, CE marking and CE certified variants', () => {
    for (const claim of [
      'The device carries a CE mark.',
      'We are pursuing CE marking for the EU.',
      'It is CE certified for Europe.',
      'We hold CE approval.',
      'This meets CE conformity rules.',
    ]) {
      const result = stripProhibitedClaims(`Intro sentence that is long enough to survive on its own here. ${claim}`);
      expect(result.removed, claim).toHaveLength(1);
    }
  });

  it('does NOT touch French text containing the word "ce"', () => {
    // A Mauritius visitor and a France visitor both used the widget in French.
    // A case-insensitive /ce mark/i would destroy "ce marché".
    const text =
      'Nous ne vendons pas encore sur ce marché, mais ce certificat FDA 510(k) couvre le TORR RF. ' +
      'Contactez-nous via /contact pour un devis personnalisé.';
    const result = stripProhibitedClaims(text);
    expect(result.removed).toEqual([]);
    expect(result.text).toBe(text);
  });

  it('does not match ordinary words containing "ce"', () => {
    const text =
      'This device is certified by the MFDS and the acceptance criteria are certain. ' +
      'Excellence in manufacturing is central to our process, and cellulite is a cleared indication.';
    const result = stripProhibitedClaims(text);
    expect(result.removed).toEqual([]);
  });

  it('falls back to a safe redirect when stripping removes everything', () => {
    const result = stripProhibitedClaims('We are preparing for CE-MDR certification.');
    expect(result.removed).toHaveLength(1);
    expect(result.text).toContain('/contact');
    expect(result.text).not.toMatch(/CE-MDR/);
  });

  it('handles empty input without throwing', () => {
    expect(stripProhibitedClaims('')).toEqual({ text: '', removed: [] });
  });
});
