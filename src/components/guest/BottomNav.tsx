'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, Home, Calendar, Megaphone, Images, MessageCircle, Users, Gamepad2, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  key: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', icon: Home, label: 'Home', key: 'home' },
  { href: '/itinerary', icon: Calendar, label: 'Schedule', key: 'itinerary' },
  { href: '/announcements', icon: Megaphone, label: 'Updates', key: 'announcements' },
  { href: '/photos', icon: Images, label: 'Photos', key: 'photos' },
  { href: '/chat', icon: MessageCircle, label: 'Chat', key: 'chat' },
  { href: '/seating', icon: Users, label: 'Seating', key: 'seating' },
  { href: '/games', icon: Gamepad2, label: 'Games', key: 'games' },
  { href: '/info', icon: Info, label: 'Info', key: 'info' },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const getCurrentKey = () => {
    for (const item of NAV_ITEMS) {
      if (pathname === item.href || pathname.startsWith(item.href + '/')) {
        return item.key;
      }
    }
    return 'home';
  };

  const currentKey = getCurrentKey();

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          height: 'var(--bottom-nav-height)',
          backgroundColor: 'var(--bottom-nav-bg)',
          borderTop: 'var(--bottom-nav-border)',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div
          className="flex items-center justify-center h-full px-2"
          style={{ maxWidth: '100%' }}
        >
          {/* Left side - 3 items */}
          <div className="flex items-center justify-center flex-1">
            {NAV_ITEMS.slice(0, 3).map((item) => (
              <NavItem
                key={item.key}
                item={item}
                isActive={currentKey === item.key}
              />
            ))}
          </div>

          {/* Center - Camera Button */}
          <CameraButton
            size={64}
            onClick={() => setIsCameraOpen(true)}
            aria-label="Open camera to upload photo"
          />

          {/* Right side - 3 items (4th item is camera placeholder) */}
          <div className="flex items-center justify-center flex-1">
            {NAV_ITEMS.slice(4, 7).map((item) => (
              <NavItem
                key={item.key}
                item={item}
                isActive={currentKey === item.key}
              />
            ))}
            {/* Last item */}
            <NavItem
              key={NAV_ITEMS[7].key}
              item={NAV_ITEMS[7]}
              isActive={currentKey === NAV_ITEMS[7].key}
            />
          </div>
        </div>
      </nav>

      {/* Camera Modal */}
      {isCameraOpen && (
        <CameraModal onClose={() => setIsCameraOpen(false)} />
      )}

      {/* Spacer for fixed bottom nav */}
      <div className="pb-[var(--bottom-nav-height)]" aria-hidden="true" />
    </>
  );
}

function NavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={clsx(
        'flex flex-col items-center justify-center gap-1 px-3 py-1.5 min-w-[60px] transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-[var(--radius-md)]',
        isActive
          ? 'text-[var(--bottom-nav-active)]'
          : 'text-[var(--bottom-nav-inactive)]'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-6 w-6" aria-hidden="true" />
      <span className="text-xs font-medium">{item.label}</span>
    </Link>
  );
}

function CameraButton({
  size = 64,
  onClick,
  ...props
}: {
  size?: number;
  onClick: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center justify-center rounded-full transition-all duration-200',
        'hover:scale-105 active:scale-95',
        'focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]',
        'shadow-[var(--camera-btn-shadow)]'
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: 'var(--camera-btn-bg)',
        border: 'var(--camera-btn-border)',
      }}
      aria-label="Open camera"
      {...props}
    >
      <Camera
        className="h-7 w-7"
        style={{ color: 'var(--camera-btn-fg)' }}
        aria-hidden="true"
      />
    </button>
  );
}

function CameraModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
    >
      <div
        className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="camera-modal-title" className="text-lg font-semibold text-[var(--color-primary)]">
            Add Photo
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--color-muted)] transition-colors"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              // TODO: Open camera
              onClose();
            }}
            className={clsx(
              'flex flex-col items-center gap-3 p-6 rounded-[var(--radius-lg)] border-2 transition-all',
              'border-[var(--color-border)] hover:border-[var(--color-primary)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]'
            )}
          >
            <div className="p-3 rounded-full bg-[var(--color-primary)]/10">
              <Camera className="h-8 w-8 text-[var(--color-primary)]" />
            </div>
            <span className="font-medium">Take Photo</span>
            <span className="text-sm text-[var(--color-muted-foreground)]">Open camera</span>
          </button>

          <button
            onClick={() => {
              // TODO: Open gallery
              onClose();
            }}
            className={clsx(
              'flex flex-col items-center gap-3 p-6 rounded-[var(--radius-lg)] border-2 transition-all',
              'border-[var(--color-border)] hover:border-[var(--color-primary)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]'
            )}
          >
            <div className="p-3 rounded-full bg-[var(--color-primary)]/10">
              <Images className="h-8 w-8 text-[var(--color-primary)]" />
            </div>
            <span className="font-medium">Choose from Gallery</span>
            <span className="text-sm text-[var(--color-muted-foreground)]">Select existing photos</span>
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-[var(--color-muted-foreground)]">
          Photos will be shared with all guests
        </p>
      </div>
    </div>
  );
}