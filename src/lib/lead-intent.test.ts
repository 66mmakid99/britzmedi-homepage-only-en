import { describe, it, expect } from 'vitest';
import { hasLeadIntent } from './lead-intent';

// The "should fire" cases are real visitor messages from chat_messages in the
// britzmedi-leads D1 database, plus the chatbot's own suggestion chips.

describe('hasLeadIntent', () => {
  it('fires on the distributor questions visitors actually asked', () => {
    for (const msg of [
      'How can I become a distributor?',                      // conv #5, #6, #7, #14, #19
      'i want know how can I get a distributor license?',      // conv #11
      'do you have any distributor in India?',                 // conv #4
      'Do they have distribution in Colombia?',                // conv #19
      "I'm from Ecuador and I want to bring some machines here", // conv #20 — the lead we lost
      'Hi i want partnership for long term oem/odm in europe please help', // conv #10
      '총판 어떻게 하면 할 수 있나요?',
    ]) {
      expect(hasLeadIntent(msg), msg).toBe(true);
    }
  });

  it('fires on plural partner forms (regression: partner(ship)? missed these)', () => {
    for (const msg of [
      'What support do you offer partners?',
      'We are looking for partnerships in Europe',
      'Which partners do you work with?',
      'distributors in India',
    ]) {
      expect(hasLeadIntent(msg), msg).toBe(true);
    }
  });

  it('fires on commercial and logistics questions', () => {
    for (const msg of [
      'cost of the system ?',                    // conv #4
      'Price',                                   // conv #12
      'What are the minimum order quantities?',
      'Do you ship internationally?',
      'Can I request a demo unit?',
      'WhatsApp number ?',                       // conv #13
      'How can I contact your sales team?',      // conv #20
    ]) {
      expect(hasLeadIntent(msg), msg).toBe(true);
    }
  });

  it('fires on Spanish and French buying language', () => {
    expect(hasLeadIntent('Quiero ser distribuidor en Colombia')).toBe(true);
    expect(hasLeadIntent('Bonjour avez vous une liste de machines le prix ?')).toBe(true);
  });

  it('does NOT fire on pure product or technical questions', () => {
    for (const msg of [
      'What are TORR RF specifications?',
      'What treatments can TORR RF perform?',
      'Is TORR RF FDA cleared?',
      'How does dual-frequency ultrasound work?',
      'Hair removal machine',
      'Do u have Xert',
      'hi',
      'Hello',
    ]) {
      expect(hasLeadIntent(msg), msg).toBe(false);
    }
  });

  it('handles empty input', () => {
    expect(hasLeadIntent('')).toBe(false);
  });
});
