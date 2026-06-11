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
  }),
  breadcrumb: defineMessages('cascade.breadcrumb', {
    nav: 'Breadcrumb',
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
  }),
  dataTable: defineMessages('cascade.dataTable', {
    search: 'Search',
    empty: 'No data',
    selectAll: 'Select all rows',
    selectRow: 'Select row',
    itemsSelected: '{count} selected',
    expandRow: 'Expand row',
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
  }),
  charts: defineMessages('cascade.charts', {
    legendToggle: 'Toggle series {name}',
  }),
  alertDialog: defineMessages('cascade.alertDialog', {
    confirm: 'Confirm',
    cancel: 'Cancel',
  }),
  sheet: defineMessages('cascade.sheet', {
    close: 'Close panel',
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
    placeholder: 'Select options',
    selected: '{count} selected',
    search: 'Search options',
    noResults: 'No options found',
  }),
  tagsInput: defineMessages('cascade.tagsInput', {
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
})
defineCatalog(builtin.dataTable, 'de', {
  search: 'Suchen',
  empty: 'Keine Daten',
  selectAll: 'Alle Zeilen auswählen',
  selectRow: 'Zeile auswählen',
  itemsSelected: '{count} ausgewählt',
  expandRow: 'Zeile aufklappen',
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
})
defineCatalog(builtin.charts, 'de', {
  legendToggle: 'Reihe {name} umschalten',
})
defineCatalog(builtin.alertDialog, 'de', {
  confirm: 'Bestätigen',
  cancel: 'Abbrechen',
})
defineCatalog(builtin.sheet, 'de', {
  close: 'Bereich schließen',
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
  placeholder: 'Optionen auswählen',
  selected: '{count} ausgewählt',
  search: 'Optionen durchsuchen',
  noResults: 'Keine Optionen gefunden',
})
defineCatalog(builtin.tagsInput, 'de', {
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
