'use client';

import { EventsManager } from '@/components/dashboard/EventsManager';
import { WeddingNav } from '@/components/dashboard/WeddingNav';

interface EventsPageClientProps {
  wedding: { id: string; name: string; slug: string };
  initialEvents: any[];
}

export function EventsPageClient({ wedding, initialEvents }: EventsPageClientProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <WeddingNav weddingId={wedding.id} />
      <main className="lg:ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-500 mt-1">Manage your wedding itinerary</p>
          </div>
          <EventsManager weddingId={wedding.id} initialEvents={initialEvents} />
        </div>
      </main>
    </div>
  );
}