The **context layer** for cascivo — the WHY that sits alongside the WHAT (manifests, tokens, MCP). It gives AI agents machine-readable intent, design boundaries, and a way to check their own output.

## What it exports

- **`context.json`** — intent, when-to-use / anti-patterns, component selection edges, design boundaries, specs, and authoring rules in one bundle.
- **`tokens.catalog.json`** — the closed-set token catalog: every `--cascivo-*` property with its layer and resolved default, so an agent picks an existing token instead of inventing a value.
- **`cascivo audit --ai`** integration — flags hard-coded values, invented props, and missing required wiring in generated code.

## Why a context layer

Manifests tell an agent _what_ a `Button` is and _which_ props it takes. The context layer tells it _when_ to reach for a `Button` versus a `Link`, _what not to do_, and _which token_ to use — then `cascivo audit --ai` verifies the result. Together they turn "generate some UI" into "select from closed sets and prove the output conforms."
