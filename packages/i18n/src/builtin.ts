import { defineCatalog, defineMessages } from './messages'

/**
 * Built-in strings for cascade components. Components call
 * `t(builtin.<component>.<key>)` as the default and accept a `labels` prop
 * override. en values are the message defaults; de ships first-party.
 */
export const builtin = {
  pagination: defineMessages('cascade.pagination', {
    itemsPerPage: 'Items per page',
    pageOf: 'Page {page} of {total}',
    range: '{start}–{end} of {total} items',
    previous: 'Previous page',
    next: 'Next page',
    nav: 'Pagination',
  }),
  toast: defineMessages('cascade.toast', {
    dismiss: 'Dismiss notification',
    region: 'Notifications',
  }),
  modal: defineMessages('cascade.modal', {
    close: 'Close modal',
  }),
  alert: defineMessages('cascade.alert', {
    dismiss: 'Dismiss',
  }),
  header: defineMessages('cascade.header', {
    nav: 'Main',
  }),
  search: defineMessages('cascade.search', {
    label: 'Search',
    placeholder: 'Search',
    clear: 'Clear search',
  }),
  commandMenu: defineMessages('cascade.commandMenu', {
    label: 'Command menu',
    placeholder: 'Type a command or search…',
    empty: 'No results found',
    back: 'Back',
    loading: 'Loading…',
    matches: '{count} matches',
    scopeLabel: 'Scope',
    clearScope: 'Clear scope',
  }),
  breadcrumb: defineMessages('cascade.breadcrumb', {
    nav: 'Breadcrumb',
  }),
  toc: defineMessages('cascade.toc', {
    nav: 'On this page',
  }),
  datePicker: defineMessages('cascade.datePicker', {
    placeholder: 'Select a date',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    clear: 'Clear date',
  }),
  combobox: defineMessages('cascade.combobox', {
    placeholder: 'Select an option',
    empty: 'No options found',
    clear: 'Clear selection',
    search: 'Search options',
  }),
  dataTable: defineMessages('cascade.dataTable', {
    search: 'Search',
    empty: 'No data',
    selectAll: 'Select all rows',
    selectRow: 'Select row',
    itemsSelected: '{count} selected',
    expandRow: 'Expand row',
    previousPage: 'Previous page',
    nextPage: 'Next page',
  }),
  dock: defineMessages('cascade.dock', {
    nav: 'Main navigation',
  }),
  steps: defineMessages('cascade.steps', {
    label: 'Steps',
  }),
  overflowMenu: defineMessages('cascade.overflowMenu', {
    trigger: 'More actions',
  }),
  sideNav: defineMessages('cascade.sideNav', {
    nav: 'Side navigation',
    collapse: 'Collapse navigation',
    expand: 'Expand navigation',
  }),
  spinner: defineMessages('cascade.spinner', {
    label: 'Loading',
  }),
  numberInput: defineMessages('cascade.numberInput', {
    increment: 'Increment',
    decrement: 'Decrement',
  }),
  tag: defineMessages('cascade.tag', {
    dismiss: 'Remove',
  }),
  appShell: defineMessages('cascade.appShell', {
    collapse: 'Collapse navigation',
    expand: 'Expand navigation',
    dismissError: 'Dismiss error',
  }),
  charts: defineMessages('cascade.charts', {
    legendToggle: 'Toggle series {name}',
    noData: 'No data',
    resetZoom: 'Reset zoom',
    exportPng: 'Export PNG',
    exportSvg: 'Export SVG',
    dataView: 'Data view',
    restore: 'Restore',
  }),
  alertDialog: defineMessages('cascade.alertDialog', {
    confirm: 'Confirm',
    cancel: 'Cancel',
  }),
  sheet: defineMessages('cascade.sheet', {
    close: 'Close panel',
  }),
  bottomSheet: defineMessages('cascade.bottomSheet', {
    close: 'Close',
    handle: 'Drag to resize',
  }),
  actionSheet: defineMessages('cascade.actionSheet', {
    label: 'Actions',
    cancel: 'Cancel',
  }),
  pullToRefresh: defineMessages('cascade.pullToRefresh', {
    pull: 'Pull to refresh',
    release: 'Release to refresh',
    refreshing: 'Refreshing',
  }),
  fileUploader: defineMessages('cascade.fileUploader', {
    label: 'Upload files',
    drop: 'Drag and drop files here or click to upload',
    remove: 'Remove {name}',
    uploading: 'Uploading',
    complete: 'Upload complete',
    error: 'Upload failed',
  }),
  passwordInput: defineMessages('cascade.passwordInput', {
    reveal: 'Show password',
    hide: 'Hide password',
    strengthWeak: 'weak',
    strengthFair: 'fair',
    strengthGood: 'good',
    strengthStrong: 'strong',
    strengthLabel: 'Password strength: {level}',
  }),
  multiSelect: defineMessages('cascade.multiSelect', {
    label: 'Options',
    placeholder: 'Select options',
    selected: '{count} selected',
    search: 'Search options',
    noResults: 'No options found',
  }),
  tagsInput: defineMessages('cascade.tagsInput', {
    label: 'Tags',
    remove: 'Remove {tag}',
    placeholder: 'Add tag…',
  }),
  otpInput: defineMessages('cascade.otpInput', {
    label: 'One-time code',
    digit: 'Digit {n}',
  }),
  ai: defineMessages('cascade.ai', {
    generating: 'Generating…',
    done: 'Done',
    error: 'Error',
    send: 'Send',
    placeholder: 'Type a message…',
    you: 'You',
    assistant: 'Assistant',
  }),
  shellHeader: defineMessages('cascade.shellHeader', {
    skipToContent: 'Skip to main content',
    nav: 'Main',
    openMenu: 'Open navigation',
    closeMenu: 'Close navigation',
  }),
  headerPanel: defineMessages('cascade.headerPanel', {
    close: 'Close panel',
  }),
  switcher: defineMessages('cascade.switcher', {
    label: 'Switch application',
  }),
  copyButton: defineMessages('cascade.copyButton', {
    copy: 'Copy',
    copied: 'Copied',
  }),
  skipNav: defineMessages('cascade.skipNav', {
    label: 'Skip to content',
  }),
  form: defineMessages('cascade.form', {
    required: 'Required',
    invalid: 'Invalid value',
  }),
  label: defineMessages('cascade.label', {
    required: 'Required',
  }),
  inlineLoading: defineMessages('cascade.inlineLoading', {
    active: 'Loading',
    finished: 'Loaded',
    error: 'Error',
  }),
  notification: defineMessages('cascade.notification', {
    dismiss: 'Dismiss',
  }),
  treeView: defineMessages('cascade.treeView', {
    loading: 'Loading…',
    expand: 'Expand',
    collapse: 'Collapse',
  }),
  carousel: defineMessages('cascade.carousel', {
    region: 'Carousel',
    previous: 'Previous slide',
    next: 'Next slide',
    slide: '{n} of {total}',
    goTo: 'Go to slide {n}',
  }),
  calendar: defineMessages('cascade.calendar', {
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    today: 'Today',
  }),
  colorPicker: defineMessages('cascade.colorPicker', {
    hue: 'Hue',
    alpha: 'Alpha',
    colorArea: 'Saturation and lightness',
    eyedropper: 'Pick a color from the screen',
  }),
  drawer: defineMessages('cascade.drawer', {
    close: 'Close',
  }),
  menuButton: defineMessages('cascade.menuButton', {
    open: 'Open menu',
  }),
  resizable: defineMessages('cascade.resizable', {
    handle: 'Resize panels',
  }),
  codeSnippet: defineMessages('cascade.codeSnippet', {
    copy: 'Copy code',
    copied: 'Copied',
  }),
  dateRangePicker: defineMessages('cascade.dateRangePicker', {
    label: 'Date range',
    placeholder: 'Select a date range',
    start: 'Start date',
    end: 'End date',
    apply: 'Apply',
    clear: 'Clear',
  }),
  toggletip: defineMessages('cascade.toggletip', {
    label: 'More information',
  }),
  avatarGroup: defineMessages('cascade.avatarGroup', {
    more: '{count} more',
  }),
  comparison: defineMessages('cascade.comparison', {
    label: 'Comparison slider',
  }),
  qrCode: defineMessages('cascade.qrCode', {
    label: 'QR code',
  }),
  flow: defineMessages('cascade.flow', {
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fitView: 'Fit view',
    minimap: 'Minimap',
    play: 'Play',
    pause: 'Pause',
    next: 'Next step',
    previous: 'Previous step',
    restart: 'Restart',
    step: 'Step {current} of {total}',
  }),
  logViewer: defineMessages('cascade.logViewer', {
    label: 'Log output',
    search: 'Search log',
    follow: 'Following',
    paused: 'Jump to latest',
    copy: 'Copy',
    copied: 'Copied',
    empty: 'No log output',
    matches: '{count} matches',
    lines: '{count} lines',
  }),
  editor: defineMessages('cascade.editor', {
    label: 'Code editor',
    code: 'Code',
    find: 'Find',
    replace: 'Replace',
    findPlaceholder: 'Find',
    replacePlaceholder: 'Replace with',
    next: 'Next match',
    previous: 'Previous match',
    replaceOne: 'Replace',
    replaceAll: 'Replace all',
    close: 'Close',
    matchCase: 'Match case',
    toggleReplace: 'Toggle replace',
    noMatches: 'No results',
    findCount: '{current} of {total}',
    commandMenu: 'Command menu',
    commandMenuEmpty: 'No commands',
  }),
}

