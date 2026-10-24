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
