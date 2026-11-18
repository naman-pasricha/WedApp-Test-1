// Info page
import { Metadata, Viewport } from 'next';
import { InfoPageClient } from './InfoPageClient';

export const metadata: Metadata = {
  title: 'Information',
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
  return <InfoPageClient weddingSlug={slug} />;
}