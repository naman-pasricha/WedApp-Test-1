'use client';

import { AnnouncementsManager } from '@/components/dashboard/AnnouncementsManager';
import { WeddingNav } from '@/components/dashboard/WeddingNav';

interface AnnouncementsPageClientProps {
  wedding: { id: string; name: string; slug: string };
  initialAnnouncements: any[];
}

export function AnnouncementsPageClient({ wedding, initialAnnouncements }: AnnouncementsPageClientProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <WeddingNav weddingId={wedding.id} />
      <main className="lg:ml-64 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
            <p className="text-gray-500 mt-1">Send updates to all guests</p>
          </div>
          <AnnouncementsManager weddingId={wedding.id} initialAnnouncements={initialAnnouncements} />
        </div>
      </main>
    </div>
  );
}