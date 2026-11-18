# WedApp - Context Snapshot (2026-11-17 Morning)

## Project Overview
**WedApp** - Themed, mobile-first wedding guest application with host dashboard
- Two user types: Guests (device-based sessions via QR/link) and Hosts (magic-link auth)
- Multi-tenant: Row Level Security isolates each wedding's data
- 5-phase development plan — **All phases complete**

---

## Current State (Post-Phase 5 + Fixes)

### ✅ Build Status
```
✅ Compiled successfully
✅ No TypeScript errors
✅ No viewport warnings
✅ 16 routes generated (6 static, 10 dynamic)
✅ First Load JS: ~87kB shared
```

### ✅ Working Features
| Feature | Status |
|---------|--------|
| Multi-tenant RLS isolation | ✅ |
| 7 theme presets + custom | ✅ |
| PWA (manifest, SW, install prompt) | ✅ |
| Offline queue + auto-sync | ✅ |
| Push notifications (VAPID) | ✅ |
| Real-time chat/photos/announcements | ✅ |
| 4 game challenge types + leaderboard | ✅ |
| QR code generation (single + batch) | ✅ |
| Demo seed script ("Anya & Raj") | ✅ |

### 🗄️ Database
- **Supabase project linked** (hosted)
- **Migrations applied** (all 5 files)
- **Demo wedding seeded**: "Anya & Raj" (slug: `anya-raj`)
  - Wedding ID: `4a9a88bb-2864-4137-bbde-abe775f7333d`
  - 5 events, 9 tables, 5 info sections, 4 challenges
  - Demo host: `demo@wedapp.example` / `demo123456`

---

## Recent Fixes (This Session)

### 1. Guest Session Hook Mismatch (Fixed)
**Problem**: Two incompatible session systems existed:
- `@/lib/guest-session/hooks` → `useGuestSession()` + own provider
- `@/components/guest/GuestSessionProvider` → `useGuestSessionContext()` + own provider (used in layout)

**Result**: `useGuestSession is not a function` error on all 9 guest pages

**Fix**: Updated all guest pages to use `useGuestSessionContext` from `@/components/guest/GuestSessionProvider` and use `guest.sessionToken` (not `guest.token`)

**Files Fixed**:
- `/w/[slug]/page.tsx` (also removed erroneous `'use client'`)
- `/w/[slug]/itinerary/page.tsx`
- `/w/[slug]/announcements/page.tsx`
- `/w/[slug]/photos/page.tsx`
- `/w/[slug]/chat/page.tsx`
- `/w/[slug]/seating/page.tsx`
- `/w/[slug]/games/page.tsx`
- `/w/[slug]/join/page.tsx`
- `/w/[slug]/info/page.tsx`

### 2. Dev Server
- Running at **http://localhost:3001** (port 3000 was busy)
- Demo wedding accessible at: **http://localhost:3001/w/anya-raj**

---

## Routes Summary

### Guest App (`/w/[slug]/...`)
| Route | Description |
|-------|-------------|
| `/w/[slug]` | Home page |
| `/w/[slug]/itinerary` | Schedule |
| `/w/[slug]/announcements` | Live updates |
| `/w/[slug]/photos` | Photo grid + uploader |
| `/w/[slug]/chat` | Group chat |
| `/w/[slug]/seating` | Table assignments |
| `/w/[slug]/games` | Challenges + leaderboard |
| `/w/[slug]/info` | Travel & info |
| `/w/[slug]/join` | Join page (name + phone) |

### Dashboard (`/dashboard/weddings/[id]/...`)
| Route | Description |
|-------|-------------|
| `/dashboard` | Wedding list |
| `/overview` | Stats & quick actions |
| `/guests` | Guest management |
| `/photos` | Photo moderation |
| `/chat` | Chat moderation |
| `/announcements` | Announcements |
| `/events` | Events management |
| `/seating` | Seating chart editor |
| `/info` | Info management |
| `/settings` | Theme & settings |
| `/qr` | QR code generator |

---

## Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3001
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@wedapp.example
```

---

## Next Steps (Priority Order)

### 1. Testing & Quality (High)
- [ ] RLS policy tests - Verify multi-tenant isolation
- [ ] Join flow integration tests - Guest session creation
- [ ] Photo upload flow tests - Compression, storage, moderation
- [ ] Realtime subscription tests - Chat, photos, announcements, likes
- [ ] Theme switching tests - 7 presets, custom themes
- [ ] PWA install/offline tests - Install prompt, offline queue, sync

### 2. Technical Debt (Medium)
- [ ] Error boundaries for all guest/dashboard routes
- [ ] Loading skeletons for all data-fetching components
- [ ] Unit tests (Vitest/Jest) - Target 80% coverage
- [ ] Bundle size optimization - Analyze and reduce First Load JS
- [ ] Accessibility audit - WCAG 2.1 AA compliance

### 3. Deployment (High)
- [ ] Vercel deployment configuration
- [ ] Supabase production setup (projects, RLS, storage buckets)
- [ ] Environment variable documentation (`.env.example`)
- [ ] CI/CD pipeline (GitHub Actions)

### 4. Documentation (Medium)
- [ ] README with setup instructions
- [ ] Deployment guide (Vercel + Supabase)
- [ ] Theme customization guide (7 presets + custom)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Architecture decision records (ADRs)

---

## Key Commands
```bash
# Development
npm run dev          # Start dev server (localhost:3001)
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run lint         # ESLint (needs config)

# Database
npm run db:seed      # Seed demo wedding (already done)

# Deployment
# 1. Push to GitHub
# 2. Import in Vercel
# 3. Add env vars
# 4. Deploy
```

---

## Architecture Notes

### Theming System
- 7 presets: `classic-rose`, `warm-sand`, `sage-garden`, `midnight-navy`, `lavender-dream`, `emerald-elegance`, `sunset-coral`
- Applied via CSS variables through `ThemeProvider` → injected into `:root`
- Theme JSON stored per wedding in `weddings.theme` column

### PWA & Offline
- Service Worker (`public/sw.js`): Multiple cache strategies
- IndexedDB queue: Persists pending actions (messages, photos, likes, announcement reads)
- Auto-sync on `online` event (max 3 retries)

### Push Notifications
- VAPID keys in env
- Client subscribes via `PushManager.subscribe()`
- Server sends via Edge Function (`send-push`)

### Games & Challenges
- 4 types: `photo_scavenger`, `trivia`, `prediction`, `caption_contest`
- Full CRUD API + participation + leaderboard

---

## File Structure Highlights
```
src/
├── app/
│   ├── (guest)/w/[slug]/           # Guest app routes (9 pages)
│   ├── (dashboard)/weddings/[id]/  # Dashboard routes (11 pages)
│   └── api/weddings/[slug]/        # API routes (games, push, etc.)
├── components/
│   ├── guest/                      # Guest app components (14 files)
│   ├── dashboard/                  # Dashboard components
│   └── shared/                     # Shared (ThemeProvider, etc.)
├── lib/
│   ├── guest-session/              # Session management (store, hooks, types)
│   ├── push/                       # Push notification client
│   ├── qrcode.ts                   # QR generation (SVG, no deps)
│   └── theme/presets.ts            # 7 theme presets
└── supabase/migrations/            # 5 SQL migration files
```

---

## Testing URLs
- **Guest Demo**: http://localhost:3001/w/anya-raj
- **Dashboard**: http://localhost:3001/login → /dashboard
- **404 Page**: http://localhost:3001/ (has "Try Demo Wedding" button)