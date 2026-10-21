import {
  checkAction,
  checkChildList,
  checkCommonKey,
  checkComponentId,
  checkDynBool,
  checkDynNumber,
  checkDynString,
  checkDynStringList,
  unknownComponent,
  unknownProperty,
} from './catalog-spec'
import type { A2uiCatalogSpec, A2uiIssue } from './catalog-spec'
import { BASIC_CATALOG_ID, isRecord } from './messages'

type Kind =
  | 'dynString'
  | 'dynNumber'
  | 'dynBool'
  | 'dynStringList'
  | 'childList'
  | 'componentId'
  | 'action'
  | 'tabs'
  | 'options'
  | `enum:${string}`
  | `literal:${'string' | 'number' | 'boolean'}`

interface Row {
  readonly props: Readonly<Record<string, Kind>>
  readonly required: readonly string[]
  readonly checkable: boolean
}

const row = (props: Record<string, Kind>, required: string[] = [], checkable = false): Row => ({
  props,
  required,
  checkable,
})

const ALIGN = 'enum:start,center,end,stretch'
const JUSTIFY = 'enum:start,center,end,spaceBetween,spaceAround,spaceEvenly,stretch'

/** Hand copy of the A2UI v0.9 basic catalog; basic-spec.test.ts compares it with the vendored fixture. */
export const basicTable: Readonly<Record<string, Row>> = {
  Text: row({ text: 'dynString', variant: 'enum:h1,h2,h3,h4,h5,caption,body' }, ['text']),
  Image: row(
    {
      url: 'dynString',
      description: 'dynString',
      fit: 'enum:contain,cover,fill,none,scaleDown',
      variant: 'enum:icon,avatar,smallFeature,mediumFeature,largeFeature,header',
    },
    ['url'],
  ),
  // Icon.name is an enum of icon names or an SVG path binding; a dynamic string covers both.
  Icon: row({ name: 'dynString' }, ['name']),
  Video: row({ url: 'dynString' }, ['url']),
  AudioPlayer: row({ url: 'dynString', description: 'dynString' }, ['url']),
  Row: row({ children: 'childList', justify: JUSTIFY, align: ALIGN }, ['children']),
  Column: row({ children: 'childList', justify: JUSTIFY, align: ALIGN }, ['children']),
  List: row({ children: 'childList', direction: 'enum:vertical,horizontal', align: ALIGN }, [
    'children',
  ]),
  Card: row({ child: 'componentId' }, ['child']),
  Tabs: row({ tabs: 'tabs' }, ['tabs']),
  Modal: row({ trigger: 'componentId', content: 'componentId' }, ['trigger', 'content']),
  Divider: row({ axis: 'enum:horizontal,vertical' }),
  Button: row(
    {
      child: 'componentId',
      variant: 'enum:default,primary,borderless',
      action: 'action',
    },
    ['child', 'action'],
    true,
  ),
  TextField: row(
    {
      label: 'dynString',
      value: 'dynString',
      variant: 'enum:longText,number,shortText,obscured',
      validationRegexp: 'literal:string',
    },
    ['label'],
    true,
  ),
  CheckBox: row({ label: 'dynString', value: 'dynBool' }, ['label', 'value'], true),
  ChoicePicker: row(
    {
      label: 'dynString',
      variant: 'enum:multipleSelection,mutuallyExclusive',
      options: 'options',
      value: 'dynStringList',
      displayStyle: 'enum:checkbox,chips',
      filterable: 'literal:boolean',
    },
    ['options', 'value'],
    true,
  ),
  Slider: row(
    { label: 'dynString', min: 'literal:number', max: 'literal:number', value: 'dynNumber' },
    ['value', 'max'],
    true,
  ),
  DateTimeInput: row(
    {
      value: 'dynString',
      enableDate: 'literal:boolean',
      enableTime: 'literal:boolean',
      min: 'dynString',
      max: 'dynString',
      label: 'dynString',
    },
    ['value'],
    true,
  ),
}

function checkTabs(value: unknown): string | undefined {
  const ok =
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (tab) =>
        isRecord(tab) &&
        Object.keys(tab).every((k) => k === 'title' || k === 'child') &&
        checkDynString(tab['title']) === undefined &&
        Object.hasOwn(tab, 'title') &&
        checkComponentId(tab['child']) === undefined,
    )
  return ok ? undefined : 'expected a non-empty array of {title, child}'
}

function checkOptions(value: unknown): string | undefined {
  const ok =
    Array.isArray(value) &&
    value.every(
      (option) =>
        isRecord(option) &&
        Object.keys(option).every((k) => k === 'label' || k === 'value') &&
        Object.hasOwn(option, 'label') &&
        checkDynString(option['label']) === undefined &&
        typeof option['value'] === 'string',
    )
  return ok ? undefined : 'expected an array of {label, value}'
}

function checkKind(kind: Kind, value: unknown): string | undefined {
  if (kind.startsWith('enum:')) {
    const allowed = kind.slice(5).split(',')
    return typeof value === 'string' && allowed.includes(value)
      ? undefined
      : `expected one of: ${allowed.join(', ')}`
  }
  if (kind.startsWith('literal:')) {
    const type = kind.slice(8)
    return typeof value === type && (type !== 'number' || Number.isFinite(value))
      ? undefined
      : `expected a ${type}`
  }
  switch (kind) {
    case 'dynString':
      return checkDynString(value)
    case 'dynNumber':
      return checkDynNumber(value)
    case 'dynBool':
      return checkDynBool(value)
    case 'dynStringList':
      return checkDynStringList(value)
    case 'childList':
      return checkChildList(value)
    case 'componentId':
      return checkComponentId(value)
    case 'action':
      return checkAction(value)
    case 'tabs':
      return checkTabs(value)
    default:
      return checkOptions(value)
  }
}

export const basicCatalogSpec: A2uiCatalogSpec = {
  id: BASIC_CATALOG_ID,
  has: (component) => Object.hasOwn(basicTable, component),
  validate(c) {
    const spec = Object.hasOwn(basicTable, c.component) ? basicTable[c.component] : undefined
    if (spec === undefined) return [unknownComponent(c.component)]
    const issues: A2uiIssue[] = []
    const known = [...Object.keys(spec.props), 'accessibility', 'weight']
    if (spec.checkable) known.push('checks')

    for (const [key, value] of Object.entries(c.props)) {
      const common = checkCommonKey(key, value, { checks: spec.checkable, weight: true })
      if (common !== undefined) {
        if (common !== null) issues.push({ prop: key, message: `Invalid "${key}": ${common}.` })
        continue
      }
      const kind = Object.hasOwn(spec.props, key) ? spec.props[key] : undefined
      if (kind === undefined) {
        issues.push(unknownProperty(key, known))
        continue
      }
      const reason = checkKind(kind, value)
      if (reason !== undefined) issues.push({ prop: key, message: `Invalid "${key}": ${reason}.` })
    }
    for (const name of spec.required) {
      if (!Object.hasOwn(c.props, name)) {
        issues.push({ prop: name, message: `Missing required property "${name}".` })
      }
    }
    return issues
  },
}
