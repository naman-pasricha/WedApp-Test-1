// Games page
import { Metadata, Viewport } from 'next';
import { GamesPageClient } from './GamesPageClient';

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

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <GamesPageClient weddingSlug={slug} />;
}