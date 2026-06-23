// generated — do not edit (scripts/schema/generate.ts)
// Per-component prop schemas for the render-time conformance validator (v40 T2).

export type PropPrimitive = 'string' | 'number' | 'boolean' | 'null'

export interface PropSchema {
  name: string
  required: boolean
  /** Allowed values when the prop is a string-literal union. */
  enum?: string[]
  /** Allowed primitive `typeof`s when the prop is a primitive (union). */
  primitives?: PropPrimitive[]
}

export const propSchemas: Record<string, PropSchema[]> = {
  Accordion: [
    {
      name: 'type',
      required: false,
      enum: ['single', 'multiple'],
    },
    {
      name: 'defaultValue',
      required: false,
    },
    {
      name: 'value',
      required: false,
    },
    {
      name: 'onValueChange',
      required: false,
    },
  ],
  ActionSheet: [
    {
      name: 'open',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'defaultOpen',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onOpenChange',
      required: false,
    },
    {
      name: 'actions',
      required: true,
    },
    {
      name: 'title',
      required: false,
    },
    {
      name: 'description',
      required: false,
    },
    {
      name: 'showCancel',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'labels',
      required: false,
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Alert: [
    {
      name: 'variant',
      required: false,
      enum: ['default', 'info', 'success', 'warning', 'destructive'],
    },
    {
      name: 'title',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'icon',
      required: false,
    },
    {
      name: 'dismissible',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onDismiss',
      required: false,
    },
    {
      name: 'action',
      required: false,
    },
  ],
  AlertDialog: [],
  AppShell: [
    {
      name: 'header',
      required: true,
    },
    {
      name: 'nav',
      required: false,
    },
    {
      name: 'children',
      required: true,
    },
    {
      name: 'footer',
      required: false,
    },
    {
      name: 'open',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'defaultOpen',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onOpenChange',
      required: false,
    },
  ],
  AreaChart: [
    {
      name: 'series',
      required: true,
    },
    {
      name: 'x',
      required: true,
    },
    {
      name: 'y',
      required: true,
    },
    {
      name: 'title',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'stacked',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'curve',
      required: false,
      enum: ['linear', 'monotone'],
    },
    {
      name: 'width',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'xTicks',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'yTicks',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'legend',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'tooltip',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'plain',
      required: false,
      primitives: ['boolean'],
    },
  ],
  AspectRatio: [
    {
      name: 'ratio',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'children',
      required: false,
    },
  ],
  AuthLayout: [
    {
      name: 'children',
      required: true,
    },
    {
      name: 'logo',
      required: false,
    },
  ],
  AutoGrid: [
    {
      name: 'min',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'gap',
      required: false,
    },
  ],
  Avatar: [
    {
      name: 'src',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'alt',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'fallback',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'size',
      required: false,
      enum: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      name: 'status',
      required: false,
      enum: ['online', 'offline', 'busy'],
    },
  ],
  AvatarGroup: [
    {
      name: 'max',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'total',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'spacing',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'isGrid',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'labels',
      required: false,
    },
  ],
  Badge: [
    {
      name: 'variant',
      required: false,
      enum: ['default', 'secondary', 'success', 'warning', 'destructive', 'outline'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md'],
    },
  ],
  BarChart: [
    {
      name: 'series',
      required: true,
    },
    {
      name: 'x',
      required: true,
    },
    {
      name: 'y',
      required: true,
    },
    {
      name: 'title',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'orientation',
      required: false,
      enum: ['vertical', 'horizontal'],
    },
    {
      name: 'mode',
      required: false,
      enum: ['grouped', 'stacked'],
    },
    {
      name: 'width',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'xTicks',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'yTicks',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'legend',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'plain',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Blockquote: [
    {
      name: 'cite',
      required: false,
      primitives: ['string'],
    },
  ],
  BottomSheet: [
    {
      name: 'open',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'defaultOpen',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onOpenChange',
      required: false,
    },
    {
      name: 'snapPoints',
      required: false,
    },
    {
      name: 'activeSnap',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'defaultSnap',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'onSnapChange',
      required: false,
    },
    {
      name: 'title',
      required: false,
    },
    {
      name: 'description',
      required: false,
    },
    {
      name: 'children',
      required: false,
    },
    {
      name: 'labels',
      required: false,
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Boxplot: [
    {
      name: 'series',
      required: true,
    },
    {
      name: 'title',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'width',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'plain',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Breadcrumb: [
    {
      name: 'items',
      required: true,
    },
    {
      name: 'maxVisible',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'ariaLabel',
      required: false,
      primitives: ['string'],
    },
  ],
  BubbleChart: [
    {
      name: 'series',
      required: true,
    },
    {
      name: 'title',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'width',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'tooltip',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'plain',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Bullet: [
    {
      name: 'value',
      required: true,
      primitives: ['number'],
    },
    {
      name: 'target',
      required: true,
      primitives: ['number'],
    },
    {
      name: 'ranges',
      required: true,
    },
    {
      name: 'label',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'min',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'max',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'width',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Button: [
    {
      name: 'variant',
      required: false,
      enum: ['primary', 'secondary', 'ghost', 'destructive'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'loading',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'asChild',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onClick',
      required: false,
    },
  ],
  ButtonGroup: [
    {
      name: 'orientation',
      required: false,
      enum: ['horizontal', 'vertical'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'roving',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'loop',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'aria-label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'aria-labelledby',
      required: false,
      primitives: ['string'],
    },
  ],
  Calendar: [
    {
      name: 'value',
      required: false,
    },
    {
      name: 'defaultValue',
      required: false,
    },
    {
      name: 'onValueChange',
      required: false,
    },
    {
      name: 'min',
      required: false,
    },
    {
      name: 'max',
      required: false,
    },
    {
      name: 'disabled',
      required: false,
    },
    {
      name: 'locale',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'labels',
      required: false,
    },
    {
      name: 'month',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'year',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'onViewChange',
      required: false,
    },
    {
      name: 'hideNav',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Card: [
    {
      name: 'variant',
      required: false,
      enum: ['default', 'outlined', 'elevated'],
    },
    {
      name: 'padding',
      required: false,
      enum: ['none', 'sm', 'md', 'lg'],
    },
  ],
  Carousel: [
    {
      name: 'children',
      required: false,
    },
    {
      name: 'slides',
      required: false,
    },
    {
      name: 'index',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'defaultIndex',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'onIndexChange',
      required: false,
    },
    {
      name: 'loop',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Center: [
    {
      name: 'maxWidth',
      required: false,
      primitives: ['string'],
    },
  ],
  ChatBubble: [
    {
      name: 'children',
      required: true,
    },
    {
      name: 'side',
      required: false,
      enum: ['start', 'end'],
    },
    {
      name: 'avatar',
      required: false,
    },
    {
      name: 'name',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'time',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Checkbox: [
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'checked',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'indeterminate',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onChange',
      required: false,
    },
  ],
  CheckboxCard: [
    {
      name: 'title',
      required: true,
    },
    {
      name: 'description',
      required: false,
    },
    {
      name: 'checked',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'defaultChecked',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onCheckedChange',
      required: false,
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Code: [
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md'],
    },
  ],
  CodeSnippet: [],
  Collapsible: [
    {
      name: 'open',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'defaultOpen',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onOpenChange',
      required: false,
    },
    {
      name: 'trigger',
      required: true,
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'children',
      required: false,
    },
  ],
  ColorPicker: [
    {
      name: 'value',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'defaultValue',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'onValueChange',
      required: false,
    },
    {
      name: 'presets',
      required: false,
    },
    {
      name: 'alpha',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
  ],
  Columns: [
    {
      name: 'count',
      required: false,
    },
    {
      name: 'gap',
      required: false,
    },
  ],
  ComboChart: [
    {
      name: 'bars',
      required: true,
    },
    {
      name: 'line',
      required: true,
    },
    {
      name: 'title',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'secondAxis',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'width',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'tooltip',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'plain',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Combobox: [
    {
      name: 'options',
      required: true,
    },
    {
      name: 'value',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'defaultValue',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'onChange',
      required: false,
    },
    {
      name: 'clearable',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'searchable',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'hint',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'error',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'labels',
      required: false,
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  CommandMenu: [
    {
      name: 'open',
      required: true,
      primitives: ['boolean'],
    },
    {
      name: 'onOpenChange',
      required: true,
    },
    {
      name: 'groups',
      required: true,
    },
    {
      name: 'placeholder',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'emptyLabel',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'hotkey',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'loading',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onQueryChange',
      required: false,
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Comparison: [
    {
      name: 'after',
      required: true,
    },
    {
      name: 'before',
      required: true,
    },
    {
      name: 'position',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'defaultPosition',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'onPositionChange',
      required: false,
    },
    {
      name: 'orientation',
      required: false,
      enum: ['horizontal', 'vertical'],
    },
    {
      name: 'keyboardStep',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
  ],
  ConsoleApp: [],
  ContainedList: [
    {
      name: 'label',
      required: true,
    },
    {
      name: 'kind',
      required: false,
      enum: ['on-page', 'disclosed'],
    },
    {
      name: 'action',
      required: false,
    },
  ],
  ContextMenu: [],
  CopyButton: [
    {
      name: 'value',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md'],
    },
    {
      name: 'labels',
      required: false,
    },
  ],
  Cta: [
    {
      name: 'title',
      required: true,
    },
    {
      name: 'description',
      required: false,
    },
    {
      name: 'actions',
      required: false,
    },
    {
      name: 'headingLevel',
      required: false,
    },
  ],
  DashboardCharts: [],
  DashboardLayout: [
    {
      name: 'stats',
      required: false,
    },
    {
      name: 'main',
      required: true,
    },
    {
      name: 'aside',
      required: false,
    },
  ],
  DataList: [
    {
      name: 'items',
      required: true,
    },
    {
      name: 'orientation',
      required: false,
      enum: ['horizontal', 'vertical'],
    },
    {
      name: 'dividers',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md'],
    },
  ],
  DataTable: [
    {
      name: 'columns',
      required: true,
    },
    {
      name: 'rows',
      required: true,
    },
    {
      name: 'getRowId',
      required: false,
    },
    {
      name: 'sort',
      required: false,
    },
    {
      name: 'defaultSort',
      required: false,
    },
    {
      name: 'sortMode',
      required: false,
      enum: ['client', 'server'],
    },
    {
      name: 'onSortChange',
      required: false,
    },
    {
      name: 'searchable',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'pagination',
      required: false,
    },
    {
      name: 'selection',
      required: false,
    },
    {
      name: 'batchActions',
      required: false,
    },
    {
      name: 'renderExpandedRow',
      required: false,
    },
    {
      name: 'density',
      required: false,
      enum: ['compact', 'normal', 'relaxed'],
    },
    {
      name: 'zebra',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'stickyHeader',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'loading',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'emptyState',
      required: false,
    },
    {
      name: 'title',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'labels',
      required: false,
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  DatePicker: [
    {
      name: 'value',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'defaultValue',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'onChange',
      required: false,
    },
    {
      name: 'min',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'max',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'clearable',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'hint',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'error',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'labels',
      required: false,
    },
  ],
  DateRangePicker: [
    {
      name: 'value',
      required: false,
    },
    {
      name: 'defaultValue',
      required: false,
    },
    {
      name: 'onValueChange',
      required: false,
    },
    {
      name: 'min',
      required: false,
    },
    {
      name: 'max',
      required: false,
    },
    {
      name: 'disabled',
      required: false,
    },
    {
      name: 'presets',
      required: false,
    },
    {
      name: 'locale',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'placeholder',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'labels',
      required: false,
    },
  ],
  Dock: [
    {
      name: 'items',
      required: true,
    },
    {
      name: 'activeIndex',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Drawer: [],
  Dropdown: [
    {
      name: 'trigger',
      required: true,
    },
    {
      name: 'items',
      required: true,
    },
    {
      name: 'onSelect',
      required: false,
    },
    {
      name: 'placement',
      required: false,
      enum: ['bottom-start', 'bottom-end'],
    },
    {
      name: 'open',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onOpenChange',
      required: false,
    },
  ],
  Editable: [
    {
      name: 'value',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'onValueChange',
      required: true,
    },
    {
      name: 'placeholder',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'submitOnBlur',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onCancel',
      required: false,
    },
  ],
  EmptyDashboard: [
    {
      name: 'onCreateItem',
      required: false,
    },
  ],
  EmptyState: [
    {
      name: 'icon',
      required: false,
    },
    {
      name: 'title',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'action',
      required: false,
    },
    {
      name: 'size',
      required: false,
      enum: ['md', 'lg'],
    },
  ],
  Fab: [
    {
      name: 'children',
      required: true,
    },
    {
      name: 'label',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'onClick',
      required: false,
    },
    {
      name: 'actions',
      required: false,
    },
    {
      name: 'position',
      required: false,
      enum: ['bottom-end', 'bottom-start'],
    },
    {
      name: 'open',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'defaultOpen',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onOpenChange',
      required: false,
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  FeatureGrid: [
    {
      name: 'items',
      required: true,
    },
    {
      name: 'title',
      required: false,
    },
    {
      name: 'description',
      required: false,
    },
    {
      name: 'headingLevel',
      required: false,
    },
    {
      name: 'min',
      required: false,
      primitives: ['string'],
    },
  ],
  Field: [
    {
      name: 'label',
      required: false,
    },
    {
      name: 'description',
      required: false,
    },
    {
      name: 'error',
      required: false,
    },
    {
      name: 'required',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'id',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'children',
      required: true,
    },
  ],
  FileUploader: [
    {
      name: 'files',
      required: false,
    },
    {
      name: 'onFilesAdded',
      required: false,
    },
    {
      name: 'onRemove',
      required: false,
    },
    {
      name: 'multiple',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'accept',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'maxSize',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'onRejected',
      required: false,
    },
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'hint',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'labels',
      required: false,
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Filter: [
    {
      name: 'options',
      required: true,
    },
    {
      name: 'value',
      required: false,
    },
    {
      name: 'defaultValue',
      required: false,
    },
    {
      name: 'onChange',
      required: false,
    },
    {
      name: 'multi',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'variant',
      required: false,
      enum: ['pill', 'outline'],
    },
  ],
  Form: [
    {
      name: 'form',
      required: true,
    },
    {
      name: 'onValid',
      required: true,
    },
    {
      name: 'children',
      required: true,
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Grid: [
    {
      name: 'cols',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'gap',
      required: false,
    },
    {
      name: 'span',
      required: false,
      primitives: ['number'],
    },
  ],
  Header: [
    {
      name: 'brand',
      required: false,
    },
    {
      name: 'links',
      required: false,
    },
    {
      name: 'actions',
      required: false,
    },
    {
      name: 'sticky',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  HeaderPanel: [
    {
      name: 'open',
      required: true,
      primitives: ['boolean'],
    },
    {
      name: 'onClose',
      required: true,
    },
    {
      name: 'label',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'children',
      required: true,
    },
    {
      name: 'labels',
      required: false,
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Heading: [
    {
      name: 'level',
      required: false,
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg', 'xl', '2xl'],
    },
  ],
  Heatmap: [
    {
      name: 'data',
      required: true,
    },
    {
      name: 'title',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'width',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'plain',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Hero: [
    {
      name: 'variant',
      required: false,
      enum: ['centered', 'split'],
    },
    {
      name: 'title',
      required: true,
    },
    {
      name: 'eyebrow',
      required: false,
    },
    {
      name: 'description',
      required: false,
    },
    {
      name: 'actions',
      required: false,
    },
    {
      name: 'media',
      required: false,
    },
    {
      name: 'headingLevel',
      required: false,
    },
  ],
  Histogram: [
    {
      name: 'data',
      required: true,
    },
    {
      name: 'bins',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'title',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'label',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'width',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'plain',
      required: false,
      primitives: ['boolean'],
    },
  ],
  HoverCard: [],
  IconButton: [
    {
      name: 'label',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'icon',
      required: false,
    },
    {
      name: 'variant',
      required: false,
      enum: ['ghost', 'outline', 'filled'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'asChild',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onClick',
      required: false,
    },
  ],
  Image: [
    {
      name: 'src',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'alt',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'fallbackSrc',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'width',
      required: false,
      primitives: ['string', 'number'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['string', 'number'],
    },
    {
      name: 'radius',
      required: false,
      enum: ['none', 'sm', 'md', 'lg', 'full'],
    },
    {
      name: 'zoom',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'removeWrapper',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'isBlurred',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Indicator: [
    {
      name: 'children',
      required: true,
    },
    {
      name: 'overlay',
      required: true,
    },
    {
      name: 'placement',
      required: false,
      enum: ['top-start', 'top-end', 'bottom-start', 'bottom-end'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  InlineLoading: [
    {
      name: 'status',
      required: true,
      enum: ['inactive', 'active', 'finished', 'error'],
    },
    {
      name: 'label',
      required: false,
    },
    {
      name: 'labels',
      required: false,
    },
  ],
  Input: [
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'hint',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'error',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'placeholder',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
  ],
  InputGroup: [
    {
      name: 'prefix',
      required: false,
    },
    {
      name: 'suffix',
      required: false,
    },
    {
      name: 'children',
      required: true,
    },
  ],
  Item: [
    {
      name: 'asChild',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'variant',
      required: false,
      enum: ['default', 'muted'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md'],
    },
  ],
  Join: [
    {
      name: 'children',
      required: true,
    },
    {
      name: 'orientation',
      required: false,
      enum: ['horizontal', 'vertical'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Kbd: [
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md'],
    },
  ],
  Kpi: [
    {
      name: 'value',
      required: true,
      primitives: ['string', 'number'],
    },
    {
      name: 'label',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'delta',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'deltaLabel',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'icon',
      required: false,
    },
    {
      name: 'sparkline',
      required: false,
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Label: [
    {
      name: 'htmlFor',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'asChild',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'required',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'children',
      required: true,
    },
    {
      name: 'labels',
      required: false,
    },
  ],
  LineChart: [
    {
      name: 'series',
      required: true,
    },
    {
      name: 'x',
      required: true,
    },
    {
      name: 'y',
      required: true,
    },
    {
      name: 'title',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'curve',
      required: false,
      enum: ['linear', 'monotone'],
    },
    {
      name: 'width',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'xTicks',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'yTicks',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'legend',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'tooltip',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'formatTooltip',
      required: false,
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'plain',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Link: [
    {
      name: 'variant',
      required: false,
      enum: ['standalone', 'inline'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'external',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'href',
      required: false,
      primitives: ['string'],
    },
  ],
  List: [
    {
      name: 'as',
      required: false,
      enum: ['ul', 'ol'],
    },
    {
      name: 'marker',
      required: false,
      enum: ['disc', 'decimal', 'none'],
    },
  ],
  LoginPage: [
    {
      name: 'onSubmit',
      required: false,
    },
  ],
  Masonry: [
    {
      name: 'cols',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'gap',
      required: false,
    },
  ],
  MediaMasonry: [
    {
      name: 'children',
      required: true,
    },
    {
      name: 'title',
      required: false,
    },
    {
      name: 'description',
      required: false,
    },
    {
      name: 'headingLevel',
      required: false,
    },
    {
      name: 'cols',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'gap',
      required: false,
    },
  ],
  Menu: [],
  MenuButton: [
    {
      name: 'label',
      required: true,
    },
    {
      name: 'items',
      required: true,
    },
    {
      name: 'variant',
      required: false,
      enum: ['primary', 'secondary', 'ghost'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'align',
      required: false,
      enum: ['start', 'end'],
    },
    {
      name: 'labels',
      required: false,
    },
  ],
  Menubar: [
    {
      name: 'menus',
      required: true,
    },
    {
      name: 'aria-label',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Meter: [
    {
      name: 'value',
      required: true,
      primitives: ['number'],
    },
    {
      name: 'label',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'min',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'max',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'variant',
      required: false,
      enum: ['bar', 'gauge'],
    },
    {
      name: 'thresholds',
      required: false,
    },
    {
      name: 'width',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['number'],
    },
  ],
  Modal: [
    {
      name: 'open',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onClose',
      required: false,
    },
    {
      name: 'title',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'draggable',
      required: false,
      primitives: ['boolean'],
    },
  ],
  MultiSelect: [
    {
      name: 'options',
      required: true,
    },
    {
      name: 'value',
      required: true,
    },
    {
      name: 'onValueChange',
      required: true,
    },
    {
      name: 'placeholder',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'labels',
      required: false,
    },
  ],
  NativeSelect: [],
  NavigationMenu: [
    {
      name: 'items',
      required: true,
    },
    {
      name: 'aria-label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'orientation',
      required: false,
      enum: ['horizontal', 'vertical', 'both'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Notification: [
    {
      name: 'title',
      required: true,
    },
    {
      name: 'description',
      required: false,
    },
    {
      name: 'variant',
      required: false,
      enum: ['info', 'success', 'warning', 'error'],
    },
    {
      name: 'dismissible',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onDismiss',
      required: false,
    },
    {
      name: 'actions',
      required: false,
    },
    {
      name: 'icon',
      required: false,
    },
    {
      name: 'labels',
      required: false,
    },
  ],
  NotificationCenter: [
    {
      name: 'notifications',
      required: false,
    },
    {
      name: 'onMarkAllRead',
      required: false,
    },
  ],
  NumberInput: [
    {
      name: 'value',
      required: false,
      primitives: ['number', 'null'],
    },
    {
      name: 'defaultValue',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'onChange',
      required: false,
    },
    {
      name: 'min',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'max',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'step',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'precision',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'formatOptions',
      required: false,
    },
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'hint',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'error',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'incrementLabel',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'decrementLabel',
      required: false,
      primitives: ['string'],
    },
  ],
  OtpInput: [
    {
      name: 'length',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'value',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'onValueChange',
      required: true,
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'type',
      required: false,
      enum: ['numeric', 'alphanumeric'],
    },
  ],
  OverflowMenu: [
    {
      name: 'items',
      required: true,
    },
    {
      name: 'onSelect',
      required: false,
    },
    {
      name: 'placement',
      required: false,
      enum: ['bottom-start', 'bottom-end'],
    },
    {
      name: 'ariaLabel',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  PageFooter: [
    {
      name: 'groups',
      required: true,
    },
    {
      name: 'brand',
      required: false,
    },
    {
      name: 'meta',
      required: false,
    },
  ],
  PageHeader: [
    {
      name: 'title',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'breadcrumb',
      required: false,
    },
    {
      name: 'actions',
      required: false,
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  PageWithBreadcrumb: [],
  Pagination: [
    {
      name: 'page',
      required: true,
      primitives: ['number'],
    },
    {
      name: 'pageSize',
      required: true,
      primitives: ['number'],
    },
    {
      name: 'totalItems',
      required: true,
      primitives: ['number'],
    },
    {
      name: 'onPageChange',
      required: true,
    },
    {
      name: 'onPageSizeChange',
      required: false,
    },
    {
      name: 'pageSizeOptions',
      required: false,
    },
    {
      name: 'labels',
      required: false,
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  PasswordInput: [
    {
      name: 'showStrengthMeter',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'labels',
      required: false,
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'placeholder',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'value',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'onChange',
      required: false,
    },
  ],
  PieChart: [
    {
      name: 'data',
      required: true,
    },
    {
      name: 'title',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'donut',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'width',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'legend',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'plain',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Popover: [],
  Progress: [
    {
      name: 'value',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'variant',
      required: false,
      enum: ['primary', 'info', 'success', 'warning', 'error'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
  ],
  ProgressBar: [
    {
      name: 'value',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'max',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'helperText',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md'],
    },
    {
      name: 'status',
      required: false,
      enum: ['active', 'success', 'error'],
    },
  ],
  ProgressCircle: [
    {
      name: 'value',
      required: true,
      primitives: ['number'],
    },
    {
      name: 'max',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'showValue',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
  ],
  ProgressIndicator: [
    {
      name: 'steps',
      required: true,
    },
    {
      name: 'currentIndex',
      required: true,
      primitives: ['number'],
    },
    {
      name: 'vertical',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Prose: [],
  PullToRefresh: [
    {
      name: 'onRefresh',
      required: true,
    },
    {
      name: 'children',
      required: true,
    },
    {
      name: 'threshold',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'labels',
      required: false,
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  QrCode: [
    {
      name: 'value',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'size',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'errorCorrection',
      required: false,
      enum: ['L', 'M', 'Q', 'H'],
    },
    {
      name: 'radius',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'fill',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'background',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
  ],
  Radar: [
    {
      name: 'axes',
      required: true,
    },
    {
      name: 'series',
      required: true,
    },
    {
      name: 'max',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'title',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'width',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'plain',
      required: false,
      primitives: ['boolean'],
    },
  ],
  RadialProgress: [
    {
      name: 'value',
      required: true,
      primitives: ['number'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'variant',
      required: false,
      enum: ['primary', 'info', 'success', 'warning', 'error'],
    },
    {
      name: 'children',
      required: false,
    },
    {
      name: 'aria-label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Radio: [
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'value',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'name',
      required: false,
      primitives: ['string'],
    },
  ],
  RadioCard: [
    {
      name: 'value',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'title',
      required: true,
    },
    {
      name: 'description',
      required: false,
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
  ],
  RatingGroup: [
    {
      name: 'value',
      required: true,
      primitives: ['number'],
    },
    {
      name: 'onValueChange',
      required: false,
    },
    {
      name: 'max',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'readOnly',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'labels',
      required: false,
    },
  ],
  RelativeTime: [
    {
      name: 'date',
      required: true,
    },
    {
      name: 'sync',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'now',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'format',
      required: false,
    },
  ],
  Resizable: [
    {
      name: 'children',
      required: true,
    },
    {
      name: 'orientation',
      required: false,
      enum: ['horizontal', 'vertical'],
    },
    {
      name: 'defaultRatio',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'ratio',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'minRatio',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'maxRatio',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'onRatioChange',
      required: false,
    },
  ],
  ScatterChart: [
    {
      name: 'series',
      required: true,
    },
    {
      name: 'title',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'r',
      required: false,
    },
    {
      name: 'width',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'xTicks',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'yTicks',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'legend',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'tooltip',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'plain',
      required: false,
      primitives: ['boolean'],
    },
  ],
  ScrollArea: [
    {
      name: 'height',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'width',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'orientation',
      required: false,
      enum: ['vertical', 'horizontal', 'both'],
    },
    {
      name: 'edges',
      required: false,
      enum: ['shadow', 'mask', 'none'],
    },
    {
      name: 'children',
      required: false,
    },
  ],
  Search: [
    {
      name: 'value',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'defaultValue',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'onChange',
      required: false,
    },
    {
      name: 'onSearch',
      required: false,
    },
    {
      name: 'debounceMs',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'placeholder',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'clearLabel',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'id',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Section: [
    {
      name: 'width',
      required: false,
      enum: ['content', 'wide', 'full'],
    },
    {
      name: 'gap',
      required: false,
    },
  ],
  SegmentedControl: [
    {
      name: 'options',
      required: true,
    },
    {
      name: 'value',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'onValueChange',
      required: true,
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Select: [
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'hint',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'error',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'placeholder',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'options',
      required: true,
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Separator: [
    {
      name: 'orientation',
      required: false,
      enum: ['horizontal', 'vertical'],
    },
    {
      name: 'decorative',
      required: false,
      primitives: ['boolean'],
    },
  ],
  SettingsFormPage: [
    {
      name: 'onSave',
      required: false,
    },
  ],
  SettingsLayout: [
    {
      name: 'menu',
      required: true,
    },
    {
      name: 'children',
      required: true,
    },
  ],
  Sheet: [
    {
      name: 'open',
      required: true,
      primitives: ['boolean'],
    },
    {
      name: 'onClose',
      required: true,
    },
    {
      name: 'title',
      required: false,
    },
    {
      name: 'side',
      required: false,
      enum: ['start', 'end', 'top', 'bottom'],
    },
  ],
  ShellHeader: [
    {
      name: 'brand',
      required: false,
    },
    {
      name: 'nav',
      required: false,
    },
    {
      name: 'actions',
      required: false,
    },
    {
      name: 'end',
      required: false,
    },
    {
      name: 'onMenuClick',
      required: false,
    },
    {
      name: 'menuExpanded',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'skipToContentHref',
      required: false,
      primitives: ['string', 'boolean'],
    },
    {
      name: 'labels',
      required: false,
    },
  ],
  SideNav: [
    {
      name: 'items',
      required: true,
    },
    {
      name: 'collapsed',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'defaultCollapsed',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onCollapsedChange',
      required: false,
    },
    {
      name: 'ariaLabel',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'collapseLabel',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'expandLabel',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'expandOnHover',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'header',
      required: false,
    },
    {
      name: 'footer',
      required: false,
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  SidebarApp: [],
  Skeleton: [
    {
      name: 'variant',
      required: false,
      enum: ['text', 'circle', 'rect'],
    },
    {
      name: 'width',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'lines',
      required: false,
      primitives: ['number'],
    },
  ],
  SkipNav: [
    {
      name: 'targetId',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'labels',
      required: false,
    },
    {
      name: 'id',
      required: false,
      primitives: ['string'],
    },
  ],
  Slider: [
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'min',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'max',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'step',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'value',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'defaultValue',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Spacer: [
    {
      name: 'size',
      required: false,
    },
  ],
  Sparkline: [
    {
      name: 'data',
      required: true,
    },
    {
      name: 'label',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'width',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'color',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'endDot',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Spinner: [
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
  ],
  SplitView: [
    {
      name: 'start',
      required: true,
    },
    {
      name: 'end',
      required: true,
    },
    {
      name: 'defaultRatio',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'min',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'max',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'aria-label',
      required: false,
      primitives: ['string'],
    },
  ],
  Stack: [
    {
      name: 'children',
      required: true,
    },
    {
      name: 'offset',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Stat: [
    {
      name: 'label',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'value',
      required: true,
      primitives: ['string', 'number'],
    },
    {
      name: 'delta',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'trend',
      required: false,
      enum: ['up', 'down', 'flat'],
    },
    {
      name: 'helpText',
      required: false,
      primitives: ['string'],
    },
  ],
  StatsBand: [
    {
      name: 'stats',
      required: true,
    },
    {
      name: 'aria-label',
      required: false,
      primitives: ['string'],
    },
  ],
  StatsCards: [
    {
      name: 'stats',
      required: false,
    },
  ],
  Status: [
    {
      name: 'status',
      required: false,
      enum: ['success', 'warning', 'error', 'info', 'neutral'],
    },
    {
      name: 'pulse',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Steps: [
    {
      name: 'steps',
      required: true,
    },
    {
      name: 'activeStep',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'orientation',
      required: false,
      enum: ['horizontal', 'vertical'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  StructuredList: [
    {
      name: 'items',
      required: true,
    },
    {
      name: 'headers',
      required: false,
    },
    {
      name: 'selectable',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'value',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'defaultValue',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'onSelect',
      required: false,
    },
  ],
  Swap: [
    {
      name: 'on',
      required: true,
    },
    {
      name: 'off',
      required: true,
    },
    {
      name: 'checked',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onChange',
      required: false,
    },
    {
      name: 'mode',
      required: false,
      enum: ['rotate', 'flip'],
    },
    {
      name: 'aria-label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  SwipeItem: [
    {
      name: 'children',
      required: true,
    },
    {
      name: 'leadingActions',
      required: false,
    },
    {
      name: 'trailingActions',
      required: false,
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Switcher: [
    {
      name: 'items',
      required: true,
    },
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Tabs: [
    {
      name: 'defaultValue',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'value',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'onValueChange',
      required: false,
    },
  ],
  Tag: [
    {
      name: 'variant',
      required: false,
      enum: ['default', 'info', 'success', 'warning', 'error'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md'],
    },
    {
      name: 'onDismiss',
      required: false,
    },
    {
      name: 'dismissLabel',
      required: false,
      primitives: ['string'],
    },
  ],
  TagsInput: [
    {
      name: 'value',
      required: true,
    },
    {
      name: 'onValueChange',
      required: true,
    },
    {
      name: 'placeholder',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'validate',
      required: false,
    },
    {
      name: 'max',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Text: [
    {
      name: 'as',
      required: false,
      enum: ['p', 'span', 'div'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'weight',
      required: false,
      enum: ['normal', 'medium', 'semibold'],
    },
    {
      name: 'muted',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Textarea: [
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'hint',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'error',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'rows',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'resize',
      required: false,
      enum: ['none', 'vertical', 'both'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Tile: [],
  TimePicker: [
    {
      name: 'value',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'defaultValue',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'onChange',
      required: false,
    },
    {
      name: 'min',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'max',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'step',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'hint',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'error',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Timeline: [
    {
      name: 'items',
      required: true,
    },
    {
      name: 'orientation',
      required: false,
      enum: ['vertical', 'horizontal'],
    },
  ],
  Toast: [
    {
      name: 'title',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'variant',
      required: false,
      enum: ['default', 'success', 'warning', 'destructive'],
    },
    {
      name: 'duration',
      required: false,
      primitives: ['number'],
    },
  ],
  Toc: [
    {
      name: 'items',
      required: true,
    },
    {
      name: 'activeId',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'onActiveChange',
      required: false,
    },
    {
      name: 'labels',
      required: false,
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
  ],
  Toggle: [
    {
      name: 'checked',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'defaultChecked',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onChange',
      required: false,
    },
    {
      name: 'label',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
  ],
  ToggleGroup: [
    {
      name: 'type',
      required: true,
      enum: ['single', 'multiple'],
    },
    {
      name: 'value',
      required: false,
    },
    {
      name: 'defaultValue',
      required: false,
    },
    {
      name: 'onValueChange',
      required: false,
    },
    {
      name: 'items',
      required: true,
    },
    {
      name: 'orientation',
      required: false,
      enum: ['horizontal', 'vertical'],
    },
    {
      name: 'size',
      required: false,
      enum: ['sm', 'md', 'lg'],
    },
    {
      name: 'disabled',
      required: false,
      primitives: ['boolean'],
    },
  ],
  Toggletip: [
    {
      name: 'trigger',
      required: true,
    },
    {
      name: 'children',
      required: true,
    },
    {
      name: 'placement',
      required: false,
      enum: [
        'top',
        'bottom',
        'left',
        'right',
        'top-start',
        'top-end',
        'bottom-start',
        'bottom-end',
      ],
    },
    {
      name: 'defaultOpen',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'open',
      required: false,
      primitives: ['boolean'],
    },
    {
      name: 'onOpenChange',
      required: false,
    },
    {
      name: 'labels',
      required: false,
    },
  ],
  Tooltip: [
    {
      name: 'content',
      required: true,
    },
    {
      name: 'placement',
      required: false,
      enum: ['top', 'right', 'bottom', 'left'],
    },
    {
      name: 'children',
      required: true,
    },
    {
      name: 'delay',
      required: false,
      primitives: ['number'],
    },
  ],
  TreeView: [
    {
      name: 'items',
      required: true,
    },
    {
      name: 'selectionMode',
      required: false,
      enum: ['single', 'multi'],
    },
    {
      name: 'selected',
      required: false,
    },
    {
      name: 'defaultSelected',
      required: false,
    },
    {
      name: 'onSelectChange',
      required: false,
    },
    {
      name: 'expanded',
      required: false,
    },
    {
      name: 'defaultExpanded',
      required: false,
    },
    {
      name: 'onExpandedChange',
      required: false,
    },
  ],
  Treemap: [
    {
      name: 'data',
      required: true,
    },
    {
      name: 'title',
      required: true,
      primitives: ['string'],
    },
    {
      name: 'description',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'width',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'height',
      required: false,
      primitives: ['number'],
    },
    {
      name: 'className',
      required: false,
      primitives: ['string'],
    },
    {
      name: 'plain',
      required: false,
      primitives: ['boolean'],
    },
  ],
  User: [
    {
      name: 'name',
      required: true,
    },
    {
      name: 'description',
      required: false,
    },
    {
      name: 'avatarProps',
      required: false,
    },
  ],
  UsersTablePage: [
    {
      name: 'users',
      required: false,
    },
    {
      name: 'onInvite',
      required: false,
    },
  ],
  VisuallyHidden: [
    {
      name: 'children',
      required: true,
    },
  ],
}
