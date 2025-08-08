"use client";

import { useState } from "react";

export default function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-ctp-surface0 bg-ctp-mantle/60 px-3 py-2">
      <code className="text-sm text-ctp-subtext1 overflow-x-auto">
        {command}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className="ml-3 inline-flex items-center gap-2 rounded-md border border-ctp-surface1 px-2 py-1 text-xs text-ctp-text hover:bg-ctp-surface0 active:scale-[0.98]"
        aria-label={copied ? "copied" : "copy"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={copied ? "#a6e3a1" : "#cba6f7"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span className="text-ctp-subtext0">{copied ? "copied" : "copy"}</span>
      </button>
    </div>
  );
}
