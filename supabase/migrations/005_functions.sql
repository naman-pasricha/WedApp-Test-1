-- WedApp Edge Functions Setup
-- Migration 005: Helper functions and RPC endpoints

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get wedding by slug (public, for join flow)
CREATE OR REPLACE FUNCTION get_wedding_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name TEXT,
  date DATE,
  timezone TEXT,
  theme JSONB,
  hero_image_url TEXT
) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT w.id, w.slug, w.name, w.date, w.timezone, w.theme, w.hero_image_url
  FROM weddings w
  WHERE w.slug = p_slug;
$$;

-- Get wedding with full theme (for guest app)
CREATE OR REPLACE FUNCTION get_wedding_for_guest(p_slug TEXT)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'id', w.id,
    'slug', w.slug,
    'name', w.name,
    'date', w.date,
    'timezone', w.timezone,
    'theme', w.theme,
    'hero_image_url', w.hero_image_url
  )
  FROM weddings w
  WHERE w.slug = p_slug;
$$;

-- Join wedding as guest (creates guest session)
CREATE OR REPLACE FUNCTION join_wedding(
  p_wedding_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_device_id TEXT
) RETURNS TABLE (
  id UUID,
  session_token TEXT,
  table_id UUID
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_session_token TEXT;
  v_guest_id UUID;
BEGIN
  v_session_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO guests (wedding_id, name, phone, device_id, session_token)
  VALUES (p_wedding_id, p_name, p_phone, p_device_id, v_session_token)
  ON CONFLICT (wedding_id, device_id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    session_token = EXCLUDED.session_token,
    last_seen_at = now()
  RETURNING id, session_token, table_id
  INTO v_guest_id, v_session_token, table_id;

  RETURN QUERY SELECT v_guest_id, v_session_token, table_id;
END;
$$;

-- Update guest last_seen
CREATE OR REPLACE FUNCTION update_guest_last_seen(p_guest_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE guests SET last_seen_at = now() WHERE id = p_guest_id;
$$;

-- Get guest session by token (for API auth)
CREATE OR REPLACE FUNCTION get_guest_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  wedding_id UUID,
  name TEXT,
  phone TEXT,
  device_id TEXT,
  table_id UUID
) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT g.id, g.wedding_id, g.name, g.phone, g.device_id, g.table_id
  FROM guests g
  WHERE g.session_token = p_token;
$$;

-- Mark announcement as read
CREATE OR REPLACE FUNCTION mark_announcement_read(p_announcement_id UUID, p_guest_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO announcement_reads (announcement_id, guest_id)
  VALUES (p_announcement_id, p_guest_id)
  ON CONFLICT DO NOTHING;
$$;

-- Get announcement read count (for host stats)
CREATE OR REPLACE FUNCTION get_announcement_read_count(p_announcement_id UUID)
RETURNS BIGINT LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*) FROM announcement_reads WHERE announcement_id = p_announcement_id;
$$;

-- Like/unlike photo
CREATE OR REPLACE FUNCTION toggle_photo_like(p_photo_id UUID, p_guest_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM photo_likes WHERE photo_id = p_photo_id AND guest_id = p_guest_id)
  INTO v_exists;

  IF v_exists THEN
    DELETE FROM photo_likes WHERE photo_id = p_photo_id AND guest_id = p_guest_id;
    RETURN FALSE;
  ELSE
    INSERT INTO photo_likes (photo_id, guest_id) VALUES (p_photo_id, p_guest_id);
    RETURN TRUE;
  END IF;
END;
$$;

-- Get photo like count
CREATE OR REPLACE FUNCTION get_photo_like_count(p_photo_id UUID)
RETURNS BIGINT LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*) FROM photo_likes WHERE photo_id = p_photo_id;
$$;

-- Check if guest liked photo
CREATE OR REPLACE FUNCTION guest_liked_photo(p_photo_id UUID, p_guest_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM photo_likes WHERE photo_id = p_photo_id AND guest_id = p_guest_id);
$$;

-- Complete challenge (honor system)
CREATE OR REPLACE FUNCTION complete_challenge(p_challenge_id UUID, p_guest_id UUID, p_photo_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  completed_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  INSERT INTO challenge_completions (challenge_id, guest_id, photo_id)
  VALUES (p_challenge_id, p_guest_id, p_photo_id)
  ON CONFLICT (challenge_id, guest_id) DO UPDATE SET
    photo_id = EXCLUDED.photo_id,
    completed_at = now()
  RETURNING id, completed_at;
END;
$$;

-- Get guest challenge completions
CREATE OR REPLACE FUNCTION get_guest_completions(p_guest_id UUID)
RETURNS TABLE (
  challenge_id UUID,
  completed_at TIMESTAMPTZ
) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT challenge_id, completed_at
  FROM challenge_completions
  WHERE guest_id = p_guest_id;
$$;

-- Get leaderboard for wedding
CREATE OR REPLACE FUNCTION get_wedding_leaderboard(p_wedding_id UUID)
RETURNS TABLE (
  guest_id UUID,
  guest_name TEXT,
  total_points BIGINT,
  completed_count BIGINT
) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    g.id AS guest_id,
    g.name AS guest_name,
    COALESCE(SUM(c.points), 0) AS total_points,
    COUNT(cc.id) AS completed_count
  FROM guests g
  LEFT JOIN challenge_completions cc ON cc.guest_id = g.id
  LEFT JOIN challenges c ON c.id = cc.challenge_id AND c.wedding_id = p_wedding_id
  WHERE g.wedding_id = p_wedding_id
  GROUP BY g.id, g.name
  ORDER BY total_points DESC, completed_count DESC;
$$;

-- Get wedding stats (for host dashboard)
CREATE OR REPLACE FUNCTION get_wedding_stats(p_wedding_id UUID)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'guests_joined', (SELECT COUNT(*) FROM guests WHERE wedding_id = p_wedding_id),
    'photos_uploaded', (SELECT COUNT(*) FROM photos WHERE wedding_id = p_wedding_id AND NOT is_hidden),
    'announcements_sent', (SELECT COUNT(*) FROM announcements WHERE wedding_id = p_wedding_id),
    'total_announcement_reads', (
      SELECT COUNT(*) FROM announcement_reads ar
      JOIN announcements a ON a.id = ar.announcement_id
      WHERE a.wedding_id = p_wedding_id
    ),
    'messages_sent', (SELECT COUNT(*) FROM messages WHERE wedding_id = p_wedding_id AND NOT is_hidden),
    'challenges_completed', (
      SELECT COUNT(*) FROM challenge_completions cc
      JOIN challenges c ON c.id = cc.challenge_id
      WHERE c.wedding_id = p_wedding_id
    )
  );
$$;

-- Generate QR code data URL (returns base64 PNG)
CREATE OR REPLACE FUNCTION generate_qr_code(p_url TEXT, p_size INT DEFAULT 512)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_qr_data TEXT;
BEGIN
  -- This is a placeholder - actual QR generation happens in Edge Function
  -- Postgres doesn't have native QR generation
  RETURN 'data:image/png;base64,placeholder';
END;
$$;