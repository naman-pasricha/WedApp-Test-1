-- WedApp RLS Policies
-- Migration 002: Row Level Security policies for multi-tenant isolation

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current wedding ID from request context (set by middleware)
CREATE OR REPLACE FUNCTION current_wedding_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.current_wedding_id', true), '')::uuid;
$$;

-- Get current guest ID from request context (set by middleware)
CREATE OR REPLACE FUNCTION current_guest_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.current_guest_id', true), '')::uuid;
$$;

-- Get current host user ID (auth.uid())
CREATE OR REPLACE FUNCTION current_host_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT auth.uid();
$$;

-- Check if current user is a host of the wedding
CREATE OR REPLACE FUNCTION is_wedding_host(wedding_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM wedding_hosts
    WHERE wedding_id = wedding_uuid
    AND user_id = auth.uid()
  );
$$;

-- Check if current user owns the wedding
CREATE OR REPLACE FUNCTION is_wedding_owner(wedding_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM wedding_hosts
    WHERE wedding_id = wedding_uuid
    AND user_id = auth.uid()
    AND role = 'owner'
  );
$$;

-- ============================================
-- WEDDINGS
-- ============================================
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;

-- Hosts can read their weddings
CREATE POLICY "Hosts read own weddings" ON weddings
  FOR SELECT USING (is_wedding_host(id));

-- Owners can insert weddings
CREATE POLICY "Owners create weddings" ON weddings
  FOR INSERT WITH CHECK (auth.uid() = host_id);

-- Owners can update their weddings
CREATE POLICY "Owners update weddings" ON weddings
  FOR UPDATE USING (is_wedding_owner(id));

-- Owners can delete their weddings
CREATE POLICY "Owners delete weddings" ON weddings
  FOR DELETE USING (is_wedding_owner(id));

-- Public read for wedding slug lookup (join flow)
CREATE POLICY "Public read wedding by slug" ON weddings
  FOR SELECT USING (true);

-- ============================================
-- WEDDING HOSTS
-- ============================================
ALTER TABLE wedding_hosts ENABLE ROW LEVEL SECURITY;

-- Hosts can read hosts of their weddings
CREATE POLICY "Hosts read wedding hosts" ON wedding_hosts
  FOR SELECT USING (is_wedding_host(wedding_id));

-- Owners can manage hosts
CREATE POLICY "Owners manage wedding hosts" ON wedding_hosts
  FOR ALL USING (is_wedding_owner(wedding_id));

-- ============================================
-- EVENTS
-- ============================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Guests read events for their wedding
CREATE POLICY "Guests read wedding events" ON events
  FOR SELECT USING (wedding_id = current_wedding_id());

-- Hosts manage events for their weddings
CREATE POLICY "Hosts manage wedding events" ON events
  FOR ALL USING (is_wedding_host(wedding_id));

-- ============================================
-- GUESTS
-- ============================================
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Guests read own session
CREATE POLICY "Guests read own session" ON guests
  FOR SELECT USING (id = current_guest_id());

-- Guests can insert their session (join flow)
CREATE POLICY "Guests join wedding" ON guests
  FOR INSERT WITH CHECK (wedding_id = current_wedding_id());

-- Guests update own session (last_seen, table_id)
CREATE POLICY "Guests update own session" ON guests
  FOR UPDATE USING (id = current_guest_id())
  WITH CHECK (id = current_guest_id());

-- Hosts read all guests for their wedding
CREATE POLICY "Hosts read wedding guests" ON guests
  FOR SELECT USING (is_wedding_host(wedding_id));

-- Hosts can update guest table assignments
CREATE POLICY "Hosts update guest seating" ON guests
  FOR UPDATE USING (is_wedding_host(wedding_id))
  WITH CHECK (is_wedding_host(wedding_id));

-- ============================================
-- ANNOUNCEMENTS
-- ============================================
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Guests read announcements for their wedding
CREATE POLICY "Guests read wedding announcements" ON announcements
  FOR SELECT USING (wedding_id = current_wedding_id());

-- Hosts manage announcements
CREATE POLICY "Hosts manage announcements" ON announcements
  FOR ALL USING (is_wedding_host(wedding_id));

-- ============================================
-- ANNOUNCEMENT READS
-- ============================================
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- Guests read own reads
CREATE POLICY "Guests read own announcement reads" ON announcement_reads
  FOR SELECT USING (guest_id = current_guest_id());

-- Guests insert own reads
CREATE POLICY "Guests mark announcements read" ON announcement_reads
  FOR INSERT WITH CHECK (guest_id = current_guest_id());

-- Hosts read all reads for stats
CREATE POLICY "Hosts read announcement reads" ON announcement_reads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM announcements a
      WHERE a.id = announcement_reads.announcement_id
      AND is_wedding_host(a.wedding_id)
    )
  );

-- ============================================
-- PHOTOS
-- ============================================
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Guests read non-hidden photos for their wedding
CREATE POLICY "Guests read wedding photos" ON photos
  FOR SELECT USING (
    wedding_id = current_wedding_id()
    AND NOT is_hidden
  );

-- Guests upload photos to their wedding
CREATE POLICY "Guests upload photos" ON photos
  FOR INSERT WITH CHECK (
    wedding_id = current_wedding_id()
    AND guest_id = current_guest_id()
  );

