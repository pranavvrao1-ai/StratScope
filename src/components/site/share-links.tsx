"use client";

import { useState } from "react";

export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const link = "transition-colors hover:text-gold";
  return (
    <div className="space-y-3 border-t border-white/10 pt-6">
      <span className="block font-mono text-[10px] uppercase tracking-widest text-gray-500">SHARE INTEL</span>
      <div className="flex flex-col gap-2 font-mono text-xs text-gray-400">
        <a href={`https://twitter.com/intent/tweet?text=${t}&url=${u}`} target="_blank" rel="noopener noreferrer" className={link}>
          X_PLATFORM
        </a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener noreferrer" className={link}>
          FACEBOOK
        </a>
        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} target="_blank" rel="noopener noreferrer" className={link}>
          LINKEDIN
        </a>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(url).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
          className={`${link} text-left`}
        >
          {copied ? "LINK_COPIED" : "COPY_LINK"}
        </button>
      </div>
    </div>
  );
}
