'use client'
// The A2UI v0.9 basic catalog drawn with cascivo components. The store has already validated
// every component against `basicCatalogSpec`, so the raw shapes read here (ids, tabs, options)
// are known; every value an agent can bind still goes through `input.prop`/`input.resolve`.
//
// Budget rules (see `split` in surface.tsx): each adapter calls `slot()`/`children()` at most
// once, synchronously in its own body, and places every returned node exactly once. Basic
// `child`/`trigger`/`content`/`tabs[i].child` are component ids, so they go through one
// `children([...ids])` call; a Row/Column/List `children` ChildList goes through `slot()`.
import { useId, useSignal } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Flex,
  Heading,
  Image,
  Input,
  Link,
  Modal,
  NumberInput,
  Select,
  Separator,
  Slider,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Textarea,
  TimePicker,
  VisuallyHidden,
} from '@cascivo/react'
import type { ButtonProps, FlexProps, HeadingLevel } from '@cascivo/react'
import type { ReactNode } from 'react'
import { isSafeUrl } from '../prop-check'
import { BASIC_CATALOG_ID, isRecord } from './messages'
import type { A2uiAdapter, AdapterInput, A2uiRenderCatalog } from './surface'

const hasOwn = (record: object, key: string): boolean => Object.hasOwn(record, key)

/** `table[key]` for an own key only, so an agent's `__proto__` or `constructor` maps to nothing. */
function lookup<V>(table: Readonly<Record<string, V>>, key: unknown): V | undefined {
  return typeof key === 'string' && hasOwn(table, key) ? table[key] : undefined
}

/** Text to render: a string, or a number as a string; anything else bound in is dropped. */
function str(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  return typeof value === 'number' ? String(value) : undefined
}

/**
 * A media URL. `prop('url')` already drops an unsafe one and the store refuses unsafe literals;
 * checked again here because this is the sink.
 */
function urlOf(input: AdapterInput): string | undefined {
  const url = input.prop('url')
  return typeof url === 'string' && isSafeUrl(url) ? url : undefined
}

/** The component ids the store validated, read from the raw props. */
function idOf(input: AdapterInput, name: string): string[] {
  const value = input.component.props[name]
  return typeof value === 'string' ? [value] : []
}

/** `{ [key]: value }` when value is defined, for `exactOptionalPropertyTypes` props. */
function opt<K extends string, V>(key: K, value: V | undefined): { [P in K]?: V } {
  return (value === undefined ? {} : { [key]: value }) as { [P in K]?: V }
}

// ---- Display ----------------------------------------------------------------------------------

const HEADING_LEVELS: Readonly<Record<string, HeadingLevel>> = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5 }

const text: A2uiAdapter = (input) => {
  // Verbatim: no Markdown in T2, so an agent's `**` or `#` reaches the screen as typed.
  const value = str(input.prop('text')) ?? ''
  const variant = input.prop('variant')
  const level = lookup(HEADING_LEVELS, variant)
  if (level !== undefined) return <Heading level={level}>{value}</Heading>
  if (variant === 'caption') {
    return (
      <Text size="sm" muted>
        {value}
      </Text>
    )
  }
  return <Text>{value}</Text>
}

/** The resolved `accessibility.label`, when it is text. */
function a11yLabel(input: AdapterInput): string | undefined {
  const a11y = input.prop('accessibility')
  return isRecord(a11y) ? str(a11y['label']) : undefined
}

const image: A2uiAdapter = (input) => {
  const url = urlOf(input)
  if (url === undefined) return null
  // `fit` and `variant` have no cascivo equivalent yet; an image with neither an accessibility
  // label nor a description is decorative.
  return <Image src={url} alt={a11yLabel(input) ?? str(input.prop('description')) ?? ''} />
}

const icon: A2uiAdapter = (input) => {
  // The same message for every Icon, so the surface reports it once, however many there are.
  input.report(
    'UNSUPPORTED_COMPONENT',
    'Icon is not supported by the cascivo renderer; Icons are not rendered.',
  )
  return null
}

/** Video and AudioPlayer: no player in T2, so a link that opens the media in a new tab. */
const media: A2uiAdapter = (input) => {
  const url = urlOf(input)
  if (url === undefined) return null
  return (
    <Link href={url} external>
      {str(input.prop('description')) ?? t(builtin.a2ui.openMedia)}
    </Link>
  )
}

// ---- Layout -----------------------------------------------------------------------------------

type Justify = NonNullable<FlexProps['justify']>
type Align = NonNullable<FlexProps['align']>

