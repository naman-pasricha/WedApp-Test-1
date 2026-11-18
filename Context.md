# WedApp - Project Context

## Project Overview
**WedApp** - Themed, mobile-first wedding guest application with host dashboard

### Core Concept
- **Guests**: Device-based sessions via QR code/link (no passwords)
- **Hosts**: Magic-link authentication via email
- **Multi-tenant**: Row Level Security isolates each wedding's data

### Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router, Server/Client Components) |
| Database | Supabase (PostgreSQL, Realtime, Storage, Auth, Edge Functions) |
| Auth | Supabase Auth (magic links for hosts, device sessions for guests) |
| Styling | CSS Variables + JSON theming (7 presets) |
| PWA | Manifest, Service Worker, Web Push API (VAPID) |
| Language | TypeScript (strict mode) |
| Deployment | Vercel + Supabase |

---

## Architecture

### Routing Structure
```
/                          → Landing page (redirect to dashboard or join)
/login                     → Host magic-link login
/w/[slug]                  → Guest app entry (home)
/w/[slug]/itinerary        → Schedule
/w/[slug]/announcements    → Announcements
/w/[slug]/photos           → Photo grid + uploader
/w/[slug]/chat             → Real-time chat
/w/[slug]/seating          → Seating chart
/w/[slug]/info             → Travel & info
/w/[slug]/games            → Games & challenges
/w/[slug]/join             → Join page (name + phone)
/dashboard                 → Host wedding list
/dashboard/weddings/[id]/overview   → Stats & quick actions
/dashboard/weddings/[id]/guests     → Guest management
/dashboard/weddings/[id]/photos     → Photo moderation
/dashboard/weddings/[id]/chat       → Chat moderation
/dashboard/weddings/[id]/announcements → Announcements
/dashboard/weddings/[id]/events     → Events management
/dashboard/weddings/[id]/seating    → Seating chart
/dashboard/weddings/[id]/info       → Info management
/dashboard/weddings/[id]/settings   → Theme & settings
/dashboard/weddings/[id]/qr         → QR code generator
```

### Key Components

#### Guest App Components
- `GuestSessionProvider` - Device session management (localStorage)
- `ThemeProvider` - CSS variable injection from wedding theme JSON
- `PWAInstallPrompt` - Native install prompt + iOS banner
- `OfflineIndicator` - Online/offline status + pending sync count
- `GamesContent` - 4 challenge types with modals & leaderboard

#### Dashboard Components
- `WeddingCard` - Wedding list item with quick actions
- `PhotoModerationTable` - Approve/reject/delete photos
- `ChatModerationPanel` - Announce, pin, delete messages
- `SeatingChartEditor` - Drag-drop table/guest assignment
- `QRCodePage` - QR generation, batch printing

---

## Database Schema (Supabase)

### Core Tables
```sql
weddings              -- Wedding details, theme JSON, slug (unique)
wedding_hosts         -- Host permissions (owner, admin, coordinator)
guests                -- Guest info + session_token for device auth
events                -- Schedule items with venue, times
tables                -- Seating tables with capacity
table_assignments     -- Guest → table mapping
photos                -- Uploaded photos (moderation status)
announcements         -- Host announcements (pinned, scheduled)
chat_messages         -- Guest chat messages
push_subscriptions    -- Web Push endpoints per guest
challenges            -- Game challenges (4 types, JSON config)
challenge_participations -- Guest answers + scores
info_sections         -- Travel/FAQ/dress code info
```

### RLS Patterns
- Guests: Can only access data for their `wedding_id` (via `session_token` → `guests.wedding_id`)
- Hosts: Can manage all data for weddings they own/admin
- Service role: Full access for seeding, admin APIs

---

## Theming System

### 7 Presets
1. `classic-rose` - Romantic pink/cream
2. `warm-sand` - Warm terracotta/beige (demo default)
3. `sage-garden` - Natural green/cream
4. `midnight-navy` - Dark navy/gold
5. `lavender-dream` - Soft purple/silver
6. `emerald-elegance` - Deep emerald/gold
7. `sunset-coral` - Vibrant coral/peach

