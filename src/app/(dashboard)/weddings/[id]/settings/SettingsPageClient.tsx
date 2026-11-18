'use client';

import { WeddingSettings } from '@/components/dashboard/WeddingSettings';
import { WeddingNav } from '@/components/dashboard/WeddingNav';

interface SettingsPageClientProps {
  wedding: {
    id: string;
    name: string;
    date: string;
    slug: string;
    timezone: string;
    hero_image_url: string | null;
    theme: any;
  };
}

export function SettingsPageClient({ wedding }: SettingsPageClientProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <WeddingNav weddingId={wedding.id} />
      <main className="lg:ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500 mt-1">Customize your wedding app theme and details</p>
          </div>
          <WeddingSettings wedding={wedding} />
        </div>
      </main>
    </div>
  );
}