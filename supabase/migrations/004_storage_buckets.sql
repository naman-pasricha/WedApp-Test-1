-- WedApp Storage Buckets
-- Migration 004: Create storage buckets with RLS policies
-- Safe to re-run: buckets are upserted and policies are dropped before being recreated.

-- ============================================
-- BUCKETS
-- ============================================

-- Wedding assets: hero images, event illustrations
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wedding-assets',
  'wedding-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Guest photos: shared album uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guest-photos',
  'guest-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Chat images: inline images in messages
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Drop any existing versions so this file can be re-run
DROP POLICY IF EXISTS "Public read wedding assets" ON storage.objects;
DROP POLICY IF EXISTS "Hosts upload wedding assets" ON storage.objects;
DROP POLICY IF EXISTS "Hosts update wedding assets" ON storage.objects;
DROP POLICY IF EXISTS "Hosts delete wedding assets" ON storage.objects;
DROP POLICY IF EXISTS "Guests read guest photos" ON storage.objects;
DROP POLICY IF EXISTS "Guests upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Guests update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Hosts manage all guest photos" ON storage.objects;
DROP POLICY IF EXISTS "Guests read chat images" ON storage.objects;
DROP POLICY IF EXISTS "Guests upload chat images" ON storage.objects;
DROP POLICY IF EXISTS "Hosts manage chat images" ON storage.objects;

-- Wedding Assets: Public read, hosts write
CREATE POLICY "Public read wedding assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'wedding-assets');

CREATE POLICY "Hosts upload wedding assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'wedding-assets'
    AND EXISTS (
      SELECT 1 FROM weddings w
      JOIN wedding_hosts wh ON wh.wedding_id = w.id
      WHERE wh.user_id = auth.uid()
      AND (storage.foldername(name))[1] = w.id::text
    )
  );

CREATE POLICY "Hosts update wedding assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'wedding-assets'
    AND EXISTS (
      SELECT 1 FROM weddings w
      JOIN wedding_hosts wh ON wh.wedding_id = w.id
      WHERE wh.user_id = auth.uid()
      AND (storage.foldername(name))[1] = w.id::text
    )
  );

CREATE POLICY "Hosts delete wedding assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'wedding-assets'
    AND EXISTS (
      SELECT 1 FROM weddings w
      JOIN wedding_hosts wh ON wh.wedding_id = w.id
      WHERE wh.user_id = auth.uid()
      AND (storage.foldername(name))[1] = w.id::text
    )
  );

-- Guest Photos: Authenticated guests read, guests upload to their wedding
CREATE POLICY "Guests read guest photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'guest-photos'
    AND (storage.foldername(name))[1] = current_setting('app.current_wedding_id', true)
  );

CREATE POLICY "Guests upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'guest-photos'
    AND (storage.foldername(name))[1] = current_setting('app.current_wedding_id', true)
    AND (storage.foldername(name))[2] = current_setting('app.current_guest_id', true)
  );

CREATE POLICY "Guests update own photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'guest-photos'
    AND (storage.foldername(name))[2] = current_setting('app.current_guest_id', true)
  );

CREATE POLICY "Hosts manage all guest photos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'guest-photos'
    AND EXISTS (
      SELECT 1 FROM weddings w
      JOIN wedding_hosts wh ON wh.wedding_id = w.id
      WHERE wh.user_id = auth.uid()
      AND (storage.foldername(name))[1] = w.id::text
    )
  );

-- Chat Images: Guests read, guests/hosts upload
CREATE POLICY "Guests read chat images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-images'
    AND (storage.foldername(name))[1] = current_setting('app.current_wedding_id', true)
  );

CREATE POLICY "Guests upload chat images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-images'
    AND (storage.foldername(name))[1] = current_setting('app.current_wedding_id', true)
    AND (
      (storage.foldername(name))[2] = current_setting('app.current_guest_id', true)
      OR EXISTS (
        SELECT 1 FROM weddings w
        JOIN wedding_hosts wh ON wh.wedding_id = w.id
        WHERE wh.user_id = auth.uid()
        AND (storage.foldername(name))[1] = w.id::text
      )
    )
  );

CREATE POLICY "Hosts manage chat images" ON storage.objects
  FOR ALL USING (
    bucket_id = 'chat-images'
    AND EXISTS (
      SELECT 1 FROM weddings w
      JOIN wedding_hosts wh ON wh.wedding_id = w.id
      WHERE wh.user_id = auth.uid()
      AND (storage.foldername(name))[1] = w.id::text
    )
  );