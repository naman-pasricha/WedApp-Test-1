// Photo upload API - Returns signed URL for direct upload to Supabase Storage
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const uploadSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().startsWith('image/').or(z.string().startsWith('video/')),
  fileSize: z.number().max(10 * 1024 * 1024), // 10MB max
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: weddingId } = await params;
    const supabase = createServerClient();

    // Get guest from session cookie
    const guestSession = request.cookies.get('guest_session')?.value;
    if (!guestSession) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { data: guest } = await supabase
      .rpc('get_guest_by_token', { p_token: guestSession })
      .single();

    if (!guest || guest.wedding_id !== weddingId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { fileName, mimeType, fileSize } = uploadSchema.parse(body);

    // Generate unique storage path
    const ext = fileName.split('.').pop() || 'jpg';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const storagePath = `${weddingId}/${guest.id}/${uniqueName}`;

    // Create signed upload URL (valid for 1 hour)
    const { data: signedUrl, error } = await supabase.storage
      .from('guest-photos')
      .createSignedUploadUrl(storagePath);

    if (error || !signedUrl) {
      return NextResponse.json({ message: 'Failed to create upload URL' }, { status: 500 });
    }

    // Get public URL for later use
    const { data: { publicUrl } } = supabase.storage
      .from('guest-photos')
      .getPublicUrl(storagePath);

    return NextResponse.json({
      uploadUrl: signedUrl.signedUrl,
      storagePath,
      publicUrl,
      token: signedUrl.token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid request', errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error('Upload URL error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Complete upload - creates photo record after client uploads
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: weddingId } = await params;
    const supabase = createServerClient();

    const guestSession = request.cookies.get('guest_session')?.value;
    if (!guestSession) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { data: guest } = await supabase
      .rpc('get_guest_by_token', { p_token: guestSession })
      .single();

    if (!guest || guest.wedding_id !== weddingId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { storagePath, width, height, fileSize, caption } = body;

    if (!storagePath) {
      return NextResponse.json({ message: 'storagePath required' }, { status: 400 });
    }

    // Generate thumbnail path
    const thumbnailPath = storagePath.replace(/\.[^.]+$/, '_thumb.jpg');

    const { data: photo, error } = await supabase
      .from('photos')
      .insert({
        wedding_id: weddingId,
        guest_id: guest.id,
        storage_path: storagePath,
        thumbnail_path: thumbnailPath,
        mime_type: body.mimeType || 'image/jpeg',
        width,
        height,
        file_size: fileSize,
        caption: caption || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ message: 'Failed to create photo record' }, { status: 500 });
    }

    return NextResponse.json({ photo });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}