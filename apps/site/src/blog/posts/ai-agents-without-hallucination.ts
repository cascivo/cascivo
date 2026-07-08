import type { BlogPost } from '../types'

export const post: BlogPost = {
  slug: 'ai-agents-without-hallucination',
  title: 'Giving your AI coding agent a component library it can’t hallucinate',
  description:
    'AI agents write plausible-looking UI code that invents props, colors, and class names that don’t exist. cascivo ships a machine-readable manifest per component so agents can select, scaffold, and validate their own output instead of guessing.',
  datePublished: '2026-07-07',
  tags: ['ai', 'mcp', 'components'],
  blocks: [
    {
      type: 'p',
      text: 'Ask an AI coding agent to add a data table with sortable columns and a status badge, and it will write something that looks completely plausible: real-looking prop names, a colour that seems reasonable, a className that reads like it belongs. Sometimes it is right. Sometimes the prop doesn’t exist, the colour is a hard-coded hex value that ignores your theme, and the className was never defined anywhere in your codebase. The output compiles. It just isn’t true.',
    },
    {
      type: 'p',
      text: 'That’s the core problem with pointing an agent at most component libraries: the agent is pattern-matching against training data, not reading your actual API surface. cascivo’s answer is to give agents something to read that isn’t training data — a machine-readable manifest per component, kept in sync with the real source by construction.',
    },
    { type: 'h2', text: 'Every component ships its own ground truth' },
    {
      type: 'p',
      text: 'Every component in the registry carries a *.meta.ts file alongside its source — props, states, variants, sizes, design tokens, accessibility role, keyboard interactions, and WCAG level. Here’s an excerpt of Button’s, unedited:',
    },
    {
      type: 'code',
      lang: 'tsx',
      code: `export const meta: ComponentMeta = {
  name: 'Button',
  description: 'Triggers an action or event',
  category: 'inputs',
  states: ['idle', 'loading'],
  variants: ['primary', 'secondary', 'ghost', 'destructive'],
  sizes: ['sm', 'md', 'lg'],
  props: [
    {
      name: 'variant',
      description: 'Selects the visual style variant.',
      type: "'primary' | 'secondary' | 'ghost' | 'destructive'",
      required: false,
      default: 'primary',
    },
    // …
  ],
}`,
    },
    {
      type: 'p',
      text: 'This isn’t documentation that drifts from the code — it’s read by the registry generator, the docs site, and the MCP server. An agent asking "what variants does Button support" gets exactly this list, not a guess informed by every other component library it saw during training.',
    },
    { type: 'h2', text: 'Select, scaffold, validate' },
    {
      type: 'p',
      text: 'Connect the MCP server (npx @cascivo/mcp, or point an MCP-less client at llms.txt for the same data as plain text) and an agent gets three things most component-library integrations don’t offer:',
    },
    {
      type: 'ul',
      items: [
        'Select by constraint — ask for "tabular data, sortable, filterable, accessible" and get back the component that actually satisfies it, with its real prop surface, not a name pattern-matched from memory.',
        'Scaffold a whole view — describe a page and get a structured view config back, built from real components and real props.',
        'Validate its own output — run the generated view (or component usage) back against the same manifests and the closed token set, and get told specifically what’s wrong: an invented prop, a hard-coded colour that should have been a token, a required prop left off.',
      ],
    },
    {
      type: 'p',
      text: 'That last step is the one that actually closes the loop. Most "AI-aware" component libraries stop at generation: the agent writes code, and whether it’s correct is your problem to catch in review. cascivo’s validation step catches it before the code ever reaches you.',
    },
    { type: 'h2', text: 'The same check runs on code you wrote by hand, too' },
    {
      type: 'p',
      text: 'cascivo audit --ai isn’t MCP-specific — it’s a CLI command that scans any file for the same class of problem: hard-coded values that should be tokens, props that don’t exist on the component being called, and raw English strings where the i18n catalog expects a lookup key. Run it as a CI gate and it catches agent output (or a human’s 4pm shortcut) before either one ships:',
    },
    {
      type: 'code',
      lang: 'bash',
      code: `$ npx cascivo audit --ai src/
Dashboard.tsx:14  warn  hardcoded-value  #3b82f6 → var(--cascivo-color-accent)

0 errors, 1 warning`,
    },
    {
      type: 'callout',
      text: 'None of this requires trusting the agent. It requires giving the agent — and a CI job that doesn’t trust anyone — something concrete to check against.',
    },
    {
      type: 'p',
      text: 'If you’re pointing an agent at a UI library today, the manifest is the thing to look for: not "does it have good docs" but "does the agent have something structured to read that isn’t just your marketing copy." A closed token system and a validation step are what turn "looks right" into "is right."',
    },
    {
      type: 'links',
      items: [
        {
          text: 'See the full AI layer — MCP tools, llms.txt, and the audit command',
          href: '/docs/ai',
        },
        { text: 'Browse component manifests in the directory', href: '/docs' },
        { text: 'Read the AI layer overview', href: '/ai' },
      ],
    },
  ],
}
