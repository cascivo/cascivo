import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'HeaderPanel',
  description:
    'Non-modal panel anchored below the shell header at the inline-end edge — hosts notifications, app switcher, user settings',
  category: 'navigation',
  states: ['open', 'closed'],
  variants: [],
  sizes: [],
  props: [
    { name: 'open', type: 'boolean', required: true, description: 'Controlled open state' },
    {
      name: 'onClose',
      type: '() => void',
      required: true,
      description: 'Called on close button click or light-dismiss',
    },
    {
      name: 'label',
      type: 'string',
      required: true,
      description: 'Accessible label for the region (shown as header title)',
    },
    { name: 'children', type: 'ReactNode', required: true },
    { name: 'labels', type: 'HeaderPanelLabels', required: false, description: 'i18n overrides' },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: [
    '--cascade-shell-header-block-size',
    '--cascade-shell-panel-inline-size',
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-shadow-md',
    '--cascade-motion-enter',
  ],
  accessibility: {
    role: 'region',
    wcag: 'AA',
    keyboard: ['Escape', 'Tab'],
  },
  examples: [
    {
      title: 'Notification panel',
      code: `<HeaderPanel open={open} onClose={() => setOpen(false)} label="Notifications">
  <p>3 unread messages</p>
</HeaderPanel>`,
      description: 'Pair with a ShellHeader action: action active=open, onAction toggles open',
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['navigation', 'panel', 'shell', 'console', 'overlay', 'notifications'],
}
