"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { sendContactMessage } from "@/app/actions/public";

const field =
  "w-full border border-white/10 bg-abyss px-4 py-3 font-sans text-white transition-colors focus:border-gold focus:outline-none";
const label = "mb-2 block font-mono text-xs uppercase tracking-widest text-gray-500";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  if (sent) {
    return (
      <div className="space-y-4 border border-gold/30 bg-abyss p-12 text-center" role="status">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
          <Check className="h-6 w-6 text-gold" />
        </div>
        <h2 className="font-serif text-2xl text-white">Message Sent</h2>
        <p className="font-sans text-sm text-gray-400">Thank you for your suggestion. I&apos;ll get back to you shortly.</p>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await sendContactMessage(form);
      if (res.ok) setSent(true);
      else setError(res.error);
    });
  };

  return (
    <form onSubmit={submit} className="relative space-y-6">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <div>
        <label htmlFor="contact-name" className={label}>
          Name
        </label>
        <input id="contact-name" type="text" required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
      </div>
      <div>
        <label htmlFor="contact-email" className={label}>
          Email
        </label>
        <input id="contact-email" type="email" required maxLength={320} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
      </div>
      <div>
        <label htmlFor="contact-message" className={label}>
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={6}
          maxLength={5000}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={`${field} resize-none`}
        />
      </div>
      {error && <p className="font-sans text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-gold px-8 py-4 font-sans text-sm font-medium tracking-wide text-black transition-colors hover:bg-white disabled:opacity-50"
      >
        {pending ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
