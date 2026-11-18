'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Users, Edit, Trash2, MoreVertical, Download, Upload, FileText, Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import { WeddingNav } from '@/components/dashboard/WeddingNav';
import { createBrowserClient } from '@supabase/ssr';

type Guest = {
  id: string;
  name: string;
  phone: string | null;
  table_id: string | null;
  tables: { name: string } | null;
  joined_at: string;
  last_seen_at: string;
};

type Table = { id: string; name: string };

interface GuestsPageClientProps {
  wedding: { id: string; name: string; slug: string };
  initialGuests: Guest[];
  tables: Table[];
}

export function GuestsPageClient({ wedding, initialGuests, tables }: GuestsPageClientProps) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', phone: '', table_id: '' });
  const supabaseRef = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))[0];

  const filteredGuests = guests.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.phone?.includes(searchQuery)
  );

  const startEdit = (guest: Guest) => {
    setEditingId(guest.id);
    setEditData({ name: guest.name, phone: guest.phone || '', table_id: guest.table_id || '' });
  };

  const handleSave = async (guestId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/weddings/${wedding.id}/guests/${guestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error('Failed to update');
      setGuests(prev => prev.map(g => g.id === guestId ? { ...g, ...editData } : g));
      setEditingId(null);
    } catch {
      alert('Failed to update guest');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (guestId: string) => {
    if (!confirm('Remove this guest?')) return;
    try {
      const res = await fetch(`/api/weddings/${wedding.id}/guests/${guestId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setGuests(prev => prev.filter(g => g.id !== guestId));
    } catch {
      alert('Failed to remove guest');
    }
  };

  const handleExportCsv = () => {
    const headers = ['Name', 'Phone', 'Table', 'Joined At', 'Last Seen'];
    const rows = guests.map(g => [
      g.name,
      g.phone || '',
      g.tables?.name || 'Unassigned',
      format(new Date(g.joined_at), 'yyyy-MM-dd HH:mm'),
      format(new Date(g.last_seen_at), 'yyyy-MM-dd HH:mm'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wedding.slug}-guests-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <WeddingNav weddingId={wedding.id} />
      <main className="lg:ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Guests</h1>
              <p className="text-gray-500 mt-1">{guests.length} guest{guests.length !== 1 ? 's' : ''} joined</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleExportCsv} className="px-4 py-2.5 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                <Download className="h-5 w-5" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search guests by name or phone..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C4785E] focus:border-transparent"
                />
              </div>
            </div>

            {/* Guest List */}
            <div className="divide-y divide-gray-200">
              {filteredGuests.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No guests found</p>
                </div>
              ) : (
                filteredGuests.map(guest => (
                  <GuestRow
                    key={guest.id}
                    guest={guest}
                    tables={tables}
                    isEditing={editingId === guest.id}
                    editData={editData}
                    setEditData={setEditData}
                    onSave={() => handleSave(guest.id)}
                    onCancel={() => setEditingId(null)}
                    onEdit={startEdit}
                    onDelete={() => handleDelete(guest.id)}
                    isLoading={isLoading}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function GuestRow({
  guest,
  tables,
  isEditing,
  editData,
  setEditData,
  onSave,
  onCancel,
  onEdit,
  onDelete,
  isLoading,
}: {
  guest: Guest;
  tables: Table[];
  isEditing: boolean;
  editData: { name: string; phone: string; table_id: string };
  setEditData: React.Dispatch<React.SetStateAction<{ name: string; phone: string; table_id: string }>>;
  onSave: () => void;
  onCancel: () => void;
  onEdit: (guest: Guest) => void;
  onDelete: () => void;
  isLoading: boolean;
}) {
  if (isEditing) {
    return (
      <div className="p-4 bg-[#FFF8F3] border-b border-gray-200">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={editData.name}
              onChange={e => setEditData({ ...editData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              value={editData.phone}
              onChange={e => setEditData({ ...editData, phone: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
            <select
              value={editData.table_id}
              onChange={e => setEditData({ ...editData, table_id: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
            >
              <option value="">Unassigned</option>
              {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onSave} disabled={isLoading} className="px-4 py-2 rounded-lg font-medium bg-[#C4785E] text-white hover:bg-[#B06850] disabled:opacity-50">
            {isLoading ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onCancel} className="px-4 py-2 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#C4785E]/10 flex items-center justify-center flex-shrink-0">
          <span className="font-medium text-[#C4785E]">{guest.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{guest.name}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            {guest.phone && <span>{guest.phone}</span>}
            <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', guest.table_id ? 'bg-[#FFF8F3] text-[#C4785E]' : 'bg-gray-100 text-gray-600')}>
              {guest.tables?.name || 'Unassigned'}
            </span>
            <span>Joined {formatDistanceToNow(new Date(guest.joined_at), { addSuffix: true })}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(guest)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Edit guest">
            <Edit className="h-5 w-5" />
          </button>
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" aria-label="Remove guest">
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}