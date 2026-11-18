// Games API - List and create challenges
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServerClient();

    // Get wedding
    const { data: wedding } = await supabase
      .rpc('get_wedding_by_slug', { p_slug: slug })
      .single();

    if (!wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
    }

    // Get challenges
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('wedding_id', wedding.id)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // If guest session, get their participation
    const guestToken = request.headers.get('x-guest-session');
    let participations: any[] = [];

    if (guestToken) {
      const { data: guest } = await supabase
        .from('guests')
        .select('id')
        .eq('session_token', guestToken)
        .eq('wedding_id', wedding.id)
        .single();

      if (guest) {
        const { data: parts } = await supabase
          .from('challenge_completions')
          .select('*')
          .eq('guest_id', guest.id)
          .in('challenge_id', challenges?.map(c => c.id) || []);

        participations = parts || [];
      }
    }

    return NextResponse.json({
      challenges: challenges || [],
      participations
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServerClient();

    // Verify host auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: wedding } = await supabase
      .rpc('get_wedding_by_slug', { p_slug: slug })
      .single();

    if (!wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
    }

    const { data: host } = await supabase
      .from('wedding_hosts')
      .select('role')
      .eq('wedding_id', wedding.id)
      .eq('user_id', user.id)
      .single();

    if (!host || !['owner', 'admin'].includes(host.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, instructions, type, points, starts_at, ends_at, config } = body;

    // Get max display_order
    const { data: maxOrder } = await supabase
      .from('challenges')
      .select('display_order')
      .eq('wedding_id', wedding.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({
        wedding_id: wedding.id,
        type,
        title,
        description,
        instructions,
        points: points || 100,
        starts_at,
        ends_at,
        config: config || {},
        display_order: (maxOrder?.display_order || 0) + 1,
        status: 'upcoming',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ challenge }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}