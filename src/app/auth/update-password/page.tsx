"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/app/actions/auth";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    start(async () => {
      const res = await updatePassword(password);
      if (res.ok) router.replace("/login?reset=done");
      else setError(res.error);
    });
  };

  const field = "w-full border border-white/10 bg-ink px-4 py-3 font-sans text-sm text-white focus:border-gold focus:outline-none";
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 border border-white/10 bg-abyss p-8">
        <h1 className="font-serif text-2xl font-bold text-white">Set a new password</h1>
        <input type="password" autoComplete="new-password" required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (min. 10 characters)" aria-label="New password" className={field} />
        <input type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" aria-label="Confirm password" className={field} />
        {error && <p className="font-sans text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={pending} className="w-full bg-gold py-3 font-sans text-sm font-medium text-black hover:bg-white disabled:opacity-50">
          {pending ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
