'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Send, Image, Smile, Mic, MoreVertical, Flag, Reply, Trash2, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useGuestSessionContext } from './GuestSessionProvider';
import type { Database } from '@/types/database';

type Message = Database['public']['Tables']['messages']['Row'] & {
  guest_name?: string;
  is_own?: boolean;
  optimistic?: boolean;
};

export function ChatContent({
  weddingId,
  guestId,
  sessionToken,
}: {
  weddingId: string;
  guestId: string;
  sessionToken: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient<Database>> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { token } = useGuestSessionContext();

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

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load initial messages
  useEffect(() => {
    if (!supabaseRef.current) return;

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabaseRef.current!
          .from('messages')
          .select('*')
          .eq('wedding_id', weddingId)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const formattedMessages = (data || [])
          .reverse()
          .map((msg) => ({
            ...msg,
            is_own: msg.guest_id === guestId,
            guest_name: msg.guest_id === guestId ? 'You' : 'Guest',
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
  }, [weddingId, guestId, sessionToken]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!supabaseRef.current) return;

    const channel = supabaseRef.current
      .channel(`messages:${weddingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `wedding_id=eq.${weddingId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.is_hidden) return;

          const formattedMsg = {
            ...newMsg,
            is_own: newMsg.guest_id === guestId,
            guest_name: newMsg.guest_id === guestId ? 'You' : 'Guest',
          };

          setMessages((prev) => {
            // Avoid duplicates from optimistic updates
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
          filter: `wedding_id=eq.${weddingId}`,
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
          filter: `wedding_id=eq.${weddingId}`,
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
  }, [weddingId, guestId]);

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!supabaseRef.current || !oldestMessageId || isLoading) return;

    try {
      const { data, error } = await supabaseRef.current
        .from('messages')
        .select('*')
        .eq('wedding_id', weddingId)
        .eq('is_hidden', false)
        .lt('created_at', messages.find((m) => m.id === oldestMessageId)?.created_at || '')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedMessages = (data || [])
        .reverse()
        .map((msg) => ({
          ...msg,
          is_own: msg.guest_id === guestId,
          guest_name: msg.guest_id === guestId ? 'You' : 'Guest',
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

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || isSending || !supabaseRef.current) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      wedding_id: weddingId,
      guest_id: guestId,
      host_user_id: null,
      content,
      message_type: 'text',
      image_url: null,
      is_broadcast: false,
      is_hidden: false,
      created_at: new Date().toISOString(),
      is_own: true,
      guest_name: 'You',
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabaseRef.current
        .from('messages')
        .insert({
          wedding_id: weddingId,
          guest_id: guestId,
          content,
          message_type: 'text',
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...data, is_own: true, guest_name: 'You' } : m))
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert('Failed to send message. Please try again.');
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
    const showTime = index === 0 || messages[index - 1]?.created_at !== msg.created_at;
    const prevMsg = messages[index - 1];
    const showAvatar = !prevMsg || prevMsg.guest_id !== msg.guest_id || prevMsg.host_user_id !== msg.host_user_id;

    return (
      <div
        key={msg.id}
        className={clsx(
          'flex gap-2 px-4 py-2',
          isOwn ? 'justify-end' : 'justify-start'
        )}
      >
        {!isOwn && showAvatar && (
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-[var(--color-primary)]">
              {msg.guest_name?.charAt(0) || 'G'}
            </span>
          </div>
        )}
        {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

        <div
          className={clsx(
            'max-w-[75%] rounded-2xl px-4 py-2',
            isOwn
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-br-md'
              : 'bg-[var(--color-surface)] text-[var(--color-muted-foreground)] rounded-bl-md border border-[var(--color-border)]'
          )}
        >
          {!isOwn && showAvatar && (
            <p className="text-xs text-[var(--color-muted-foreground)]/70 mb-1 px-1">
              {msg.guest_name || 'Guest'}
            </p>
          )}
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          {showTime && (
            <p className={clsx('text-xs mt-1 text-right', isOwn ? 'opacity-70' : 'text-[var(--color-muted-foreground)]/50')}>
              {formatTime(msg.created_at)}
            </p>
          )}
        </div>

        {isOwn && showAvatar && (
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-[var(--color-primary)]">Y</span>
          </div>
        )}
        {isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--color-background)]">
      {/* Messages List */}
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
              className="w-full py-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors"
            >
              Load earlier messages
            </button>
          )}
          {messages.map((msg, index) => renderMessage(msg, index))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className="p-2 rounded-full text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors flex-shrink-0"
            aria-label="Attachments"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {/* Attachment Menu */}
          {showAttachmentMenu && (
            <div className="absolute bottom-full left-12 mb-2 p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg flex gap-1 z-10">
              <button
                type="button"
                className="p-2 rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
                aria-label="Photo"
              >
                <Image className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="p-2 rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
                aria-label="Camera"
              >
                <Mic className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-full text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors flex-shrink-0"
            aria-label="Emoji"
          >
            <Smile className="h-5 w-5" />
          </button>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={(emoji) => setNewMessage((prev) => prev + emoji)}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}

          {/* Message Input */}
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className={clsx(
              'flex-1 px-4 py-2.5 rounded-full border border-[var(--color-border)]',
              'bg-[var(--color-background)] text-[var(--color-muted-foreground)]',
              'placeholder:text-[var(--color-muted-foreground)]/50',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20',
              'resize-none min-h-[44px] max-h-32',
              'font-[var(--font-body)] text-sm'
            )}
            rows={1}
            disabled={isSending}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className={clsx(
              'p-2.5 rounded-full flex-shrink-0 transition-colors',
              'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
              'hover:brightness-105 active:brightness-95',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// Simple Emoji Picker Component
function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const emojis = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇',
    '🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚',
    '😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩',
    '🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣',
    '😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬',
    '🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗',
    '🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯',
    '😦','😧','😮','😲','😴','🤤','😪','😵','🤐','🥴',
    '🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿',
    '👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖',
    '🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾',
    '❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💔',
    '❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️',
    '🎉','🎊','🎈','🎁','🎀','🏆','🏅','🥇','🥈','🥉',
    '👏','👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👈',
    '👉','👆','👇','☝️','👋','🤚','🖐️','✋','🖖','👌',
  ];

  return (
    <div className="absolute bottom-full left-12 mb-2 p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg z-10 max-w-xs">
      <div className="flex flex-wrap gap-1">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className="p-1.5 text-xl hover:scale-125 transition-transform rounded"
            aria-label={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}