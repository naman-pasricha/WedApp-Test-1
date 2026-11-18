'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { EventCard } from './EventCard';
import { useGuestSessionContext } from './GuestSessionProvider';

interface WeddingData {
  id: string;
  slug: string;
  couple_name: string;
  wedding_date: string;
  venue_name: string | null;
  venue_address: string | null;
  theme: any;
}

export function HomePageContent() {
  const { session: guest, isLoading: loading } = useGuestSessionContext();
  const [wedding, setWedding] = useState<WeddingData | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!guest) return;

    async function fetchData() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Fetch wedding
      const { data: weddingData } = await supabase
        .from('weddings')
        .select('*')
        .eq('id', guest!.weddingId)
        .single();

      if (weddingData) {
        setWedding(weddingData);
      }

      // Fetch events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('wedding_id', guest!.weddingId)
        .order('starts_at', { ascending: true })
        .limit(3);

      if (eventsData) {
        setEvents(eventsData);
      }

      setLoadingData(false);
    }

    fetchData();
  }, [guest]);

  if (loading || loadingData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-muted-foreground)]">Loading...</p>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-[var(--color-muted-foreground)]">Wedding not found</p>
      </div>
    );
  }

  const weddingDate = new Date(wedding.wedding_date);
  const now = new Date();
  const diffTime = weddingDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div className="flex flex-col h-full pb-20">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[300px] flex items-end">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-transparent to-transparent z-10" />
        <div className="absolute inset-0 bg-[var(--color-primary)]/10" />
        <div className="relative z-20 w-full px-4 pb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-foreground)] mb-2">
            {wedding.couple_name}
          </h1>
          <p className="text-lg text-[var(--color-muted-foreground)] mb-6">
            {weddingDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <div className="flex items-center gap-4 text-[var(--color-primary)] font-medium">
            <span className="text-2xl font-bold">{diffDays > 0 ? diffDays : 0}</span>
            <span>days until the big day!</span>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
            Upcoming Events
          </h2>
          <Link
            href="/w/[slug]/itinerary"
            className="text-sm text-[var(--color-primary)] font-medium hover:underline"
          >
            View All
          </Link>
        </div>
        {events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="text-[var(--color-muted-foreground)] text-center py-8">
            No events scheduled yet
          </p>
        )}
      </section>

      {/* Quick Actions */}
      <section className="px-4 py-4">
        <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/w/[slug]/photos"
            className="flex flex-col items-center justify-center p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-colors"
          >
            <svg className="w-8 h-8 text-[var(--color-primary)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium text-[var(--color-foreground)]">Photos</span>
          </Link>
          <Link
            href="/w/[slug]/chat"
            className="flex flex-col items-center justify-center p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-colors"
          >
            <svg className="w-8 h-8 text-[var(--color-primary)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-medium text-[var(--color-foreground)]">Chat</span>
          </Link>
          <Link
            href="/w/[slug]/seating"
            className="flex flex-col items-center justify-center p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-colors"
          >
            <svg className="w-8 h-8 text-[var(--color-primary)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm font-medium text-[var(--color-foreground)]">Seating</span>
          </Link>
          <Link
            href="/w/[slug]/info"
            className="flex flex-col items-center justify-center p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-colors"
          >
            <svg className="w-8 h-8 text-[var(--color-primary)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-[var(--color-foreground)]">Info</span>
          </Link>
        </div>
      </section>

      {/* Venue Info */}
      {wedding.venue_name && (
        <section className="px-4 py-4">
          <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-4">
            Venue
          </h2>
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-4">
            <p className="font-medium text-[var(--color-foreground)]">{wedding.venue_name}</p>
            {wedding.venue_address && (
              <p className="text-[var(--color-muted-foreground)] mt-1">{wedding.venue_address}</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}