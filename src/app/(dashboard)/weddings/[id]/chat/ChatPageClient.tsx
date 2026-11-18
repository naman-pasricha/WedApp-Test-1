'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { Send, Image, Loader2, Trash2, MoreVertical, Flag, Reply, Shield, Loader2 as Loader2Icon, X } from 'lucide-react';
import { clsx } from 'clsx';
import { WeddingNav } from '@/components/dashboard/WeddingNav';

type Message = Database['public']['Tables']['messages']['Row'] & {
  guest_name?: string;
  is_own?: boolean;
  is_broadcast?: boolean;
};

interface ChatPageClientProps {
  wedding: { id: string; name: string; slug: string };
  userId: string;
}

export function ChatPageClient({ wedding, userId }: ChatPageClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabaseRef = useRef(
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const channelRef = useRef<any>(null);

  const supabase = supabaseRef.current;

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('wedding_id', wedding.id)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const formattedMessages = (data || [])
          .reverse()
          .map((msg) => ({
            ...msg,
            is_own: msg.host_user_id === userId,
            guest_name: msg.guest_id ? 'Guest' : 'You',
            is_broadcast: msg.is_broadcast,
          }));

        setMessages(formattedMessages);
        setOldestMessageId(formattedMessages[0]?.id || null);
        setHasMore((data || []).length === 50);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [wedding.id, userId, supabase]);

  // Subscribe to realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${wedding.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `wedding_id=eq.${wedding.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.is_hidden) return;

          const formattedMsg = {
            ...newMsg,
            is_own: newMsg.host_user_id === userId,
            guest_name: newMsg.guest_id ? 'Guest' : 'You',
            is_broadcast: newMsg.is_broadcast,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === formattedMsg.id)) return prev;
            return [...prev, formattedMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `wedding_id=eq.${wedding.id}`,
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `wedding_id=eq.${wedding.id}`,
        },
        (payload) => {
          const deletedMsg = payload.old as Message;
          setMessages((prev) => prev.filter((m) => m.id !== deletedMsg.id));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [wedding.id, userId, supabase]);

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!oldestMessageId || isLoading) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('wedding_id', wedding.id)
        .eq('is_hidden', false)
        .lt('created_at', messages.find((m) => m.id === oldestMessageId)?.created_at || '')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedMessages = (data || [])
        .reverse()
        .map((msg) => ({
          ...msg,
          is_own: msg.host_user_id === userId,
          guest_name: msg.guest_id ? 'Guest' : 'You',
          is_broadcast: msg.is_broadcast,
        }));

      if (formattedMessages.length > 0) {
        setMessages((prev) => [...formattedMessages, ...prev]);
        setOldestMessageId(formattedMessages[0]?.id || null);
        setHasMore(formattedMessages.length === 50);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image must be less than 5MB');
      return;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const storagePath = `${wedding.id}/chat/${fileName}`;

      const { data: signedUrl, error } = await supabase.storage
        .from('guest-photos')
        .createSignedUploadUrl(storagePath);

      if (error || !signedUrl) throw new Error('Failed to create upload URL');

      const uploadRes = await fetch(signedUrl.signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'x-upsert': 'true',
        },
      });

      if (!uploadRes.ok) throw new Error('Failed to upload image');

      const { data: { publicUrl } } = supabase.storage
        .from('guest-photos')
        .getPublicUrl(storagePath);

      return publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    }
  };

  // Send broadcast message (host only) - with optional image
  const handleSendBroadcast = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;
    if (isSending) return;

    const content = newMessage.trim();
    const hasImage = !!selectedImage;
    setNewMessage('');
    setIsSending(true);

    let imageUrl: string | null = null;

    // Upload image first if present
    if (hasImage && selectedImage) {
      setIsUploadingImage(true);
      imageUrl = await uploadImage(selectedImage);
      setIsUploadingImage(false);
      if (!imageUrl) {
        alert('Failed to upload image. Please try again.');
        setIsSending(false);
        return;
      }
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      wedding_id: wedding.id,
      guest_id: null,
      host_user_id: userId,
      content,
      message_type: hasImage ? 'image' : 'text',
      image_url: imageUrl,
      is_broadcast: true,
      is_hidden: false,
      created_at: new Date().toISOString(),
      is_own: true,
      guest_name: 'You (Broadcast)',
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          wedding_id: wedding.id,
          host_user_id: userId,
          content: content || (hasImage ? '📷 Image' : ''),
          message_type: hasImage ? 'image' : 'text',
          image_url: imageUrl,
          is_broadcast: true,
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...data, is_own: true, guest_name: 'You (Broadcast)', is_broadcast: true } : m))
      );

      // Clear image
      removeImage();
    } catch (error) {
      console.error('Failed to send broadcast:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert('Failed to send broadcast message');
    } finally {
      setIsSending(false);
    }
  };

  // Handle scroll for pagination
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop === 0 && hasMore && !isLoading) {
      loadMoreMessages();
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Render message
  const renderMessage = (msg: Message, index: number) => {
    const isOwn = msg.is_own;
    const isBroadcast = msg.is_broadcast;
    const showTime = index === 0 || messages[index - 1]?.created_at !== msg.created_at;
    const prevMsg = messages[index - 1];
    const showAvatar = !prevMsg || prevMsg.guest_id !== msg.guest_id || prevMsg.host_user_id !== msg.host_user_id;

    return (
      <div
        key={msg.id}
        className={clsx(
          'flex gap-2 px-4 py-2',
          isOwn ? 'justify-end' : 'justify-start',
          isBroadcast && 'bg-amber-50'
        )}
      >
        {!isOwn && showAvatar && (
          <div className="w-8 h-8 rounded-full bg-[#C4785E]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-[#C4785E]">
              {isBroadcast ? '📢' : (msg.guest_name?.charAt(0) || 'G')}
            </span>
          </div>
        )}
        {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

        <div
          className={clsx(
            'max-w-[75%] rounded-2xl px-4 py-2',
            isBroadcast
              ? 'bg-amber-100 border border-amber-200 text-amber-900 rounded-bl-md'
              : isOwn
              ? 'bg-[#C4785E] text-white rounded-br-md'
              : 'bg-white text-gray-700 rounded-bl-md border border-gray-200'
          )}
        >
          {!isOwn && showAvatar && (
            <p className="text-xs text-gray-500 mb-1 px-1">
              {isBroadcast ? '📢 Announcement' : (msg.guest_name || 'Guest')}
            </p>
          )}
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          {msg.image_url && (
            <img
              src={msg.image_url}
              alt="Shared image"
              className="mt-2 max-w-full rounded-lg"
              loading="lazy"
            />
          )}
          {showTime && (
            <p className={clsx('text-xs mt-1 text-right', isOwn ? 'opacity-70' : 'text-gray-400')}>
              {formatTime(msg.created_at)}
            </p>
          )}
        </div>

        {isOwn && showAvatar && (
          <div className="w-8 h-8 rounded-full bg-[#C4785E]/10 flex items-center justify-center flex-shrink-0">
            <Shield className="h-4 w-4 text-[#C4785E]" />
          </div>
        )}
        {isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <WeddingNav weddingId={wedding.id} />
        <main className="lg:ml-64 p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex-1 flex items-center justify-center h-96">
              <Loader2Icon className="h-8 w-8 animate-spin text-[#C4785E]" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <WeddingNav weddingId={wedding.id} />
      <main className="lg:ml-64 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Chat Moderation</h1>
            <p className="text-gray-500 mt-1">View and moderate guest conversations</p>
          </div>

          {/* Broadcast Composer */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-amber-800">Host Broadcast</span>
              <span className="px-2 py-0.5 text-xs bg-amber-200 text-amber-800 rounded-full">
                Visible to all guests
              </span>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mb-3 rounded-xl overflow-hidden max-w-xs">
                <img src={imagePreview} alt="Preview" className="w-full h-auto rounded-lg" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="flex flex-col gap-2">
              <div className="flex items-end gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="sr-only"
                  id="broadcast-image-upload"
                  disabled={isSending || isUploadingImage}
                />
                <label
                  htmlFor="broadcast-image-upload"
                  className={clsx(
                    'p-2 rounded-xl flex-shrink-0 transition-colors',
                    'bg-white border border-amber-200 text-amber-600 hover:bg-amber-50',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  aria-label="Attach image"
                >
                  <Image className="h-5 w-5" />
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendBroadcast();
                    }
                  }}
                  placeholder={isUploadingImage ? 'Uploading image...' : 'Send an announcement to all guests...'}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none min-h-[44px] max-h-32"
                  rows={1}
                  disabled={isSending || isUploadingImage}
                />
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedImage) || isSending || isUploadingImage}
                  className={clsx(
                    'px-4 py-2.5 rounded-xl font-medium flex-shrink-0 transition-colors',
                    'bg-amber-600 text-white hover:bg-amber-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  aria-label="Send broadcast"
                >
                  {isSending ? <Loader2Icon className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </form>
          </div>

          {/* Messages List */}
          <div
            ref={scrollAreaRef}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex-1 flex flex-col"
          >
            <div
              ref={scrollAreaRef}
              className="flex-1 overflow-y-auto pr-2"
              onScroll={handleScroll}
            >
              <div className="px-4 py-4 space-y-3">
                {hasMore && oldestMessageId && (
                  <button
                    onClick={loadMoreMessages}
                    disabled={isLoading}
                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Load earlier messages
                  </button>
                )}
                {messages.map((msg, index) => renderMessage(msg, index))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Guest Message Input (Read-only notice) */}
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500 text-center">
                Hosts can only send broadcasts. Guest messages appear above and cannot be replied to directly from here.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}