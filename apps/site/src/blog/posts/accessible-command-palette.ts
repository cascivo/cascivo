import type { BlogPost } from '../types'

export const post: BlogPost = {
  slug: 'accessible-command-palette',
  title: 'Building an accessible command palette in React',
  description:
    'A Cmd/Ctrl+K command palette looks simple until you get to focus trapping, screen-reader announcements, and keyboard navigation. Here’s what actually has to be right, and a working example.',
  datePublished: '2026-07-07',
  tags: ['tutorial', 'accessibility', 'components'],
  blocks: [
    {
      type: 'p',
      text: 'A command palette is deceptively small in scope — a text input and a filtered list — and deceptively large in what has to be correct for it to actually be accessible. Here’s the full list of what a Cmd/Ctrl+K palette needs to get right, and a working example that does.',
    },
    { type: 'h2', text: 'What "accessible" means here, specifically' },
    {
      type: 'ul',
      items: [
        'The search input needs role="combobox" with aria-controls, aria-expanded, and aria-autocomplete="list" — so a screen reader announces the relationship between the input and the list it controls.',
        'Arrow-key navigation through results has to move a virtual "active" state via aria-activedescendant, without moving real DOM focus off the input — so the user keeps typing while navigating.',
        'The palette needs real focus trapping — Tab shouldn’t escape into the page behind it — which a native <dialog> element gives you for free, without hand-rolled focus-trap logic.',
        'Loading and empty states need role="status" so a screen reader announces "no results" or "loading" without the user having to go looking for it.',
        'Escape closes it. Enter runs the highlighted item. Every one of these is a keyboard-only user’s entire interaction model — there’s no mouse fallback for any of them.',
      ],
    },
    {
      type: 'p',
      text: 'None of this is exotic — it’s the WAI-ARIA combobox pattern applied to a modal instead of a form field. But it’s a lot of small, easy-to-skip details, and skipping any one of them is invisible if you only test with a mouse.',
    },
    { type: 'h2', text: 'A working example' },
    {
      type: 'code',
      lang: 'tsx',
      code: `<CommandMenu
  open={open}
  onOpenChange={setOpen}
  groups={[
    {
      heading: 'Actions',
      items: [
        { id: 'new', label: 'New file', shortcut: ['⌘', 'N'], onSelect: createFile },
        { id: 'search', label: 'Search docs', keywords: ['find'], onSelect: openSearch },
      ],
    },
  ]}
/>`,
    },
    {
      type: 'p',
      text: 'That’s the whole surface: a list of grouped items, each doing exactly one of two things — running an onSelect callback, or (for multi-step palettes) opening a nested page of further commands. Every item should do exactly one of those, never both and never neither; a "New file" item that both runs an action and drills into a sub-page has no consistent Enter behavior for a screen-reader user to predict.',
    },
    { type: 'h2', text: 'Two mistakes worth calling out' },
    {
      type: 'ul',
      items: [
        'Using a command palette as a form field to capture a selected value. It isn’t one — it’s a modal action dispatcher with no controlled value. If you need the user to pick something for a form, that’s a combobox with a value prop, a different component with a different contract.',
        'Building keyboard shortcuts (Cmd/Ctrl+K to open) as a completely separate system from the palette’s own internal keyboard handling (arrows, Enter, Escape). They need to share focus state, or Escape from the palette and the global hotkey listener end up fighting over what "closed" means.',
      ],
    },
    {
      type: 'callout',
      text: 'The fastest way to find out if any of this actually works: close your mouse and drive the whole flow — open, type, arrow down three results, Enter — from the keyboard alone. Every gap shows up immediately.',
    },
    {
      type: 'links',
      items: [
        {
          text: 'How to build this accessibly, keyboard patterns and common mistakes',
          href: '/accessibility/command-menu',
        },
        { text: 'Full component reference', href: '/docs/components/command-menu' },
        { text: 'The accessibility layer overview', href: '/accessibility' },
      ],
    },
  ],
}
