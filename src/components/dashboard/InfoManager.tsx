'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, MapPin, HelpCircle, AlertTriangle, Info, GripVertical, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { createBrowserClient } from '@supabase/ssr';

type InfoSection = {
  id: string;
  wedding_id: string;
  title: string;
  content: string;
  icon: string | null;
  display_order: number;
  created_at: string;
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  mapPin: MapPin,
  helpCircle: HelpCircle,
  alertTriangle: AlertTriangle,
  info: Info,
};

const ICON_OPTIONS = [
  { value: 'mapPin', label: 'Location/Accommodation', icon: MapPin },
  { value: 'helpCircle', label: 'FAQs/Help', icon: HelpCircle },
  { value: 'alertTriangle', label: 'Emergency', icon: AlertTriangle },
  { value: 'info', label: 'General Info', icon: Info },
];

interface InfoManagerProps {
  weddingSlug: string;
  initialSections: InfoSection[];
}

export function InfoManager({ weddingSlug, initialSections }: InfoManagerProps) {
  const [sections, setSections] = useState<InfoSection[]>(initialSections);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    icon: 'info',
    display_order: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setFormData({ title: '', content: '', icon: 'info', display_order: sections.length });
    setEditingId(null);
    setIsCreating(false);
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
        ? `/api/weddings/${weddingSlug}/info/${editingId}`
        : `/api/weddings/${weddingSlug}/info`;

      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save section');
      }

      const saved = await res.json();
      if (editingId) {
        setSections((prev) => prev.map((s) => (s.id === editingId ? saved.section : s)));
      } else {
        setSections((prev) => [...prev, saved.section].sort((a, b) => a.display_order - b.display_order));
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save section');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this info section?')) return;

    try {
      const res = await fetch(`/api/weddings/${weddingSlug}/info/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setSections((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Failed to delete section');
    }
  };

  const startEdit = (section: InfoSection) => {
    setEditingId(section.id);
    setFormData({
      title: section.title,
      content: section.content,
      icon: section.icon || 'info',
      display_order: section.display_order,
    });
    setIsCreating(true);
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const newSections = [...sections];
    const [removed] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, removed);

    // Update display_order locally
    const updatedSections = newSections.map((s, i) => ({ ...s, display_order: i }));
    setSections(updatedSections);

    // Persist to server
    try {
      await Promise.all(
        updatedSections.map((s) =>
          fetch(`/api/weddings/${weddingSlug}/info/${s.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ display_order: s.display_order }),
          })
        )
      );
    } catch {
      // Revert on error
      setSections(sections);
      setError('Failed to reorder sections');
      setTimeout(() => setError(''), 3000);
    }
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex((s) => s.id === id);
    if (direction === 'up' && index > 0) handleReorder(index, index - 1);
    if (direction === 'down' && index < sections.length - 1) handleReorder(index, index + 1);
  };

  const GetIcon = (iconName: string | null) => {
    if (!iconName) return Info;
    return ICONS[iconName] || Info;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Create/Edit Form */}
      {(isCreating || editingId) ? (
        <InfoSectionForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          isLoading={isLoading}
          error={error}
          isEditing={!!editingId}
        />
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full p-6 border-2 border-dashed border-gray-300 hover:border-[#C4785E] hover:bg-[#FFF8F3] transition-colors flex flex-col items-center gap-3 text-gray-600 hover:text-[#C4785E]"
        >
          <div className="w-14 h-14 rounded-xl bg-[#FFF8F3] flex items-center justify-center">
            <Plus className="h-7 w-7" />
          </div>
          <span className="font-medium">Add Info Section</span>
          <span className="text-sm text-gray-500">Accommodation, transport, FAQs, emergency contacts</span>
        </button>
      )}

      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Sections List */}
      {sections.length > 0 && (
        <div className="divide-y divide-gray-200">
          {sections.map((section, index) => {
            const Icon = GetIcon(section.icon);
            return (
              <InfoSectionRow
                key={section.id}
                section={section}
                index={index}
                total={sections.length}
                Icon={Icon}
                onEdit={startEdit}
                onDelete={handleDelete}
                onMoveUp={() => moveSection(section.id, 'up')}
                onMoveDown={() => moveSection(section.id, 'down')}
                canMoveUp={index > 0}
                canMoveDown={index < sections.length - 1}
              />
            );
          })}
        </div>
      )}

      {sections.length === 0 && !isCreating && (
        <div className="p-12 text-center">
          <Info className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No info sections added yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Add Info Section" to create travel guides, FAQs, etc.</p>
        </div>
      )}
    </div>
  );
}

function InfoSectionForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  error,
  isEditing,
}: {
  formData: { title: string; content: string; icon: string; display_order: number };
  setFormData: React.Dispatch<React.SetStateAction<{ title: string; content: string; icon: string; display_order: number }>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string;
  isEditing: boolean;
}) {
  const GetIcon = (iconName: string) => {
    return ICONS[iconName] || Info;
  };

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
          placeholder="e.g., Hotel Accommodations"
          required
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map((opt) => {
            const OptIcon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData({ ...formData, icon: opt.value })}
                className={clsx(
                  'p-3 rounded-lg border-2 flex items-center gap-2 transition-colors',
                  formData.icon === opt.value
                    ? 'border-[#C4785E] bg-[#FFF8F3]'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <OptIcon className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={5}
          className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E] font-[var(--font-body)]"
          placeholder="Enter details for your guests... (supports line breaks)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
        <input
          type="number"
          value={formData.display_order}
          onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
          min="0"
          className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading || !formData.title.trim()}
          className="flex-1 py-2.5 px-4 rounded-lg font-medium bg-[#C4785E] text-white hover:bg-[#B06850] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {isEditing ? 'Update Section' : 'Add Section'}
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

function InfoSectionRow({
  section,
  index,
  total,
  Icon,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  section: InfoSection;
  index: number;
  total: number;
  Icon: React.ComponentType<{ className?: string }>;
  onEdit: (section: InfoSection) => void;
  onDelete: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1 py-1">
          {canMoveUp && (
            <button
              onClick={onMoveUp}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Move up"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          )}
          {canMoveDown && (
            <button
              onClick={onMoveDown}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Move down"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          )}
          {!canMoveUp && !canMoveDown && <div className="h-8" />}
        </div>

        <div className="w-12 h-12 rounded-xl bg-[#C4785E]/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-6 w-6 text-[#C4785E]" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{section.title}</h3>
          {section.content && (
            <p className="text-gray-600 text-sm mt-1 line-clamp-2 whitespace-pre-wrap">{section.content}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Order: {section.display_order}</p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(section)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Edit section"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(section.id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete section"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}