# Resources ↔ ops.britzmedi.com Document Hub Integration (2026-06-10)

## Problem
The /resources page listed a hardcoded "BRITZMEDI Company Presentation" with a PLACEHOLDER
Drive link, no version tracking, and stale metadata. Meanwhile the versioned, multilingual
source of truth already exists: the ops.britzmedi.com company-profile document hub
(D1 `ops-britzmedi-db`.`profile_documents` + Workers KV `DOCS_KV`, EN/KO/JA/ZH versions,
one `is_current` per language).

## Constraint
ops.britzmedi.com is entirely behind Cloudflare Access — the public site cannot hot-link
to it. Both apps live on the same Cloudflare account, so britzmedi.com binds the hub's
D1 + KV directly and serves files from its own domain.

## Design
- **Bindings added to wrangler.jsonc (Pages)**
  - D1 `OPS_DB` → ops-britzmedi-db (04bcb903-8e6e-4a33-ade5-e9fb557fbb13) — read-only usage
  - KV `DOCS_KV` → e5a7ca32976140e3a10c10c5a0ed780f — read-only usage
- **`GET /api/resources/hub`** — public JSON: current published docs per language
  (lang, version_label, updated_at, sizes, page_count). Cache 5 min.
- **`GET /api/resources/profile-file/{lang}/{format}`** — resolves the `is_current`
  + `status='published'` doc for lang (en|ko|ja|zh), streams the binary from DOCS_KV
  as attachment, logs to `resource_downloads` (fire-and-forget). Always the latest
  version — no stale links anywhere.
- **resources.ts** `company-presentation` → `available: true`, `hub: true`,
  driveUrl = `/api/resources/profile-file/en/pdf` (root; localized pages map
  ja→ja, zh→zh, others→en). Lead-gate flow on the EN page is unchanged — the gate
  returns this stable route as the download URL.
- **Pages** hydrate the row client-side from `/api/resources/hub`: version badge
  (`v20260414`), updated date, real PDF size, language availability (EN·KO·JA·ZH).

## Rules
- Serve only `is_current = 1 AND status = 'published'` rows. Hub-side `visibility`
  governs the ops domain (CF Access), not this marketing distribution path.
- Writes to OPS_DB/DOCS_KV are forbidden from this repo — the hub admin UI owns them.
- Version updates require zero changes here: upload + set-current on ops → live.
