// Guest Assignment API - PATCH for table assignment
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; guestId: string }> }
) {
  try {
    const { slug, guestId } = await params;
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
    const { table_id } = body;

    // Validate table exists if provided
    if (table_id) {
      const { data: table } = await supabase
        .from('tables')
        .select('id, capacity')
        .eq('id', table_id)
        .eq('wedding_id', wedding.id)
        .single();

      if (!table) {
        return NextResponse.json({ message: 'Table not found' }, { status: 404 });
      }

      // Check capacity
      const { count } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .eq('table_id', table_id)
        .eq('wedding_id', wedding.id);

      if ((count ?? 0) >= table.capacity) {
        return NextResponse.json({ message: 'Table is full' }, { status: 400 });
      }
    }

    const { data: guest, error } = await supabase
      .from('guests')
      .update({ table_id: table_id || null })
      .eq('id', guestId)
      .eq('wedding_id', wedding.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ guest });
  } catch {
    return NextResponse.json({ message: 'Failed to update guest' }, { status: 500 });
  }
}