"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ShopLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/shop/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/shop");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Invalid password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-ctp-base flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-ctp-mantle rounded-lg border border-ctp-surface0 p-6">
          <h1 className="text-xl font-bold text-ctp-text mb-6 text-center">
            Shopping List
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm text-ctp-subtext0 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 bg-ctp-base border border-ctp-surface0 rounded-md text-ctp-text placeholder:text-ctp-overlay0 focus:outline-none focus:border-ctp-mauve"
                autoFocus
                required
              />
            </div>

            {error && (
              <p className="text-sm text-ctp-red">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-ctp-mauve text-ctp-base font-medium rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isLoading ? "..." : "Enter"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
