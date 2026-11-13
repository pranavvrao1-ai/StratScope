"use client";

import { browserClient } from "@/lib/supabase/browser";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Uploads an image to the public `media` bucket as the signed-in editor.
 * Storage RLS only permits editors; the bucket also enforces type and size limits server-side.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error("Only JPEG, PNG, WebP, GIF or AVIF images are allowed.");
  if (file.size > MAX_BYTES) throw new Error("Images must be 8 MB or smaller.");
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const now = new Date();
  const path = `articles/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
  const supabase = browserClient();
  const { error } = await supabase.storage.from("media").upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}
