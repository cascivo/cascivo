# Project Blueprints: Next-Gen Autonomous UI Library (Carbon-Shadcn Fusion)

This repository houses the architecture, automation engine, and core implementation for a highly innovative React component library. The library bridges the gap between enterprise-grade operational UX and a lean, high-performance, developer-first footprint.

---

## 🎯 Project Core Thesis

Current industry standards (such as `shadcn/ui`) suffer from significant maintenance overhead (copy-paste sync debt), severe template styling fatigue, hidden accessibility compliance failures, and resource-heavy React Virtual DOM re-render cycles.

This project introduces a new paradigm built on four primary pillars:
1. **The Blueprint:** Replicating the structural, data-dense layouts and 2x grid constraints of IBM's **Carbon Design System**.
2. **The Architecture:** Adopting a zero-dependency, copy-paste or AST-merging code ownership pattern (inspired by **shadcn/ui**).
3. **The Styling Layer:** Dropping Tailwind CSS entirely in favor of **Super Modern, Pure Web Standards CSS** (CSS Modules, `@layer`, `@container`, `:has()`).
4. **The Interactivity Engine:** Replacing resource-heavy React state hooks (`useState`, `useContext`) with a **Fine-Grained Reactive External State Engine** (Signals/Atomic stores) for $0\text{ms}$ micro-interaction rendering overhead.

---

## 🏗️ Architectural Core Pillars

### 1. Modern CSS Over Tailwind
To combat utility class bloat and build-tool dependency decay, all components leverage native platform style capabilities:
* **Container Queries (`@container`):** Allowing components to morph responsively based on where they are dropped, not the browser window size.
* **Structural Selectors (`:has()`, `:is()`, `:where()`):** Moving visual state logic completely out of JS memory and directly into browser layout engine matching.
* **Native Popover & Dialog APIs:** Bypassing heavy JavaScript positioning layers for overlays.

### 2. Fine-Grained Reactive Interactivity
Standard libraries re-render entire components and child trees on micro-interactions (e.g., typing in a combobox, opening a sidebar). This library utilizes an external signal-driven pattern:
* Interactive primitives hook into atomic, transient state tracking.
* State modifications update precise DOM nodes directly without triggering a global React Virtual DOM reconciliation cycle.
* Fully compatible with React Server Components (RSC) by decoupling layout structures (Server) from event handlers and triggers (`"use client"` execution blocks).

---

## 🤖 The "Dark Factory" Autonomous Pipeline

To accelerate development and reliably copy the immense component library map of Carbon UI, the repository utilizes an unattended, autonomous self-healing software pipeline (the "Dark Factory" pattern) driven by **Claude Code headless execution** and orchestration runners.

### Automated Generation Loop

┌────────────────────────────────────────────────────────┐
│                                                        │
│   1. Input Specs (Carbon Design Tokens / Manifest)     │
│                       │                                │
│                       ▼                                │
│   2. Generation Engine (Headless Claude Code Agent)    │
│                       │                                │
│                       ▼                                │
│   3. Quality Assurance (Linter -> Type-check -> Test) │
│                       │                                │
│       ┌───────────────┴───────────────┐                │
│       │ Test Passes                   │ Test Fails     │
│       ▼                               ▼                │
│   4. Ship / Stage Branch     5. Self-Healing Feedback  │
│                              (Pipe logs back to 2)     │
│                                                       │
└────────────────────────────────────────────────────────┘

### Automation Execution Script

This shell environment loop drives headless agents until all static analysis, accessible DOM behaviors, and baseline functional tests execute flawlessly:

```bash
#!/bin/bash
# scripts/factory-supervisor.sh

MAX_ATTEMPTS=5
ATTEMPT=1

echo "🤖 Industrial automation initialized: Fabricating components..."

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  # 1. Fire headless agent task
  claude -p "Analyze Carbon UI specs, implement the next target primitive with Modern CSS, and create accompanying Vitest suites." --dangerously-skip-permissions --max-turns 10
  
  # 2. Run industrial quality gates
  npm run lint && npm run test:run && npm run build
  
  if [ $? -eq 0 ]; then
    echo "✅ Component successfully validated on attempt $ATTEMPT!"
    exit 0
  else
    echo "❌ Defect caught on line inspection. Sending logs back for remediation..."
    ERROR_LOG=$(npm run test:run 2>&1)
    claude -p "The test run failed with the following traceback. Repair the codebase or test structure: $ERROR_LOG" --dangerously-skip-permissions
  fi
  ATTEMPT=$((ATTEMPT+1))
done

echo "⚠️ Production halted: Human architectural intervention required."
exit 1
```

## 🗺️ Initial Implementation Backlog

Carbon Target ComponentArchitectural Primitive LayerStyling MechanicsButton / Icon ButtonNative <button>CSS Nesting, @layer, State Pseudo-classesAccordion@radix-ui/react-accordionCSS Transitions, Custom Timing CurvesModal / DialogNative <dialog> / Popover APIBackdrop CSS Filters, Native Focus TrapData Grid / TableTanStack Table Headless CoreContainer Queries, Layered Zebra Stripes