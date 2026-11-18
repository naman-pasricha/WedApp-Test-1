'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Calendar, MapPin, Shirt, Image as ImageIcon, Loader2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';

interface Event {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  dress_code: string | null;
  illustration_url: string | null;
  display_order: number;
}

interface EventsManagerProps {
  weddingId: string;
  initialEvents: Event[];
}

export function EventsManager({ weddingId, initialEvents }: EventsManagerProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    description: '',
    starts_at: '',
    ends_at: '',
    venue_name: '',
    venue_address: '',
    dress_code: '',
    illustration_url: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      starts_at: '',
      ends_at: '',
      venue_name: '',
      venue_address: '',
      dress_code: '',
      illustration_url: '',
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.starts_at) {
      setError('Title and start time are required');
      return;
    }

    setIsLoading(true);
    try {
      const url = editingId
        ? `/api/weddings/${weddingId}/events/${editingId}`
        : `/api/weddings/${weddingId}/events`;

      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save event');
      }

      const savedEvent = await res.json();
      if (editingId) {
        setEvents((prev) => prev.map((e) => (e.id === editingId ? savedEvent.event : e)));
      } else {
        setEvents((prev) => [...prev, savedEvent.event].sort((a, b) => a.display_order - b.display_order));
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;

    try {
      const res = await fetch(`/api/weddings/${weddingId}/events/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError('Failed to delete event');
    }
  };

  const moveEvent = (id: string, direction: 'up' | 'down') => {
    setEvents((prev) => {
      const index = prev.findIndex((e) => e.id === id);
      if (index === -1) return prev;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newEvents = [...prev];
      [newEvents[index], newEvents[newIndex]] = [newEvents[newIndex], newEvents[index]];
      return newEvents.map((e, i) => ({ ...e, display_order: i }));
    });
  };

  const saveOrder = async () => {
    setIsLoading(true);
    try {
      const updates = events.map((e, i) => ({ id: e.id, display_order: i }));
      const res = await fetch(`/api/weddings/${weddingId}/events/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: updates }),
      });
      if (!res.ok) throw new Error('Failed to save order');
    } catch {
      setError('Failed to save order');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (event: Event) => {
    setEditingId(event.id);
    setFormData({
      title: event.title,
      description: event.description || '',
      starts_at: event.starts_at.slice(0, 16),
      ends_at: event.ends_at?.slice(0, 16) || '',
      venue_name: event.venue_name || '',
      venue_address: event.venue_address || '',
      dress_code: event.dress_code || '',
      illustration_url: event.illustration_url || '',
    });
    setIsAdding(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Add Event Button / Form */}
      {(!isAdding && !editingId) ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full p-6 border-2 border-dashed border-gray-300 hover:border-[#C4785E] hover:bg-[#FFF8F3] transition-colors flex items-center justify-center gap-3 text-gray-600 hover:text-[#C4785E]"
        >
          <Plus className="h-6 w-6" />
          <span className="font-medium">Add Event</span>
        </button>
      ) : (
        <EventForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          isLoading={isLoading}
          error={error}
          isEditing={!!editingId}
        />
      )}

      {/* Events List */}
      {events.length > 0 && (
        <div className="divide-y divide-gray-200">
          {events.map((event, index) => (
            <EventRow
              key={event.id}
              event={event}
              index={index}
              onEdit={startEdit}
              onDelete={handleDelete}
              onMoveUp={() => moveEvent(event.id, 'up')}
              onMoveDown={() => moveEvent(event.id, 'down')}
              canMoveUp={index > 0}
              canMoveDown={index < events.length - 1}
            />
          ))}
        </div>
      )}

      {events.length > 0 && (
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={saveOrder}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#C4785E] rounded-lg hover:bg-[#B06850] disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Order
          </button>
        </div>
      )}

      {events.length === 0 && !isAdding && (
        <div className="p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No events yet. Click "Add Event" to create your first event.</p>
        </div>
      )}
    </div>
  );
}

function EventForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  error,
  isEditing,
}: {
  formData: Partial<Event>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Event>>>;
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

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
            placeholder="Mehndi Ceremony"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
          <input
            type="datetime-local"
            value={formData.starts_at || ''}
            onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <input
            type="datetime-local"
            value={formData.ends_at || ''}
            onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
          <input
            value={formData.venue_name || ''}
            onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
            placeholder="The Garden Pavilion"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Venue Address</label>
          <input
            value={formData.venue_address || ''}
            onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
            placeholder="123 Palace Road, Jaipur"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dress Code</label>
          <input
            value={formData.dress_code || ''}
            onChange={(e) => setFormData({ ...formData, dress_code: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
            placeholder="Bright colors, comfortable ethnic wear"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Illustration URL</label>
          <input
            value={formData.illustration_url || ''}
            onChange={(e) => setFormData({ ...formData, illustration_url: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
            placeholder="Traditional henna ceremony with music and dance..."
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2.5 px-4 rounded-lg font-medium bg-[#C4785E] text-white hover:bg-[#B06850] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isEditing ? 'Update Event' : 'Add Event'}
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

function EventRow({
  event,
  index,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  event: Event;
  index: number;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const date = new Date(event.starts_at);

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Drag handle */}
        <button
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 flex flex-col gap-1"
          aria-label="Move up"
        >
          <ChevronUp className="h-5 w-5" />
        </button>

        {/* Event content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
            <h3 className="font-semibold text-gray-900">{event.title}</h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-[#FFF8F3] text-[#C4785E] rounded-full">
              {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="text-sm text-gray-500">
              {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {event.venue_name && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.venue_name}
              </span>
            )}
            {event.dress_code && (
              <span className="flex items-center gap-1">
                <Shirt className="h-3.5 w-3.5" />
                {event.dress_code}
              </span>
            )}
            {event.illustration_url && (
              <span className="flex items-center gap-1 text-[#C4785E]">
                <ImageIcon className="h-3.5 w-3.5" />
                Has illustration
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 flex flex-col gap-1"
            aria-label="Move down"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
          <button
            onClick={() => onEdit(event)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Edit event"
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Delete event"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}