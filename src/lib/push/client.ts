// Push Notification Client Utilities
// Handles subscription, permission requests, and service worker communication

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url: string;
    announcement_id: string;
  };
  actions?: Array<{ action: string; title: string }>;
  requireInteraction?: boolean;
}

// Convert base64 string to Uint8Array for VAPID key
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Get current notification permission state
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    return 'denied';
  }
  return await Notification.requestPermission();
}

// Subscribe to push notifications
export async function subscribeToPush(
  vapidPublicKey: string
): Promise<PushSubscriptionData | null> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported');
    return null;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Convert to serializable format
    const json = subscription.toJSON();
    const keys = json.keys as { p256dh?: string; auth?: string } | undefined;
    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: keys?.p256dh || '',
        auth: keys?.auth || '',
      },
    };
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    return false;
  }
}

// Get existing subscription
export async function getExistingSubscription(): Promise<PushSubscriptionData | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return null;

    const json = subscription.toJSON();
    const keys = json.keys as { p256dh?: string; auth?: string } | undefined;
    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: keys?.p256dh || '',
        auth: keys?.auth || '',
      },
    };
  } catch (error) {
    console.error('Failed to get existing subscription:', error);
    return null;
  }
}

// Save subscription to server
export async function saveSubscriptionToServer(
  weddingId: string,
  guestId: string,
  sessionToken: string,
  subscription: PushSubscriptionData
): Promise<boolean> {
  try {
    const res = await fetch(`/api/weddings/${weddingId}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        guest_id: guestId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      }),
    });

    return res.ok;
  } catch (error) {
    console.error('Failed to save subscription:', error);
    return false;
  }
}

// Remove subscription from server
export async function removeSubscriptionFromServer(
  weddingId: string,
  sessionToken: string,
  endpoint: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/weddings/${weddingId}/push/subscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ endpoint }),
    });

    return res.ok;
  } catch (error) {
    console.error('Failed to remove subscription:', error);
    return false;
  }
}

// Initialize push notifications for a guest
export async function initializePushNotifications(
  weddingId: string,
  guestId: string,
  sessionToken: string
): Promise<void> {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    console.warn('VAPID public key not configured');
    return;
  }

  // Check if already subscribed
  const existing = await getExistingSubscription();
  if (existing) {
    await saveSubscriptionToServer(weddingId, guestId, sessionToken, existing);
    return;
  }

  // Subscribe and save
  const subscription = await subscribeToPush(vapidPublicKey);
  if (subscription) {
    await saveSubscriptionToServer(weddingId, guestId, sessionToken, subscription);
  }
}