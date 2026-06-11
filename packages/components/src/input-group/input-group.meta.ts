import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'InputGroup',
  description: 'Prefix/suffix addon wrapper for Input; ButtonGroup collapses adjacent button borders',
  category: 'inputs',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'prefix', type: 'ReactNode', required: false },
    { name: 'suffix', type: 'ReactNode', required: false },
    { name: 'children', type: 'ReactNode', required: true },
  ],
  tokens: [
    '--cascade-color-bg-subtle',
    '--cascade-color-border',
    '--cascade-color-text-subtle',
    '--cascade-radius-input',
  ],
  accessibility: {
    role: 'generic',
    wcag: 'AA',
    keyboard: [],
  },
  examples: [
    {
      title: 'With prefix',
      code: `<InputGroup prefix="https://"><Input placeholder="example.com" /></InputGroup>`,
    },
    {
      title: 'ButtonGroup',
      code: `<ButtonGroup><Button>Left</Button><Button>Right</Button></ButtonGroup>`,
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['form', 'input', 'addon', 'group', 'layout'],
}
