import { builtin } from '../builtin'
import { defineCatalog } from '../messages'

defineCatalog(builtin.pagination, 'sv', {
  itemsPerPage: 'Objekt per sida',
  pageOf: 'Sida {page} av {total}',
  range: '{start}–{end} av {total} objekt',
  previous: 'Föregående sida',
  next: 'Nästa sida',
  nav: 'Sidnumrering',
})
defineCatalog(builtin.toast, 'sv', {
  dismiss: 'Stäng avisering',
  region: 'Aviseringar',
})
defineCatalog(builtin.modal, 'sv', {
  close: 'Stäng dialogruta',
})
defineCatalog(builtin.alert, 'sv', {
  dismiss: 'Stäng',
})
defineCatalog(builtin.header, 'sv', {
  nav: 'Huvudnavigering',
})
defineCatalog(builtin.search, 'sv', {
  label: 'Sök',
  placeholder: 'Sök',
  clear: 'Rensa sökning',
})
defineCatalog(builtin.commandMenu, 'sv', {
  label: 'Kommandomeny',
  placeholder: 'Skriv ett kommando eller sök…',
  empty: 'Inga resultat hittades',
  back: 'Tillbaka',
  loading: 'Läser in…',
  matches: '{count} träffar',
  scopeLabel: 'Omfång',
  clearScope: 'Rensa omfång',
})
defineCatalog(builtin.breadcrumb, 'sv', {
  nav: 'Brödsmulor',
})
defineCatalog(builtin.toc, 'sv', {
  nav: 'På den här sidan',
})
defineCatalog(builtin.datePicker, 'sv', {
  placeholder: 'Välj ett datum',
  previousMonth: 'Föregående månad',
  nextMonth: 'Nästa månad',
  clear: 'Rensa datum',
  open: 'Öppna kalender',
})
defineCatalog(builtin.combobox, 'sv', {
  placeholder: 'Välj ett alternativ',
  empty: 'Inga alternativ hittades',
  clear: 'Rensa val',
  loading: 'Läser in alternativ…',
  create: 'Lägg till ”{label}”',
  resultCount: '{count} alternativ tillgängliga',
})
defineCatalog(builtin.dataTable, 'sv', {
  search: 'Sök',
  empty: 'Inga data',
  selectAll: 'Markera alla rader',
  selectRow: 'Markera rad',
  itemsSelected: '{count} markerade',
  expandRow: 'Expandera rad',
  previousPage: 'Föregående sida',
  nextPage: 'Nästa sida',
  columns: 'Kolumner',
  actions: 'Åtgärder',
  noResults: 'Inga matchande rader',
  clearFilters: 'Rensa filter',
  filterColumn: 'Filtrera {column}',
  min: 'Min',
  max: 'Max',
  all: 'Alla',
  columnMenu: 'Alternativ för {column}',
  sortAscending: 'Sortera stigande',
  sortDescending: 'Sortera fallande',
  clearSort: 'Rensa sortering',
  moveLeft: 'Flytta åt vänster',
  moveRight: 'Flytta åt höger',
  pinStart: 'Fäst i början',
  pinEnd: 'Fäst i slutet',
  unpin: 'Lossa',
  hideColumn: 'Dölj kolumn',
  resizeColumn: 'Ändra storlek på {column}',
  editCell: 'Redigera {column}',
  totals: 'Totalt',
  exportCsv: 'Exportera CSV',
})
defineCatalog(builtin.dock, 'sv', {
  nav: 'Huvudnavigering',
})
defineCatalog(builtin.steps, 'sv', {
  label: 'Steg',
})
defineCatalog(builtin.overflowMenu, 'sv', {
  trigger: 'Fler åtgärder',
})
defineCatalog(builtin.sideNav, 'sv', {
  nav: 'Sidonavigering',
  collapse: 'Fäll ihop navigering',
  expand: 'Fäll ut navigering',
})
defineCatalog(builtin.spinner, 'sv', {
  label: 'Läser in',
})
defineCatalog(builtin.numberInput, 'sv', {
  increment: 'Öka',
  decrement: 'Minska',
})
defineCatalog(builtin.tag, 'sv', {
  dismiss: 'Ta bort',
})
defineCatalog(builtin.appShell, 'sv', {
  collapse: 'Fäll ihop navigering',
  expand: 'Fäll ut navigering',
  dismissError: 'Stäng fel',
})
defineCatalog(builtin.charts, 'sv', {
  legendToggle: 'Visa/dölj serien {name}',
  noData: 'Inga data',
  resetZoom: 'Återställ zoom',
  exportPng: 'Exportera PNG',
  exportSvg: 'Exportera SVG',
  dataView: 'Datavy',
  restore: 'Återställ',
})
defineCatalog(builtin.alertDialog, 'sv', {
  confirm: 'Bekräfta',
  cancel: 'Avbryt',
})
defineCatalog(builtin.sheet, 'sv', {
  close: 'Stäng panel',
})
defineCatalog(builtin.bottomSheet, 'sv', {
  close: 'Stäng',
  handle: 'Dra för att ändra storlek',
})
defineCatalog(builtin.actionSheet, 'sv', {
  label: 'Åtgärder',
  cancel: 'Avbryt',
})
defineCatalog(builtin.reorderList, 'sv', {
  handle: 'Ändra ordning på {name}',
  grabbed: '{name} har plockats upp. Position {position} av {total}.',
  moved: '{name} har flyttats till position {position} av {total}.',
  dropped: '{name} har släppts på position {position} av {total}.',
  cancelled: 'Omsorteringen avbröts. {name} har återgått till sin ursprungliga position.',
})
defineCatalog(builtin.infiniteScroll, 'sv', {
  loadMore: 'Läs in fler',
  loading: 'Läser in fler',
})
defineCatalog(builtin.pullToRefresh, 'sv', {
  pull: 'Dra för att uppdatera',
  release: 'Släpp för att uppdatera',
  refreshing: 'Uppdaterar',
})
defineCatalog(builtin.fileUploader, 'sv', {
  label: 'Ladda upp filer',
  drop: 'Dra och släpp filer här eller klicka för att ladda upp',
  remove: 'Ta bort {name}',
  uploading: 'Laddar upp',
  complete: 'Uppladdningen är klar',
  error: 'Uppladdningen misslyckades',
  status: { one: '{count} fil: {state}', other: '{count} filer: {state}' },
})
defineCatalog(builtin.passwordInput, 'sv', {
  reveal: 'Visa lösenord',
  hide: 'Dölj lösenord',
  strengthWeak: 'svagt',
  strengthFair: 'godtagbart',
  strengthGood: 'bra',
  strengthStrong: 'starkt',
  strengthLabel: 'Lösenordsstyrka: {level}',
})
defineCatalog(builtin.multiSelect, 'sv', {
  label: 'Alternativ',
  placeholder: 'Välj alternativ',
  selected: '{count} markerade',
  search: 'Sök alternativ',
  noResults: 'Inga alternativ hittades',
  loading: 'Läser in alternativ…',
  clear: 'Rensa val',
  remove: 'Ta bort {label}',
  selectAll: 'Markera alla',
  clearAll: 'Rensa alla',
  create: 'Lägg till ”{label}”',
  selectionChanged: '{count} av {total} markerade',
  maxReached: 'Högst {max} kan markeras',
})
defineCatalog(builtin.tagsInput, 'sv', {
  label: 'Taggar',
  remove: 'Ta bort {tag}',
  placeholder: 'Lägg till tagg…',
})
defineCatalog(builtin.otpInput, 'sv', {
  label: 'Engångskod',
  digit: 'Siffra {n}',
})
defineCatalog(builtin.ai, 'sv', {
  generating: 'Genererar…',
  done: 'Klart',
  error: 'Fel',
  send: 'Skicka',
  placeholder: 'Skriv ett meddelande…',
  you: 'Du',
  assistant: 'Assistent',
})
defineCatalog(builtin.shellHeader, 'sv', {
  skipToContent: 'Hoppa till huvudinnehåll',
  nav: 'Huvudnavigering',
  openMenu: 'Öppna navigering',
  closeMenu: 'Stäng navigering',
})
defineCatalog(builtin.headerPanel, 'sv', {
  close: 'Stäng panel',
})
defineCatalog(builtin.switcher, 'sv', {
  label: 'Byt program',
})
defineCatalog(builtin.copyButton, 'sv', {
  copy: 'Kopiera',
  copied: 'Kopierat',
})
defineCatalog(builtin.skipNav, 'sv', {
  label: 'Hoppa till innehåll',
})
defineCatalog(builtin.form, 'sv', {
  required: 'Obligatoriskt',
  invalid: 'Ogiltigt värde',
})
defineCatalog(builtin.label, 'sv', {
  required: 'Obligatoriskt',
})
defineCatalog(builtin.inlineLoading, 'sv', {
  active: 'Läser in',
  finished: 'Inläst',
  error: 'Fel',
})
defineCatalog(builtin.notification, 'sv', {
  dismiss: 'Stäng',
})
defineCatalog(builtin.treeView, 'sv', {
  loading: 'Läser in…',
  expand: 'Fäll ut',
  collapse: 'Fäll ihop',
})
defineCatalog(builtin.carousel, 'sv', {
  region: 'Karusell',
  previous: 'Föregående bild',
  next: 'Nästa bild',
  slide: '{n} av {total}',
  goTo: 'Gå till bild {n}',
  choose: 'Välj bild att visa',
  play: 'Starta automatiskt bildspel',
  pause: 'Stoppa automatiskt bildspel',
})
defineCatalog(builtin.calendar, 'sv', {
  previousMonth: 'Föregående månad',
  nextMonth: 'Nästa månad',
  today: 'I dag',
  weekNumber: 'Vecka',
})
defineCatalog(builtin.colorPicker, 'sv', {
  hue: 'Nyans',
  alpha: 'Alfa',
  colorArea: 'Mättnad och ljusstyrka',
  saturation: 'Mättnad',
  brightness: 'Ljusstyrka',
  eyedropper: 'Välj en färg från skärmen',
  presets: 'Förinställda färger',
  hex: 'Färgvärde',
  value: 'Vald färg {color}',
})
defineCatalog(builtin.drawer, 'sv', {
  close: 'Stäng',
})
defineCatalog(builtin.menuButton, 'sv', {
  open: 'Öppna meny',
})
defineCatalog(builtin.resizable, 'sv', {
  handle: 'Ändra storlek på paneler',
})
defineCatalog(builtin.codeSnippet, 'sv', {
  copy: 'Kopiera kod',
  copied: 'Kopierat',
})
defineCatalog(builtin.dateRangePicker, 'sv', {
  label: 'Datumintervall',
  placeholder: 'Välj ett datumintervall',
  start: 'Startdatum',
  end: 'Slutdatum',
  apply: 'Använd',
  clear: 'Rensa',
})
defineCatalog(builtin.toggletip, 'sv', {
  label: 'Mer information',
})
defineCatalog(builtin.avatarGroup, 'sv', {
  more: '{count} till',
})
defineCatalog(builtin.comparison, 'sv', {
  label: 'Jämförelsereglage',
})
defineCatalog(builtin.qrCode, 'sv', {
  label: 'QR-kod',
})
defineCatalog(builtin.flow, 'sv', {
  zoomIn: 'Zooma in',
  zoomOut: 'Zooma ut',
  fitView: 'Anpassa vy',
  minimap: 'Minikarta',
  play: 'Spela upp',
  pause: 'Pausa',
  next: 'Nästa steg',
  previous: 'Föregående steg',
  restart: 'Starta om',
  step: 'Steg {current} av {total}',
})
defineCatalog(builtin.logViewer, 'sv', {
  label: 'Loggutdata',
  search: 'Sök i logg',
  follow: 'Följer',
  paused: 'Hoppa till senaste',
  copy: 'Kopiera',
  copied: 'Kopierat',
  empty: 'Inga loggutdata',
  matches: '{count} träffar',
  lines: '{count} rader',
})
defineCatalog(builtin.editor, 'sv', {
  label: 'Kodredigerare',
  code: 'Kod',
  find: 'Sök',
  replace: 'Ersätt',
  findPlaceholder: 'Sök',
  replacePlaceholder: 'Ersätt med',
  next: 'Nästa träff',
  previous: 'Föregående träff',
  replaceOne: 'Ersätt',
  replaceAll: 'Ersätt alla',
  close: 'Stäng',
  matchCase: 'Matcha gemener/versaler',
  toggleReplace: 'Visa/dölj ersätt',
  noMatches: 'Inga resultat',
  findCount: '{current} av {total}',
  commandMenu: 'Kommandomeny',
  commandMenuEmpty: 'Inga kommandon',
})
