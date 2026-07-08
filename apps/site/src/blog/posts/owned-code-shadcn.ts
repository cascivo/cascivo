import type { BlogPost } from '../types'

export const post: BlogPost = {
  slug: 'owned-code-shadcn',
  title: 'Owned-code components: what shadcn got right, and where we took it further',
  description:
    'shadcn/ui’s biggest idea wasn’t a component set — it was making you own the code instead of depending on it. cascivo keeps that idea and builds the rest of what you’d otherwise have to hand-roll on top of it.',
  datePublished: '2026-07-07',
  tags: ['shadcn', 'migration', 'architecture'],
  blocks: [
    {
      type: 'p',
      text: 'shadcn/ui’s real contribution to the React ecosystem wasn’t any individual component — it was refusing to be a dependency. Instead of npm install-ing a black box and waiting on a maintainer for the next breaking change, you copy the source into your repo. It’s your code from the first commit: no upgrade treadmill, no wrapper API to work around when it doesn’t do quite what you need.',
    },
    {
      type: 'p',
      text: 'That idea is worth keeping, and cascivo keeps it exactly — same copy-in model, same "you own it" starting point. What changes is everything cascivo builds on top of that starting point, because "you own the code" doesn’t automatically get you accessibility, theming, or a state model that scales, and most teams end up hand-rolling all three eventually anyway.',
    },
    { type: 'h2', text: 'What transfers for free' },
    {
      type: 'ul',
      items: [
        'The ownership model itself — copy source into your repo and edit it directly. No black-box dependency.',
        'Accessible primitives — roles, keyboard handling, and ARIA wired in, verified at WCAG 2.2 AA.',
        'Your app structure, routing, and data layer — cascivo is components, not a framework, so nothing around them moves.',
        'React itself — same JSX, same props-down model, same component boundaries.',
      ],
    },
    { type: 'h2', text: 'What actually changes' },
    {
      type: 'ul',
      items: [
        'useState / useEffect → signals (useSignal / useSignalEffect) — not just a naming swap; it changes what re-renders.',
        'Tailwind utility classes → CSS custom-property tokens + @layer.',
        'Ad-hoc or config-driven theming → a data-theme attribute and a set of first-party themes to start from.',
        'Hand-rolled accessibility → built-in WCAG 2.2 AA, verified in CI.',
        'No machine-readable context for agents → an MCP server, a manifest per component, and audit --ai.',
        'Hardcoded English strings → a built-in i18n catalog.',
      ],
    },
    {
      type: 'p',
      text: 'None of these are free — they’re the honest cost side of the trade. You rewrite local interactivity to signals as you touch each component, and you learn token names instead of memorizing utility classes. For a component you’ll maintain for years, that’s a one-time tax against a permanent floor of quality, not a recurring one.',
    },
    { type: 'h2', text: 'Migrating is incremental, not a rewrite' },
    {
      type: 'p',
      text: 'The path that actually works in practice: initialize once at the root, then add components one at a time and repoint imports as you go — shadcn and cascivo side by side in the same codebase during the transition, no big-bang cutover. Replace Tailwind utilities with token-based props as you touch each component, not all at once. The full step-by-step guide, including the live bundle-size and accessibility deltas measured between the two, has its own page.',
    },
    {
      type: 'callout',
      text: 'If you’re happy with shadcn/ui today and don’t need signals, a closed token system, or the AI layer, that’s a legitimate reason not to migrate — the ownership model you already have is the good part, and you already have it.',
    },
    {
      type: 'links',
      items: [
        { text: 'The full migration guide, with live deltas', href: '/guides/coming-from-shadcn' },
        {
          text: 'Technical migration reference — variant mapping, CSS setup',
          href: '/docs/migrating',
        },
        { text: 'Why signals change what re-renders', href: '/blog/signals-vs-usestate' },
        { text: 'Where cascivo is the wrong call', href: '/guides/when-not-to-use' },
      ],
    },
  ],
}
