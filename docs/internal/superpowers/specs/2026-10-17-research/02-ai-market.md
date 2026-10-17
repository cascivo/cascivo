# AI x UI libraries: what cascivo may still lack (2026-10-17)

Scope: AI layer and generative UI. Builds on `docs/internal/market-analysis-2026-09.md` (sections 0, 3, 8.4, 9, 10), does not repeat it.
Convention: **[V]** = verified from a primary or fetched source (link given). **[S]** = secondary/blog source only. **[I]** = my inference.
Effort: S = days, M = 1-3 weeks, L = a quarter. Impact: for cascivo's stated position ("AI-first, conformance-checked, CSS-native").

---

## 0. What changed since the 2026-09-24 analysis (repo, verified by grep/ls)

Items the Sept analysis listed as gaps that are now done (**[V]**, repo at HEAD d0f3e44f, 2026-10-16):

| Sept gap (8.4 / 3.3) | State now | Evidence |
|---|---|---|
| Publish `@cascivo/render` | published, v1.9.0, `private:false` | `packages/render/package.json` |
| DTCG export | exists | `scripts/tokens/generate-dtcg.ts`, `packages/tokens/dtcg/`, `scripts/checks/dtcg-export.test.ts` |
| DESIGN.md | generated | `scripts/design-md/generate.ts`, `apps/site/public/DESIGN.md` (5 KB) |
| Storybook components manifest | enabled | `apps/storybook/.storybook/main.ts:15` (`features: { componentsManifest: true }`) |
| `render_view_as_markdown` MCP tool | exists | `packages/mcp/src/server.ts` (tool list below) |
| One-command AI setup | exists | `skills/README.md` (`npx skills add cascivo/cascivo`, `npx cascivo mcp init`); `packages/cli/src/commands/mcp.ts` |
| shadcn migration skill | exists | `skills/cascivo-migrate-from-shadcn/` |

Still open from Sept: `llms.txt` is still **80 KB** (was 105 KB; target 5-8 KB) and `llms-full.txt` 688 KB, `context.json` 1.3 MB (`apps/site/public/`). No A2UI / json-render / MCP Apps adapter anywhere (`grep -ri 'a2ui|ag-ui|ext-apps|ui://|json-render'` hits only `docs/internal/ROADMAP-V40.md` prose about OpenUI). Streaming/progressive render is explicitly **deferred** (`docs/internal/ROADMAP-V40.md:71`). No published audit-loop benchmark (only `docs/BENCHMARKS.md`, perf).

MCP server today: 29 tools (`list_registries, list_components, get_component, search_components, add_to_project, lint_email, list_templates, get_template, add_template, create_app, list_blocks, compose_app, deploy_preview, create_theme, scaffold_page, validate_view, render_view_as_markdown, scaffold_view, scaffold_flow, get_view_grammar, get_tokens, search_icons, get_variant_matrix, validate_component, list_guides, get_guide, get_context, select_component` + 1; `packages/mcp/src/server.ts`). **No** `registerResource`, `registerPrompt`, tool `annotations`, `outputSchema` or elicitation (grep of server.ts) **[V]**.

Registry: 214 components, 12 blocks, 3 templates (`registry.json`).

---

## 1. Generative-UI protocols/runtimes: state of play (Oct 2026)

