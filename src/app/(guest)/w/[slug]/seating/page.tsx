// Seating page
import { Metadata, Viewport } from 'next';
import { SeatingChartContent } from '@/components/guest/SeatingChartContent';
import { GuestSessionProvider, useGuestSessionContext } from '@/components/guest/GuestSessionProvider';

export const metadata: Metadata = {
  title: 'Seating',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#C4785E',
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

function SeatingPageWrapper() {
  const { session: guest, isLoading: loading } = useGuestSessionContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-muted-foreground)]">Loading seating chart...</p>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-[var(--color-muted-foreground)]">Not joined</p>
      </div>
    );
  }

  return (
    <SeatingChartContent
      weddingId={guest.weddingId}
      guestId={guest.guestId}
      sessionToken={guest.sessionToken}
    />
  );
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return (
    <GuestSessionProvider weddingSlug={slug}>
      <SeatingPageWrapper />
    </GuestSessionProvider>
  );
}