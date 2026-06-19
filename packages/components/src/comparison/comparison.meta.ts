import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Comparison',
  description: 'Reveals the difference between two layers with a draggable divider',
  category: 'display',
  states: ['default'],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'after',
      type: 'ReactNode',
      required: true,
      description: 'Base layer shown underneath',
    },
    {
      name: 'before',
      type: 'ReactNode',
      required: true,
      description: 'Top layer revealed up to the divider',
    },
    {
      name: 'position',
      type: 'number',
      required: false,
      description: 'Divider position 0–100 (controlled)',
    },
    { name: 'defaultPosition', type: 'number', required: false, default: '50' },
    { name: 'onPositionChange', type: '(position: number) => void', required: false },
    {
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      required: false,
      default: 'horizontal',
    },
    { name: 'keyboardStep', type: 'number', required: false, default: '5' },
    { name: 'label', type: 'string', required: false },
  ],
  tokens: [
    '--cascivo-radius-md',
    '--cascivo-radius-full',
    '--cascivo-color-surface',
    '--cascivo-color-border',
    '--cascivo-color-focus-ring',
    '--cascivo-shadow-sm',
    '--cascivo-target-min-coarse',
  ],
  accessibility: {
    role: 'slider',
    wcag: '2.2-AA',
    keyboard: [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'PageUp',
      'PageDown',
    ],
    apgPattern: 'slider',
  },
  examples: [
    {
      title: 'Image before/after',
      code: '<Comparison before={<img src="/edited.jpg" alt="" />} after={<img src="/original.jpg" alt="Original" />} label="Reveal edited image" />',
    },
    {
      title: 'Vertical',
      code: '<Comparison orientation="vertical" before={<Before />} after={<After />} />',
    },
    {
      title: 'Controlled',
      code: '<Comparison position={position} onPositionChange={setPosition} before={<Before />} after={<After />} />',
    },
  ],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  tags: ['comparison', 'before-after', 'image', 'slider', 'display'],
  intent: {
    whenToUse: [
      'Showing the difference between two versions of similar content (before/after edits, original vs processed)',
      'Letting users interactively reveal one image or panel over another',
      'Side-by-side visual demos where a draggable divider is clearer than two static images',
    ],
    whenNotToUse: [
      'Comparing more than two items — use a layout or table instead',
      'Non-visual data comparison — use a table or chart',
      'Static side-by-side images with no need for an interactive reveal',
    ],
    antiPatterns: [
      {
        bad: '<Comparison before={<Before />} after={<After />} /> with no label',
        good: '<Comparison label="Reveal edited photo" before={<Before />} after={<After />} />',
        why: 'The divider is a slider; without a label assistive tech announces an unnamed control',
      },
    ],
    related: [
      {
        name: 'Slider',
        relationship: 'alternative',
        reason: 'Use Slider for selecting a numeric value rather than revealing layered content',
      },
      {
        name: 'Carousel',
        relationship: 'alternative',
        reason: 'Use Carousel to step through more than two pieces of content',
      },
    ],
    a11yRationale:
      'The divider is a role="slider" with aria-valuemin/max/now and full keyboard support (Arrow/Home/End/PageUp/PageDown); aria-orientation reflects the axis so the value and direction are conveyed without sight',
    flexibility: [
      {
        area: 'orientation',
        level: 'flexible',
        note: 'Horizontal or vertical depending on the content',
      },
      {
        area: 'label',
        level: 'strict',
        note: 'Provide a label (or rely on the i18n default) so the slider is named',
      },
    ],
  },
}
