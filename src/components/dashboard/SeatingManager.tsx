'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Users, Edit, Trash2, GripVertical, Download, Upload, Loader2, ArrowUpDown, X, Check, FileText, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { createBrowserClient } from '@supabase/ssr';

type Table = {
  id: string;
  wedding_id: string;
  name: string;
  capacity: number;
  display_order: number;
  created_at: string;
};

type Guest = {
  id: string;
  wedding_id: string;
  name: string;
  phone: string | null;
  table_id: string | null;
  tables?: { name: string } | null;
};

interface SeatingManagerProps {
  weddingSlug: string;
  initialTables: Table[];
  initialGuests: Guest[];
}

export function SeatingManager({ weddingSlug, initialTables, initialGuests }: SeatingManagerProps) {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [tableForm, setTableForm] = useState({ name: '', capacity: 8 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOverTable, setDragOverTable] = useState<string | null>(null);
  const [draggedGuest, setDraggedGuest] = useState<Guest | null>(null);
  const [csvImport, setCsvImport] = useState<{ file: File; preview: any[] } | null>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const resetTableForm = () => {
    setTableForm({ name: '', capacity: 8 });
    setEditingTableId(null);
    setIsCreatingTable(false);
    setError('');
  };

  const handleTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!tableForm.name.trim()) {
      setError('Table name is required');
      return;
    }

    setIsLoading(true);
    try {
      const url = editingTableId
        ? `/api/weddings/${weddingSlug}/tables/${editingTableId}`
        : `/api/weddings/${weddingSlug}/tables`;

      const method = editingTableId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tableForm.name.trim(),
          capacity: tableForm.capacity,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save table');
      }

      const saved = await res.json();
      if (editingTableId) {
        setTables((prev) => prev.map((t) => (t.id === editingTableId ? saved.table : t)));
      } else {
        setTables((prev) => [...prev, saved.table].sort((a, b) => a.display_order - b.display_order));
      }
      resetTableForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save table');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    const tableGuests = guests.filter((g) => g.table_id === id);
    if (tableGuests.length > 0) {
      if (!confirm(`This table has ${tableGuests.length} guest(s) assigned. They will be unassigned. Continue?`)) return;
    } else if (!confirm('Delete this table?')) return;

    try {
      const res = await fetch(`/api/weddings/${weddingSlug}/tables/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setTables((prev) => prev.filter((t) => t.id !== id));
      setGuests((prev) => prev.map((g) => (g.table_id === id ? { ...g, table_id: null } : g)));
    } catch {
      setError('Failed to delete table');
    }
  };

  const startEditTable = (table: Table) => {
    setEditingTableId(table.id);
    setTableForm({ name: table.name, capacity: table.capacity });
    setIsCreatingTable(true);
  };

  const handleDragStart = (guest: Guest) => {
    setDraggedGuest(guest);
  };

  const handleDragOver = (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTable(tableId);
  };

  const handleDragLeave = () => {
    setDragOverTable(null);
  };

  const handleDrop = async (e: React.DragEvent, tableId: string) => {
    e.preventDefault();
    setDragOverTable(null);

    if (!draggedGuest || draggedGuest.table_id === tableId) {
      setDraggedGuest(null);
      return;
    }

    const table = tables.find((t) => t.id === tableId);
    const currentGuests = guests.filter((g) => g.table_id === tableId);

    if (table && currentGuests.length >= table.capacity) {
      setError(`Table "${table.name}" is full (${table.capacity}/${table.capacity})`);
      setTimeout(() => setError(''), 3000);
      setDraggedGuest(null);
      return;
    }

    try {
      const res = await fetch(`/api/weddings/${weddingSlug}/guests/${draggedGuest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: tableId }),
      });
      if (!res.ok) throw new Error('Failed to assign guest');
      setGuests((prev) =>
        prev.map((g) => (g.id === draggedGuest.id ? { ...g, table_id: tableId } : g))
      );
    } catch {
      setError('Failed to assign guest to table');
    } finally {
      setDraggedGuest(null);
    }
  };

  const handleUnassignGuest = async (guestId: string) => {
    try {
      const res = await fetch(`/api/weddings/${weddingSlug}/guests/${guestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: null }),
      });
      if (!res.ok) throw new Error('Failed to unassign');
      setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, table_id: null } : g)));
    } catch {
      setError('Failed to unassign guest');
    }
  };

  const getTableGuests = (tableId: string) => {
    return guests.filter((g) => g.table_id === tableId);
  };

  const unassignedGuests = guests.filter((g) => !g.table_id);

  // CSV Import handlers
  const handleCsvFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) {
          setError('CSV must have at least a header row and one data row');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const nameIdx = headers.findIndex(h => h === 'name' || h === 'guest_name');
        const phoneIdx = headers.findIndex(h => h === 'phone' || h === 'phone_number');
        const tableNameIdx = headers.findIndex(h => h === 'table' || h === 'table_name' || h === 'table_id');

        if (nameIdx === -1) {
          setError('CSV must have a "name" column');
          return;
        }

        const preview = lines.slice(1).map((line, rowIdx) => {
          const values = parseCsvLine(line);
          return {
            row: rowIdx + 2,
            name: values[nameIdx]?.trim() || '',
            phone: phoneIdx >= 0 ? (values[phoneIdx]?.trim() || '') : '',
            tableName: tableNameIdx >= 0 ? (values[tableNameIdx]?.trim() || '') : '',
            valid: !!values[nameIdx]?.trim(),
            matched: false as boolean,
          };
        }).filter(r => r.valid);

        const matchedPreview = preview.map(p => {
          let matchedGuest = guests.find(g =>
            g.name.toLowerCase() === p.name.toLowerCase() &&
            (!p.phone || g.phone?.includes(p.phone.replace(/\D/g, '')) || p.phone.replace(/\D/g, '').includes(g.phone?.replace(/\D/g, '') || ''))
          );

          let matchedTable = tables.find(t =>
            t.name.toLowerCase() === p.tableName.toLowerCase()
          );

          return {
            ...p,
            matched: !!matchedGuest,
            matchedGuestId: matchedGuest?.id,
            matchedTableId: matchedTable?.id,
          };
        });

        setCsvImport({ file, preview: matchedPreview });
        setShowCsvModal(true);
      } catch (err) {
        setError('Failed to parse CSV: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [guests, tables]);

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleCsvImportConfirm = async () => {
    if (!csvImport) return;

    setIsLoading(true);
    setError('');

    try {
      let successCount = 0;
      let skipCount = 0;

      for (const row of csvImport.preview) {
        if (!row.matchedGuestId) {
          skipCount++;
          continue;
        }

        if (!row.matchedTableId && row.tableName) {
          skipCount++;
          continue;
        }

        try {
          const res = await fetch(`/api/weddings/${weddingSlug}/guests/${row.matchedGuestId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table_id: row.matchedTableId || null }),
          });

          if (res.ok) {
            successCount++;
            setGuests(prev => prev.map(g =>
              g.id === row.matchedGuestId ? { ...g, table_id: row.matchedTableId || null } : g
            ));
          }
        } catch {
        }
      }

      setShowCsvModal(false);
      setCsvImport(null);

      if (successCount > 0) {
        setError(`Successfully assigned ${successCount} guest(s)${skipCount > 0 ? `, ${skipCount} skipped` : ''}`);
        setTimeout(() => setError(''), 5000);
      } else if (skipCount > 0) {
        setError(`${skipCount} row(s) skipped - check guest names and table names`);
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      setError('Import failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvCancel = () => {
    setShowCsvModal(false);
    setCsvImport(null);
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Create/Edit Table Form */}
        {(isCreatingTable || editingTableId) ? (
          <TableForm
            formData={tableForm}
            setFormData={setTableForm}
            onSubmit={handleTableSubmit}
            onCancel={resetTableForm}
            isLoading={isLoading}
            error={error}
            isEditing={!!editingTableId}
          />
        ) : (
          <div className="p-6 border-2 border-dashed border-gray-300 hover:border-[#C4785E] hover:bg-[#FFF8F3] transition-colors">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <button
                onClick={() => setIsCreatingTable(true)}
                className="flex flex-col items-center gap-3 text-gray-600 hover:text-[#C4785E] p-4 flex-1"
              >
                <div className="w-14 h-14 rounded-xl bg-[#FFF8F3] flex items-center justify-center">
                  <Plus className="h-7 w-7" />
                </div>
                <span className="font-medium">Add Table</span>
                <span className="text-sm text-gray-500">Create a new table for seating</span>
              </button>
              <div className="w-full sm:w-auto border-l border-gray-300 sm:border-l-0 sm:border-t pt-4 sm:pt-0" />
              <label className="flex flex-col items-center gap-3 text-gray-600 hover:text-[#C4785E] p-4 flex-1 cursor-pointer">
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileSelect}
                  className="sr-only"
                />
                <div className="w-14 h-14 rounded-xl bg-[#FFF8F3] flex items-center justify-center">
                  <Upload className="h-7 w-7" />
                </div>
                <span className="font-medium">Import CSV</span>
                <span className="text-sm text-gray-500">Bulk assign guests to tables</span>
              </label>
            </div>
          </div>
        )}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">✕</button>
          </div>
        )}
        {/* Unassigned Guests */}
        {unassignedGuests.length > 0 && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              Unassigned Guests ({unassignedGuests.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {unassignedGuests.map((guest) => (
                <div
                  key={guest.id}
                  draggable
                  onDragStart={() => handleDragStart(guest)}
                  className="px-3 py-1.5 rounded-full text-sm bg-gray-200 text-gray-700 cursor-grab active:cursor-grabbing flex items-center gap-1.5 border border-gray-300"
                >
                  {guest.name}
                  <GripVertical className="h-3.5 w-3.5 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Tables */}
        <div className="p-6">
          {tables.length === 0 ? (
            <div className="text-center py-12">
              <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tables Created</h3>
              <p className="text-gray-500 mb-4">Click "Add Table" to create seating arrangements</p>
            </div>
          ) : (
            <div className="space-y-6">
              {tables.map((table) => {
                const tableGuests = getTableGuests(table.id);
                const isFull = tableGuests.length >= table.capacity;

                return (
                  <div
                    key={table.id}
                    className={clsx(
                      'rounded-2xl border overflow-hidden transition-all',
                      dragOverTable === table.id && !isFull
                        ? 'border-[#C4785E] bg-[#FFF8F3] ring-2 ring-[#C4785E]/20'
                        : 'border-gray-200 bg-white'
                    )}
                    onDragOver={(e) => handleDragOver(e, table.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, table.id)}
                  >
                    {/* Table Header */}
                    <div className="p-4 flex items-center justify-between bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#C4785E]/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-[#C4785E]" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{table.name}</h4>
                          <p className="text-sm text-gray-500">
                            {tableGuests.length} / {table.capacity} guests {isFull && '(Full)'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditTable(table)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="Edit table"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTable(table.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Delete table"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Table Guests */}
                    <div className="p-4">
                      {tableGuests.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {tableGuests.map((guest) => (
                            <div
                              key={guest.id}
                              className="px-3 py-1.5 rounded-full text-sm flex items-center gap-2 bg-[#FFF8F3] text-[#C4785E] border border-[#C4785E]/20"
                            >
                              <span className="font-medium">{guest.name}</span>
                              <button
                                onClick={() => handleUnassignGuest(guest.id)}
                                className="p-0.5 hover:bg-[#C4785E]/20 rounded-full transition-colors"
                                aria-label={`Remove ${guest.name} from table`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-4">No guests assigned. Drag guests here.</p>
                      )}

                      {/* Empty seats indicator */}
                      {tableGuests.length < table.capacity && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {Array.from({ length: table.capacity - tableGuests.length }).map((_, i) => (
                            <div
                              key={`empty-${i}`}
                              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center"
                            >
                              <span className="text-xs text-gray-400">Empty</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* CSV Import Modal */}
      {showCsvModal && csvImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleCsvCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="csv-modal-title"
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 id="csv-modal-title" className="text-lg font-semibold text-gray-900">Import CSV - Review Assignments</h2>
              <button onClick={handleCsvCancel} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-2">
                  Review the matches below. Green rows will be imported. Red rows will be skipped.
                </p>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-700">
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    {csvImport.preview.filter(r => r.matched).length} will be assigned
                  </span>
                  <span className="flex items-center gap-1 text-red-700">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    {csvImport.preview.filter(r => !r.matched).length} skipped (no match)
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200">
                      <th className="pb-2">Row</th>
                      <th className="pb-2">Guest Name</th>
                      <th className="pb-2">Phone</th>
                      <th className="pb-2">Table (CSV)</th>
                      <th className="pb-2">Matched Guest</th>
                      <th className="pb-2">Matched Table</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvImport.preview.map((row) => (
                      <tr key={row.row} className={clsx('border-b border-gray-100', !row.matched && 'bg-red-50')}>
                        <td className="py-2 text-gray-500">{row.row}</td>
                        <td className="py-2 font-medium">{row.name}</td>
                        <td className="py-2 text-gray-500">{row.phone || '—'}</td>
                        <td className="py-2 text-gray-500">{row.tableName || '—'}</td>
                        <td className="py-2">{row.matched ? <span className="text-green-700">✓ Found</span> : <span className="text-red-600">✗ Not found</span>}</td>
                        <td className="py-2">
                          {row.matchedTableId ? (
                            <span className="text-green-700">{tables.find(t => t.id === row.matchedTableId)?.name}</span>
                          ) : row.tableName ? (
                            <span className="text-red-600">Table not found</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-2">
                          {row.matched && row.matchedTableId ? (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Will assign</span>
                          ) : row.matched && !row.matchedTableId && row.tableName ? (
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">Table missing</span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">Skipped</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 justify-end">
                <button
                  onClick={handleCsvCancel}
                  className="px-4 py-2.5 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCsvImportConfirm}
                  disabled={isLoading || !csvImport.preview.some(r => r.matched && r.matchedTableId)}
                  className="px-4 py-2.5 rounded-lg font-medium bg-[#C4785E] text-white hover:bg-[#B06850] disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Import Assignments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TableForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  error,
  isEditing,
}: {
  formData: { name: string; capacity: number };
  setFormData: React.Dispatch<React.SetStateAction<{ name: string; capacity: number }>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string;
  isEditing: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="p-6 border-b border-gray-200 bg-gray-50 space-y-4" noValidate>
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Table Name *</label>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
            placeholder="Table 1, Family Table, etc."
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
          <select
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
          >
            {[2, 4, 6, 8, 10, 12, 14, 16].map((n) => (
              <option key={n} value={n}>
                {n} seats
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading || !formData.name.trim()}
          className="flex-1 py-2.5 px-4 rounded-lg font-medium bg-[#C4785E] text-white hover:bg-[#B06850] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {isEditing ? 'Update Table' : 'Create Table'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}