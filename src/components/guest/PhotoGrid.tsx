'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { Heart, Download, Loader2, Trash2, X } from 'lucide-react';
import { clsx } from 'clsx';

type Photo = Database['public']['Tables']['photos']['Row'] & {
  guest_name?: string;
  like_count: number;
  user_has_liked: boolean;
};

interface PhotoGridProps {
  weddingId: string;
  guestId: string;
  sessionToken: string;
  isHost?: boolean;
  onUploadComplete?: () => void;
}

export function PhotoGrid({
  weddingId,
  guestId,
  sessionToken,
  isHost = false,
  onUploadComplete,
}: PhotoGridProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
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

  const fetchPhotos = useCallback(
    async (pageNum: number, append = false) => {
      if (!hasMoreRef.current && !append) return;

      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const from = pageNum * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // Fetch photos with guest names and like counts
        const { data, error } = await supabase
          .from('photos')
          .select(
            `
            *,
            guest:guests!photos_guest_id_fkey(name),
            likes:photo_likes(count),
            user_like:photo_likes!inner(guest_id)
          `
          )
          .eq('wedding_id', weddingId)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;

        const transformedPhotos: Photo[] = (data || []).map((p) => ({
          ...p,
          guest_name: p.guest?.name || 'Unknown',
          like_count: p.likes?.[0]?.count || 0,
          user_has_liked: p.user_like?.some((l: any) => l.guest_id === guestId) || false,
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
    },
    [weddingId, guestId, supabase]
  );

  const toggleLike = useCallback(
    async (photoId: string, currentlyLiked: boolean) => {
      // Optimistic update
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId
            ? {
                ...p,
                like_count: currentlyLiked ? p.like_count - 1 : p.like_count + 1,
                user_has_liked: !currentlyLiked,
              }
            : p
        )
      );

      try {
        const { error } = await supabase.rpc('toggle_photo_like', {
          p_photo_id: photoId,
          p_guest_id: guestId,
        });
        if (error) throw error;
      } catch (error) {
        // Revert on error
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId
              ? {
                  ...p,
                  like_count: currentlyLiked ? p.like_count + 1 : p.like_count - 1,
                  user_has_liked: currentlyLiked,
                }
              : p
          )
        );
        console.error('Error toggling like:', error);
      }
    },
    [guestId, supabase]
  );

  const deletePhoto = useCallback(
    async (photoId: string) => {
      if (!confirm('Delete this photo?')) return;

      try {
        const { error } = await supabase
          .from('photos')
          .delete()
          .eq('id', photoId)
          .eq('guest_id', guestId);

        if (error) throw error;

        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      } catch (error) {
        console.error('Error deleting photo:', error);
      }
    },
    [guestId, supabase]
  );

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

  // Realtime subscription for new photos and likes
  useEffect(() => {
    const channel = supabase
      .channel(`photos:${weddingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos',
          filter: `wedding_id=eq.${weddingId}`,
        },
        async (payload) => {
          const newPhoto = payload.new as Photo;
          // Fetch guest name and like count for the new photo
          if (!newPhoto.guest_id) return;

          const { data: guest } = await supabase
            .from('guests')
            .select('name')
            .eq('id', newPhoto.guest_id)
            .single();

          setPhotos((prev) => [
            {
              ...newPhoto,
              guest_name: guest?.name || 'Unknown',
              like_count: 0,
              user_has_liked: false,
            },
            ...prev,
          ]);

          onUploadComplete?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'photos',
          filter: `wedding_id=eq.${weddingId}`,
        },
        (payload) => {
          const deletedId = (payload.old as Photo).id;
          setPhotos((prev) => prev.filter((p) => p.id !== deletedId));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photo_likes',
        },
        async (payload) => {
          const like = payload.new as Database['public']['Tables']['photo_likes']['Row'];
          const photoId = like.photo_id;

          // Check if this like is for one of our photos
          setPhotos((prev) =>
            prev.map((p) => {
              if (p.id !== photoId) return p;

              const isCurrentUser = like.guest_id === guestId;
              const delta = payload.eventType === 'INSERT' ? 1 : -1;

              return {
                ...p,
                like_count: Math.max(0, p.like_count + delta),
                user_has_liked: isCurrentUser
                  ? payload.eventType === 'INSERT'
                  : p.user_has_liked,
              };
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [weddingId, guestId, supabase, onUploadComplete]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      <div
        className="grid grid-cols-2 gap-3 p-3"
        style={{
          gap: 'var(--photo-grid-gap)',
          columnCount: 'var(--photo-grid-columns)',
        }}
        role="list"
        aria-label="Wedding photos"
      >
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onLike={() => toggleLike(photo.id, photo.user_has_liked)}
            onDelete={isHost || photo.guest_id === guestId ? () => deletePhoto(photo.id) : undefined}
            sessionToken={sessionToken}
          />
        ))}

        {hasMoreRef.current && (
          <div ref={loadMoreRef} className="col-span-2 flex justify-center py-4">
            {loadingMore && (
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
            )}
          </div>
        )}

        {photos.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
              <svg
                className="h-8 w-8 text-[var(--color-primary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-1">No photos yet</h3>
            <p className="text-[var(--color-muted-foreground)]">Be the first to share a photo!</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface PhotoCardProps {
  photo: Photo;
  onLike: () => void;
  onDelete?: () => void;
  sessionToken: string;
}

function PhotoCard({ photo, onLike, onDelete, sessionToken }: PhotoCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/guest-photos/${photo.storage_path}?token=${sessionToken}`;
  const thumbnailUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/guest-photos/${photo.thumbnail_path}?token=${sessionToken}`;

  return (
    <article
      className="relative group"
      style={{
        borderRadius: 'var(--photo-grid-item-radius)',
        overflow: 'hidden',
        backgroundColor: 'var(--color-muted)',
      }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-[var(--color-muted)] animate-pulse" />
        )}
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

        {/* Like overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiking(true);
            onLike();
            setTimeout(() => setIsLiking(false), 300);
          }}
          className={clsx(
            'absolute top-2 right-2 p-2 rounded-full transition-all',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
            photo.user_has_liked
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] scale-100'
              : 'bg-black/40 text-white hover:scale-110'
          )}
          aria-label={photo.user_has_liked ? 'Unlike' : 'Like'}
          aria-pressed={photo.user_has_liked}
          disabled={isLiking}
        >
          <Heart
            className={clsx(
              'h-5 w-5',
              photo.user_has_liked ? 'fill-current' : 'fill-none stroke-2'
            )}
          />
          <span className="sr-only">{photo.user_has_liked ? 'Unlike' : 'Like'}</span>
        </button>

        {/* Like count */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-white text-sm">
          <Heart className="h-4 w-4 fill-current" />
          <span>{photo.like_count}</span>
        </div>

        {/* Delete button for host/owner */}
        {onDelete && showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 left-2 p-2 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
            aria-label="Delete photo"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Guest name and time */}
      <div className="p-2 pt-0">
        <p className="text-xs text-[var(--color-muted-foreground)] truncate">
          {photo.guest_name}
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)]/70">
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

export function PhotoMasonryGrid({
  photos,
  onLike,
  onDelete,
  sessionToken,
  isHost,
}: {
  photos: Photo[];
  onLike: (photoId: string, liked: boolean) => void;
  onDelete?: (photoId: string) => void;
  sessionToken: string;
  isHost?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-3 p-3"
      style={{
        gap: 'var(--photo-grid-gap)',
        columnCount: 'var(--photo-grid-columns)',
      }}
      role="list"
      aria-label="Wedding photos"
    >
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onLike={() => onLike(photo.id, photo.user_has_liked)}
          onDelete={isHost || onDelete ? () => onDelete?.(photo.id) : undefined}
          sessionToken={sessionToken}
        />
      ))}

      {photos.length === 0 && (
        <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-[var(--color-primary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-1">No photos yet</h3>
          <p className="text-[var(--color-muted-foreground)]">Be the first to share a photo!</p>
        </div>
      )}
    </div>
  );
}