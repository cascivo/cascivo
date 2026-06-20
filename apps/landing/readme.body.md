The marketing landing page for cascivo — the public front door at [cascivo.com](https://cascivo.com). Built with Vite + React and styled entirely with cascivo components and themes, so the site is a live dogfood demonstration of the design system.

## Develop

```sh
pnpm dev:landing            # from the repo root
pnpm dev:landing:full       # also builds the embedded example demos first
```

The landing page is mobile-first (fluid type, off-canvas nav, container queries) and ships the brand logo and palette. Because it builds without a prior full `pnpm build`, any `@cascivo/*` package whose exports point at `./dist/` needs a source alias in `vite.config.ts` — see the workspace-alias note in [CLAUDE.md](https://github.com/cascivo/cascivo/blob/main/CLAUDE.md).
