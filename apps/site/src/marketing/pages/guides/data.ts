// Static content for the /guides page. Prose, steps, and code strings only —
// competitor numbers are never hardcoded here; they come from the live bench
// modules (perf-data.ts / accessibility/data.ts) at render time.

export const GUIDES_HERO = {
  eyebrow: 'Guides',
  title: 'From "looks good" to "shipping Monday."',
  sub: 'Switching from shadcn? Branding it for your team? Wondering if it even fits your project? Straight answers, real steps, every one ending in a next move.',
  ctas: [
    { label: 'Coming from shadcn →', href: '/guides/coming-from-shadcn' },
    { label: 'Make it yours →', href: '/guides/customization' },
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
      code: 'npx cascivo init',
    },
    {
      n: 2,
      title: 'Add the components you need',
      detail: 'Copies the source into your repo. It is your code now — add one or many at a time.',
      code: 'npx cascivo add button input dialog',
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
        'Apply data-theme to the root (or any subtree) and delete your bespoke theme CSS. Twelve themes ship; overrides are three lines (see Make it yours below).',
    },
    {
      n: 7,
      title: 'Audit what is left',
      detail:
        'Catches hardcoded color/spacing values, invented props on known components, and raw strings where i18n is expected — in your own codebase.',
      code: 'npx cascivo audit --ai ./src',
    },
  ] satisfies MigrationStep[],
  verdict:
    'shadcn nailed ownership: copy the code, keep it forever. cascivo keeps that and adds the parts you would otherwise build yourself — signal reactivity with no re-render tax, a closed three-tier token system, twelve themes, WCAG 2.2 AA, and a machine-readable layer your agent can actually build against. The honest cost: you rewrite local interactivity to signals and you learn the token names instead of memorizing utility classes. For a long-lived app, that is a one-time tax against a permanent floor of quality.',
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
      href: 'https://github.com/cascivo/cascivo/tree/main/skills/cascivo-create-theme',
    },
    {
      label: 'For agents',
      detail: 'Agents call the create_theme MCP tool to do the same headlessly.',
      href: 'https://github.com/cascivo/cascivo/tree/main/packages/mcp',
    },
    {
      label: 'Change behavior, not just color',
      detail: 'Go past tokens — the cascivo-extend skill walks editing a component you own.',
      href: 'https://github.com/cascivo/cascivo/tree/main/skills/cascivo-extend',
    },
  ] satisfies CustomizeEscalation[],
} as const

export interface Scenario {
  persona: string
  situation: string
  why: string
  receipt: { label: string; href: string }
}

export const SCENARIOS: Scenario[] = [
  {
    persona: "You're building UIs with an AI agent",
    situation: 'Your agent writes components and you need them correct, not just plausible.',
    why: 'Machine-readable manifests, an MCP server, and audit --ai keep generated code on-system — invented values and props become detectable errors.',
    receipt: { label: 'See the context layer', href: '/context' },
  },
  {
    persona: "You're shipping a multi-brand product",
    situation: 'One codebase, several brands or tenants, each with its own look.',
    why: 'data-theme scopes a full theme to any subtree; a semantic token override rebrands in a single line.',
    receipt: { label: 'Make it yours', href: '/guides/customization' },
  },
  {
    persona: 'Performance is a hard requirement',
    situation: 'Re-render storms and bundle bloat are non-negotiable for your app.',
    why: 'Fine-grained signals update only what changed — the bench shows the fewest re-renders across the field — and the bundle is the smallest of the three.',
    receipt: { label: 'See the performance data', href: '/performance' },
  },
  {
    persona: 'Accessibility is mandatory',
    situation: 'Government, enterprise, or regulated — WCAG is a contract, not a nicety.',
    why: 'WCAG 2.2 AA is built into every component and CI fails the build on a single axe violation.',
    receipt: { label: 'See the accessibility receipts', href: '/accessibility' },
  },
  {
    persona: 'You want to own your components, not rent them',
    situation: "You're done depending on UI you can't open up and edit.",
    why: 'Copy the source into your repo and change anything — no wrapper, no black box. It is your code from the first commit.',
    receipt: { label: 'Start with the quickstart', href: '/docs' },
  },
]

export interface FaqEntry {
  id: string
  q: string
  a: string
  next: { label: string; href: string }
}

