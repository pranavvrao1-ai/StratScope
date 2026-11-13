"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { renameTag } from "@/app/actions/admin";
import { slugify } from "@/lib/slug";
import { buttonGhost, inputClass } from "./ui";

export function TagRename({ tag }: { tag: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(tag);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  if (!open)
    return (
      <button type="button" className={buttonGhost} onClick={() => setOpen(true)}>
        Rename
      </button>
    );

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const to = slugify(value);
        if (!to || to === tag) return setOpen(false);
        start(async () => {
          const res = await renameTag(tag, to);
          if (!res.ok) setError(res.error);
          else setOpen(false);
          router.refresh();
        });
      }}
    >
      <input value={value} onChange={(e) => setValue(e.target.value)} aria-label={`New name for ${tag}`} className={`${inputClass} w-48`} autoFocus />
      <button type="submit" disabled={pending} className={buttonGhost}>
        Save
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </form>
  );
}
