import { builtin } from '../builtin'
import { defineCatalog } from '../messages'

defineCatalog(builtin.pagination, 'nl', {
  itemsPerPage: 'Items per pagina',
  pageOf: 'Pagina {page} van {total}',
  range: '{start}–{end} van {total} items',
  previous: 'Vorige pagina',
  next: 'Volgende pagina',
  nav: 'Paginering',
})
defineCatalog(builtin.toast, 'nl', {
  dismiss: 'Melding sluiten',
  region: 'Meldingen',
})
defineCatalog(builtin.modal, 'nl', {
  close: 'Dialoogvenster sluiten',
})
defineCatalog(builtin.alert, 'nl', {
  dismiss: 'Sluiten',
})
defineCatalog(builtin.header, 'nl', {
  nav: 'Hoofdnavigatie',
})
defineCatalog(builtin.search, 'nl', {
  label: 'Zoeken',
  placeholder: 'Zoeken',
  clear: 'Zoekopdracht wissen',
})
defineCatalog(builtin.commandMenu, 'nl', {
  label: 'Opdrachtmenu',
  placeholder: 'Typ een opdracht of zoek…',
  empty: 'Geen resultaten gevonden',
  back: 'Terug',
  loading: 'Laden…',
  matches: '{count} resultaten',
  scopeLabel: 'Bereik',
  clearScope: 'Bereik wissen',
})
defineCatalog(builtin.breadcrumb, 'nl', {
  nav: 'Kruimelpad',
})
defineCatalog(builtin.toc, 'nl', {
  nav: 'Op deze pagina',
})
defineCatalog(builtin.datePicker, 'nl', {
  placeholder: 'Selecteer een datum',
  previousMonth: 'Vorige maand',
  nextMonth: 'Volgende maand',
  clear: 'Datum wissen',
  open: 'Kalender openen',
})
defineCatalog(builtin.combobox, 'nl', {
  placeholder: 'Selecteer een optie',
  empty: 'Geen opties gevonden',
  clear: 'Selectie wissen',
  loading: 'Opties laden…',
  create: '‘{label}’ toevoegen',
  resultCount: '{count} opties beschikbaar',
})
defineCatalog(builtin.dataTable, 'nl', {
  search: 'Zoeken',
  empty: 'Geen gegevens',
  selectAll: 'Alle rijen selecteren',
  selectRow: 'Rij selecteren',
  itemsSelected: '{count} geselecteerd',
  expandRow: 'Rij uitvouwen',
  previousPage: 'Vorige pagina',
  nextPage: 'Volgende pagina',
  columns: 'Kolommen',
  actions: 'Acties',
  noResults: 'Geen overeenkomende rijen',
  clearFilters: 'Filters wissen',
  filterColumn: '{column} filteren',
  min: 'Min.',
  max: 'Max.',
  all: 'Alle',
  columnMenu: 'Opties voor {column}',
  sortAscending: 'Oplopend sorteren',
  sortDescending: 'Aflopend sorteren',
  clearSort: 'Sortering wissen',
  moveLeft: 'Naar links verplaatsen',
  moveRight: 'Naar rechts verplaatsen',
  pinStart: 'Vastzetten aan begin',
  pinEnd: 'Vastzetten aan einde',
  unpin: 'Losmaken',
  hideColumn: 'Kolom verbergen',
  resizeColumn: 'Grootte van {column} wijzigen',
  editCell: '{column} bewerken',
  totals: 'Totaal',
  exportCsv: 'CSV exporteren',
})
defineCatalog(builtin.dock, 'nl', {
  nav: 'Hoofdnavigatie',
})
defineCatalog(builtin.steps, 'nl', {
  label: 'Stappen',
})
defineCatalog(builtin.overflowMenu, 'nl', {
  trigger: 'Meer acties',
})
defineCatalog(builtin.sideNav, 'nl', {
  nav: 'Zijnavigatie',
  collapse: 'Navigatie samenvouwen',
  expand: 'Navigatie uitvouwen',
})
defineCatalog(builtin.spinner, 'nl', {
  label: 'Laden',
})
defineCatalog(builtin.numberInput, 'nl', {
  increment: 'Verhogen',
  decrement: 'Verlagen',
})
defineCatalog(builtin.tag, 'nl', {
  dismiss: 'Verwijderen',
})
defineCatalog(builtin.appShell, 'nl', {
  collapse: 'Navigatie samenvouwen',
  expand: 'Navigatie uitvouwen',
  dismissError: 'Fout sluiten',
})
defineCatalog(builtin.charts, 'nl', {
  legendToggle: 'Reeks {name} in-/uitschakelen',
  noData: 'Geen gegevens',
  resetZoom: 'Zoom herstellen',
  exportPng: 'PNG exporteren',
  exportSvg: 'SVG exporteren',
  dataView: 'Gegevensweergave',
  restore: 'Herstellen',
})
defineCatalog(builtin.alertDialog, 'nl', {
  confirm: 'Bevestigen',
  cancel: 'Annuleren',
})
defineCatalog(builtin.sheet, 'nl', {
  close: 'Paneel sluiten',
})
defineCatalog(builtin.bottomSheet, 'nl', {
  close: 'Sluiten',
  handle: 'Sleep om formaat te wijzigen',
})
defineCatalog(builtin.actionSheet, 'nl', {
  label: 'Acties',
  cancel: 'Annuleren',
})
defineCatalog(builtin.reorderList, 'nl', {
  handle: '{name} herschikken',
  grabbed: '{name} opgepakt. Positie {position} van {total}.',
  moved: '{name} verplaatst naar positie {position} van {total}.',
  dropped: '{name} neergezet op positie {position} van {total}.',
  cancelled: 'Herschikken geannuleerd. {name} is terug op de oorspronkelijke positie.',
})
defineCatalog(builtin.infiniteScroll, 'nl', {
  loadMore: 'Meer laden',
  loading: 'Meer wordt geladen',
})
defineCatalog(builtin.pullToRefresh, 'nl', {
  pull: 'Trek omlaag om te vernieuwen',
  release: 'Laat los om te vernieuwen',
  refreshing: 'Vernieuwen',
})
defineCatalog(builtin.fileUploader, 'nl', {
  label: 'Bestanden uploaden',
  drop: 'Sleep bestanden hierheen of klik om te uploaden',
  remove: '{name} verwijderen',
  uploading: 'Uploaden',
  complete: 'Upload voltooid',
  error: 'Upload mislukt',
  status: { one: '{count} bestand: {state}', other: '{count} bestanden: {state}' },
})
defineCatalog(builtin.passwordInput, 'nl', {
  reveal: 'Wachtwoord tonen',
  hide: 'Wachtwoord verbergen',
  strengthWeak: 'zwak',
  strengthFair: 'redelijk',
  strengthGood: 'goed',
  strengthStrong: 'sterk',
  strengthLabel: 'Wachtwoordsterkte: {level}',
})
defineCatalog(builtin.multiSelect, 'nl', {
  label: 'Opties',
  placeholder: 'Selecteer opties',
  selected: '{count} geselecteerd',
  search: 'Opties zoeken',
  noResults: 'Geen opties gevonden',
  loading: 'Opties laden…',
  clear: 'Selectie wissen',
  remove: '{label} verwijderen',
  selectAll: 'Alles selecteren',
  clearAll: 'Alles wissen',
  create: '‘{label}’ toevoegen',
  selectionChanged: '{count} van {total} geselecteerd',
  maxReached: 'Maximaal {max} geselecteerd',
})
defineCatalog(builtin.tagsInput, 'nl', {
  label: 'Tags',
  remove: '{tag} verwijderen',
  placeholder: 'Tag toevoegen…',
})
defineCatalog(builtin.otpInput, 'nl', {
  label: 'Eenmalige code',
  digit: 'Cijfer {n}',
})
defineCatalog(builtin.ai, 'nl', {
  generating: 'Genereren…',
  done: 'Klaar',
  error: 'Fout',
  send: 'Verzenden',
  placeholder: 'Typ een bericht…',
  you: 'Jij',
  assistant: 'Assistent',
})
defineCatalog(builtin.shellHeader, 'nl', {
  skipToContent: 'Naar hoofdinhoud gaan',
  nav: 'Hoofdnavigatie',
  openMenu: 'Navigatie openen',
  closeMenu: 'Navigatie sluiten',
})
defineCatalog(builtin.headerPanel, 'nl', {
  close: 'Paneel sluiten',
})
defineCatalog(builtin.switcher, 'nl', {
  label: 'Andere app kiezen',
})
defineCatalog(builtin.copyButton, 'nl', {
  copy: 'Kopiëren',
  copied: 'Gekopieerd',
})
defineCatalog(builtin.skipNav, 'nl', {
  label: 'Naar inhoud gaan',
})
defineCatalog(builtin.form, 'nl', {
  required: 'Verplicht',
  invalid: 'Ongeldige waarde',
})
defineCatalog(builtin.label, 'nl', {
  required: 'Verplicht',
})
defineCatalog(builtin.inlineLoading, 'nl', {
  active: 'Laden',
  finished: 'Geladen',
  error: 'Fout',
})
defineCatalog(builtin.notification, 'nl', {
  dismiss: 'Sluiten',
})
defineCatalog(builtin.treeView, 'nl', {
  loading: 'Laden…',
  expand: 'Uitvouwen',
  collapse: 'Samenvouwen',
})
defineCatalog(builtin.carousel, 'nl', {
  region: 'Carrousel',
  previous: 'Vorige dia',
  next: 'Volgende dia',
  slide: '{n} van {total}',
  goTo: 'Ga naar dia {n}',
  choose: 'Kies een dia om weer te geven',
  play: 'Automatische diavoorstelling starten',
  pause: 'Automatische diavoorstelling stoppen',
})
defineCatalog(builtin.calendar, 'nl', {
  previousMonth: 'Vorige maand',
  nextMonth: 'Volgende maand',
  today: 'Vandaag',
  weekNumber: 'Week',
})
defineCatalog(builtin.colorPicker, 'nl', {
  hue: 'Tint',
  alpha: 'Alfa',
  colorArea: 'Verzadiging en helderheid',
  saturation: 'Verzadiging',
  brightness: 'Helderheid',
  eyedropper: 'Kleur kiezen van scherm',
  presets: 'Vooraf ingestelde kleuren',
  hex: 'Kleurwaarde',
  value: 'Geselecteerde kleur {color}',
})
defineCatalog(builtin.drawer, 'nl', {
  close: 'Sluiten',
})
defineCatalog(builtin.menuButton, 'nl', {
  open: 'Menu openen',
})
defineCatalog(builtin.resizable, 'nl', {
  handle: 'Formaat van panelen wijzigen',
})
defineCatalog(builtin.codeSnippet, 'nl', {
  copy: 'Code kopiëren',
  copied: 'Gekopieerd',
})
defineCatalog(builtin.dateRangePicker, 'nl', {
  label: 'Periode',
  placeholder: 'Selecteer een periode',
  start: 'Begindatum',
  end: 'Einddatum',
  apply: 'Toepassen',
  clear: 'Wissen',
})
defineCatalog(builtin.toggletip, 'nl', {
  label: 'Meer informatie',
})
defineCatalog(builtin.avatarGroup, 'nl', {
  more: 'Nog {count}',
})
defineCatalog(builtin.comparison, 'nl', {
  label: 'Vergelijkingsschuifregelaar',
})
defineCatalog(builtin.qrCode, 'nl', {
  label: 'QR-code',
})
defineCatalog(builtin.flow, 'nl', {
  zoomIn: 'Inzoomen',
  zoomOut: 'Uitzoomen',
  fitView: 'Passend weergeven',
  minimap: 'Minikaart',
  play: 'Afspelen',
  pause: 'Pauzeren',
  next: 'Volgende stap',
  previous: 'Vorige stap',
  restart: 'Opnieuw starten',
  step: 'Stap {current} van {total}',
})
defineCatalog(builtin.logViewer, 'nl', {
  label: 'Logboekuitvoer',
  search: 'Logboek doorzoeken',
  follow: 'Volgen',
  paused: 'Naar nieuwste gaan',
  copy: 'Kopiëren',
  copied: 'Gekopieerd',
  empty: 'Geen logboekuitvoer',
  matches: '{count} resultaten',
  lines: '{count} regels',
})
defineCatalog(builtin.editor, 'nl', {
  label: 'Code-editor',
  code: 'Code',
  find: 'Zoeken',
  replace: 'Vervangen',
  findPlaceholder: 'Zoeken',
  replacePlaceholder: 'Vervangen door',
  next: 'Volgende overeenkomst',
  previous: 'Vorige overeenkomst',
  replaceOne: 'Vervangen',
  replaceAll: 'Alles vervangen',
  close: 'Sluiten',
  matchCase: 'Hoofdlettergevoelig',
  toggleReplace: 'Vervangen in-/uitschakelen',
  noMatches: 'Geen resultaten',
  findCount: '{current} van {total}',
  commandMenu: 'Opdrachtmenu',
  commandMenuEmpty: 'Geen opdrachten',
})
