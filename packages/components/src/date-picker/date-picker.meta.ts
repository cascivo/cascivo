import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'DatePicker',
  description: 'An accessible date-picker with a calendar popover.',
  category: 'inputs',
  clientJs: 'required',
  states: ['default', 'open', 'error', 'disabled'],
  variants: [],
  sizes: ['sm', 'md', 'lg'],
  props: [
    {
      name: 'id',
      type: 'string',
      required: false,
      description:
        'Base id for the input and its popover/aria wiring; auto-generated when omitted.',
    },
    {
      name: 'value',
      type: 'string',
      required: false,
      description: 'Controlled ISO date value (YYYY-MM-DD)',
    },
    {
      name: 'defaultValue',
      type: 'string',
      required: false,
      description: 'Uncontrolled default value',
    },
    {
      name: 'onValueChange',
      type: '(value: string | undefined) => void',
      required: false,
      description: 'Called with the selected ISO date string (or undefined when cleared)',
    },
    { name: 'min', type: 'string', required: false, description: 'Minimum ISO date' },
    { name: 'max', type: 'string', required: false, description: 'Maximum ISO date' },
    {
      name: 'clearable',
      default: 'false',
      type: 'boolean',
      required: false,
      description: 'Shows a clear button',
    },
    {
      name: 'typeable',
      description:
        'When true, the field accepts a typed date as well as one picked from the calendar.',
      type: 'boolean',
      required: false,
      default: 'true',
    },
    {
      name: 'disabledDate',
      description: 'Rejects individual dates the bounds allow — holidays, weekends, taken slots.',
      type: '(date: Date) => boolean',
      required: false,
    },
    {
      name: 'format',
      description:
        "Formatting options for the displayed date. Defaults to the locale's numeric form.",
      type: 'Intl.DateTimeFormatOptions',
      required: false,
    },
    {
      name: 'showToday',
      description: 'When true, the calendar offers a button that jumps to the current month.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'name',
      description: 'Submitted with a surrounding form — a hidden input carrying the ISO value.',
      type: 'string',
      required: false,
    },
    {
      name: 'required',
      description: 'Marks the control as required for assistive technology.',
      type: 'boolean',
      required: false,
    },
    {
      name: 'open',
      description: 'Controlled open state of the calendar popup.',
      type: 'boolean',
      required: false,
    },
    {
      name: 'onOpenChange',
      description: 'Called when the popup opens or closes.',
      type: '(open: boolean) => void',
      required: false,
    },
    {
      name: 'label',
      nameVisibility: 'visible',
      type: 'string',
      required: false,
      description: 'Visible field label rendered above the input; it also names the control.',
    },
    { name: 'hint', type: 'string', required: false, description: 'Hint text' },
    { name: 'error', type: 'string', required: false, description: 'Error message' },
    {
      name: 'size',
      default: 'md',
      type: "'sm' | 'md' | 'lg'",
      required: false,
      description: 'Field size',
    },
    {
      name: 'disabled',
      default: 'false',
      type: 'boolean',
      required: false,
      description: 'Disables the picker',
    },
    {
      name: 'labels',
      type: 'DatePickerLabels',
      required: false,
      description: 'i18n label overrides',
    },
    {
      name: 'aria-labelledby',
      description:
        "Wired automatically by a wrapping `Field` — its label id, forwarded to the focusable control so the Field's label names it.",
      type: 'string',
      required: false,
    },
    {
      name: 'aria-describedby',
      description:
        'Wired automatically by a wrapping `Field` — the ids of its hint/error text, forwarded to the focusable control so the supporting text is announced.',
      type: 'string',
      required: false,
    },
    {
      name: 'aria-invalid',
      description: 'Wired automatically by a wrapping `Field` when it is in an error state.',
      type: 'boolean',
      required: false,
    },
    {
      name: 'ariaLabel',
      description:
        'Invisible accessible name, for when a visible element outside this component already labels it and `label` would render that text a second time. ⚠ `label` on this component is **visible**; `IconButton.label`/`Sparkline.label` are invisible names, which is the prior that costs adopters a duplicated label. The raw DOM `aria-label` still wins over this.',
      type: 'string',
      required: false,
      nameVisibility: 'invisible',
    },
  ],
  tokens: [
    '--cascivo-color-accent-text',
    '--cascivo-color-surface',
    '--cascivo-color-surface-overlay',
    '--cascivo-color-border',
    '--cascivo-color-border-strong',
    '--cascivo-color-accent',
    '--cascivo-color-text-on-accent',
    '--cascivo-date-picker-day-today-color',
    '--cascivo-color-text',
    '--cascivo-color-text-muted',
    '--cascivo-color-text-subtle',
    '--cascivo-color-bg-subtle',
    '--cascivo-color-destructive',
  ],
  accessibility: {
    role: 'combobox',
    wcag: '2.2-AA',
    forcedColors: true,
    reducedMotion: true,
    keyboard: [
      'ArrowDown',
      'ArrowUp',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'PageUp',
      'PageDown',
      'Enter',
      'Space',
      'Escape',
      'Delete',
    ],
  },
  examples: [
    {
      title: 'Basic',
      code: '<DatePicker label="Date" />',
      description: 'Uncontrolled date picker',
    },
    {
      title: 'Clearable',
      code: '<DatePicker label="Date" clearable />',
      description: 'With clear button',
    },
    {
      title: 'With constraints',
      code: '<DatePicker min="2024-01-01" max="2024-12-31" />',
      description: 'Date range constraint',
    },
  ],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  // The popup grid is Calendar itself now, rather than a second copy of its month maths.
  registryDependencies: ['calendar'],
  tags: ['date', 'calendar', 'picker', 'input', 'form'],
  intent: {
    whenToUse: [
      'Picking a single calendar date in a form where a visual month grid helps (due dates, bookings)',
      'Date entry that benefits from min/max constraints and locale-aware formatting and week start',
    ],
    whenNotToUse: [
      'Selecting a time of day — use TimePicker',
      'Free-form or approximate dates where a plain Input is faster, or a date already known by typing',
    ],
    antiPatterns: [
      {
        bad: 'Passing a localized display string as value',
        good: 'value/defaultValue/min/max are ISO YYYY-MM-DD; display formatting is handled internally',
        why: 'The component parses and compares ISO dates; non-ISO values break selection, constraints, and onValueChange',
      },
    ],
    related: [
      {
        name: 'TimePicker',
        relationship: 'pairs-with',
        reason: 'Combine when both a date and a time are needed',
      },
      {
        name: 'Input',
        relationship: 'alternative',
        reason: 'Use a plain input when a calendar grid is unnecessary',
      },
      {
        name: 'Form',
        relationship: 'contained-by',
        reason: 'Typically a field within a form with label/hint/error',
      },
    ],
    a11yRationale:
      'The field is an <input role="combobox"> with aria-expanded, aria-controls and aria-haspopup="dialog" that accepts a typed date — the previous build had no text field at all, so a date already known could only be reached by paging a grid. ArrowDown and Alt+ArrowDown open the popup (the combobox pattern\'s required key, listed in the old manifest but never implemented), opening moves focus into the grid and Escape closes and returns it to the field; the old build did neither, leaving the grid unreachable on open and focus on <body> on close. The grid itself is a composed Calendar rather than a second hand-rolled copy, so its real-focus navigation, min/max clamping, disabled-day skipping, aria-selected placement and month announcements all apply here; the duplicate had none of them and its arrow keys did nothing at all until a value was set. Dismissal comes from the shared DismissableLayer instead of a raw document listener. Typed input is parsed at commit, not per keystroke, and rejected rather than coerced when unreadable or out of bounds.',
    flexibility: [
      { area: 'value format', level: 'strict', note: 'All date props are ISO YYYY-MM-DD strings' },
      {
        area: 'locale formatting',
        level: 'flexible',
        note: 'Display, weekday labels, and week start derive from the current i18n locale via Intl',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'Styling resolves to --cascivo-date-picker-* component tokens',
      },
    ],
  },
}
