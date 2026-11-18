// Demo Wedding Seed Script
// Run with: npx tsx scripts/seed-demo-wedding.ts
// Requires Supabase service role key in SUPABASE_SERVICE_ROLE_KEY env var

import { createClient } from '@supabase/supabase-js';
import { generateQRCode } from '@/lib/qrcode';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_WEDDING = {
  slug: 'anya-raj',
  name: 'Anya & Raj',
  date: '2025-06-15',
  timezone: 'America/New_York',
  hero_image_url: null,
  theme: {
    preset: 'warm-sand',
    colors: {
      primary: '#C4785E',
      secondary: '#D4A574',
      background: '#FFF8F3',
      surface: '#FFFFFF',
      foreground: '#3D3D3D',
      muted: '#8B7D6B',
      border: '#E8DDD4',
      accent: '#E8B484',
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Inter',
    },
    borderRadius: 'rounded-xl',
    pattern: 'leaves',
    patternOpacity: 0.04,
  },
};

async function seedDemoWedding() {
  console.log('🌱 Seeding demo wedding: Anya & Raj');

  // 1. Create a demo host user (or use existing)
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'demo@wedapp.example',
    password: 'demo123456',
    email_confirm: true,
    user_metadata: { full_name: 'Demo Host' },
  });

  if (authError && !authError.message.includes('already registered')) {
    console.error('Auth error:', authError);
    process.exit(1);
  }

  const hostId = authUser?.user?.id;
  console.log('✅ Demo host user:', hostId);

  // 2. Create wedding
  const { data: wedding, error: weddingError } = await supabase
    .from('weddings')
    .upsert({
      ...DEMO_WEDDING,
      host_id: hostId,
    }, { onConflict: 'slug' })
    .select()
    .single();

  if (weddingError) {
    console.error('Wedding error:', weddingError);
    process.exit(1);
  }

  console.log('✅ Wedding created:', wedding.id);

  // 3. Add host to wedding_hosts
  await supabase
    .from('wedding_hosts')
    .upsert({
      wedding_id: wedding.id,
      user_id: hostId!,
      role: 'owner',
    }, { onConflict: 'wedding_id,user_id' });

  console.log('✅ Host role assigned');

  // 4. Create events
  const events = [
    {
      wedding_id: wedding.id,
      title: 'Welcome Drinks',
      description: 'Join us for cocktails and mingling',
      starts_at: '2025-06-15T16:00:00-04:00',
      ends_at: '2025-06-15T17:30:00-04:00',
      venue_name: 'Garden Pavilion',
      venue_address: '123 Wedding Lane, NYC',
      display_order: 1,
    },
    {
      wedding_id: wedding.id,
      title: 'Ceremony',
      description: 'The main ceremony',
      starts_at: '2025-06-15T18:00:00-04:00',
      ends_at: '2025-06-15T18:45:00-04:00',
      venue_name: 'Garden Pavilion',
      venue_address: '123 Wedding Lane, NYC',
      display_order: 2,
    },
    {
      wedding_id: wedding.id,
      title: 'Reception & Dinner',
      description: 'Dinner, dancing, and celebration',
      starts_at: '2025-06-15T19:30:00-04:00',
      ends_at: '2025-06-15T23:00:00-04:00',
      venue_name: 'Grand Ballroom',
      venue_address: '123 Wedding Lane, NYC',
      display_order: 3,
    },
    {
      wedding_id: wedding.id,
      title: 'Late Night Snacks',
      description: 'Food truck and late night bites',
      starts_at: '2025-06-15T22:30:00-04:00',
      ends_at: '2025-06-16T00:00:00-04:00',
      venue_name: 'Grand Ballroom',
      venue_address: '123 Wedding Lane, NYC',
      display_order: 4,
    },
    {
      wedding_id: wedding.id,
      title: 'Brunch Farewell',
      description: 'Casual brunch before departure',
      starts_at: '2025-06-16T10:00:00-04:00',
      ends_at: '2025-06-16T12:00:00-04:00',
      venue_name: 'Terrace Cafe',
      venue_address: '123 Wedding Lane, NYC',
      display_order: 5,
    },
  ];

  for (const event of events) {
    await supabase.from('events').upsert(event, { onConflict: 'wedding_id,title' });
  }
  console.log('✅ Events created:', events.length);

  // 5. Create tables
  const tables = [
    { wedding_id: wedding.id, name: 'Table 1 - Family', capacity: 8, display_order: 1 },
    { wedding_id: wedding.id, name: 'Table 2 - Family', capacity: 8, display_order: 2 },
    { wedding_id: wedding.id, name: 'Table 3 - College Friends', capacity: 10, display_order: 3 },
    { wedding_id: wedding.id, name: 'Table 4 - College Friends', capacity: 10, display_order: 4 },
    { wedding_id: wedding.id, name: 'Table 5 - Work Colleagues', capacity: 8, display_order: 5 },
    { wedding_id: wedding.id, name: 'Table 6 - Work Colleagues', capacity: 8, display_order: 6 },
    { wedding_id: wedding.id, name: 'Table 7 - Childhood Friends', capacity: 8, display_order: 7 },
    { wedding_id: wedding.id, name: 'Table 8 - Plus Ones', capacity: 10, display_order: 8 },
    { wedding_id: wedding.id, name: 'Sweetheart Table', capacity: 2, display_order: 9 },
  ];

  for (const table of tables) {
    await supabase.from('tables').upsert(table, { onConflict: 'wedding_id,name' });
  }
  console.log('✅ Tables created:', tables.length);

  // 6. Create info sections
  const infoSections = [
    {
      wedding_id: wedding.id,
      title: 'Accommodation',
      content: 'We have blocked rooms at two nearby hotels:\n\n**The Grand Hotel** (2 blocks away)\n$189/night · Book by May 1st\nReference: "Anya & Raj Wedding"\n\n**Cozy Inn** (5 min walk)\n$129/night · Book by May 15th\nReference: "Raj & Anya"\n\nShuttle service runs between hotels and venue every 30 minutes.',
      icon: '🏨',
      display_order: 1,
    },
    {
      wedding_id: wedding.id,
      title: 'Transportation',
      content: 'Parking is limited at the venue. We strongly recommend:\n\n• **Shuttle Service**: Runs from both hotels every 30 mins starting 3:30 PM\n• **Rideshare**: Designated drop-off at Garden Pavilion entrance\n• **Valet**: Limited spots available ($25)\n• **Public Transit**: 2 blocks from Main St Station (Blue Line)\n\nAfter-party shuttle returns to hotels at 11 PM, 12 AM, and 1 AM.',
      icon: '🚌',
      display_order: 2,
    },
    {
      wedding_id: wedding.id,
      title: 'Dress Code',
      content: 'Cocktail Attire / Semi-Formal\n\n• Ladies: Cocktail dresses, dressy separates, or formal jumpsuits\n• Gentlemen: Suits or sport coats with dress pants (ties optional)\n• The ceremony is outdoors on grass - consider wedges or block heels\n• Light layers recommended for evening temperature drop',
      icon: '👗',
      display_order: 3,
    },
    {
      wedding_id: wedding.id,
      title: 'FAQs',
      content: 'Q: Can I bring a plus one?\nA: Only if your invitation explicitly states "+ Guest". We have limited capacity.\n\nQ: Is there a gift registry?\nA: We\'re honored by your presence! No gifts needed. If you insist, we have a honeymoon fund.\n\nQ: What about dietary restrictions?\nA: Please let us know by June 1st. Vegetarian, vegan, gluten-free, and nut-free options available.\n\nQ: Can children attend?\nA: This is an adult-only celebration (ages 16+).\n\nQ: What\'s the parking situation?\nA: See Transportation section above. Carpooling encouraged!',
      icon: '❓',
      display_order: 4,
    },
    {
      wedding_id: wedding.id,
      title: 'Emergency Contacts',
      content: 'Wedding Coordinator: Sarah Johnson\n📞 +1 (555) 123-4567\n\nVenue Manager: Mike Chen\n📞 +1 (555) 987-6543\n\nMedical: NYC General Hospital - 0.5 miles\n📞 911 for emergencies\n\nRideshare Issues: Text the coordinator\n\nLost & Found: Check with venue staff',
      icon: '🚨',
      display_order: 5,
    },
  ];

  for (const section of infoSections) {
    await supabase.from('info_sections').upsert(section, { onConflict: 'wedding_id,title' });
  }
  console.log('✅ Info sections created:', infoSections.length);

  // 7. Create challenges
  const challenges = [
    {
      wedding_id: wedding.id,
      type: 'photo_scavenger',
      title: 'Photo Scavenger Hunt',
      description: 'Capture these special moments throughout the day!',
      instructions: 'Take photos of each item below. Each photo earns points!',
      points: 500,
      starts_at: '2025-06-15T16:00:00-04:00',
      ends_at: '2025-06-16T12:00:00-04:00',
      status: 'active',
      display_order: 1,
      config: {
        photo_targets: [
          'The bride and groom kissing',
          'Your table group selfie',
          'The wedding cake',
          'Someone doing a funny dance move',
          'The venue from a unique angle',
          'A candid moment of laughter',
          'The bride or groom with their parents',
          'Your shoes on the dance floor',
          'A detail shot (flowers, rings, decor)',
          'The sunset or venue lighting',
        ],
      },
    },
    {
      wedding_id: wedding.id,
      type: 'trivia',
      title: 'Couple Trivia',
      description: 'How well do you know Anya & Raj?',
      instructions: 'Answer each question. Correct answers earn points!',
      points: 300,
      starts_at: '2025-06-15T16:00:00-04:00',
      ends_at: '2025-06-16T12:00:00-04:00',
      status: 'active',
      display_order: 2,
      config: {
        questions: [
          {
            id: 'q1',
            question: 'Where did Anya and Raj first meet?',
            options: ['At a coffee shop', 'At work', 'Through mutual friends', 'At a wedding'],
            correct_answer: 1,
            points: 50,
          },
          {
            id: 'q2',
            question: 'What is their dog\'s name?',
            options: ['Mochi', 'Boba', 'Taro', 'Mango'],
            correct_answer: 0,
            points: 50,
          },
          {
            id: 'q3',
            question: 'What was their first date?',
            options: ['Movies', 'Hiking', 'Thai food', 'Museum'],
            correct_answer: 2,
            points: 50,
          },
          {
            id: 'q4',
            question: 'Where did Raj propose?',
            options: ['Central Park', 'Their apartment', 'Paris', 'The beach where they met'],
            correct_answer: 3,
            points: 50,
          },
          {
            id: 'q5',
            question: 'What\'s their favorite cuisine to cook together?',
            options: ['Italian', 'Mexican', 'Korean', 'Indian'],
            correct_answer: 2,
            points: 50,
          },
          {
            id: 'q6',
            question: 'What song will be their first dance?',
            options: ['At Last - Etta James', 'Perfect - Ed Sheeran', 'Can\'t Help Falling in Love - Elvis', 'A surprise!'],
            correct_answer: 3,
            points: 50,
          },
        ],
      },
    },
    {
      wedding_id: wedding.id,
      type: 'prediction',
      title: 'Wedding Day Predictions',
      description: 'Make your best guesses! Closest predictions win.',
      instructions: 'Select your prediction for each. Results revealed after the wedding!',
      points: 200,
      starts_at: '2025-06-15T16:00:00-04:00',
      ends_at: '2025-06-15T18:00:00-04:00',
      status: 'active',
      display_order: 3,
      config: {
        prediction_options: [
          'Under 3 minutes', '3-4 minutes', '4-5 minutes', 'Over 5 minutes'
        ],
      },
    },
    {
      wedding_id: wedding.id,
      type: 'caption_contest',
      title: 'Caption This!',
      description: 'Write the funniest caption for this engagement photo.',
      instructions: 'Submit your best caption. Winner chosen by the couple!',
      points: 100,
      starts_at: '2025-06-15T16:00:00-04:00',
      ends_at: '2025-06-16T12:00:00-04:00',
      status: 'active',
      display_order: 4,
      config: {
        photo_url: '/images/engagement-photo.jpg',
        voting_enabled: true,
      },
    },
  ];

  for (const challenge of challenges) {
    await supabase.from('challenges').upsert(challenge, { onConflict: 'wedding_id,title' });
  }
  console.log('✅ Challenges created:', challenges.length);

  // 8. Generate QR code
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const guestUrl = `${appUrl}/w/${wedding.slug}`;
  const qrCodeDataUrl = await generateQRCode(guestUrl, 512);

  console.log('\n📱 Demo Wedding Ready!');
  console.log('========================');
  console.log(`Guest App URL: ${guestUrl}`);
  console.log(`Dashboard: ${appUrl}/dashboard/weddings/${wedding.id}/overview`);
  console.log(`QR Code: Generated (base64 length: ${qrCodeDataUrl.length})`);
  console.log('\n🔐 Demo Host Login:');
  console.log('Email: demo@wedapp.example');
  console.log('Password: demo123456');
  console.log('\n✨ All done! Visit the guest app to test.');
}

// Run
seedDemoWedding().catch(console.error);