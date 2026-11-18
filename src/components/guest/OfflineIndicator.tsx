'use client';

import { useEffect, useState, useRef } from 'react';
import { WifiOff, Wifi, CloudOff, Cloud } from 'lucide-react';
import { clsx } from 'clsx';

interface OfflineQueueItem {
  id: string;
  type: 'photo' | 'message' | 'like' | 'announcement_read';
  data: any;
  timestamp: number;
  retries: number;
}

const DB_NAME = 'wedapp-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-actions';

export function useOfflineSupport() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize IndexedDB
  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.warn('IndexedDB not available');
    };

    request.onsuccess = () => {
      setDb(request.result);
      countPending();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPending();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Count pending items
  const countPending = async () => {
    if (!db) return;
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const countRequest = store.count();
    countRequest.onsuccess = () => setPendingCount(countRequest.result);
  };

  // Add item to offline queue
  const queueAction = async (item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>) => {
    if (!db) return false;

    const fullItem: OfflineQueueItem = {
      ...item,
      id: `${item.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(fullItem);
      request.onsuccess = () => {
        countPending();
        resolve(true);
      };
      request.onerror = () => resolve(false);
    });
  };

  // Sync pending actions
  const syncPending = async () => {
    if (!db || !isOnline) return;

    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = async () => {
      const items = getAllRequest.result as OfflineQueueItem[];

      for (const item of items) {
        try {
          let success = false;

          switch (item.type) {
            case 'message':
              success = await sendMessage(item.data);
              break;
            case 'photo':
              success = await uploadPhoto(item.data);
              break;
            case 'like':
              success = await sendLike(item.data);
              break;
            case 'announcement_read':
              success = await markAnnouncementRead(item.data);
              break;
          }

          if (success) {
            // Remove from queue
            const deleteTransaction = db.transaction(STORE_NAME, 'readwrite');
            const deleteStore = deleteTransaction.objectStore(STORE_NAME);
            deleteStore.delete(item.id);
          } else {
            // Increment retry count
            if (item.retries < 3) {
              const updateTransaction = db.transaction(STORE_NAME, 'readwrite');
              const updateStore = updateTransaction.objectStore(STORE_NAME);
              const updatedItem = { ...item, retries: item.retries + 1 };
              updateStore.put(updatedItem);
            } else {
              // Max retries reached, remove
              const deleteTransaction = db.transaction(STORE_NAME, 'readwrite');
              const deleteStore = deleteTransaction.objectStore(STORE_NAME);
              deleteStore.delete(item.id);
            }
          }
        } catch (error) {
          console.error('Sync failed for item:', item, error);
        }
      }
      countPending();
    };
  };

  // API functions (would use actual API calls)
  const sendMessage = async (data: any): Promise<boolean> => {
    try {
      const response = await fetch(`/api/weddings/${data.weddingSlug}/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const uploadPhoto = async (data: any): Promise<boolean> => {
    try {
      const response = await fetch(`/api/weddings/${data.weddingSlug}/guest/upload`, {
        method: 'POST',
        body: data.formData,
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const sendLike = async (data: any): Promise<boolean> => {
    try {
      const response = await fetch(`/api/weddings/${data.weddingSlug}/photos/${data.photoId}/like`, {
        method: 'POST',
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const markAnnouncementRead = async (data: any): Promise<boolean> => {
    try {
      const response = await fetch(`/api/weddings/${data.weddingSlug}/announcements/${data.announcementId}/read`, {
        method: 'POST',
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  // Public methods for components
  const queueMessage = (data: any) => queueAction({ type: 'message', data });
  const queuePhoto = (data: any) => queueAction({ type: 'photo', data });
  const queueLike = (data: any) => queueAction({ type: 'like', data });
  const queueAnnouncementRead = (data: any) => queueAction({ type: 'announcement_read', data });

  // Trigger sync when coming online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncTimeoutRef.current = setTimeout(syncPending, 1000);
    }
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [isOnline, pendingCount]);

  return {
    isOnline,
    pendingCount,
    queueMessage,
    queuePhoto,
    queueLike,
    queueAnnouncementRead,
    syncPending,
  };
}

export function OfflineIndicator() {
  const { isOnline, pendingCount } = useOfflineSupport();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={clsx(
        'fixed top-4 left-4 right-4 md:top-auto md:bottom-4 md:left-auto md:right-4 md:w-72 z-50 animate-slide-down',
        'bg-white rounded-xl border shadow-lg p-3 flex items-center gap-3'
      )}
      role="status"
      aria-live="polite"
    >
      <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', isOnline ? 'bg-green-100' : 'bg-orange-100')}>
        {isOnline ? (
          <Wifi className="w-5 h-5 text-green-600" />
        ) : (
          <WifiOff className="w-5 h-5 text-orange-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {isOnline ? 'Back online' : 'You\'re offline'}
        </p>
        <p className="text-xs text-gray-500">
          {pendingCount > 0
            ? `${pendingCount} action${pendingCount !== 1 ? 's' : ''} pending sync`
            : isOnline
            ? 'All synced'
            : 'Changes will sync when online'}
        </p>
      </div>
      {!isOnline && (
        <CloudOff className="w-5 h-5 text-gray-400" />
      )}
      {isOnline && pendingCount > 0 && (
        <Cloud className="w-5 h-5 text-blue-500 animate-pulse-soft" />
      )}
    </div>
  );
}