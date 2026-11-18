// Tables API - CRUD for seating tables
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServerClient();

    // Get wedding by slug first
    const { data: wedding } = await supabase
      .rpc('get_wedding_by_slug', { p_slug: slug })
      .single();

    if (!wedding) {
      return NextResponse.json({ message: 'Wedding not found' }, { status: 404 });
    }

    const { data: tables, error } = await supabase
      .from('tables')
      .select('*')
      .eq('wedding_id', wedding.id)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ tables: tables || [], weddingId: wedding.id });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch tables' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // Get wedding by slug
    const { data: wedding } = await supabase
      .rpc('get_wedding_by_slug', { p_slug: slug })
      .single();

    if (!wedding) return NextResponse.json({ message: 'Wedding not found' }, { status: 404 });

    // Verify host access
    const { data: host } = await supabase
      .from('wedding_hosts')
      .select('role')
      .eq('wedding_id', wedding.id)
      .eq('user_id', user.id)
      .single();

    if (!host) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, capacity = 8 } = body;

    if (!name?.trim()) {
      return NextResponse.json({ message: 'Table name is required' }, { status: 400 });
    }

    // Get max display_order
    const { data: maxOrder } = await supabase
      .from('tables')
      .select('display_order')
      .eq('wedding_id', wedding.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const display_order = (maxOrder?.display_order ?? -1) + 1;

    const { data: table, error } = await supabase
      .from('tables')
      .insert({
        wedding_id: wedding.id,
        name: name.trim(),
        capacity,
        display_order,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ table });
  } catch {
    return NextResponse.json({ message: 'Failed to create table' }, { status: 500 });
  }
}