// Flex has no around/evenly/stretch on the main axis: the nearest it has.
const JUSTIFY: Readonly<Record<string, Justify>> = {
  start: 'start',
  center: 'center',
  end: 'end',
  spaceBetween: 'between',
  spaceAround: 'between',
  spaceEvenly: 'between',
  stretch: 'start',
}
const ALIGN: Readonly<Record<string, Align>> = {
  start: 'start',
  center: 'center',
  end: 'end',
  stretch: 'stretch',
}

function flex(input: AdapterInput, direction: 'horizontal' | 'vertical'): ReactNode {
  return (
    <Flex
      direction={direction}
      {...opt('justify', lookup(JUSTIFY, input.prop('justify')))}
      {...opt('align', lookup(ALIGN, input.prop('align')))}
    >
      {input.slot('children')}
    </Flex>
  )
}

const row: A2uiAdapter = (input) => flex(input, 'horizontal')
const column: A2uiAdapter = (input) => flex(input, 'vertical')
const list: A2uiAdapter = (input) =>
  flex(input, input.prop('direction') === 'horizontal' ? 'horizontal' : 'vertical')

const card: A2uiAdapter = (input) => <Card>{input.children(idOf(input, 'child'))}</Card>

const tabs: A2uiAdapter = (input) => {
  const raw = input.component.props['tabs']
  const entries = Array.isArray(raw) ? raw.filter(isRecord) : []
  const panels = input.children(
    entries.map((tab) => (typeof tab['child'] === 'string' ? tab['child'] : '')),
  )
  return (
    <Tabs defaultValue="tab-0">
      <TabsList>
        {entries.map((tab, i) => (
          <TabsTrigger key={i} value={`tab-${i}`}>
            {str(input.resolve(tab['title'])) ?? ''}
          </TabsTrigger>
        ))}
      </TabsList>
      {panels.map((panel, i) => (
        <TabsContent key={i} value={`tab-${i}`}>
          {panel}
        </TabsContent>
      ))}
    </Tabs>
  )
}

/** Holds its open state in a signal; a hook, so it runs in the node's own component. */
function ModalAdapter(input: AdapterInput): ReactNode {
  const open = useSignal(false)
  const triggerId = idOf(input, 'trigger')
  const [trigger, content] = input.children([...triggerId, ...idOf(input, 'content')])
  // A dialog needs a name (WCAG 4.1.2), and Modal is named only through its title.
  const title = a11yLabel(input) ?? t(builtin.a2ui.dialog)
  const show = (): void => {
    open.value = true
  }
  const isButton = triggerId[0] !== undefined && input.typeOf(triggerId[0]) === 'Button'
  return (
    <>
      {isButton ? (
        // The Button's click bubbles here, from a pointer or from Enter and Space alike;
        // `display: contents` keeps the wrapper out of the layout.
        <div style={{ display: 'contents' }} onClick={show}>
          {trigger}
        </div>
      ) : (
        // Anything else is not operable from the keyboard (WCAG 2.1.1), so the wrapper is the
        // button. No `display: contents` here: it can drop the element from the focus order.
        <div
          role="button"
          tabIndex={0}
          aria-haspopup="dialog"
          onClick={show}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return
            e.preventDefault()
            show()
          }}
        >
          {trigger}
        </div>
      )}
      <Modal
        open={open.value}
        onClose={() => {
          open.value = false
        }}
        title={title}
      >
        {content}
      </Modal>
    </>
  )
}

const divider: A2uiAdapter = (input) => (
  <Separator orientation={input.prop('axis') === 'vertical' ? 'vertical' : 'horizontal'} />
)

// ---- Input ------------------------------------------------------------------------------------

const BUTTON_VARIANTS: Readonly<Record<string, NonNullable<ButtonProps['variant']>>> = {
  primary: 'primary',
  default: 'secondary',
  borderless: 'ghost',
}

/**
 * The text an icon-only button is named by (WCAG 4.1.2): Icons render nothing here, so the
 * icon's name, split into words (`shoppingCart` → "shopping cart").
 */
function iconName(input: AdapterInput, id: string | undefined): string | undefined {
  if (id === undefined || input.typeOf(id) !== 'Icon') return undefined
  const name = str(input.resolve(input.componentOf(id)?.props['name']))
  return name?.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
}

const button: A2uiAdapter = (input) => {
  const childId = idOf(input, 'child')
  const [label] = input.children(childId)
  const ariaLabel = a11yLabel(input)
  const hidden = ariaLabel === undefined ? iconName(input, childId[0]) : undefined
  return (
    <Button
      variant={lookup(BUTTON_VARIANTS, input.prop('variant')) ?? 'secondary'}
      disabled={input.failingChecks().length > 0}
      {...opt('aria-label', ariaLabel)}
      {...opt('onClick', input.action('action'))}
    >
      {label}
      {hidden !== undefined && <VisuallyHidden>{hidden}</VisuallyHidden>}
    </Button>
  )
}

