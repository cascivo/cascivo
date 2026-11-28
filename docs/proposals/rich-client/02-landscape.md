# Rich-client landscape (as of 2026-11-28)

Research only. Sources are web-search snippets gathered by sub-agents; few primary pages were fetched. Items marked **(verify)** conflict across sources or rest on one secondary source. Do not cite them in public material before checking.

## 1. Pain points of React and Angular teams

| # | Pain | Evidence | Source |
|---|------|----------|--------|
| 1 | Next.js is widely used and weakly loved: complexity and Vercel coupling | State of React 2025 (3,760 responses): Next.js 80% usage, 27% positive vs 17% negative. Quote: "Vendor lock in, complex APIs, and too much noise in the Next.js ecosystem" | https://www.theregister.com/2026/02/17/react_survey_shows_tanstack_gains/ |
| 2 | RSC has weak enthusiasm | Survey authors: "troubling for a set of new APIs that was supposed to pave the way towards React's next big evolution". Respondent: "Completely not interested" | same |
| 3 | RSC is an attack surface | CVE-2025-55182 "React2Shell", CVSS 10.0, unauthenticated RCE in the Flight protocol (React 19.0 to 19.2.0), disclosed 2025-12-03. Wiz: 39% of cloud environments they see had vulnerable Next.js/React. No config workaround, upgrade only | https://react2shell.com/ , https://www.microsoft.com/en-us/security/blog/2025/12/15/defending-against-the-cve-2025-55182-react2shell-vulnerability-in-react-server-components/ |
| 4 | Effect and re-render footguns persist | useEffect is the top pain (37%), dependency arrays 21%, state-management complexity 20%, boilerplate 15% (secondary summary, **verify** at stateofreact.com) | https://certificates.dev/blog/breaking-down-state-of-react-2025-results |
| 5 | Compiler helps but is a patch, not a model change | React Compiler: 62% enthusiastic. Keeps the re-render model, hides it | Register URL above |
| 6 | Toolchain assembly | "Getting a build and testing harness and CI system and IDE tools to all play nicely together is reliably a nightmare" | Register URL above |
| 7 | Fatigue and churn | State of JS 2025 (13,002 respondents): happiness flat at 3.8/5 for 5th year; React has the most front-end pain-point mentions (601); average dev has used 2.6 front-end frameworks | https://www.infoq.com/news/2026/03/state-of-js-survey-2025 |
| 8 | Angular: low usage, low satisfaction | Angular sits lower-left in State of JS 2025; net-negative opinion about -25.7% vs -19.2% in 2024 (figure semantics unclear, **verify**) | https://2025.stateofjs.com/en-US/libraries/front-end-frameworks/ |
| 9 | Angular zoneless migration breaks silently | Third-party libs and DOM callbacks stop updating the UI; mutating plain fields instead of signals is the top bug; fakeAsync tests depend on Zone.js. Anecdotal blogs only. Sources disagree whether zoneless is default in v21 or v22 | https://dev.to/georgehulpoi/angular-zoneless-migrating-off-zonejs-without-breaking-your-ui-3cek , https://www.telerik.com/blogs/moving-angular-zoneless |
| 10 | Agents struggle and cost more with Angular | Nov 2026 bake-off, 12 JS stacks, same app, 5 runs each: Angular $4.97 (most expensive, 17.2 min, 9.76M tokens, failed 2 of 5 runs) vs Hono+htmx $2.67 (1,370 LOC), Astro $2.76. Simple app, one benchmark | https://www.devclass.com/ai-ml/2026/11/04/pokemon-bakeoff-reveals-best-javascript-frameworks-for-ai/5307282 |

Not found: hiring-market data, build-tool numbers, measured hallucinated-API rates, Angular upgrade-churn numbers.

**Read-through:** the pain is real but diffuse. Nobody is leaving React in volume (React is "the default output when prompting AI for UI", per the survey authors). Pain buys openings only where it is acute: server/client boundary complexity, effects, build assembly, and AI-agent cost.

## 2. Per-framework strength / weakness

