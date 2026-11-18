'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Loader2, CheckCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useGuestSessionContext } from './GuestSessionProvider';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  initializePushNotifications,
  unsubscribeFromPush,
  getExistingSubscription,
} from '@/lib/push/client';

interface PushNotificationPromptProps {
  onDismiss?: () => void;
}

export function PushNotificationPrompt({ onDismiss }: PushNotificationPromptProps) {
  const { weddingId, guestId, token, isJoined } = useGuestSessionContext();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Check support and permission on mount
  useEffect(() => {
    if (!isPushSupported()) {
      setPermission('denied');
      return;
    }
    setPermission(getNotificationPermission());
    checkSubscriptionStatus();
  }, []);

  // Show prompt after user has been on site for a bit
  useEffect(() => {
    if (!isJoined || permission !== 'default') return;

    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 30000); // Show after 30 seconds

    return () => clearTimeout(timer);
  }, [isJoined, permission]);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!isPushSupported()) return;
    const existing = await getExistingSubscription();
    setIsSubscribed(!!existing);
  }, []);

  const handleEnable = async () => {
    if (!weddingId || !guestId || !token) return;

    setIsLoading(true);
    try {
      await initializePushNotifications(weddingId, guestId, token);
      setIsSubscribed(true);
      setPermission('granted');
      setShowPrompt(false);
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    setIsLoading(true);
    try {
      await unsubscribeFromPush();
      setIsSubscribed(false);
      setPermission('denied');
    } catch (error) {
      console.error('Failed to disable push notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionRequest = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
    if (perm === 'granted' && weddingId && guestId && token) {
      await handleEnable();
    }
  };

  // Don't show if not supported or already denied/subscribed
  if (!isPushSupported() || permission === 'denied' || isSubscribed) {
    return null;
  }

  // Inline banner version
  if (!showPrompt && permission === 'default') {
    return (
      <div
        className={clsx(
          'fixed bottom-24 left-4 right-4 md:max-w-md mx-auto z-40',
          'bg-white border border-gray-200 rounded-xl shadow-lg p-4',
          'animate-slide-up'
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-[#C4785E]/10 flex-shrink-0">
            <Bell className="h-5 w-5 text-[#C4785E]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm">
              Get notified of updates
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Receive push notifications for announcements and messages
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePermissionRequest}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm font-medium bg-[#C4785E] text-white rounded-lg hover:bg-[#B06850] disabled:opacity-50 flex items-center gap-1"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enable'}
            </button>
            <button
              onClick={() => { setShowPrompt(false); onDismiss?.(); }}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full prompt modal
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => { setShowPrompt(false); onDismiss?.(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="push-prompt-title"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="push-prompt-title" className="text-lg font-semibold text-[#C4785E]">
            Stay Updated
          </h2>
          <button
            onClick={() => { setShowPrompt(false); onDismiss?.(); }}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#C4785E]/10 flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-[#C4785E]" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Get Wedding Updates</h3>
          <p className="text-gray-500 text-sm">
            Receive instant notifications for announcements, schedule changes, and messages.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handlePermissionRequest}
            disabled={isLoading}
            className={clsx(
              'w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors',
              isLoading
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-[#C4785E] text-white hover:bg-[#B06850]'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Enabling...
              </>
            ) : (
              <>
                <Bell className="h-5 w-5" />
                Enable Notifications
              </>
            )}
          </button>

          <button
            onClick={() => { setShowPrompt(false); onDismiss?.(); }}
            className="w-full py-2 px-4 text-sm text-gray-500 hover:text-gray-700"
          >
            Not now
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          You can change this later in settings
        </p>
      </div>
    </div>
  );
}

// Settings toggle component for guest settings page
export function PushNotificationToggle() {
  const { weddingId, guestId, token } = useGuestSessionContext();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) {
      setPermission('denied');
      return;
    }
    setPermission(getNotificationPermission());
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!isPushSupported()) return;
    const existing = await getExistingSubscription();
    setIsSubscribed(!!existing);
  };

  const handleToggle = async () => {
    if (!weddingId || !guestId || !token) return;

    setIsLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromPush();
        setIsSubscribed(false);
        setPermission('denied');
      } else {
        await initializePushNotifications(weddingId, guestId, token);
        setIsSubscribed(true);
        setPermission('granted');
      }
    } catch (error) {
      console.error('Failed to toggle push:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPushSupported()) {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gray-100">
            <BellOff className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Push Notifications</p>
            <p className="text-sm text-gray-500">Not supported in this browser</p>
          </div>
        </div>
        <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">Unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={clsx(
          'p-2 rounded-full flex-shrink-0',
          isSubscribed ? 'bg-[#C4785E]/10' : 'bg-gray-100'
        )}>
          <Bell className={clsx(
            'h-5 w-5',
            isSubscribed ? 'text-[#C4785E]' : 'text-gray-400'
          )} />
        </div>
        <div>
          <p className="font-medium text-gray-900">Push Notifications</p>
          <p className="text-sm text-gray-500">
            {isSubscribed
              ? 'You\'ll receive instant updates'
              : permission === 'denied'
              ? 'Blocked - enable in browser settings'
              : 'Get notified of announcements and messages'}
          </p>
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={clsx(
          'relative w-14 h-8 rounded-full transition-colors flex items-center p-1',
          isSubscribed
            ? 'bg-[#C4785E]'
            : 'bg-gray-200'
        )}
        aria-pressed={isSubscribed}
        aria-label={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
      >
        <span
          className={clsx(
            'w-6 h-6 rounded-full bg-white shadow-md transition-transform',
            isSubscribed ? 'translate-x-6' : 'translate-x-0'
          )}
        >
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
        </span>
      </button>
    </div>
  );
}