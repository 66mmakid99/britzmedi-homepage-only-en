// Detects commercial intent in a chatbot message so the widget can offer its inline
// lead form.
//
// Kept out of the API route so it can be unit-tested. The first version lived inline
// and shipped a regex bug: `partner(ship)?` has a trailing \b, so it matched
// "partnership" but missed "partners" and "partnerships" — while the neighbouring
// `distribut\w*` caught "distributors" fine. Live testing on 2026-09-05 found
// "What support do you offer partners?" showing no form. Hence the tests below.

export const LEAD_INTENT_PATTERNS: RegExp[] = [
  // Distribution / partnership — the single biggest topic in the chat log
  // (9 of 20 conversations). \w* on both stems so plurals can't slip through.
  /\b(distribut\w*|dealer|reseller|partner\w*|agent)\b/i,
  // Commercial terms
  /\b(price|pricing|cost|quote|quotation|invoice|moq|minimum order|discount)\b/i,
  // Buying intent
  /\b(buy|purchase|order|import|bring .{0,20}(machine|device|unit)s?)\b/i,
  // Sales collateral
  /\b(demo|sample|trial|catalog(ue)?|brochure|price list)\b/i,
  // Logistics — a B2B visitor asking how we ship is a buyer, not a browser
  /\b(shipping|freight|logistics)\b|\bship (to|worldwide|internationally)\b/i,
  // Asking how to reach a human
  /\b(contact|email|phone|whatsapp|reach (you|us|me)|get in touch|call me)\b/i,
  // Korean
  /(총판|대리점|유통|파트너|가격|견적|구매|주문|수입|문의)/,
  // Spanish
  /(distribuidor|distribuci[oó]n|precio|cotizaci[oó]n|comprar)/i,
  // French
  /(distributeur|distribution|prix|devis|acheter)/i,
];

/** True when the message suggests the visitor is a prospect, not just browsing. */
export function hasLeadIntent(userMessage: string): boolean {
  if (!userMessage) return false;
  return LEAD_INTENT_PATTERNS.some((p) => p.test(userMessage));
}
