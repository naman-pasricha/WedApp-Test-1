// Individual Table API - PATCH/DELETE
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; tableId: string }> }
) {
  try {
    const { slug, tableId } = await params;
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
    const { name, capacity, display_order } = body;

    const updates: Record<string, unknown> = {};
    if (name?.trim()) updates.name = name.trim();
    if (typeof capacity === 'number') updates.capacity = capacity;
    if (typeof display_order === 'number') updates.display_order = display_order;

    const { data: table, error } = await supabase
      .from('tables')
      .update(updates)
      .eq('id', tableId)
      .eq('wedding_id', wedding.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ table });
  } catch {
    return NextResponse.json({ message: 'Failed to update table' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; tableId: string }> }
) {
  try {
    const { slug, tableId } = await params;
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

    // Unassign guests from this table
    await supabase
      .from('guests')
      .update({ table_id: null })
      .eq('table_id', tableId)
      .eq('wedding_id', wedding.id);

    // Delete table
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', tableId)
      .eq('wedding_id', wedding.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Failed to delete table' }, { status: 500 });
  }
}