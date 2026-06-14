import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'NavigationMenu',
  description: 'Site navigation bar with links and dropdown flyout panels',
  category: 'navigation',
  states: ['closed', 'open'],
  variants: [],
  sizes: [],
  props: [
    { name: 'items', type: 'NavigationMenuItem[]', required: true },
    { name: 'aria-label', type: 'string', required: false },
    { name: 'orientation', type: "'horizontal' | 'vertical' | 'both'", required: false },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: [
    '--cascivo-color-surface',
    '--cascivo-color-bg-subtle',
    '--cascivo-color-text',
    '--cascivo-color-border',
    '--cascivo-focus-ring',
    '--cascivo-motion-enter',
    '--cascivo-motion-exit',
  ],
  accessibility: {
    role: 'navigation',
    wcag: '2.2-AA',
    keyboard: ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', 'Escape'],
    apgPattern: 'disclosure',
    reducedMotion: true,
    forcedColors: true,
  },
  examples: [
    {
      title: 'Basic',
      code: '<NavigationMenu aria-label="Main" items={[{ id: "home", label: "Home", href: "/" }, { id: "products", label: "Products", content: <ul>…</ul> }]} />',
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['navigation', 'menu', 'flyout', 'site-nav'],
  intent: {
    whenToUse: [
      'Primary site navigation where some destinations are plain links and others reveal a flyout of grouped links',
      'A header nav bar that mixes direct links with rich dropdown panels',
    ],
    whenNotToUse: [
      'Application commands and actions grouped under File/Edit/View — use Menubar',
      'A single trigger opening a list of actions — use a Menu/Dropdown',
      'Switching between peer content panels in place — use Tabs',
    ],
    antiPatterns: [
      {
        bad: 'Putting action commands (Save, Delete) inside NavigationMenu flyouts',
        good: '<Menubar> or <Menu> for commands; NavigationMenu is for destinations',
        why: 'navigation landmark implies moving between destinations, not invoking actions',
      },
    ],
    related: [
      {
        name: 'Menubar',
        relationship: 'alternative',
        reason: 'Menubar invokes application commands; NavigationMenu navigates to destinations',
      },
      {
        name: 'Tabs',
        relationship: 'alternative',
        reason: 'Tabs swap in-page panels; NavigationMenu links to other destinations',
      },
    ],
    a11yRationale:
      'Wrapped in a navigation landmark with a roving-tabindex row of links and disclosure triggers; triggers expose aria-expanded/aria-controls onto a flyout panel, and outside-pointer or Escape dismisses the open panel and restores trigger focus',
    flexibility: [
      {
        area: 'orientation',
        level: 'flexible',
        note: 'horizontal (default) or vertical roving navigation',
      },
      {
        area: 'panel content',
        level: 'flexible',
        note: 'content is arbitrary ReactNode; links without content render as plain anchors',
      },
    ],
  },
}
