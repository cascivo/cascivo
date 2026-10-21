import { coerceEventValue } from '../node-props'

/**
 * Components whose value an agent can bind both ways: `prop` reads the bound path, `event`
 * writes the user's change back to it before any Action on that event dispatches.
 */
export const TWO_WAY: Readonly<Record<string, { prop: string; event: string }>> = {
  Input: { prop: 'value', event: 'onChange' },
  Textarea: { prop: 'value', event: 'onChange' },
  Select: { prop: 'value', event: 'onChange' },
  Slider: { prop: 'value', event: 'onChange' },
  Checkbox: { prop: 'checked', event: 'onChange' },
  Toggle: { prop: 'checked', event: 'onValueChange' },
  DatePicker: { prop: 'value', event: 'onValueChange' },
  TimePicker: { prop: 'value', event: 'onValueChange' },
  NumberInput: { prop: 'value', event: 'onValueChange' },
  Tabs: { prop: 'value', event: 'onValueChange' },
  Search: { prop: 'value', event: 'onValueChange' },
  Combobox: { prop: 'value', event: 'onValueChange' },
  Accordion: { prop: 'value', event: 'onValueChange' },
  RadioCardGroup: { prop: 'value', event: 'onValueChange' },
  CheckboxCard: { prop: 'checked', event: 'onCheckedChange' },
  Pagination: { prop: 'page', event: 'onPageChange' },
  Modal: { prop: 'open', event: 'onClose' },
}

/** The value a two-way event writes to the bound path. */
export function twoWayValue(component: string, arg: unknown): unknown {
  // `onClose` carries no value: closing means the bound `open` is now false.
  if (component === 'Modal') return false
  const value = coerceEventValue(arg)
  // A native range input reports its value as a string.
  return component === 'Slider' ? Number(value) : value
}
