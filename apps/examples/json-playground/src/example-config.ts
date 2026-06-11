import type { ViewConfig } from '@cascade-ui/render'

export const exampleConfig: ViewConfig = {
  $schema:
    'https://raw.githubusercontent.com/urbanisierung/cascade-ui/main/packages/render/schema/view.v1.json',
  version: 1,
  view: {
    regions: {
      stats: [
        { component: 'Badge', props: { variant: 'success' }, children: 'Active' },
        { component: 'Badge', props: { variant: 'secondary' }, children: 'Beta' },
        { component: 'Badge', props: { variant: 'warning' }, children: 'Pending' },
      ],
      content: [
        {
          component: 'Card',
          children: [{ component: 'Spinner' }, { component: 'Separator' }],
        },
      ],
    },
  },
}

export const exampleConfigJson = JSON.stringify(exampleConfig, null, 2)
