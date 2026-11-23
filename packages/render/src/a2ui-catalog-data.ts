// generated — do not edit (scripts/schema/generate-catalog.ts)
export interface A2uiSlotInfo {
  readonly arity: 'one' | 'many'
  readonly text?: true
}
export interface A2uiComponentInfo {
  readonly slots: Readonly<Record<string, A2uiSlotInfo>>
  readonly events: readonly string[]
}
export const a2uiComponents: Readonly<Record<string, A2uiComponentInfo>> = {
  Accordion: { slots: { children: { arity: 'many', text: true } }, events: ['onValueChange'] },
  Alert: {
    slots: { children: { arity: 'many', text: true }, icon: { arity: 'one' } },
    events: ['onDismiss'],
  },
  AutoGrid: { slots: { children: { arity: 'many', text: true } }, events: [] },
  Avatar: { slots: {}, events: [] },
  AvatarGroup: { slots: { children: { arity: 'many', text: true } }, events: [] },
  Badge: { slots: { children: { arity: 'many', text: true } }, events: [] },
  Blockquote: { slots: { children: { arity: 'many', text: true } }, events: [] },
  Breadcrumb: { slots: {}, events: [] },
  Button: { slots: { children: { arity: 'many', text: true } }, events: ['onClick'] },
  Card: {
    slots: { actions: { arity: 'one' }, children: { arity: 'many', text: true } },
    events: [],
  },
  CardContent: { slots: { children: { arity: 'many', text: true } }, events: [] },
  CardFooter: { slots: { children: { arity: 'many', text: true } }, events: [] },
  CardHeader: { slots: { children: { arity: 'many', text: true } }, events: [] },
  CardTitle: { slots: { children: { arity: 'many', text: true } }, events: [] },
  Center: { slots: { children: { arity: 'many', text: true } }, events: [] },
  Checkbox: { slots: {}, events: ['onChange'] },
  CheckboxCard: {
    slots: { description: { arity: 'one' }, title: { arity: 'one' } },
    events: ['onCheckedChange'],
  },
  Code: { slots: { children: { arity: 'many', text: true } }, events: [] },
  Columns: { slots: { children: { arity: 'many', text: true } }, events: [] },
  Combobox: { slots: {}, events: ['onCreate', 'onOpenChange', 'onSearchChange', 'onValueChange'] },
  CommandMenu: { slots: {}, events: ['onOpenChange', 'onQueryChange'] },
  DataTable: {
    slots: {
      emptyState: { arity: 'one' },
      noResultsState: { arity: 'one' },
      toolbar: { arity: 'one' },
    },
    events: ['onCellEdit', 'onColumnStateChange', 'onFiltersChange', 'onSortChange'],
  },
  DatePicker: { slots: {}, events: ['onOpenChange', 'onValueChange'] },
  Dropdown: { slots: { trigger: { arity: 'one' } }, events: ['onOpenChange', 'onSelect'] },
  EmptyState: { slots: { action: { arity: 'one' }, icon: { arity: 'one' } }, events: [] },
  FileUploader: { slots: {}, events: ['onFilesAdded', 'onRejected', 'onRemove'] },
  Flex: { slots: { children: { arity: 'many', text: true } }, events: [] },
  Form: { slots: { children: { arity: 'many', text: true } }, events: ['onValid'] },
  Grid: { slots: { children: { arity: 'many', text: true } }, events: [] },
  GridItem: { slots: { children: { arity: 'many', text: true } }, events: [] },
  Header: { slots: { actions: { arity: 'one' }, brand: { arity: 'one' } }, events: [] },
  HeaderPanel: { slots: { children: { arity: 'many', text: true } }, events: ['onClose'] },
  Heading: { slots: { children: { arity: 'many', text: true } }, events: [] },
  Image: { slots: {}, events: [] },
  Input: { slots: {}, events: ['onChange'] },
  InputGroup: {
    slots: {
      children: { arity: 'many', text: true },
      prefix: { arity: 'one' },
      suffix: { arity: 'one' },
    },
    events: [],
  },
  Kbd: { slots: { children: { arity: 'many', text: true } }, events: [] },
  LargeTitleHeader: {
    slots: {
      actions: { arity: 'one' },
      children: { arity: 'many', text: true },
      leading: { arity: 'one' },
    },
    events: [],
  },
  Link: { slots: { children: { arity: 'many', text: true } }, events: [] },
  List: { slots: { children: { arity: 'many', text: true } }, events: [] },
  ListItem: { slots: { children: { arity: 'many', text: true } }, events: [] },
  Modal: {
    slots: { children: { arity: 'many', text: true }, footer: { arity: 'one' } },
    events: ['onClose'],
  },
  NumberInput: { slots: {}, events: ['onValueChange'] },
  OverflowMenu: { slots: {}, events: ['onSelect'] },
  PageHeader: {
    slots: {
      actions: { arity: 'one' },
      breadcrumb: { arity: 'one' },
      description: { arity: 'one' },
      title: { arity: 'one' },
    },
    events: [],
  },
  Pagination: { slots: {}, events: ['onPageChange', 'onPageSizeChange'] },
  Progress: { slots: {}, events: [] },
  ProgressBar: { slots: {}, events: [] },
  ProgressIndicator: { slots: {}, events: [] },
  Radio: { slots: {}, events: [] },
  RadioCard: {
    slots: { description: { arity: 'one' }, title: { arity: 'one' } },
    events: ['onValueChange'],
  },
  RadioCardGroup: { slots: { children: { arity: 'many', text: true } }, events: ['onValueChange'] },
  Search: { slots: {}, events: ['onSearch', 'onValueChange'] },
  Select: { slots: {}, events: ['onChange'] },
  Separator: { slots: {}, events: [] },
  ShellHeader: {
    slots: { brand: { arity: 'one' }, center: { arity: 'one' }, end: { arity: 'one' } },
    events: ['onMenuClick'],
  },
  SideNav: {
    slots: { footer: { arity: 'one' }, header: { arity: 'one' } },
    events: ['onCollapsedChange'],
  },
  Skeleton: { slots: {}, events: [] },
  Slider: { slots: {}, events: ['onChange'] },
  Spacer: { slots: {}, events: [] },
  Spinner: { slots: {}, events: [] },
  Stat: { slots: { visual: { arity: 'one' } }, events: [] },
  Status: { slots: { children: { arity: 'many', text: true } }, events: [] },
  Steps: { slots: {}, events: [] },
  Switcher: { slots: {}, events: [] },
  Tabs: { slots: { children: { arity: 'many', text: true } }, events: ['onValueChange'] },
  Tag: { slots: { children: { arity: 'many', text: true } }, events: ['onDismiss'] },
  Text: { slots: { children: { arity: 'many', text: true } }, events: [] },
  Textarea: { slots: {}, events: ['onChange'] },
  TimePicker: { slots: {}, events: ['onValueChange'] },
  Timeline: { slots: {}, events: [] },
  Toast: { slots: {}, events: [] },
  Toggle: { slots: {}, events: ['onValueChange'] },
  Tooltip: {
    slots: { children: { arity: 'many', text: true }, content: { arity: 'one' } },
    events: [],
  },
}
