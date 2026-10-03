import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'ShareMenu',
  description:
    'A Share button opening intent links for Bluesky, Mastodon, Threads, LinkedIn and X, plus copy link and the system share sheet',
  category: 'overlay',
  // The panel is a native popover opened by `popovertarget` and every network is a plain
  // link, so sharing works before hydration. Copy link, the Mastodon server field and the
  // system share sheet need script and appear once it runs.
  clientJs: 'enhancement',
  states: ['closed', 'open', 'copied'],
  variants: [],
  sizes: ['sm', 'md'],
  props: [
    {
      name: 'url',
      type: 'string',
      required: true,
      description: 'The page being shared',
    },
    {
      name: 'text',
      type: 'string',
      required: false,
      description: 'Text to post alongside the link (LinkedIn takes none; it reads the page)',
    },
    {
      name: 'items',
      type: "Array<'bluesky' | 'mastodon' | 'threads' | 'linkedin' | 'x'>",
      required: false,
      default: "['bluesky', 'mastodon', 'threads', 'linkedin', 'x']",
      description: 'The networks offered, in order',
    },
    {
      name: 'size',
      description: "Visual size of the component (e.g. 'sm', 'md', 'lg').",
      type: "'sm' | 'md'",
      required: false,
      default: 'md',
    },
    {
      name: 'labels',
      type: '{ share?: string; copyLink?: string; copied?: string; more?: string; server?: string; shareOn?: (network: string) => string }',
      required: false,
      description: 'Overrides the built-in i18n labels per instance',
    },
    {
      name: 'className',
      type: 'string',
      required: false,
      description: 'Class added to the root element',
    },
  ],
  tokens: [
    '--cascivo-color-bg-subtle',
    '--cascivo-color-border',
    '--cascivo-color-success',
    '--cascivo-color-surface',
    '--cascivo-color-surface-overlay',
    '--cascivo-color-text',
    '--cascivo-color-text-muted',
    '--cascivo-control-height-md',
    '--cascivo-control-height-sm',
    '--cascivo-focus-ring',
    '--cascivo-font-medium',
    '--cascivo-font-sans',
    '--cascivo-motion-enter',
    '--cascivo-radius-control',
    '--cascivo-radius-item',
    '--cascivo-radius-overlay',
    '--cascivo-shadow-overlay',
    '--cascivo-space-1',
    '--cascivo-space-2',
    '--cascivo-space-3',
    '--cascivo-space-4',
    '--cascivo-target-min-coarse',
    '--cascivo-text-sm',
    '--cascivo-text-xs',
  ],
  accessibility: {
    role: 'button',
    wcag: '2.2-AA',
    keyboard: ['Enter', 'Space', 'Escape', 'Tab'],
    forcedColors: true,
    reducedMotion: true,
  },
  examples: [
    {
      title: 'Default',
      code: '<ShareMenu url="https://cascivo.com/blog/launch" text="cascivo 1.0 is out" />',
    },
    {
      title: 'Chosen networks',
      code: "<ShareMenu url={url} items={['bluesky', 'mastodon']} size=\"sm\" />",
      description: 'Offer only the networks your readers use, in your order',
    },
    {
      title: 'Just the link',
      code: "import { shareIntentUrl } from './share-menu'\n\n<a href={shareIntentUrl('bluesky', { url, text }) ?? undefined}>Post to Bluesky</a>",
      description:
        'shareIntentUrl builds the same compose link for your own markup; it returns null for Mastodon without a server',
    },
  ],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  tags: ['share', 'social', 'bluesky', 'mastodon', 'threads', 'linkedin', 'popover', 'link'],
  intent: {
    whenToUse: [
      'Letting readers share a page to a social network without any account, token or API on your side',
      'Article, release-note and product pages where sharing is a secondary action',
    ],
    whenNotToUse: [
      'Posting on the user’s behalf from your app — connect their account and use the publishers in @cascivo/app/social',
      'Copying a single value — use CopyButton',
    ],
    antiPatterns: [
      {
        bad: 'Loading each network’s share widget script to get a share button',
        good: 'Use ShareMenu, whose entries are plain links to each network’s composer',
        why: 'Intent links need no third-party script, set no tracking cookies, and work before hydration',
      },
    ],
    related: [
      {
        name: 'CopyButton',
        relationship: 'alternative',
        reason: 'Use when copying the link is the only sharing you need',
      },
      {
        name: 'MenuButton',
        relationship: 'alternative',
        reason: 'Use for a list of in-app actions rather than outbound links',
      },
    ],
    a11yRationale:
      'The trigger is a native <button popovertarget>, so the browser supplies aria-expanded, Escape and outside-click dismissal, and focus return without script. The panel is a labelled disclosure of ordinary links and buttons in Tab order rather than an ARIA menu, so no arrow-key contract is implied. Each link names its network in text ("Share on Bluesky"), and the copy confirmation is announced through a polite live region.',
    content: {
      tone: 'Short action labels naming the network',
      notes:
        'Network names are proper nouns and stay untranslated; the "Share on {network}" frame comes from the i18n catalog or labels.shareOn',
    },
    flexibility: [
      {
        area: 'networks',
        level: 'flexible',
        note: 'items picks and orders the networks; shareIntentUrl builds the same links for custom markup',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'Styling resolves to the listed semantic --cascivo-* tokens',
      },
    ],
  },
}
