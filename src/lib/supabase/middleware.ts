import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh session if expired
  await supabase.auth.getSession();

  return response;
}

export async function getWeddingContext(request: NextRequest) {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  // Check for guest session cookie
  const guestSession = request.cookies.get('guest_session')?.value;
  const weddingSlug = request.nextUrl.pathname.match(/\/w\/([^/]+)/)?.[1];

  let weddingId: string | null = null;
  let guestId: string | null = null;

  if (guestSession && weddingSlug) {
    // Verify session token and get guest/wedding info
    const { data } = await supabase.rpc('get_guest_by_token', {
      p_token: guestSession,
    });

    if (data && data.length > 0) {
      const guest = data[0];
      if (guest.wedding_id) {
        weddingId = guest.wedding_id;
        guestId = guest.id;
      }
    }
  }

  // Also check for host auth
  const { data: { user } } = await supabase.auth.getUser();

  return {
    weddingId,
    guestId,
    userId: user?.id ?? null,
    isHost: !!user,
  };
}