import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

let client: SupabaseClient | null = null;

/**
 * Cookie-less anon client for public, cacheable reads (articles, categories,
 * comments). Row Level Security restricts it to published content. Using no
 * cookies keeps public pages statically renderable.
 */
export function publicClient(): SupabaseClient {
  if (!client) {
    const url = supabaseUrl();
    const key = supabaseAnonKey();
    if (!url || !key) throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}