| Framework | Status (late 2026) | Strength | Weakness |
|-----------|--------------------|----------|----------|
| React 19 + Compiler + RSC | Dominant; Compiler 62% enthusiastic; RSC unloved | Ecosystem, hiring, LLM default | Effects and re-render model, Next.js lock-in, RSC CVE-10 |
| Angular (signals, zoneless) | Signals mainstream; zoneless migration under way | Opinionated all-in-one, enterprise fit | Lowest satisfaction, costliest and flakiest for agents, migration pain |
| Solid 2.0 | Stable, reported 2026-11-16 (**verify**, one source) | Async built into the reactive graph, no VDOM | Breaking major, small ecosystem |
| Svelte 5 (runes) / SvelteKit | 5.56.x; about 3.3M npm downloads/week | Compiled, small runtime, strong DX | Positive sentiment slipping (32% to 29%), runes split community |
| Vue 3.6 Vapor | RC (rc.10), Vapor feature-complete; GA expected Q4 2026 (**verify**) | VDOM-free opt-in per component, same API | Not GA, library support catching up |
| Qwik 2 | 2.0 RC 2026-10-01 | Resumability, near-zero JS on load | Serialization complexity, small and declining community |
| Lit / web components | Lit 3.3.x; 2.7M to 4.9M downloads/week; no confirmed Lit 4 | Standards-based, works in any framework | Weak SSR and DX vs frameworks |
| Leptos | 0.8.20, pre-1.0 | Fine-grained signals, SSR, islands, server fns in Rust | Compile times, API churn, tiny ecosystem |
| Dioxus | 0.7.9, pre-1.0 | One Rust codebase for web, desktop, mobile; Subsecond hot patching | Native renderer young |
| htmx 4 | 4.0.0 on 2026-08-28; npm default stays 2.x until early 2027 | Tiny, no build step, LLM-cheap | Breaking 2.x to 4, weak client-side state |
| Datastar | v1.0.x, non-profit foundation | Hypermedia plus signals over SSE, one script | Small community, little 2026 data |
| TC39 Signals | Stage 1 (one source claims Stage 4, unreliable, **verify** at github.com/tc39/proposals) | Would standardise the primitive | Native availability 2 to 3 years minimum |
| Preact signals | 2.2.1; about 381K downloads/week | Tiny, framework-agnostic core | React integration relies on patches and a JSX transform |
| Zero (Rocicorp) | "1.0" June 2026, per InfoQ a very minor update from 0.26.2 | Postgres-first sync, instant UI | Postgres 15+ only, weak offline writes (low-confidence sources) |
| ElectricSQL | Acquired by Databricks 2026-08-11 | Read-path sync, PGlite | Writes are left to the developer; now a Databricks agenda |
| PowerSync | Mature, read-write | Postgres, MongoDB, MySQL backends | No funding or adoption data found |
| Triplit | Reported joined Supabase 2025-10 (single blog, **verify**) | Full-stack sync DB | Absorbed |
| Jazz / Livestore | Jazz v2 alpha, Livestore pre-1.0 (one source) | Collaborative data model | Not production-ready |
| Convex | $57M Series B 2026-08-04, "backend for agent-written software" | Reactive backend, agent-friendly | Proprietary backend, not local-first |

Trend: sync engines are being absorbed into platforms (Electric to Databricks, Triplit to Supabase). State of JS 2025: no framework other than Solid and Preact is gaining ground.

## 3. What makes frameworks win, and what kills them

Little of this was found in fetched sources; the "background knowledge" rows are my synthesis. Treat as hypotheses, but the pattern is well known.

| Framework | Why it won or faded | Basis |
|-----------|---------------------|-------|
| React | Facebook backing, tiny mental model (components plus one-way data), React Native extension, self-reinforcing hiring pool | background |
| Vue | Script-tag on-ramp to full toolchain, excellent docs | background |
| Angular | Google backing, all-in-one fit for enterprise. Rewrite from AngularJS burned goodwill | background |
| Tailwind | Solved one acute pain (naming and CSS sprawl) with a constrained, documented tool; copy-paste friendly | background |
| Next.js | Vercel distribution plus defaults on top of React's reach | background |
| shadcn/ui | Owned code in a registry, default design system in Lovable and v0 | https://redmonk.com/kholterhoff/?p=331 |
| Meteor | Tightly coupled full-stack, no stable RDBMS support, lost to modular tooling | https://forums.meteor.com/t/what-factors-are-slowing-down-meteor-adoption/6505 |
| Ember | Bulky and opinionated, mindshare lost to React and Vue | https://dri.es/node/3541 |
| Backbone, Riot, Mithril | Low adoption or small communities; replaced by declarative components | https://dri.es/node/3541 |
| Elm | Different language, high up-front work for typical client features | same |
| Marko, Stencil, Dojo | Technically good, overtaken by bigger ecosystems | background |

