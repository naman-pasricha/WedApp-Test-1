'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Megaphone, Users, Table, Image, MessageSquare, Settings, QrCode, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface WeddingNavProps {
  weddingId: string;
}

export function WeddingNav({ weddingId }: WeddingNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: `/dashboard/weddings/${weddingId}/overview`, label: 'Overview', icon: LayoutDashboard },
    { href: `/dashboard/weddings/${weddingId}/events`, label: 'Events', icon: Calendar },
    { href: `/dashboard/weddings/${weddingId}/announcements`, label: 'Announcements', icon: Megaphone },
    { href: `/dashboard/weddings/${weddingId}/guests`, label: 'Guests', icon: Users },
    { href: `/dashboard/weddings/${weddingId}/seating`, label: 'Seating', icon: Table },
    { href: `/dashboard/weddings/${weddingId}/photos`, label: 'Photos', icon: Image },
    { href: `/dashboard/weddings/${weddingId}/chat`, label: 'Chat', icon: MessageSquare },
    { href: `/dashboard/weddings/${weddingId}/info`, label: 'Travel & Info', icon: Info },
    { href: `/dashboard/weddings/${weddingId}/qr`, label: 'QR Code', icon: QrCode },
    { href: `/dashboard/weddings/${weddingId}/settings`, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="mb-8" aria-label="Wedding dashboard">
      <div className="overflow-x-auto">
        <ul className="flex gap-1 min-w-max p-1 bg-gray-100 rounded-xl" role="tablist">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href} role="presentation">
                <Link
                  href={item.href}
                  role="tab"
                  aria-selected={isActive}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                    'whitespace-nowrap',
                    isActive
                      ? 'bg-white text-[#C4785E] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}