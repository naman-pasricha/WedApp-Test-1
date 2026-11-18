'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, LogOut, LayoutDashboard, Calendar, Megaphone, Users, Image, MessageSquare, Table, Settings, Plus, Home } from 'lucide-react';
import { clsx } from 'clsx';

interface DashboardSidebarProps {
  user: { email?: string; user_metadata?: { full_name?: string } };
  weddings: Array<{ id: string; slug: string; name: string; date: string }>;
}

export function DashboardSidebar({ user, weddings }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col">
      {/* Header */}
      <div className="flex flex-col p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C4785E] to-[#D4A574] flex items-center justify-center">
            <Home className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">WedApp</span>
        </Link>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C4785E] to-[#D4A574] flex items-center justify-center text-white font-medium">
            {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.user_metadata?.full_name || 'Host'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Dashboard navigation">
        {weddings.length === 0 ? (
          <NewWeddingCard />
        ) : (
          <>
            <WeddingSelector weddings={weddings} currentPath={pathname} />
            <div className="pt-4 border-t border-gray-200 mt-4">
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Current Wedding
              </h3>
              <DashboardNavItems currentPath={pathname} />
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <a
          href="/api/auth/signout"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium',
            'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
            'transition-colors'
          )}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </a>
      </div>
    </aside>
  );
}

function NewWeddingCard() {
  return (
    <Link
      href="/dashboard/weddings/new"
      className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#C4785E] hover:bg-[#FFF8F3] transition-colors group"
    >
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-[#C4785E] group-hover:text-white transition-colors">
        <Plus className="h-6 w-6 text-gray-400 group-hover:text-white" />
      </div>
      <div>
        <p className="font-medium text-gray-900">Create Your First Wedding</p>
        <p className="text-sm text-gray-500">Set up your wedding guest app</p>
      </div>
    </Link>
  );
}

function WeddingSelector({
  weddings,
  currentPath,
}: {
  weddings: Array<{ id: string; slug: string; name: string; date: string }>;
  currentPath: string;
}) {
  // Extract wedding ID from pathname
  const match = currentPath.match(/\/dashboard\/weddings\/([^/]+)/);
  const currentWeddingId = match?.[1];

  return (
    <div className="space-y-2">
      <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Your Weddings
      </h3>
      {weddings.map((wedding) => {
        const isActive = currentWeddingId === wedding.id;
        const href = `/dashboard/weddings/${wedding.id}`;
        return (
          <Link
            key={wedding.id}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              isActive
                ? 'bg-[#FFF8F3] text-[#C4785E]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C4785E] to-[#D4A574] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {wedding.name.split(' ').map((w) => w[0]).join('').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate">{wedding.name}</p>
              <p className="text-xs opacity-70 truncate">{new Date(wedding.date).toLocaleDateString()}</p>
            </div>
            {isActive && <ChevronRight className="h-4 w-4 text-[#C4785E]" />}
          </Link>
        );
      })}
      <Link
        href="/dashboard/weddings/new"
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Plus className="h-5 w-5" />
        New Wedding
      </Link>
    </div>
  );
}

function DashboardNavItems({ currentPath }: { currentPath: string }) {
  const navItems = [
    { href: '/overview', label: 'Overview', icon: LayoutDashboard },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/guests', label: 'Guests', icon: Users },
    { href: '/seating', label: 'Seating', icon: Table },
    { href: '/photos', label: 'Photos', icon: Image },
    { href: '/chat', label: 'Chat', icon: MessageSquare },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <ul className="space-y-1" role="list">
      {navItems.map((item) => {
        const href = currentPath.split('/').slice(0, 4).join('/') + item.href;
        const isActive = currentPath === href || currentPath.startsWith(href + '/');
        return (
          <li key={item.href}>
            <Link
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#FFF8F3] text-[#C4785E]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}