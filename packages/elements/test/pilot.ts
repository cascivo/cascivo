/**
 * The pilot page: the markup `Menu`, `Combobox` and `DatePicker` render (contract classes
 * `cv-<unit>-<local>` instead of CSS-module hashes), as a server would send it before any
 * script runs. `scripts/checks/elements.test.ts` loads it in Chromium and also morphs back
 * to it with idiomorph, the way an htmx swap re-renders a region.
 */
const option = (value: string, label: string, disabled = false) =>
  `<div class="cv-combobox-option" role="option" data-value="${value}" aria-selected="false"${
    disabled ? ' aria-disabled="true" data-disabled' : ''
  }><span class="cv-combobox-optionLabel">${label}</span><span class="cv-combobox-check" aria-hidden="true"></span></div>`

const item = (value: string, label: string, disabled = false) =>
  `<div class="cv-menu-item" role="menuitem" data-value="${value}"${disabled ? ' aria-disabled="true"' : ''}>${label}</div>`

const tab = (v: string, label: string, on: boolean, disabled = false) =>
  `<button type="button" class="cv-tabs-trigger" role="tab" id="plan-trigger-${v}" aria-selected="${on}" aria-controls="plan-content-${v}" tabindex="${on ? 0 : -1}" data-state="${on ? 'active' : 'inactive'}" data-value="${v}"${disabled ? ' disabled' : ''}>${label}</button>`
const tabPanel = (v: string, on: boolean) =>
  `<div class="cv-tabs-content" role="tabpanel" id="plan-content-${v}" aria-labelledby="plan-trigger-${v}" tabindex="0" data-state="${on ? 'active' : 'inactive'}"${on ? '' : ' hidden'}>${v} panel</div>`

export const PILOT = `<form id="pilot">
<cv-tabs id="plan">
  <div class="cv-tabs-tabs">
    <div class="cv-tabs-list" role="tablist" aria-label="Plan">${tab('overview', 'Overview', true)}${tab('details', 'Info', false)}${tab('billing', 'Bill', false, true)}${tab('history', 'Log', false)}</div>
    ${tabPanel('overview', true)}${tabPanel('details', false)}${tabPanel('billing', false)}${tabPanel('history', false)}
  </div>
</cv-tabs>
<cv-menu id="actions">
  <button type="button" class="cv-menu-trigger" aria-haspopup="menu" aria-expanded="false" aria-label="Actions">⋯</button>
  <div class="cv-menu-panel" role="menu" popover="auto" data-state="closed">
    ${item('edit', 'Edit')}${item('duplicate', 'Duplicate')}<div class="cv-menu-separator" role="separator"></div>${item('archive', 'Archive', true)}${item('delete', 'Delete')}
  </div>
</cv-menu>
<cv-combobox id="fruit" name="fruit" value="apple" required>
  <div class="cv-combobox-wrapper" data-size="md" data-state="closed">
    <label class="cv-combobox-label" id="fruit-label" for="fruit-input">Fruit</label>
    <div class="cv-combobox-field">
      <input id="fruit-input" class="cv-combobox-trigger" type="text" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="false" autocomplete="off">
      <span class="cv-combobox-chevron" aria-hidden="true"></span>
    </div>
    <div class="cv-combobox-popup" data-state="closed">
      <div class="cv-combobox-listbox" role="listbox" aria-labelledby="fruit-label">
        ${option('apple', 'Apple')}${option('banana', 'Banana')}${option('blueberry', 'Blueberry')}${option('cherry', 'Cherry', true)}${option('grape', 'Grape')}
      </div>
      <div class="cv-combobox-empty" role="status" hidden></div>
    </div>
    <span class="cv-combobox-srOnly" role="status" aria-live="polite"></span>
  </div>
</cv-combobox>
<cv-date-picker id="due" name="due" value="2026-11-21" min="2026-01-01" max="2027-06-30">
  <div class="cv-date-picker-wrapper" data-size="md" data-state="closed">
    <label class="cv-date-picker-label" for="due-input">Due date</label>
    <div class="cv-date-picker-field">
      <input id="due-input" class="cv-date-picker-trigger" type="text" role="combobox" aria-haspopup="dialog" aria-expanded="false" autocomplete="off" inputmode="numeric">
      <button type="button" class="cv-date-picker-openButton" aria-label="Open calendar" aria-expanded="false"><span class="cv-date-picker-calendarGlyph" aria-hidden="true"></span></button>
    </div>
    <div class="cv-date-picker-popup" role="dialog" data-state="closed"></div>
  </div>
</cv-date-picker>
</form>`