| Thing | State (dated) | Catalog / component format it consumes | Source |
|---|---|---|---|
| **MCP Apps (SEP-1865)** | Stable spec `2026-01-26`, extension id `io.modelcontextprotocol/ui`; first official MCP extension; launch hosts Claude (web+desktop), Goose, VS Code Insiders, ChatGPT (rolling out). OpenAI's docs now say build new UI on the MCP Apps bridge and use `window.openai` only for ChatGPT extras. **[V]** | Not a catalog. Tool `_meta.ui.resourceUri` -> `ui://` HTML resource (`text/html;profile=mcp-app`) in a double-iframe sandbox, JSON-RPC over postMessage. **Host passes theme as CSS variables** (`--color-background-primary`, `--color-text-primary`, `--border-radius-md`, `--font-sans`, `--font-heading-lg-size`, `--shadow-sm` ...) + `light-dark()`; `tool-input-partial` streaming; display modes inline/fullscreen/pip; `ui/update-model-context`. | [spec](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx), [MCP blog 2026-01-26](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/), [OpenAI: MCP Apps in ChatGPT](https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt) |
| **OpenAI Apps SDK** | Nov 2025 launch; now MCP-Apps-first. `@openai/apps-sdk-ui` = Tailwind 4 + Radix kit for ChatGPT apps (one-commit early repo, ~650 stars **[S]**). ChatGPT-only: `requestModal`, `requestCheckout`, `uploadFile`, widget state. **[V/S]** | Same as MCP Apps; its own UI kit is Tailwind-bound | [apps-sdk-ui](https://github.com/openai/apps-sdk-ui) |
| **Google A2UI** | v0.9 (2026-04-17), v0.9.1 current, **v1.0 = release candidate** (spec page "Last Updated Jun 8, 2026"); 16.7k stars, Apache-2.0. Official renderers Lit, Angular, React (added with 0.9), Flutter (GenUI SDK); Compose alpha. Python agent SDK (`a2ui-agent-sdk`). Transports: A2A 1.0, AG-UI, MCP, WS, REST. **[V]** | **JSON-Schema catalogs** (`catalog_definition.json`, `$ref/$defs`), optional `instructions` per catalog (replaces rules.txt), `allowedParents/allowedChildren`, `allowedCallers`, multi-catalog per surface, MIME `application/a2ui+json`. **v1.0 removed `theme`/`primaryColor` from catalogs "to separate layout from branding"** -> design system owns look. Flat component list with ids (streams well). | [a2ui.org v1.0 evolution](https://a2ui.org/specification/v1.0-evolution-guide/), [repo](https://github.com/a2ui-project/a2ui), [Google blog](https://developers.googleblog.com/a2ui-v0-9-generative-ui/) |
| **AG-UI (CopilotKit)** | Transport/interaction layer, SDKs TS/Python/.NET at 1.0; first-party in Microsoft Agent Framework, Google ADK, AWS Strands/AgentCore, Mastra, Pydantic AI, LlamaIndex, AG2. Features: shared state diffs, **interrupts (HITL approve/edit/retry)**, custom events. Declares A2UI and MCP Apps "supported", plus "static" typed-component generative UI. **[V]** | Not a UI format; carries A2UI / MCP Apps / tool-call->component | [docs.ag-ui.com](https://docs.ag-ui.com/introduction), [CopilotKit generative-ui repo](https://github.com/CopilotKit/generative-ui) |
| **Vercel AI SDK 6** | 2025-12-22. `ToolLoopAgent`, **`needsApproval` + `addToolApprovalResponse`**, stable `@ai-sdk/mcp` (OAuth, resources, prompts, **elicitation**), DevTools. RSC/`streamUI` documented as experimental, "not recommended for production", migrate to AI SDK UI (tool parts -> your components). **[V]** | Tool-part states (`input-streaming`, `input-available`, `output-available`, `approval-requested`...). cascivo's `ToolCall` already mirrors these states. | [AI SDK 6](https://vercel.com/blog/ai-sdk-6), [RSC->UI migration](https://ai-sdk.dev/docs/ai-sdk-rsc/migrating-to-ui) |
| **json-render (Vercel Labs)** | 18.7k stars, Apache-2.0. Renderers React/Vue/Svelte/Solid/RN/Ink/PDF/Email/Image/Remotion/R3F; `@json-render/shadcn` (36 comps), `@json-render/mcp` (MCP Apps), `codegen`; A2UI proof-of-concept support (Google blog). **[V]** | `defineCatalog(schema,{components,actions})` with **Zod** props + descriptions; `catalog.prompt()` builds the system prompt; SpecStream patches stream progressively | [repo](https://github.com/vercel-labs/json-render) |
| **Thesys C1 / OpenUI** | C1 API 2025-09-30; **OpenUI launched 2026-03-11** (MIT, ~11.4k stars): OpenUI Lang streaming-first DSL, claims up to 67% fewer tokens than JSON (52.8% vs json-render across 7 scenarios, tiktoken GPT-5). Ships `@openuidev/a2ui` (A2UI v1.0 client). OUI-1 self-host model **[S]**. | Zod component definitions -> generated prompt; runtimes React/Vue/Svelte/Angular | [OpenUI repo](https://github.com/thesysdev/openui), [Product Hunt](https://www.producthunt.com/products/thesys/launches/openui-2) |
| **Tambo** | 11.2k stars, MIT. **Tambo Cloud is shutting down: signups closed, hosted service ends 2026-10-31**; self-host remains, team moving to a new project. **[V]** | Zod-registered components become LLM tool definitions; "generative" vs "interactable" components; MCP incl. elicitation/sampling | [repo](https://github.com/tambo-ai/tambo) |
| **assistant-ui** | 12.6k stars, MIT, YC. Backends: AI SDK, LangGraph, AG-UI, A2A, Google ADK. `makeAssistantToolUI`, inline human approvals, attachments, voice dictation, branch picker. Does not list A2UI/MCP Apps. Starter now Base UI by default. **[V]** | Tool-name -> React component registry | [repo](https://github.com/assistant-ui/assistant-ui) |
| **LangGraph/LangChain gen UI** | Rides AG-UI/assistant-ui (partnership listed in AG-UI docs). No separate catalog format found. | n/a | AG-UI docs above |
| **Google Gemini "generative UI"** | Nov 2025 research (dynamic view / visual layout in Gemini app, AI Mode) - freeform code generation, not catalog-bound. **[V, dated 2025]** | n/a | [Google Research](https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/) |
| **Claude artifacts / "Imagine"-style** | I could not retrieve primary sources for Claude's artifact/"Imagine" UIs in this session; treat as unresearched. What *is* verified: Claude renders MCP Apps `ui://` views (above), and Claude Design (below). | n/a | - |
| **Elicitation (MCP spec 2026-07-28)** | Form-mode elicitation: server sends a JSON Schema, client renders a form (2025-06-18); URL mode (2025-11-25); in 2026-07-28 it runs via multi-round-trip "input-required" results. **[S: spec mirror + Nango]** | JSON Schema -> client-rendered form | [spec mirror](https://modelcontextprotocol.net/specification/2026-07-28/client/elicitation.md) |

### Cross-cutting facts
- **Three layers have emerged** (CopilotKit's own taxonomy): controlled (tool part -> your component, AI SDK/assistant-ui/AG-UI), declarative (A2UI, json-render, OpenUI; closed catalog + JSON), open-ended (MCP Apps, iframe HTML). [V: CopilotKit repo description]. cascivo's `ViewConfig` is in the declarative band; its components with `status` props are in the controlled band; nothing in the open-ended band.
- **Catalog formats are converging on "schema per component + instructions"**: Zod (json-render, Tambo, OpenUI) or JSON Schema (A2UI, MCP tools). cascivo's `.meta.ts` -> `packages/render/src/prop-schemas.ts` already holds the same data; emitting either is a codegen exercise **[I]**.
- **A2UI v1.0 decoupling theme from catalog** and **MCP Apps passing host CSS variables** both mean the *host's* tokens must be mapped onto the renderer's tokens. A CSS-variable design system is the natural fit. This is cascivo's structural advantage over Tailwind/Radix kits (apps-sdk-ui, shadcn) **[I]**.

### What it takes for cascivo to be first-class in each
| Target | Work | Effort |
|---|---|---|
| MCP Apps | (a) `@cascivo/mcp-app` helper: bundle a `ViewConfig` + `@cascivo/render` + `@cascivo/react` CSS into a single-file HTML, register as `ui://cascivo/view/<id>` with `_meta.ui.resourceUri`; (b) **host-theme bridge**: map the ~80 spec variables (`--color-background-primary` -> `--cascivo-color-bg`, `--color-text-primary` -> `--cascivo-color-text`, `--border-radius-md` -> `--cascivo-radius-*`, fonts, `light-dark()`) at `ui/initialize`; (c) wire `ui/notifications/tool-input-partial` to streaming render; (d) CSP default `connect-src 'none'` is compatible with a no-network renderer; (e) MCP tools `validate_view` -> `render_view_app` | M |
| A2UI v0.9/v1.0 | Generate a JSON-Schema **catalog** from `registry.json`/`.meta.ts` (Component names, props, `allowedChildren`, `instructions` from `intent`); write a renderer adapter that maps A2UI flat `{id, component, parentId/children}` + data model paths onto `ComponentNode` (`$data`/`$state` refs already map naturally); ship as `@cascivo/a2ui`. Track RC -> 1.0 | M (L if bidirectional functions) |
| json-render | Emit a `defineCatalog`-compatible Zod module from the same manifests; a `@json-render/react` registry mapping name->cascivo component. Cheap because json-render is the loosest coupling | S-M |
| OpenUI | `@openuidev/lang-core` library definition from manifests; lower priority (OpenUI already speaks A2UI) | S |
| AG-UI | No catalog needed; a `useAgui`-style adapter feeding `AiChat`/`ToolCall` from AG-UI events (text, tool-call, interrupt). Docs + one example | S-M |
| AI SDK UI | Docs/recipe: map tool parts -> `ToolCall`/`Reasoning`/`Sources` (states already match); `cascivo add` recipe `apps/examples/chat` exists (commit a5c3efba) but only on Workers AI | S |
| assistant-ui | Provide cascivo-styled primitives theme; assistant-ui is headless, so a "cascivo skin" package | M |
| Claude Design / Figma Make / Lovable | Certification checks (see 3) | S-M |

---

## 2. AI-specific components libraries ship now vs cascivo

### 2.1 Competitor inventories (Oct 2026)
- **shadcn/ui "AI Elements"** (changelog "October 2026 - Trace, Code Block and AI Elements"): **21 copy-in patterns**: Chain of Thought, Chat (with Message Scroller), Checkpoint, Confirmation, Context, File Tree, Inline Citation, Message, Model Selector, Plan, Prompt Input, Queue, Reasoning, Sources, Stack Trace, Subagent, Suggestion, Task, Terminal, Test Results, Tool. Plus new `Trace` and `Code Block` (code, terminal output, logs, **diffs**). June 2026: Message Scroller, Message, Bubble, Attachment, Marker (headless `@shadcn/react`). Aug 2026: **Questionnaire** (multi-step clarification/intake) and **Human in the Loop** (`@shadcn/helpers`). **[V]** [ai-elements](https://ui.shadcn.com/docs/ai-elements), [changelog](https://ui.shadcn.com/docs/changelog), [chat components](https://ui.shadcn.com/docs/changelog/2026-06-chat-components)
- **Vercel AI Elements** (elements.ai-sdk.dev): 49 components in Chatbot / Code / Voice / Workflow / Utilities (Attachments, Chain of Thought, Checkpoint, Confirmation, Context, Conversation, Inline Citation, Message, Model Selector, Plan, Prompt Input, Question, Queue, Reasoning, Shimmer, Sources, Suggestion, Task, Tool; Agent, Artifact, Code Block, Commit, Env Vars, File Tree, JSX Preview, Package Info, Sandbox, Schema Display, Snippet, Stack Trace, Terminal, Test Results, Web Preview; Audio Player, Mic Selector, Persona, Speech Input, Transcription, Voice Selector; Canvas/Node/Edge/Connection/Controls/Panel/Toolbar). **The site states Vercel's AI Elements is moving to shadcn/ui and will be deprecated at the end of November 2026.** **[V]** [elements.ai-sdk.dev](https://elements.ai-sdk.dev/), confirmed in [shadcn AI Elements page](https://ui.shadcn.com/docs/ai-elements) (it calls AI SDK Elements "the earlier version").
- **Streamdown** (Vercel): streaming-safe markdown renderer (remend repairs unterminated bold/fences/tables; memoised blocks; Shiki, KaTeX, Mermaid; rehype-harden). Powers AI Elements `Message`. **[S]** [overview](https://www.mintlify.com/vercel/streamdown)
- **Cloudscape (AWS) Gen-AI patterns**: ~19 patterns incl. chat, loading, follow-ups, regeneration, artifact previews, thinking, agent management, in-flow user input (2026-06-19). **[V]** [cloudscape.design/gen-ai](https://cloudscape.design/gen-ai/)
- **assistant-ui**: Thread/Composer/BranchPicker/ActionBar primitives, attachments, voice dictation, markdown+code. **[V]**

### 2.2 What cascivo has (verified, `packages/components/src/`, `registry.json`)
Present: `chat-bubble`, `reasoning`, `chain-of-thought`, `sources`, `inline-citation`, `tool-call` (states `pending|running|awaiting-approval|complete|error|denied`, `actions` slot, mirrors AI SDK tool-part states), `prompt-suggestions`, `message-actions`, `context-meter`, `ai-status`, `ai-badge`, `ai-disclaimer`, `shimmer-text`, `typing-indicator`, `streaming-text` (typewriter, plain text only), `terminal`, `log-viewer`, `file-uploader`, `tree-view`, `timeline`, `steps`, `code-snippet`, `command-menu`, `@cascivo/ai` `AiChat` (follow-scroll pin threshold, finished-reply announce, `role=log aria-live=off` - good a11y design), `@cascivo/editor` (markdown grammar, not a renderer), `flow` (node canvas), recipes `agent` and `voice` (`packages/cli/recipes/`).
Absent (no directory, no registry entry): prompt-input/composer (attachments, mentions, model picker), message-scroller/conversation, **streaming markdown renderer** (`Prose` takes trusted HTML only; no `marked/remark/micromark` anywhere in package.json files), plan, task, queue, trace, checkpoint, subagent, confirmation, questionnaire, model-selector, code-block with diff, file-tree-of-changes, test-results, stack-trace, artifact, web/JSX preview, speech-input/transcription/audio-player/persona, feedback (thumbs), branch/regenerate pager, schema-driven form.

### 2.3 Revision to Sept advice "don't compete on chat" (section 9)
Still right that cascivo should not chase every pattern. But two facts changed: (1) Vercel is retiring its own kit in ~6 weeks and shadcn is absorbing it, so the "AI Elements" slot is about to be *shadcn-schema* patterns; cascivo's shadcn projection (`packages/registry/src/shadcn.ts`) can serve them only if the components exist. (2) The things AI apps need *every day* that cascivo lacks are small and CSS-heavy: a **prompt input** and **streaming markdown**. These two decide whether `AiChat` is usable beyond a demo. **[I]**

---

## 3. Agent-facing design-system context

| Item | State | cascivo | Gap |
|---|---|---|---|
| **Figma MCP / Code Connect** | Figma MCP writes to canvas via `use_figma` (Mar 2026); skills bundle (design-system-rules skill writes CLAUDE.md/AGENTS.md; Code Connect skills) installable from Anthropic's plugin marketplace **[S]** [guide](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server), [alternativeto](https://alternativeto.net/news/2026/3/figma-opens-direct-ai-agent-design-on-canvas-introduces-skills-for-guided-workflows) | No Code Connect output; no Figma kit (only grep hit for "Code Connect" is in roadmaps) | Generate `*.figma.tsx` Code Connect mappings from `.meta.ts`. M |
| **Storybook MCP** | `@storybook/addon-mcp`, components manifest, docs-list/docs-show/test-run; "in preview" **[S]** [docs](https://storybook.js.org/docs/ai) | Manifest on (`apps/storybook/.storybook/main.ts:15`) | Done; verify adopters can use it with copied components |
| **shadcn registry + MCP** | Private GitHub registries (Aug 2026), directory, `shadcn mcp init` **[V]** | Projection exists (`packages/registry/src/shadcn.ts`, `apps/site/public/r/shadcn/`, `registry-item.v2.json`) | Directory submission and v0 verification still unverified (Sept doc 3.1). S |
| **Claude Design** | 2026-06-17 overhaul: import design system from GitHub repo/design file/raw dump; checks output against tokens and auto-corrects; `/design-sync`; Sept: works inside any Claude conversation incl. Claude Code **[S: VentureBeat, TechRepublic, claude.com blog]** [claude.com](https://claude.com/blog/claude-design-stays-on-brand-for-daily-work) | Unknown | Try import of the repo and publish result. S |
| **Lovable** | "Design Systems" on every paid plan; extracts from brand guidelines, screenshots, Figma; npm-wrapping details not confirmed **[S]** | n/a | S (test) |
| **v0 / Bolt / Replit** | No primary confirmation of BYO-design-system beyond v0 shadcn registry **[S]** | shadcn projection | S |
| **Agent Skills** | Open standard agentskills.io (2025-12-18); 40+ adopters by mid-2026 **[S]**. **MCP SEP-2640 "Skills Extension" is Final (created 2026-04-23)**: skills served over MCP as `skill://<path>/SKILL.md` resources with `skills/list` / `skills/get` **[V]** [SEP](https://modelcontextprotocol.io/seps/2640-skills-extension.md) | 8 skills in `skills/`; `npx skills add` documented (`skills/README.md`) | **MCP server does not serve its skills** (no resources). S-M |
| **AGENTS.md / llms.txt / Context7** | AGENTS.md under Linux Foundation AAIF (Sept doc). llms.txt: vendor report says Anthropic and Perplexity confirmed support; no independent measurement of agent fetch rates **[S]** [Presenc](https://presenc.ai/research/state-of-llms-txt-2026) | AGENTS.md, llms.txt (80 KB), docspack | Trim llms.txt (open from Sept). S |
| **DTCG** | 2025.10 stable (2025-10-28); Figma, Penpot, Sketch, Tokens Studio, Style Dictionary, Terrazzo listed as supporting; composite types lag **[V/S]** [W3C CG](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/) | DTCG export exists (`packages/tokens/dtcg`) | Check it validates against 2025.10 (resolver/`$extends`, OKLCH). S |
| **Meta Astryx** | Beta 2026-06-18 (repo ~06-28), `npx astryx manifest --json` CLI manifest + MCP server **[S]** [InfoQ](https://infoq.com/news/2026/09/meta-astryx-design-system) | `cascivo` CLI has `cmdspec` rendered docs (commit aa3967d2); | A machine-readable **CLI manifest** (`cascivo manifest --json`) is a cheap parity item. S |
| **Design system for agents guidance on taste** | shadcnblocks ships a per-theme DESIGN.md with "taste rules" **[S]** [post](https://www.shadcnblocks.com/blog/shadcn-theme-design-md) | DESIGN.md generated from tokens | Add per-theme DESIGN.md (12 themes) with do/don't rules. S |

---

## 4. Agent-operable UIs (UIs used BY agents)

**WebMCP** **[V unless marked]**
- Spec: Draft Community Group Report (W3C Web Machine Learning CG), snapshot dated **2026-10-16**, editors Microsoft + Google. Not on the standards track. Entry point in the draft: `document.modelContext` with `registerTool`, `getTools`, `executeTool`; `ToolAnnotations` include `readOnlyHint`, `untrustedContentHint`, `consequentialHint`; Permissions-Policy feature `tools`. [spec](https://webmachinelearning.github.io/webmcp/)
- `navigator.modelContext` is the older name; a secondary source says Chromium 150 deprecated it in favour of `document.modelContext` **[S]**. Origin trial roughly Chrome 149-156 **[S]**; early preview announced 2026-02-10 **[S]**.
- **Declarative API** (Chrome docs, origin trial; page dated 2026-05-18, revised 2026-09-25): put `toolname` + `tooldescription` on a `<form>`; fields become the input schema (`toolparamdescription` > `<label>` > `aria-description`; `<select>` -> enum; `required`); `toolautosubmit`; `SubmitEvent.agentInvoked` and `respondWith()`; `toolactivated`/`toolcancel` events; **UA pseudo-classes `:tool-form-active` and `:tool-submit-active` applied during agent invocation (default dashed outline, overridable)**. [Chrome docs](https://developer.chrome.com/docs/ai/webmcp/declarative-api)
- Libraries: `use-webmcp-tool` (GoogleChromeLabs, React 18+, feature-detecting no-op) **[S]** [repo](https://github.com/GoogleChromeLabs/use-webmcp-tool); `@zap-studio/webmcp-react` `useWebMCPTool` **[S]**. I found **no design system** shipping form components that emit these attributes.
- **cascivo fit [I]:** `Form`/`Field`/`Input`/`Select`/`Button` render real `<form>` and labels, so the declarative API almost works if `toolname`/`tooldescription` pass through and the label/`aria-description` convention is already followed. And `:tool-form-active` / `:tool-submit-active` styling is exactly the "CSS-native" kind of thing a layered-CSS library should own: a token (`--cascivo-color-ai`, already used by `ToolCall`) + focus-ring-style outline in `@layer cascivo.component`. Repo has zero references today (grep for `webmcp|modelContext|toolname` empty) **[V]**.

**Accessibility tree as agent API**
- Google's web.dev **"Build agent-friendly websites"** (published with Modern Web Guidance, 2026-05-20): agents read via screenshots, DOM, and the accessibility-derived tree; recommends semantic elements, label-input association, stable layouts, no transparent overlays; links WebMCP. **[S: SEJ and others; primary page at web.dev/articles/ai-agent-site-ux not fully retrieved]** [SEJ](https://www.searchenginejournal.com/google-tells-developers-to-build-for-ai-agents-not-just-humans/517606/)
- Playwright MCP uses accessibility snapshots; Comet hybrid tree+vision **[S]**.
- Possible contradicting claim I could not verify: that OpenAI's Atlas browser shut down on 2026-08-09 (single secondary source). Not used.
- **cascivo already has the strongest answer here:** `@cascivo/text` "machine mode = the accessibility tree, serialized" (`docs/MACHINE-MODE.md`), with `elementToMarkdown` reading live DOM properties. It is not framed as "agent-operable"; no tool exposes *actions*. **[V]**

**Chrome built-in AI / on-device**
- Prompt API: Chrome developer page last updated 2026-05-19; secondary sources say stable in Chrome 148 for extensions and progressively for sites; Summarizer/Translator/Language Detector stable, Writer/Rewriter/Proofreader still origin-trial per one source (sources disagree) **[S]** [Chrome docs](https://developer.chrome.com/docs/ai/prompt-api)
- Chrome's own 2026-07-16 blog wires the Prompt API into **AI SDK `useChat` + AI Elements** via `DirectChatTransport` with cloud fallback **[V]** [blog](https://developer.chrome.com/blog/prompt-ui-ai-elements-with-vercel-ai). It renders `text` parts only.
- cascivo: nothing on-device; `apps/examples/chat` uses Workers AI. A recipe is S.

**NLWeb**: Microsoft, Build 2025; `/ask` returns Schema.org JSON, each instance also serves `/mcp`; ~6.3k stars; no deployment count **[S]** [Presenc](https://presenc.ai/research/nlweb-adoption-2026). Not a UI-library concern; skip. **[I]**

---

## 5. Evaluation / conformance

Verified recent research (none measures lint-based adherence):
- **"Design System-Compliant User Interface Generation with LLM Agents: A Comparative Study of Context Engineering Strategies"** (ACM, 2026): component-registry context yields higher compliance than style-guide interpretation, at more tokens/time; compliance = fraction of checkpoints met, LLM-as-judge. [ACM DL](https://dl.acm.org/doi/10.1145/3772363.3798616) **[S: via search snippet; page 403]**
- **EvoGenUI-Bench** (arXiv 2608.29387, 2026-08-29, EMNLP 2026): 150 five-turn tasks; best model 74.9% turn pass but only 37.3% full episode; adjacent-pass retention 52.4% on tool-grounded tasks. **Multi-turn maintenance is the weak point.** **[V]** [arXiv](https://arxiv.org/abs/2608.29387)
- **SchemaGUI** (arXiv 2608.22390, 2026-08-23): schema-driven GUI generation; schema feasibility 91.6% -> 99.6% from 4B to 27B but geometry only 67% -> 75%. **[V]** [arXiv](https://arxiv.org/abs/2608.22390) Supports "closed schema + validator" over free layout.
- 1D-Bench (arXiv 2602.18548) iterative UI code with visual feedback **[S]**.
- Atlassian (+92% tokens DESIGN.md vs MCP) and Indeed (JSON 5x cheaper than MDX): from Sept doc, not re-verified.

cascivo has the checker (`cascivo audit --ai`, `packages/cli/src/audit-ai/*`, `validate_view`, `validate_component`, `apps/site/public/audit-contract.json`, ESLint plugin) **[V]** but **no published eval**, no harness to rerun it, and no visual verification loop (workbench has `/index.json` of entries + screenshots for axe sweeps, `packages/workbench/README.md`, which is the right substrate). EvoGenUI-Bench suggests adding a **multi-turn edit** scenario (ViewConfig patch across 5 turns) because that is where models fail. **[I]**

---

## 6. Other trends

- **Prompt-to-theme:** shadcn/studio, tweakcn, Cnify (image->theme), 21st.dev community themes as token sets, shadcnblocks themes with DESIGN.md "taste rules" **[S]**. cascivo has `create_theme` MCP tool + `cascivo-create-theme` skill (WCAG AA contrast check) + `theme` CLI **[V]** - this is partially ahead (contrast-validated). Gap: no "brand URL/image -> theme" and no per-theme DESIGN.md.
- **Accessibility agents:** Deque axe MCP (from Sept doc); cascivo has AT sweep results and `a11y` tests; no agent-facing a11y tool (`validate_component` may cover part; not verified) **[I]**.
- **Self-healing UIs / auto-correct:** Claude Design auto-corrects against tokens **[S]**; cascivo's equivalent is `audit --ai --json` in the loop, which is exactly this - needs a fix-suggestion field (autofix) to close the loop **[I]**.
- **Security:** WebMCP annotations `untrustedContentHint`/`consequentialHint` and MCP Apps' CSP/sandbox show the field is formalising trust for model-generated UI. `@cascivo/render` `validate` is a closed-catalog validator; confirm it rejects `href: javascript:`/`dangerouslySetInnerHTML`-like props and URL props **[I, not verified in code]**.
- **Voice:** AI Elements has 6 voice components; cascivo has a `voice` recipe (worker + route, `packages/cli/recipes/voice`) but no components **[V]**.

---

## 7. Gap table (ranked)

| # | Gap | Who does it well | cascivo today | Impact | Effort |
|---|---|---|---|---|---|
| 1 | **MCP Apps wrapper + host-theme bridge** (serve a `ViewConfig`/block as `ui://` so cascivo renders inside Claude/ChatGPT/VS Code, themed from host CSS vars) | json-render `@json-render/mcp`; `mcpcn`; spec itself | None (`render`, `text` exist; no `ui://`) | High: only path to reach Claude/ChatGPT end users; CSS-var tokens are a unique fit | M |
| 2 | **Streaming / partial ViewConfig rendering** + flat id-based wire format | A2UI (flat list, partial JSON repair), json-render SpecStream, OpenUI Lang | Deferred (`ROADMAP-V40.md:71`); nested `children` | High: all runtimes headline it; MCP Apps sends `tool-input-partial` | M |
| 3 | **Prompt input (attachments, mentions, model picker) + message scroller + streaming-safe markdown renderer** | shadcn AI Elements (Oct 2026), Vercel Streamdown/AI Elements, assistant-ui | `AiChat` has plain textarea + pin-scroll; `StreamingText` plain text; `Prose` trusted HTML only | High: without these `AiChat` is a demo; AI Elements is being retired -> slot opens | M each (3 items) |
| 4 | **Agent task surfaces: Plan, Task, Queue, Trace, Checkpoint, Subagent, Confirmation, Questionnaire** (HITL) | shadcn AI Elements + Questionnaire + HITL helpers; AI SDK 6 `needsApproval`; AG-UI interrupts | `ToolCall` (approval state + actions), `ChainOfThought`, `Steps`, `Timeline`, `AiStatus`; no Plan/Queue/Confirmation/Questionnaire | Medium-High | M |
| 5 | **A2UI v1.0 + json-render catalogs/adapters** generated from manifests | A2UI JSON-Schema catalogs with `instructions`; json-render `defineCatalog` | None | Medium-High (interop, "first-class catalog" claim) | M (A2UI), S-M (json-render) |
| 6 | **Published design-system-adherence eval** (+ multi-turn edit scenarios, visual loop) | Nobody (ACM study partial; EvoGenUI-Bench generic) | `audit --ai` exists, unmeasured | High: turns the main claim into a number; uncontested | M |
| 7 | **WebMCP-ready forms**: pass-through `toolname`/`tooldescription`/`toolautosubmit`, `:tool-form-active`/`:tool-submit-active` styles, `useWebMcpTool` hook, machine-mode as "read" tool | Chrome (spec+docs); no DS yet | Zero references; machine mode exists | Medium now (origin trial), High if standard lands; cheap, differentiating | S-M |
| 8 | **MCP server maturity**: serve skills (`skill://`, SEP-2640 Final), resources (tokens, per-component docs), prompts, tool annotations/`outputSchema`, elicitation | AI SDK 6 `@ai-sdk/mcp`; MCP spec 2026-07-28 | Tools only | Medium | S-M |
| 9 | **Builder/design-tool ingestion proof**: Claude Design import, Figma Make kit, Code Connect generation, shadcn directory | Figma (Code Connect), Claude Design | Projection exists; unverified | Medium (distribution) | S (test) / M (Code Connect) |
| 10 | **Entry-file diet and per-theme DESIGN.md / CLI manifest** | Astryx `manifest --json`; Atlassian/Indeed numbers | llms.txt 80 KB; DESIGN.md single theme | Medium (cheap) | S |
| 11 | Schema->form (JSON Schema/elicitation form) renderer | MCP elicitation form mode; A2UI forms | Form components exist; no schema-driven | Medium | M |
| 12 | Voice components (speech input, transcription, audio player, persona) | Vercel AI Elements | Recipe only | Low-Medium | M |
| 13 | On-device (Prompt API) recipe | Chrome blog + AI SDK `DirectChatTransport` | None | Low | S |
| 14 | Code Block with diff / file-tree-of-changes / test results / stack trace (agent coding UIs) | shadcn Code Block + Trace; AI Elements | `code-snippet`, `terminal`, `tree-view`, `log-viewer`; no diff | Low-Medium (matters if targeting coding agents) | M |

---

## 8. Recommended sequence (my inference)

1. **Now (S):** WebMCP CSS (`:tool-form-active`) + attribute pass-through test; llms.txt trim; per-theme DESIGN.md; MCP skills-over-MCP + resources; verify Claude Design / shadcn directory.
2. **Next (M):** Streaming ViewConfig + flat wire; MCP Apps wrapper with host-theme bridge (these two compound); Prompt Input + streaming markdown; the eval harness and published numbers (reuse workbench `/index.json`).
3. **Later (M-L):** A2UI v1.0 catalog + adapter after A2UI leaves RC; agent-task patterns (Plan/Queue/Confirmation/Questionnaire); Code Connect generation.

Do **not** chase: NLWeb; Tambo (Cloud sunsets 2026-10-31); full Vercel AI Elements parity (49 components, deprecated end of Nov 2026).

---

## 9. Verification log / caveats
- WebFetch of ACM page and web.dev article failed (403/404); those two items rest on search snippets/secondary articles.
- WebMCP name (`document.modelContext` vs `navigator.modelContext`) differs across sources; the spec snapshot I fetched defines only `document.modelContext`.
- Claude artifacts/"Imagine with Claude": not researched successfully; no claim made.
- Star counts and download numbers are as shown on fetched GitHub pages on 2026-10-17.
- Repo claims were checked by `ls`/`grep` on `/home/user/cascivo` at HEAD d0f3e44f (2026-10-16).
