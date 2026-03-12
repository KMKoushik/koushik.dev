"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { GetSecretResponse } from "~/lib/envshare-shared";

type ViewState = "initial" | "loading" | "revealed" | "error" | "not-found";

// Decrypt content using AES-256-GCM
async function decryptContent(
  encrypted: string,
  iv: string,
  keyBase64: string
): Promise<string> {
  // Decode base64 strings
  const encryptedBytes = Uint8Array.from(atob(encrypted), (c) =>
    c.charCodeAt(0)
  );
  const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));

  // Import the key
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // Decrypt the content
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    encryptedBytes
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

function formatTimeRemaining(expiresAt: number): string {
  const now = Date.now();
  const diff = expiresAt - now;

  if (diff <= 0) return "expired";

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${minutes} minute${minutes > 1 ? "s" : ""}`;
}

export default function ViewSecretPage() {
  const params = useParams();
  const id = params.id as string;

  const [state, setState] = useState<ViewState>("initial");
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secretInfo, setSecretInfo] = useState<{
    reads: number;
    expiresAt: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Check if we have a key in the URL fragment (null = not yet checked)
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  useEffect(() => {
    setHasKey(!!window.location.hash && window.location.hash.length > 1);
  }, []);

  async function handleReveal() {
    const keyBase64 = window.location.hash.slice(1);
    if (!keyBase64) {
      setError("No decryption key found in URL");
      setState("error");
      return;
    }

    setState("loading");
    setError(null);

    try {
      // Fetch encrypted secret from server
      const response = await fetch(`/api/envshare/${id}`);

      if (response.status === 404) {
        setState("not-found");
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch secret");
      }

      const data: GetSecretResponse = await response.json();
      setSecretInfo({ reads: data.reads, expiresAt: data.expiresAt });

      // Decrypt content client-side
      const decrypted = await decryptContent(data.encrypted, data.iv, keyBase64);
      setContent(decrypted);
      setState("revealed");
    } catch (err) {
      if (err instanceof Error && err.message.includes("decrypt")) {
        setError("Failed to decrypt. The URL may be incomplete or corrupted.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
      setState("error");
    }
  }

  async function handleCopy() {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  }

  return (
    <main className="min-h-screen bg-ctp-base text-ctp-text">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-12">
        <header className="mb-8 space-y-2">
          <h1 className="text-2xl text-ctp-mauve">envshare</h1>
          <p className="text-sm text-ctp-subtext1">
            someone shared a secret with you
          </p>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center">
          {state === "initial" && (
            <div className="w-full space-y-6 text-center">
              {hasKey === null ? (
                <div className="text-ctp-subtext1">loading...</div>
              ) : !hasKey ? (
                <div className="space-y-4 rounded-lg border border-ctp-red/50 bg-ctp-red/10 p-6">
                  <p className="text-sm text-ctp-red">
                    This link appears to be incomplete. The decryption key is
                    missing from the URL.
                  </p>
                  <p className="text-xs text-ctp-subtext1">
                    Make sure you have the complete URL including the # portion.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-ctp-subtext1">
                    Click the button below to reveal the secret. This will count
                    as one read.
                  </p>
                  <button
                    onClick={handleReveal}
                    className="rounded-md bg-ctp-mauve px-8 py-4 text-lg font-medium text-ctp-base hover:opacity-90 active:scale-[0.98]"
                  >
                    reveal secret
                  </button>
                  <p className="text-xs text-ctp-overlay0">
                    The secret will be decrypted in your browser
                  </p>
                </>
              )}
            </div>
          )}

          {state === "loading" && (
            <div className="space-y-4 text-center">
              <div className="text-ctp-mauve">decrypting...</div>
            </div>
          )}

          {state === "revealed" && content !== null && (
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-ctp-green" />
                  <span className="text-sm font-medium text-ctp-green">
                    Secret revealed
                  </span>
                </div>
                {secretInfo && (
                  <div className="text-xs text-ctp-subtext1">
                    {secretInfo.reads === -1
                      ? "unlimited reads"
                      : secretInfo.reads === 0
                        ? "last read (now deleted)"
                        : `${secretInfo.reads} read${secretInfo.reads > 1 ? "s" : ""} remaining`}
                    {" · "}
                    expires in {formatTimeRemaining(secretInfo.expiresAt)}
                  </div>
                )}
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  value={content}
                  className="h-64 w-full resize-y rounded-md border border-ctp-surface0 bg-ctp-mantle/60 p-4 font-mono text-sm text-ctp-text focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="absolute right-3 top-3 rounded-md bg-ctp-surface0 px-3 py-1.5 text-xs font-medium text-ctp-text hover:bg-ctp-surface1 active:scale-[0.98]"
                >
                  {copied ? "copied!" : "copy"}
                </button>
              </div>

              <p className="text-xs text-ctp-subtext1">
                This content was decrypted locally in your browser. The server
                never had access to the decryption key.
              </p>
            </div>
          )}

          {state === "not-found" && (
            <div className="w-full space-y-4 rounded-lg border border-ctp-surface0 bg-ctp-mantle p-6 text-center">
              <div className="text-ctp-red">secret not found</div>
              <p className="text-sm text-ctp-subtext1">
                This secret may have expired or reached its read limit.
              </p>
              <Link
                href="/envshare"
                className="inline-block text-sm text-ctp-mauve hover:underline"
              >
                create a new secret
              </Link>
            </div>
          )}

          {state === "error" && (
            <div className="w-full space-y-4 rounded-lg border border-ctp-red/50 bg-ctp-red/10 p-6 text-center">
              <div className="text-ctp-red">error</div>
              <p className="text-sm text-ctp-subtext1">{error}</p>
              <button
                onClick={() => setState("initial")}
                className="text-sm text-ctp-mauve hover:underline"
              >
                try again
              </button>
            </div>
          )}
        </div>

        <footer className="mt-8 text-center">
          <Link
            href="/envshare"
            className="text-sm text-ctp-subtext1 hover:text-ctp-text"
          >
            create your own secret
          </Link>
        </footer>
      </div>
    </main>
  );
}
