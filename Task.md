# WedApp Task Tracker

## Current Sprint: Phase 5 - Complete ✅

### Completed Tasks

#### Push Notifications
- [x] VAPID key management (`.env.vapid.example`)
- [x] Push subscription CRUD API (`/api/weddings/[slug]/push/subscribe`)
- [x] Service worker push event handling
- [x] Client-side push management (`src/lib/push/client.ts`)
- [x] Push notification prompt component

#### PWA Polish
- [x] Fixed all viewport warnings - Added `generateViewport` exports to all 16 pages
- [x] PWA Install Prompt (`src/components/guest/PWAInstallPrompt.tsx`)
- [x] iOS Install Banner with "Add to Home Screen" instructions
- [x] Enhanced Service Worker (`public/sw.js`) with multiple cache strategies
- [x] LRU cleanup with size limits
- [x] Background sync for photos/messages
- [x] Periodic sync support

#### Offline Support
- [x] OfflineIndicator component - online/offline status with pending sync count
- [x] IndexedDB queue for pending actions (messages, photos, likes, announcement reads)
- [x] Auto-sync with max 3 retries when connection restored

#### Games & Challenges
- [x] 4 Challenge Types: Photo scavenger hunt, trivia, prediction, caption contest
- [x] Full API CRUD for challenges, participation submission, leaderboard
- [x] GamesContent component with modal UI for each challenge type
- [x] Real-time scoring and leaderboard with rankings

#### QR Code Generation
- [x] QRCode Library (`src/lib/qrcode.ts`) - SVG-based (no external deps)
- [x] Dashboard Component (`src/components/dashboard/QRCodePage.tsx`)
- [x] Copy, download, print, open actions
- [x] Batch generation for invitations (4/6/10/20 per page)

#### Demo Data & Documentation
- [x] Seed Script (`scripts/seed-demo-wedding.ts`) - "Anya & Raj" demo wedding
- [x] 5 events, 9 tables, 5 info sections, 4 challenges
- [x] Demo host account (demo@wedapp.example / demo123456)
- [x] QR code generation included in seed

---

## Next Sprint: Post-Phase 5 (Testing, Debt, Deployment, Docs)

### Testing & Quality (Priority: High)
- [ ] RLS policy tests - Verify multi-tenant isolation
- [ ] Join flow integration tests - Guest session creation
- [ ] Photo upload flow tests - Compression, storage, moderation
- [ ] Realtime subscription tests - Chat, photos, announcements, likes
- [ ] Theme switching tests - 7 presets, custom themes
- [ ] PWA install/offline tests - Install prompt, offline queue, sync

### Technical Debt (Priority: Medium)
- [ ] Error boundaries for all guest/dashboard routes
- [ ] Loading skeletons for all data-fetching components
- [ ] Unit tests (Vitest/Jest) - Target 80% coverage
- [ ] Bundle size optimization - Analyze and reduce First Load JS
- [ ] Accessibility audit - WCAG 2.1 AA compliance

### Deployment (Priority: High)
- [ ] Vercel deployment configuration
- [ ] Supabase production setup (projects, RLS, storage buckets)
- [ ] Environment variable documentation (`.env.example`)
- [ ] CI/CD pipeline (GitHub Actions)

### Documentation (Priority: Medium)
- [ ] README with setup instructions
- [ ] Deployment guide (Vercel + Supabase)
- [ ] Theme customization guide (7 presets + custom)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Architecture decision records (ADRs)

---

## Technical Notes

### Database Tables to Create (Run in Supabase SQL Editor)
```sql
-- Challenges table
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo_scavenger', 'trivia', 'prediction', 'caption_contest')),
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  points INTEGER DEFAULT 100,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  display_order INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge participations table
CREATE TABLE challenge_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, guest_id)
);

-- Push subscriptions table
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wedding_id, guest_id, endpoint)
);

-- Enable RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (guests can read active challenges for their wedding)
CREATE POLICY "Guests can view active challenges" ON challenges
  FOR SELECT USING (
    wedding_id IN (SELECT wedding_id FROM guests WHERE id = auth.uid())
    AND status = 'active'
    AND starts_at <= NOW()
    AND ends_at >= NOW()
  );

CREATE POLICY "Guests can participate" ON challenge_participations
  FOR INSERT WITH CHECK (guest_id = auth.uid());
```

### Environment Variables Needed
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# VAPID Keys (for push notifications)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@wedapp.example

# App
NEXT_PUBLIC_APP_URL=
```

### Known Issues / Limitations
1. QR Code library uses simplified SVG pattern - replace with `qrcode` npm package for production
2. Demo seed script requires service role key - not suitable for client-side
3. No error boundaries implemented yet - app crashes show white screen
4. Bundle size could be optimized - First Load JS ~87kB shared
5. Accessibility not audited - missing ARIA labels, focus management