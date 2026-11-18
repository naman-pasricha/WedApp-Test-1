'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useGuestSession } from '@/lib/guest-session/hooks';
import type { Database } from '@/types/database';

type Event = Database['public']['Tables']['events']['Row'];

export function ItineraryContent() {
  const { guest, loading } = useGuestSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!guest) return;

    async function fetchEvents() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('wedding_id', guest!.weddingId)
        .order('starts_at', { ascending: true });

      if (data) {
        setEvents(data);
      }
      setLoadingData(false);
    }

    fetchEvents();
  }, [guest]);

  if (loading || loadingData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-muted-foreground)]">Loading schedule...</p>
      </div>
    );
  }

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const date = new Date(event.starts_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEventIcon = () => {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full pb-20">
      <header className="px-4 py-4 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-background)] z-10">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Schedule</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {events.length} event{events.length !== 1 ? 's' : ''} planned
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className="w-16 h-16 text-[var(--color-muted-foreground)]/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[var(--color-muted-foreground)]">No events scheduled yet</p>
            <p className="text-sm text-[var(--color-muted-foreground)]/70 mt-1">
              Check back closer to the wedding day
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(eventsByDate).map(([date, dayEvents]) => (
              <section key={date} className="space-y-3">
                <h2 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                  <span className="w-8 h-px bg-[var(--color-primary)]" />
                  {date}
                </h2>
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <article
                      key={event.id}
                      className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                          {getEventIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-medium text-[var(--color-foreground)] truncate">
                              {event.title}
                            </h3>
                            <span className="text-sm text-[var(--color-muted-foreground)] whitespace-nowrap">
                              {formatTime(event.starts_at)}
                              {event.ends_at && ` - ${formatTime(event.ends_at)}`}
                            </span>
                          </div>
                          {event.description && (
                            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                              {event.description}
                            </p>
                          )}
                          {(event.venue_name || event.venue_address) && (
                            <div className="mt-2 flex items-center gap-1 text-sm text-[var(--color-muted-foreground)]">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{event.venue_name || event.venue_address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}