/** The first failing check's message, or the localized invalid text when `pattern` fails. */
function fieldError(input: AdapterInput, value: string): string | undefined {
  const failing = input.failingChecks()[0]
  if (failing !== undefined) return failing
  const pattern = input.component.props['validationRegexp']
  if (typeof pattern !== 'string' || value === '') return undefined
  // Through the `regex` function, so a pattern gets the same safety checks and caps as a check's.
  // A refused pattern returns false: it fails closed, every non-empty value reads as invalid.
  const ok = input.resolve({ call: 'regex', args: { value, pattern } })
  return ok === true ? undefined : t(builtin.a2ui.invalid)
}

const textField: A2uiAdapter = (input) => {
  const label = str(input.prop('label'))
  const value = str(input.prop('value')) ?? ''
  const write = input.writer('value')
  const variant = input.prop('variant')
  const common = { ...opt('label', label), ...opt('error', fieldError(input, value)) }

  if (variant === 'number') {
    const parsed = value.trim() === '' ? null : Number(value)
    const n = parsed !== null && Number.isFinite(parsed) ? parsed : null
    return write === undefined ? (
      <NumberInput {...common} {...opt('defaultValue', n ?? undefined)} />
    ) : (
      <NumberInput
        {...common}
        value={n}
        onValueChange={(next) => write(next === null ? '' : String(next))}
      />
    )
  }
  if (variant === 'longText') {
    return write === undefined ? (
      <Textarea {...common} defaultValue={value} />
    ) : (
      <Textarea {...common} value={value} onChange={(e) => write(e.currentTarget.value)} />
    )
  }
  const type = variant === 'obscured' ? 'password' : 'text'
  return write === undefined ? (
    <Input {...common} type={type} defaultValue={value} />
  ) : (
    <Input {...common} type={type} value={value} onChange={(e) => write(e.currentTarget.value)} />
  )
}

const checkBox: A2uiAdapter = (input) => {
  const label = str(input.prop('label'))
  const checked = input.prop('value') === true
  const write = input.writer('value')
  return write === undefined ? (
    <Checkbox {...opt('label', label)} defaultChecked={checked} />
  ) : (
    <Checkbox
      {...opt('label', label)}
      checked={checked}
      onChange={(e) => write(e.currentTarget.checked)}
    />
  )
}

/** A hook (`useId`), so it runs in the node's own component. */
function ChoicePickerAdapter(input: AdapterInput): ReactNode {
  const labelId = useId('cascivo-a2ui-choice')
  const label = str(input.prop('label'))
  const raw = input.component.props['options']
  const options = (Array.isArray(raw) ? raw.filter(isRecord) : []).map((option) => {
    const value = typeof option['value'] === 'string' ? option['value'] : ''
    return { value, label: str(input.resolve(option['label'])) ?? value }
  })
  const bound = input.prop('value')
  const selected = Array.isArray(bound)
    ? bound.filter((v): v is string => typeof v === 'string')
    : []
  const write = input.writer('value')
  const error = input.failingChecks()[0]

  if (input.prop('variant') === 'multipleSelection') {
    return (
      <Flex
        direction="vertical"
        role="group"
        {...opt('aria-labelledby', label ? labelId : undefined)}
        {...opt('aria-describedby', error === undefined ? undefined : `${labelId}-error`)}
      >
        {label !== undefined && (
          <Text as="span" id={labelId}>
            {label}
          </Text>
        )}
        {options.map((option, i) => {
          const checked = selected.includes(option.value)
          return write === undefined ? (
            <Checkbox key={i} label={option.label} defaultChecked={checked} />
          ) : (
            <Checkbox
              key={i}
              label={option.label}
              checked={checked}
              onChange={(e) => {
                const rest = selected.filter((v) => v !== option.value)
                write(e.currentTarget.checked ? [...rest, option.value] : rest)
              }}
            />
          )
        })}
        {/* No group error part in cascivo: announced the way its field errors are. */}
        {error !== undefined && (
          <Text as="span" size="sm" role="alert" id={`${labelId}-error`}>
            {error}
          </Text>
        )}
      </Flex>
    )
  }
  // With nothing selected a controlled `value=""` matches no option, so the browser shows the
  // first one as chosen and it cannot be picked; the placeholder is the empty option instead.
  const common = {
    ...opt('label', label),
    ...opt('error', error),
    ...opt('placeholder', selected[0] === undefined ? t(builtin.a2ui.choose) : undefined),
    options,
  }
  return write === undefined ? (
    <Select {...common} defaultValue={selected[0] ?? ''} />
  ) : (
    <Select
      {...common}
      value={selected[0] ?? ''}
      onChange={(e) => write([e.currentTarget.value])}
    />
  )
}