export const FAQ: FaqEntry[] = [
  {
    id: 'license',
    q: 'Is cascivo free? What’s the license?',
    a: 'Yes — cascivo is open source under the MIT license. Use it in commercial and private projects with no fee and no attribution requirement.',
    next: { label: 'See the source on GitHub', href: 'https://github.com/cascivo/cascivo' },
  },
  {
    id: 'all-or-one',
    q: 'Do I have to adopt all of it, or can I add one component?',
    a: 'Add exactly what you need. Components are copied into your repo one at a time — there is no runtime, no provider, and nothing to buy into. Start with a single button if you like.',
    next: { label: 'Three-step quickstart', href: '/docs' },
  },
  {
    id: 'nextjs-rsc',
    q: 'Can I use it with Next.js and React Server Components?',
    a: 'Yes. Components are RSC-compatible and mark themselves "use client" only where they need interactivity. There is a Next.js App Router example you can copy from.',
    next: {
      label: 'See the example apps',
      href: 'https://github.com/cascivo/cascivo/tree/main/apps/examples',
    },
  },
  {
    id: 'tailwind',
    q: 'Do I need Tailwind?',
    a: 'No. Styling is modern platform CSS — @layer, custom properties, and container queries — driven by a three-tier token system. No utility classes, no build-time CSS framework.',
    next: { label: 'How theming works', href: '/guides/customization' },
  },
  {
    id: 'vs-shadcn',
    q: 'How is this different from shadcn/ui?',
    a: 'It shares the best idea — you own copied source — and adds signal reactivity, a closed token system, twelve themes, built-in WCAG 2.2 AA, and a machine-readable AI layer. The migration guide maps exactly what transfers and what changes.',
    next: { label: 'Coming from shadcn?', href: '/guides/coming-from-shadcn' },
  },
  {
    id: 'agent-correct',
    q: 'Will my AI agent generate correct cascivo code?',
    a: 'That is the point of the context layer. Every component ships a machine-readable manifest, an MCP server exposes them to agents, and audit --ai flags hardcoded values, invented props, and missing i18n in the output.',
    next: { label: 'See the context layer', href: '/context' },
  },
  {
    id: 'extend',
    q: 'How do I change a component’s behavior, not just its color?',
    a: 'Because you own the source, you edit it directly. The cascivo-extend skill walks the safe way to add behavior to a component you copied without breaking its accessibility contract.',
    next: {
      label: 'The extend skill',
      href: 'https://github.com/cascivo/cascivo/tree/main/skills/cascivo-extend',
    },
  },
  {
    id: 'browsers',
    q: 'What browsers are supported?',
    a: 'The last two versions of Chrome, Firefox, and Safari — cascivo relies on :has() and @container. Some CSS-native logic is a Chrome-leading pilot with static fallbacks everywhere else, so nothing breaks.',
    next: { label: 'See the honest boundaries', href: '/guides/when-not-to-use' },
  },
  {
    id: 'versioning',
    q: 'Packages are 0.x — what should I expect, and how do I stay in sync?',
    a: 'Each @cascivo/* package follows semver within 0.x (minor bumps can include breaking changes, patch bumps never do). The CLI copies component source from the same commit its release publishes packages from, so a clean `cascivo add` always matches an installed peer package. If you ever see a runtime error after adding a component, run `cascivo doctor --drift` — it compares your installed components and their required peer package versions against the registry and tells you exactly what to update.',
    next: { label: 'Installation & troubleshooting', href: '/docs/installation' },
  },
]

export const GUIDES_CTA = {
  title: 'Pick your next move.',
  sub: 'You have the path, the brand controls, the fit, and the answers. Now ship.',
  primary: { label: 'Browse components', href: '/docs' },
  secondary: { label: 'Read the why', href: '/why' },
  install: 'npx cascivo init',
} as const

export interface Boundary {
  limit: string
  framing: string
  receipt: { label: string; href: string }
}

export const BOUNDARIES: Boundary[] = [
  {
    limit: 'CSS @function / if() is Chrome-leading',
    framing:
      'It is progressive enhancement: Safari and Firefox render pixel-identically through static fallbacks, and a CI audit blocks any @function or if() that ships without one. The CSS-native path is a forward pilot, not a requirement — nothing breaks where it is not yet supported.',
    receipt: {
      label: 'functions.css + fallback audit',
      href: 'https://github.com/cascivo/cascivo/blob/main/packages/tokens/src/functions.css',
    },
  },
  {
    limit: 'The toolchain (vp / vite+) is alpha',
    framing:
      'An accepted, pinned risk for a greenfield system, tracked on every update. If you need a fully battle-tested build toolchain today, weigh that before adopting.',
    receipt: { label: 'vite+ (viteplus.dev)', href: 'https://viteplus.dev' },
  },
  {
    limit: 'React and Preact only',
    framing:
      "If you're on Vue, Svelte, or Angular, cascivo is not your library today — and we would rather say so than pretend otherwise.",
    receipt: {
      label: 'See the example apps',
      href: 'https://github.com/cascivo/cascivo/tree/main/apps/examples',
    },
  },
  {
    limit: 'Modern browsers only',
    framing:
      'cascivo relies on :has() and @container — the last two versions of Chrome, Firefox, and Safari. No IE, no deep legacy support.',
    receipt: {
      label: 'Browser targets',
      href: 'https://github.com/cascivo/cascivo/blob/main/CLAUDE.md',
    },
  },
]
