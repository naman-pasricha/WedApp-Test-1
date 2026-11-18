'use client';

import { useState } from 'react';
import { Plus, Bell, Send, Loader2, Trash2, Edit, Eye, EyeOff, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

interface Announcement {
  id: string;
  title: string;
  body: string | null;
  send_push: boolean;
  created_at: string;
}

interface AnnouncementsManagerProps {
  weddingId: string;
  initialAnnouncements: Announcement[];
}

export function AnnouncementsManager({ weddingId, initialAnnouncements }: AnnouncementsManagerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [isComposing, setIsComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', body: '', send_push: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setFormData({ title: '', body: '', send_push: false });
    setEditingId(null);
    setIsComposing(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setIsLoading(true);
    try {
      const url = editingId
        ? `/api/weddings/${weddingId}/announcements/${editingId}`
        : `/api/weddings/${weddingId}/announcements`;

      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save announcement');
      }

      const saved = await res.json();
      if (editingId) {
        setAnnouncements((prev) => prev.map((a) => (a.id === editingId ? saved.announcement : a)));
      } else {
        setAnnouncements((prev) => [saved.announcement, ...prev]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save announcement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement? Guests will no longer see it.')) return;

    try {
      const res = await fetch(`/api/weddings/${weddingId}/announcements/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError('Failed to delete announcement');
    }
  };

  const startEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      body: announcement.body || '',
      send_push: announcement.send_push,
    });
    setIsComposing(true);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Compose Button / Form */}
      {(!isComposing && !editingId) ? (
        <button
          onClick={() => setIsComposing(true)}
          className="w-full p-6 border-2 border-dashed border-gray-300 hover:border-[#C4785E] hover:bg-[#FFF8F3] transition-colors flex flex-col items-center gap-3 text-gray-600 hover:text-[#C4785E]"
        >
          <div className="w-14 h-14 rounded-xl bg-[#FFF8F3] flex items-center justify-center">
            <Plus className="h-7 w-7" />
          </div>
          <span className="font-medium">Send Announcement</span>
          <span className="text-sm text-gray-500">Notify all guests instantly</span>
        </button>
      ) : (
        <AnnouncementForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          isLoading={isLoading}
          error={error}
          isEditing={!!editingId}
        />
      )}

      {/* Announcements List */}
      {announcements.length > 0 && (
        <div className="divide-y divide-gray-200">
          {announcements.map((announcement) => (
            <AnnouncementRow
              key={announcement.id}
              announcement={announcement}
              onEdit={startEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {announcements.length === 0 && !isComposing && (
        <div className="p-12 text-center">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No announcements sent yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Send Announcement" to notify all guests</p>
        </div>
      )}
    </div>
  );
}

function AnnouncementForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  error,
  isEditing,
}: {
  formData: { title: string; body: string; send_push: boolean };
  setFormData: React.Dispatch<React.SetStateAction<{ title: string; body: string; send_push: boolean }>>;
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
          placeholder="Reception starts in 30 minutes!"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
        <textarea
          value={formData.body}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
          placeholder="Add details for your guests..."
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.send_push}
          onChange={(e) => setFormData({ ...formData, send_push: e.target.checked })}
          className="w-5 h-5 rounded border-gray-300 text-[#C4785E] focus:ring-[#C4785E]"
        />
        <span className="text-sm font-medium text-gray-700">Send as push notification</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2.5 px-4 rounded-lg font-medium bg-[#C4785E] text-white hover:bg-[#B06850] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isEditing ? 'Update' : 'Send Announcement'}
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

function AnnouncementRow({
  announcement,
  onEdit,
  onDelete,
}: {
  announcement: Announcement;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => void;
}) {
  const date = new Date(announcement.created_at);
  const relativeTime = formatDistanceToNow(date, { addSuffix: true });

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
            {announcement.send_push && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[#FFF8F3] text-[#C4785E] rounded-full flex items-center gap-1">
                <Bell className="h-3 w-3" />
                Push Sent
              </span>
            )}
          </div>

          {announcement.body && (
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{announcement.body}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {relativeTime}
            </span>
            <span>{format(date, 'MMM d, yyyy h:mm a')}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(announcement)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            aria-label="Edit announcement"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(announcement.id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100"
            aria-label="Delete announcement"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}