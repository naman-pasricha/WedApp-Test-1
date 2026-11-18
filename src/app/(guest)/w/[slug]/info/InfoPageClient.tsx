'use client';

import { InfoContent } from '@/components/guest/InfoContent';
import { GuestSessionProvider, useGuestSessionContext } from '@/components/guest/GuestSessionProvider';

interface InfoPageClientProps {
  weddingSlug: string;
}

function InfoPageWrapper({ weddingSlug }: { weddingSlug: string }) {
  const { isLoading: loading, weddingId, guestId, token } = useGuestSessionContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-muted-foreground)]">Loading information...</p>
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

  return <InfoContent weddingId={weddingId} guestId={guestId} sessionToken={token} />;
}

export function InfoPageClient({ weddingSlug }: InfoPageClientProps) {
  return (
    <GuestSessionProvider weddingSlug={weddingSlug}>
      <InfoPageWrapper weddingSlug={weddingSlug} />
    </GuestSessionProvider>
  );
}