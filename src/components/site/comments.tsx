"use client";

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { Heart, MessageSquare, Send } from "lucide-react";
import { likeComment, postComment } from "@/app/actions/public";
import type { Comment } from "@/lib/content/types";
import { formatDateTime, initials } from "@/lib/format";
import { LIKED_COMMENTS_KEY } from "@/lib/site";

// Liked-comment ids live in localStorage (same key as the original site).
// useSyncExternalStore keeps server and first client render identical (no hydration mismatch).
const LIKED_EVENT = "stratscope-liked-change";
function subscribeLiked(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(LIKED_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(LIKED_EVENT, cb);
  };
}
function readLikedRaw(): string {
  try {
    return localStorage.getItem(LIKED_COMMENTS_KEY) || "{}";
  } catch {
    return "{}";
  }
}

export function Comments({ articleId, initial }: { articleId: string; initial: Comment[] }) {
  const [comments, setComments] = useState(initial);
  const [form, setForm] = useState({ author_name: "", content: "", website: "" });
  const [error, setError] = useState("");
  const likedRaw = useSyncExternalStore(subscribeLiked, readLikedRaw, () => "{}");
  const liked = useMemo<Record<string, boolean>>(() => {
    try {
      return JSON.parse(likedRaw);
    } catch {
      return {};
    }
  }, [likedRaw]);
  const [pending, start] = useTransition();

  const persistLiked = (next: Record<string, boolean>) => {
    try {
      localStorage.setItem(LIKED_COMMENTS_KEY, JSON.stringify(next));
    } catch {}
    window.dispatchEvent(new Event(LIKED_EVENT));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.author_name.trim() || !form.content.trim()) {
      setError("Please enter your name and a comment.");
      return;
    }
    start(async () => {
      const res = await postComment({ article_id: articleId, ...form });
      if (!res.ok || !res.data) {
        setError(res.ok ? "Failed to post your comment. Please try again." : res.error);
        return;
      }
      setComments((c) => [res.data!, ...c]);
      setForm({ author_name: "", content: "", website: "" });
    });
  };

  const like = async (id: string) => {
    if (liked[id]) return;
    const prev = comments.find((c) => c.id === id);
    if (!prev) return;
    setComments((cs) => cs.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c)));
    persistLiked({ ...liked, [id]: true });
    const res = await likeComment(id);
    if (!res.ok) {
      setComments((cs) => cs.map((c) => (c.id === id ? { ...c, likes: prev.likes } : c)));
      const next = { ...liked };
      delete next[id];
      persistLiked(next);
    } else if (typeof res.data === "number") {
      setComments((cs) => cs.map((c) => (c.id === id ? { ...c, likes: res.data! } : c)));
    }
  };

  return (
    <section className="border-t border-white/10 py-16" aria-labelledby="comments-heading">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-10 flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-gold" aria-hidden />
          <h2 id="comments-heading" className="font-serif text-2xl font-bold text-white md:text-3xl">
            Comments
          </h2>
          <span className="ml-auto font-mono text-xs text-gray-500">
            {comments.length} {comments.length === 1 ? "COMMENT" : "COMMENTS"}
          </span>
        </div>

        <form onSubmit={submit} className="relative mb-12 space-y-4">
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
            <label htmlFor="comment-name" className="mb-2 block font-mono text-xs uppercase tracking-widest text-gray-500">
              Your Name *
            </label>
            <input
              id="comment-name"
              type="text"
              required
              maxLength={80}
              value={form.author_name}
              onChange={(e) => setForm({ ...form, author_name: e.target.value })}
              placeholder="Enter your name"
              className="w-full border border-white/10 bg-abyss px-4 py-3 font-sans text-white transition-colors focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="comment-body" className="mb-2 block font-mono text-xs uppercase tracking-widest text-gray-500">
              Your Comment *
            </label>
            <textarea
              id="comment-body"
              required
              rows={4}
              maxLength={4000}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Share your thoughts on this article..."
              className="w-full resize-none border border-white/10 bg-abyss px-4 py-3 font-sans text-white transition-colors focus:border-gold focus:outline-none"
            />
          </div>
          {error && <p className="font-sans text-sm text-red-400">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 bg-gold px-6 py-3 font-sans text-sm font-medium tracking-wide text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {pending ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>

        {comments.length === 0 ? (
          <div className="border border-white/5 bg-abyss/40 py-16 text-center">
            <p className="font-sans text-sm text-gray-500">No comments yet. Be the first to share your thoughts.</p>
          </div>
        ) : (
          <ul className="space-y-6">
            {comments.map((c) => (
              <li key={c.id} className="space-y-3 border border-white/10 bg-abyss/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-gold to-gray-700 font-mono text-xs font-bold text-black">
                    {initials(c.author_name)}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-bold text-white">{c.author_name}</p>
                    <p className="font-mono text-xs text-gray-500">
                      <time dateTime={c.created_at}>{formatDateTime(c.created_at)}</time>
                    </p>
                  </div>
                </div>
                <p className="break-words font-sans text-sm leading-relaxed text-gray-300">{c.content}</p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => like(c.id)}
                    disabled={!!liked[c.id]}
                    aria-pressed={!!liked[c.id]}
                    className={`inline-flex items-center gap-2 font-mono text-xs transition-colors ${
                      liked[c.id] ? "cursor-default text-gold" : "text-gray-500 hover:text-gold"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${liked[c.id] ? "fill-gold" : ""}`} />
                    {c.likes || 0} {c.likes === 1 ? "LIKE" : "LIKES"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
