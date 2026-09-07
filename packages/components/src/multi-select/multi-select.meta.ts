import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'MultiSelect',
  description: 'Searchable multi-value select with a popover listbox, chips and grouping',
  category: 'inputs',
  clientJs: 'required',
  states: ['closed', 'open', 'error'],
  variants: [],
  sizes: ['sm', 'md', 'lg'],
  props: [
    {
      name: 'options',
      description: 'The selectable options.',
      type: 'MultiSelectOption[]',
      required: true,
    },
    {
      name: 'value',
      description:
        'The controlled value. Omit it and pass defaultValue to let the component own the selection.',
      type: 'string[]',
      required: false,
    },
    {
      name: 'defaultValue',
      description: 'The initial value when uncontrolled.',
      type: 'string[]',
      required: false,
      default: '[]',
    },
    {
      name: 'onValueChange',
      description: 'Called with the new value when it changes.',
      type: '(value: string[]) => void',
      required: false,
    },
    {
      name: 'placeholder',
      description: 'Placeholder text shown when the field is empty.',
      type: 'string',
      required: false,
    },
    {
      name: 'label',
      description: 'Visible field label, rendered above the trigger.',
      type: 'string',
      required: false,
      nameVisibility: 'visible',
    },
    {
      name: 'ariaLabel',
      description:
        'Invisible accessible name, for when a visible element outside this component already labels it and `label` would render that text a second time. ⚠ `label` on this component is **visible**; `IconButton.label`/`Sparkline.label` are invisible names, which is the prior that costs adopters a duplicated label.',
      type: 'string',
      required: false,
      nameVisibility: 'invisible',
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
    { name: 'hint', description: 'Helper text below the field.', type: 'string', required: false },
    {
      name: 'error',
      description: 'Error text below the field; also marks the control invalid.',
      type: 'string',
      required: false,
    },
    {
      name: 'display',
      description:
        'How the trigger summarises the selection: a count, or one removable chip per value.',
      type: "'count' | 'chips'",
      required: false,
      default: "'count'",
    },
    {
      name: 'disabled',
      description: 'When true, disables the control and removes it from the tab order.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'clearable',
      description: 'When true, shows a control that clears every selected value.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'selectAll',
      description: 'When true, shows a row that selects or clears every enabled option at once.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'max',
      description:
        'Maximum number of values that may be selected. Further options become unselectable once reached.',
      type: 'number',
      required: false,
    },
    {
      name: 'creatable',
      description: 'When true, offers the current search text as a new option.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'onCreate',
      description: 'Called with the typed label when the user picks the "create" row.',
      type: '(label: string) => void',
      required: false,
    },
    {
      name: 'loading',
      description:
        'When true, the list reports itself as busy and shows a loading row instead of the no-results message.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'onSearchChange',
      description:
        'Called with the search text on every keystroke. Pair it with filter={() => true} for a server-driven list.',
      type: '(query: string) => void',
      required: false,
    },
    {
      name: 'filter',
      description: 'Replaces the built-in diacritic-insensitive matcher.',
      type: '(option: MultiSelectOption, query: string) => boolean',
      required: false,
    },
    {
      name: 'searchable',
      description: 'When true, shows the search field. The list is keyboard-navigable either way.',
      type: 'boolean',
      required: false,
      default: 'true',
    },
    {
      name: 'size',
      description: 'Field height.',
      type: "'sm' | 'md' | 'lg'",
      required: false,
      default: "'md'",
    },
    {
      name: 'name',
      description: 'Submitted with a surrounding form — one hidden input per selected value.',
      type: 'string',
      required: false,
    },
    {
      name: 'labels',
      description: 'Overrides for the component’s user-visible strings (i18n).',
      type: 'MultiSelectLabels',
      required: false,
    },
    { name: 'id', description: 'Id for the trigger control.', type: 'string', required: false },
  ],
  tokens: [
    '--cascivo-color-surface',
    '--cascivo-color-bg-subtle',
    '--cascivo-color-border',
    '--cascivo-color-border-strong',
    '--cascivo-color-text',
    '--cascivo-color-text-muted',
    '--cascivo-color-accent',
    '--cascivo-color-destructive',
    '--cascivo-font-medium',
    '--cascivo-font-bold',
    '--cascivo-radius-field',
    '--cascivo-radius-overlay',
    '--cascivo-radius-item',
    '--cascivo-radius-indicator',
    '--cascivo-shadow-md',
    '--cascivo-focus-ring',
    '--cascivo-motion-enter',
    '--cascivo-target-min-coarse',
  ],
  accessibility: {
    role: 'listbox',
    wcag: '2.2-AA',
    keyboard: [
      'ArrowDown',
      'ArrowUp',
      'Home',
      'End',
      'PageUp',
      'PageDown',
      'Enter',
      'Space',
      'Escape',
      'Backspace',
    ],
    forcedColors: true,
    reducedMotion: true,
  },
  examples: [
    {
      title: 'Basic',
      code: `<MultiSelect options={[{label:'One',value:'1'},{label:'Two',value:'2'}]} defaultValue={[]} />`,
    },
    {
      title: 'Chips with a clear control',
      code: `<MultiSelect options={options} display="chips" clearable defaultValue={['1']} />`,
      description: 'Each selection renders as a chip with its own remove button.',
    },
    {
      title: 'Grouped options',
      code: `<MultiSelect options={[{label:'Apple',value:'a',group:'Pome'},{label:'Cherry',value:'c',group:'Stone'}]} />`,
      description: 'Options carrying a group render under a labelled role="group" heading.',
    },
    {
      title: 'Remote search',
      code: `<MultiSelect options={results} loading={pending} onSearchChange={search} filter={() => true} />`,
      description:
        'filter={() => true} hands filtering to the server; loading marks the list busy between keystroke and response.',
    },
    {
      title: 'Bounded selection',
      code: `<MultiSelect options={options} max={3} selectAll />`,
      description: 'Options past the limit report aria-disabled; select-all stops at the limit.',
    },
  ],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  registryDependencies: ['popover'],
  tags: ['form', 'select', 'multi', 'input', 'popover', 'combobox', 'tags'],
  intent: {
    whenToUse: [
      'Selecting several values at once from a known list of options',
      'Lists long enough that the built-in search/filter helps the user find options',
      'Cases needing a compact trigger that summarizes the selected count, or chips per value',
      'Server-driven option lists, via onSearchChange plus filter={() => true}',
    ],
    whenNotToUse: [
      'Choosing exactly one value — use Select',
      'Free-text entries with no option list behind them — use TagsInput',
      'A handful of always-visible options — use a Checkbox group',
    ],
    antiPatterns: [
      {
        bad: '<MultiSelect value={value} /> with no onValueChange',
        good: '<MultiSelect defaultValue={value} onValueChange={setValue} />',
        why: 'Passing value makes the component controlled for its whole life; without onValueChange the selection can never change. Use defaultValue when the component should own the state.',
      },
      {
        bad: '<MultiSelect options={remote} onSearchChange={search} />',
        good: '<MultiSelect options={remote} onSearchChange={search} filter={() => true} />',
        why: 'The built-in matcher still runs over the server’s results and filters them a second time against the same query, hiding rows the server deliberately returned.',
      },
    ],
    related: [
      {
        name: 'Select',
        relationship: 'alternative',
        reason: 'Use Select for single-value selection',
      },
      {
        name: 'Combobox',
        relationship: 'alternative',
        reason: 'Use Combobox for a single value chosen from a searchable list',
      },
      {
        name: 'TagsInput',
        relationship: 'alternative',
        reason: 'Use TagsInput for free-text values with no option list',
      },
      {
        name: 'Checkbox',
        relationship: 'alternative',
        reason: 'Use a Checkbox group for a small set of always-visible options',
      },
    ],
    a11yRationale:
      'The trigger is a button with aria-haspopup="listbox", aria-expanded and aria-controls pointing at the panel. Inside the panel the search field carries role="combobox" with aria-expanded, aria-controls and aria-autocomplete="list", and owns aria-activedescendant — it is the element that holds DOM focus, so assistive technology tracks the active option as the arrows move it. With searchable={false} the listbox itself takes focus and the same attributes. The listbox is aria-multiselectable with role="option" rows carrying aria-selected, aria-disabled for unavailable ones and role="group" headings for grouped options; the search field, the select-all row and the loading/no-results message are siblings of the listbox rather than children, because a listbox owns only option and group children. ArrowUp/ArrowDown move the active option and skip disabled rows, Home/End jump to the ends, PageUp/PageDown move by ten, Enter toggles (Space too when there is no search field), Backspace removes the last chip from an empty search, and Escape closes the panel and returns focus to the trigger. A permanently mounted polite live region reports the selection count, so the first selection is announced as well as later ones. Selection, the active row and the focus ring each carry a non-colour channel under forced-colors, and every control reaches the coarse-pointer target minimum.',
    content: {
      tone: 'Plain placeholder and count summary',
      notes:
        'Defaults from the i18n catalog; placeholder, selected(count), search, no-results, loading, clear, remove, select-all, clear-all and create strings are overridable via labels',
    },
    flexibility: [
      {
        area: 'token names',
        level: 'strict',
        note: 'Surface, border, accent, radius, shadow, focus-ring, and motion must resolve to the listed --cascivo-* tokens',
      },
      {
        area: 'labels',
        level: 'flexible',
        note: 'Every user-visible string is overridable through labels',
      },
      {
        area: 'options',
        level: 'flexible',
        note: 'Caller supplies the option list and may mark options disabled or assign them a group',
      },
      {
        area: 'filtering',
        level: 'flexible',
        note: 'The default matcher folds diacritics and searches label then value; filter replaces it entirely',
      },
    ],
  },
}
