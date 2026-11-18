// Games API - Submit challenge participation/answers
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; challengeId: string }> }
) {
  try {
    const { slug, challengeId } = await params;
    const supabase = createServerClient();

    // Get guest session from header
    const guestToken = request.headers.get('x-guest-session');
    if (!guestToken) {
      return NextResponse.json({ error: 'Guest session required' }, { status: 401 });
    }

    const { data: wedding } = await supabase
      .rpc('get_wedding_by_slug', { p_slug: slug })
      .single();

    if (!wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
    }

    // Get guest by session token
    const { data: guest } = await supabase
      .from('guests')
      .select('id, wedding_id, name')
      .eq('session_token', guestToken)
      .eq('wedding_id', wedding.id)
      .single();

    if (!guest) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('wedding_id', wedding.id)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Check if challenge is active
    const now = new Date();
    const startsAt = new Date(challenge.starts_at);
    const endsAt = new Date(challenge.ends_at);

    if (now < startsAt) {
      return NextResponse.json({ error: 'Challenge has not started yet' }, { status: 400 });
    }
    if (now > endsAt) {
      return NextResponse.json({ error: 'Challenge has ended' }, { status: 400 });
    }
    if (challenge.status !== 'active') {
      return NextResponse.json({ error: 'Challenge is not active' }, { status: 400 });
    }

    // Check existing participation
    const { data: existing } = await supabase
      .from('challenge_completions')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('guest_id', guest.id)
      .single();

    const body = await request.json();
    const { answers } = body;

    // Calculate score based on challenge type
    let score = 0;
    const config = challenge.config as any || {};
    const processedAnswers = answers.map((answer: any) => {
      if (challenge.type === 'trivia') {
        const question = config.questions?.find((q: any) => q.id === answer.question_id);
        if (question) {
          const correct = answer.selected_option === question.correct_answer;
          const points = correct ? question.points : 0;
          score += points;
          return { ...answer, correct, points };
        }
      } else if (challenge.type === 'prediction') {
        // Points awarded later when correct answer revealed
        score += 0;
      } else if (challenge.type === 'photo_scavenger') {
        // Points per photo target completed
        score += challenge.points / (config.photo_targets?.length || 1);
      } else if (challenge.type === 'caption_contest') {
        // Points awarded after voting
        score += 0;
      }
      return answer;
    });

    if (existing) {
      // Update existing participation
      const { data: participation, error } = await supabase
        .from('challenge_completions')
        .update({
          photo_id: processedAnswers[0]?.photo_url || null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ participation, score });
    } else {
      // Create new participation
      const { data: participation, error } = await supabase
        .from('challenge_completions')
        .insert({
          challenge_id: challengeId,
          guest_id: guest.id,
          photo_id: processedAnswers[0]?.photo_url || null,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ participation, score }, { status: 201 });
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}