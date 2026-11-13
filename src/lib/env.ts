// Environment helpers. Only NEXT_PUBLIC_* values may be read from client code.

export function supabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || undefined;
}

export function supabaseAnonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}

/**
 * Where public content is read from.
 * - "supabase": the production database (default whenever Supabase is configured).
 * - "seed": the migrated Base44 content bundled in src/lib/content/seed-data.json.
 *   Read-only; used for local development and CI without database credentials.
 */
export function contentSource(): "supabase" | "seed" {
  const explicit = process.env.CONTENT_SOURCE;
  if (explicit === "seed") return "seed";
  if (explicit === "supabase") return "supabase";
  return isSupabaseConfigured() ? "supabase" : "seed";
}

export function isGoogleAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";
}