defineCatalog(builtin.pagination, 'de', {
  itemsPerPage: 'Einträge pro Seite',
  pageOf: 'Seite {page} von {total}',
  range: '{start}–{end} von {total} Einträgen',
  previous: 'Vorherige Seite',
  next: 'Nächste Seite',
  nav: 'Seitennummerierung',
})
defineCatalog(builtin.toast, 'de', {
  dismiss: 'Benachrichtigung schließen',
  region: 'Benachrichtigungen',
})
defineCatalog(builtin.modal, 'de', {
  close: 'Dialog schließen',
})
defineCatalog(builtin.alert, 'de', {
  dismiss: 'Schließen',
})
defineCatalog(builtin.header, 'de', {
  nav: 'Hauptnavigation',
})
defineCatalog(builtin.search, 'de', {
  label: 'Suche',
  placeholder: 'Suchen',
  clear: 'Suche löschen',
})
defineCatalog(builtin.commandMenu, 'de', {
  label: 'Befehlsmenü',
  placeholder: 'Befehl oder Suche eingeben…',
  empty: 'Keine Ergebnisse',
  back: 'Zurück',
  loading: 'Wird geladen…',
  matches: '{count} Treffer',
  scopeLabel: 'Bereich',
  clearScope: 'Bereich löschen',
})
defineCatalog(builtin.breadcrumb, 'de', {
  nav: 'Navigationspfad',
})
defineCatalog(builtin.datePicker, 'de', {
  placeholder: 'Datum auswählen',
  previousMonth: 'Vorheriger Monat',
  nextMonth: 'Nächster Monat',
  clear: 'Datum löschen',
})
defineCatalog(builtin.combobox, 'de', {
  placeholder: 'Option auswählen',
  empty: 'Keine Optionen gefunden',
  clear: 'Auswahl löschen',
  search: 'Optionen durchsuchen',
})
defineCatalog(builtin.dataTable, 'de', {
  search: 'Suchen',
  empty: 'Keine Daten',
  selectAll: 'Alle Zeilen auswählen',
  selectRow: 'Zeile auswählen',
  itemsSelected: '{count} ausgewählt',
  expandRow: 'Zeile aufklappen',
  previousPage: 'Vorherige Seite',
  nextPage: 'Nächste Seite',
})
defineCatalog(builtin.dock, 'de', {
  nav: 'Hauptnavigation',
})
defineCatalog(builtin.steps, 'de', {
  label: 'Schritte',
})
defineCatalog(builtin.overflowMenu, 'de', {
  trigger: 'Weitere Aktionen',
})
defineCatalog(builtin.sideNav, 'de', {
  nav: 'Seitennavigation',
  collapse: 'Navigation einklappen',
  expand: 'Navigation ausklappen',
})
defineCatalog(builtin.spinner, 'de', {
  label: 'Wird geladen',
})
defineCatalog(builtin.numberInput, 'de', {
  increment: 'Erhöhen',
  decrement: 'Verringern',
})
defineCatalog(builtin.tag, 'de', {
  dismiss: 'Entfernen',
})
defineCatalog(builtin.appShell, 'de', {
  collapse: 'Navigation einklappen',
  expand: 'Navigation ausklappen',
  dismissError: 'Fehler schließen',
})
defineCatalog(builtin.charts, 'de', {
  legendToggle: 'Reihe {name} umschalten',
  noData: 'Keine Daten',
  resetZoom: 'Zoom zurücksetzen',
  exportPng: 'PNG exportieren',
  exportSvg: 'SVG exportieren',
  dataView: 'Datenansicht',
  restore: 'Zurücksetzen',
})
defineCatalog(builtin.alertDialog, 'de', {
  confirm: 'Bestätigen',
  cancel: 'Abbrechen',
})
defineCatalog(builtin.sheet, 'de', {
  close: 'Bereich schließen',
})
defineCatalog(builtin.bottomSheet, 'de', {
  close: 'Schließen',
  handle: 'Zum Anpassen ziehen',
})
defineCatalog(builtin.actionSheet, 'de', {
  label: 'Aktionen',
  cancel: 'Abbrechen',
})
defineCatalog(builtin.pullToRefresh, 'de', {
  pull: 'Zum Aktualisieren ziehen',
  release: 'Zum Aktualisieren loslassen',
  refreshing: 'Wird aktualisiert',
})
defineCatalog(builtin.fileUploader, 'de', {
  label: 'Dateien hochladen',
  drop: 'Dateien hier ablegen oder klicken zum Hochladen',
  remove: '{name} entfernen',
  uploading: 'Wird hochgeladen',
  complete: 'Hochladen abgeschlossen',
  error: 'Hochladen fehlgeschlagen',
})
defineCatalog(builtin.passwordInput, 'de', {
  reveal: 'Passwort anzeigen',
  hide: 'Passwort verbergen',
  strengthWeak: 'schwach',
  strengthFair: 'mäßig',
  strengthGood: 'gut',
  strengthStrong: 'stark',
  strengthLabel: 'Passwortstärke: {level}',
})
defineCatalog(builtin.multiSelect, 'de', {
  label: 'Optionen',
  placeholder: 'Optionen auswählen',
  selected: '{count} ausgewählt',
  search: 'Optionen durchsuchen',
  noResults: 'Keine Optionen gefunden',
})
defineCatalog(builtin.tagsInput, 'de', {
  label: 'Schlagwörter',
  remove: '{tag} entfernen',
  placeholder: 'Tag hinzufügen…',
})
defineCatalog(builtin.otpInput, 'de', {
  label: 'Einmalcode',
  digit: 'Ziffer {n}',
})
defineCatalog(builtin.ai, 'de', {
  generating: 'Wird generiert…',
  done: 'Fertig',
  error: 'Fehler',
  send: 'Senden',
  placeholder: 'Nachricht eingeben…',
  you: 'Du',
  assistant: 'Assistent',
})
defineCatalog(builtin.shellHeader, 'de', {
  skipToContent: 'Zum Hauptinhalt springen',
  nav: 'Hauptnavigation',
  openMenu: 'Navigation öffnen',
  closeMenu: 'Navigation schließen',
})
defineCatalog(builtin.headerPanel, 'de', {
  close: 'Panel schließen',
})
defineCatalog(builtin.switcher, 'de', {
  label: 'Anwendung wechseln',
})
defineCatalog(builtin.copyButton, 'de', {
  copy: 'Kopieren',
  copied: 'Kopiert',
})
defineCatalog(builtin.skipNav, 'de', {
  label: 'Zum Inhalt springen',
})
defineCatalog(builtin.form, 'de', {
  required: 'Pflichtfeld',
  invalid: 'Ungültiger Wert',
})
defineCatalog(builtin.label, 'de', {
  required: 'Erforderlich',
})
defineCatalog(builtin.inlineLoading, 'de', {
  active: 'Wird geladen',
  finished: 'Geladen',
  error: 'Fehler',
})
defineCatalog(builtin.notification, 'de', {
  dismiss: 'Schließen',
})
defineCatalog(builtin.treeView, 'de', {
  loading: 'Wird geladen…',
  expand: 'Aufklappen',
  collapse: 'Zuklappen',
})
defineCatalog(builtin.carousel, 'de', {
  region: 'Karussell',
  previous: 'Vorherige Folie',
  next: 'Nächste Folie',
  slide: '{n} von {total}',
  goTo: 'Zu Folie {n}',
})
defineCatalog(builtin.calendar, 'de', {
  previousMonth: 'Vorheriger Monat',
  nextMonth: 'Nächster Monat',
  today: 'Heute',
})
defineCatalog(builtin.colorPicker, 'de', {
  hue: 'Farbton',
  alpha: 'Alpha',
  colorArea: 'Sättigung und Helligkeit',
  eyedropper: 'Farbe vom Bildschirm wählen',
})
defineCatalog(builtin.drawer, 'de', {
  close: 'Schließen',
})
defineCatalog(builtin.menuButton, 'de', {
  open: 'Menü öffnen',
})
defineCatalog(builtin.resizable, 'de', {
  handle: 'Bereiche anpassen',
})
defineCatalog(builtin.codeSnippet, 'de', {
  copy: 'Code kopieren',
  copied: 'Kopiert',
})
defineCatalog(builtin.dateRangePicker, 'de', {
  label: 'Zeitraum',
  placeholder: 'Zeitraum auswählen',
  start: 'Startdatum',
  end: 'Enddatum',
  apply: 'Anwenden',
  clear: 'Löschen',
})
defineCatalog(builtin.toggletip, 'de', {
  label: 'Weitere Informationen',
})
defineCatalog(builtin.toc, 'de', {
  nav: 'Auf dieser Seite',
})
defineCatalog(builtin.avatarGroup, 'de', {
  more: '{count} weitere',
})
defineCatalog(builtin.comparison, 'de', {
  label: 'Vergleichsregler',
})
defineCatalog(builtin.qrCode, 'de', {
  label: 'QR-Code',
})
defineCatalog(builtin.flow, 'de', {
  zoomIn: 'Vergrößern',
  zoomOut: 'Verkleinern',
  fitView: 'Ansicht anpassen',
  minimap: 'Übersichtskarte',
  play: 'Abspielen',
  pause: 'Pause',
  next: 'Nächster Schritt',
  previous: 'Vorheriger Schritt',
  restart: 'Neu starten',
  step: 'Schritt {current} von {total}',
})
defineCatalog(builtin.logViewer, 'de', {
  label: 'Protokollausgabe',
  search: 'Protokoll durchsuchen',
  follow: 'Folgt',
  paused: 'Zum Neuesten springen',
  copy: 'Kopieren',
  copied: 'Kopiert',
  empty: 'Keine Protokollausgabe',
  matches: '{count} Treffer',
  lines: '{count} Zeilen',
})
defineCatalog(builtin.editor, 'de', {
  label: 'Code-Editor',
  code: 'Code',
  find: 'Suchen',
  replace: 'Ersetzen',
  findPlaceholder: 'Suchen',
  replacePlaceholder: 'Ersetzen durch',
  next: 'Nächster Treffer',
  previous: 'Vorheriger Treffer',
  replaceOne: 'Ersetzen',
  replaceAll: 'Alle ersetzen',
  close: 'Schließen',
  matchCase: 'Groß-/Kleinschreibung',
  toggleReplace: 'Ersetzen umschalten',
  noMatches: 'Keine Treffer',
  findCount: '{current} von {total}',
  commandMenu: 'Befehlsmenü',
  commandMenuEmpty: 'Keine Befehle',
})
