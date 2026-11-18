'use client';

import { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { useGuestSessionContext } from './GuestSessionProvider';

interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
  is_broadcast: boolean;
  wedding_id: string;
}

export function AnnouncementsContent() {
  const { session: guest, isLoading: loading } = useGuestSessionContext();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showOlder, setShowOlder] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!guest) return;

    async function fetchAnnouncements() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('wedding_id', guest!.weddingId)
        .order('created_at', { ascending: false });

      if (data) {
        setAnnouncements(data);
      }
      setLoadingData(false);
    }

    fetchAnnouncements();

    // Subscribe to realtime announcements
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    channelRef.current = supabase
      .channel(`announcements:${guest!.weddingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
          filter: `wedding_id=eq.${guest!.weddingId}`,
        },
        (payload) => {
          const newAnnouncement = payload.new as Announcement;
          setAnnouncements((prev) => [newAnnouncement, ...prev]);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [guest]);

  if (loading || loadingData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[var(--color-primary)] border-t-transparent" />
        <p className="mt-4 text-[var(--color-muted-foreground)]">Loading announcements...</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Split announcements: recent (first 10 or last 7 days) and older
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentAnnouncements = announcements.filter(a => new Date(a.created_at) >= sevenDaysAgo).slice(0, 10);
  const olderAnnouncements = announcements.filter(a => new Date(a.created_at) < sevenDaysAgo || announcements.indexOf(a) >= 10);

  const renderAnnouncement = (announcement: Announcement) => (
    <article
      key={announcement.id}
      className={clsx(
        'bg-[var(--color-card)] rounded-xl border p-4',
        announcement.is_broadcast
          ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/5'
          : 'border-[var(--color-border)]'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-[var(--color-foreground)]">
              {announcement.title}
            </h3>
            {announcement.is_broadcast && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium">
                Important
              </span>
            )}
          </div>
          <p className="text-[var(--color-muted-foreground)] whitespace-pre-wrap">
            {announcement.body}
          </p>
        </div>
        <time
          className="text-xs text-[var(--color-muted-foreground)]/70 whitespace-nowrap"
          dateTime={announcement.created_at}
        >
          {formatDate(announcement.created_at)}
        </time>
      </div>
    </article>
  );

  return (
    <div className="flex flex-col h-full pb-20">
      <header className="px-4 py-4 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-background)] z-10">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Announcements</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className="w-16 h-16 text-[var(--color-muted-foreground)]/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-[var(--color-muted-foreground)]">No announcements yet</p>
            <p className="text-sm text-[var(--color-muted-foreground)]/70 mt-1">
              Updates from the couple will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Recent Announcements */}
            <div className="space-y-3">
              {recentAnnouncements.map(renderAnnouncement)}
            </div>

            {/* Older Announcements - Collapsible */}
            {olderAnnouncements.length > 0 && (
              <div className="border-t border-[var(--color-border)] pt-4">
                <button
                  onClick={() => setShowOlder(!showOlder)}
                  className={clsx(
                    'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl',
                    'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
                    'hover:bg-[var(--color-muted)]/80 transition-colors'
                  )}
                  aria-expanded={showOlder}
                >
                  <span className="font-medium">Older announcements</span>
                  <span className="text-sm px-2 py-0.5 bg-[var(--color-background)] rounded-full">
                    {olderAnnouncements.length}
                  </span>
                  {showOlder ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                {showOlder && (
                  <div className="space-y-3 mt-3 animate-slide-down">
                    {olderAnnouncements.map(renderAnnouncement)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}