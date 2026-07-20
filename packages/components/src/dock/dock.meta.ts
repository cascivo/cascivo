import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Dock',
  description: 'Fixed bottom navigation bar for mobile app shells with up to 5 items',
  category: 'navigation',
  states: ['default', 'active'],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'ariaLabel',
      type: 'string',
      required: false,
      description:
        'Accessible label for the dock navigation; defaults to the built-in i18n string.',
    },
    {
      name: 'items',
      type: 'DockItem[]',
      required: true,
      description: 'Navigation items, each with a label, icon, and optional href or onClick',
    },
    {
      name: 'activeIndex',
      type: 'number',
      required: false,
      description: 'Index of the currently active item (0-based)',
    },
    {
      name: 'className',
      description: 'Additional CSS class names merged onto the root element.',
      type: 'string',
      required: false,
    },
  ],
  tokens: [
    '--cascivo-color-surface',
    '--cascivo-color-accent',
    '--cascivo-color-text-muted',
    '--cascivo-border-subtle',
    '--cascivo-ring-width',
    '--cascivo-ring-color',
    '--cascivo-ease-out',
    '--cascivo-target-min-coarse',
    '--cascivo-z-dock',
  ],
  accessibility: {
    role: 'navigation',
    wcag: '2.2-AA',
    keyboard: ['Tab', 'Enter'],
  },
  examples: [
    {
      title: 'Basic mobile dock',
      description: 'Fixed bottom navigation for a mobile app shell',
      code: `<Dock
  activeIndex={0}
  items={[
    { label: 'Home', icon: '🏠', onClick: () => navigate('/') },
    { label: 'Search', icon: '🔍', onClick: () => navigate('/search') },
    { label: 'Profile', icon: '👤', onClick: () => navigate('/profile') },
  ]}
/>`,
    },
    {
      title: 'With hrefs',
      description: 'Link-based dock items for standard navigation',
      code: `<Dock
  activeIndex={1}
  items={[
    { label: 'Feed', icon: '📰', href: '/feed' },
    { label: 'Explore', icon: '🌐', href: '/explore' },
    { label: 'Notifications', icon: '🔔', href: '/notifications' },
    { label: 'Profile', icon: '👤', href: '/profile' },
  ]}
/>`,
    },
  ],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  tags: ['dock', 'tab-bar', 'bottom-nav', 'mobile', 'navigation', 'app-shell'],
  intent: {
    whenToUse: [
      'Mobile app-shell navigation with 3–5 top-level destinations',
      'When the primary navigation must be thumb-reachable on small screens',
    ],
    whenNotToUse: [
      'Desktop navigation — the dock hides at the lg breakpoint (64rem)',
      'More than 5 items — labels become unreadable and tap targets too small',
      'Secondary or contextual navigation — use Tabs or SideNav instead',
    ],
    antiPatterns: [
      {
        bad: 'Putting more than 5 items in the Dock',
        good: 'Use an overflow menu or drawer for additional destinations',
        why: 'Tap targets become too small and labels collide on narrow screens',
      },
    ],
    related: [
      {
        name: 'SideNav',
        relationship: 'alternative',
        reason: 'SideNav is the desktop equivalent for primary navigation',
      },
      {
        name: 'Tabs',
        relationship: 'alternative',
        reason: 'Tabs are for in-page section switching, not app-level navigation',
      },
    ],
    a11yRationale:
      'Wrapped in <nav> with aria-label; active item carries aria-current="page"; renders as <a> for href items and <button> for onClick items to preserve native semantics',
    flexibility: [
      {
        area: 'item element',
        level: 'flexible',
        note: 'Renders <a> when href is provided, <button> otherwise — no wrapper needed',
      },
      {
        area: 'visibility',
        level: 'strict',
        note: 'Hidden at 64rem (lg) via display:none — not configurable to preserve mobile-only intent',
      },
    ],
  },
}
