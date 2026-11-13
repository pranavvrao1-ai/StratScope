import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { serverClient } from "@/lib/supabase/server";

export type Role = "none" | "editor" | "admin";

export interface SessionProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  role: Role;
}

/** Returns the signed-in user's profile, or null. Never throws for anonymous visitors. */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await serverClient();
  // getUser() validates the JWT with Supabase Auth (getSession() would trust the cookie).
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, display_name, role")
    .eq("id", data.user.id)
    .maybeSingle();
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    displayName: profile?.display_name ?? null,
    role: (profile?.role as Role) ?? "none",
  };
}

export function canEdit(role: Role | undefined | null): boolean {
  return role === "editor" || role === "admin";
}

/** For pages: redirect anonymous users to /login and signed-in non-editors to /login?error=forbidden. */
export async function requireEditorPage(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (!canEdit(profile.role)) redirect("/login?error=forbidden");
  return profile;
}

export class AuthorizationError extends Error {}

/** For Server Actions: throws unless the caller is an editor/admin. */
export async function requireEditor(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile || !canEdit(profile.role)) throw new AuthorizationError("Not authorised");
  return profile;
}

export async function requireAdmin(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") throw new AuthorizationError("Administrator access required");
  return profile;
}

/** For admin pages: verifies the editor role, then returns a session-bound Supabase client. */
export async function editorPageClient() {
  const profile = await requireEditorPage();
  const { serverClient } = await import("@/lib/supabase/server");
  return { supabase: await serverClient(), profile };
}
