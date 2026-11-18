'use client';

import { AnnouncementsContent } from '@/components/guest/AnnouncementsContent';
import { GuestSessionProvider, useGuestSessionContext } from '@/components/guest/GuestSessionProvider';

interface AnnouncementsPageClientProps {
  weddingSlug: string;
}

function AnnouncementsPageWrapper() {
  const { isLoading: loading } = useGuestSessionContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-muted-foreground)]">Loading announcements...</p>
      </div>
    );
  }

  return <AnnouncementsContent />;
}

export function AnnouncementsPageClient({ weddingSlug }: AnnouncementsPageClientProps) {
  return (
    <GuestSessionProvider weddingSlug={weddingSlug}>
      <AnnouncementsPageWrapper />
    </GuestSessionProvider>
  );
}