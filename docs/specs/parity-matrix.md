# Parity Matrix — cascivo vs shadcn/ui + IBM Carbon

**Last updated:** 2026-06-14
**Generated artifact:** `apps/docs/public/parity.json` (via `scripts/parity/generate.ts` — do NOT hand-edit the JSON)

## Methodology

This file is the **human-authored source of truth** for cascivo's component coverage against the two
design systems we benchmark against: [shadcn/ui](https://ui.shadcn.com/docs/components) and
[IBM Carbon](https://carbondesignsystem.com/components/overview/components/).

`scripts/parity/generate.ts` parses the tables below, cross-checks every `covered`/`partial` row against
the **real** cascivo surface (`packages/react/src/index.ts` exports + `registry.json`), and emits
`parity.json`. **Coverage is derived, not typed** — if a row claims `covered` but the named cascivo
component is not actually shipped/exported, the generator **fails loudly**. The coverage page therefore
cannot overstate: a component shows as covered only when it is genuinely built and exported.

### Status vocabulary

| Status          | Meaning                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------- |
| `covered`       | A real cascivo component genuinely fulfils this competitor entry.                         |
| `partial`       | A cascivo component covers the common case but not every variant (note explains the gap). |
| `gap`           | Not yet built. A `factory-backlog.json` entry exists with a dated, prioritized spec.      |
| `by-convention` | Solved by an architectural convention, not a component (e.g. RTL via CSS logical props).  |
| `deferred`      | Explicitly out of v18 scope (see roadmap Deferred section).                               |

A cascivo component counts as covering a competitor entry only when it genuinely does. Near-misses are
`partial` with a reason. No gap is hidden; no coverage is overstated.

## Summary

Counts are derived by the generator from the tables below; see `parity.json` for the live numbers.

<!-- parity:shadcn -->

## shadcn/ui

| Competitor      | Status        | cascivo         | Note                                                                        |
| --------------- | ------------- | --------------- | --------------------------------------------------------------------------- |
| Accordion       | covered       | accordion       |                                                                             |
| Alert           | covered       | alert           |                                                                             |
| Alert Dialog    | covered       | alert-dialog    |                                                                             |
| Aspect Ratio    | covered       | aspect-ratio    |                                                                             |
| Avatar          | covered       | avatar          |                                                                             |
| Badge           | covered       | badge           |                                                                             |
| Breadcrumb      | covered       | breadcrumb      |                                                                             |
| Button          | covered       | button          |                                                                             |
| Button Group    | covered       | button-group    |                                                                             |
| Calendar        | covered       | calendar        |                                                                             |
| Card            | covered       | card            |                                                                             |
| Carousel        | covered       | carousel        |                                                                             |
| Chart           | covered       | chart           | chart family via @cascivo/charts                                            |
| Checkbox        | covered       | checkbox        |                                                                             |
| Collapsible     | covered       | collapsible     |                                                                             |
| Combobox        | covered       | combobox        |                                                                             |
| Command         | covered       | command-menu    |                                                                             |
| Context Menu    | covered       | context-menu    |                                                                             |
| Data Table      | covered       | data-table      |                                                                             |
| Date Picker     | covered       | date-picker     |                                                                             |
| Dialog          | covered       | modal           |                                                                             |
| Direction       | by-convention |                 | RTL via CSS logical properties throughout; no JS provider                   |
| Drawer          | covered       | sheet           | sheet covers the panel; no mobile swipe gesture. drawer queued (v18-t6)     |
| Dropdown Menu   | covered       | dropdown        |                                                                             |
| Empty           | covered       | empty-state     |                                                                             |
| Field           | covered       | field           |                                                                             |
| Hover Card      | covered       | hover-card      |                                                                             |
| Input           | covered       | input           |                                                                             |
| Input Group     | covered       | input-group     |                                                                             |
| Input OTP       | covered       | otp-input       |                                                                             |
| Item            | covered       | item            |                                                                             |
| Kbd             | covered       | kbd             |                                                                             |
| Label           | covered       | label           |                                                                             |
| Menubar         | covered       | menubar         |                                                                             |
| Native Select   | covered       | native-select   | Wraps the native control; cascivo `select` is the custom listbox.           |
| Navigation Menu | covered       | navigation-menu |                                                                             |
| Pagination      | covered       | pagination      |                                                                             |
| Popover         | covered       | popover         |                                                                             |
| Progress        | covered       | progress-bar    | progress-bar + progress-circle                                              |
| Radio Group     | covered       | radio           |                                                                             |
| Resizable       | covered       | resizable       | a.k.a. splitter                                                             |
| Scroll Area     | covered       | scroll-area     |                                                                             |
| Select          | covered       | select          |                                                                             |
| Separator       | covered       | separator       |                                                                             |
| Sheet           | covered       | sheet           |                                                                             |
| Sidebar         | covered       | side-nav        |                                                                             |
| Skeleton        | covered       | skeleton        |                                                                             |
| Slider          | covered       | slider          |                                                                             |
| Sonner          | covered       | toast           |                                                                             |
| Spinner         | covered       | spinner         |                                                                             |
| Switch          | covered       | toggle          |                                                                             |
| Table           | covered       | data-table      |                                                                             |
| Tabs            | covered       | tabs            |                                                                             |
| Textarea        | covered       | textarea        |                                                                             |
| Toast           | covered       | toast           |                                                                             |
| Toggle          | covered       | toggle          |                                                                             |
| Toggle Group    | covered       | toggle-group    |                                                                             |
| Tooltip         | covered       | tooltip         |                                                                             |
| Typography      | covered       | prose           | prose + text + heading                                                      |

<!-- parity:shadcn:end -->

<!-- parity:carbon -->

## IBM Carbon

| Competitor         | Status   | cascivo            | Note                                                                            |
| ------------------ | -------- | ------------------ | ------------------------------------------------------------------------------- |
| Accordion          | covered  | accordion          |                                                                                 |
| AI label/slug      | deferred |                    | Niche; tied to Carbon AI-assist visual language. Out of scope.                  |
| Breadcrumb         | covered  | breadcrumb         |                                                                                 |
| Button             | covered  | button             |                                                                                 |
| Button set         | covered  | button-group       | = Button Group.                                                                 |
| Checkbox           | covered  | checkbox           |                                                                                 |
| Code snippet       | covered  | code-snippet       |                                                                                 |
| Combo box          | covered  | combobox           |                                                                                 |
| Contained list     | covered  | contained-list     |                                                                                 |
| Content switcher   | covered  | switcher           | switcher + segmented-control                                                    |
| Data table         | covered  | data-table         |                                                                                 |
| Date picker        | covered  | date-picker        |                                                                                 |
| Dropdown           | covered  | dropdown           |                                                                                 |
| File uploader      | covered  | file-uploader      |                                                                                 |
| Form               | covered  | form               |                                                                                 |
| Fluid              | deferred |                    | Styling variant of existing inputs, not a component.                            |
| Icon button        | covered  | icon-button        |                                                                                 |
| Inline loading     | covered  | inline-loading     |                                                                                 |
| Link               | covered  | link               |                                                                                 |
| List               | covered  | list               |                                                                                 |
| Loading            | covered  | spinner            |                                                                                 |
| Menu               | covered  | menu               |                                                                                 |
| Menu buttons       | covered  | menu-button        |                                                                                 |
| Modal              | covered  | modal              |                                                                                 |
| Multiselect        | covered  | multi-select       |                                                                                 |
| Notification       | covered  | toast              | toast covers the toast variant; inline/actionable queued (notification, v18-t5) |
| Number input       | covered  | number-input       |                                                                                 |
| Overflow menu      | covered  | overflow-menu      |                                                                                 |
| Pagination         | covered  | pagination         |                                                                                 |
| Popover            | covered  | popover            |                                                                                 |
| Progress bar       | covered  | progress-bar       |                                                                                 |
| Progress indicator | covered  | progress-indicator |                                                                                 |
| Radio button       | covered  | radio              |                                                                                 |
| Search             | covered  | search             |                                                                                 |
| Select             | covered  | select             |                                                                                 |
| Slider             | covered  | slider             |                                                                                 |
| Structured list    | covered  | structured-list    |                                                                                 |
| Tabs               | covered  | tabs               |                                                                                 |
| Tag                | covered  | tag                |                                                                                 |
| Text input         | covered  | input              |                                                                                 |
| Textarea           | covered  | textarea           |                                                                                 |
| Tile               | covered  | tile               |                                                                                 |
| Toggle             | covered  | toggle             |                                                                                 |
| Toggletip          | covered  | toggletip          | Distinct from hover tooltip.                                                    |
| Tooltip            | covered  | tooltip            |                                                                                 |
| Tree view          | covered  | tree-view          |                                                                                 |
| UI shell           | covered  | shell-header       | shell-header + side-nav + header-panel                                          |

<!-- parity:carbon:end -->
