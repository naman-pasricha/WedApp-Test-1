'use client';

import { ItineraryContent } from '@/components/guest/ItineraryContent';
import { GuestSessionProvider, useGuestSessionContext } from '@/components/guest/GuestSessionProvider';

interface ItineraryPageClientProps {
  weddingSlug: string;
}

function ItineraryPageWrapper() {
  const { isLoading: loading } = useGuestSessionContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-muted-foreground)]">Loading schedule...</p>
      </div>
    );
  }

  return <ItineraryContent />;
}

export function ItineraryPageClient({ weddingSlug }: ItineraryPageClientProps) {
  return (
    <GuestSessionProvider weddingSlug={weddingSlug}>
      <ItineraryPageWrapper />
    </GuestSessionProvider>
  );
}