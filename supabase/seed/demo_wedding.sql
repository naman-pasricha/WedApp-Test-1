-- WedApp Demo Wedding Seed Data
-- Run this after migrations to populate a demo wedding

-- ============================================
-- CREATE DEMO WEDDING
-- ============================================
DO $$
DECLARE
  v_wedding_id UUID;
  v_host_id UUID := '00000000-0000-0000-0000-000000000000'::uuid; -- Replace with actual auth user ID after signup
BEGIN
  -- Insert wedding (using a fixed UUID for consistent demo)
  INSERT INTO weddings (id, slug, host_id, name, date, timezone, theme, hero_image_url)
  VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'anya-raj',
    v_host_id,
    'Anya & Raj',
    '2025-02-14',
    'Asia/Kolkata',
    '{
      "colors": {
        "primary": "#C4785E",
        "primaryForeground": "#FFFFFF",
        "secondary": "#E8D5C4",
        "secondaryForeground": "#3D3D3D",
        "accent": "#D4A574",
        "accentForeground": "#FFFFFF",
        "background": "#FFF8F3",
        "surface": "#FFFFFF",
        "surfaceElevated": "#FFFFFF",
        "border": "#E8D5C4",
        "muted": "#F5EDE5",
        "mutedForeground": "#8B7D6B"
      },
      "fonts": {
        "heading": "\"Playfair Display\", Georgia, serif",
        "body": "\"DM Sans\", -apple-system, BlinkMacSystemFont, sans-serif",
        "accent": "\"Great Vibes\", cursive"
      },
      "spacing": {
        "base": 4,
        "scale": [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24]
      },
      "radius": {
        "sm": "8px",
        "md": "16px",
        "lg": "24px",
        "full": "9999px"
      },
      "shadows": {
        "sm": "0 1px 2px rgba(0,0,0,0.05)",
        "md": "0 4px 12px rgba(0,0,0,0.08)",
        "lg": "0 12px 24px rgba(0,0,0,0.1)",
        "xl": "0 20px 40px rgba(0,0,0,0.12)"
      },
      "components": {
        "card": {
          "background": "var(--color-surface)",
          "border": "1px solid var(--color-border)",
          "shadow": "var(--shadow-md)",
          "padding": "var(--space-6)",
          "imageRadius": "var(--radius-md)"
        },
        "button": {
          "primaryBackground": "var(--color-primary)",
          "primaryForeground": "var(--color-primary-foreground)",
          "secondaryBackground": "var(--color-secondary)",
          "secondaryForeground": "var(--color-secondary-foreground)",
          "radius": "var(--radius-full)",
          "padding": "var(--space-3) var(--space-6)"
        },
        "bottomNav": {
          "background": "var(--color-surface-elevated)",
          "borderTop": "1px solid var(--color-border)",
          "activeColor": "var(--color-primary)",
          "inactiveColor": "var(--color-muted-foreground)",
          "height": "88px",
          "cameraButtonSize": "64px"
        },
        "cameraButton": {
          "background": "var(--color-primary)",
          "foreground": "var(--color-primary-foreground)",
          "shadow": "var(--shadow-lg)",
          "border": "4px solid var(--color-background)"
        },
        "eventCard": {
          "background": "var(--color-surface)",
          "border": "1px solid var(--color-border)",
          "shadow": "var(--shadow-md)",
          "imageRadius": "var(--radius-lg)",
          "timeColor": "var(--color-primary)",
          "accentBarWidth": "4px"
        },
        "announcement": {
          "background": "var(--color-surface)",
          "border": "1px solid var(--color-border)",
          "shadow": "var(--shadow-sm)",
          "titleColor": "var(--color-primary)",
          "unreadIndicator": "var(--color-accent)"
        },
        "photoGrid": {
          "gap": "var(--space-3)",
          "columns": 2,
          "itemRadius": "var(--radius-md)",
          "overlayBackground": "rgba(0,0,0,0.4)"
        },
        "chat": {
          "background": "var(--color-background)",
          "bubbleBackground": "var(--color-surface)",
          "bubbleForeground": "var(--color-primary-foreground)",
          "ownBubbleBackground": "var(--color-primary)",
          "ownBubbleForeground": "var(--color-primary-foreground)",
          "broadcastBackground": "var(--color-accent)",
          "broadcastForeground": "var(--color-accent-foreground)",
          "inputBackground": "var(--color-surface)",
          "border": "1px solid var(--color-border)"
        },
        "seating": {
          "tableBackground": "var(--color-surface)",
          "tableBorder": "1px solid var(--color-border)",
          "tableShadow": "var(--shadow-md)",
          "seatBackground": "var(--color-muted)",
          "seatForeground": "var(--color-muted-foreground)",
          "currentGuestHighlight": "var(--color-primary)"
        },
        "challenge": {
          "background": "var(--color-surface)",
          "border": "1px solid var(--color-border)",
          "shadow": "var(--shadow-md)",
          "completedBackground": "var(--color-primary)",
          "completedForeground": "var(--color-primary-foreground)",
          "pointsColor": "var(--color-accent)"
        }
      },
      "backgroundPattern": "dots",
      "backgroundPatternOpacity": 0.04,
      "heroStyle": "gradient"
    }'::jsonb,
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80'
  ) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    date = EXCLUDED.date,
    theme = EXCLUDED.theme,
    hero_image_url = EXCLUDED.hero_image_url
  RETURNING id INTO v_wedding_id;

  IF v_wedding_id IS NULL THEN
    SELECT id INTO v_wedding_id FROM weddings WHERE slug = 'anya-raj';
  END IF;

  RAISE NOTICE 'Wedding ID: %', v_wedding_id;

  -- ============================================
  -- EVENTS (itinerary)
  -- ============================================
  INSERT INTO events (wedding_id, title, description, starts_at, ends_at, venue_name, venue_address, venue_lat, venue_lng, dress_code, illustration_url, display_order) VALUES
  (v_wedding_id, 'Mehndi', 'Traditional henna ceremony with music and dance', '2025-02-12 16:00:00+05:30', '2025-02-12 20:00:00+05:30', 'The Garden Pavilion', '123 Palace Road, Jaipur', 26.9124, 75.7873, 'Bright colors, comfortable ethnic wear', 'https://images.unsplash.com/photo-1583939003579-783e7e8b3d8b?w=400&q=80', 1),
  (v_wedding_id, 'Haldi', 'Turmeric ceremony - messy, fun, and auspicious', '2025-02-13 10:00:00+05:30', '2025-02-13 12:00:00+05:30', 'Family Courtyard', '123 Palace Road, Jaipur', 26.9124, 75.7873, 'Yellow/white clothes you dont mind getting stained', 'https://images.unsplash.com/photo-1605258763541-eee81c2f7c7b?w=400&q=80', 2),
  (v_wedding_id, 'Sangeet', 'Musical night with performances by family and friends', '2025-02-13 19:00:00+05:30', '2025-02-13 23:00:00+05:30', 'The Grand Ballroom', '456 Heritage Hotel, Jaipur', 26.9156, 75.7921, 'Glitter and glam - Indian festive wear', 'https://images.unsplash.com/photo-1519183071298-a2962be91a76?w=400&q=80', 3),
  (v_wedding_id, 'Wedding Ceremony', 'The main ceremony - pheras, vows, and blessings', '2025-02-14 16:30:00+05:30', '2025-02-14 19:30:00+05:30', 'The Mandap Garden', '456 Heritage Hotel, Jaipur', 26.9156, 75.7921, 'Traditional Indian attire (sherwani/lehenga)', 'https://images.unsplash.com/photo-1597645587822-e99fa5d45d25?w=400&q=80', 4),
  (v_wedding_id, 'Reception', 'Celebration dinner, speeches, and dancing', '2025-02-14 20:00:00+05:30', '2025-02-15 00:00:00+05:30', 'The Grand Ballroom', '456 Heritage Hotel, Jaipur', 26.9156, 75.7921, 'Cocktail / Indo-western formal', 'https://images.unsplash.com/photo-1511795409834-ef3457b4d4f8?w=400&q=80', 5),
  (v_wedding_id, 'Brunch & Farewell', 'Relaxed brunch before guests depart', '2025-02-15 10:30:00+05:30', '2025-02-15 13:00:00+05:30', 'Poolside Terrace', '456 Heritage Hotel, Jaipur', 26.9156, 75.7921, 'Smart casual', 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400&q=80', 6)
  ON CONFLICT DO NOTHING;

  -- ============================================
  -- TABLES & SEATING
  -- ============================================
  INSERT INTO tables (wedding_id, name, capacity, display_order) VALUES
  (v_wedding_id, 'Table 1 - Family (Bride)', 10, 1),
  (v_wedding_id, 'Table 2 - Family (Groom)', 10, 2),
  (v_wedding_id, 'Table 3 - Childhood Friends', 10, 3),
  (v_wedding_id, 'Table 4 - College Friends', 10, 4),
  (v_wedding_id, 'Table 5 - Work Colleagues', 10, 5),
  (v_wedding_id, 'Table 6 - Extended Family', 10, 6),
  (v_wedding_id, 'Table 7 - Extended Family', 10, 7),
  (v_wedding_id, 'Table 8 - Mixed Friends', 10, 8),
  (v_wedding_id, 'Table 9 - Mixed Friends', 10, 9),
  (v_wedding_id, 'Table 10 - VIPs & Elders', 8, 10)
  ON CONFLICT DO NOTHING;

  -- ============================================
  -- CHALLENGES (Games tab)
  -- ============================================
  INSERT INTO challenges (wedding_id, title, description, points, icon, display_order) VALUES
  (v_wedding_id, 'Photo with the Bride', 'Take a selfie with Anya', 10, '👰', 1),
  (v_wedding_id, 'Photo with the Groom', 'Take a selfie with Raj', 10, '🤵', 2),
  (v_wedding_id, 'Photo with Both Sides', 'Get a group photo with both families', 20, '👨‍👩‍👧‍👦', 3),
  (v_wedding_id, 'Dance Floor Star', 'Show us your best moves on the dance floor', 15, '💃', 4),
  (v_wedding_id, 'Mehndi Masterpiece', 'Show off your henna design', 10, '🎨', 5),
  (v_wedding_id, 'Best Dressed', 'Wear the most stunning outfit', 15, '✨', 6),
  (v_wedding_id, 'Foodie Explorer', 'Try every dish at the reception', 10, '🍛', 7),
  (v_wedding_id, 'Story Collector', 'Collect 3 funny stories about the couple', 20, '📖', 8),
  (v_wedding_id, 'Group Selfie Champion', 'Take selfies with 10 different guests', 15, '🤳', 9),
  (v_wedding_id, 'Sunrise Survivor', 'Stay till the farewell brunch', 10, '🌅', 10)
  ON CONFLICT DO NOTHING;

  -- ============================================
  -- INFO SECTIONS
  -- ============================================
  INSERT INTO info_sections (wedding_id, title, content, icon, display_order) VALUES
  (v_wedding_id, 'Accommodation', '# Recommended Hotels

## Heritage Palace Hotel (Primary)
**Address:** 456 Heritage Hotel, Jaipur
**Distance:** Venue location
**Booking:** Use code "ANYARAJ25" for 15% off
**Contact:** +91-141-XXXXXXX

## Budget Options
- **Hotel Pearl Palace** - 2km away, ₹3,000/night
- **Zostel Jaipur** - Hostel, 3km away, ₹800/night (dorms)
- **Airbnb** - Several options in Bani Park area', '🏨', 1),

  (v_wedding_id, 'Transport', '# Getting Around

## From Airport (JAI - Jaipur International)
- **Prepaid Taxi:** ₹400-500 to city center (20 mins)
- **Uber/Ola:** Available, ~₹300-400
- **Hotel Pickup:** Ask your hotel about airport transfer

## Local Transport
- **Auto-rickshaws:** Negotiate before ride (~₹50-150 within city)
- **Uber/Ola:** Most reliable, AC cars
- **Shuttle Service:** We will run shuttles between hotels and venues on event days (schedule TBD)

## Parking
Valet available at Heritage Hotel. Limited street parking near Garden Pavilion.', '🚗', 2),

  (v_wedding_id, 'FAQs', '# Frequently Asked Questions

## What should I wear?
Each event has a dress code listed in the itinerary. When in doubt: colorful Indian festive wear!

## Can I bring a plus one?
Please check your invitation. Due to venue capacity, we may not be able to accommodate unlisted guests.

## Is there WiFi?
Yes! Network: **HeritageGuest** | Password: **AnyaRaj2025**

## What about kids?
Children under 12 are welcome at all events. We will have a kids corner at the Sangeet and Reception.

## Dietary restrictions?
Please let us know via the chat or message us directly. The caterers can accommodate vegetarian, vegan, gluten-free, and nut-free needs.

## Emergency contact?
**Wedding Planner:** Priya Sharma - +91-98765-43210
**Venue Manager:** Rajesh Ji - +91-98765-43211', '❓', 3),

  (v_wedding_id, 'Emergency Contacts', '# Emergency Information

## Medical
- **Fortis Escorts Hospital** - 5 min drive | +91-141-254-7000
- **SMS Hospital (Government)** - 10 min drive | +91-141-256-0141
- **Nearest Pharmacy:** Apollo Pharmacy, MI Road (24 hrs)

## Police
- **Tourist Police:** +91-141-237-4694
- **Local Police Station (Bani Park):** +91-141-220-1234

## Fire
- **Fire Station:** +91-141-237-4694

## Wedding Team
- **Planner (Priya):** +91-98765-43210
- **Coordinator (Amit):** +91-98765-43211
- **Bride Sister (Meera):** +91-98765-43212
- **Groom Brother (Karan):** +91-98765-43213', '🚨', 4)

  ON CONFLICT DO NOTHING;

  -- ============================================
  -- SAMPLE ANNOUNCEMENTS
  -- ============================================
  INSERT INTO announcements (wedding_id, title, body, sent_by, send_push, created_at) VALUES
  (v_wedding_id, 'Welcome to Anya & Raj''s Wedding!', 'We are so thrilled you are here. Open this app for the full schedule, share photos, chat with other guests, and stay updated. Let the celebrations begin! 🎉', v_host_id, true, '2025-02-12 08:00:00+05:30'),
  (v_wedding_id, 'Mehndi Starts in 30 Minutes!', 'Head to the Garden Pavilion. Dont forget to get your henna done! 🌿', v_host_id, true, '2025-02-12 15:30:00+05:30'),
  (v_wedding_id, 'Sangeet Tonight at 7 PM', 'The Grand Ballroom doors open at 6:30 PM. Drinks and appetizers will be served. Get ready to dance! 💃', v_host_id, false, '2025-02-13 12:00:00+05:30'),
  (v_wedding_id, 'Ceremony Reminder', 'The wedding ceremony begins at 4:30 PM sharp at the Mandap Garden. Please be seated by 4:15 PM. 🙏', v_host_id, true, '2025-02-14 14:00:00+05:30')
  ON CONFLICT DO NOTHING;

END $$;