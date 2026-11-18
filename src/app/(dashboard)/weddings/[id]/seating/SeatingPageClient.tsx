'use client';

import { SeatingManager } from '@/components/dashboard/SeatingManager';
import { WeddingNav } from '@/components/dashboard/WeddingNav';

interface SeatingPageClientProps {
  wedding: { id: string; name: string; slug: string };
  initialTables: any[];
  initialGuests: any[];
}

export function SeatingPageClient({ wedding, initialTables, initialGuests }: SeatingPageClientProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <WeddingNav weddingId={wedding.id} />
      <main className="lg:ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Seating Chart</h1>
            <p className="text-gray-500 mt-1">Assign guests to tables</p>
          </div>
          <SeatingManager weddingSlug={wedding.id} initialTables={initialTables} initialGuests={initialGuests} />
        </div>
      </main>
    </div>
  );
}