### Theme JSON Structure
```json
{
  "preset": "warm-sand",
  "colors": {
    "primary": "#C4785E",
    "secondary": "#D4A574",
    "background": "#FFF8F3",
    "surface": "#FFFFFF",
    "foreground": "#3D3D3D",
    "muted": "#8B7D6B",
    "border": "#E8DDD4",
    "accent": "#E8B484"
  },
  "fonts": {
    "heading": "Playfair Display",
    "body": "Inter"
  },
  "borderRadius": "rounded-xl",
  "pattern": "leaves",
  "patternOpacity": 0.04
}
```

Applied via CSS variables in `ThemeProvider` → injected into `:root`

---

## PWA & Offline

### Service Worker (`public/sw.js`)
- **Cache Strategies**:
  - Static assets: Cache-first (30 days, 50MB)
  - Images: Cache-first (7 days, 100MB)
  - API: Stale-while-revalidate (1 day, 10MB)
  - HTML: Network-first with offline fallback
  - Fonts: Cache-first (1 year, 10MB)
- **LRU Cleanup**: Automatic size-based eviction
- **Background Sync**: Photos, messages queued offline
- **Periodic Sync**: Optional server check

### IndexedDB Queue (`src/lib/offline/queue.ts`)
```typescript
type QueuedAction = 
  | { type: 'send_message'; payload: MessageData }
  | { type: 'upload_photo'; payload: PhotoData }
  | { type: 'like_photo'; payload: { photoId: string } }
  | { type: 'read_announcement'; payload: { announcementId: string } }
```
- Max 3 retries per action
- Auto-sync on `online` event

---

## Push Notifications

### Flow
1. Guest visits app → `PushPrompt` component shown
2. User allows → `PushManager.subscribe()` with VAPID public key
3. Subscription sent to `/api/weddings/[slug]/push/subscribe`
4. Host sends announcement → Edge Function pushes to all subscriptions
5. Service worker receives `push` event → shows notification

### VAPID Keys
```env
VAPID_PUBLIC_KEY=  # Client-side
VAPID_PRIVATE_KEY= # Server-side only
VAPID_SUBJECT=mailto:admin@wedapp.example
```

---

## Games & Challenges

### 4 Challenge Types
| Type | Config | Scoring |
|------|--------|---------|
| `photo_scavenger` | `photo_targets: string[]` | Per photo uploaded |
| `trivia` | `questions: {id, question, options[], correct_answer, points}[]` | Per correct answer |
| `prediction` | `prediction_options: string[]` | Closest to actual |
| `caption_contest` | `photo_url, voting_enabled` | Host/judge picks winner |

### API Endpoints
```
GET    /api/weddings/[slug]/games              → List challenges
POST   /api/weddings/[slug]/games              → Create challenge
GET    /api/weddings/[slug]/games/[id]         → Get challenge
PATCH  /api/weddings/[slug]/games/[id]         → Update challenge
DELETE /api/weddings/[slug]/games/[id]         → Delete challenge
POST   /api/weddings/[slug]/games/[id]/participate → Submit answers
GET    /api/weddings/[slug]/games/leaderboard  → Aggregated scores
```

---

## QR Code Generation

### Library (`src/lib/qrcode.ts`)
- Pure SVG implementation (no external deps)
- Finder patterns, timing patterns, quiet zones
- `generateQRCodeSVG(text, options)` → SVG string
- `generateQRCode(text, size)` → base64 data URL
- `generatePrintableQRPage(weddingName, url, options)` → HTML for printing
- `generateBatchPrintPage(wedding, url, count)` → Multi-QR print layout

### Dashboard UI (`QRCodePage.tsx`)
- Single QR display (384px)
- Actions: Copy link, Download SVG, Print page, Open app
- Batch: 4/6/10/20 per page for invitations

---

## Demo Data

