'use client';

import { Users, Image, MessageSquare, Bell, Calendar, Trophy, Loader2, QrCode, ExternalLink } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import Link from 'next/link';
import { WeddingNav } from '@/components/dashboard/WeddingNav';

interface Wedding {
  id: string;
  name: string;
  slug: string;
  date: string;
  hero_image_url: string | null;
  theme: any;
  timezone: string;
}

interface Stats {
  guests_joined: number;
  photos_uploaded: number;
  announcements_sent: number;
  total_announcement_reads: number;
  messages_sent: number;
  challenges_completed: number;
}

interface OverviewPageClientProps {
  wedding: Wedding;
  stats: Stats;
}

export function OverviewPageClient({ wedding, stats }: OverviewPageClientProps) {
  const guestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/w/${wedding.slug}`;
  const weddingDate = new Date(wedding.date);
  const daysUntil = Math.ceil((weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const statCards = [
    { label: 'Guests Joined', value: stats.guests_joined, icon: Users, color: 'bg-[#C4785E]/10 text-[#C4785E]', href: `/dashboard/weddings/${wedding.id}/guests` },
    { label: 'Photos Uploaded', value: stats.photos_uploaded, icon: Image, color: 'bg-blue-100 text-blue-600', href: `/dashboard/weddings/${wedding.id}/photos` },
    { label: 'Messages Sent', value: stats.messages_sent, icon: MessageSquare, color: 'bg-green-100 text-green-600', href: `/dashboard/weddings/${wedding.id}/chat` },
    { label: 'Announcements', value: stats.announcements_sent, icon: Bell, color: 'bg-purple-100 text-purple-600', href: `/dashboard/weddings/${wedding.id}/announcements` },
    { label: 'Challenges Done', value: stats.challenges_completed, icon: Trophy, color: 'bg-yellow-100 text-yellow-600', href: `/dashboard/weddings/${wedding.id}/games` },
    { label: 'Total Reads', value: stats.total_announcement_reads, icon: Calendar, color: 'bg-pink-100 text-pink-600', href: `/dashboard/weddings/${wedding.id}/announcements` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <WeddingNav weddingId={wedding.id} />

      <main className="lg:ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{wedding.name}</h1>
              <p className="text-gray-500 mt-1">
                {daysUntil > 0
                  ? `${daysUntil} days until the wedding`
                  : daysUntil === 0
                  ? 'Today is the big day!'
                  : 'Wedding has passed'}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/dashboard/weddings/${wedding.id}/qr`}
                className="px-4 py-2.5 rounded-xl font-medium bg-[#C4785E] text-white hover:bg-[#B06850] flex items-center gap-2 transition-colors"
              >
                <QrCode className="h-5 w-5" />
                QR Code & Link
              </Link>
              <a
                href={guestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <ExternalLink className="h-5 w-5" />
                Open Guest App
              </a>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {statCards.map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className={clsx(
                  'p-6 rounded-2xl border transition-all hover:shadow-lg',
                  'bg-white border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className={clsx('w-14 h-14 rounded-xl flex items-center justify-center', stat.color)}>
                    <stat.icon className="h-7 w-7" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Link
              href={`/dashboard/weddings/${wedding.id}/events`}
              className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#C4785E] hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#FFF8F3] flex items-center justify-center">
                  <Calendar className="h-7 w-7 text-[#C4785E]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Events</h3>
                  <p className="text-sm text-gray-500 mt-1">Add, edit, and reorder wedding events</p>
                </div>
              </div>
            </Link>

            <Link
              href={`/dashboard/weddings/${wedding.id}/seating`}
              className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#C4785E] hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#FFF8F3] flex items-center justify-center">
                  <Users className="h-7 w-7 text-[#C4785E]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Seating Chart</h3>
                  <p className="text-sm text-gray-500 mt-1">Assign guests to tables</p>
                </div>
              </div>
            </Link>

            <Link
              href={`/dashboard/weddings/${wedding.id}/announcements`}
              className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#C4785E] hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#FFF8F3] flex items-center justify-center">
                  <Bell className="h-7 w-7 text-[#C4785E]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Send Announcement</h3>
                  <p className="text-sm text-gray-500 mt-1">Notify all guests instantly</p>
                </div>
              </div>
            </Link>

            <Link
              href={`/dashboard/weddings/${wedding.id}/photos`}
              className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#C4785E] hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#FFF8F3] flex items-center justify-center">
                  <Image className="h-7 w-7 text-[#C4785E]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Moderate Photos</h3>
                  <p className="text-sm text-gray-500 mt-1">Review and manage guest uploads</p>
                </div>
              </div>
            </Link>

            <Link
              href={`/dashboard/weddings/${wedding.id}/chat`}
              className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#C4785E] hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#FFF8F3] flex items-center justify-center">
                  <MessageSquare className="h-7 w-7 text-[#C4785E]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Chat Moderation</h3>
                  <p className="text-sm text-gray-500 mt-1">View and moderate conversations</p>
                </div>
              </div>
            </Link>

            <Link
              href={`/dashboard/weddings/${wedding.id}/settings`}
              className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#C4785E] hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#FFF8F3] flex items-center justify-center">
                  <Trophy className="h-7 w-7 text-[#C4785E]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Customize Theme</h3>
                  <p className="text-sm text-gray-500 mt-1">Colors, fonts, and branding</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Wedding Details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Wedding Details</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="font-medium text-gray-900 mt-1">
                  {format(weddingDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Timezone</p>
                <p className="font-medium text-gray-900 mt-1">{wedding.timezone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Guest App URL</p>
                <p className="font-medium text-gray-900 mt-1 font-mono text-sm break-all">
                  {guestUrl}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Primary Color</p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-8 h-8 rounded-lg border"
                    style={{ backgroundColor: wedding.theme?.colors?.primary || '#C4785E' }}
                  />
                  <span className="font-mono text-sm">
                    {wedding.theme?.colors?.primary || '#C4785E'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}