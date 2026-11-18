'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Users, Search, Loader2, MapPin, Edit2, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { useGuestSessionContext } from './GuestSessionProvider';
import type { Database } from '@/types/database';

type Table = Database['public']['Tables']['tables']['Row'];
type Guest = Database['public']['Tables']['guests']['Row'] & {
  table_name?: string;
};

export function SeatingChartContent({
  weddingId,
  guestId,
  sessionToken,
}: {
  weddingId: string;
  guestId: string;
  sessionToken: string;
}) {
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [myTable, setMyTable] = useState<Table | null>(null);
  const [myTableGuests, setMyTableGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
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

  // Load tables and guests
  useEffect(() => {
    if (!supabaseRef.current) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load tables
        const { data: tablesData, error: tablesError } = await supabaseRef.current!
          .from('tables')
          .select('*')
          .eq('wedding_id', weddingId)
          .order('display_order', { ascending: true });

        if (tablesError) throw tablesError;

        // Load guests with table info
        const { data: guestsData, error: guestsError } = await supabaseRef.current!
          .from('guests')
          .select('id, name, table_id, tables(name)')
          .eq('wedding_id', weddingId)
          .order('name', { ascending: true });

        if (guestsError) throw guestsError;

        setTables(tablesData || []);
        // Transform guests data to match Guest type with table_name
        const transformedGuests: Guest[] = (guestsData || []).map((g: any) => ({
          ...g,
          table_name: g.tables?.name || null,
        }));
        setGuests(transformedGuests);
      } catch (error) {
        console.error('Failed to load seating data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [weddingId, sessionToken]);

  // Find my table and tablemates
  useEffect(() => {
    if (!tables.length || !guests.length) return;

    const myGuest = guests.find(g => g.id === guestId);
    if (myGuest?.table_id) {
      const table = tables.find(t => t.id === myGuest.table_id);
      if (table) {
        setMyTable(table);
        const tablemates = guests.filter(g => g.table_id === table.id && g.id !== guestId);
        setMyTableGuests(tablemates);
      }
    }
  }, [tables, guests, guestId]);

  // Toggle table expansion
  const toggleTable = (tableId: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableId)) {
        next.delete(tableId);
      } else {
        next.add(tableId);
      }
      return next;
    });
  };

  // Get guests for a table
  const getTableGuests = (tableId: string) => {
    return guests.filter(g => g.table_id === tableId);
  };

  // Search guests
  const filteredGuests = guests.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-[var(--font-heading)] text-[var(--color-primary)]">
            Seating Chart
          </h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guests..."
                className="pl-10 pr-4 py-2 w-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)] placeholder:text-[var(--color-muted-foreground)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 text-sm"
              />
            </div>
          </div>
        </div>
      </header>

      {/* My Table Card */}
      {myTable && (
        <div className="m-4 p-4 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-80">Your Table</p>
                <h2 className="text-xl font-bold">{myTable.name}</h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
              {myTableGuests.length + 1} / {myTable.capacity}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-white/20 font-medium">
              You
            </span>
            {myTableGuests.map((guest) => (
              <span key={guest.id} className="px-3 py-1 rounded-full bg-white/20 text-sm">
                {guest.name}
              </span>
            ))}
            {myTableGuests.length + 1 < myTable.capacity && (
              <span className="px-3 py-1 rounded-full bg-white/10 text-sm opacity-70">
                +{myTable.capacity - myTableGuests.length - 1} empty
              </span>
            )}
          </div>
        </div>
      )}

      {/* All Tables */}
      <div className="flex-1 overflow-y-auto p-4">
        {searchQuery ? (
          // Search results
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--color-muted-foreground)] px-2">
              Search Results ({filteredGuests.length})
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGuests.map((guest) => (
                <div
                  key={guest.id}
                  className={clsx(
                    'p-4 rounded-xl border transition-colors',
                    guest.id === guestId
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-2 ring-[var(--color-primary)]/20'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/30'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-[var(--color-primary)]">
                        {guest.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--color-muted-foreground)] truncate">
                        {guest.name} {guest.id === guestId && '(You)'}
                      </p>
                      <p className="text-sm text-[var(--color-muted-foreground)]/60">
                        {guest.table_id
                          ? `Table: ${tables.find(t => t.id === guest.table_id)?.name || 'Unknown'}`
                          : 'Not assigned'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Tables list
          <div className="space-y-4">
            {tables.length === 0 ? (
              <div className="text-center py-12 text-[var(--color-muted-foreground)]">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No tables configured yet</p>
                <p className="text-sm mt-1">Ask the host to set up seating arrangements</p>
              </div>
            ) : (
              tables.map((table) => {
                const tableGuests = getTableGuests(table.id);
                const isExpanded = expandedTables.has(table.id);
                const isMyTable = myTable?.id === table.id;

                return (
                  <div
                    key={table.id}
                    className={clsx(
                      'rounded-2xl border overflow-hidden transition-all',
                      isMyTable
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-2 ring-[var(--color-primary)]/10'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                    )}
                  >
                    {/* Table Header */}
                    <button
                      onClick={() => toggleTable(table.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-[var(--color-muted)]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                          isMyTable
                            ? 'bg-[var(--color-primary)]/10'
                            : 'bg-[var(--color-muted)]'
                        )}>
                          <Users className={clsx(
                            'h-6 w-6',
                            isMyTable ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]'
                          )} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[var(--color-muted-foreground)]">
                            {table.name}
                          </h3>
                          <p className="text-sm text-[var(--color-muted-foreground)]/60">
                            {tableGuests.length} / {table.capacity} guests
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'px-3 py-1 rounded-full text-sm font-medium',
                          tableGuests.length === table.capacity
                            ? 'bg-green-100 text-green-700'
                            : tableGuests.length > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                        )}>
                          {tableGuests.length === table.capacity ? 'Full' : `${table.capacity - tableGuests.length} seats left`}
                        </span>
                        <span className="text-[var(--color-muted-foreground)]">
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </span>
                      </div>
                    </button>

                    {/* Table Guests (expandable) */}
                    {isExpanded && tableGuests.length > 0 && (
                      <div className="px-4 pb-4 border-t border-[var(--color-border)] animate-slide-down">
                        <div className="flex flex-wrap gap-2 mt-3">
                          {tableGuests.map((guest) => (
                            <span
                              key={guest.id}
                              className={clsx(
                                'px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5',
                                guest.id === guestId
                                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                                  : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                              )}
                            >
                              {guest.name}
                              {guest.id === guestId && <span className="text-xs">(You)</span>}
                            </span>
                          ))}
                        </div>
                        {tableGuests.length < table.capacity && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {Array.from({ length: table.capacity - tableGuests.length }).map((_, i) => (
                              <div
                                key={`empty-${i}`}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-[var(--color-border)]/50 flex items-center justify-center"
                              >
                                <span className="text-xs text-[var(--color-muted-foreground)]/40">Empty</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {isExpanded && tableGuests.length === 0 && (
                      <div className="px-4 py-4 border-t border-[var(--color-border)] text-center text-[var(--color-muted-foreground)]/60">
                        No guests assigned to this table yet
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

