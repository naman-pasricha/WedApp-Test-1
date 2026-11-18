// Games API - Leaderboard
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServerClient();

    const { data: wedding } = await supabase
      .rpc('get_wedding_by_slug', { p_slug: slug })
      .single();

    if (!wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
    }

    // Get all challenges for this wedding
    const { data: challenges } = await supabase
      .from('challenges')
      .select('id')
      .eq('wedding_id', wedding.id);

    if (!challenges || challenges.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    const challengeIds = challenges.map(c => c.id);

    // Get all participations with guest info
    const { data: participations } = await supabase
      .from('challenge_participations')
      .select('guest_id, guest_name, score, challenge_id, completed_at, guests!inner(avatar_url)')
      .in('challenge_id', challengeIds)
      .not('completed_at', 'is', null);

    // Aggregate scores by guest
    const guestScores = new Map<string, {
      guest_id: string;
      guest_name: string;
      total_score: number;
      challenges_completed: number;
      avatar_url?: string;
    }>();

    participations?.forEach(p => {
      const existing = guestScores.get(p.guest_id);
      if (existing) {
        existing.total_score += p.score;
        existing.challenges_completed += 1;
      } else {
        guestScores.set(p.guest_id, {
          guest_id: p.guest_id,
          guest_name: p.guest_name,
          total_score: p.score,
          challenges_completed: 1,
          avatar_url: (p.guests as any)?.avatar_url,
        });
      }
    });

    // Sort by score descending
    const leaderboard = Array.from(guestScores.values())
      .sort((a, b) => b.total_score - a.total_score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return NextResponse.json({ leaderboard });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}