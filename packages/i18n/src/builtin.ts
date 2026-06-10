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
  }),
  toast: defineMessages('cascade.toast', {
    dismiss: 'Dismiss notification',
  }),
  modal: defineMessages('cascade.modal', {
    close: 'Close',
  }),
}

defineCatalog(builtin.pagination, 'de', {
  itemsPerPage: 'Einträge pro Seite',
  pageOf: 'Seite {page} von {total}',
  range: '{start}–{end} von {total} Einträgen',
  previous: 'Vorherige Seite',
  next: 'Nächste Seite',
})
defineCatalog(builtin.toast, 'de', {
  dismiss: 'Benachrichtigung schließen',
})
defineCatalog(builtin.modal, 'de', {
  close: 'Schließen',
})
