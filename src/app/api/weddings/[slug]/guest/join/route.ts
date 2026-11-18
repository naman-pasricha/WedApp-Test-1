// Guest join API - Creates guest session for a wedding
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const joinSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().max(20).optional(),
  deviceId: z.string().uuid('Invalid device ID'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { name, phone, deviceId } = joinSchema.parse(body);

    const supabase = createServerClient();

    // Get wedding by slug
    const { data: wedding, error: weddingError } = await supabase
      .rpc('get_wedding_by_slug', { p_slug: slug })
      .single();

    if (weddingError || !wedding) {
      return NextResponse.json(
        { message: 'Wedding not found' },
        { status: 404 }
      );
    }

    // Join wedding (creates or updates guest session)
    const { data: guest, error: joinError } = await supabase
      .rpc('join_wedding', {
        p_wedding_id: wedding.id,
        p_name: name,
        p_phone: phone ?? '',
        p_device_id: deviceId,
      })
      .single();

    if (joinError || !guest) {
      return NextResponse.json(
        { message: 'Failed to join wedding' },
        { status: 500 }
      );
    }

    // Set httpOnly cookie for session
    const response = NextResponse.json({
      guestId: guest.id,
      sessionToken: guest.session_token,
      tableId: guest.table_id,
      wedding: {
        id: wedding.id,
        slug: wedding.slug,
        name: wedding.name,
        date: wedding.date,
        timezone: wedding.timezone,
        theme: wedding.theme,
        heroImageUrl: wedding.hero_image_url,
      },
    });

    response.cookies.set('guest_session', guest.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: `/w/${slug}`,
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid request', errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error('Join error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}