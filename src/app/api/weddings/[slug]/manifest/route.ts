// Dynamic PWA Manifest per wedding
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
      return new NextResponse('Wedding not found', { status: 404 });
    }

    const theme = wedding.theme as any;
    const primaryColor = theme?.colors?.primary || '#C4785E';
    const backgroundColor = theme?.colors?.background || '#FFF8F3';

    const manifest = {
      name: wedding.name,
      short_name: wedding.name.length > 12 ? wedding.name.substring(0, 12) + '…' : wedding.name,
      description: `Guest app for ${wedding.name}'s wedding`,
      start_url: `/w/${slug}`,
      display: 'standalone',
      background_color: backgroundColor,
      theme_color: primaryColor,
      orientation: 'portrait-primary',
      scope: `/w/${slug}`,
      icons: [
        {
          src: '/icons/icon-72.png',
          sizes: '72x72',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/icons/icon-96.png',
          sizes: '96x96',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/icons/icon-128.png',
          sizes: '128x128',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/icons/icon-144.png',
          sizes: '144x144',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/icons/icon-152.png',
          sizes: '152x152',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/icons/icon-384.png',
          sizes: '384x384',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
      categories: ['lifestyle', 'social'],
      shortcuts: [
        {
          name: 'Take Photo',
          short_name: 'Photo',
          description: 'Upload a photo to the shared album',
          url: `/w/${slug}/photos`,
          icons: [{ src: '/icons/camera-96.png', sizes: '96x96' }],
        },
        {
          name: 'Schedule',
          short_name: 'Schedule',
          description: 'View the wedding itinerary',
          url: `/w/${slug}/itinerary`,
          icons: [{ src: '/icons/calendar-96.png', sizes: '96x96' }],
        },
      ],
      related_applications: [],
      prefer_related_applications: false,
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Internal server error', { status: 500 });
  }
}