import { Metadata } from 'next';
import { OverviewPageClient } from './OverviewPageClient';
import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'Overview',
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerClient();

  // Verify user is host of this wedding
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return notFound();
  }

  const { data: hostCheck } = await supabase
    .from('wedding_hosts')
    .select('role')
    .eq('wedding_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!hostCheck) {
    return notFound();
  }

  // Fetch wedding data
  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, name, slug, date, hero_image_url, theme, timezone')
    .eq('id', id)
    .single();

  if (!wedding) {
    return notFound();
  }

  // Fetch stats
  const { data: stats } = await supabase.rpc('get_wedding_stats', { p_wedding_id: id });

  return <OverviewPageClient wedding={wedding} stats={stats as any} />;
}