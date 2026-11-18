'use client';

import { useState } from 'react';
import { MessageSquare, Megaphone, Trash2, Send, Loader2, Bell, Reply, MoreVertical, Mic, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

interface Message {
  id: string;
  wedding_id: string;
  guest_id: string | null;
  host_user_id: string | null;
  content: string;
  message_type: string;
  image_url: string | null;
  is_broadcast: boolean;
  is_hidden: boolean;
  created_at: string;
  guest_name?: string;
}

interface ChatManagerProps {
  weddingSlug: string;
  initialMessages: Message[];
}

export function ChatManager({ weddingSlug, initialMessages }: ChatManagerProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isComposingBroadcast, setIsComposingBroadcast] = useState(false);
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastType, setBroadcastType] = useState<'text' | 'image'>('text');
  const [broadcastImage, setBroadcastImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'flagged' | 'broadcasts'>('all');
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);

  const resetBroadcastForm = () => {
    setBroadcastContent('');
    setBroadcastType('text');
    setBroadcastImage(null);
    setIsComposingBroadcast(false);
    setError('');
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!broadcastContent.trim() && !broadcastImage) {
      setError('Message content or image is required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/weddings/${weddingSlug}/chat/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: broadcastContent.trim(),
          message_type: broadcastType,
          image_url: broadcastImage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send broadcast');
      }

      const saved = await res.json();
      setMessages((prev) => [saved.message, ...prev]);
      resetBroadcastForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send broadcast');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHideMessage = async (id: string, hide: boolean) => {
    try {
      const res = await fetch(`/api/weddings/${weddingSlug}/chat/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_hidden: hide }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_hidden: hide } : m)));
    } catch {
      setError('Failed to update message');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Delete this message permanently?')) return;

    try {
      const res = await fetch(`/api/weddings/${weddingSlug}/chat/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError('Failed to delete message');
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      // Get signed URL
      const res = await fetch(`/api/weddings/${weddingSlug}/guest/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
      });
      if (!res.ok) throw new Error('Failed to get upload URL');

      const { uploadUrl, publicUrl } = await res.json();

      // Upload to storage
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Failed to upload image');

      setBroadcastImage(publicUrl);
      setBroadcastType('image');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    }
  };

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    if (filter === 'flagged') return false;
    if (filter === 'broadcasts') return msg.is_broadcast;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Broadcast Composer */}
      {(!isComposingBroadcast) ? (
        <button
          onClick={() => setIsComposingBroadcast(true)}
          className="w-full p-6 border-2 border-dashed border-gray-300 hover:border-[#C4785E] hover:bg-[#FFF8F3] transition-colors flex flex-col items-center gap-3 text-gray-600 hover:text-[#C4785E]"
        >
          <div className="w-14 h-14 rounded-xl bg-[#FFF8F3] flex items-center justify-center">
            <MessageSquare className="h-7 w-7" />
          </div>
          <span className="font-medium">Send Broadcast to All Guests</span>
          <span className="text-sm text-gray-500">Announcements, reminders, or updates</span>
        </button>
      ) : (
        <BroadcastForm
          content={broadcastContent}
          setContent={setBroadcastContent}
          type={broadcastType}
          setType={setBroadcastType}
          image={broadcastImage}
          setImage={setBroadcastImage}
          onImageUpload={handleImageUpload}
          onSubmit={handleBroadcastSubmit}
          onCancel={resetBroadcastForm}
          isLoading={isLoading}
          error={error}
        />
      )}

      {/* Filter Tabs */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-2">
        {[
          { value: 'all' as const, label: 'All Messages', icon: MessageSquare },
          { value: 'broadcasts' as const, label: 'Broadcasts', icon: Megaphone },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
                filter === tab.value
                  ? 'bg-white text-[#C4785E] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Messages List */}
      {filteredMessages.length > 0 && (
        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {filteredMessages.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              onHide={handleHideMessage}
              onDelete={handleDeleteMessage}
              expanded={expandedMessage === message.id}
              onToggleExpand={() => setExpandedMessage(expandedMessage === message.id ? null : message.id)}
            />
          ))}
        </div>
      )}

      {filteredMessages.length === 0 && !isComposingBroadcast && (
        <div className="p-12 text-center">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Messages Yet</h3>
          <p className="text-gray-500">Guest messages and broadcasts will appear here</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-t border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

function BroadcastForm({
  content,
  setContent,
  type,
  setType,
  image,
  setImage,
  onImageUpload,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: {
  content: string;
  setContent: (v: string) => void;
  type: 'text' | 'image';
  setType: (v: 'text' | 'image') => void;
  image: string | null;
  setImage: (v: string | null) => void;
  onImageUpload: (file: File) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string;
}) {
  return (
    <form onSubmit={onSubmit} className="p-6 border-b border-gray-200 bg-gray-50 space-y-4" noValidate>
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4785E]"
          placeholder="Type your broadcast message..."
          required={!image}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('text')}
          className={clsx(
            'px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors',
            type === 'text'
              ? 'bg-[#C4785E] text-white'
              : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Text
        </button>
        <button
          type="button"
          onClick={() => setType('image')}
          className={clsx(
            'px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors',
            type === 'image'
              ? 'bg-[#C4785E] text-white'
              : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
          )}
        >
          <ImageIcon className="h-4 w-4" />
          Image
        </button>
      </div>

      {type === 'image' && (
        <div className="space-y-2">
          {image ? (
            <div className="relative w-full max-w-md">
              <img src={image} alt="Broadcast preview" className="w-full h-auto rounded-lg border border-gray-200" />
              <button
                type="button"
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <span>✕</span>
              </button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#C4785E] hover:bg-[#FFF8F3] transition-colors cursor-pointer"
              onClick={() => document.getElementById('broadcast-image-upload')?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#C4785E]', 'bg-[#FFF8F3]'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('border-[#C4785E]', 'bg-[#FFF8F3]'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-[#C4785E]', 'bg-[#FFF8F3]');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) onImageUpload(file);
              }}
            >
              <input
                id="broadcast-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) onImageUpload(file); }}
              />
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Click or drag to upload image</p>
              <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading || (!content.trim() && !image)}
          className="flex-1 py-2.5 px-4 rounded-lg font-medium bg-[#C4785E] text-white hover:bg-[#B06850] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send Broadcast
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

function MessageRow({
  message,
  onHide,
  onDelete,
  expanded,
  onToggleExpand,
}: {
  message: Message;
  onHide: (id: string, hide: boolean) => void;
  onDelete: (id: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const date = new Date(message.created_at);
  const relativeTime = formatDistanceToNow(date, { addSuffix: true });
  const isBroadcast = message.is_broadcast;
  const isHidden = message.is_hidden;

  return (
    <div className={clsx('p-4 hover:bg-gray-50 transition-colors', isHidden && 'opacity-50 bg-gray-50')}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#C4785E]/10">
          {isBroadcast ? (
            <Megaphone className="h-5 w-5 text-[#C4785E]" />
          ) : (
            <span className="text-sm font-medium text-[#C4785E]">
              {message.guest_name?.charAt(0) || 'G'}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={clsx('font-medium', isBroadcast ? 'text-gray-900' : 'text-gray-700')}>
              {isBroadcast ? '📢 Broadcast' : message.guest_name || 'Guest'}
            </span>
            {isBroadcast && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[#FFF8F3] text-[#C4785E] rounded-full">
                Broadcast
              </span>
            )}
            {isHidden && (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                Hidden
              </span>
            )}
          </div>

          {message.message_type === 'image' && message.image_url && (
            <img
              src={message.image_url}
              alt="Message image"
              className="w-full max-w-md rounded-lg border border-gray-200 mb-2 cursor-pointer"
              onClick={() => window.open(message.image_url!, '_blank')}
            />
          )}

          <p className={clsx('whitespace-pre-wrap break-words', expanded ? '' : 'line-clamp-3')}>
            {message.content}
          </p>

          {!expanded && message.content.length > 200 && (
            <button onClick={onToggleExpand} className="text-sm text-[#C4785E] hover:underline mt-1">
              Show more
            </button>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {relativeTime}
            </span>
            <span>{format(date, 'MMM d, yyyy h:mm a')}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            {!isHidden ? (
              <button
                onClick={() => onHide(message.id, true)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Hide message"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => onHide(message.id, false)}
                className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                aria-label="Unhide message"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(message.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Delete message"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}