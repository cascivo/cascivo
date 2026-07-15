Every cascivo component, prebuilt as a normal installable library — for users
who just want to **use** the design system without owning the source. If you
want to customize component internals, use the copy-paste flow instead
(`npx cascivo add <component>`); both consume the same tokens and themes, and
can coexist in one project.

## Install

```sh
pnpm add @cascivo/react @cascivo/themes @preact/signals-react
```

**Peer dependencies** (install them in your app): `react >=18`, `react-dom >=18`,
and `@preact/signals-react` — cascivo components are signal-driven, so the
signals runtime is required. `@cascivo/themes` is optional but recommended; it
supplies the tokens and themes the components read.

Charts live in a separate package — add [`@cascivo/charts`](https://github.com/cascivo/cascivo/tree/main/packages/charts)
for `LineChart`, `AreaChart`, `BarChart`, `Sparkline`, and more.

### Framework setup (Next.js App Router)

In a Server Component file (e.g. `app/layout.tsx`), import the themes once:

```tsx
import '@cascivo/themes/all'
```

Component CSS ships **per component** and is pulled in automatically when you
import a component — a bundler (Vite, webpack/Next.js) includes the styles only
for the components you actually use and tree-shakes the rest. There is no
component-CSS import to add or maintain.

Components ship with `'use client'` preserved in the bundle, so they work inside
RSC without any extra wrapper.

> **No bundler? (CDN, import maps, plain `<link>`)** Import the aggregate sheet
> `@cascivo/react/styles.css` — it contains every component's CSS in one file.
> With a bundler you don't need it; import it only if you prefer one explicit
> stylesheet over per-component tree-shaking.

## Use

```tsx
// once, in your entry file — themes are the only global import
import '@cascivo/themes/all' // tokens (once) + base typography + light & dark

// anywhere — each component brings its own CSS along
import { Button, Card, CardContent, Toggle } from '@cascivo/react'

export function App() {
  return (
    <main data-theme="light">
      <Card>
        <CardContent>
          <Toggle label="Notifications" defaultChecked />
          <Button>Save</Button>
        </CardContent>
      </Card>
    </main>
  )
}
```

`@cascivo/themes/all` is the recommended single import: it loads `@cascivo/tokens`
**once**, applies the base typography layer (so plain markup uses the sans font,
not the browser serif default), and ships both the `light` and `dark` themes.

Prefer à-la-carte? Import only the themes you need — each self-imports the tokens
(deduped by URL, so light + dark load tokens once):

```tsx
import '@cascivo/themes/base' // base typography (font/line-height/color)
import '@cascivo/themes/light'
import '@cascivo/themes/dark'
```

Scope a theme with `data-theme="light" | "dark" | "warm"` on any container. Brand
adaptation happens by overriding `--cascivo-*` custom properties — no rebuild
needed.

### CSS layer ordering

cascivo ships its styles in cascade layers, ordered lowest → highest priority:

```
cascivo.base  <  cascivo.theme  <  cascivo.component
```

**Unlayered** CSS in your app always beats every cascivo layer regardless of
specificity, so your own (unlayered) styles win by default. To override cascivo
from within a layer, declare a layer ordered after `cascivo.component`. See
[CSS-LAYERS-PITFALL.md](https://github.com/cascivo/cascivo/blob/main/docs/CSS-LAYERS-PITFALL.md)
for the full story and the recommended `@layer` declaration. Token names and
aliases are documented in
[TOKENS.md](https://github.com/cascivo/cascivo/blob/main/docs/TOKENS.md).

All components are client components (`'use client'` is preserved in the
bundle), so the package works in Next.js App Router projects out of the box.

## Using with AI tools (v0, Cursor, Claude Code, Gemini)

cascivo is AI-first, but a model can only build with it if the knowledge reaches
the tool. cascivo has no training-data footprint yet, so **don't rely on a tool
fetching cascivo.com** — that channel is the least reliable one. Use the channels
that travel with the package instead:

- **One file, one fetch — paste or link this into any chat/agent:**
  [`https://cascivo.com/llms-full.txt`](https://cascivo.com/llms-full.txt). It is
  the entire library — setup, the signals/CSS-layer rules, and every component's
  props/examples/a11y — inlined, so a single successful fetch is enough. The
  shorter index is [`llms.txt`](https://cascivo.com/llms.txt).
- **v0 / shadcn CLI** — components install straight from the
  [shadcn-compatible registry](https://cascivo.com/r/shadcn/registry.json):

  ```sh
  npx shadcn@latest add https://cascivo.com/r/shadcn/button.json
  ```

  Each item inlines its own source and points its dependencies at absolute
  `https://cascivo.com/r/shadcn/<name>.json` URLs, so the CLI resolves them
  transitively. Register the whole namespace in `components.json` to use short
  names (`npx shadcn add @cascivo/button`):

  ```json
  { "registries": { "@cascivo": "https://cascivo.com/r/shadcn/{name}.json" } }
  ```

- **MCP-capable agents** (Claude Code, Cursor, Gemini CLI, Windsurf) — point the
  client at the [`@cascivo/mcp`](https://www.npmjs.com/package/@cascivo/mcp)
  server so it can query components with no web fetch at all:

  ```json
  { "mcpServers": { "cascivo": { "command": "npx", "args": ["-y", "@cascivo/mcp"] } } }
  ```

**One rule to give the model:** cascivo is signal-driven — use `useSignal` /
`useComputed` / `useSignalEffect` from `@cascivo/core`, never `useState` /
`useEffect`, and in any app without the Babel signals transform a component that
reads `signal.value` in render must call `useSignals()` first or it won't
re-render. `llms-full.txt` carries the full contract.

## Guides

- [Theming & branding](https://github.com/cascivo/cascivo/blob/main/docs/THEMING.md) — match a brand by overriding tokens (layer cascade, the `data-theme` specificity footgun, per-role radius/control-height tokens, a starter theme).
- [Using cascivo with Preact](https://github.com/cascivo/cascivo/blob/main/docs/USING-WITH-PREACT.md) — `preact/compat` alias, tsconfig paths, peer deps, signals package. It works — this documents how.
- [Compatibility & support matrix](https://github.com/cascivo/cascivo/blob/main/docs/COMPATIBILITY.md) — frameworks, browsers, the build-tooling baseline, and which package versions go together.
- [Token reference](https://github.com/cascivo/cascivo/blob/main/docs/TOKENS.md) — every CSS custom property, canonical names, and aliases.

## Migrating from shadcn/ui?

See [`MIGRATING-FROM-SHADCN.md`](https://github.com/cascivo/cascivo/blob/main/docs/MIGRATING-FROM-SHADCN.md)
for the variant/prop mapping (e.g. Button `default/outline` → `primary/secondary`,
there is no `outline`) and the CSS-setup delta vs Tailwind.

## Gotchas — naming collisions

A handful of exported component names shadow common DOM, browser, or Next.js
globals. When you import them, alias the import (or import the cascivo name
explicitly) to avoid clashing with the platform identifier:

| cascivo export   | Collides with                             | Suggested alias                                            |
| ---------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `Image`          | `next/image`, the DOM `Image` constructor | `import { Image as CascivoImage } from '@cascivo/react'`   |
| `Link`           | `next/link`                               | `import { Link as CascivoLink } from '@cascivo/react'`     |
| `Header`         | the `<header>` element / app headers      | `import { Header as CascivoHeader } from '@cascivo/react'` |
| `Search`         | various router/search helpers             | `import { Search as CascivoSearch } from '@cascivo/react'` |
| `User`, `Status` | domain models in many apps                | alias as needed                                            |
| `Tag`            | exported as the cascivo `Tag` chip        | already namespaced — import directly                       |

Editor auto-import will sometimes pick the wrong `Image`/`Link`; if styles or
routing break after adding one of these, check that the import resolves to
`@cascivo/react`.

<!-- COMPONENT_INDEX:START -->

## Component index

192 components, exported from `@cascivo/react`. Full props, examples, and live demos at [docs.cascivo.com](https://docs.cascivo.com).

### Inputs

- **Button** — Triggers an action or event
- **ButtonGroup** — Visually joins a set of related buttons into a single segmented control
- **Calendar** — An accessible standalone month-grid date picker.
- **Checkbox** — Binary toggle for forms, with indeterminate support
- **CheckboxCard** — Multi-selectable card backed by a native checkbox. Use multiple independent CheckboxCards for multi-select scenarios.
- **CodeEditor** — Lightweight code editor — a native textarea overlaid on a syntax-highlighted layer, with line numbers and Tab indent.
- **ColorPicker** — Interactive color selection widget with saturation/lightness area, hue and alpha sliders
- **Combobox** — Filterable single-select with an animated custom listbox, built on the dropdown open/close machine
- **CopyButton** — Icon button that copies a value to the clipboard with copied feedback
- **DatePicker** — An accessible date-picker with a calendar popover.
- **DateRangePicker** — A dual-calendar picker for selecting a contiguous date range.
- **Editable** — Inline click-to-edit text field
- **Fab** — Floating action button anchored to a screen corner, with an optional speed-dial of secondary actions
- **Field** — Form-field wrapper composing label, control, description, and error
- **FileUploader** — Drag-and-drop file upload zone with file list and status indicators.
- **Filter** — A group of toggleable pill or outline buttons for filtering content by category
- **Form** — Typed signal-based form store (createForm/useForm) with sync/async validation and a thin Form element wrapper
- **IconButton** — Square, icon-only button with a required accessible label
- **Input** — Text input field with optional label, hint, and error state
- **InputGroup** — Prefix/suffix addon wrapper for Input; InputGroupAddon renders inline icons/units inside the field border; ButtonGroup collapses adjacent button borders
- **Label** — Accessible caption for a form control
- **MultiSelect** — Searchable multi-value select with popover listbox
- **NativeSelect** — A styled native <select> that keeps platform form/keyboard behavior with a custom chevron and focus ring
- **NumberInput** — Numeric input with stepper buttons, clamping, precision, and locale formatting
- **OtpInput** — Segmented one-time code input
- **PasswordInput** — Password input with reveal toggle and optional strength meter
- **Radio** — Single choice from a set, grouped with RadioGroup
- **RadioCard** — Selectable card backed by a native radio input. Use RadioCardGroup for single-select groups.
- **RatingGroup** — Star rating input with accessible radio group pattern
- **Search** — Search input with debounced search callback and clear button
- **SegmentedControl** — Mutually exclusive toggle group
- **Select** — Native select menu styled to match the design system
- **Slider** — Range input for selecting a value within bounds
- **Swap** — Animated toggle between two icon/content states with rotate or flip transition
- **TagsInput** — Free-form multi-value chip input
- **Textarea** — Multi-line text input with optional label, hint, and error state
- **Tile** — A selectable card with radio (single) or checkbox (multi) semantics, toggled by click or keyboard
- **TimePicker** — Native time input wrapper with label, hint, error, and size variants
- **Toggle** — On/off switch built as an accessible button
- **ToggleGroup** — A set of toggle buttons for single or multiple selection

### Display

- **Alert** — Highlights a short, important message inline
- **Avatar** — Displays a user image with initials fallback
- **AvatarGroup** — Overlapping stack of avatars with a max cap and an i18n-labelled +N overflow chip
- **Badge** — Small status label or category indicator
- **Blockquote** — Quoted passage with optional attribution footer
- **Card** — Container for grouping related content
- **Carousel** — Scroll-snap slide deck with previous/next controls and dot indicators
- **ChatBubble** — Message bubble for chat and messaging UIs with avatar, name, and timestamp support
- **Code** — Inline code span for identifiers, commands, and short snippets
- **CodeSnippet** — Displays code (inline, single-line, or multi-line) with an optional copy button, lightweight built-in syntax highlighting for bash/css/js/ts, and an optional terminal-window look
- **Collapsible** — A single disclosure region toggled open and closed by its trigger
- **Comparison** — Reveals the difference between two layers with a draggable divider
- **ConsoleApp** — Carbon-parity console shell: ShellHeader + icon-rail SideNav + HeaderPanel notifications/switcher + collapsible aside + main content.
- **ContainedList** — Labelled list of rows inside a bordered container
- **DashboardCharts** — Dashboard layout with KPI tiles, line chart, bar chart, and pie chart.
- **DataList** — Key-value pairs rendered as a description list
- **DataTable** — Signal-driven data table with client/server sort, filter, pagination, multi-selection, expandable rows, and CSS content-visibility row containment for large datasets
- **EmptyDashboard** — Dashboard page showing an empty state with a call-to-action button.
- **EmptyState** — Placeholder for views that have no data to display
- **Flow** — The declarative, AI-first flow surface — render a node/edge graph from plain serializable data.
- **FlowBackground** — Decorative dots / grid / cross canvas background, drawn purely in CSS gradients.
- **FlowCanvas** — The pan/zoom canvas pane — a single CSS-transformed layer driven by the viewport signal.
- **FlowControls** — Zoom in / out / fit-view controls for a flow canvas — real, i18n-labeled buttons.
- **FlowEdge** — An SVG edge with bezier/straight/smoothstep paths, an arrowhead, an optional label, and animation.
- **FlowHandle** — A connection port on a node edge — where edges attach and interactive connect starts.
- **FlowMiniMap** — A scaled SVG overview of the graph with a draggable viewport rectangle.
- **FlowNode** — An HTML node box positioned in the viewport pane — draggable, selectable, with arbitrary children.
- **FlowPanel** — An absolutely-positioned slot for custom flow-canvas UI (legend, toolbar).
- **FlowStory** — A scripted, sequenced, looping flow animation — walks a graph step by step with fade-in captions.
- **Heading** — Section heading with semantic level decoupled from visual size
- **Highlight** — Read-only syntax-highlighted code block — the same owned tokenizer as CodeEditor, without the textarea.
- **Image** — Image with load state, blur-up placeholder, graceful fallback, and optional zoom
- **Item** — Generic content row primitive with media, content, and action regions
- **Kbd** — Displays a keyboard key or shortcut
- **List** — Styled unordered or ordered list with ListItem
- **LoginPage** — Authentication login page with email and password form.
- **LogViewer** — Virtualized monospace console for high-frequency log and stream output
- **NotificationCenter** — A list of notification alerts with a mark-all-read action.
- **PageWithBreadcrumb** — A centered content page with a breadcrumb navigation and page header.
- **Prose** — Wrapper that styles raw descendant HTML — headings, lists, code, quotes, tables
- **QrCode** — Encodes a URL or short text into a scannable SVG QR code
- **RelativeTime** — Displays a date as a localized phrase relative to now, auto-updating
- **Separator** — Visual or semantic divider between content
- **SettingsFormPage** — Settings page with profile form inside a two-column settings layout.
- **SidebarApp** — Full app shell with collapsible side navigation and top header.
- **Skeleton** — Animated loading placeholder that mirrors the shape of pending content
- **Stat** — Displays a key metric with optional delta, trend direction and help text
- **StatsCards** — Grid of KPI stat cards with trend badges.
- **Status** — Colored dot with a label communicating the state of a system or entity
- **StructuredList** — Tabular row list for scannable data, optionally single-selectable
- **SwipeItem** — List row whose leading/trailing actions are revealed by a horizontal swipe, with keyboard parity
- **Tag** — Compact chip for labeling, categorizing, or filtering content
- **Text** — Body text with size, weight, and muted variants
- **Timeline** — Ordered sequence of events with status markers and a connector line
- **TreeView** — Hierarchical, expandable tree of nodes with keyboard navigation and selection
- **User** — Identity composite: an avatar with a name, description, and optional action slot
- **UsersTablePage** — Full users management page with table, search, and invite action.
- **VisuallyHidden** — Hides content visually while keeping it available to screen readers

### Overlay

- **ActionSheet** — Bottom-rising sheet of discrete actions (iOS action-sheet pattern) with a Cancel button
- **AlertDialog** — Confirmation dialog requiring explicit user action; no light-dismiss
- **BottomSheet** — Mobile bottom sheet with drag-to-resize detents, velocity-projected snapping, and drag-to-dismiss
- **CommandMenu** — Cmd+K command palette with fuzzy search over grouped commands
- **ContextMenu** — Right-click context menu anchored at pointer coordinates via CSS custom properties
- **Drawer** — Edge-anchored dialog panel that slides in from a screen edge with CSS-only enter/exit motion
- **Dropdown** — Menu of actions revealed from a trigger
- **HoverCard** — Hover-triggered popover with configurable open/close delay
- **Menu** — Dropdown menu with keyboard navigation, built on usePopover
- **Modal** — Accessible dialog overlay using native <dialog> element
- **OverflowMenu** — Kebab icon button revealing a menu of row-level actions
- **Popover** — Anchored floating panel built on CSS Anchor Positioning + Popover API
- **Sheet** — Slide-in panel from any edge, using popover=manual and @starting-style animations
- **Toast** — Transient notification surfaced via the useToast hook
- **Toggletip** — A click-triggered info popover for supplementary, selectable content
- **Tooltip** — Contextual label shown on hover or focus

### Navigation

- **Accordion** — Vertically stacked, collapsible content sections
- **Breadcrumb** — Shows the current page location within a navigation hierarchy
- **Dock** — Fixed bottom navigation bar for mobile app shells with up to 5 items
- **Header** — App top bar with brand, primary navigation links, and an actions slot
- **HeaderPanel** — Non-modal panel anchored below the shell header at the inline-end edge — hosts notifications, app switcher, user settings
- **Link** — Styled anchor for navigation, standalone or inline within prose
- **Menubar** — Horizontal application menu bar with keyboard-navigable dropdown menus
- **MenuButton** — A button that opens an anchored action menu of one-shot commands
- **NavigationMenu** — Site navigation bar with links and dropdown flyout panels
- **Pagination** — Controls for navigating paged data sets, with page size selection
- **ProgressIndicator** — Shows progress through the steps of a multi-step flow
- **ShellHeader** — Console application header: brand with prefix, dropdown nav menus, global icon actions, hamburger, skip-to-content
- **SideNav** — Collapsible sidebar navigation with optional icons and one level of grouping
- **SkipNav** — Skip link that jumps keyboard users past the navigation to the main content
- **Steps** — Visual progress indicator for multi-step flows with horizontal and vertical orientations
- **Switcher** — App/product switcher list — lives inside HeaderPanel, renders links with active indicator and optional dividers
- **Tabs** — Switch between related panels of content
- **Toc** — Table of contents with scroll-spy highlighting of the active section

### Layout

- **AppShell** — Sticky-header + full-height side-nav + single-scroll-container layout with an animated, accessible nav toggle.
- **AppShell** — Full-page application shell with persisted collapsible sidebar. Includes a signal-driven top progress bar with determinate progress, error state, and dismissible error strip.
- **AspectRatio** — Constrains content to a fixed width-to-height ratio
- **AuthLayout** — Centered card layout for authentication pages (login, register, forgot password).
- **AutoGrid** — Media-query-free responsive grid — columns auto-fill based on available space.
- **Center** — Horizontally centered container with a configurable max-width.
- **Columns** — Equal-width multi-column layout that collapses to single column on narrow viewports.
- **Cta** — Call-to-action band — quiet hairline-bordered section with title, description, and centered actions. Replace demo content before shipping.
- **DashboardLayout** — Dashboard page layout with stats strip, main content area, and optional aside.
- **FeatureGrid** — Feature section — AutoGrid of items with optional title, description, and icon slots. Icons are optional; the grid works text-only. Replace demo content before shipping.
- **Flex** — Flex layout primitive for vertical or horizontal stacking with gap control.
- **Grid** — CSS grid layout primitive with responsive column collapsing.
- **Hero** — Page hero section — centered or split layout with eyebrow, title, description, actions and media slots. Replace demo content before shipping.
- **Indicator** — Positions an overlay element (badge, dot, count) at a corner of its child
- **Join** — Groups adjacent children into a seamless joined element by removing interior borders and radii
- **Masonry** — Masonry layout — native CSS masonry where supported, multi-column fallback elsewhere (fallback orders items top-to-bottom per column).
- **MediaMasonry** — Masonry gallery section — native CSS masonry where supported, multi-column fallback elsewhere (fallback orders tiles top-to-bottom per column). Tiles style themselves; section provides only the layout shell.
- **PageFooter** — Site footer — AutoGrid of link groups with a brand/meta bottom row. Renders a <footer> element with a <nav aria-label="Footer"> wrapping the link columns.
- **PageHeader** — Page-level header with title, description, breadcrumb, and actions slots.
- **Resizable** — Two-pane splitter whose divider can be dragged or keyboard-nudged to reallocate space
- **ScrollArea** — A scroll container with styled, slim scrollbars and overflow shadows
- **Section** — Page-section shell with block padding, centered inner width, and stack gap.
- **SettingsLayout** — Two-column settings page layout with a fixed-width menu and fluid content area.
- **Spacer** — Fixed-height spacing block using design token steps.
- **SplitView** — Resizable two-pane split layout with keyboard and pointer drag support.
- **Stack** — Overlaps children in a CSS grid stack with a configurable offset to create a card-pile effect
- **StatsBand** — KPI strip — horizontal band of stats with optional delta and inline sparkline trend. Wraps via AutoGrid on narrow containers. No visible heading; provide aria-label for accessibility.

### Feedback

- **InlineLoading** — Compact inline status indicator that pairs a label with a loading, success, or error state
- **Notification** — Inline, actionable notification banner that surfaces a titled message with an optional recovery action
- **Progress** — Horizontal bar showing the completion progress of a tracked operation
- **ProgressBar** — Shows determinate or indeterminate progress of a task
- **ProgressCircle** — Circular determinate progress indicator rendered as an SVG arc
- **PullToRefresh** — Wraps a scrollable region and triggers a refresh when pulled down past a threshold at the top
- **RadialProgress** — Circular progress indicator using conic-gradient, with percentage label and variant colors
- **Spinner** — Indeterminate loading indicator

### Charts

- **AreaChart** — Area chart with optional stacking, multi-series support, and hover tooltip.
- **BarChart** — Bar chart with vertical/horizontal orientation, grouped or stacked modes, and multi-series support.
- **Boxplot** — Box-and-whisker plot with five-number summary and outlier dots per series.
- **BubbleChart** — Bubble chart mapping x, y, and size dimensions; radius is area-proportional via sqrt scale.
- **Bullet** — Bullet chart with background range bands, measure bar, and target tick.
- **Calendar** — Calendar heatmap — a week-column grid of day cells colored by value (GitHub-style).
- **Candlestick** — OHLC financial chart — each period a high–low wick and an open↔close body, coloured up/down.
- **ComboChart** — Combination bar + line chart on shared or dual y-axes.
- **Funnel** — Vertical conversion funnel — each stage is a trapezoid narrowing toward the next, with optional conversion labels.
- **Gauge** — A speedometer gauge — a value arc over a min–max sweep with threshold zones, ticks, and a needle.
- **Heatmap** — Two-dimensional heatmap with band scales and color-mix cell interpolation.
- **Histogram** — Frequency histogram using Freedman–Diaconis binning with hover tooltips.
- **Kpi** — KPI card showing a primary metric with optional delta indicator, icon, and sparkline.
- **LineChart** — Time-series or numeric line chart with multi-series support, hover tooltip, and legend.
- **Meter** — Progress meter in bar or gauge variant with threshold coloring.
- **PieChart** — Pie or donut chart with hover segments and optional legend.
- **Polar** — A polar coordinate plot — categories around the circle, value as radius. Bars (a rose), or a polar line/area.
- **Radar** — Radar / spider chart with polar grid rings, spokes, and multi-series polygon overlays.
- **RadialBar** — Concentric radial bars (a circular gauge family) — each datum is a ring whose sweep is proportional to its value.
- **Sankey** — Flow diagram — ranked nodes connected by throughput-sized link ribbons.
- **ScatterChart** — Scatter plot with variable point radius, multi-series, and hover tooltip.
- **Sparkline** — Compact inline sparkline for embedding trend data in dashboards or KPI cards.
- **Stream** — Streamgraph — stacked areas on a centered (silhouette) flowing baseline.
- **Sunburst** — Radial hierarchy — concentric rings where each node is an annular segment sized by value.
- **Treemap** — Squarified treemap for visualizing part-to-whole hierarchical data.

<!-- COMPONENT_INDEX:END -->
