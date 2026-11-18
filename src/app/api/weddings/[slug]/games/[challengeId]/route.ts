// Games API - Individual challenge CRUD
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; challengeId: string }> }
) {
  try {
    const { slug, challengeId } = await params;
    const supabase = createServerClient();

    const { data: wedding } = await supabase
      .rpc('get_wedding_by_slug', { p_slug: slug })
      .single();

    if (!wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
    }

    const { data: challenge, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('wedding_id', wedding.id)
      .single();

    if (error || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Get leaderboard for this challenge
    const { data: leaderboard } = await supabase
      .from('challenge_participations')
      .select(`
        score,
        completed_at,
        guests!inner(name, avatar_url)
      `)
      .eq('challenge_id', challengeId)
      .order('score', { ascending: false })
      .limit(10);

    return NextResponse.json({
      challenge,
      leaderboard: leaderboard || []
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; challengeId: string }> }
) {
  try {
    const { slug, challengeId } = await params;
    const supabase = createServerClient();

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
    const { title, description, instructions, points, starts_at, ends_at, config, status, display_order } = body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (instructions !== undefined) updates.instructions = instructions;
    if (points !== undefined) updates.points = points;
    if (starts_at !== undefined) updates.starts_at = starts_at;
    if (ends_at !== undefined) updates.ends_at = ends_at;
    if (config !== undefined) updates.config = config;
    if (status !== undefined) updates.status = status;
    if (display_order !== undefined) updates.display_order = display_order;

    const { data: challenge, error } = await supabase
      .from('challenges')
      .update(updates)
      .eq('id', challengeId)
      .eq('wedding_id', wedding.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ challenge });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; challengeId: string }> }
) {
  try {
    const { slug, challengeId } = await params;
    const supabase = createServerClient();

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

    if (!host || host.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('challenges')
      .delete()
      .eq('id', challengeId)
      .eq('wedding_id', wedding.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}