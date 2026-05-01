import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

// Server-side data client — uses the service role key to bypass RLS,
// because the SSR cookie-aware client's JWT was not being honoured by
// PostgREST in some server-action contexts. Access control is enforced
// at the application layer via requireUser/requireWeddingMember +
// explicit wedding_id filters on every query.
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Cookie-aware SSR client — used only by lib/auth.ts to call
// supabase.auth.getUser() and verify the logged-in user from cookies.
export function createAuthClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies can be read-only
          }
        },
      },
    }
  );
}
