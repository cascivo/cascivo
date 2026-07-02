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
  "view": {
    "layout": "<optional layout name, e.g. dashboard | settings | auth>",
    "regions": {
      "<regionName>": [ <ComponentNode>, ... ]
    }
  }
}

A ComponentNode is:

{
  "component": "<one of the registered component names below>",
  "props": { "<propName>": <value> },
  "bind": { "<propName>": "$data.<path>" },
  "events": { "<eventPropName>": "$actions.<name>" },
  "children": <ComponentNode[] | string | { "$t": "<i18n.key>" }>
}

Rules:
- "component" MUST be one of the registered components listed below — never invent one.
- Only use props listed for that component; enum props MUST use one of the listed values.
- "bind" values are host-data references and MUST start with "$data.".
- "events" values are host-action references and MUST start with "$actions.".
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
