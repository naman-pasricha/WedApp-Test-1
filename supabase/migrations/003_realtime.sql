-- WedApp Realtime Configuration
-- Migration 003: Enable realtime for tables that need live updates

-- Enable realtime for announcements (live feed)
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;

-- Enable realtime for photos (live gallery updates)
ALTER PUBLICATION supabase_realtime ADD TABLE photos;

-- Enable realtime for photo_likes (live like counts)
ALTER PUBLICATION supabase_realtime ADD TABLE photo_likes;

-- Enable realtime for messages (live chat)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for challenge_completions (live leaderboard)
ALTER PUBLICATION supabase_realtime ADD TABLE challenge_completions;

-- Enable realtime for guests (live guest count)
ALTER PUBLICATION supabase_realtime ADD TABLE guests;

-- ============================================
-- REALTIME FILTERS (optional, for performance)
-- ============================================
-- These can be added later if needed to filter by wedding_id
-- For now, clients subscribe with filters in the frontend