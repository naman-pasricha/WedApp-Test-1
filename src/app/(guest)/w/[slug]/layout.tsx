// Guest app layout with theme provider and bottom nav
import { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { BottomNav } from '@/components/guest/BottomNav';
import { GuestSessionProvider } from '@/components/guest/GuestSessionProvider';
import { PWAInstallPrompt, IOSInstallBanner } from '@/components/guest/PWAInstallPrompt';
import { OfflineIndicator } from '@/components/guest/OfflineIndicator';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#C4785E',
};

interface GuestLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: GuestLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `WedApp - ${slug}`,
    description: 'Wedding guest app',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'WedApp',
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export default async function GuestLayout({ children, params }: GuestLayoutProps) {
  const { slug } = await params;

  return (
    <>
      <head>
        <link rel="manifest" href={`/w/${slug}/manifest.json`} />
        <meta name="theme-color" content="#C4785E" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <div className="relative min-h-screen flex flex-col">
        <ThemeProvider weddingSlug={slug}>
          <GuestSessionProvider weddingSlug={slug}>
            <main className="flex-1 overflow-y-auto pb-safe">
              {children}
            </main>
            <BottomNav />
            <PWAInstallPrompt />
            <IOSInstallBanner />
            <OfflineIndicator />
          </GuestSessionProvider>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </div>
    </>
  );
}