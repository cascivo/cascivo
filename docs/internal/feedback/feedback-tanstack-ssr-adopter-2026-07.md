# Feedback — AI adopter building on TanStack Start / Vite SSR (2026-07)

Verbatim experience report from an AI agent that built a deployments dashboard with
cascivo on TanStack Start (Vite SSR). Received 2026-07-16. Triage and remediation plan:
`fix-plan-tanstack-ssr-adopter-2026-07.md` (same directory).

---

## Friction points

SSR is broken with TanStack Start / Vite SSR. Hard pageerror: Unknown file extension
".css" for .../@cascivo/react/dist/menubar/menubar.css. Components dynamically import
their own CSS files, which the Vite SSR/workerd runtime can't load. The app silently
falls back to client rendering. For any SSR-first framework (TanStack Start, Next App
Router, Remix) this is a blocker or forces <ClientOnly> wrappers everywhere. llms.txt
claims "React 18/19, Next.js App Router (RSC), Vite, Astro islands" as supported — my
experience contradicts that for the default Vite SSR path.

Docs contradict the type definitions. The llms/layout/app-shell.md and shell-header.md
docs list a sideNav prop on AppShell. The actual type is nav. I coded from docs, got a
TS error, had to grep .d.ts to find the truth. If docs are auto-generated they aren't
in sync with the shipped types.

Doc SPA returns HTML for missing .md files with no 404. curl
https://docs.cascivo.com/llms/stat-card.md returns the full docs HTML shell (200 OK)
instead of 404. An agent trying components by guessed name has no signal that a name is
wrong; it silently parses HTML as markdown. Same for
https://cascivo.com/r/shadcn/dashboard-overview.json — the block exists in the registry
but the shadcn endpoint returns the SPA. Blocks are apparently only installable via
npx cascivo add block/..., not via the advertised shadcn registry URL, and this isn't
documented.

Icon set is opinionated and undocumented at the name level. LayoutDashboard, Rocket,
GitBranch — the intuitive Lucide/Radix names — don't exist. Had to dump .d.mts and grep.
There's an "icon catalog" JSON referenced in llms.txt but the primary docs never surface
which of the 439 names correspond to common concepts. Any coding agent will guess wrong
and burn a compile cycle.

The llms.txt "Never use useState/useContext/useEffect" line is scary and misleading.
Read literally it says don't mix React state with cascivo at all. In practice you can
compose components purely as props (as I did) with zero signals, no useSignals() call,
and it works fine. The phrasing will push agents into unnecessary signal-adoption or
panic.

CSS-layer contract is a footgun in Tailwind v4 projects. cascivo needs an
@layer vendor, cascivo.reset, cascivo.base, …, cascivo.override; order statement.
Tailwind v4 owns the top of styles.css with @import "tailwindcss". Order matters,
@import must be top of file, and getting this wrong silently strips styles. llms.txt
warns about it, but there is no ready-made "here's the Tailwind v4 recipe" snippet.

Blocks and layouts are "copy-paste only". Half the value (dashboard-charts, sidebar-app,
dashboard-layout, stats-cards) is not in the npm package — you must run the CLI. That
splits the mental model between "install with bun" and "run npx cascivo add". For an AI
agent driving from JSON registries, the source of a block is not directly fetchable as a
JSON registry item like shadcn's — you either run the CLI or read from the GitHub repo.

Charts pick weird default colors. The area chart came out muddy brown/orange on the dark
theme — the chart tokens (--cascivo-chart-1..8) aren't well-coordinated with the dark
theme surface. Would need manual override.

Overflow bugs in composed pieces. The status Badge in the "Recent deployments" card gets
clipped by the card — cascivo's Card doesn't handle flex overflow of its children
gracefully. Needed manual min-width: 0 on the middle column, which I hit but similar
issues will recur.

Search component has no obvious size/width control — it expanded to a fixed width in the
header row. Fine here, could be limiting.

No Rocket/deployment-shaped icon despite the whole "deploy/build/ship" domain being an
obvious dashboard use case.

## Red flags / would-block-in-production

SSR incompatibility with dynamic CSS imports — this alone would stop me shipping cascivo
on a TanStack Start / Next App Router project without a workaround.

Docs vs. types drift (sideNav vs nav) — undermines the whole "AI-first, machine-readable"
pitch.

Silent 200-with-HTML on missing .md files — makes automated component discovery
unreliable.

Signals-first messaging — scares off correct, simple prop-driven usage that actually
works.

## Suggestions to unblock adoption

Ship a proper Vite SSR / RSC build target for @cascivo/react (inline component CSS or
emit a single stylesheet consumers import once — which styles.css already does; then
don't ALSO dynamic-import per-component CSS at runtime).

Return real 404s from docs.cascivo.com/llms/*.md and cascivo.com/r/shadcn/*.json, or
list block endpoints separately.

Auto-generate llms/<name>.md from the same .d.ts used at runtime so props stay in sync.

Add a icons.catalog.json-derived alias/keywords file so rocket → Zap, git-branch →
Server etc. are resolvable by intent.

Add a "Tailwind v4 + cascivo" recipe with a copy-paste styles.css head.

Reword the signals section: "You don't need signals to consume components as props; use
them when you own state inside a component."

Overall: the AI-onboarding surface (llms.txt, per-component .md, registry JSON) is the
best I've used, and the components render beautifully — but the SSR break and the
docs/type drift are the two things I'd fix before recommending it as a default library
for Lovable-generated apps.
