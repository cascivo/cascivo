/**
 * Source for `dist/custom-elements.json` (Custom Elements Manifest 2.1). Not imported by the
 * elements, so it costs no bytes; `manifest.test.ts` checks it against the running classes.
 */
interface Entry {
  tag: string
  className: string
  module: string
  description: string
  formAssociated: boolean
  attributes: [name: string, type: string, description: string][]
  events: [name: string, description: string][]
}

const formAttributes: Entry['attributes'] = [
  ['name', 'string', 'Form field name (form-associated via ElementInternals).'],
  ['required', 'boolean', 'Reports valueMissing when empty.'],
  ['disabled', 'boolean', 'Disables the field.'],
  ['placeholder', 'string', 'Overrides the translated placeholder.'],
]

const formEvents: Entry['events'] = [
  ['cv-value-change', 'The committed value changed. `detail: { value: string | undefined }`.'],
  ['input', 'Native, fired on the host when the value is committed.'],
  ['change', 'Native, fired on the host when the value is committed.'],
]

export const ELEMENTS: Entry[] = [
  {
    tag: 'cv-menu',
    className: 'CvMenu',
    module: 'menu',
    description: 'Action menu: enhances a [aria-haspopup=menu] button and a [role=menu] popover.',
    formAssociated: false,
    attributes: [],
    events: [['cv-select', 'An item was activated. `detail: { value: string }` (data-value).']],
  },
  {
    tag: 'cv-tabs',
    className: 'CvTabs',
    module: 'tabs',
    description: 'Tabs: enhances a [role=tablist] of [role=tab] and their [role=tabpanel] panels.',
    formAssociated: false,
    attributes: [
      ['activation', "'auto' | 'manual'", 'Manual: arrow keys move focus, Enter/Space selects.'],
    ],
    events: [['cv-value-change', 'A tab was selected. `detail: { value: string }` (data-value).']],
  },
  {
    tag: 'cv-form',
    className: 'CvForm',
    module: 'form',
    description:
      'Form: renders constraint-validation errors with server-provided messages, guards double submit, swaps htmx 422 and focuses the first error.',
    formAssociated: false,
    attributes: [],
    events: [],
  },
  {
    tag: 'cv-combobox',
    className: 'CvCombobox',
    module: 'combobox',
    description: 'Editable combobox over [role=option][data-value] rows; filters as you type.',
    formAssociated: true,
    attributes: [['value', 'string', 'Initial value (an option data-value).'], ...formAttributes],
    events: formEvents,
  },
  {
    tag: 'cv-date-picker',
    className: 'CvDatePicker',
    module: 'date-picker',
    description: 'Typeable date field with a calendar dialog; submits an ISO YYYY-MM-DD date.',
    formAssociated: true,
    attributes: [
      ['value', 'string', 'Initial value, ISO YYYY-MM-DD.'],
      ['min', 'string', 'Earliest selectable date, ISO.'],
      ['max', 'string', 'Latest selectable date, ISO.'],
      ...formAttributes,
    ],
    events: formEvents,
  },
  {
    tag: 'cv-dialog',
    className: 'CvDialog',
    module: 'dialog',
    description:
      'Modal dialog: wraps a native <dialog> opened with showModal(); focus returns to the opener.',
    formAssociated: false,
    attributes: [
      ['open', 'boolean', 'Open state (initial value; the live state is the `open` property).'],
      ['static', 'boolean', 'A backdrop click does not close.'],
    ],
    events: [
      ['cv-open', 'The dialog opened.'],
      ['cv-close', 'The dialog closed (Escape, close control, backdrop, cv-dialog-close).'],
    ],
  },
  {
    tag: 'cv-toaster',
    className: 'CvToaster',
    module: 'toaster',
    description:
      'Live region for toasts: auto-dismiss, pause on hover/focus, filled by OOB swap or the cv-toast trigger.',
    formAssociated: false,
    attributes: [['duration', 'number', 'Milliseconds before a toast dismisses (0: never).']],
    events: [['cv-toast-dismiss', 'A toast was dismissed.']],
  },
  {
    tag: 'cv-data-table',
    className: 'CvDataTable',
    module: 'data-table',
    description:
      'Data table: header sort cycles aria-sort and fires cv-sort (server or client sort); row checkboxes with tri-state select-all and a selected count.',
    formAssociated: false,
    attributes: [
      ['remote', 'boolean', 'The server sorts: rows are not reordered client-side.'],
      ['count-label', 'string', 'Selected-count text; `{count}` is replaced.'],
    ],
    events: [
      [
        'cv-sort',
        "A sortable header was activated. `detail: { key: string; direction: 'asc' | 'desc' | 'none' }`.",
      ],
      ['cv-selection-change', 'Row selection changed. `detail: { selected: string[] }`.'],
    ],
  },
  {
    tag: 'cv-drawer',
    className: 'CvDrawer',
    module: 'drawer',
    description:
      'Drawer: wraps the Drawer overlay/panel markup; Escape, backdrop click, inert focus trap, focus returns to the opener.',
    formAssociated: false,
    attributes: [
      ['open', 'boolean', 'Initial open state.'],
      ['side', "'start' | 'end' | 'top' | 'bottom'", 'Edge the panel slides from.'],
      ['static', 'boolean', 'A backdrop click does not close.'],
    ],
    events: [
      ['cv-open', 'The drawer opened.'],
      ['cv-close', 'The drawer closed.'],
    ],
  },
  {
    tag: 'cv-command-menu',
    className: 'CvCommandMenu',
    module: 'command-menu',
    description:
      'Command palette: a <dialog> opened by a shortcut with a filtering input over [role=option] rows; Enter activates the row (anchors and hx-get rows work).',
    formAssociated: false,
    attributes: [['shortcut', 'string', 'Open shortcut, e.g. `mod+k` (default).']],
    events: [
      ['cv-select', 'A row was activated. `detail: { value: string }`.'],
      ['cv-open', 'The palette opened.'],
      ['cv-close', 'The palette closed.'],
    ],
  },
  {
    tag: 'cv-theme',
    className: 'CvTheme',
    module: 'theme',
    description:
      'Theme or density switcher over a <select> or [data-cv-theme-value] buttons; sets an attribute on <html> and persists it.',
    formAssociated: false,
    attributes: [
      ['attribute', 'string', 'Attribute set on <html> (default `data-theme`).'],
      ['storage-key', 'string', 'localStorage key (default `cascade-theme`).'],
    ],
    events: [['cv-theme-change', 'The user picked a value. `detail: { value: string }`.']],
  },
  {
    tag: 'cv-tooltip',
    className: 'CvTooltip',
    module: 'tooltip',
    description:
      'Tooltip: shows the [role=tooltip][popover=manual] sibling on hover/focus after a delay; Escape dismisses.',
    formAssociated: false,
    attributes: [['delay', 'number', 'Milliseconds before showing (default 200).']],
    events: [],
  },
  {
    tag: 'cv-multi-select',
    className: 'CvMultiSelect',
    module: 'multi-select',
    description: 'Multi-select: chips plus a listbox panel; submits one form entry per value.',
    formAssociated: true,
    attributes: [
      ['name', 'string', 'Form field name.'],
      ['required', 'boolean', 'Reports valueMissing when empty.'],
      ['disabled', 'boolean', 'Disables the field.'],
      ['placeholder', 'string', 'Trigger text when empty.'],
      ['selected-label', 'string', 'Count template, `{count}`.'],
      ['remove-label', 'string', 'Chip remove label, `{label}`.'],
    ],
    events: [
      ['cv-value-change', 'The values changed. `detail: { value: string[] }`.'],
      ['input', 'Native, fired on the host.'],
      ['change', 'Native, fired on the host.'],
    ],
  },
  {
    tag: 'cv-tags-input',
    className: 'CvTagsInput',
    module: 'tags-input',
    description:
      'Tags input: Enter/comma/paste/blur add tags, Backspace removes the last; submits one entry per tag.',
    formAssociated: true,
    attributes: [
      ['name', 'string', 'Form field name.'],
      ['required', 'boolean', 'Reports valueMissing when empty.'],
      ['disabled', 'boolean', 'Disables the field.'],
      ['max', 'number', 'Maximum tag count.'],
      ['placeholder', 'string', 'Shown only while empty.'],
      ['remove-label', 'string', 'Dismiss label, `{label}`.'],
    ],
    events: [
      ['cv-value-change', 'The values changed. `detail: { value: string[] }`.'],
      ['input', 'Native, fired on the host.'],
      ['change', 'Native, fired on the host.'],
    ],
  },
]

export function customElementsManifest(): object {
  return {
    schemaVersion: '2.1.0',
    modules: ELEMENTS.map((e) => ({
      kind: 'javascript-module',
      path: `dist/${e.module}.js`,
      declarations: [
        {
          kind: 'class',
          name: e.className,
          tagName: e.tag,
          customElement: true,
          description: e.description,
          ...(e.formAssociated ? { formAssociated: true } : {}),
          attributes: e.attributes.map(([name, text, description]) => ({
            name,
            type: { text },
            description,
          })),
          events: e.events.map(([name, description]) => ({ name, description })),
        },
      ],
      exports: [
        { kind: 'js', name: e.className, declaration: { name: e.className } },
        { kind: 'js', name: 'define', declaration: { name: 'define' } },
        { kind: 'custom-element-definition', name: e.tag, declaration: { name: e.className } },
      ],
    })),
  }
}
