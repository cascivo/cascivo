import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Carousel',
  description: 'Scroll-snap slide deck with previous/next controls and dot indicators',
  category: 'display',
  // All slides are in the server HTML and the track is a CSS scroll-snap container, so it
  // scrolls natively; JS adds the arrows and dots.
  clientJs: 'enhancement',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'labels',
      type: 'CarouselLabels',
      required: false,
      description: 'Overrides for the component’s user-visible strings (i18n).',
    },
    { name: 'children', type: 'ReactNode', required: false, description: 'Slides as children' },
    { name: 'slides', type: 'ReactNode[]', required: false, description: 'Slides as an array' },
    { name: 'index', type: 'number', required: false, description: 'Controlled active index' },
    {
      name: 'defaultIndex',
      description: 'The initial slide index when uncontrolled.',
      type: 'number',
      required: false,
      default: '0',
    },
    {
      name: 'onIndexChange',
      description: 'Called with the new slide index when it changes.',
      type: '(index: number) => void',
      required: false,
    },
    {
      name: 'loop',
      description: 'When true, navigation wraps around from end to start.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'autoplay',
      description:
        'Milliseconds between automatic advances. Omit or set 0 to leave rotation off. Pauses on hover, on focus within, while the tab is hidden and under prefers-reduced-motion, and always renders a play/pause control.',
      type: 'number',
      required: false,
    },
  ],
  tokens: [
    '--cascivo-color-accent',
    '--cascivo-color-surface',
    '--cascivo-color-border',
    '--cascivo-color-border-strong',
    '--cascivo-radius-md',
    '--cascivo-radius-full',
    '--cascivo-focus-ring',
  ],
  accessibility: {
    role: 'group',
    wcag: '2.2-AA',
    keyboard: ['ArrowLeft', 'ArrowRight', 'Home', 'End'],
    forcedColors: true,
    reducedMotion: true,
  },
  examples: [
    {
      title: 'Basic',
      code: '<Carousel>\n  <img src="/1.jpg" alt="" />\n  <img src="/2.jpg" alt="" />\n</Carousel>',
    },
    {
      title: 'Looping with array',
      code: '<Carousel loop slides={[<Slide1 />, <Slide2 />, <Slide3 />]} />',
    },
  ],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  tags: ['slider', 'gallery', 'slideshow', 'deck', 'scroll-snap'],
  intent: {
    whenToUse: [
      'Presenting a sequence of media or cards the user pages through one at a time',
      'Image galleries, onboarding decks, or featured-content rotators',
      'When horizontal swiping/scrolling is a natural interaction on touch devices',
    ],
    whenNotToUse: [
      'Content users must compare side-by-side — show a grid instead',
      'Critical information that must always be visible — carousels hide most of their content',
    ],
    antiPatterns: [
      {
        bad: 'Auto-rotating carousel for primary navigation or key calls-to-action',
        good: 'A static list or grid where every item is visible',
        why: 'Auto-rotation and hidden slides reduce discoverability and accessibility of important content',
      },
    ],
    related: [
      {
        name: 'Tabs',
        relationship: 'alternative',
        reason: 'Use tabs when sections are distinct and should be directly addressable',
      },
    ],
    a11yRationale:
      'A section with aria-roledescription="carousel" holding one role="group" per slide. Inactive slides are `inert`, not `aria-hidden`: they stay in the layout and remain scroll-reachable, so aria-hidden alone declared them non-existent to assistive technology while every link and button inside them was still tabbable — the canonical aria-hidden-focus violation. The track is aria-live="polite" when the user drives the carousel and "off" while it rotates on its own, per APG; a rotating carousel always renders a play/pause control, and rotation additionally pauses on hover, on focus within, while the tab is hidden and under prefers-reduced-motion. Reduced motion is read in JS as well as CSS because a scrollTo `behavior` option overrides the stylesheet, which is why the previous build\'s stylesheet rule could never take effect. Arrow keys on the indicator row move the slide, not merely the roving tabindex, and the indicators are named as their own group rather than repeating the region\'s name. The indicator hit area reaches the target minimum through a pseudo-element, leaving the 10px visual mark unchanged.',
    flexibility: [
      {
        area: 'transition',
        level: 'strict',
        note: 'Paging uses native CSS scroll-snap, not transform math — no custom easing config',
      },
      {
        area: 'slide content',
        level: 'flexible',
        note: 'Any ReactNode may be a slide; pass via children or the slides array',
      },
    ],
  },
}
