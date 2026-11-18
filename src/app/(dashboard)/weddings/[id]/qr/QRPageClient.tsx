'use client';

import { QRCodePage } from '@/components/dashboard/QRCodePage';
import { WeddingNav } from '@/components/dashboard/WeddingNav';

interface QRPageClientProps {
  wedding: { id: string; name: string; slug: string; hero_image_url: string | null };
  guestUrl: string;
}

export function QRPageClient({ wedding, guestUrl }: QRPageClientProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <WeddingNav weddingId={wedding.id} />
      <main className="lg:ml-64 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">QR Code & Guest Link</h1>
            <p className="text-gray-500 mt-1">Share this with guests for easy access to the wedding app</p>
          </div>
          <QRCodePage wedding={wedding} guestUrl={guestUrl} />
        </div>
      </main>
    </div>
  );
}