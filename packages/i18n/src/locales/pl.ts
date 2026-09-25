import { builtin } from '../builtin'
import { defineCatalog } from '../messages'

defineCatalog(builtin.pagination, 'pl', {
  itemsPerPage: 'Elementów na stronie',
  pageOf: 'Strona {page} z {total}',
  range: '{start}–{end} z {total} elementów',
  previous: 'Poprzednia strona',
  next: 'Następna strona',
  nav: 'Paginacja',
})
defineCatalog(builtin.toast, 'pl', {
  dismiss: 'Zamknij powiadomienie',
  region: 'Powiadomienia',
})
defineCatalog(builtin.modal, 'pl', {
  close: 'Zamknij okno dialogowe',
})
defineCatalog(builtin.alert, 'pl', {
  dismiss: 'Zamknij',
})
defineCatalog(builtin.header, 'pl', {
  nav: 'Nawigacja główna',
})
defineCatalog(builtin.search, 'pl', {
  label: 'Szukaj',
  placeholder: 'Szukaj',
  clear: 'Wyczyść wyszukiwanie',
})
defineCatalog(builtin.commandMenu, 'pl', {
  label: 'Menu poleceń',
  placeholder: 'Wpisz polecenie lub wyszukaj…',
  empty: 'Nie znaleziono wyników',
  back: 'Wstecz',
  loading: 'Ładowanie…',
  matches: 'Wyniki: {count}',
  scopeLabel: 'Zakres',
  clearScope: 'Wyczyść zakres',
})
defineCatalog(builtin.breadcrumb, 'pl', {
  nav: 'Ścieżka nawigacji',
})
defineCatalog(builtin.toc, 'pl', {
  nav: 'Na tej stronie',
})
defineCatalog(builtin.datePicker, 'pl', {
  placeholder: 'Wybierz datę',
  previousMonth: 'Poprzedni miesiąc',
  nextMonth: 'Następny miesiąc',
  clear: 'Wyczyść datę',
  open: 'Otwórz kalendarz',
})
defineCatalog(builtin.combobox, 'pl', {
  placeholder: 'Wybierz opcję',
  empty: 'Nie znaleziono opcji',
  clear: 'Wyczyść wybór',
  loading: 'Ładowanie opcji…',
  create: 'Dodaj „{label}”',
  resultCount: 'Dostępne opcje: {count}',
})
defineCatalog(builtin.dataTable, 'pl', {
  search: 'Szukaj',
  empty: 'Brak danych',
  selectAll: 'Zaznacz wszystkie wiersze',
  selectRow: 'Zaznacz wiersz',
  itemsSelected: 'Zaznaczono: {count}',
  expandRow: 'Rozwiń wiersz',
  previousPage: 'Poprzednia strona',
  nextPage: 'Następna strona',
  columns: 'Kolumny',
  actions: 'Akcje',
  noResults: 'Brak pasujących wierszy',
  clearFilters: 'Wyczyść filtry',
  filterColumn: 'Filtruj: {column}',
  min: 'Min.',
  max: 'Maks.',
  all: 'Wszystkie',
  columnMenu: 'Opcje: {column}',
  sortAscending: 'Sortuj rosnąco',
  sortDescending: 'Sortuj malejąco',
  clearSort: 'Wyczyść sortowanie',
  moveLeft: 'Przenieś w lewo',
  moveRight: 'Przenieś w prawo',
  pinStart: 'Przypnij na początku',
  pinEnd: 'Przypnij na końcu',
  unpin: 'Odepnij',
  hideColumn: 'Ukryj kolumnę',
  resizeColumn: 'Zmień szerokość: {column}',
  editCell: 'Edytuj: {column}',
  totals: 'Suma',
  exportCsv: 'Eksportuj CSV',
})
defineCatalog(builtin.dock, 'pl', {
  nav: 'Nawigacja główna',
})
defineCatalog(builtin.steps, 'pl', {
  label: 'Kroki',
})
defineCatalog(builtin.overflowMenu, 'pl', {
  trigger: 'Więcej akcji',
})
defineCatalog(builtin.sideNav, 'pl', {
  nav: 'Nawigacja boczna',
  collapse: 'Zwiń nawigację',
  expand: 'Rozwiń nawigację',
})
defineCatalog(builtin.spinner, 'pl', {
  label: 'Ładowanie',
})
defineCatalog(builtin.numberInput, 'pl', {
  increment: 'Zwiększ',
  decrement: 'Zmniejsz',
})
defineCatalog(builtin.tag, 'pl', {
  dismiss: 'Usuń',
})
defineCatalog(builtin.appShell, 'pl', {
  collapse: 'Zwiń nawigację',
  expand: 'Rozwiń nawigację',
  dismissError: 'Zamknij błąd',
})
defineCatalog(builtin.charts, 'pl', {
  legendToggle: 'Pokaż/ukryj serię {name}',
  noData: 'Brak danych',
  resetZoom: 'Resetuj powiększenie',
  exportPng: 'Eksportuj PNG',
  exportSvg: 'Eksportuj SVG',
  dataView: 'Widok danych',
  restore: 'Przywróć',
})
defineCatalog(builtin.alertDialog, 'pl', {
  confirm: 'Potwierdź',
  cancel: 'Anuluj',
})
defineCatalog(builtin.sheet, 'pl', {
  close: 'Zamknij panel',
})
defineCatalog(builtin.bottomSheet, 'pl', {
  close: 'Zamknij',
  handle: 'Przeciągnij, aby zmienić rozmiar',
})
defineCatalog(builtin.actionSheet, 'pl', {
  label: 'Akcje',
  cancel: 'Anuluj',
})
defineCatalog(builtin.reorderList, 'pl', {
  handle: 'Zmień kolejność: {name}',
  grabbed: 'Podniesiono: {name}. Pozycja {position} z {total}.',
  moved: 'Przeniesiono {name} na pozycję {position} z {total}.',
  dropped: 'Upuszczono {name} na pozycji {position} z {total}.',
  cancelled: 'Anulowano zmianę kolejności. {name} wraca na pierwotną pozycję.',
})
defineCatalog(builtin.infiniteScroll, 'pl', {
  loadMore: 'Załaduj więcej',
  loading: 'Ładowanie kolejnych',
})
defineCatalog(builtin.pullToRefresh, 'pl', {
  pull: 'Pociągnij, aby odświeżyć',
  release: 'Puść, aby odświeżyć',
  refreshing: 'Odświeżanie',
})
defineCatalog(builtin.fileUploader, 'pl', {
  label: 'Prześlij pliki',
  drop: 'Przeciągnij i upuść pliki tutaj lub kliknij, aby przesłać',
  remove: 'Usuń {name}',
  uploading: 'Przesyłanie',
  complete: 'Przesyłanie zakończone',
  error: 'Przesyłanie nie powiodło się',
  status: {
    one: '{count} plik: {state}',
    few: '{count} pliki: {state}',
    many: '{count} plików: {state}',
    other: '{count} pliku: {state}',
  },
})
defineCatalog(builtin.passwordInput, 'pl', {
  reveal: 'Pokaż hasło',
  hide: 'Ukryj hasło',
  strengthWeak: 'słabe',
  strengthFair: 'średnie',
  strengthGood: 'dobre',
  strengthStrong: 'silne',
  strengthLabel: 'Siła hasła: {level}',
})
defineCatalog(builtin.multiSelect, 'pl', {
  label: 'Opcje',
  placeholder: 'Wybierz opcje',
  selected: 'Wybrano: {count}',
  search: 'Szukaj opcji',
  noResults: 'Nie znaleziono opcji',
  loading: 'Ładowanie opcji…',
  clear: 'Wyczyść wybór',
  remove: 'Usuń {label}',
  selectAll: 'Zaznacz wszystko',
  clearAll: 'Wyczyść wszystko',
  create: 'Dodaj „{label}”',
  selectionChanged: 'Wybrano {count} z {total}',
  maxReached: 'Można wybrać maksymalnie {max}',
})
defineCatalog(builtin.tagsInput, 'pl', {
  label: 'Tagi',
  remove: 'Usuń {tag}',
  placeholder: 'Dodaj tag…',
})
defineCatalog(builtin.otpInput, 'pl', {
  label: 'Kod jednorazowy',
  digit: 'Cyfra {n}',
})
defineCatalog(builtin.ai, 'pl', {
  generating: 'Generowanie…',
  done: 'Gotowe',
  error: 'Błąd',
  send: 'Wyślij',
  placeholder: 'Wpisz wiadomość…',
  you: 'Ty',
  assistant: 'Asystent',
})
defineCatalog(builtin.shellHeader, 'pl', {
  skipToContent: 'Przejdź do treści głównej',
  nav: 'Nawigacja główna',
  openMenu: 'Otwórz nawigację',
  closeMenu: 'Zamknij nawigację',
})
defineCatalog(builtin.headerPanel, 'pl', {
  close: 'Zamknij panel',
})
defineCatalog(builtin.switcher, 'pl', {
  label: 'Przełącz aplikację',
})
defineCatalog(builtin.copyButton, 'pl', {
  copy: 'Kopiuj',
  copied: 'Skopiowano',
})
defineCatalog(builtin.skipNav, 'pl', {
  label: 'Przejdź do treści',
})
defineCatalog(builtin.form, 'pl', {
  required: 'Wymagane',
  invalid: 'Nieprawidłowa wartość',
})
defineCatalog(builtin.label, 'pl', {
  required: 'Wymagane',
})
defineCatalog(builtin.inlineLoading, 'pl', {
  active: 'Ładowanie',
  finished: 'Załadowano',
  error: 'Błąd',
})
defineCatalog(builtin.notification, 'pl', {
  dismiss: 'Zamknij',
})
defineCatalog(builtin.treeView, 'pl', {
  loading: 'Ładowanie…',
  expand: 'Rozwiń',
  collapse: 'Zwiń',
})
defineCatalog(builtin.carousel, 'pl', {
  region: 'Karuzela',
  previous: 'Poprzedni slajd',
  next: 'Następny slajd',
  slide: '{n} z {total}',
  goTo: 'Przejdź do slajdu {n}',
  choose: 'Wybierz slajd do wyświetlenia',
  play: 'Uruchom automatyczny pokaz slajdów',
  pause: 'Zatrzymaj automatyczny pokaz slajdów',
})
defineCatalog(builtin.calendar, 'pl', {
  previousMonth: 'Poprzedni miesiąc',
  nextMonth: 'Następny miesiąc',
  today: 'Dzisiaj',
  weekNumber: 'Tydzień',
})
defineCatalog(builtin.colorPicker, 'pl', {
  hue: 'Odcień',
  alpha: 'Alfa',
  colorArea: 'Nasycenie i jasność',
  saturation: 'Nasycenie',
  brightness: 'Jasność',
  eyedropper: 'Pobierz kolor z ekranu',
  presets: 'Kolory predefiniowane',
  hex: 'Wartość koloru',
  value: 'Wybrany kolor {color}',
})
defineCatalog(builtin.drawer, 'pl', {
  close: 'Zamknij',
})
defineCatalog(builtin.menuButton, 'pl', {
  open: 'Otwórz menu',
})
defineCatalog(builtin.resizable, 'pl', {
  handle: 'Zmień rozmiar paneli',
})
defineCatalog(builtin.codeSnippet, 'pl', {
  copy: 'Kopiuj kod',
  copied: 'Skopiowano',
})
defineCatalog(builtin.dateRangePicker, 'pl', {
  label: 'Zakres dat',
  placeholder: 'Wybierz zakres dat',
  start: 'Data początkowa',
  end: 'Data końcowa',
  apply: 'Zastosuj',
  clear: 'Wyczyść',
})
defineCatalog(builtin.toggletip, 'pl', {
  label: 'Więcej informacji',
})
defineCatalog(builtin.avatarGroup, 'pl', {
  more: 'Jeszcze {count}',
})
defineCatalog(builtin.comparison, 'pl', {
  label: 'Suwak porównania',
})
defineCatalog(builtin.qrCode, 'pl', {
  label: 'Kod QR',
})
defineCatalog(builtin.flow, 'pl', {
  zoomIn: 'Powiększ',
  zoomOut: 'Pomniejsz',
  fitView: 'Dopasuj widok',
  minimap: 'Minimapa',
  play: 'Odtwórz',
  pause: 'Wstrzymaj',
  next: 'Następny krok',
  previous: 'Poprzedni krok',
  restart: 'Uruchom ponownie',
  step: 'Krok {current} z {total}',
})
defineCatalog(builtin.logViewer, 'pl', {
  label: 'Dane wyjściowe dziennika',
  search: 'Przeszukaj dziennik',
  follow: 'Śledzenie',
  paused: 'Przejdź do najnowszych',
  copy: 'Kopiuj',
  copied: 'Skopiowano',
  empty: 'Brak danych w dzienniku',
  matches: 'Wyniki: {count}',
  lines: 'Wiersze: {count}',
})
defineCatalog(builtin.editor, 'pl', {
  label: 'Edytor kodu',
  code: 'Kod',
  find: 'Znajdź',
  replace: 'Zamień',
  findPlaceholder: 'Znajdź',
  replacePlaceholder: 'Zamień na',
  next: 'Następne wystąpienie',
  previous: 'Poprzednie wystąpienie',
  replaceOne: 'Zamień',
  replaceAll: 'Zamień wszystko',
  close: 'Zamknij',
  matchCase: 'Uwzględniaj wielkość liter',
  toggleReplace: 'Pokaż/ukryj zamianę',
  noMatches: 'Brak wyników',
  findCount: '{current} z {total}',
  commandMenu: 'Menu poleceń',
  commandMenuEmpty: 'Brak poleceń',
})
