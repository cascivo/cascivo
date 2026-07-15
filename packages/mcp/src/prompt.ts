// Generation prompt derived from the bound vocabulary (v40 T1).
//
// Composes the system prompt an LLM needs to emit valid `ViewConfig` JSON that
// is restricted to cascivo's real components, props, and enum values — the
// OpenUI "system prompt from the component library" anti-hallucination
// mechanism, applied to the format cascivo already ships and dogfoods
// (@cascivo/render). See docs/internal/ROADMAP-V40.md.

import { buildGrammar, formatGrammar } from './grammar.js'
import type { Registry } from './registry.js'

export interface GenerationPromptOptions {
  /** Scope the vocabulary to a subset of component names. Defaults to all. */
  components?: string[]
}

const SCHEMA_DOC = `A ViewConfig is a JSON object:

{
  "version": 1,
  "state": { "<key>": <string | number | boolean | null> },
  "view": {
    "regions": {
      "<regionName>": [ <ComponentNode>, ... ]
    }
  }
}

A ComponentNode is:

{
  "component": "<one of the registered component names below>",
  "props": { "<propName>": <value> },
  "bind": { "<propName>": "$data.<path>" | "$state.<key>" },
  "events": { "<eventPropName>": "$actions.<name>" | "$state.set.<key>" | "$state.toggle.<key>" },
  "children": <ComponentNode[] | string | { "$t": "<i18n.key>" }>
}

Rules:
- "component" MUST be one of the registered components listed below — never invent one.
- Only use props listed for that component; enum props MUST use one of the listed values.
- "state" (optional) declares view-local state — initial primitive values. Read a value with
  bind "$state.<key>"; write it with events "$state.set.<key>" (stores the emitted/DOM value) or
  "$state.toggle.<key>" (flips a boolean). Every "$state.*" ref MUST name a declared state key.
- "bind" values are host-data references ("$data.<path>") or state reads ("$state.<key>").
- "events" values are host-action references ("$actions.<name>") or state writers ("$state.set.<key>" / "$state.toggle.<key>").
- "children" is an array of nodes, a plain string, or an i18n ref { "$t": "key" }.
- Output ONLY the JSON ViewConfig — no prose, no markdown fences.`

/**
 * Build the bound-vocabulary system prompt for emitting `ViewConfig` JSON.
 * Parameterizable by an optional component subset (defaults to the full
 * registry).
 */
export function buildGenerationPrompt(
  registry: Registry,
  options: GenerationPromptOptions = {},
): string {
  const grammar = buildGrammar(registry, options.components)
  const vocabulary = formatGrammar(grammar)

  const sections = [
    'You generate UI as a cascivo ViewConfig — a JSON description rendered by @cascivo/render <CascadeView />.',
    SCHEMA_DOC,
    'Registered components (allowed vocabulary — `name*` marks a required prop):',
    vocabulary,
    // EXTENSION POINT (v40 T3, optional): when the `cvl` compact DSL ships, append a
    // "cvl syntax" section here so an agent can be asked to emit cvl instead of JSON.
  ]

  return sections.join('\n\n')
}
