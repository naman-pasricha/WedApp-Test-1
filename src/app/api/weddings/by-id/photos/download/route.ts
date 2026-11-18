// Photo album ZIP download endpoint - Streaming for memory efficiency
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import JSZip from 'jszip';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: weddingId } = await params;
    const supabase = createServerClient();

    // Verify host authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data: hostCheck } = await supabase
      .from('wedding_hosts')
      .select('role')
      .eq('wedding_id', weddingId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!hostCheck) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get wedding info for filename
    const { data: wedding } = await supabase
      .from('weddings')
      .select('slug, name')
      .eq('id', weddingId)
      .single();

    if (!wedding) {
      return NextResponse.json({ message: 'Wedding not found' }, { status: 404 });
    }

    // Create a transform stream for streaming the ZIP
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Start ZIP generation in background
    (async () => {
      const zip = new JSZip();
      let photoCount = 0;
      let page = 0;
      const PAGE_SIZE = 50;
      let hasMore = true;

      try {
        while (hasMore) {
          const { data: photos, error } = await supabase
            .from('photos')
            .select('storage_path, guest:guests!photos_guest_id_fkey(name), created_at')
            .eq('wedding_id', weddingId)
            .eq('is_hidden', false)
            .order('created_at', { ascending: false })
            .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

          if (error) throw error;
          if (!photos || photos.length === 0) break;

          hasMore = photos.length === PAGE_SIZE;
          page++;

          // Download and add each photo to zip
          for (const photo of photos) {
            try {
              const { data: blob, error: downloadError } = await supabase.storage
                .from('guest-photos')
                .download(photo.storage_path);

              if (downloadError || !blob) {
                console.warn(`Failed to download photo: ${photo.storage_path}`, downloadError);
                continue;
              }

              const guestName = photo.guest?.name || 'Unknown';
              const dateStr = new Date(photo.created_at).toISOString().split('T')[0];
              const ext = photo.storage_path.split('.').pop() || 'jpg';
              const safeGuestName = guestName.replace(/[^a-zA-Z0-9]/g, '_');
              const fileName = `${dateStr}_${safeGuestName}.${ext}`;

              zip.file(fileName, blob);
              photoCount++;
            } catch (err) {
              console.warn(`Error adding photo to zip: ${photo.storage_path}`, err);
            }
          }

          // Yield control to prevent blocking
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Generate zip as blob and write to stream
        const zipBlob = await zip.generateAsync({ type: 'blob' }, metadata => {
          // Report progress
          if (metadata.percent % 10 === 0) {
            console.log(`ZIP generation: ${metadata.percent.toFixed(0)}%`);
          }
        });

        // Write zip to stream in chunks
        const reader = zipBlob.stream().getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }

        await writer.close();
      } catch (error) {
        console.error('ZIP generation failed:', error);
        await writer.abort(error instanceof Error ? error : new Error('ZIP generation failed'));
      }
    })();

    // Return streaming response
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${wedding.slug}-wedding-photos-${dateStr}.zip`;

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Photo download error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}