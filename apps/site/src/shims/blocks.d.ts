// Loose shims for the block subpath imports (vite aliases @cascivo/blocks/* to
// component source for the build). The marketing pages only read each block's
// `meta`; the component itself is loaded via dynamic import. Shimming here keeps
// tsc from typechecking component source (same pattern as the per-component shims).
declare module '@cascivo/blocks/*/component' {
  import type { VNode } from 'preact'
  // Every block is a prop-less page composition — verified against all twelve sources,
  // each of which is `export function <Name>()`. Declared with no parameter rather than a
  // `Record<string, unknown>` bag: passing a prop is then a compile error, and a nullary
  // function still satisfies Preact's `ComponentType` for the `lazy()` call sites.
  type BlockComponent = () => VNode
  // Each block module exports exactly one of these named components; declared
  // loosely here so the dynamic `import().then(m => m.<Name>)` calls typecheck.
  export const AppShell: BlockComponent
  export const AuthLogin: BlockComponent
  export const AuthSignup: BlockComponent
  export const DashboardOverview: BlockComponent
  export const DashboardTable: BlockComponent
  export const Faq: BlockComponent
  export const MarketingFeatures: BlockComponent
  export const MarketingHero: BlockComponent
  export const Pricing: BlockComponent
  export const SettingsProfile: BlockComponent
  export const SiteFooter: BlockComponent
  export const Testimonials: BlockComponent
}

declare module '@cascivo/blocks/*' {
  import type { BlockMeta } from '@cascivo/components/blocks/types'
  export const meta: BlockMeta
}
