/**
 * Manifest `agent` section guard.
 *
 * A `.meta.ts` `agent` section maps agent actions onto existing props (`setValue` →
 * `onValueChange`). An action pointing at a prop that no longer exists would tell an agent to
 * drive a control that cannot be driven, so every `prop` must exist in `props[]`, and the
 * section must reach `registry.json` for the seeded components.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import type { ComponentMeta } from '@cascivo/core'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const SEEDED = ['input', 'select', 'checkbox', 'toggle', 'modal', 'tabs']

/** Returns one message per action whose `prop` is missing from `props[]`. */
export function danglingAgentProps(meta: ComponentMeta): string[] {
  const names = new Set(meta.props.map((p) => p.name))
  return (meta.agent?.actions ?? [])
    .filter((a) => !names.has(a.prop))
    .map((a) => `${meta.name}: action "${a.name}" targets missing prop "${a.prop}"`)
}

async function load(name: string): Promise<ComponentMeta> {
  const file = join(ROOT, 'packages/components/src', name, `${name}.meta.ts`)
  return ((await import(pathToFileURL(file).href)) as { meta: ComponentMeta }).meta
}

describe('agent manifest', () => {
  it('flags an action that points at a missing prop', () => {
    const meta = {
      name: 'X',
      props: [{ name: 'value' }],
      agent: { actions: [{ name: 'setValue', prop: 'onNope', args: 'string' }] },
    } as unknown as ComponentMeta
    assert.deepEqual(danglingAgentProps(meta), [
      'X: action "setValue" targets missing prop "onNope"',
    ])
  })

  for (const name of SEEDED) {
    it(`${name}: has an agent section whose props exist`, async () => {
      const meta = await load(name)
      assert.ok(meta.agent && meta.agent.actions.length > 0, `${name} has no agent section`)
      assert.deepEqual(danglingAgentProps(meta), [])
    })

    it(`${name}: agent section is in registry.json`, () => {
      const reg = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8')) as {
        components: { name: string; meta?: { agent?: unknown } }[]
      }
      const entry = reg.components.find((c) => c.name === name)
      assert.ok(entry?.meta?.agent, `${name} missing agent in registry.json`)
    })
  }
})
