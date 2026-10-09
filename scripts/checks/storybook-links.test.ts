/**
 * The docs site's "View in Storybook" links resolve.
 *
 * ComponentPage used to build `<category>-<name>--primary`, which named a story that exists only
 * when the file happens to export `Primary` — 71 of 181 files, and none of the generated ones
 * (2026-10-07 research, §1.4 defect 6). The ids now come from the story files themselves
 * (`pnpm stories:generate` → apps/site/src/storybook-ids.json). This holds the id rule to
 * Storybook's, and the committed map to the files on disk.
 *
 * Run with: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { firstStory, storyId } from '../lib/storybook-id.ts'

const ROOT = join(import.meta.dirname, '../..')
const STORIES = join(ROOT, 'apps/storybook/stories')

function storyFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory()
      ? storyFiles(join(dir, d.name))
      : d.name.endsWith('.stories.tsx')
        ? [join(dir, d.name)]
        : [],
  )
}

describe('storyId', () => {
  // Expected values are the ids Storybook 10 assigns these stories (storybook.cascivo.com).
  it('matches Storybook for start-cased exports and spaced titles', () => {
    assert.equal(
      storyId('Display/AiBadge', 'EditedWithRevert'),
      'display-aibadge--edited-with-revert',
    )
    assert.equal(storyId('Flow/FlowNode', 'ADraggableNode'), 'flow-flownode--a-draggable-node')
    assert.equal(storyId('Design Tokens/Catalog', 'Catalog'), 'design-tokens-catalog--catalog')
    assert.equal(storyId('Inputs/Button', 'Primary'), 'inputs-button--primary')
  })

  it('reads the meta title, not a demo prop named title above it', () => {
    const source = `function Demo() { return <Card title='Not this' /> }
const meta: Meta = { title: 'Display/Card' }
export default meta
export const WithHeader: Story = {}`
    assert.deepEqual(firstStory(source), { title: 'Display/Card', exportName: 'WithHeader' })
    assert.equal(
      firstStory(`const meta: Meta = {\n  title: "Display/Card",\n}\nexport const A = {}`)?.title,
      'Display/Card',
    )
  })
})

describe('apps/site/src/storybook-ids.json', () => {
  const committed: unknown = JSON.parse(
    readFileSync(join(ROOT, 'apps/site/src/storybook-ids.json'), 'utf8'),
  )

  it('names only stories that exist', () => {
    const real = new Set(
      storyFiles(STORIES).flatMap((file) => {
        const story = firstStory(readFileSync(file, 'utf8'))
        return story ? [storyId(story.title, story.exportName)] : []
      }),
    )
    assert.ok(real.size > 50, `read only ${real.size} stories`)
    const stale = Object.entries(committed as Record<string, string>).filter(
      ([, id]) => !real.has(id),
    )
    assert.deepEqual(stale, [], 'Run `pnpm stories:generate` (part of `pnpm regen`).')
  })
})
