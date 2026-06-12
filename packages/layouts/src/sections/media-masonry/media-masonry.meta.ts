import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'MediaMasonry',
  description:
    'Masonry gallery section — native CSS masonry where supported, multi-column fallback elsewhere (fallback orders tiles top-to-bottom per column). Tiles style themselves; section provides only the layout shell.',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: 'Tile elements (images, cards, quotes) — consumer-provided and self-styled',
    },
    {
      name: 'title',
      type: 'ReactNode',
      required: false,
      description: 'Section heading above the gallery',
    },
    {
      name: 'description',
      type: 'ReactNode',
      required: false,
      description: 'Subheading below the section title',
    },
    {
      name: 'headingLevel',
      type: '1 | 2 | 3',
      required: false,
      default: '2',
      description: 'HTML heading level for the section title',
    },
    {
      name: 'cols',
      type: 'number',
      required: false,
      default: '3',
      description: 'Number of masonry columns',
    },
    {
      name: 'gap',
      type: '1|2|3|4|5|6|8|10|12',
      required: false,
      default: '4',
      description: 'Gap between tiles (spacing token step)',
    },
  ],
  tokens: [
    '--cascade-text-2xl',
    '--cascade-text-base',
    '--cascade-font-bold',
    '--cascade-text-secondary',
    '--cascade-space-*',
  ],
  accessibility: { role: 'region', wcag: 'AA', keyboard: [] },
  examples: [
    {
      title: 'Media gallery',
      code: '<MediaMasonry title="Customer stories" cols={3} gap={4}><img src="/photo-1.jpg" alt="Team at desk" /><img src="/photo-2.jpg" alt="Product screenshot" /><img src="/photo-3.jpg" alt="Dashboard view" /></MediaMasonry>',
      description:
        'Masonry gallery with three image tiles; falls back to CSS columns in unsupported browsers',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['section', 'gallery', 'masonry'],
}
