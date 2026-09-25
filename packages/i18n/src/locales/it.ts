import { builtin } from '../builtin'
import { defineCatalog } from '../messages'

defineCatalog(builtin.pagination, 'it', {
  itemsPerPage: 'Elementi per pagina',
  pageOf: 'Pagina {page} di {total}',
  range: '{start}–{end} di {total} elementi',
  previous: 'Pagina precedente',
  next: 'Pagina successiva',
  nav: 'Paginazione',
})
defineCatalog(builtin.toast, 'it', {
  dismiss: 'Ignora notifica',
  region: 'Notifiche',
})
defineCatalog(builtin.modal, 'it', {
  close: 'Chiudi finestra di dialogo',
})
defineCatalog(builtin.alert, 'it', {
  dismiss: 'Ignora',
})
defineCatalog(builtin.header, 'it', {
  nav: 'Navigazione principale',
})
defineCatalog(builtin.search, 'it', {
  label: 'Ricerca',
  placeholder: 'Cerca',
  clear: 'Cancella ricerca',
})
defineCatalog(builtin.commandMenu, 'it', {
  label: 'Menu dei comandi',
  placeholder: 'Digita un comando o cerca…',
  empty: 'Nessun risultato',
  back: 'Indietro',
  loading: 'Caricamento…',
  matches: '{count} corrispondenze',
  scopeLabel: 'Ambito',
  clearScope: 'Cancella ambito',
})
defineCatalog(builtin.breadcrumb, 'it', {
  nav: 'Percorso di navigazione',
})
defineCatalog(builtin.toc, 'it', {
  nav: 'In questa pagina',
})
defineCatalog(builtin.datePicker, 'it', {
  placeholder: 'Seleziona una data',
  previousMonth: 'Mese precedente',
  nextMonth: 'Mese successivo',
  clear: 'Cancella data',
  open: 'Apri calendario',
})
defineCatalog(builtin.combobox, 'it', {
  placeholder: 'Seleziona un’opzione',
  empty: 'Nessuna opzione trovata',
  clear: 'Cancella selezione',
  loading: 'Caricamento opzioni…',
  create: 'Aggiungi «{label}»',
  resultCount: '{count} opzioni disponibili',
})
defineCatalog(builtin.dataTable, 'it', {
  search: 'Cerca',
  empty: 'Nessun dato',
  selectAll: 'Seleziona tutte le righe',
  selectRow: 'Seleziona riga',
  itemsSelected: '{count} selezionati',
  expandRow: 'Espandi riga',
  previousPage: 'Pagina precedente',
  nextPage: 'Pagina successiva',
  columns: 'Colonne',
  actions: 'Azioni',
  noResults: 'Nessuna riga corrispondente',
  clearFilters: 'Cancella filtri',
  filterColumn: 'Filtra {column}',
  min: 'Min',
  max: 'Max',
  all: 'Tutti',
  columnMenu: 'Opzioni per {column}',
  sortAscending: 'Ordine crescente',
  sortDescending: 'Ordine decrescente',
  clearSort: 'Rimuovi ordinamento',
  moveLeft: 'Sposta a sinistra',
  moveRight: 'Sposta a destra',
  pinStart: 'Blocca all’inizio',
  pinEnd: 'Blocca alla fine',
  unpin: 'Sblocca',
  hideColumn: 'Nascondi colonna',
  resizeColumn: 'Ridimensiona {column}',
  editCell: 'Modifica {column}',
  totals: 'Totale',
  exportCsv: 'Esporta CSV',
})
defineCatalog(builtin.dock, 'it', {
  nav: 'Navigazione principale',
})
defineCatalog(builtin.steps, 'it', {
  label: 'Passaggi',
})
defineCatalog(builtin.overflowMenu, 'it', {
  trigger: 'Altre azioni',
})
defineCatalog(builtin.sideNav, 'it', {
  nav: 'Navigazione laterale',
  collapse: 'Comprimi navigazione',
  expand: 'Espandi navigazione',
})
defineCatalog(builtin.spinner, 'it', {
  label: 'Caricamento',
})
defineCatalog(builtin.numberInput, 'it', {
  increment: 'Aumenta',
  decrement: 'Diminuisci',
})
defineCatalog(builtin.tag, 'it', {
  dismiss: 'Rimuovi',
})
defineCatalog(builtin.appShell, 'it', {
  collapse: 'Comprimi navigazione',
  expand: 'Espandi navigazione',
  dismissError: 'Ignora errore',
})
defineCatalog(builtin.charts, 'it', {
  legendToggle: 'Mostra/nascondi serie {name}',
  noData: 'Nessun dato',
  resetZoom: 'Reimposta zoom',
  exportPng: 'Esporta PNG',
  exportSvg: 'Esporta SVG',
  dataView: 'Vista dati',
  restore: 'Ripristina',
})
defineCatalog(builtin.alertDialog, 'it', {
  confirm: 'Conferma',
  cancel: 'Annulla',
})
defineCatalog(builtin.sheet, 'it', {
  close: 'Chiudi pannello',
})
defineCatalog(builtin.bottomSheet, 'it', {
  close: 'Chiudi',
  handle: 'Trascina per ridimensionare',
})
defineCatalog(builtin.actionSheet, 'it', {
  label: 'Azioni',
  cancel: 'Annulla',
})
defineCatalog(builtin.reorderList, 'it', {
  handle: 'Riordina {name}',
  grabbed: '{name} selezionato. Posizione {position} di {total}.',
  moved: '{name} spostato in posizione {position} di {total}.',
  dropped: '{name} rilasciato in posizione {position} di {total}.',
  cancelled: 'Riordinamento annullato. {name} è tornato alla posizione originale.',
})
defineCatalog(builtin.infiniteScroll, 'it', {
  loadMore: 'Carica altro',
  loading: 'Caricamento di altri elementi',
})
defineCatalog(builtin.pullToRefresh, 'it', {
  pull: 'Trascina per aggiornare',
  release: 'Rilascia per aggiornare',
  refreshing: 'Aggiornamento',
})
defineCatalog(builtin.fileUploader, 'it', {
  label: 'Carica file',
  drop: 'Trascina qui i file o fai clic per caricarli',
  remove: 'Rimuovi {name}',
  uploading: 'Caricamento in corso',
  complete: 'Caricamento completato',
  error: 'Caricamento non riuscito',
  status: {
    one: '{count} file: {state}',
    many: '{count} file: {state}',
    other: '{count} file: {state}',
  },
})
defineCatalog(builtin.passwordInput, 'it', {
  reveal: 'Mostra password',
  hide: 'Nascondi password',
  strengthWeak: 'debole',
  strengthFair: 'discreta',
  strengthGood: 'buona',
  strengthStrong: 'forte',
  strengthLabel: 'Sicurezza della password: {level}',
})
defineCatalog(builtin.multiSelect, 'it', {
  label: 'Opzioni',
  placeholder: 'Seleziona opzioni',
  selected: '{count} selezionati',
  search: 'Cerca opzioni',
  noResults: 'Nessuna opzione trovata',
  loading: 'Caricamento opzioni…',
  clear: 'Cancella selezione',
  remove: 'Rimuovi {label}',
  selectAll: 'Seleziona tutto',
  clearAll: 'Cancella tutto',
  create: 'Aggiungi «{label}»',
  selectionChanged: '{count} di {total} selezionati',
  maxReached: 'Massimo {max} selezionati',
})
defineCatalog(builtin.tagsInput, 'it', {
  label: 'Tag',
  remove: 'Rimuovi {tag}',
  placeholder: 'Aggiungi tag…',
})
defineCatalog(builtin.otpInput, 'it', {
  label: 'Codice monouso',
  digit: 'Cifra {n}',
})
defineCatalog(builtin.ai, 'it', {
  generating: 'Generazione in corso…',
  done: 'Fatto',
  error: 'Errore',
  send: 'Invia',
  placeholder: 'Scrivi un messaggio…',
  you: 'Tu',
  assistant: 'Assistente',
})
defineCatalog(builtin.shellHeader, 'it', {
  skipToContent: 'Vai al contenuto principale',
  nav: 'Navigazione principale',
  openMenu: 'Apri navigazione',
  closeMenu: 'Chiudi navigazione',
})
defineCatalog(builtin.headerPanel, 'it', {
  close: 'Chiudi pannello',
})
defineCatalog(builtin.switcher, 'it', {
  label: 'Cambia applicazione',
})
defineCatalog(builtin.copyButton, 'it', {
  copy: 'Copia',
  copied: 'Copiato',
})
defineCatalog(builtin.skipNav, 'it', {
  label: 'Vai al contenuto',
})
defineCatalog(builtin.form, 'it', {
  required: 'Obbligatorio',
  invalid: 'Valore non valido',
})
defineCatalog(builtin.label, 'it', {
  required: 'Obbligatorio',
})
defineCatalog(builtin.inlineLoading, 'it', {
  active: 'Caricamento',
  finished: 'Caricato',
  error: 'Errore',
})
defineCatalog(builtin.notification, 'it', {
  dismiss: 'Ignora',
})
defineCatalog(builtin.treeView, 'it', {
  loading: 'Caricamento…',
  expand: 'Espandi',
  collapse: 'Comprimi',
})
defineCatalog(builtin.carousel, 'it', {
  region: 'Carosello',
  previous: 'Diapositiva precedente',
  next: 'Diapositiva successiva',
  slide: '{n} di {total}',
  goTo: 'Vai alla diapositiva {n}',
  choose: 'Scegli la diapositiva da visualizzare',
  play: 'Avvia presentazione automatica',
  pause: 'Interrompi presentazione automatica',
})
defineCatalog(builtin.calendar, 'it', {
  previousMonth: 'Mese precedente',
  nextMonth: 'Mese successivo',
  today: 'Oggi',
  weekNumber: 'Settimana',
})
defineCatalog(builtin.colorPicker, 'it', {
  hue: 'Tonalità',
  alpha: 'Alfa',
  colorArea: 'Saturazione e luminosità',
  saturation: 'Saturazione',
  brightness: 'Luminosità',
  eyedropper: 'Preleva un colore dallo schermo',
  presets: 'Colori predefiniti',
  hex: 'Valore del colore',
  value: 'Colore selezionato {color}',
})
defineCatalog(builtin.drawer, 'it', {
  close: 'Chiudi',
})
defineCatalog(builtin.menuButton, 'it', {
  open: 'Apri menu',
})
defineCatalog(builtin.resizable, 'it', {
  handle: 'Ridimensiona pannelli',
})
defineCatalog(builtin.codeSnippet, 'it', {
  copy: 'Copia codice',
  copied: 'Copiato',
})
defineCatalog(builtin.dateRangePicker, 'it', {
  label: 'Intervallo di date',
  placeholder: 'Seleziona un intervallo di date',
  start: 'Data di inizio',
  end: 'Data di fine',
  apply: 'Applica',
  clear: 'Cancella',
})
defineCatalog(builtin.toggletip, 'it', {
  label: 'Altre informazioni',
})
defineCatalog(builtin.avatarGroup, 'it', {
  more: 'Altri {count}',
})
defineCatalog(builtin.comparison, 'it', {
  label: 'Cursore di confronto',
})
defineCatalog(builtin.qrCode, 'it', {
  label: 'Codice QR',
})
defineCatalog(builtin.flow, 'it', {
  zoomIn: 'Aumenta zoom',
  zoomOut: 'Riduci zoom',
  fitView: 'Adatta alla vista',
  minimap: 'Minimappa',
  play: 'Riproduci',
  pause: 'Pausa',
  next: 'Passaggio successivo',
  previous: 'Passaggio precedente',
  restart: 'Ricomincia',
  step: 'Passaggio {current} di {total}',
})
defineCatalog(builtin.logViewer, 'it', {
  label: 'Output del log',
  search: 'Cerca nel log',
  follow: 'In tempo reale',
  paused: 'Vai agli ultimi',
  copy: 'Copia',
  copied: 'Copiato',
  empty: 'Nessun output del log',
  matches: '{count} corrispondenze',
  lines: '{count} righe',
})
defineCatalog(builtin.editor, 'it', {
  label: 'Editor di codice',
  code: 'Codice',
  find: 'Trova',
  replace: 'Sostituisci',
  findPlaceholder: 'Trova',
  replacePlaceholder: 'Sostituisci con',
  next: 'Corrispondenza successiva',
  previous: 'Corrispondenza precedente',
  replaceOne: 'Sostituisci',
  replaceAll: 'Sostituisci tutto',
  close: 'Chiudi',
  matchCase: 'Maiuscole/minuscole',
  toggleReplace: 'Mostra/nascondi sostituzione',
  noMatches: 'Nessun risultato',
  findCount: '{current} di {total}',
  commandMenu: 'Menu dei comandi',
  commandMenuEmpty: 'Nessun comando',
})
