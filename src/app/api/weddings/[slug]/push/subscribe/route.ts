// Push Subscription API Route
// Handles saving/removing push subscriptions for guests

import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServerClient();

    // Get wedding by slug
    const { data: wedding, error: weddingError } = await supabase
      .rpc('get_wedding_by_slug', { p_slug: slug })
      .single();

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
    }

    // Get guest from session token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionToken = authHeader.replace('Bearer ', '');
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id')
      .eq('session_token', sessionToken)
      .eq('wedding_id', wedding.id)
      .single();

    if (guestError || !guest) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, p256dh, auth } = body;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: 'Missing required subscription fields' },
        { status: 400 }
      );
    }

    // Upsert subscription
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        wedding_id: wedding.id,
        guest_id: guest.id,
        endpoint,
        p256dh,
        auth,
        user_agent: request.headers.get('user-agent') || null,
      },
      { onConflict: 'guest_id,endpoint' }
    );

    if (error) {
      console.error('Failed to save push subscription:', error);
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServerClient();

    // Get wedding by slug
    const { data: wedding, error: weddingError } = await supabase
      .rpc('get_wedding_by_slug', { p_slug: slug })
      .single();

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
    }

    // Get guest from session token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionToken = authHeader.replace('Bearer ', '');
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id')
      .eq('session_token', sessionToken)
      .eq('wedding_id', wedding.id)
      .single();

    if (guestError || !guest) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint' },
        { status: 400 }
      );
    }

    // Delete subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('guest_id', guest.id)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Failed to delete push subscription:', error);
      return NextResponse.json(
        { error: 'Failed to delete subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscription deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}