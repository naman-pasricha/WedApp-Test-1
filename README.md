# WedApp - Themed Wedding Guest App

A mobile-first, PWA wedding guest application with real-time features, themed experiences, and a host dashboard. Built with Next.js 14, Supabase, and Tailwind CSS.

## ✨ Features

### Guest Experience (No App Store Required)
- **Home**: Wedding title, countdown, welcome message, latest announcement
- **Itinerary**: Swipeable event cards with illustrations, times, venues, dress codes, directions
- **Announcements**: Live feed with real-time updates and push notifications
- **Photo Hub**: Camera-centered bottom nav, client-side compression, masonry grid, likes
- **Chat**: Group chat with host broadcasts, real-time via Supabase Realtime
- **Seating**: Find your table and see tablemates
- **Games**: Photo challenges with honor-system completion
- **Travel & Info**: Accommodation, transport, FAQs, emergency contacts

### Host Dashboard
- Create weddings with custom themes (colors, fonts, patterns, component styles)
- Manage events (CRUD with drag-to-reorder)
- Seating assignments with CSV import
- Send announcements with optional push notifications
- Moderate photos and chat
- Generate QR codes and shareable links
- Download full photo album as ZIP
- View stats: guests joined, photos uploaded, announcements read

### Technical Highlights
- **Multi-tenant**: Full Row Level Security isolation
- **Theming**: CSS variables + JSON theme per wedding
- **PWA**: Installable, offline-capable, service worker
- **Push Notifications**: Web Push API with VAPID (self-hosted via Edge Functions)
- **Realtime**: Supabase Realtime for live updates
- **Mobile-first**: Bottom nav with centered camera button, 44px touch targets

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- Vercel account for deployment (optional)

### 1. Clone & Install
```bash
cd wedapp
npm install
```

### 2. Supabase Setup
```bash
# Start local Supabase (requires Docker)
supabase start

# OR use a hosted Supabase project
# Create project at https://supabase.com/dashboard
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required variables:
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (keep secret!) |
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g., `http://localhost:3000`) |
| `VAPID_PUBLIC_KEY` | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | Web Push VAPID private key |
| `VAPID_SUBJECT` | Contact email for VAPID (e.g., `mailto:you@example.com`) |
| `SUPABASE_EDGE_FUNCTION_URL` | Edge Functions URL (e.g., `https://xxx.supabase.co/functions/v1`) |

Generate VAPID keys:
```bash
npx tsx scripts/generate-vapid.ts
```

### 4. Database Migrations
```bash
# Local development
supabase db reset

# Or push to remote
supabase db push
```

### 5. Seed Demo Data
```bash
npm run db:seed
```

This creates a demo wedding at `/w/anya-raj` with sample events, announcements, challenges, and info sections.

### 6. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

---

## 📁 Project Structure

```
wedapp/
├── public/
│   ├── sw.js              # Service worker
│   ├── manifest.json      # Base PWA manifest
│   └── icons/             # PWA icons
├── src/
│   ├── app/
│   │   ├── (guest)/       # Guest app routes
│   │   │   └── w/[slug]/
│   │   │       ├── page.tsx           # Home
│   │   │       ├── itinerary/         # Schedule
│   │   │       ├── announcements/     # Live updates
│   │   │       ├── photos/            # Photo hub
│   │   │       ├── chat/              # Group chat
│   │   │       ├── seating/           # Table assignments
│   │   │       ├── games/             # Challenges
│   │   │       ├── info/              # Travel & info
│   │   │       └── join/              # Guest join flow
│   │   ├── (dashboard)/   # Host dashboard routes
│   │   │   ├── dashboard/             # Wedding list
│   │   │   └── weddings/[id]/         # Per-wedding management
│   │   └── api/           # API routes
│   ├── components/
│   │   ├── ui/            # Base UI components
│   │   ├── guest/         # Guest app components
│   │   ├── dashboard/     # Dashboard components
│   │   └── shared/        # Shared (ThemeProvider, etc.)
│   ├── lib/
│   │   ├── supabase/      # Supabase clients
│   │   ├── theme/         # Theming system
│   │   ├── guest-session/ # Guest session management
│   │   ├── push/          # Web Push utilities
│   │   ├── storage/       # Photo upload helpers
│   │   └── realtime/      # Realtime subscriptions
│   ├── hooks/             # Custom React hooks
│   └── types/             # TypeScript types
├── supabase/
│   ├── migrations/        # SQL migrations
│   ├── seed/              # Demo data
│   └── functions/         # Edge Functions
├── scripts/               # Utility scripts
└── tests/                 # Unit & integration tests
```

