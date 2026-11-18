'use client';

import type { Database } from '@/types/database';

type Event = Database['public']['Tables']['events']['Row'];

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEventColor = (type: string | null) => {
    // events table doesn't have a type column, use a default
    return 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]';
  };

  const getEventIcon = () => {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <article className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-4">
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getEventColor(null)}`}>
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
  );
}