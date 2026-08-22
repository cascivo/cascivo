/**
 * `Field` + control: the composition the library prescribes must actually name the control.
 *
 * ## Why this exists
 *
 * `TagsInput` rendered its inner `<input>` with a hardcoded `aria-label="Tags"`. Because
 * `aria-label` outranks a `<label for>` association, it won even inside a `Field` — so
 * `<Field label="Production domains">` produced a control whose accessible name was "Tags",
 * with the Field's hint never announced. A WCAG 1.3.1/4.1.2 failure in a system advertising
 * 2.2 AA, in the exact composition the guides prescribe (2026-08-22 report item 16).
 *
 * Nothing asserted it. `field.test.tsx` checked `Field` against ONE control, so a control that
 * ignored the wiring was invisible to the suite. This checks EVERY one.
 *
 * ## Subjects are derived; fixtures are explicit
 *
 * `link-item-id-parity.test.ts` records the rule: a guard that enumerates its own subjects only
 * catches what its author already knew. So the subject list comes from `registry.json` — every
 * `category: 'inputs'` component — and a new control that matches the predicate **fails this
 * file until it is either given a fixture or excluded with a reason.**
 *
 * The render fixtures themselves must be written by hand: required props (`options`, `value`)
 * cannot be guessed. That split keeps the discovery honest without pretending the rendering is
 * automatic.
 *
 * ## On the environment
 *
 * `getByLabelText` is the purpose-built query for "which form control does this label name?".
 * It resolves `<label for>`, `aria-labelledby` and `aria-label` with the same precedence the
 * accessible-name computation uses, so a control that overrides its Field's label with a
 * hardcoded `aria-label` is not found — which is exactly the defect being guarded.
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Field } from './field'
import { Input } from '../input/input'
import { Textarea } from '../textarea/textarea'
import { Select } from '../select/select'
import { NativeSelect } from '../native-select/native-select'
import { Checkbox } from '../checkbox/checkbox'
import { Slider } from '../slider/slider'
import { Toggle } from '../toggle/toggle'
import { Search } from '../search/search'
import { NumberInput } from '../number-input/number-input'
import { PasswordInput } from '../password-input/password-input'
import { Combobox } from '../combobox/combobox'
import { TagsInput } from '../tags-input/tags-input'
import { DatePicker } from '../date-picker/date-picker'
import { TimePicker } from '../time-picker/time-picker'
import { ColorPicker } from '../color-picker/color-picker'
import { Editable } from '../editable/editable'

const LABEL = 'Production domains'
const HINT = 'One per line'

/**
 * One render per Field-wrappable control. Each renders the control with only its required
 * props — the Field supplies identity, so a fixture that passed its own `label`/`ariaLabel`
 * would test the fixture rather than the wiring.
 */
const FIXTURES: Record<string, () => ReactElement> = {
  Input: () => <Input />,
  Textarea: () => <Textarea />,
  Select: () => <Select options={[{ value: 'a', label: 'A' }]} />,
  NativeSelect: () => <NativeSelect options={[{ value: 'a', label: 'A' }]} />,
  Checkbox: () => <Checkbox />,
  Slider: () => <Slider />,
  Toggle: () => <Toggle />,
  Search: () => <Search />,
  NumberInput: () => <NumberInput />,
  PasswordInput: () => <PasswordInput />,
  Combobox: () => <Combobox options={[{ value: 'a', label: 'A' }]} />,
  TagsInput: () => <TagsInput value={[]} onValueChange={() => {}} />,
  DatePicker: () => <DatePicker />,
  TimePicker: () => <TimePicker />,
  ColorPicker: () => <ColorPicker />,
  Editable: () => <Editable value="x" onValueChange={() => {}} />,
}

/**
 * Controls in `category: 'inputs'` that a `Field` does not wrap, with why. Each entry names a
 * structural reason — not "not done yet". A control here still owes an accessible name; it
 * just does not get one from a `Field`.
 */
