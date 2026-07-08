import type { BlogPost } from '../types'

export const post: BlogPost = {
  slug: 'cascivo-vs-ibm-carbon',
  title: 'cascivo vs IBM Carbon: same enterprise bar, different architecture',
  description:
    'IBM Carbon is a mature, genuinely accessible enterprise design system — it sets a real bar. cascivo tries to clear the same bar with a different architecture: copy-in ownership and native CSS instead of an npm dependency and SCSS.',
  datePublished: '2026-07-07',
  tags: ['carbon', 'comparison', 'architecture'],
  blocks: [
    {
      type: 'p',
      text: 'IBM Carbon is a real, mature enterprise design system — not a strawman. It’s used across IBM’s own products, it takes accessibility seriously, and it covers a lot of ground: data-dense tables, complex forms, the full enterprise-application surface. Any comparison that doesn’t start from "this is a genuinely solid system" isn’t being honest about what it’s up against.',
    },
    {
      type: 'p',
      text: 'Where cascivo and Carbon actually differ isn’t component coverage — it’s the architecture underneath. Component-by-component coverage against Carbon is tracked and published on the parity page, generated from the real @cascivo/react exports rather than eyeballed, so that number moves with the codebase instead of going stale on this page.',
    },
    { type: 'h2', text: 'npm dependency vs. copy-in ownership' },
    {
      type: 'p',
      text: 'Carbon ships as @carbon/react, an npm package you install and upgrade like any other dependency — new major version, new changelog to read, potential breaking changes to absorb on your schedule or theirs. cascivo’s components are copied into your repository at add time; there’s no version of @cascivo/react to bump because the code is already yours. That’s a real trade in both directions: Carbon’s model means a security fix or a new feature reaches every consumer through one upgrade; cascivo’s means you never get a surprise breaking change, but you also don’t get upstream fixes for free — you own the maintenance for what you’ve copied in.',
    },
    { type: 'h2', text: 'SCSS vs. CSS custom properties' },
    {
      type: 'p',
      text: 'Carbon’s styling runs on Sass — components import index.scss, which pulls in Carbon’s styles via @use \'@carbon/react\'. That’s a build-time dependency: a Sass compiler in your toolchain, and theming that happens through Sass variables resolved before the CSS ever reaches the browser. cascivo’s tokens are plain CSS custom properties, resolved by the browser at runtime — no Sass compiler required, and a theme switch (data-theme="dark") is an attribute change, not a rebuild.',
    },
    {
      type: 'p',
      text: 'Neither approach is wrong. Sass gives you compile-time computation CSS custom properties don’t have natively. Runtime custom properties give you a theme switch with zero JavaScript and zero rebuild. Which one matters more depends on whether your theming needs to change at runtime (multi-tenant, user-selectable) or is fixed at build time.',
    },
    { type: 'h2', text: 'What to actually check before deciding' },
    {
      type: 'ul',
      items: [
        'Component coverage — tracked live, component by component, not a rounded-off percentage.',
        'Bundle size and render performance — benchmarked with the same methodology across cascivo, shadcn/ui, and Carbon, with the harness itself documented.',
        'Accessibility — both systems take WCAG seriously; check the current axe-violation counts rather than taking either vendor’s word for it.',
      ],
    },
    {
      type: 'callout',
      text: 'If your team already has Sass in its toolchain and is happy with npm-dependency upgrades, that’s a legitimate reason to stay on Carbon — the architecture trade only matters if the direction it points actually bothers you.',
    },
    {
      type: 'links',
      items: [
        { text: 'Live component-by-component coverage vs Carbon', href: '/docs/parity' },
        { text: 'Bundle size and render benchmarks', href: '/performance' },
        { text: 'Full benchmark methodology', href: '/docs/benchmarks' },
      ],
    },
  ],
}