**Survivor pattern:**

| Trait | Evidence in table above |
|-------|-------------------------|
| Big backer or distribution channel | React, Angular, Next.js |
| Easy on-ramp (script tag, copy-paste) | Vue, Tailwind, shadcn |
| One acute pain solved 10x better, not 20% better | Tailwind, React (DOM updates), Svelte (bundle and DX) |
| Ecosystem that compounds (libraries, hiring, tutorials) | React, Vue |
| No costly rewrites | Angular is the cautionary tale |

**Killer pattern:** a better engine without an ecosystem (Solid, Qwik, Marko), a different language (Elm), or a tightly coupled full-stack with a niche backend (Meteor). Technical superiority alone has never won.

**New 2026 factor: the LLM monoculture.** React is the default for AI app builders. v0 builds Next.js plus shadcn plus Tailwind. Lovable historically defaulted to React+Vite+Tailwind+Supabase, and reportedly moved new projects to TanStack Start on 2026-05-13 (vendor claim, **verify**). Bolt is framework-agnostic.

| LLM finding | Source |
|-------------|--------|
| Popular frameworks get higher LLM success ("Matthew effect", preprint, indirect) | https://arxiv.org/html/2509.23261v2 |
| Web-Bench attributes React's lead to training-data share and JSX; Angular's grammar is hardest | https://arxiv.org/pdf/2505.07473 |
| Models invent APIs and emit deprecated patterns for fast-moving frameworks; mitigation is retrieval (Context7, llms.txt). Informal test: a "never hallucinate" prompt cut fabricated APIs from 80% to 30% | https://www.trevorlasn.com/blog/context7-mcp , https://upstash.com/blog/context7-llmtxt-cursor |
| Server-centric, low-boilerplate stacks cost least for agents (Hono+htmx, Astro, Nuxt) | devclass bake-off URL above |
| No source validates any "AI-first framework" claim with benchmarks. VC commentary says "AI-native" is mostly rebranding | https://www.insightpartners.com/ideas/behind-the-investment-convex/ |

Implication: a new framework has a **cold-start handicap with LLMs** (not in training data), the opposite of what an "AI-first" pitch assumes. It only works if the framework ships its own grounding (llms.txt, MCP, schemas, generated examples) and is cheaper for agents. cascivo already ships llms, MCP and registry-generated context, which is the right instinct, but nobody has measured it.

## 4. Candidate differentiators for cascivo

Scores 1 to 5. Impact = would it change an adoption decision. Feasibility = can cascivo ship it credibly in about 6 months with a small team. Defensibility = hard for React, Angular, Svelte, Solid to copy.

| # | Differentiator | Impact | Feas. | Defens. | Blunt take |
|---|----------------|:------:|:-----:|:-------:|------------|
| D1 | **Agent-cost benchmark winner.** Publish a reproducible harness (like the Nov 2026 bake-off): same app, 12 stacks, tokens, dollars, success rate, with cascivo's grounding (llms, MCP, `.meta.ts` schemas). Claim "cheapest and most reliable for agents to build rich UIs" | 4 | 4 | 3 | Highest ROI. It is measurable, and the only existing data points to server-centric, low-boilerplate stacks winning. Risk: cascivo may not win. Run it before promising it. Benchmarks are copyable once published, but the harness and the lead are not |
| D2 | **One component contract across five targets** (React, Solid, custom elements, htmx/Rust server, Rust native/TUI) driven by the `cv-*` CSS contract | 3 | 3 | 4 | Genuinely unusual. Nobody else spans server-rendered HTML to native windows with one design contract. But "write once" pitches have a bad history, and the buyer for it is unclear. Sell the escape hatch: no rewrite when you leave React |
| D3 | **Owned code, not a dependency** (shadcn model extended with signals, tests, a11y gates). Zero upgrade treadmill; agents read the source in the repo | 3 | 5 | 2 | Already built. shadcn proved the model and owns the mindshare, so this is table stakes, not a wedge. Strength is the strict gate suite (WCAG 2.2, RTL, strict TS) that copies pass in the adopter's config |
| D4 | **Signals without a compiler or VDOM, on a standard**: `@cascivo/core` on `@preact/signals-react`, aligned to TC39 Signals | 2 | 4 | 1 | Solid, Preact, Angular, Svelte and Vue already own this. TC39 is Stage 1 and 2 to 3 years from native. Not a differentiator. Keep it as plumbing |
| D5 | **Server-first rich client: Rust axum + htmx fragments + islands + SSE, with typed forms, sessions, CSRF** (`cascivo-server`, `cascivo-worker`) | 4 | 3 | 3 | Rides the one proven agent-cost signal (htmx stacks are cheap) and the RSC backlash (CVE, low enthusiasm). Rust is both a hiring filter and a safety pitch. htmx 4 is breaking, and Leptos/Dioxus already own the "Rust web" narrative. Needs a real rich-client story for offline and optimistic UI, not just fragments |
| D6 | **Local-first data layer, bring-your-own-engine**: a thin cascivo adapter over Zero, PowerSync and Electric, surfacing sync state as signals (pending, conflict, offline) in components | 4 | 2 | 3 | Rich-client apps live and die on data. Sync engines are consolidating and no UI layer treats sync state as first-class. But Zero is only "1.0" cosmetically, offline writes remain unsolved, and each engine is a moving target. Do an adapter, never an engine. Building a sync engine would be suicide |
| D7 | **Spec-first, generated app: `.meta.ts` + schemas as the source of truth** that agents edit and the toolchain compiles to React, Solid, HTML | 4 | 3 | 4 | The most defensible if it works, since the moat is the schema and generator quality, not the runtime. Closest to "AI-first" with evidence behind it (deterministic output, smaller diffs, cheaper reruns). But no source proves spec-first beats code-first for LLMs. Needs the D1 benchmark to justify it |
| D8 | **Safe-by-default rich client**: no RSC-style wire protocol, strict CSP, CSRF, registry path validation, no deserialisation of client payloads | 3 | 4 | 2 | The React2Shell timing makes this a timely sales line for security-sensitive buyers (finance, government). The claim is cheap to copy, though, and "we are not vulnerable to that bug" does not carry a framework by itself. Use it as proof inside D5, not a headline |

