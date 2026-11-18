// Chat Broadcast API - Send broadcasts to all guests
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { data: wedding } = await supabase
      .rpc('get_wedding_by_slug', { p_slug: slug })
      .single();

    if (!wedding) return NextResponse.json({ message: 'Wedding not found' }, { status: 404 });

    const { data: host } = await supabase
      .from('wedding_hosts')
      .select('role')
      .eq('wedding_id', wedding.id)
      .eq('user_id', user.id)
      .single();

    if (!host) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { content, message_type = 'text', image_url } = body;

    if (!content?.trim() && !image_url) {
      return NextResponse.json({ message: 'Message content or image is required' }, { status: 400 });
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        wedding_id: wedding.id,
        host_user_id: user.id,
        content: content?.trim() || '',
        message_type,
        image_url: image_url || null,
        is_broadcast: true,
        is_hidden: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ message: 'Failed to send broadcast' }, { status: 500 });
  }
}