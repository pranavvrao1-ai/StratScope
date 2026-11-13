"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteComment,
  deleteMessage,
  deleteSubscriber,
  renameTag,
  setCommentHidden,
  setMessageHandled,
  setUserRole,
} from "@/app/actions/admin";
import { buttonDanger, buttonGhost } from "./ui";

// Server Components cannot pass closures to Client Components, so rows name an
// action from this registry and supply serialisable arguments.
const REGISTRY = {
  hideComment: (id: string) => setCommentHidden(id, true),
  showComment: (id: string) => setCommentHidden(id, false),
  deleteComment: (id: string) => deleteComment(id),
  deleteSubscriber: (id: string) => deleteSubscriber(id),
  markHandled: (id: string) => setMessageHandled(id, true),
  markUnhandled: (id: string) => setMessageHandled(id, false),
  deleteMessage: (id: string) => deleteMessage(id),
  removeTag: (tag: string) => renameTag(tag, null),
  roleNone: (id: string) => setUserRole(id, "none"),
  roleEditor: (id: string) => setUserRole(id, "editor"),
  roleAdmin: (id: string) => setUserRole(id, "admin"),
} as const;

export type RowAction = { label: string; action: keyof typeof REGISTRY; arg: string; danger?: boolean };

export function RowActions({ actions }: { actions: RowAction[] }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const exec = (a: RowAction) => {
    if (a.danger && confirming !== a.label) {
      setConfirming(a.label);
      return;
    }
    start(async () => {
      setError("");
      const res = await REGISTRY[a.action](a.arg);
      if (!res.ok) setError(res.error ?? "Failed");
      setConfirming(null);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {error && <span className="text-xs text-red-400">{error}</span>}
      {actions.map((a) => (
        <button key={a.label} type="button" disabled={pending} className={a.danger ? buttonDanger : buttonGhost} onClick={() => exec(a)}>
          {a.danger && confirming === a.label ? `Confirm ${a.label.toLowerCase()}` : a.label}
        </button>
      ))}
    </div>
  );
}