const NOT_FIELD_WRAPPED: Record<string, string> = {
  Field: 'is the labelling mechanism itself',
  Form: 'a <form> landmark, not a control',
  Label: 'renders the label a Field owns',
  Button: 'names itself from its own text content',
  IconButton: 'names itself via its own `label`/`ariaLabel` (no visible text to label)',
  CopyButton: 'a button; names itself from its content or `label`',
  Fab: 'a floating action button; names itself',
  ButtonGroup: 'a group wrapper, not a control',
  InputGroup: 'a layout wrapper around a control that is itself Field-wrapped',
  Swap: 'a two-state icon button; names itself',
  Tile: 'a selectable card that names itself from its content',
  CheckboxCard: 'a card-shaped control that renders its own visible label',
  RadioCard: 'a card-shaped control that renders its own visible label',
  Radio: 'a single radio is named by its own label; the GROUP is what a Field wraps',
  SegmentedControl: 'a radiogroup; named via its own `ariaLabel`, not a `<label for>`',
  ToggleGroup: 'a group; named via its own `ariaLabel`, not a `<label for>`',
  Filter: 'a disclosure button plus a listbox; names itself via `ariaLabel`',
  MultiSelect: 'a listbox popup; names itself via its own trigger text',
  Calendar: 'a composite grid widget; named via `ariaLabel` on the grid',
  DateRangePicker: 'two linked fields; each names itself',
  ReorderList: 'a reorderable list, not a value-entry control',
  RatingGroup: 'a radiogroup; named via its own `ariaLabel`',
  WheelPicker: 'a composite picker; named via its own `ariaLabel`',
  OtpInput: 'a group of single-character inputs; named via `ariaLabel` on the group',
  FileUploader: 'a dropzone plus a button; names itself',
  CodeEditor: 'ships from @cascivo/editor, not a Field-wrapped control',
}

const registry = JSON.parse(
  readFileSync(join(process.cwd(), '../../registry.json'), 'utf8'),
) as { components: { meta: { name: string; category?: string } }[] }

describe('Field composition', () => {
  it('covers every inputs-category control with a fixture or a documented exclusion', () => {
    const inputs = registry.components
      .filter((c) => c.meta.category === 'inputs')
      .map((c) => c.meta.name)
    expect(inputs.length).toBeGreaterThan(20)
    const uncovered = inputs.filter((n) => !(n in FIXTURES) && !(n in NOT_FIELD_WRAPPED))
    expect(
      uncovered,
      'A new inputs-category control must either get a Field fixture here or an entry in ' +
        'NOT_FIELD_WRAPPED saying why a Field does not wrap it. Uncovered: ' + uncovered.join(', '),
    ).toEqual([])
  })

  it('has no stale exclusions', () => {
    const known = new Set(registry.components.map((c) => c.meta.name))
    const stale = Object.keys(NOT_FIELD_WRAPPED).filter((n) => !known.has(n))
    expect(stale, `NOT_FIELD_WRAPPED names components that no longer exist: ${stale.join(', ')}`)
      .toEqual([])
  })

  for (const [name, fixture] of Object.entries(FIXTURES)) {
    it(`${name} takes its accessible name from the Field`, () => {
      const { container } = render(
        <Field label={LABEL} hint={HINT}>
          {fixture()}
        </Field>,
      )
      void container
      const named = screen.queryAllByLabelText(LABEL)
      expect(
        named.length,
        `${name} inside <Field label="${LABEL}"> has no control that the label names. ` +
          'The Field clones `id` onto its child; the child must forward it to the element that ' +
          'takes focus, and must not set an `aria-label` that would outrank the label.',
      ).toBeGreaterThan(0)
    })

    it(`${name} announces the Field hint`, () => {
      render(
        <Field label={LABEL} hint={HINT}>
          {fixture()}
        </Field>,
      )
      const control = screen.getAllByLabelText(LABEL)[0]!
      const describedBy = control.getAttribute('aria-describedby')
      expect(
        describedBy,
        `${name} does not forward the Field's \`aria-describedby\`, so the hint is visible ` +
          'but never announced.',
      ).toBeTruthy()
      const ids = describedBy!.split(/\s+/)
      const text = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ')
      expect(text).toContain(HINT)
    })
  }
})
