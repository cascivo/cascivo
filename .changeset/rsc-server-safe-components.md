---
'@cascivo/react': patch
'@cascivo/i18n': patch
---

Fix: `clientJs: 'none'` components crashed a React Server Components build.

Rendering `<Label>` from a Server Component failed the Next 16 build outright:

```
Error: Failed to collect page data for /
  [cause]: Attempted to call signal() from the server but signal is on the client.
```

`@cascivo/core`'s bundle carries a `'use client'` banner (its directive-carrying modules
collapse into one chunk, so the banner is load-bearing), and `@cascivo/core/pure` is the
server-safe subset that exists for exactly this reason. Three components reached past it —
transitively, which is why no per-file check saw it:

- `Label`, `AvatarGroup`, `InlineLoading` resolved their default text through
  `@cascivo/i18n`, which took `signal` from `@cascivo/core` — one hop too far.
  `@cascivo/i18n` now imports `signal` from `@preact/signals-react`, its actual origin and
  already a declared peer. Same module instance, no client boundary.
- `LargeTitleHeader` imported `cn` from `@cascivo/core`; it now uses `@cascivo/core/pure`.
- `Swap` called `useControllableSignal()` and `useSignals()` with no `'use client'` directive
  at all, so RSC ran React hooks on the server. It now declares the directive, and
  `clientJs: 'required'`.

`scripts/checks/rsc-boundary.test.ts` walks the published module graph and fails on any edge
that pulls a non-component binding out of a `'use client'` module, so this class of defect
cannot ship again. Rendering a client component from a Server Component stays legal and is
not flagged.