---

## 🗄️ Database Schema

Key tables with RLS policies:

| Table | Purpose |
|-------|---------|
| `weddings` | Core wedding record + theme JSON |
| `wedding_hosts` | Host access (owner/planner) |
| `events` | Itinerary items |
| `guests` | Device-persistent guest sessions |
| `announcements` | Host → guest updates |
| `photos` | Shared album uploads |
| `messages` | Group chat + broadcasts |
| `tables` | Seating tables |
| `challenges` | Photo challenges |
| `info_sections` | Travel, FAQ, emergency |

---

## 🎨 Theming System

Each wedding has a `theme` JSONB column with:

```typescript
{
  colors: { primary, secondary, accent, background, surface, ... },
  fonts: { heading, body, accent },
  spacing: { base, scale },
  radius: { sm, md, lg, full },
  shadows: { sm, md, lg, xl },
  components: { card, button, bottomNav, cameraButton, eventCard, ... },
  backgroundPattern: 'dots' | 'lines' | 'waves' | 'floral' | 'geometric' | 'none',
  backgroundPatternOpacity: 0.04,
  heroStyle: 'gradient' | 'image' | 'illustration' | 'split'
}
```

Applied via CSS variables through `ThemeProvider`. Hosts can pick presets or customize every token.

---

## 🔔 Push Notifications

Self-hosted Web Push via Supabase Edge Functions:

1. **Subscribe**: Guest app requests notification permission, saves subscription
2. **Send**: Host creates announcement with `send_push: true`
3. **Edge Function**: `send-push` function fetches all subscriptions for wedding, sends via `web-push` library
3. **VAPID**: Keys stored as Supabase secrets

Setup:
```bash
# Generate keys
npx tsx scripts/generate-vapid.ts

# Set as Supabase secrets
supabase secrets set VAPID_PUBLIC_KEY=...
supabase secrets set VAPID_PRIVATE_KEY=...
supabase secrets set VAPID_SUBJECT=mailto:you@example.com

# Deploy function
supabase functions deploy send-push
```

---

## 📦 Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

Vercel config in `next.config.js` handles:
- PWA manifest rewrites
- Service worker headers
- Image optimization for Supabase Storage

---

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Unit tests
npm run test

# E2E tests (requires running dev server)
npm run test:e2e
```

Key test files:
- `tests/integration/rls-policies.test.ts` - RLS policy verification
- `tests/integration/join-flow.test.ts` - Guest join flow
- `tests/integration/upload-flow.test.ts` - Photo upload

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run db:generate` | Generate Supabase types |
| `npm run db:push` | Push migrations |
| `npm run db:reset` | Reset local DB |
| `npm run db:seed` | Seed demo wedding |
| `npm run test` | Run unit tests |

---

## 🔐 Security

- **RLS**: All tables have Row Level Security policies
- **Guest sessions**: Device-based, no passwords, httpOnly cookies
- **Host auth**: Supabase Auth magic links
- **Storage**: Bucket policies tied to wedding/guest context
- **API**: Server-side validation with Zod

---

## 📱 PWA Features

- **Installable**: Meets PWA criteria (manifest, SW, HTTPS)
- **Offline**: Itinerary cached, upload queue for photos
- **Fast**: Service worker caches static assets
- **Mobile**: Bottom nav, 44px touch targets, safe area insets

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch
3. Make changes with tests
4. Submit PR

---

## 📄 License

MIT License - feel free to use for your own wedding!

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for backend
- [Next.js](https://nextjs.org) for framework
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Lucide](https://lucide.dev) for icons
- [web-push](https://github.com/web-push-libs/web-push) for notifications