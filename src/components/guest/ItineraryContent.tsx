'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, Navigation } from 'lucide-react';
import { clsx } from 'clsx';
import { useGuestSessionContext } from './GuestSessionProvider';
import type { Database } from '@/types/database';

type Event = Database['public']['Tables']['events']['Row'];

interface DayCarouselProps {
  dayEvents: Event[];
  date: string;
  dayHasCurrent: boolean;
  dayHasNext: boolean;
  currentEvent: Event | null;
  nextEvent: Event | null;
  formatTime: (timeStr: string) => string;
  formatDateShort: (dateStr: string) => string;
  getEventIcon: () => React.ReactNode;
  EventCard: React.ComponentType<{ event: Event; isCurrent: boolean; isNext: boolean }>;
}

function DayCarousel({
  dayEvents,
  date,
  dayHasCurrent,
  dayHasNext,
  currentEvent,
  nextEvent,
  formatTime,
  formatDateShort,
  getEventIcon,
  EventCard
}: DayCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 1 },
      '(min-width: 1024px)': { slidesToScroll: 1 },
    },
  });

  const scrollPrev = () => {
    if (emblaApi) emblaApi.scrollPrev();
  };

  const scrollNext = () => {
    if (emblaApi) emblaApi.scrollNext();
  };

  const scrollTo = (index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  };

  const selectedIndex = emblaApi ? emblaApi.selectedScrollSnap() : 0;
  const scrollSnaps = emblaApi ? emblaApi.scrollSnapList() : [];
  const canScrollPrev = emblaApi ? emblaApi.canScrollPrev() : false;
  const canScrollNext = emblaApi ? emblaApi.canScrollNext() : false;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
        <span className="w-8 h-px bg-[var(--color-primary)]" />
        {date}
        {dayHasCurrent && (
          <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs">
            Today
          </span>
        )}
      </h2>

      {/* Carousel Container */}
      <div className="relative">
        <div
          ref={emblaRef}
          className="overflow-hidden"
          style={{ touchAction: 'pan-y pinch-zoom' }}
        >
          <div className="flex gap-3 pb-4" style={{ minWidth: '100%' }}>
            {dayEvents.map((event, idx) => (
              <EventCard
                key={event.id}
                event={event}
                isCurrent={event.id === currentEvent?.id}
                isNext={event.id === nextEvent?.id && !currentEvent}
              />
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        {scrollSnaps.length > 1 && (
          <>
            <button
              onClick={() => { if (emblaApi) emblaApi.scrollPrev(); }}
              disabled={!canScrollPrev}
              className={clsx(
                'absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm',
                'shadow-lg border border-[var(--color-border)] transition-all',
                'hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed'
              )}
              aria-label="Previous event"
            >
              <ChevronLeft className="h-5 w-5 text-[var(--color-primary)]" />
            </button>
            <button
              onClick={() => { if (emblaApi) emblaApi.scrollNext(); }}
              disabled={!canScrollNext}
              className={clsx(
                'absolute right-0 top-1/2 -translate-y-1/2 -mr-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm',
                'shadow-lg border border-[var(--color-border)] transition-all',
                'hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed'
              )}
              aria-label="Next event"
            >
              <ChevronRight className="h-5 w-5 text-[var(--color-primary)]" />
            </button>
          </>
        )}

        {/* Scroll Indicator Dots */}
        {scrollSnaps.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {scrollSnaps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => { if (emblaApi) emblaApi.scrollTo(idx); }}
                className={clsx(
                  'w-2 h-2 rounded-full transition-all',
                  selectedIndex === idx
                    ? 'bg-[var(--color-primary)] w-6'
                    : 'bg-[var(--color-muted-foreground)]/30 hover:bg-[var(--color-muted-foreground)]/50'
                )}
                aria-label={`Go to event ${idx + 1}`}
                aria-current={selectedIndex === idx ? 'true' : 'false'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ItineraryContentProps {}

export function ItineraryContent() {
  const { session: guest, isLoading: loading } = useGuestSessionContext();
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

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Find current/next event
  const now = new Date();
  const currentEvent = events.find(e => {
    const start = new Date(e.starts_at);
    const end = e.ends_at ? new Date(e.ends_at) : new Date(start.getTime() + 3 * 60 * 60 * 1000);
    return now >= start && now <= end;
  }) ?? null;
  const nextEvent = !currentEvent ? (events.find(e => new Date(e.starts_at) > now) ?? null) : null;

  const getEventIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const EventCard = ({ event, isCurrent, isNext }: { event: Event; isCurrent: boolean; isNext: boolean }) => {
    const accentColor = isCurrent ? 'var(--color-primary)' : isNext ? 'var(--color-accent)' : 'var(--color-border)';
    const accentBg = isCurrent ? 'bg-[var(--color-primary)]/10' : isNext ? 'bg-[var(--color-accent)]/10' : 'bg-[var(--color-muted)]';

    return (
      <article
        className={clsx(
          'flex-shrink-0 w-[280px] sm:w-[320px] rounded-2xl border-2 p-4 transition-all duration-300',
          'shadow-[var(--shadow-md)]',
          isCurrent ? 'ring-2 ring-[var(--color-primary)] bg-[var(--color-primary)]/5' : '',
          isNext && !isCurrent ? 'ring-2 ring-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'bg-[var(--color-card)] border-[var(--color-border)]'
        )}
        style={{ borderColor: accentColor }}
      >
        {/* Current/Next Badge */}
        {(isCurrent || isNext) && (
          <div className="flex justify-between items-start mb-3">
            <span className={clsx(
              'px-2 py-1 rounded-full text-xs font-medium',
              isCurrent ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
            )}>
              {isCurrent ? 'Happening Now' : 'Up Next'}
            </span>
            {event.illustration_url && (
              <img
                src={event.illustration_url}
                alt=""
                className="w-16 h-16 rounded-lg object-cover opacity-80"
              />
            )}
          </div>
        )}

        {/* Event Image/Illustration */}
        {event.illustration_url && !isCurrent && !isNext && (
          <div className="-mx-4 -mt-4 mb-3 rounded-t-2xl overflow-hidden">
            <img
              src={event.illustration_url}
              alt={event.title}
              className="w-full h-40 object-cover"
            />
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className={clsx(
            'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
            accentBg,
            'text-[var(--color-primary)]'
          )}>
            {getEventIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-[var(--color-foreground)] truncate pr-2">
                {event.title}
              </h3>
              <span className="text-sm font-medium whitespace-nowrap" style={{ color: accentColor }}>
                {formatTime(event.starts_at)}
                {event.ends_at && ` - ${formatTime(event.ends_at)}`}
              </span>
            </div>
            {event.description && (
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)] line-clamp-2">
                {event.description}
              </p>
            )}
            {(event.venue_name || event.venue_address) && (
              <div className="mt-2 flex items-center gap-1 text-sm text-[var(--color-muted-foreground)]">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{event.venue_name || event.venue_address}</span>
              </div>
            )}
            {event.dress_code && (
              <div className="mt-2 flex items-center gap-1 text-sm text-[var(--color-muted-foreground)]">
                <span className="px-2 py-0.5 rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)] text-xs">
                  {event.dress_code}
                </span>
              </div>
            )}
            {(event.venue_lat && event.venue_lng) && (
              <a
                href={`https://maps.google.com/?q=${event.venue_lat},${event.venue_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                <Navigation className="w-4 h-4" />
                Directions
              </a>
            )}
          </div>
        </div>
      </article>
    );
  };

  if (events.length === 0) {
    return (
      <div className="flex flex-col h-full pb-20">
        <header className="px-4 py-4 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-background)] z-10">
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Schedule</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">0 events planned</p>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className="w-16 h-16 text-[var(--color-muted-foreground)]/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[var(--color-muted-foreground)]">No events scheduled yet</p>
            <p className="text-sm text-[var(--color-muted-foreground)]/70 mt-1">
              Check back closer to the wedding day
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full pb-20">
      <header className="px-4 py-4 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-background)] z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Schedule</h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {events.length} event{events.length !== 1 ? 's' : ''} planned
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
            <span className="text-sm font-medium text-[var(--color-foreground)]">
              {formatDateShort(events[0]?.starts_at || '')} - {formatDateShort(events[events.length - 1]?.starts_at || '')}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-8">
          {Object.entries(eventsByDate).map(([date, dayEvents]) => {
            const dayHasCurrent = dayEvents.some(e => e.id === currentEvent?.id);
            const dayHasNext = dayEvents.some(e => e.id === nextEvent?.id);

            return (
              <DayCarousel
                key={date}
                dayEvents={dayEvents}
                date={date}
                dayHasCurrent={dayHasCurrent}
                dayHasNext={dayHasNext}
                currentEvent={currentEvent}
                nextEvent={nextEvent}
                formatTime={formatTime}
                formatDateShort={formatDateShort}
                getEventIcon={getEventIcon}
                EventCard={EventCard}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}