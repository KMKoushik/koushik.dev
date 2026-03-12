"use client";

import { useState } from "react";
import { TTL_OPTIONS, READ_OPTIONS } from "~/lib/envshare-shared";

// Encrypt content using AES-256-GCM
async function encryptContent(
  content: string
): Promise<{ encrypted: string; iv: string; key: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);

  // Generate a random AES-256 key
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // Generate a random IV (12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the content
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  // Export the key for sharing
  const exportedKey = await crypto.subtle.exportKey("raw", key);

  // Convert to base64 for storage/transmission
  const encryptedBase64 = btoa(
    String.fromCharCode.apply(null, Array.from(new Uint8Array(encrypted)))
  );
  const ivBase64 = btoa(String.fromCharCode.apply(null, Array.from(iv)));
  const keyBase64 = btoa(
    String.fromCharCode.apply(null, Array.from(new Uint8Array(exportedKey)))
  );

  return { encrypted: encryptedBase64, iv: ivBase64, key: keyBase64 };
}

export default function EnvSharePage() {
  const [content, setContent] = useState("");
  const [ttl, setTtl] = useState<number>(TTL_OPTIONS[1].value); // Default: 1 day
  const [reads, setReads] = useState<number>(READ_OPTIONS[0].value); // Default: 1 read
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please enter some content to share");
      return;
    }

    setIsLoading(true);
    setError(null);
    setShareUrl(null);

    try {
      // Encrypt content client-side
      const { encrypted, iv, key } = await encryptContent(content);

      // Send encrypted data to server
      const response = await fetch("/api/envshare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encrypted, iv, ttl, reads }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create secret");
      }

      const { id } = await response.json();

      // Build the share URL with the key in the fragment (never sent to server)
      const url = `${window.location.origin}/envshare/${id}#${key}`;
      setShareUrl(url);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  }

  function handleReset() {
    setShareUrl(null);
    setError(null);
    setCopied(false);
  }

  return (
    <main className="min-h-screen bg-ctp-base text-ctp-text">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-12">
        <header className="mb-8 space-y-2">
          <h1 className="text-2xl text-ctp-mauve">envshare</h1>
          <p className="text-sm text-ctp-subtext1">
            share environment variables securely with end-to-end encryption
          </p>
        </header>

        {shareUrl ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-6">
            <div className="w-full space-y-4 rounded-lg border border-ctp-surface0 bg-ctp-mantle p-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-ctp-green" />
                <span className="text-sm font-medium text-ctp-green">
                  Secret created successfully
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-ctp-subtext0">
                  share this link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 rounded-md border border-ctp-surface0 bg-ctp-base px-3 py-2 font-mono text-xs text-ctp-text"
                  />
                  <button
                    onClick={handleCopy}
                    className="rounded-md bg-ctp-mauve px-4 py-2 text-xs font-medium text-ctp-base hover:opacity-90 active:scale-[0.98]"
                  >
                    {copied ? "copied!" : "copy"}
                  </button>
                </div>
              </div>

              <p className="text-xs text-ctp-subtext1">
                The encryption key is in the URL fragment (#) and is never sent
                to the server. Only share this complete URL with trusted
                recipients.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="text-sm text-ctp-subtext1 hover:text-ctp-text"
            >
              create another secret
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="flex flex-1 flex-col">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-ctp-subtext0">
                  your secret
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="paste your environment variables or secrets here..."
                  className="h-64 w-full resize-y rounded-md border border-ctp-surface0 bg-ctp-mantle/60 p-4 font-mono text-sm text-ctp-text placeholder:text-ctp-overlay0 focus:border-ctp-mauve focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-ctp-subtext0">
                    expires after
                  </label>
                  <select
                    value={ttl}
                    onChange={(e) => setTtl(Number(e.target.value))}
                    className="w-full rounded-md border border-ctp-surface0 bg-ctp-mantle/60 px-3 py-2 text-sm text-ctp-text focus:border-ctp-mauve focus:outline-none"
                  >
                    {TTL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-ctp-subtext0">
                    max reads
                  </label>
                  <select
                    value={reads}
                    onChange={(e) => setReads(Number(e.target.value))}
                    className="w-full rounded-md border border-ctp-surface0 bg-ctp-mantle/60 px-3 py-2 text-sm text-ctp-text focus:border-ctp-mauve focus:outline-none"
                  >
                    {READ_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-sm text-ctp-red">{error}</p>
              )}
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading || !content.trim()}
                className="w-full rounded-md bg-ctp-mauve px-4 py-3 text-sm font-medium text-ctp-base hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "encrypting..." : "create secret link"}
              </button>
              <p className="mt-3 text-center text-xs text-ctp-subtext1">
                your content is encrypted in your browser before being sent to
                the server
              </p>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
