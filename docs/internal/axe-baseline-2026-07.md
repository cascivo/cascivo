# Axe sweep baseline — 2026-07-02

First full run of `pnpm --filter @cascivo/storybook run test:axe` (the
`.github/workflows/axe.yml` nightly), against the 561-story build predating
the generated stories. **107 of 561 stories** had violations — 131 instances.

The sweep stays nightly/non-blocking until this backlog is triaged; promote it
to a PR gate (and strengthen the site's axe claim) once it runs clean.

## By rule

| Rule | Count | Impact |
| --- | --- | --- |
| color-contrast | 67 | serious |
| aria-allowed-attr | 17 | critical |
| aria-prohibited-attr | 16 | serious |
| target-size | 7 | serious |
| label | 7 | critical |
| nested-interactive | 5 | serious |
| aria-required-children | 5 | critical |
| aria-input-field-name | 5 | serious |

## Raw findings

```
  ai-ailabel--generating: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  ai-ailabel--primary: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  ai-ailabel--done: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  ai-ailabel--error: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  display-alert--info: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  display-alert--actionable: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  overlay-alertdialog--destructive: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  display-badge--primary: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  display-badge--default: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  display-badge--all-sizes: color-contrast (serious, 2 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-breadcrumb--primary: color-contrast (serious, 3 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-breadcrumb--basic: color-contrast (serious, 3 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-breadcrumb--two-levels: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-breadcrumb--collapsed: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-breadcrumb--without-links: color-contrast (serious, 2 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-breadcrumb--accessibility: color-contrast (serious, 3 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-button--destructive: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-checkboxcard--primary: label (critical, 1 node(s)) — Form elements must have labels
  inputs-combobox--clearable: target-size (serious, 1 node(s)) — All touch targets must be 24px large, or leave sufficient space
  inputs-combobox--with-hint: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  shell-consoleapp--primary: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  shell-consoleapp--default: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  display-datatable--pagination: color-contrast (serious, 2 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-datepicker--clearable: target-size (serious, 1 node(s)) — All touch targets must be 24px large, or leave sufficient space
  inputs-datepicker--with-hint: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  design-tokens-catalog--catalog: color-contrast (serious, 529 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-editable--empty: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-fileuploader--primary: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-fileuploader--default: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-fileuploader--with-files: color-contrast (serious, 4 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-fileuploader--multiple: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-fileuploader--with-hint: color-contrast (serious, 2 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-fileuploader--accessibility: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  overlay-menu--default: nested-interactive (serious, 1 node(s)) — Interactive controls must not be nested
  overlay-menu--default: target-size (serious, 1 node(s)) — All touch targets must be 24px large, or leave sufficient space
  overlay-menu--accessibility: nested-interactive (serious, 1 node(s)) — Interactive controls must not be nested
  overlay-menu--accessibility: target-size (serious, 1 node(s)) — All touch targets must be 24px large, or leave sufficient space
  inputs-multiselect--primary: aria-input-field-name (serious, 1 node(s)) — ARIA input fields must have an accessible name
  inputs-multiselect--primary: aria-required-children (critical, 1 node(s)) — Certain ARIA roles must contain particular children
  inputs-multiselect--primary: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-multiselect--default: aria-input-field-name (serious, 1 node(s)) — ARIA input fields must have an accessible name
  inputs-multiselect--default: aria-required-children (critical, 1 node(s)) — Certain ARIA roles must contain particular children
  inputs-multiselect--default: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-multiselect--with-selection: aria-input-field-name (serious, 1 node(s)) — ARIA input fields must have an accessible name
  inputs-multiselect--with-selection: aria-required-children (critical, 1 node(s)) — Certain ARIA roles must contain particular children
  inputs-multiselect--with-selection: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-multiselect--disabled: aria-input-field-name (serious, 1 node(s)) — ARIA input fields must have an accessible name
  inputs-multiselect--disabled: aria-required-children (critical, 1 node(s)) — Certain ARIA roles must contain particular children
  inputs-multiselect--accessibility: aria-input-field-name (serious, 1 node(s)) — ARIA input fields must have an accessible name
  inputs-multiselect--accessibility: aria-required-children (critical, 1 node(s)) — Certain ARIA roles must contain particular children
  inputs-multiselect--accessibility: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-pagination--primary: color-contrast (serious, 2 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-pagination--default: color-contrast (serious, 2 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-pagination--with-page-size-select: color-contrast (serious, 3 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-pagination--middle-page: color-contrast (serious, 2 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-pagination--last-page: color-contrast (serious, 2 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-pagination--single-page: color-contrast (serious, 2 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-pagination--empty: color-contrast (serious, 2 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-pagination--custom-labels: color-contrast (serious, 3 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-pagination--accessibility: color-contrast (serious, 3 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-passwordinput--with-strength-meter: aria-prohibited-attr (serious, 1 node(s)) — Elements must only use permitted ARIA attributes
  inputs-passwordinput--accessibility: aria-prohibited-attr (serious, 1 node(s)) — Elements must only use permitted ARIA attributes
  overlay-popover--default: nested-interactive (serious, 1 node(s)) — Interactive controls must not be nested
  overlay-popover--default: target-size (serious, 1 node(s)) — All touch targets must be 24px large, or leave sufficient space
  overlay-popover--controlled: nested-interactive (serious, 1 node(s)) — Interactive controls must not be nested
  overlay-popover--controlled: target-size (serious, 1 node(s)) — All touch targets must be 24px large, or leave sufficient space
  overlay-popover--accessibility: nested-interactive (serious, 1 node(s)) — Interactive controls must not be nested
  overlay-popover--accessibility: target-size (serious, 1 node(s)) — All touch targets must be 24px large, or leave sufficient space
  navigation-progressindicator--primary: color-contrast (serious, 2 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-progressindicator--default: color-contrast (serious, 2 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-progressindicator--first-step: color-contrast (serious, 3 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-progressindicator--without-descriptions: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-progressindicator--vertical: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  navigation-progressindicator--accessibility: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-radio--primary: label (critical, 1 node(s)) — Form elements must have labels
  shell-switcher--default: list (serious, 1 node(s)) — <ul> and <ol> must only directly contain <li>, <script> or <template> elements
  shell-switcher--with-icons-and-dividers: list (serious, 1 node(s)) — <ul> and <ol> must only directly contain <li>, <script> or <template> elements
  display-tag--info: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  display-tag--success: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  display-tag--warning: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-tagsinput--primary: label (critical, 1 node(s)) — Form elements must have labels
  inputs-tagsinput--default: label (critical, 1 node(s)) — Form elements must have labels
  inputs-tagsinput--disabled: color-contrast (serious, 2 node(s)) — Elements must meet minimum color contrast ratio thresholds
  inputs-tagsinput--disabled: label (critical, 1 node(s)) — Form elements must have labels
  inputs-tagsinput--with-max: label (critical, 1 node(s)) — Form elements must have labels
  inputs-tagsinput--accessibility: label (critical, 1 node(s)) — Form elements must have labels
  inputs-timepicker--with-hint: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  charts-plaincharts--all-micro-charts: aria-prohibited-attr (serious, 47 node(s)) — Elements must only use permitted ARIA attributes
  charts-boxplot--default: aria-prohibited-attr (serious, 3 node(s)) — Elements must only use permitted ARIA attributes
  charts-bubblechart--default: aria-prohibited-attr (serious, 8 node(s)) — Elements must only use permitted ARIA attributes
  charts-bubblechart--single-series: aria-prohibited-attr (serious, 4 node(s)) — Elements must only use permitted ARIA attributes
  charts-bullet--default: aria-prohibited-attr (serious, 2 node(s)) — Elements must only use permitted ARIA attributes
  charts-bullet--over-target: aria-prohibited-attr (serious, 2 node(s)) — Elements must only use permitted ARIA attributes
  charts-combochart--default: aria-prohibited-attr (serious, 6 node(s)) — Elements must only use permitted ARIA attributes
  charts-combochart--dual-axis: aria-prohibited-attr (serious, 6 node(s)) — Elements must only use permitted ARIA attributes
  charts-heatmap--default: aria-prohibited-attr (serious, 20 node(s)) — Elements must only use permitted ARIA attributes
  charts-histogram--default: aria-prohibited-attr (serious, 7 node(s)) — Elements must only use permitted ARIA attributes
  charts-histogram--fewer-bins: aria-prohibited-attr (serious, 6 node(s)) — Elements must only use permitted ARIA attributes
  charts-kpi--default: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  charts-piechart--empty: aria-prohibited-attr (serious, 1 node(s)) — Elements must only use permitted ARIA attributes
  charts-radar--default: aria-prohibited-attr (serious, 2 node(s)) — Elements must only use permitted ARIA attributes
  charts-radar--single: aria-prohibited-attr (serious, 1 node(s)) — Elements must only use permitted ARIA attributes
  editor-codeeditor--basic: aria-allowed-attr (critical, 1 node(s)) — Elements must only use supported ARIA attributes
  editor-codeeditor--basic: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  editor-codeeditor--with-line-numbers: aria-allowed-attr (critical, 1 node(s)) — Elements must only use supported ARIA attributes
  editor-codeeditor--with-line-numbers: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  editor-codeeditor--read-only: aria-allowed-attr (critical, 1 node(s)) — Elements must only use supported ARIA attributes
  editor-codeeditor--read-only: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  editor-codeeditor--wrap: aria-allowed-attr (critical, 1 node(s)) — Elements must only use supported ARIA attributes
  editor-codeeditor--languages: aria-allowed-attr (critical, 5 node(s)) — Elements must only use supported ARIA attributes
  editor-codeeditor--themed: aria-allowed-attr (critical, 2 node(s)) — Elements must only use supported ARIA attributes
  editor-codeeditor--themed: color-contrast (serious, 2 node(s)) — Elements must meet minimum color contrast ratio thresholds
  editor-codeeditor--find-and-replace: aria-allowed-attr (critical, 1 node(s)) — Elements must only use supported ARIA attributes
  editor-codeeditor--find-and-replace: color-contrast (serious, 5 node(s)) — Elements must meet minimum color contrast ratio thresholds
  editor-codeeditor--save: aria-allowed-attr (critical, 1 node(s)) — Elements must only use supported ARIA attributes
  editor-codeeditor--save: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  editor-codeeditor--undo-redo: aria-allowed-attr (critical, 1 node(s)) — Elements must only use supported ARIA attributes
  editor-codeeditor--bracket-matching: aria-allowed-attr (critical, 1 node(s)) — Elements must only use supported ARIA attributes
  editor-codeeditor--active-line-gutter: aria-allowed-attr (critical, 1 node(s)) — Elements must only use supported ARIA attributes
  editor-codeeditor--active-line-gutter: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  editor-codeeditor--markdown: aria-allowed-attr (critical, 1 node(s)) — Elements must only use supported ARIA attributes
  editor-codeeditor--markdown: color-contrast (serious, 5 node(s)) — Elements must meet minimum color contrast ratio thresholds
  editor-codeeditor--theme-switch: aria-allowed-attr (critical, 1 node(s)) — Elements must only use supported ARIA attributes
  editor-codeeditor--theme-switch: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  editor-codeeditor--imperative-handle: aria-allowed-attr (critical, 1 node(s)) — Elements must only use supported ARIA attributes
  editor-codeeditor--imperative-handle: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  editor-codeeditor--decorations: aria-allowed-attr (critical, 1 node(s)) — Elements must only use supported ARIA attributes
  editor-codeeditor--slash-commands: aria-allowed-attr (critical, 1 node(s)) — Elements must only use supported ARIA attributes
  editor-codeeditor--custom-keymap: aria-allowed-attr (critical, 1 node(s)) — Elements must only use supported ARIA attributes
  flow-flowstory--a-request-response-storyboard: color-contrast (serious, 1 node(s)) — Elements must meet minimum color contrast ratio thresholds
  flow-flowstory--a-linear-pipeline: color-contrast (serious, 2 node(s)) — Elements must meet minimum color contrast ratio thresholds
  editor-codeeditor--large-document: LOAD ERROR Error: frame.evaluate: Target page, context or browser has been closed
```
