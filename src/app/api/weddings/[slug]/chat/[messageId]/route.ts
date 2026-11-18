// Chat Message Moderation API - PATCH/DELETE for individual messages
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; messageId: string }> }
) {
  try {
    const { slug, messageId } = await params;
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
    const { is_hidden } = body;

    if (typeof is_hidden !== 'boolean') {
      return NextResponse.json({ message: 'is_hidden must be boolean' }, { status: 400 });
    }

    const { data: message, error } = await supabase
      .from('messages')
      .update({ is_hidden })
      .eq('id', messageId)
      .eq('wedding_id', wedding.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ message: 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; messageId: string }> }
) {
  try {
    const { slug, messageId } = await params;
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

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('wedding_id', wedding.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Failed to delete message' }, { status: 500 });
  }
}