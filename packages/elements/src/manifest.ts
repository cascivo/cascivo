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
