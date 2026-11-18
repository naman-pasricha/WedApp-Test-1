// Chat page
import { Metadata, Viewport } from 'next';
import { ChatPageClient } from './ChatPageClient';

export const metadata: Metadata = {
  title: 'Chat',
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
  return <ChatPageClient weddingSlug={slug} />;
}