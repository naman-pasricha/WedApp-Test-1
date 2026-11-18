// Seed Demo Wedding Data
// Run with: npx tsx scripts/seed-demo.ts

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDemo() {
  console.log('🌱 Seeding demo wedding...');

  // Check if demo wedding already exists
  const { data: existing } = await supabase
    .from('weddings')
    .select('id')
    .eq('slug', 'anya-raj')
    .single();

  let weddingId: string;

  if (existing) {
    console.log('✅ Demo wedding already exists:', existing.id);
    weddingId = existing.id;
  } else {
    // Create demo wedding
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .insert({
        slug: 'anya-raj',
        host_id: null,
        name: 'Anya & Raj',
        date: '2025-02-14',
        timezone: 'Asia/Kolkata',
        theme: {
          colors: {
            primary: '#C4785E',
            primaryForeground: '#FFFFFF',
            secondary: '#E8D5C4',
            secondaryForeground: '#3D3D3D',
            accent: '#D4A574',
            accentForeground: '#FFFFFF',
            background: '#FFF8F3',
            surface: '#FFFFFF',
            surfaceElevated: '#FFFFFF',
            border: '#E8D5C4',
            muted: '#F5EDE5',
            mutedForeground: '#8B7D6B',
          },
          fonts: {
            heading: '"Playfair Display", Georgia, serif',
            body: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
            accent: '"Great Vibes", cursive',
          },
          spacing: { base: 4, scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24] },
          radius: { sm: '8px', md: '16px', lg: '24px', full: '9999px' },
          shadows: {
            sm: '0 1px 2px rgba(0,0,0,0.05)',
            md: '0 4px 12px rgba(0,0,0,0.08)',
            lg: '0 12px 24px rgba(0,0,0,0.1)',
            xl: '0 20px 40px rgba(0,0,0,0.12)',
          },
          components: {
            card: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', shadow: 'var(--shadow-md)', padding: 'var(--space-6)', imageRadius: 'var(--radius-md)' },
            button: { primaryBackground: 'var(--color-primary)', primaryForeground: 'var(--color-primary-foreground)', secondaryBackground: 'var(--color-secondary)', secondaryForeground: 'var(--color-secondary-foreground)', radius: 'var(--radius-full)', padding: 'var(--space-3) var(--space-6)' },
            bottomNav: { background: 'var(--color-surface-elevated)', borderTop: '1px solid var(--color-border)', activeColor: 'var(--color-primary)', inactiveColor: 'var(--color-muted-foreground)', height: '88px', cameraButtonSize: '64px' },
            cameraButton: { background: 'var(--color-primary)', foreground: 'var(--color-primary-foreground)', shadow: 'var(--shadow-lg)', border: '4px solid var(--color-background)' },
            eventCard: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', shadow: 'var(--shadow-md)', imageRadius: 'var(--radius-lg)', timeColor: 'var(--color-primary)', accentBarWidth: '4px' },
            announcement: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', shadow: 'var(--shadow-sm)', titleColor: 'var(--color-primary)', unreadIndicator: 'var(--color-accent)' },
            photoGrid: { gap: 'var(--space-3)', columns: 2, itemRadius: 'var(--radius-md)', overlayBackground: 'rgba(0,0,0,0.4)' },
            chat: { background: 'var(--color-background)', bubbleBackground: 'var(--color-surface)', bubbleForeground: 'var(--color-primary-foreground)', ownBubbleBackground: 'var(--color-primary)', ownBubbleForeground: 'var(--color-primary-foreground)', broadcastBackground: 'var(--color-accent)', broadcastForeground: 'var(--color-accent-foreground)', inputBackground: 'var(--color-surface)', border: '1px solid var(--color-border)' },
            seating: { tableBackground: 'var(--color-surface)', tableBorder: '1px solid var(--color-border)', tableShadow: 'var(--shadow-md)', seatBackground: 'var(--color-muted)', seatForeground: 'var(--color-muted-foreground)', currentGuestHighlight: 'var(--color-primary)' },
            challenge: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', shadow: 'var(--shadow-md)', completedBackground: 'var(--color-primary)', completedForeground: 'var(--color-primary-foreground)', pointsColor: 'var(--color-accent)' },
          },
          backgroundPattern: 'dots',
          backgroundPatternOpacity: 0.04,
          heroStyle: 'gradient',
        },
        hero_image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
      })
      .select()
      .single();

    if (weddingError || !wedding) {
      console.error('❌ Failed to create wedding:', weddingError);
      process.exit(1);
    }

    weddingId = wedding.id;
    console.log('✅ Created wedding:', weddingId);
  }

  // Seed events
  console.log('📅 Seeding events...');
  const events = [
    { title: 'Mehndi', description: 'Traditional henna ceremony with music and dance', starts_at: '2025-02-12T16:00:00+05:30', ends_at: '2025-02-12T20:00:00+05:30', venue_name: 'The Garden Pavilion', venue_address: '123 Palace Road, Jaipur', venue_lat: 26.9124, venue_lng: 75.7873, dress_code: 'Bright colors, comfortable ethnic wear', illustration_url: 'https://images.unsplash.com/photo-1583939003579-783e7e8b3d8b?w=400&q=80', display_order: 1 },
    { title: 'Haldi', description: 'Turmeric ceremony - messy, fun, and auspicious', starts_at: '2025-02-13T10:00:00+05:30', ends_at: '2025-02-13T12:00:00+05:30', venue_name: 'Family Courtyard', venue_address: '123 Palace Road, Jaipur', venue_lat: 26.9124, venue_lng: 75.7873, dress_code: 'Yellow/white clothes you don\'t mind getting stained', illustration_url: 'https://images.unsplash.com/photo-1605258763541-eee81c2f7c7b?w=400&q=80', display_order: 2 },
    { title: 'Sangeet', description: 'Musical night with performances by family and friends', starts_at: '2025-02-13T19:00:00+05:30', ends_at: '2025-02-13T23:00:00+05:30', venue_name: 'The Grand Ballroom', venue_address: '456 Heritage Hotel, Jaipur', venue_lat: 26.9156, venue_lng: 75.7921, dress_code: 'Glitter and glam - Indian festive wear', illustration_url: 'https://images.unsplash.com/photo-1519183071298-a2962be91a76?w=400&q=80', display_order: 3 },
    { title: 'Wedding Ceremony', description: 'The main ceremony - pheras, vows, and blessings', starts_at: '2025-02-14T16:30:00+05:30', ends_at: '2025-02-14T19:30:00+05:30', venue_name: 'The Mandap Garden', venue_address: '456 Heritage Hotel, Jaipur', venue_lat: 26.9156, venue_lng: 75.7921, dress_code: 'Traditional Indian attire (sherwani/lehenga)', illustration_url: 'https://images.unsplash.com/photo-1597645587822-e99fa5d45d25?w=400&q=80', display_order: 4 },
    { title: 'Reception', description: 'Celebration dinner, speeches, and dancing', starts_at: '2025-02-14T20:00:00+05:30', ends_at: '2025-02-15T00:00:00+05:30', venue_name: 'The Grand Ballroom', venue_address: '456 Heritage Hotel, Jaipur', venue_lat: 26.9156, venue_lng: 75.7921, dress_code: 'Cocktail / Indo-western formal', illustration_url: 'https://images.unsplash.com/photo-1511795409834-ef3457b4d4f8?w=400&q=80', display_order: 5 },
    { title: 'Brunch & Farewell', description: 'Relaxed brunch before guests depart', starts_at: '2025-02-15T10:30:00+05:30', ends_at: '2025-02-15T13:00:00+05:30', venue_name: 'Poolside Terrace', venue_address: '456 Heritage Hotel, Jaipur', venue_lat: 26.9156, venue_lng: 75.7921, dress_code: 'Smart casual', illustration_url: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400&q=80', display_order: 6 },
  ];

  for (let i = 0; i < events.length; i++) {
    const { error } = await supabase.from('events').upsert({
      wedding_id: weddingId,
      ...events[i],
    }, { onConflict: 'wedding_id,display_order' });
    if (error) console.error(`❌ Event ${i + 1} error:`, error);
  }
  console.log('✅ Events seeded');

  // Seed tables
  console.log('🪑 Seating tables...');
  const tables = Array.from({ length: 10 }, (_, i) => ({
    wedding_id: weddingId,
    name: `Table ${i + 1} - ${['Family (Bride)', 'Family (Groom)', 'Childhood Friends', 'College Friends', 'Work Colleagues', 'Extended Family', 'Extended Family', 'Mixed Friends', 'Mixed Friends', 'VIPs & Elders'][i]}`,
    capacity: i === 9 ? 8 : 10,
    display_order: i + 1,
  }));

  for (const table of tables) {
    const { error } = await supabase.from('tables').upsert(table, { onConflict: 'wedding_id,display_order' });
    if (error) console.error('❌ Table error:', error);
  }
  console.log('✅ Tables seeded');

  // Seed challenges
  console.log('🎮 Seeding challenges...');
  const challenges = [
    { title: 'Photo with the Bride', description: 'Take a selfie with Anya', points: 10, icon: '👰', display_order: 1 },
    { title: 'Photo with the Groom', description: 'Take a selfie with Raj', points: 10, icon: '🤵', display_order: 2 },
    { title: 'Photo with Both Sides', description: 'Get a group photo with both families', points: 20, icon: '👨‍👩‍👧‍👦', display_order: 3 },
    { title: 'Dance Floor Star', description: 'Show us your best moves on the dance floor', points: 15, icon: '💃', display_order: 4 },
    { title: 'Mehndi Masterpiece', description: 'Show off your henna design', points: 10, icon: '🎨', display_order: 5 },
    { title: 'Best Dressed', description: 'Wear the most stunning outfit', points: 15, icon: '✨', display_order: 6 },
    { title: 'Foodie Explorer', description: 'Try every dish at the reception', points: 10, icon: '🍛', display_order: 7 },
    { title: 'Story Collector', description: 'Collect 3 funny stories about the couple', points: 20, icon: '📖', display_order: 8 },
    { title: 'Group Selfie Champion', description: 'Take selfies with 10 different guests', points: 15, icon: '🤳', display_order: 9 },
    { title: 'Sunrise Survivor', description: 'Stay till the farewell brunch', points: 10, icon: '🌅', display_order: 10 },
  ];

  for (let i = 0; i < challenges.length; i++) {
    const { error } = await supabase.from('challenges').upsert({
      wedding_id: weddingId,
      ...challenges[i],
    }, { onConflict: 'wedding_id,display_order' });
    if (error) console.error(`❌ Challenge ${i + 1} error:`, error);
  }
  console.log('✅ Challenges seeded');

  // Seed info sections
  console.log('ℹ️ Seeding info sections...');
  const infoSections = [
    { title: 'Accommodation', content: '# Recommended Hotels\n\n## Heritage Palace Hotel (Primary)\n**Address:** 456 Heritage Hotel, Jaipur\n**Distance:** Venue location\n**Booking:** Use code "ANYARAJ25" for 15% off\n**Contact:** +91-141-XXXXXXX\n\n## Budget Options\n- **Hotel Pearl Palace** - 2km away, ₹3,000/night\n- **Zostel Jaipur** - Hostel, 3km away, ₹800/night (dorms)\n- **Airbnb** - Several options in Bani Park area', icon: '🏨', display_order: 1 },
    { title: 'Transport', content: '# Getting Around\n\n## From Airport (JAI - Jaipur International)\n- **Prepaid Taxi:** ₹400-500 to city center (20 mins)\n- **Uber/Ola:** Available, ~₹300-400\n- **Hotel Pickup:** Ask your hotel about airport transfer\n\n## Local Transport\n- **Auto-rickshaws:** Negotiate before ride (~₹50-150 within city)\n- **Uber/Ola:** Most reliable, AC cars\n- **Shuttle Service:** We will run shuttles between hotels and venues on event days (schedule TBD)\n\n## Parking\nValet available at Heritage Hotel. Limited street parking near Garden Pavilion.', icon: '🚗', display_order: 2 },
    { title: 'FAQs', content: '# Frequently Asked Questions\n\n## What should I wear?\nEach event has a dress code listed in the itinerary. When in doubt: colorful Indian festive wear!\n\n## Can I bring a plus one?\nPlease check your invitation. Due to venue capacity, we may not be able to accommodate unlisted guests.\n\n## Is there WiFi?\nYes! Network: **HeritageGuest** | Password: **AnyaRaj2025**\n\n## What about kids?\nChildren under 12 are welcome at all events. We will have a kids corner at the Sangeet and Reception.\n\n## Dietary restrictions?\nPlease let us know via the chat or message us directly. The caterers can accommodate vegetarian, vegan, gluten-free, and nut-free needs.\n\n## Emergency contact?\n**Wedding Planner:** Priya Sharma - +91-98765-43210\n**Venue Manager:** Rajesh Ji - +91-98765-43211', icon: '❓', display_order: 3 },
    { title: 'Emergency Contacts', content: '# Emergency Information\n\n## Medical\n- **Fortis Escorts Hospital** - 5 min drive | +91-141-254-7000\n- **SMS Hospital (Government)** - 10 min drive | +91-141-256-0141\n- **Nearest Pharmacy:** Apollo Pharmacy, MI Road (24 hrs)\n\n## Police\n- **Tourist Police:** +91-141-237-4694\n- **Local Police Station (Bani Park):** +91-141-220-1234\n\n## Fire\n- **Fire Station:** +91-141-237-4694\n\n## Wedding Team\n- **Planner (Priya):** +91-98765-43210\n- **Coordinator (Amit):** +91-98765-43211\n- **Bride Sister (Meera):** +91-98765-43212\n- **Groom Brother (Karan):** +91-98765-43213', icon: '🚨', display_order: 4 },
  ];

  for (let i = 0; i < infoSections.length; i++) {
    const { error } = await supabase.from('info_sections').upsert({
      wedding_id: weddingId,
      ...infoSections[i],
    }, { onConflict: 'wedding_id,display_order' });
    if (error) console.error(`❌ Info section ${i + 1} error:`, error);
  }
  console.log('✅ Info sections seeded');

  // Seed sample announcements
  console.log('📢 Seeding announcements...');
  const announcements = [
    { title: 'Welcome to Anya & Raj\'s Wedding!', body: 'We are so thrilled you are here. Open this app for the full schedule, share photos, chat with other guests, and stay updated. Let the celebrations begin! 🎉', send_push: true },
    { title: 'Mehndi Starts in 30 Minutes!', body: 'Head to the Garden Pavilion. Don\'t forget to get your henna done! 🌿', send_push: true },
    { title: 'Sangeet Tonight at 7 PM', body: 'The Grand Ballroom doors open at 6:30 PM. Drinks and appetizers will be served. Get ready to dance! 💃', send_push: false },
    { title: 'Ceremony Reminder', body: 'The wedding ceremony begins at 4:30 PM sharp at the Mandap Garden. Please be seated by 4:15 PM. 🙏', send_push: true },
  ];

  for (const announcement of announcements) {
    const { error } = await supabase.from('announcements').insert({
      wedding_id: weddingId,
      ...announcement,
      sent_by: '00000000-0000-0000-0000-000000000000',
    });
    if (error) console.error('❌ Announcement error:', error);
  }
  console.log('✅ Announcements seeded');

  console.log('');
  console.log('🎉 Demo wedding seeded successfully!');
  console.log(`📱 Guest App: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/w/anya-raj`);
  console.log(`🔗 Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/weddings/${weddingId}/overview`);
}

seedDemo().catch(console.error);