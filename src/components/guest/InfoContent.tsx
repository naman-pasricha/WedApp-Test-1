'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { MapPin, HelpCircle, AlertTriangle, Info, Loader2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { useGuestSessionContext } from './GuestSessionProvider';
import type { Database } from '@/types/database';

type InfoSection = Database['public']['Tables']['info_sections']['Row'];

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  mapPin: MapPin,
  helpCircle: HelpCircle,
  alertTriangle: AlertTriangle,
  info: Info,
};

export function InfoContent({
  weddingId,
  guestId,
  sessionToken,
}: {
  weddingId: string;
  guestId: string;
  sessionToken: string;
}) {
  const [sections, setSections] = useState<InfoSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient<Database>> | null>(null);

  // Initialize Supabase client
  useEffect(() => {
    supabaseRef.current = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        },
      }
    );
  }, [sessionToken]);

  // Load info sections
  useEffect(() => {
    if (!supabaseRef.current) return;

    const loadSections = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabaseRef.current!
          .from('info_sections')
          .select('*')
          .eq('wedding_id', weddingId)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setSections(data || []);
      } catch (error) {
        console.error('Failed to load info sections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSections();
  }, [weddingId, sessionToken]);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Get icon component
  const getIcon = (iconName: string | null) => {
    if (!iconName) return Info;
    return ICONS[iconName] || Info;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <header className="sticky top-0 z-10 p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-sm">
        <h1 className="text-xl font-[var(--font-heading)] text-[var(--color-primary)]">
          Travel & Info
        </h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {sections.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-muted-foreground)]">
            <Info className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No information added yet</p>
            <p className="text-sm mt-1">Ask the host to add travel and info details</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {sections.map((section) => {
              const isExpanded = expandedSections.has(section.id);
              const Icon = getIcon(section.icon);

              return (
                <div
                  key={section.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full p-5 flex items-start gap-4 hover:bg-[var(--color-muted)]/30 transition-colors text-left"
                  >
                    <div className={clsx(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      'bg-[var(--color-primary)]/10'
                    )}>
                      <Icon className="h-6 w-6 text-[var(--color-primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--color-muted-foreground)]">
                        {section.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-muted-foreground)]">
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-[var(--color-border)] animate-slide-down">
                      <div className="prose prose-sm max-w-none text-[var(--color-muted-foreground)] mt-4">
                        {section.content.split('\n').map((paragraph, i) => (
                          <p key={i} className="whitespace-pre-wrap">{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

