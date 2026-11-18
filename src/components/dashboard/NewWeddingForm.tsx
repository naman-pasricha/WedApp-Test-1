'use client';

import { useState } from 'react';
import { Plus, Loader2, X } from 'lucide-react';
import { clsx } from 'clsx';

interface NewWeddingFormProps {
  inline?: boolean;
}

export function NewWeddingForm({ inline = false }: NewWeddingFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !date) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/weddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), date }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create wedding');
      }

      const { wedding } = await res.json();
      window.location.href = `/dashboard/weddings/${wedding.id}/overview`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wedding');
    } finally {
      setIsLoading(false);
    }
  };

  if (inline) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto" noValidate>
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        <div className="grid gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Wedding Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={clsx(
                'w-full px-4 py-3 rounded-lg border',
                'focus:outline-none focus:ring-2 focus:ring-[#C4785E] focus:border-transparent'
              )}
              placeholder="Anya & Raj"
              required
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Wedding Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={clsx(
                'w-full px-4 py-3 rounded-lg border',
                'focus:outline-none focus:ring-2 focus:ring-[#C4785E] focus:border-transparent'
              )}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={clsx(
            'w-full py-3 rounded-lg font-semibold',
            'bg-[#C4785E] text-white',
            'hover:bg-[#B06850] disabled:opacity-50',
            'transition-colors flex items-center justify-center gap-2'
          )}
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          Create Wedding
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className={clsx(
        'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold',
        'bg-[#C4785E] text-white',
        'hover:bg-[#B06850] transition-colors'
      )}
    >
      <Plus className="h-5 w-5" />
      New Wedding
    </button>
  );
}