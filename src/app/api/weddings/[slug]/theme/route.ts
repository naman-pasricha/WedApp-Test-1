// Theme API - Returns wedding theme for guest app
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServerClient();

    const { data: wedding, error } = await supabase
      .rpc('get_wedding_by_slug', { p_slug: slug })
      .single();

    if (error || !wedding) {
      return NextResponse.json({ theme: null }, { status: 404 });
    }

    return NextResponse.json({ theme: wedding.theme });
  } catch {
    return NextResponse.json({ theme: null }, { status: 500 });
  }
}