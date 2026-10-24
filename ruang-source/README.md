# Ruang Tumbuh

Mounted at https://dickyadisaputra.com/ruang-tumbuh/. The static client is built with Vite; the authenticated API is the Supabase Edge Function `ruang-tumbuh` in the existing website project.

## Build

`npm ci && npm run build` builds ../ruang-tumbuh. GitHub Pages stages only the public site, excluding source and database scripts.

## Privacy

The app validates the signed-in account on the API. Private learning state is never committed. Supabase RLS denies anonymous access; the scheduler credential is generated inside Vault and is never embedded in the frontend. API caches and scheduler settings are service-only. Authentication uses the existing website owner account.

## Daily updates

Supabase cron dispatches at 06:30 WIB (23:30 UTC) and retries stale topics/news at 06:45 WIB. Each saved topic has a separate bounded invocation. No AI or API key for the literature provider is required. Unavailable sources retain the last valid collection. Rule checks do not replace expert review.

## Migration

Export from old Ruang settings, sign into this app, then Settings → Import backup. The same JSON structure retains reading IDs, group timestamps, highlight tombstones and preferences. Original source stays available during migration. Personal browser caches live under ruang-tumbuh-owner-v1 and clear on signout. Changing capture bookmarks is required; all new capture links include /ruang-tumbuh/.

## Backend

backend/index.ts imports the portable journal catalog core. Deploy with backend/deno.json as its import map and custom authentication enabled in the handler. Do not trust caller-supplied user IDs or publishable keys as proof of identity. backend/schema.sql and schedule.sql document the additive migrations; do not rerun blindly.

## Categories, news, and quotations

Library collection tabs (all/books/personal) are separate from field filters. Fields are derived from preferences and active reading labels. Personal organization uses `organizeUpdatedAt` plus a `deletedAt` tombstone so an older device cannot resurrect removed items. Keep this merge group when migrating.

Topic refreshes update papers and a separate news cache; failures retain the last valid result. Known fields use publisher RSS; arbitrary fields try news search RSS. These sources can be unavailable. The quote is an exact sentence from a licensed body paragraph, cached by WIB day and preference signature; its document and block ID are retained for context.

## Books

`public/books/catalog.json` lists three OpenStax books with pinned source commits. Chunked text, tables, captions and remotely loaded illustrations follow the original collection order. The adaptation retains CC BY-NC-SA 4.0 attribution and image credits; no OpenStax logos, instructor-only materials or video files are bundled. Book publication dates are distinct from source update dates. `scripts/prepare-open-books.py` is a manual edition preparation tool, not an automatic endorsement of future editions. Review licensing and source changes before running it again.

PDF/EPUB private imports are parsed on the client. Original files stay on the device. Parsed book text is POSTed to the owner-authenticated `books/document` endpoint and kept under the service-only `private-book:<owner-id>:<reading-id>` cache prefix. The lightweight learning state retains only metadata, progress, highlights and reflection notes. GET and export enforce the configured owner before reading any book. Do not expose the cache table or publish exports. Book IDs are immutable; importing different text under an existing ID returns a conflict to protect highlights.

Limits: PDF and EPUB up to 25 MB; extracted book text up to five million characters. Scanned PDFs need OCR outside this release. EPUB encryption/DRM and fixed-layout image books are unsupported. EPUB imports preserve text and headings, not original graphics/layout. PDF extraction can misread tables, formulas or heading hierarchy. Keep original files for comparison.

Use **Export migration package** for a complete backup including private books. **Export notes** is a lightweight notes/list backup. Importing a migration package uploads its book documents before merging the learning state. The new host must support the authenticated book routes and service-only book prefix, in addition to the prior state/catalog routes. The migration package remains private.

## Account pages and verification

Password forms live at `/ruang-tumbuh/akun/`, `/studio/akun/`, and on the Ruang Ayat domain at `/akun/`. Each page has its own branding and return link. The generic root `/akun/` remains for existing links and does not advertise application destinations. Recovery requests use their current page as the redirect destination. Ensure these exact URLs are allowed in Supabase Auth URL Configuration when changing domains; the recovery-link verification form is available if an email opens a different page. Actual password changes and recovery-email delivery are completed by the user and are not exercised during agent QA.

Run `node --test tests/*.test.ts` on Node 24, then `npm run build`. Access tests verify that visitors, forged tokens and public Ruang Ayat accounts cannot reach private state or books; they use invented fixture identities and never change the real owner's account. Browser QA covers field creation, category edits, delete/undo, quote context, EPUB/PDF imports and 400 px reading layout. Production publication must be checked separately; local builds alone are not deployment evidence.

## Reading card summaries

`lib/catalog/summaries.ts` holds two-sentence Indonesian editorial summaries for the current 45 stored journal articles, seven older selected readings and three open books. They are based on stored abstracts or the book's scope, independently of `curation.reason` and `curation.method`. `lib/summary.ts` overlays these by reading ID/DOI at display and catalog API boundaries, including old cached search results, so updating wording never changes document revisions, blocks, highlights, or private learning state.

New journal documents without an editorial summary use at most two complete abstract sentences, explicitly labelled **Cuplikan abstrak · EN**. This is an original-language excerpt, not an AI-written Indonesian summary. If no usable abstract exists, the UI states the summary is unavailable rather than substituting a source-check status. News and personal imports retain their source/user preview text. No external summarization API or automatic full-text translation is enabled.
