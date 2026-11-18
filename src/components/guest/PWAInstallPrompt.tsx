'use client';

import { useEffect, useState, useRef } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { clsx } from 'clsx';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const dismissRef = useRef<number>();

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    if (standalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after a delay to not be too aggressive
      dismissRef.current = window.setTimeout(() => {
        setShowPrompt(true);
      }, 10000); // 10 seconds after page load
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      if (dismissRef.current) {
        clearTimeout(dismissRef.current);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (dismissRef.current) {
        clearTimeout(dismissRef.current);
      }
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setShowPrompt(false);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (dismissRef.current) {
      clearTimeout(dismissRef.current);
    }
    // Don't show again for 24 hours
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Check if dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) {
      setShowPrompt(false);
    }
  }, []);

  // Don't show if already installed, on iOS (different install flow), or no prompt available
  if (isStandalone || isIOS || !deferredPrompt || !showPrompt) {
    return null;
  }

  return (
    <div
      className={clsx(
        'fixed bottom-20 left-4 right-4 md:bottom-24 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up',
        'bg-white rounded-2xl border border-gray-200 shadow-xl p-4'
      )}
      role="dialog"
      aria-label="Install WedApp"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#C4785E] to-[#D4A574] flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">Install WedApp</h3>
          <p className="text-sm text-gray-500 mt-1">
            Add to home screen for quick access and offline support
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-[#C4785E] rounded-lg hover:bg-[#B06850] transition-colors"
            >
              <Download className="w-4 h-4 inline mr-1" />
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export function IOSInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const dismissRef = useRef<number>();

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    if (!iOS || standalone) return;

    const dismissed = localStorage.getItem('ios-install-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    dismissRef.current = window.setTimeout(() => {
      setShowBanner(true);
    }, 15000);

    return () => {
      if (dismissRef.current) {
        clearTimeout(dismissRef.current);
      }
    };
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    if (dismissRef.current) {
      clearTimeout(dismissRef.current);
    }
    localStorage.setItem('ios-install-dismissed', Date.now().toString());
  };

  if (!isIOS || isStandalone || !showBanner) {
    return null;
  }

  return (
    <div
      className={clsx(
        'fixed bottom-20 left-4 right-4 md:bottom-24 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up',
        'bg-white rounded-2xl border border-gray-200 shadow-xl p-4'
      )}
      role="dialog"
      aria-label="Install WedApp on iOS"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#C4785E] to-[#D4A574] flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">Add to Home Screen</h3>
          <p className="text-sm text-gray-500 mt-1">
            Tap the Share button <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-xs font-mono text-gray-700">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </span> then "Add to Home Screen"
          </p>
          <button
            onClick={handleDismiss}
            className="mt-3 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors w-full"
          >
            Got it
          </button>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}