// Date utilities
import { format, formatDistanceToNow, isBefore, isAfter, addMinutes, parseISO } from 'date-fns';
import { format as formatTz } from 'date-fns-tz';

export function formatDate(date: Date | string, pattern = 'EEE, MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
}

export function formatTime(date: Date | string, timeZone?: string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (timeZone) {
    return formatTz(d, 'h:mm a', { timeZone });
  }
  return format(d, 'h:mm a');
}

export function formatDateTime(date: Date | string, timeZone?: string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (timeZone) {
    return formatTz(d, 'EEE, MMM d, yyyy h:mm a', { timeZone });
  }
  return format(d, 'EEE, MMM d, yyyy h:mm a');
}

export function timeUntil(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isEventCurrent(event: { starts_at: string; ends_at?: string | null }, now = new Date()): boolean {
  const start = parseISO(event.starts_at);
  const end = event.ends_at ? parseISO(event.ends_at) : addMinutes(start, 120);
  return isAfter(now, start) && isBefore(now, end);
}

export function isEventPast(event: { starts_at: string; ends_at?: string | null }, now = new Date()): boolean {
  const end = event.ends_at ? parseISO(event.ends_at) : addMinutes(parseISO(event.starts_at), 120);
  return isBefore(end, now);
}

export function getEventStatus(event: { starts_at: string; ends_at?: string | null }, now = new Date()): 'upcoming' | 'current' | 'past' {
  if (isEventCurrent(event, now)) return 'current';
  if (isEventPast(event, now)) return 'past';
  return 'upcoming';
}