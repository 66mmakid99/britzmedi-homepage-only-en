// Post-generation guard for regulatory claims BRITZMEDI cannot make.
//
// The chatbot system prompt has banned every CE claim since 2026-02-10 (commit
// 991c716). On 2026-05-20 the model said it anyway — twice in one conversation, to a
// European OEM prospect: "we're currently preparing for CE-MDR certification" and
// "we'd work together on ensuring the device meets all CE requirements". BRITZMEDI
// holds FDA 510(k), ISO 13485, GMP and MFDS; it has no CE-MDR. A prompt instruction
// is not a control, so the claim is also removed after generation.

export interface ClaimScanResult {
  text: string;
  /** Human-readable descriptions of what was removed; empty when nothing matched. */
  removed: string[];
}

export const PROHIBITED_CLAIM_PATTERNS: { name: string; pattern: RegExp }[] = [
  {
    name: 'CE claim',
    // `CE` is matched CASE-SENSITIVELY on purpose. A case-insensitive `ce` would hit
    // ordinary French ("ce marché", "ce certificat") and the widget serves
    // French-speaking visitors — a Mauritius and a France conversation are in the log.
    // `certifi\w*` (not `certific\w*`) so "CE certified" is caught alongside
    // "CE certification" / "CE certificate".
    pattern: /\bCE[-\s]?(?:MDR|[Mm]ark(?:ing|ed|s)?|[Cc]ertifi\w*|[Rr]equirements?|[Aa]pprovals?|[Cc]onformity)\b/,
  },
];

const SAFE_REDIRECT =
  "I don't have that specific information. Please contact us at /contact and our team will get back to you.";

/**
 * Remove any sentence that makes a prohibited regulatory claim.
 *
 * Splits on sentence boundaries and newlines so the surrounding answer survives
 * intact. If stripping leaves nothing meaningful, returns a safe redirect rather
 * than an empty message.
 */
export function stripProhibitedClaims(input: string): ClaimScanResult {
  const text = input || '';
  const removed: string[] = [];

  const parts = text.split(/(?<=[.!?])\s+|(?<=\n)/);
  const kept = parts.filter((part) => {
    for (const { name, pattern } of PROHIBITED_CLAIM_PATTERNS) {
      if (pattern.test(part)) {
        removed.push(`[${name}] ${part.trim().slice(0, 160)}`);
        return false;
      }
    }
    return true;
  });

  if (removed.length === 0) return { text, removed };

  const cleaned = kept
    .join(' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  if (cleaned.length < 40) return { text: SAFE_REDIRECT, removed };

  return { text: cleaned, removed };
}
