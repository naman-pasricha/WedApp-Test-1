'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { Trash2, Eye, EyeOff, Loader2, Download, CheckCircle, AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { WeddingNav } from '@/components/dashboard/WeddingNav';

type Photo = Database['public']['Tables']['photos']['Row'] & {
  guest_name?: string;
  like_count: number;
  user_has_liked: boolean;
};

interface PhotosPageClientProps {
  wedding: { id: string; name: string; slug: string };
}

export function PhotosPageClient({ wedding }: PhotosPageClientProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const PAGE_SIZE = 30;
  const hasMoreRef = useRef(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const supabase = supabaseRef.current;

  const fetchPhotos = useCallback(async (pageNum: number, append = false) => {
    if (!hasMoreRef.current && !append) return;

    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('photos')
        .select(`
          *,
          guest:guests!photos_guest_id_fkey(name),
          likes:photo_likes(count),
          user_like:photo_likes!inner(guest_id)
        `)
        .eq('wedding_id', wedding.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const transformedPhotos: Photo[] = (data || []).map((p) => ({
        ...p,
        guest_name: p.guest?.name || 'Unknown',
        like_count: p.likes?.[0]?.count || 0,
        user_has_liked: false,
      }));

      if (append) {
        setPhotos((prev) => [...prev, ...transformedPhotos]);
      } else {
        setPhotos(transformedPhotos);
      }

      hasMoreRef.current = (data?.length || 0) === PAGE_SIZE;
      setPage(pageNum + 1);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [wedding.id, supabase]);

  // Initial load
  useEffect(() => {
    fetchPhotos(0, false);
  }, [fetchPhotos]);

  // Infinite scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingMore) {
          fetchPhotos(page, true);
        }
      },
      { rootMargin: '200px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [fetchPhotos, page, loadingMore]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`photos:${wedding.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos',
          filter: `wedding_id=eq.${wedding.id}`,
        },
        async (payload) => {
          const newPhoto = payload.new as Photo;
          if (!newPhoto.guest_id) return;

          const { data: guest } = await supabase
            .from('guests')
            .select('name')
            .eq('id', newPhoto.guest_id)
            .single();

          setPhotos((prev) => [
            { ...newPhoto, guest_name: guest?.name || 'Unknown', like_count: 0, user_has_liked: false },
            ...prev,
          ]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'photos',
          filter: `wedding_id=eq.${wedding.id}`,
        },
        (payload) => {
          const updated = payload.new as Photo;
          setPhotos((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'photos',
          filter: `wedding_id=eq.${wedding.id}`,
        },
        (payload) => {
          const deletedId = (payload.old as Photo).id;
          setPhotos((prev) => prev.filter((p) => p.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wedding.id, supabase]);

  const handleDelete = useCallback(async (photoId: string, storagePath: string) => {
    if (!confirm('Delete this photo permanently?')) return;

    try {
      // Delete from storage
      await supabase.storage.from('guest-photos').remove([storagePath]);
      // Delete thumbnail if exists
      const thumbPath = storagePath.replace(/\.[^.]+$/, '_thumb.jpg');
      await supabase.storage.from('guest-photos').remove([thumbPath]);
      // Delete record
      const { error } = await supabase.from('photos').delete().eq('id', photoId);
      if (error) throw error;
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo');
    }
  }, [supabase, wedding.id]);

  const handleToggleVisibility = useCallback(async (photoId: string, isHidden: boolean) => {
    try {
      const { error } = await supabase
        .from('photos')
        .update({ is_hidden: !isHidden })
        .eq('id', photoId);
      if (error) throw error;
      setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, is_hidden: !isHidden } : p)));
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Failed to update photo');
    }
  }, [supabase]);

  const handleDownloadAlbum = useCallback(async () => {
    setShowDownloadModal(true);
    setDownloadProgress(0);

    try {
      // Use server-side streaming endpoint for memory-efficient download
      const res = await fetch(`/api/weddings/by-id/${wedding.id}/photos/download`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed' }));
        throw new Error(err.message || 'Failed to start download');
      }

      // Read the streaming response and track progress
      const reader = res.body?.getReader();
      const contentLength = res.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
      let receivedSize = 0;

      const chunks: Uint8Array[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          receivedSize += value.length;

          if (totalSize > 0) {
            setDownloadProgress(Math.round((receivedSize / totalSize) * 100));
          }
        }
      }

      // Combine chunks and trigger download
      const blob = new Blob(chunks, { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${wedding.slug}-wedding-photos-${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setShowDownloadModal(false);
    } catch (error) {
      console.error('Error downloading album:', error);
      alert('Failed to download album');
      setShowDownloadModal(false);
    }
  }, [wedding.id, wedding.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <WeddingNav weddingId={wedding.id} />
        <main className="lg:ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-[#C4785E]" />
              <p className="mt-4 text-gray-500">Loading photos...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <WeddingNav weddingId={wedding.id} />
      <main className="lg:ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Photos</h1>
              <p className="text-gray-500 mt-1">{photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded</p>
            </div>
            <button
              onClick={handleDownloadAlbum}
              className="px-4 py-2.5 rounded-xl font-medium bg-[#C4785E] text-white hover:bg-[#B06850] flex items-center gap-2 transition-colors"
            >
              <Download className="h-5 w-5" />
              Download Album (ZIP)
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Click the eye icon to hide/show photos from guests. Hidden photos are only visible to hosts.
              </p>
            </div>

            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-3"
              role="list"
              aria-label="Wedding photos"
            >
              {photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onDelete={() => handleDelete(photo.id, photo.storage_path)}
                  onToggleVisibility={() => handleToggleVisibility(photo.id, photo.is_hidden)}
                  isHidden={photo.is_hidden}
                  isHost={true}
                />
              ))}

              {hasMoreRef.current && (
                <div ref={loadMoreRef} className="col-span-full flex justify-center py-4">
                  {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-[#C4785E]" />}
                </div>
              )}

              {photos.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#C4785E]/10 flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-[#C4785E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#C4785E] mb-1">No photos yet</h3>
                  <p className="text-gray-500">Guests haven't uploaded any photos yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Downloading Album</h2>
            <div className="space-y-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C4785E] transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <p className="text-gray-500 text-sm">{downloadProgress}% complete</p>
              <p className="text-gray-400 text-xs">Preparing {photos.length} photos...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PhotoCardProps {
  photo: Photo;
  onDelete: () => void;
  onToggleVisibility: () => void;
  isHidden: boolean;
  isHost: boolean;
}

function PhotoCard({ photo, onDelete, onToggleVisibility, isHidden, isHost }: PhotoCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/guest-photos/${photo.storage_path}`;
  const thumbnailUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/guest-photos/${photo.thumbnail_path}`;

  return (
    <article
      className={clsx(
        'relative group',
        isHidden && 'opacity-50 grayscale'
      )}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
        {!imageLoaded && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
        <img
          src={thumbnailUrl || imageUrl}
          alt={`Photo by ${photo.guest_name}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={clsx(
            'w-full h-full object-cover transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Visibility toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm"
          aria-label={isHidden ? 'Show to guests' : 'Hide from guests'}
        >
          {isHidden ? (
            <EyeOff className="h-5 w-5 text-gray-600" />
          ) : (
            <Eye className="h-5 w-5 text-[#C4785E]" />
          )}
        </button>

        {/* Delete button for host */}
        {isHost && showDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute top-2 left-2 p-2 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
            aria-label="Delete photo"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}

        {isHidden && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white/90 px-3 py-1 rounded-lg text-sm font-medium text-gray-700">
              Hidden from guests
            </span>
          </div>
        )}
      </div>

      <div className="p-2 pt-0">
        <p className="text-xs text-gray-500 truncate">{photo.guest_name}</p>
        <p className="text-xs text-gray-400">
          {new Date(photo.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </article>
  );
}