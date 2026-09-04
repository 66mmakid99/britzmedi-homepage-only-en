/**
 * Central AI model configuration.
 * Single source of truth — do NOT hardcode model IDs elsewhere.
 * Alias IDs (not dated snapshots) so deprecations don't break 6 modules at once.
 */
export const CLAUDE_MODEL = 'claude-sonnet-4-6';

/**
 * Visitor-facing chatbot only (`/api/chat`).
 *
 * Kept separate from CLAUDE_MODEL on purpose: CLAUDE_MODEL is shared by the AEO
 * engine, content pipeline, lead research/classification and the leads auto-reply,
 * and those are high-volume batch jobs with a different cost/latency profile.
 * The chatbot is low volume (~20 conversations / 6 months) and customer-facing,
 * where instruction adherence matters most — a 2026-05-20 conversation had the bot
 * telling a European prospect BRITZMEDI was "preparing for CE-MDR certification",
 * three months after that exact claim was banned in the system prompt.
 *
 * Opus 5 runs adaptive thinking by default; `/api/chat` pins effort to "low" so
 * chat latency stays close to the previous model.
 */
export const CHATBOT_MODEL = 'claude-opus-5';