-- Guests update own photos (caption)
CREATE POLICY "Guests update own photos" ON photos
  FOR UPDATE USING (guest_id = current_guest_id())
  WITH CHECK (guest_id = current_guest_id());

-- Hosts manage all photos (moderate: hide/unhide, delete)
CREATE POLICY "Hosts manage wedding photos" ON photos
  FOR ALL USING (is_wedding_host(wedding_id));

-- ============================================
-- PHOTO LIKES
-- ============================================
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;

-- Guests read likes for their wedding photos
CREATE POLICY "Guests read photo likes" ON photo_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM photos p
      WHERE p.id = photo_likes.photo_id
      AND p.wedding_id = current_wedding_id()
      AND NOT p.is_hidden
    )
  );

-- Guests like/unlike photos
CREATE POLICY "Guests like photos" ON photo_likes
  FOR INSERT WITH CHECK (
    guest_id = current_guest_id()
    AND EXISTS (
      SELECT 1 FROM photos p
      WHERE p.id = photo_likes.photo_id
      AND p.wedding_id = current_wedding_id()
      AND NOT p.is_hidden
    )
  );

CREATE POLICY "Guests unlike photos" ON photo_likes
  FOR DELETE USING (guest_id = current_guest_id());

-- Hosts read all likes for stats
CREATE POLICY "Hosts read photo likes" ON photo_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM photos p
      WHERE p.id = photo_likes.photo_id
      AND is_wedding_host(p.wedding_id)
    )
  );

-- ============================================
-- MESSAGES
-- ============================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Guests read non-hidden messages for their wedding
CREATE POLICY "Guests read wedding messages" ON messages
  FOR SELECT USING (
    wedding_id = current_wedding_id()
    AND NOT is_hidden
  );

-- Guests send messages
CREATE POLICY "Guests send messages" ON messages
  FOR INSERT WITH CHECK (
    wedding_id = current_wedding_id()
    AND guest_id = current_guest_id()
    AND NOT is_broadcast -- guests can't broadcast
  );

-- Guests update own messages (edit/delete)
CREATE POLICY "Guests update own messages" ON messages
  FOR UPDATE USING (guest_id = current_guest_id())
  WITH CHECK (guest_id = current_guest_id());

CREATE POLICY "Guests delete own messages" ON messages
  FOR DELETE USING (guest_id = current_guest_id());

-- Hosts manage all messages (moderate, broadcast)
CREATE POLICY "Hosts manage wedding messages" ON messages
  FOR ALL USING (is_wedding_host(wedding_id));

-- ============================================
-- TABLES
-- ============================================
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Guests read tables for their wedding
CREATE POLICY "Guests read wedding tables" ON tables
  FOR SELECT USING (wedding_id = current_wedding_id());

-- Hosts manage tables
CREATE POLICY "Hosts manage wedding tables" ON tables
  FOR ALL USING (is_wedding_host(wedding_id));

-- ============================================
-- CHALLENGES
-- ============================================
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Guests read challenges for their wedding
CREATE POLICY "Guests read wedding challenges" ON challenges
  FOR SELECT USING (wedding_id = current_wedding_id());

-- Hosts manage challenges
CREATE POLICY "Hosts manage wedding challenges" ON challenges
  FOR ALL USING (is_wedding_host(wedding_id));

-- ============================================
-- CHALLENGE COMPLETIONS
-- ============================================
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;

-- Guests read completions for their wedding challenges
CREATE POLICY "Guests read challenge completions" ON challenge_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM challenges c
      WHERE c.id = challenge_completions.challenge_id
      AND c.wedding_id = current_wedding_id()
    )
  );

-- Guests complete challenges (honor system)
CREATE POLICY "Guests complete challenges" ON challenge_completions
  FOR INSERT WITH CHECK (
    guest_id = current_guest_id()
    AND EXISTS (
      SELECT 1 FROM challenges c
      WHERE c.id = challenge_completions.challenge_id
      AND c.wedding_id = current_wedding_id()
    )
  );

-- Hosts read all completions for leaderboard
CREATE POLICY "Hosts read challenge completions" ON challenge_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM challenges c
      WHERE c.id = challenge_completions.challenge_id
      AND is_wedding_host(c.wedding_id)
    )
  );

-- ============================================
-- INFO SECTIONS
-- ============================================
ALTER TABLE info_sections ENABLE ROW LEVEL SECURITY;

-- Guests read info for their wedding
CREATE POLICY "Guests read wedding info" ON info_sections
  FOR SELECT USING (wedding_id = current_wedding_id());

-- Hosts manage info
CREATE POLICY "Hosts manage wedding info" ON info_sections
  FOR ALL USING (is_wedding_host(wedding_id));

-- ============================================
-- PUSH SUBSCRIPTIONS
-- ============================================
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Guests manage own subscriptions
CREATE POLICY "Guests manage own push subscriptions" ON push_subscriptions
  FOR ALL USING (guest_id = current_guest_id());

-- Hosts read subscriptions for sending pushes
CREATE POLICY "Hosts read push subscriptions" ON push_subscriptions
  FOR SELECT USING (is_wedding_host(wedding_id));