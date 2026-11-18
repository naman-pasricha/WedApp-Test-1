// Global Not Found Page
import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <title>Page Not Found - WedApp</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #FFF8F3;
            color: #3D3D3D;
            padding: 20px;
            text-align: center;
          }
          .icon { width: 80px; height: 80px; background: linear-gradient(135deg, #C4785E, #D4A574); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
          .icon svg { width: 40px; height: 40px; color: white; }
          h1 { font-size: 1.75rem; margin-bottom: 12px; }
          p { color: #8B7D6B; max-width: 300px; margin-bottom: 24px; }
          .btn { display: inline-flex; align-items: center; gap: 8px; background: #C4785E; color: white; border: none; padding: 14px 28px; border-radius: 9999px; font-size: 1rem; font-weight: 600; cursor: pointer; text-decoration: none; transition: background 0.2s; }
          .btn:hover { background: #B06850; }
          .btn-secondary { background: transparent; color: #C4785E; border: 2px solid #C4785E; }
          .btn-secondary:hover { background: #FFF8F3; }
        `}</style>
      </head>
      <body>
        <div className="icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/" className="btn">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Go Home
          </a>
          <a href="/w/anya-raj" className="btn btn-secondary">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Try Demo Wedding
          </a>
        </div>
      </body>
    </html>
  );
}