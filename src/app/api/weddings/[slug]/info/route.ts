// Info Sections API - CRUD for travel/info sections
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
      return NextResponse.json({ message: 'Wedding not found' }, { status: 404 });
    }

    const { data: sections, error } = await supabase
      .from('info_sections')
      .select('*')
      .eq('wedding_id', wedding.id)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ sections: sections || [], weddingId: wedding.id });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch info sections' }, { status: 500 });
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
    const { title, content, icon, display_order } = body;

    if (!title?.trim()) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 });
    }

    const { data: section, error } = await supabase
      .from('info_sections')
      .insert({
        wedding_id: wedding.id,
        title: title.trim(),
        content: content?.trim() || '',
        icon: icon || 'info',
        display_order: display_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ section });
  } catch {
    return NextResponse.json({ message: 'Failed to create info section' }, { status: 500 });
  }
}