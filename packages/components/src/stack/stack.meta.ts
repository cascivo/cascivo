import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Stack',
  description:
    'Overlaps children in a CSS grid stack with a configurable offset to create a card-pile effect',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'children',
      description: 'Content rendered inside the component.',
      type: 'React.ReactNode',
      required: true,
    },
    {
      name: 'offset',
      type: 'number',
      required: false,
      default: '4',
      description: 'Pixel offset applied per layer in both axes',
    },
    {
      name: 'className',
      description: 'Additional CSS class names merged onto the root element.',
      type: 'string',
      required: false,
    },
  ],
  tokens: [],
  accessibility: {
    role: 'none',
    wcag: '2.2-AA',
    keyboard: [],
  },
  examples: [
    {
      title: 'Card pile',
      code: '<Stack offset={6}><Card>First</Card><Card>Second</Card><Card>Third</Card></Stack>',
      description: 'Three cards stacked with a 6px offset to show depth',
    },
    {
      title: 'Tight stack',
      code: '<Stack offset={2}><Avatar src="/a.jpg" /><Avatar src="/b.jpg" /><Avatar src="/c.jpg" /></Stack>',
      description: 'Overlapping avatar group with minimal offset',
    },
  ],
  dependencies: [],
  tags: ['stack', 'pile', 'overlap', 'layout'],
  intent: {
    whenToUse: [
      'Card pile UI where depth and layering should be visible',
      'Overlapping avatar groups',
      'Notification stack visualisations',
    ],
    whenNotToUse: [
      'Gap-based vertical/horizontal layout — that is a DIFFERENT component, `Flex` (`layout/flex`). This `Stack` only overlaps children with an offset.',
      'Independent positioned elements — use CSS position directly',
    ],
    related: [
      {
        name: 'layout/flex',
        relationship: 'alternative',
        reason:
          'The flex layout primitive `Flex`, for gap-based vertical/horizontal stacking — a different component from this card-pile Stack.',
      },
      {
        name: 'Avatar',
        relationship: 'pairs-with',
        reason: 'Overlapping avatar groups are a primary use case for Stack',
      },
      {
        name: 'Card',
        relationship: 'pairs-with',
        reason: 'Card pile visualisations are a common Stack pattern',
      },
    ],
    antiPatterns: [
      {
        bad: "import { Stack } from '@cascivo/react' to space items vertically",
        good: 'For flex layout use Flex (import { Flex } from "@cascivo/react"); use this Stack only for a visual card-pile',
        why: 'The npm `Stack` overlaps its children by an offset — it does not do gap-based layout. Reach for `Flex` when you want gap-based flex layout.',
      },
    ],
    a11yRationale:
      'Stack is a layout-only container (role="none"). Each child must carry its own accessible semantics. Stacked cards that are interactive should each have a focusable element and a descriptive label.',
    flexibility: [
      {
        area: 'offset',
        level: 'flexible',
        note: 'The pixel offset is fully configurable; set to 0 for a pure overlap with no shift',
      },
    ],
  },
}
