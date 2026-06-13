import type { ViewConfig } from '@cascivo/render'

export const exampleConfig: ViewConfig = {
  $schema:
    'https://raw.githubusercontent.com/urbanisierung/cascade-ui/main/packages/render/schema/view.v1.json',
  version: 1,
  view: {
    regions: {
      status: [
        { component: 'Badge', props: { variant: 'success' }, children: 'Published' },
        { component: 'Badge', props: { variant: 'warning' }, children: 'Draft' },
        { component: 'Badge', props: { variant: 'destructive' }, children: 'Archived' },
      ],
      actions: [
        { component: 'Button', props: { variant: 'primary' }, children: 'Save changes' },
        { component: 'Button', props: { variant: 'secondary' }, children: 'Cancel' },
      ],
      content: [
        {
          component: 'Alert',
          props: { variant: 'info', title: 'AI-generated layout' },
          children: 'This UI was described in JSON and rendered live by CascadeView.',
        },
        { component: 'Separator' },
        {
          component: 'Card',
          children: [
            { component: 'Input', props: { label: 'Name', placeholder: 'Your name' } },
            { component: 'Spinner' },
          ],
        },
      ],
    },
  },
}

export const exampleConfigJson = JSON.stringify(exampleConfig, null, 2)
