// Single source of truth for `/docs/categories/<category>` page copy + head.
// Consumed by CategoryPage.tsx (on-page intro), seo.ts (runtime head), and
// vite.config.ts (build-time prerender) — kept import-free (no registry/
// document) so the Vite config can import it safely, mirroring
// marketing/route-head.ts and component-head.ts.

export type Category =
  | 'inputs'
  | 'display'
  | 'overlay'
  | 'navigation'
  | 'feedback'
  | 'layout'
  | 'chart'

export const CATEGORY_ORDER: Category[] = [
  'inputs',
  'display',
  'overlay',
  'navigation',
  'feedback',
  'layout',
  'chart',
]

export const CATEGORY_LABELS: Record<Category, string> = {
  inputs: 'Inputs',
  display: 'Display',
  overlay: 'Overlay',
  navigation: 'Navigation',
  feedback: 'Feedback',
  layout: 'Layout',
  chart: 'Chart',
}

/**
 * Short, factual intro per category — grounded in claims already made
 * elsewhere in the docs (platform.tsx for overlay/native-primitives, the
 * charts route-head for CVD-safe/zero-deps), not new copy.
 */
export const CATEGORY_INTRO: Record<Category, string> = {
  inputs:
    'Form and interaction controls — buttons, selects, sliders, date pickers, and more. Each ships owned CSS, signal-driven state, and WCAG 2.2 AA keyboard support out of the box.',
  display:
    'Components for presenting content — cards, badges, avatars, typography, and structured lists. Modern CSS (@container, :has()) does the layout work, not JavaScript.',
  overlay:
    'Components that float above the page — modals, dropdowns, tooltips, toasts, and popovers. Built on native browser primitives (the Popover API, <dialog>, CSS anchor positioning), not wrapped third-party libraries.',
  navigation:
    'Components for moving through an app — tabs, breadcrumbs, side navs, command menus, and pagination. Keyboard-first by default, with ARIA patterns matched to the WAI-ARIA APG.',
  feedback:
    'Components that communicate state — spinners, progress indicators, and status signals. Minimal, signal-driven, and CSS-first.',
  layout:
    'Layout primitives — grids, stacks, app shells, and page structure built on CSS logical properties and container queries, so they adapt to their container, not just the viewport.',
  chart:
    'Chart types built from scratch — line, bar, pie, scatter, heatmap, and more, with CVD-safe palettes and keyboard-navigable tooltips. Zero runtime dependencies.',
}

export function isCategory(value: string): value is Category {
  return (CATEGORY_ORDER as string[]).includes(value)
}

/** Kept under 60 chars for every category so it won't truncate in SERPs. */
export function categoryTitle(category: Category, count: number): string {
  return `${CATEGORY_LABELS[category]} — ${count} React components — cascivo`
}

export function categoryDescription(category: Category, count: number): string {
  return `${count} ${CATEGORY_LABELS[category].toLowerCase()} components in cascivo. ${CATEGORY_INTRO[category]}`
}
