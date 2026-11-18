// Join page
import { Metadata, Viewport } from 'next';
import { GuestSessionProvider, useGuestSessionContext } from '@/components/guest/GuestSessionProvider';

export const metadata: Metadata = {
  title: 'Join Wedding',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#C4785E',
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

function JoinPageContent() {
  const { isLoading: loading } = useGuestSessionContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-muted-foreground)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <h1 className="text-2xl font-semibold text-[var(--color-foreground)] mb-4">
        Join the Wedding
      </h1>
      <p className="text-[var(--color-muted-foreground)] max-w-xs">
        Enter your name and phone number to join the wedding app.
      </p>
    </div>
  );
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return (
    <GuestSessionProvider weddingSlug={slug}>
      <JoinPageContent />
    </GuestSessionProvider>
  );
}