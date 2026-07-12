"use client";

import { Share2, Check, Link as LinkIcon } from "lucide-react";
import { useState, useCallback } from "react";

interface ShareButtonProps {
  title: string;
  text?: string;
  image?: string;
  className?: string;
}

export function ShareButton({ title, text, image, className = "" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: text || title, url });
      } catch {
        // user cancelled or error — ignore
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [title, text, image]);

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 text-sm text-red-400 dark:text-red-300 hover:text-primary transition-colors ${className}`}
      aria-label="Share"
    >
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      <span>{copied ? "Copied!" : "Share"}</span>
    </button>
  );
}
