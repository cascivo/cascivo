/**
 * Grid/flex-track safety guard.
 *
 * A grid or flex item's default minimum size is its *content* size. A control that wraps a
 * native `<input>` inherits that element's intrinsic width (~20ch by default), so the wrapper
 * refuses to shrink and spills out of its track — reported as "`Input` overflows its grid
 * cell" inside `<Grid cols={{ base: 1, md: 2 }}>`, with the field's right edge crossing into
 * the next column.
 *
 * `min-inline-size: 0` on the root is the fix, and 15 other component stylesheets already
 * used that idiom — the field family just never got it. This asserts every component that
 * renders a natively-sized form control declares it, so the next one added can't ship
 * without it.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/**
 * Components whose root wraps a natively-sized control (`<input>`, `<textarea>`, `<select>`)
 * and which therefore need an explicit shrink floor. Extend this list when adding one.
 */
const FIELD_FAMILY = [
  'input',
  'search',
  'number-input',
  'combobox',
  'date-picker',
  'time-picker',
  'multi-select',
  'tags-input',
  'otp-input',
  'password-input',
  'file-uploader',
]

describe('field-family controls shrink inside a grid track', () => {
  for (const name of FIELD_FAMILY) {
    it(`${name} declares min-inline-size: 0`, () => {
      const css = readFileSync(
        join(ROOT, 'packages', 'components', 'src', name, `${name}.module.css`),
        'utf8',
      )
      assert.match(
        css,
        /min-inline-size:\s*0/,
        `${name}.module.css must set \`min-inline-size: 0\` on its root: without it the control's ` +
          "intrinsic width becomes the grid item's minimum and it overflows its column",
      )
    })
  }
})

describe('chart frames shrink inside a flex row', () => {
  it('the chart frame declares min-inline-size: 0', () => {
    const css = readFileSync(
      join(ROOT, 'packages', 'charts', 'src', 'core', 'chart-frame.module.css'),
      'utf8',
    )
    assert.match(
      css,
      /min-inline-size:\s*0/,
      'chart-frame.module.css must set `min-inline-size: 0`: a fixed-width Sparkline otherwise ' +
        'refuses to compress and pushes its sibling label onto three lines',
    )
  })
})

/**
 * Chrome an app must be able to restyle. Inline styles beat every `@layer`, so a component
 * that paints its surface inline is the one thing in the catalog that cannot be overridden
 * through the documented cascade. `unlayered:check` cannot see this — it reads `.css` files.
 */
const CHROME_PROPS = [
  'border',
  'borderRadius',
  'boxShadow',
  'background',
  'backgroundColor',
  'padding',
]

describe('component chrome is layered, not inline', () => {
  const SHIPPED = [
    'packages/charts/src/charts/kpi/kpi.tsx',
    'packages/components/src/stat/stat.tsx',
    'packages/components/src/card/card.tsx',
  ]
  for (const file of SHIPPED) {
    it(`${file.split('/').pop()} paints its chrome through a stylesheet`, () => {
      const source = readFileSync(join(ROOT, file), 'utf8')
      for (const prop of CHROME_PROPS) {
        assert.ok(
          !new RegExp(`\\n\\s*${prop}:\\s*['"\`]`).test(source),
          `${file} sets \`${prop}\` as an inline style. Inline styles outrank every @layer, so an ` +
            'adopter cannot restyle it through the cascade — move it to the component CSS module.',
        )
      }
    })
  }
})
