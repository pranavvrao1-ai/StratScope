"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { serverClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site";

const credentials = z.object({ email: z.email().max(320), password: z.string().min(1).max(200) });

export async function signIn(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Authentication is not configured." };
  const parsed = credentials.safeParse({ email, password });
  if (!parsed.success) return { ok: false, error: "Enter a valid email and password." };
  const supabase = await serverClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Deliberately generic: do not reveal whether the account exists.
  if (error) return { ok: false, error: "Invalid email or password." };
  return { ok: true };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await serverClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const parsed = z.email().max(320).safeParse(email);
  if (!parsed.success) return;
  const supabase = await serverClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl()}/auth/callback?next=/auth/update-password`,
  });
}

export async function updatePassword(password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (password.length < 10) return { ok: false, error: "Use at least 10 characters." };
  if (password.length > 200) return { ok: false, error: "Password is too long." };
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, error: "Your reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  await supabase.auth.signOut();
  return { ok: true };
}
