// Announcements API Route - Create and List
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
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

    // Get announcements
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('wedding_id', wedding.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ announcements: data || [] });
  } catch (error) {
    console.error('Announcements fetch error:', error);
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

    // Get wedding by slug
    const { data: wedding, error: weddingError } = await supabase
      .rpc('get_wedding_by_slug', { p_slug: slug })
      .single();

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
    }

    // Verify host auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, body: announcementBody, send_push } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create announcement
    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        wedding_id: wedding.id,
        title: title.trim(),
        body: announcementBody?.trim() || null,
        send_push: send_push || false,
        sent_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If push notification requested, trigger Edge Function
    if (send_push) {
      try {
        const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push`;
        const res = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            wedding_id: wedding.id,
            announcement_id: announcement.id,
            title: announcement.title,
            body: announcement.body,
          }),
        });

        if (!res.ok) {
          console.error('Push notification failed:', await res.text());
        }
      } catch (pushError) {
        console.error('Push notification error:', pushError);
        // Don't fail the request if push fails
      }
    }

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error('Announcement creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}