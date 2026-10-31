# Phone Cleaner — PRD

## Original problem statement
Build a mobile app that cleans my mobile drive space. Android users; public release (friends & family).
Features: find duplicate photos and files; find large files and delete them; smart AI helper that suggests what to delete; preview mode before deleting.
Integration: AI text suggestions via Claude Sonnet 5.5 (Emergent universal key). Expo mobile app, Android.
User choices: all defaults (media library + folder picker scan, duplicates by size then MD5, large threshold 50 MB adjustable, clean design, AI sees metadata only).

## Architecture
- Expo Router (stack): `/` Home, `/duplicates`, `/large`, `/ai`, `/review`
- `src/scanner.ts`: expo-media-library/legacy (permissions, assets, delete), expo-file-system (sizes, MD5 digest, SAF folder walk, delete, disk space)
- `src/store.tsx`: global scan state, duplicate groups (oldest kept as "Best"), large files, selection, delete
- `src/demo.ts`: demo dataset (web preview / no media access)
- Backend FastAPI `POST /api/ai/suggest` → Claude `claude-sonnet-5-5` (streamed, aggregated JSON), filters invalid/keeper ids, stores results in Mongo `ai_suggestions`

## Implemented (2026-10-31)
- Storage ring dashboard, reclaimable total, category tiles, contextual permission sheet (Open Settings when blocked)
- Duplicate finder (MD5-confirmed only), Best badge, select extras/all, separate preview vs checkbox targets
- Large files with threshold chips (persisted)
- AI helper suggestion cards → Review
- Preview/review grid, full-screen preview, confirm sheet, delete, success state, toast
- Demo mode on web

## Implemented (2026-10-31, round 2)
- Free, no ads (no ad SDKs); 'Free · No ads' on Home
- Required first-launch Terms & Disclaimer consent (developer not liable for any loss), gated for all routes in root layout, persisted
- Terms & disclaimer link on Home; liability note in delete confirm sheet

## Implemented (2026-10-31, round 3)
- In-app Privacy note (/privacy) linked from Home and Disclaimer (viewable before consent)
- Hosted privacy policy HTML at GET /api/privacy for Google Play Console
- Similar/blurry photo detection DEFERRED to v2 per user

## Backlog
- P1 (v2): Similar (near-identical) photo detection (dHash) + blurry detection (Laplacian variance) — needs @shopify/react-native-skia on native
- P1: Cache/app junk overview, scan history
- P2: Undo via "Recently deleted" staging, scheduled cleanup reminders