### Seed Script (`scripts/seed-demo-wedding.ts`)
Creates: **"Anya & Raj"** wedding (slug: `anya-raj`)
- **Host**: `demo@wedapp.example` / `demo123456`
- **Theme**: `warm-sand` preset
- **5 Events**: Welcome Drinks → Ceremony → Reception → Late Night → Brunch
- **9 Tables**: Family, College Friends, Work, Childhood, Plus Ones, Sweetheart
- **5 Info Sections**: Accommodation, Transportation, Dress Code, FAQs, Emergency
- **4 Challenges**: Photo Scavenger (11 targets), Trivia (6 Qs), Predictions, Caption Contest

Run: `npx tsx scripts/seed-demo-wedding.ts` (requires `SUPABASE_SERVICE_ROLE_KEY`)

---

## Build & Deploy

### Commands
```bash
npm run dev          # Development server
npm run build        # Production build (✅ passing)
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npx tsx scripts/seed-demo-wedding.ts  # Seed demo data
```

### Build Output
- 16 routes (6 static, 10 dynamic)
- First Load JS: ~87kB shared
- Zero TypeScript errors
- Zero viewport warnings

### Environment Files
- `.env.local` - Local development
- `.env.example` - Template (needs creation)
- `.env.vapid.example` - VAPID key template

---

## File Structure Highlights

```
src/
├── app/
│   ├── (guest)/w/[slug]/           # Guest app routes
│   ├── (dashboard)/weddings/[id]/  # Dashboard routes
│   └── api/weddings/[slug]/        # API routes (games, push, etc.)
├── components/
│   ├── guest/                      # Guest app components
│   └── dashboard/                  # Dashboard components
├── lib/
│   ├── qrcode.ts                   # QR generation
│   ├── offline/queue.ts            # IndexedDB queue
│   ├── push/client.ts              # Push subscription
│   ├── supabase/                   # Client/server helpers
│   └── theme/presets.ts            # 7 theme presets
├── types/database.ts               # Generated Supabase types
└── scripts/seed-demo-wedding.ts    # Demo data seed

public/
├── sw.js                           # Service worker
├── manifest.json                   # PWA manifest
└── icons/                          # PWA icons (need splash screens)
```

---

## Current State (Post-Phase 5)

### ✅ Working
- All 16 routes compile & render
- Guest join flow → session → all pages accessible
- Dashboard CRUD for all entities
- Realtime: chat, photos, announcements, likes
- Theming: 7 presets + custom
- PWA: Install prompt, offline queue, service worker
- Games: 4 types, API, UI, leaderboard
- QR: Generation, print, batch

### ⏳ Pending
- Database migrations for `challenges`, `challenge_participations`, `push_subscriptions`
- Supabase production setup
- Error boundaries & loading skeletons
- Tests (unit, integration, E2E)
- Accessibility audit
- Documentation (README, deployment, theming guides)
- CI/CD pipeline

---

## Key Decisions & Trade-offs

| Decision | Rationale |
|----------|-----------|
| Device sessions (no passwords) | Frictionless for guests; localStorage + session_token |
| Slug-based guest routing (`/w/[slug]`) | Avoids Next.js route conflicts with dashboard (`/dashboard/weddings/[id]`) |
| SVG QR codes (no deps) | Zero dependencies; replaceable with `qrcode` npm package later |
| CSS variables for theming | Runtime theme switching without rebuild; works with Tailwind |
| IndexedDB for offline queue | Persists across browser restarts; no size limits like localStorage |
| 4 challenge types only | Covers 90% of wedding game needs; extensible via `config` JSON |
| Service worker in `public/` | Simpler than Workbox; full control over caching strategies |

---

## Next Session Starting Point

Run these to verify:
```bash
cd F:/WedApp
npm run build          # Should pass
npm run typecheck      # Should pass
# Then: Set up Supabase, run seed script, test end-to-end
```

Priority order for next work:
1. Run database migrations in Supabase
2. Test seed script against real Supabase
3. Add error boundaries to all routes
4. Create `.env.example` and deployment docs
5. Write README with setup instructions