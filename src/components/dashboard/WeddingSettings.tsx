'use client';

import { useState } from 'react';
import { Loader2, Save, Palette, Trash2, AlertTriangle, Eye, Camera, Globe, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { themePresets, mergeTheme, getPresetKeys } from '@/lib/theme/presets';
import type { WeddingTheme } from '@/lib/theme/types';

interface WeddingSettingsProps {
  wedding: {
    id: string;
    name: string;
    date: string;
    slug: string;
    timezone: string;
    hero_image_url: string | null;
    theme: WeddingTheme;
  };
}

export function WeddingSettings({ wedding }: WeddingSettingsProps) {
  const [activeTab, setActiveTab] = useState<'theme' | 'details' | 'danger'>('theme');
  const [theme, setTheme] = useState<WeddingTheme>(wedding.theme || {});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize with defaults + wedding theme
  const mergedTheme = themePresets['classic-romance']
    ? mergeTheme(themePresets['classic-romance'].theme as any, theme as any)
    : theme;

  const handleThemeChange = (updates: Partial<WeddingTheme>) => {
    setTheme((prev) => mergeTheme(updates, prev));
  };

  const applyPreset = (presetKey: string) => {
    const preset = themePresets[presetKey];
    if (preset) {
      setTheme(mergeTheme(preset.theme as any, theme));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/weddings/${wedding.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save');
      }

      setSuccess('Settings saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDetailSave = async (field: string, value: string) => {
    try {
      const res = await fetch(`/api/weddings/${wedding.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setSuccess(`${field} updated`);
    } catch {
      setError('Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1" role="tablist">
        {[
          { id: 'theme', label: 'Theme', icon: Palette },
          { id: 'details', label: 'Details', icon: Globe },
          { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-white text-[#C4785E] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center gap-2">
          <span className="h-5 w-5 flex-shrink-0">✓</span>
          {success}
        </div>
      )}

      {/* Theme Tab */}
      {activeTab === 'theme' && (
        <ThemeEditor
          theme={mergedTheme}
          onChange={handleThemeChange}
          onSave={handleSave}
          isSaving={isSaving}
          weddingId={wedding.id}
          applyPreset={applyPreset}
        />
      )}

      {/* Details Tab */}
      {activeTab === 'details' && (
        <DetailsEditor
          wedding={wedding}
          onSave={handleDetailSave}
        />
      )}

      {/* Danger Zone Tab */}
      {activeTab === 'danger' && (
        <DangerZone weddingId={wedding.id} weddingName={wedding.name} />
      )}
    </div>
  );
}

function ThemeEditor({
  theme,
  onChange,
  onSave,
  isSaving,
  weddingId,
  applyPreset,
}: {
  theme: WeddingTheme;
  onChange: (updates: Partial<WeddingTheme>) => void;
  onSave: () => void;
  isSaving: boolean;
  weddingId: string;
  applyPreset: (presetKey: string) => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['colors', 'fonts']));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-8">
      {/* Preset Selector */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme Presets</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {getPresetKeys().map((key) => {
            const preset = themePresets[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={clsx(
                  'relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-[#C4785E] focus:ring-offset-2'
                )}
              >
                <img
                  src={preset.preview}
                  alt={preset.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="font-semibold">{preset.name}</p>
                  <p className="text-xs opacity-80">{preset.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Color Customization */}
      <CollapsibleSection title="Colors" defaultOpen>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { key: 'primary', label: 'Primary', fgKey: 'primaryForeground' },
            { key: 'secondary', label: 'Secondary', fgKey: 'secondaryForeground' },
            { key: 'accent', label: 'Accent', fgKey: 'accentForeground' },
            { key: 'background', label: 'Background', fgKey: null },
            { key: 'surface', label: 'Surface', fgKey: null },
            { key: 'border', label: 'Border', fgKey: null },
            { key: 'muted', label: 'Muted', fgKey: 'mutedForeground' },
          ].map(({ key, label, fgKey }) => (
            <div key={key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              <input
                type="color"
                value={theme.colors[key as keyof typeof theme.colors]}
                onChange={(e) => onChange({ colors: { ...theme.colors, [key]: e.target.value } })}
                className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
              />
              {fgKey && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{label} Text</label>
                  <input
                    type="color"
                    value={theme.colors[fgKey as keyof typeof theme.colors]}
                    onChange={(e) => onChange({ colors: { ...theme.colors, [fgKey]: e.target.value } })}
                    className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Fonts */}
      <CollapsibleSection title="Fonts" defaultOpen>
        <div className="grid gap-4 sm:grid-cols-3">
          <FontSelector
            label="Heading Font"
            value={theme.fonts.heading}
            onChange={(v) => onChange({ fonts: { ...theme.fonts, heading: v } })}
            options={[
              { value: '"Playfair Display", Georgia, serif', label: 'Playfair Display' },
              { value: '"DM Sans", -apple-system, sans-serif', label: 'DM Sans' },
              { value: '"Inter", -apple-system, sans-serif', label: 'Inter' },
              { value: '"Poppins", -apple-system, sans-serif', label: 'Poppins' },
              { value: '"Merriweather", Georgia, serif', label: 'Merriweather' },
            ]}
          />
          <FontSelector
            label="Body Font"
            value={theme.fonts.body}
            onChange={(v) => onChange({ fonts: { ...theme.fonts, body: v } })}
            options={[
              { value: '"DM Sans", -apple-system, sans-serif', label: 'DM Sans' },
              { value: '"Inter", -apple-system, sans-serif', label: 'Inter' },
              { value: '"Poppins", -apple-system, sans-serif', label: 'Poppins' },
              { value: '"Open Sans", -apple-system, sans-serif', label: 'Open Sans' },
              { value: '"Lato", -apple-system, sans-serif', label: 'Lato' },
            ]}
          />
          <FontSelector
            label="Accent Font"
            value={theme.fonts.accent || ''}
            onChange={(v) => onChange({ fonts: { ...theme.fonts, accent: v } })}
            options={[
              { value: '"Great Vibes", cursive', label: 'Great Vibes' },
              { value: '"Dancing Script", cursive', label: 'Dancing Script' },
              { value: '"Pacifico", cursive', label: 'Pacifico' },
              { value: '"Playfair Display", Georgia, serif', label: 'Playfair Display' },
              { value: '', label: 'None' },
            ]}
          />
        </div>
      </CollapsibleSection>

      {/* Background Pattern */}
      <CollapsibleSection title="Background Pattern">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { value: 'none', label: 'None' },
            { value: 'dots', label: 'Dots' },
            { value: 'lines', label: 'Lines' },
            { value: 'waves', label: 'Waves' },
            { value: 'floral', label: 'Floral' },
            { value: 'geometric', label: 'Geometric' },
          ].map(({ value, label }) => (
            <label key={value} className={clsx(
              'relative cursor-pointer',
              theme.backgroundPattern === value ? 'ring-2 ring-[#C4785E]' : ''
            )}>
              <input
                type="radio"
                name="backgroundPattern"
                value={value}
                checked={theme.backgroundPattern === value}
                onChange={() => onChange({ backgroundPattern: value as any })}
                className="sr-only"
              />
              <div className="p-4 rounded-xl border-2 bg-white transition-colors hover:border-gray-300">
                <p className="font-medium text-gray-900">{label}</p>
              </div>
            </label>
          ))}
        </div>
        {theme.backgroundPattern !== 'none' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pattern Opacity: {Math.round((theme.backgroundPatternOpacity || 0.04) * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={(theme.backgroundPatternOpacity || 0.04) * 100}
              onChange={(e) => onChange({ backgroundPatternOpacity: parseInt(e.target.value) / 100 })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#C4785E]"
            />
          </div>
        )}
      </CollapsibleSection>

      {/* Hero Style */}
      <CollapsibleSection title="Hero Style">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { value: 'gradient', label: 'Gradient', icon: '🎨' },
            { value: 'image', label: 'Full Image', icon: '🖼️' },
            { value: 'illustration', label: 'Illustration', icon: '✏️' },
            { value: 'split', label: 'Split Layout', icon: '⟷' },
          ].map(({ value, label, icon }) => (
            <label key={value} className={clsx(
              'relative cursor-pointer text-center',
              theme.heroStyle === value ? 'ring-2 ring-[#C4785E]' : ''
            )}>
              <input
                type="radio"
                name="heroStyle"
                value={value}
                checked={theme.heroStyle === value}
                onChange={() => onChange({ heroStyle: value as any })}
                className="sr-only"
              />
              <div className="p-6 rounded-xl border-2 bg-white transition-colors hover:border-gray-300">
                <span className="text-3xl">{icon}</span>
                <p className="mt-2 font-medium text-gray-900">{label}</p>
              </div>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Save Button */}
      <div className="pt-4 border-t border-gray-200 flex justify-end">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-3 rounded-xl font-semibold bg-[#C4785E] text-white hover:bg-[#B06850] disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Save Theme
        </button>
      </div>
    </div>
  );
}

function FontSelector({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <ChevronDown className={clsx('h-5 w-5 text-gray-500 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div className="p-6 border-t border-gray-200 animate-slide-down">
          {children}
        </div>
      )}
    </div>
  );
}

function DetailsEditor({
  wedding,
  onSave,
}: {
  wedding: WeddingSettingsProps['wedding'];
  onSave: (field: string, value: string) => void;
}) {
  const [name, setName] = useState(wedding.name);
  const [date, setDate] = useState(wedding.date);
  const [timezone, setTimezone] = useState(wedding.timezone);
  const [heroUrl, setHeroUrl] = useState(wedding.hero_image_url || '');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 max-w-2xl">
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wedding Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => onSave('name', name)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wedding Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onBlur={() => onSave('date', date)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              onBlur={() => onSave('timezone', timezone)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Kolkata">India (IST)</option>
              <option value="Asia/Singapore">Singapore</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Australia/Sydney">Sydney</option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Image</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              value={heroUrl}
              onChange={(e) => setHeroUrl(e.target.value)}
              onBlur={() => onSave('hero_image_url', heroUrl)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
              placeholder="https://example.com/hero.jpg"
            />
          </div>
          {heroUrl && (
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-gray-200">
              <img src={heroUrl} alt="Hero preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest App URL</h3>
        <div className="p-4 bg-gray-50 rounded-xl font-mono text-sm text-gray-700 break-all">
          {process.env.NEXT_PUBLIC_APP_URL}/w/{wedding.slug}
        </div>
      </section>
    </div>
  );
}

function DangerZone({ weddingId, weddingName }: { weddingId: string; weddingName: string }) {
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmName !== weddingName) return;
    if (!confirm('This will permanently delete the wedding and all its data. Are you absolutely sure?')) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/weddings/${weddingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      window.location.href = '/dashboard';
    } catch {
      alert('Failed to delete wedding');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-red-200 p-6 max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Danger Zone</h3>
          <p className="text-sm text-gray-500">Irreversible actions</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <h4 className="font-medium text-red-800 mb-2">Delete Wedding</h4>
          <p className="text-sm text-red-700 mb-4">
            Permanently delete "{weddingName}" and all associated data (guests, photos, messages, etc.).
            This action cannot be undone.
          </p>
          <input
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={`Type "${weddingName}" to confirm`}
            className="w-full px-4 py-2 rounded-lg border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
          />
          <button
            onClick={handleDelete}
            disabled={confirmName !== weddingName || isDeleting}
            className="w-full py-2.5 px-4 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
            Delete Wedding Permanently
          </button>
        </div>
      </div>
    </div>
  );
}