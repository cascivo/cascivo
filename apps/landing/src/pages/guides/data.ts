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

export interface CustomizeTier {
  name: string
  example: string
  note: string
}

export interface CustomizeSnippet {
  title: string
  lang: string
  code: string
  caption: string
}

export interface CustomizeEscalation {
  label: string
  detail: string
  href: string
}

export const CUSTOMIZE = {
  intro:
    'Branding cascivo is not a fork and not a config file — it is overriding CSS custom properties. The token system has three tiers, and you only ever touch the layer that matches how widely you want the change to apply.',
  tiers: [
    {
      name: 'Primitive',
      example: '--cascivo-blue-50: oklch(0.97 0.025 250)',
      note: 'The raw palette. Fixed values with no meaning attached — you rarely touch these directly.',
    },
    {
      name: 'Semantic',
      example: '--cascivo-color-accent-subtle: var(--cascivo-blue-50)',
      note: 'What a role means — accent, surface, text. Themes override this layer; so do you, to rebrand broadly.',
    },
    {
      name: 'Component',
      example: '--cascivo-button-radius: var(--cascivo-radius-control)',
      note: 'Per-component knobs. Override on one element or subtree to tune just that component.',
    },
  ] satisfies CustomizeTier[],
  snippets: [
    {
      title: 'Rebrand in one line',
      lang: 'css',
      code: "[data-theme='myco'] {\n  --cascivo-color-accent: oklch(0.7 0.18 35);\n}",
      caption:
        'Name a theme, override one semantic token, and apply it with data-theme="myco". Every accent-driven surface follows.',
    },
    {
      title: 'Brand just one component',
      lang: 'css',
      code: '.checkout-button {\n  --cascivo-color-primary: oklch(0.62 0.2 145);\n}',
      caption:
        "Scope a semantic token to a single element — the primary button's background, this button only. No new component, no fork.",
    },
    {
      title: 'Theme any subtree',
      lang: 'html',
      code: '<div data-theme="dark">\n  <!-- a dark sidebar inside an otherwise-light app -->\n</div>',
      caption:
        'data-theme applies to any element and cascades to its subtree — a dark sidebar in a light app, with no extra config.',
    },
  ] satisfies CustomizeSnippet[],
  escalation: [
    {
      label: 'Whole brand theme',
      detail: 'Generate a full token set from a brand color with the create-theme skill.',
      href: 'https://github.com/urbanisierung/cascivo/tree/main/skills/cascivo-create-theme',
    },
    {
      label: 'For agents',
      detail: 'Agents call the create_theme MCP tool to do the same headlessly.',
      href: 'https://github.com/urbanisierung/cascivo/tree/main/packages/mcp',
    },
    {
      label: 'Change behavior, not just color',
      detail: 'Go past tokens — the cascivo-extend skill walks editing a component you own.',
      href: 'https://github.com/urbanisierung/cascivo/tree/main/skills/cascivo-extend',
    },
  ] satisfies CustomizeEscalation[],
} as const
