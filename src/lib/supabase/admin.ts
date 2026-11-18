import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Service role client for admin operations (API routes, Edge Functions)
// Never use this in client components!
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Singleton for API routes
let adminClient: ReturnType<typeof createAdminClient> | null = null;

export function getAdminClient() {
  if (!adminClient) {
    adminClient = createAdminClient();
  }
  return adminClient;
}