### Ranking

| Rank | Pick | Why |
|------|------|-----|
| 1 | D1 (agent-cost benchmark) plus D7 (spec-first) | Together they make a falsifiable "AI-first" claim. Without D1, "AI-first" is marketing, and the research found no validated claim anywhere. Do D1 first and let the result steer D7 |
| 2 | D5 (server-first Rust rich client) | Aligns with evidence (cost, RSC backlash). Needs an offline and optimistic-UI answer |
| 3 | D2 (one contract, five targets) | Unique, so it can be the long-term moat, but hard to explain. Lead with "no lock-in", not "five targets" |
| 4 | D6 (sync adapter) | Highest ceiling, highest risk. Adapter only, after D5 |
| 5 | D8, D3 | Supporting proof points |
| Skip | D4 | Not a differentiator |

## 5. Blunt risks

| Risk | Detail |
|------|--------|
| Cold start with LLMs | New APIs are absent from training data. The mitigations (llms.txt, MCP, Context7) have no measured benefit. We must measure our own |
| Ecosystem gap | The survivor pattern needs libraries, hiring and tutorials. cascivo has none of these at scale. Winning needs a wedge segment, not "compete with React" |
| Breadth | Five targets plus Rust crates is a lot of surface for a small team. Each unfinished target dilutes the story. A framework that is wide but shallow fits the killer pattern |
| "Rich client" is not a feature | Rich clients need routing, data, forms, auth, offline, DevTools and deployment. Today cascivo is a design system plus server crates. The gap to Next.js or Angular as a framework is large |
| Market timing | The window is real (React fatigue, RSC backlash, agents choosing stacks), but the default is still React, and TanStack Start and shadcn already take the "lightweight React" slot |

## 6. Suggested next step

1. Build the D1 harness (agent-cost bake-off) with cascivo's grounding on and off. Cost: low. It tests the entire AI-first thesis.
2. Pick one wedge segment where D5 plus D7 apply (internal tools, dashboards and admin apps built by agents) rather than a general React replacement.
3. Specify the missing framework layers (routing, data, forms, offline) against 01-inventory.md once it lands.

## Source gaps

| Gap | Note |
|-----|------|
| Hiring and build-tool data | Not found |
| Hallucinated-API rates per framework | No benchmark found |
| Star and download counts for Leptos, Dioxus, Datastar, htmx | Not found |
| Vue 3.6 GA date, Lit 4, TC39 stage, Solid 2.0 date, Replicache maintenance mode, Triplit to Supabase | Single or conflicting sources, **verify** before citing |
| Funding for Jazz, Livestore, Triplit, PowerSync | Not found |
