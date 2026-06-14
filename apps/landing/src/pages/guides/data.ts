// Static content for the /guides page. Prose, steps, and code strings only —
// competitor numbers are never hardcoded here; they come from the live bench
// modules (perf-data.ts / accessibility/data.ts) at render time.

export const GUIDES_HERO = {
  eyebrow: 'Guides',
  title: 'From "looks good" to "shipping Monday."',
  sub: 'Switching from shadcn? Branding it for your team? Wondering if it even fits your project? Straight answers, real steps, every one ending in a next move.',
  ctas: [
    { label: 'Coming from shadcn →', href: '#migrate' },
    { label: 'Make it yours →', href: '#customize' },
  ],
} as const

export interface MigrationStep {
  n: number
  title: string
  detail: string
  code?: string
}

export const MIGRATION = {
  intro: "You already own your components — that part doesn't change.",
  transfers: [
    'The ownership model: you copy source into your repo and edit it directly. No upgrade hell, no black-box dependency — cascivo keeps shadcn’s best idea.',
    'Accessible primitives: components ship roles, keyboard handling, and ARIA wired in, verified at WCAG 2.2 AA.',
    'Your app structure, routing, and data layer: cascivo is components, not a framework, so nothing around them moves.',
    'React itself: same JSX, same props-down model, same component boundaries.',
  ],
  changes: [
    { from: 'useState / useEffect', to: 'signals (useSignal / useSignalEffect)' },
    { from: 'Tailwind utility classes', to: 'CSS custom-property tokens + @layer' },
    { from: 'Ad-hoc / config-driven theming', to: 'data-theme + 10 shipped themes' },
    { from: 'Hand-rolled accessibility', to: 'built-in WCAG 2.2 AA' },
    { from: 'No machine-readable context', to: 'MCP + component manifests + audit --ai' },
    { from: 'Hardcoded English strings', to: 'built-in i18n catalog' },
  ],
  steps: [
    {
      n: 1,
      title: 'Initialize',
      detail:
        'Installs core + tokens, writes cascivo.config.ts, and sets up the CSS @layer order — once, at the root.',
      code: 'npx @cascivo/cli init',
    },
    {
      n: 2,
      title: 'Add the components you need',
      detail: 'Copies the source into your repo. It is your code now — add one or many at a time.',
      code: 'npx @cascivo/cli add button input dialog',
    },
    {
      n: 3,
      title: 'Swap imports, component by component',
      detail:
        'Keep shadcn and cascivo side by side during the migration. Repoint one import, ship it, repeat — no big-bang rewrite.',
    },
    {
      n: 4,
      title: 'Replace Tailwind utilities with tokens',
      detail:
        'Swap utility classes for token-based component props and --cascivo-* custom properties. The closed token set means an agent (or you) can no longer invent an off-system value by accident.',
    },
    {
      n: 5,
      title: 'Convert interactivity to signals',
      detail:
        'As you touch each component, move local useState/useEffect to useSignal/useSignalEffect. Fine-grained updates, no dependency arrays.',
    },
    {
      n: 6,
      title: 'Point theming at data-theme',
      detail:
        'Apply data-theme to the root (or any subtree) and delete your bespoke theme CSS. Ten themes ship; overrides are three lines (see Make it yours below).',
    },
    {
      n: 7,
      title: 'Audit what is left',
      detail:
        'Catches hardcoded color/spacing values, invented props on known components, and raw strings where i18n is expected — in your own codebase.',
      code: 'npx @cascivo/cli audit --ai ./src',
    },
  ] satisfies MigrationStep[],
  verdict:
    'shadcn nailed ownership: copy the code, keep it forever. cascivo keeps that and adds the parts you would otherwise build yourself — signal reactivity with no re-render tax, a closed three-tier token system, ten themes, WCAG 2.2 AA, and a machine-readable layer your agent can actually build against. The honest cost: you rewrite local interactivity to signals and you learn the token names instead of memorizing utility classes. For a long-lived app, that is a one-time tax against a permanent floor of quality.',
} as const
