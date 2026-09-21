import { describe, expect, it } from 'vitest'
import type { ViewConfig } from './types'
import { viewToMarkdown } from './view-text'

describe('viewToMarkdown', () => {
  it('renders a view config as a document', () => {
    const config: ViewConfig = {
      view: {
        regions: {
          main: [
            { component: 'EmptyState', props: { title: 'No invoices' } },
            { component: 'Button', children: 'Save' },
          ],
        },
      },
    }
    expect(viewToMarkdown(config)).toBe('### No invoices\n\n[button: Save]')
  })

  it('resolves host data bindings', () => {
    const config: ViewConfig = {
      view: {
        regions: {
          main: [
            {
              component: 'DataTable',
              props: { columns: [{ key: 'name', header: 'Name' }] },
              bind: { rows: '$data.people' },
            },
          ],
        },
      },
    }
    const doc = viewToMarkdown(config, { data: { people: [{ name: 'Ada' }] } })
    expect(doc).toBe('| Name |\n| --- |\n| Ada |')
  })

  it('forwards serialization options', () => {
    const config: ViewConfig = {
      view: { regions: { main: [{ component: 'Button', children: 'Save' }] } },
    }
    expect(viewToMarkdown(config, { text: { annotate: false } })).toBe('Save')
  })
})
