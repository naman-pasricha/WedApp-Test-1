-- WedApp Database Schema
-- Migration 001: Initial schema with all tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- WEDDINGS
-- ============================================
CREATE TABLE weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  host_id UUID REFERENCES auth.users ON DELETE SET NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  theme JSONB NOT NULL DEFAULT '{}',
  hero_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_weddings_slug ON weddings(slug);
CREATE INDEX idx_weddings_host ON weddings(host_id);

-- ============================================
-- WEDDING HOSTS (many-to-many for planners)
-- ============================================
CREATE TABLE wedding_hosts (
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'planner')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (wedding_id, user_id)
);

CREATE INDEX idx_wedding_hosts_user ON wedding_hosts(user_id);

-- ============================================
-- EVENTS (itinerary)
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  venue_name TEXT,
  venue_address TEXT,
  venue_lat DECIMAL(9,6),
  venue_lng DECIMAL(9,6),
  dress_code TEXT,
  illustration_url TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_wedding ON events(wedding_id, display_order);

-- ============================================
-- GUESTS (device-persistent, no passwords)
-- ============================================
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  device_id TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  table_id UUID, -- FK to tables, added later
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (wedding_id, device_id)
);

CREATE INDEX idx_guests_wedding_device ON guests(wedding_id, device_id);
CREATE INDEX idx_guests_session_token ON guests(session_token);
CREATE INDEX idx_guests_table ON guests(table_id);

-- ============================================
-- ANNOUNCEMENTS (host -> guests, realtime + push)
-- ============================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  sent_by UUID REFERENCES auth.users ON DELETE SET NULL,
  send_push BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_announcements_wedding_created ON announcements(wedding_id, created_at DESC);

-- Announcement read receipts
CREATE TABLE announcement_reads (
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (announcement_id, guest_id)
);

CREATE INDEX idx_announcement_reads_guest ON announcement_reads(guest_id);

-- ============================================
-- PHOTOS (shared album)
-- ============================================
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  mime_type TEXT NOT NULL,
  width INT,
  height INT,
  file_size INT,
  caption TEXT,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_photos_wedding_created ON photos(wedding_id, created_at DESC);
CREATE INDEX idx_photos_guest ON photos(guest_id);

-- Photo likes
CREATE TABLE photo_likes (
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (photo_id, guest_id)
);

CREATE INDEX idx_photo_likes_guest ON photo_likes(guest_id);

-- ============================================
-- MESSAGES (group chat + host broadcasts)
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  host_user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  image_url TEXT,
  is_broadcast BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_wedding_created ON messages(wedding_id, created_at DESC);

-- ============================================
-- TABLES & SEATING
-- ============================================
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INT DEFAULT 10,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tables_wedding ON tables(wedding_id, display_order);

-- Add FK from guests to tables (after tables created)
ALTER TABLE guests
  ADD CONSTRAINT fk_guests_table
  FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL;

-- ============================================
-- CHALLENGES (games tab)
-- ============================================
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points INT DEFAULT 10,
  icon TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_challenges_wedding ON challenges(wedding_id, display_order);

-- Challenge completions (honor system)
CREATE TABLE challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES photos(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (challenge_id, guest_id)
);

CREATE INDEX idx_challenge_completions_guest ON challenge_completions(guest_id);

-- ============================================
-- INFO SECTIONS (travel, FAQ, emergency)
-- ============================================
CREATE TABLE info_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  icon TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_info_sections_wedding ON info_sections(wedding_id, display_order);

-- ============================================
-- PUSH SUBSCRIPTIONS (Web Push VAPID)
-- ============================================
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (guest_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_wedding ON push_subscriptions(wedding_id);
CREATE INDEX idx_push_subscriptions_guest ON push_subscriptions(guest_id);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_weddings_updated_at BEFORE UPDATE ON weddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();