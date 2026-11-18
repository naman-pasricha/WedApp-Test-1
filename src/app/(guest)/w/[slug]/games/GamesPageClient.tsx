'use client';

import { GamesContent } from '@/components/guest/GamesContent';
import { GuestSessionProvider, useGuestSessionContext } from '@/components/guest/GuestSessionProvider';

interface GamesPageClientProps {
  weddingSlug: string;
}

function GamesPageWrapper({ weddingSlug }: { weddingSlug: string }) {
  const { isLoading: loading } = useGuestSessionContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-muted-foreground)]">Loading games...</p>
      </div>
    );
  }

  return <GamesContent weddingSlug={weddingSlug} />;
}

export function GamesPageClient({ weddingSlug }: GamesPageClientProps) {
  return (
    <GuestSessionProvider weddingSlug={weddingSlug}>
      <GamesPageWrapper weddingSlug={weddingSlug} />
    </GuestSessionProvider>
  );
}