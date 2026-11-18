import { Metadata } from 'next';
import { EventsPageClient } from './EventsPageClient';
import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return { title: 'Events' };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return notFound();

  const { data: hostCheck } = await supabase
    .from('wedding_hosts')
    .select('role')
    .eq('wedding_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!hostCheck) return notFound();

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, name, slug')
    .eq('id', id)
    .single();

  if (!wedding) return notFound();

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('wedding_id', id)
    .order('display_order', { ascending: true });

  return <EventsPageClient wedding={wedding} initialEvents={events || []} />;
}