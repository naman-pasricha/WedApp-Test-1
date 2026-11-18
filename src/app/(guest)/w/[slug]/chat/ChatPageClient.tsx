'use client';

import { ChatContent } from '@/components/guest/ChatContent';
import { GuestSessionProvider, useGuestSessionContext } from '@/components/guest/GuestSessionProvider';

interface ChatPageClientProps {
  weddingSlug: string;
}

function ChatPageWrapper() {
  const { isLoading: loading, weddingId, guestId, token } = useGuestSessionContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-muted-foreground)]">Loading chat...</p>
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

  return <ChatContent weddingId={weddingId} guestId={guestId} sessionToken={token} />;
}

export function ChatPageClient({ weddingSlug }: ChatPageClientProps) {
  return (
    <GuestSessionProvider weddingSlug={weddingSlug}>
      <ChatPageWrapper />
    </GuestSessionProvider>
  );
}