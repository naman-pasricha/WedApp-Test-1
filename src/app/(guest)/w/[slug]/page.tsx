'use client';

// Guest home page
import { HomePageContent } from '@/components/guest/HomePageContent';
import { GuestSessionProvider, useGuestSessionContext } from '@/components/guest/GuestSessionProvider';
import type { Viewport } from 'next';


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#C4785E',
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

function HomePageWrapper() {
  const { session: guest, isLoading: loading } = useGuestSessionContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-muted-foreground)]">Loading...</p>
      </div>
    );
  }

  return <HomePageContent />;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return (
    <GuestSessionProvider weddingSlug={slug}>
      <HomePageWrapper />
    </GuestSessionProvider>
  );
}