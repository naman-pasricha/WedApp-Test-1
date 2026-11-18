'use client';

import { InfoManager } from '@/components/dashboard/InfoManager';
import { WeddingNav } from '@/components/dashboard/WeddingNav';

interface InfoPageClientProps {
  wedding: { id: string; name: string; slug: string };
  initialSections: any[];
}

export function InfoPageClient({ wedding, initialSections }: InfoPageClientProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <WeddingNav weddingId={wedding.id} />
      <main className="lg:ml-64 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Travel & Info</h1>
            <p className="text-gray-500 mt-1">Manage accommodation, transport, FAQs, and emergency contacts</p>
          </div>
          <InfoManager weddingSlug={wedding.id} initialSections={initialSections} />
        </div>
      </main>
    </div>
  );
}