// Games page
import { Metadata, Viewport } from 'next';
import { GamesContent } from '@/components/guest/GamesContent';
import { GuestSessionProvider, useGuestSessionContext } from '@/components/guest/GuestSessionProvider';

export const metadata: Metadata = {
  title: 'Games & Challenges',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#C4785E',
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

function GamesPageWrapper() {
  const { isLoading: loading } = useGuestSessionContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-muted-foreground)]">Loading...</p>
      </div>
    );
  }

  return <GamesContent weddingSlug="" />;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return (
    <GuestSessionProvider weddingSlug={slug}>
      <GamesContent weddingSlug={slug} />
    </GuestSessionProvider>
  );
}