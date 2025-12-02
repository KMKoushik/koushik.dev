"use client";

import { useState } from "react";

type DiffLineType = "unchanged" | "added" | "removed";

interface DiffLine {
  type: DiffLineType;
  text: string;
}

function normalizeLine(line: string): string {
  // Collapse all whitespace and trim ends so pure formatting
  // differences don't show up as changes.
  return line.replace(/\s+/g, " ").trim();
}

function computeDiff(a: string, b: string): DiffLine[] {
  const aLines = a.split(/\r?\n/);
  const bLines = b.split(/\r?\n/);
  const aNorm = aLines.map(normalizeLine);
  const bNorm = bLines.map(normalizeLine);
  const m = aLines.length;
  const n = bLines.length;

  // Classic LCS dynamic programming over normalized lines
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (aNorm[i] === bNorm[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (aNorm[i] === bNorm[j]) {
      result.push({ type: "unchanged", text: aLines[i] ?? "" });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: "removed", text: aLines[i] ?? "" });
      i += 1;
    } else {
      result.push({ type: "added", text: bLines[j] ?? "" });
      j += 1;
    }
  }

  while (i < m) {
    result.push({ type: "removed", text: aLines[i] ?? "" });
    i += 1;
  }

  while (j < n) {
    result.push({ type: "added", text: bLines[j] ?? "" });
    j += 1;
  }

  return result;
}

export default function DiffPage() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [diff, setDiff] = useState<DiffLine[] | null>(null);

  function handleCompare(event: React.FormEvent) {
    event.preventDefault();
    setDiff(computeDiff(left, right));
  }

  return (
    <main className="min-h-screen bg-ctp-base text-ctp-text">
      <div className="mx-auto max-w-4xl px-5 py-6 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl text-ctp-mauve">diff</h1>
          <p className="text-sm text-ctp-subtext1">
            paste two texts below to see a git-style diff
          </p>
        </header>

        <form onSubmit={handleCompare} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ctp-subtext0">
                original
              </label>
              <textarea
                className=" h-52 w-full resize-y rounded-md border border-ctp-surface0 bg-ctp-mantle/60 p-2 text-xs text-ctp-text outline-none focus:border-ctp-mauve"
                value={left}
                onChange={(e) => setLeft(e.target.value)}
                placeholder="old text"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ctp-subtext0">
                changed
              </label>
              <textarea
                className="h-52 w-full resize-y rounded-md border border-ctp-surface0 bg-ctp-mantle/60 p-2 text-xs text-ctp-text outline-none focus:border-ctp-mauve"
                value={right}
                onChange={(e) => setRight(e.target.value)}
                placeholder="new text"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-ctp-surface1 px-3 py-1.5 text-xs font-medium text-ctp-text hover:bg-ctp-surface0 active:scale-[0.98]"
          >
            show diff
          </button>
        </form>

        {diff && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-ctp-subtext0">diff</h2>
            <div className="max-h-[28rem] overflow-auto rounded-md border border-ctp-surface0 bg-ctp-mantle/60 p-3 font-mono text-xs">
              {diff.length === 0 && (
                <p className="text-ctp-subtext1">no differences.</p>
              )}
              {diff.map((line, index) => {
                const prefix =
                  line.type === "added"
                    ? "+"
                    : line.type === "removed"
                      ? "-"
                      : " ";

                const colorClass =
                  line.type === "added"
                    ? "text-ctp-green"
                    : line.type === "removed"
                      ? "text-ctp-red"
                      : "text-ctp-text";

                const displayText = line.text === "" ? " " : line.text;

                return (
                  <div key={index} className={`${colorClass} whitespace-pre`}>
                    {prefix} {displayText}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
