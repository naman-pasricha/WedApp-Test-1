'use client';

import { PhotoGrid } from '@/components/guest/PhotoGrid';
import { PhotoUploader } from '@/components/guest/PhotoUploader';
import { GuestSessionProvider, useGuestSessionContext } from '@/components/guest/GuestSessionProvider';

interface PhotosPageClientProps {
  weddingSlug: string;
}

function PhotosPageWrapper({ weddingSlug }: { weddingSlug: string }) {
  const { isLoading: loading, weddingId, guestId, token } = useGuestSessionContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-muted-foreground)]">Loading photos...</p>
      </div>
    );
  }

  if (!weddingId || !guestId || !token) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-[var(--color-muted-foreground)]">Please join the wedding first.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PhotoUploader
        weddingId={weddingId}
        guestId={guestId}
        sessionToken={token}
        onClose={() => {}}
        onUploadComplete={() => {}}
      />
      <PhotoGrid
        weddingId={weddingId}
        guestId={guestId}
        sessionToken={token}
        onUploadComplete={() => {}}
      />
    </div>
  );
}

export function PhotosPageClient({ weddingSlug }: PhotosPageClientProps) {
  return (
    <GuestSessionProvider weddingSlug={weddingSlug}>
      <PhotosPageWrapper weddingSlug={weddingSlug} />
    </GuestSessionProvider>
  );
}