const slider: A2uiAdapter = (input) => {
  const value = input.prop('value')
  const min = input.prop('min')
  const max = input.prop('max')
  const common = {
    ...opt('label', str(input.prop('label'))),
    ...opt('min', typeof min === 'number' ? min : undefined),
    ...opt('max', typeof max === 'number' ? max : undefined),
  }
  // A range input clamps to its min, so an unset value starts there.
  const n = typeof value === 'number' ? value : typeof min === 'number' ? min : 0
  const write = input.writer('value')
  return write === undefined ? (
    <Slider {...common} defaultValue={n} />
  ) : (
    <Slider {...common} value={n} onChange={(e) => write(Number(e.currentTarget.value))} />
  )
}

const DATE = /^(\d{4}-\d{2}-\d{2})/
const TIME = /(?:^|T)(\d{2}:\d{2})/

/** The date (`YYYY-MM-DD`) and time (`HH:mm`) parts of an ISO-like value, when present. */
function parts(value: unknown): { date?: string; time?: string } {
  if (typeof value !== 'string') return {}
  return { ...opt('date', DATE.exec(value)?.[1]), ...opt('time', TIME.exec(value)?.[1]) }
}

/** `YYYY-MM-DDTHH:mm` when both are set, else whichever is, else ''. */
function combine(date: string | undefined, time: string | undefined): string {
  if (date && time) return `${date}T${time}`
  return date || time || ''
}

const dateTimeInput: A2uiAdapter = (input) => {
  const label = str(input.prop('label'))
  const { date, time } = parts(input.prop('value'))
  const min = parts(input.prop('min'))
  const max = parts(input.prop('max'))
  const write = input.writer('value')
  const error = input.failingChecks()[0]
  const withTime = input.prop('enableTime') === true
  // Neither flag set reads as a date: the mapping has no "nothing to pick".
  const withDate = input.prop('enableDate') === true || !withTime

  const datePicker = (
    <DatePicker
      {...opt('label', label)}
      {...opt('error', error)}
      {...opt('min', min.date)}
      {...opt('max', max.date)}
      {...(write === undefined
        ? opt('defaultValue', date)
        : {
            // '' and not undefined: undefined would turn the picker uncontrolled, keeping a stale date.
            value: date ?? '',
            onValueChange: (next: string | undefined) =>
              write(combine(next, withTime ? time : undefined)),
          })}
    />
  )
  const timePicker = (
    <TimePicker
      // Beside a DatePicker the visible label is the DatePicker's; this one gets its own name,
      // the label and "Time", so the two fields do not announce alike.
      {...(withDate
        ? opt(
            'ariaLabel',
            label === undefined ? t(builtin.a2ui.time) : `${label}, ${t(builtin.a2ui.time)}`,
          )
        : opt('label', label))}
      {...(withDate ? {} : opt('error', error))}
      {...opt('min', min.time)}
      {...opt('max', max.time)}
      {...(write === undefined
        ? opt('defaultValue', time)
        : {
            value: time ?? '',
            onValueChange: (next: string) =>
              write(combine(withDate ? date : undefined, next || undefined)),
          })}
    />
  )
  if (withDate && withTime) {
    return (
      <Flex direction="horizontal" wrap>
        {datePicker}
        {timePicker}
      </Flex>
    )
  }
  return withTime ? timePicker : datePicker
}

// ---- The catalog ------------------------------------------------------------------------------

const ADAPTERS: Readonly<Record<string, A2uiAdapter>> = {
  Text: text,
  Image: image,
  Icon: icon,
  Video: media,
  AudioPlayer: media,
  Row: row,
  Column: column,
  List: list,
  Card: card,
  Tabs: tabs,
  Modal: ModalAdapter,
  Divider: divider,
  Button: button,
  TextField: textField,
  CheckBox: checkBox,
  ChoicePicker: ChoicePickerAdapter,
  Slider: slider,
  DateTimeInput: dateTimeInput,
}

/** The A2UI v0.9 basic catalog, every component drawn with its cascivo counterpart. */
export const basicCatalog: A2uiRenderCatalog = {
  id: BASIC_CATALOG_ID,
  adapter: (component) => lookup(ADAPTERS, component),
}
