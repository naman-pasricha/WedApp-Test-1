// Photos page
import { Metadata, Viewport } from 'next';
import { PhotoGrid } from '@/components/guest/PhotoGrid';
import { PhotoUploader } from '@/components/guest/PhotoUploader';
import { GuestSessionProvider, useGuestSessionContext } from '@/components/guest/GuestSessionProvider';

export const metadata: Metadata = {
  title: 'Photos',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#C4785E',
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

function PhotosPageWrapper() {
  const { session: guest, isLoading: loading } = useGuestSessionContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-muted-foreground)]">Loading photos...</p>
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
    <div className="flex flex-col h-full">
      <PhotoGrid
        weddingId={guest.weddingId}
        guestId={guest.guestId}
        sessionToken={guest.sessionToken}
      />
      <PhotoUploader
        weddingId={guest.weddingId}
        guestId={guest.guestId}
        sessionToken={guest.sessionToken}
        onClose={() => {}}
      />
    </div>
  );
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return (
    <GuestSessionProvider weddingSlug={slug}>
      <PhotosPageWrapper />
    </GuestSessionProvider>
  );
}