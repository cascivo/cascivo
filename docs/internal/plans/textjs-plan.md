# textjs evaluation

## 1. Verdict: NO

- textjs targets a different medium (the browser DevTools console). cascivo is CSS-native DOM components; nothing in textjs's value (cell-buffer layout, `%c` span output) can reuse CSS, tokens or the component registry.
- Adopting its idea would add a second renderer plus a heavy runtime (Yoga, react-reconciler) that breaks our "core has no runtime dep beyond `@preact/signals-react`" rule and the signal-driven, no-`useEffect` authoring model.
- The adjacent needs are already covered: `Terminal`/`CodeSnippet`/`LogViewer` components, `@cascivo/text` (UI to Markdown for agents), `@cascivo/render` (JSON view config to components).

### What textjs is (from README/package.json/tree only; ARCHITECTURE.md and per-package APIs not read)

"A React framework for apps that render in the browser console." Bun/Node 22 toolchain, MIT, v0.1.0, monorepo (`@textjs/app` router + CLI, `react` reconciler, `core` cell buffer + Yoga layout + `%c` console driver, `font` FIGlet, `opencode` bridge, eslint plugin, devtools extension). Frames are run-length encoded into one `console.log`; unchanged frames log nothing. API surface seen: `Box` (className utilities), `Text`, `useInput`.

### Overlap with cascivo

| textjs | cascivo already |
| --- | --- |
| Terminal-like UI | `terminal`, `code-snippet`, `log-viewer` components |
| Agent-facing output | `@cascivo/text` machine mode, `@cascivo/render`, `@cascivo/mcp` |
| Flex layout engine | CSS flex/grid/container queries (native) |
| Keyboard input hook | `useRovingFocus`, `useTypeahead`, `command-menu` |

## 2. Plan

None. No implementation tasks are warranted.

### Revisit if

- Adopters ask for a console/TUI target. Then start with a design spike (separate package, own renderer, zero changes to component authoring rules), not a port; the original design must not borrow textjs code (MIT, but design should stay independent).
- Cheap alternative if the "AI-first" angle matters: extend `@cascivo/text` with an ANSI/plain-text output mode for terminals. Needs its own plan; out of scope here.
