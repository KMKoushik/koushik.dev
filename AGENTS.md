# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Project Overview

Personal website for Koushik Mohan built with Next.js 15 (App Router), TypeScript, and Tailwind CSS.
Features a terminal-friendly CLI interface accessible via `curl https://koushik.dev`.

## Tech Stack

- **Framework:** Next.js 15.4.6 (App Router)
- **Language:** TypeScript 5.9 (strict mode)
- **Package Manager:** Bun (preferred) or npm
- **Styling:** Tailwind CSS 4 with Catppuccin Mocha theme
- **Font:** JetBrains Mono (via next/font/google)

## Build/Lint/Test Commands

```bash
bun run dev          # Start development server
bun run build        # Create production build
bun run start        # Start production server
bun run lint         # Run ESLint (next lint)
```

**Note:** No test framework is currently configured. If tests are added:
```bash
bun test             # Run all tests
bun test <file>      # Run single test file
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── cli/route.ts        # CLI API endpoint (curl response)
│   ├── diff/page.tsx       # Text diff comparison tool
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Reusable React components
└── middleware.ts           # Request middleware (terminal detection)
```

## Code Style Guidelines

### TypeScript

- Strict mode enabled
- Path alias: `~/*` maps to `./src/*`

### Import Order

1. External packages (react, next)
2. Internal modules (`~/components/...`)
3. Relative imports (`./utils`)
4. Type imports use `import type`

```typescript
import { useState } from "react";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import CopyCommand from "~/components/CopyCommand";
```

### Component Patterns

- React Server Components by default
- Add `"use client"` only when needed (hooks, event handlers)
- Default exports for components
- Inline prop types for simple components

```typescript
// Server Component (default)
export default function Home() {
  return <main>...</main>;
}

// Client Component
"use client";
export default function Interactive({ value }: { value: string }) {
  const [state, setState] = useState(value);
  return <div>...</div>;
}
```


### Naming Conventions

| Element    | Convention       | Example              |
|------------|------------------|----------------------|
| Files      | kebab-case       | `copy-command.tsx`   |
| Components | PascalCase       | `CopyCommand`        |
| Functions  | camelCase        | `handleCopy`         |
| Types      | PascalCase       | `DiffLine`           |
| Constants  | UPPER_SNAKE_CASE | `COLORS`             |

### Tailwind CSS Colors (Catppuccin Mocha)

```
bg-ctp-base         # Main background
text-ctp-text       # Primary text
text-ctp-mauve      # Accent/links (purple)
text-ctp-subtext0   # Secondary headings
bg-ctp-mantle       # Card backgrounds
border-ctp-surface0 # Borders
text-ctp-green      # Success
text-ctp-red        # Error
```
