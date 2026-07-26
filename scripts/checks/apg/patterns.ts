/**
 * ARIA APG (Authoring Practices Guide) pattern requirements.
 * Each pattern declares the minimum required role and keyboard keys.
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/
 */
export interface ApgPattern {
  /** ARIA APG pattern page URL */
  url: string
  /** Required ARIA role(s) — at least one must appear in accessibility.role */
  requiredRoles: string[]
  /** Required keyboard keys — all must appear in accessibility.keyboard */
  requiredKeys: string[]
}

export const APG_PATTERNS: Record<string, ApgPattern> = {
  tabs: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
    requiredRoles: ['tablist', 'tab', 'tabpanel'],
    requiredKeys: ['ArrowLeft', 'ArrowRight'],
  },
  'dialog-modal': {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    requiredRoles: ['dialog'],
    requiredKeys: ['Escape'],
  },
  alertdialog: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/',
    requiredRoles: ['alertdialog'],
    requiredKeys: ['Escape'],
  },
  accordion: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    requiredRoles: ['button'],
    requiredKeys: ['Enter', 'Space'],
  },
  disclosure: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    requiredRoles: ['button'],
    requiredKeys: ['Enter', 'Space'],
  },
  /**
   * A `<nav>` landmark whose top-level items are disclosure buttons revealing submenus —
   * APG's "Disclosure Navigation Menu" example. Distinct from a single disclosure widget:
   * the component's headline role is the landmark, while each trigger is a button, and
   * arrow-key roving between triggers is part of the pattern.
   */
  'disclosure-navigation': {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/',
    requiredRoles: ['navigation', 'button'],
    requiredKeys: ['Enter', 'Space', 'Escape'],
  },
  /**
   * A button that opens a menu. Both roles are part of the widget (the trigger and the
   * popup), so either satisfies the headline `role` field.
   */
  'menu-button': {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/',
    requiredRoles: ['button', 'menu'],
    requiredKeys: ['Enter', 'Space', 'ArrowDown', 'Escape'],
  },
  menubar: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/menubar/',
    requiredRoles: ['menubar'],
    requiredKeys: ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'Home', 'End', 'Enter', 'Escape'],
  },
  windowsplitter: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/',
    requiredRoles: ['separator'],
    requiredKeys: ['ArrowLeft', 'ArrowRight', 'Home', 'End'],
  },
  /** The group half of the radio pattern — used by single-select toggle groups. */
  radiogroup: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/',
    requiredRoles: ['radiogroup'],
    requiredKeys: ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Space'],
  },
  'tree-view': {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/treeview/',
    requiredRoles: ['tree'],
    requiredKeys: ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End', 'Enter'],
  },
  checkbox: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/',
    requiredRoles: ['checkbox'],
    requiredKeys: ['Space'],
  },
  radio: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/',
    requiredRoles: ['radiogroup', 'radio'],
    requiredKeys: ['ArrowDown', 'ArrowUp', 'Space'],
  },
  switch: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/switch/',
    requiredRoles: ['switch'],
    requiredKeys: ['Space'],
  },
  slider: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider/',
    requiredRoles: ['slider'],
    requiredKeys: ['ArrowLeft', 'ArrowRight', 'Home', 'End'],
  },
  combobox: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
    requiredRoles: ['combobox'],
    requiredKeys: ['ArrowDown', 'Escape', 'Enter'],
  },
  listbox: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/',
    requiredRoles: ['listbox'],
    requiredKeys: ['ArrowDown', 'ArrowUp', 'Enter'],
  },
  menu: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu/',
    requiredRoles: ['menu', 'menuitem'],
    requiredKeys: ['ArrowDown', 'ArrowUp', 'Escape', 'Enter'],
  },
  menubutton: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/',
    requiredRoles: ['button'],
    requiredKeys: ['Enter', 'Space', 'ArrowDown'],
  },
  tooltip: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/',
    requiredRoles: ['tooltip'],
    requiredKeys: ['Escape'],
  },
  breadcrumb: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',
    requiredRoles: ['navigation'],
    requiredKeys: [],
  },
  button: {
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
    requiredRoles: ['button'],
    requiredKeys: ['Enter', 'Space'],
  },
}
