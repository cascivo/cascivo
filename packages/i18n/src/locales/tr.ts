import { builtin } from '../builtin'
import { defineCatalog } from '../messages'

defineCatalog(builtin.pagination, 'tr', {
  itemsPerPage: 'Sayfa başına öğe',
  pageOf: 'Sayfa {page}/{total}',
  range: '{start}–{end} / {total} öğe',
  previous: 'Önceki sayfa',
  next: 'Sonraki sayfa',
  nav: 'Sayfalandırma',
})
defineCatalog(builtin.toast, 'tr', {
  dismiss: 'Bildirimi kapat',
  region: 'Bildirimler',
})
defineCatalog(builtin.modal, 'tr', {
  close: 'İletişim kutusunu kapat',
})
defineCatalog(builtin.alert, 'tr', {
  dismiss: 'Kapat',
})
defineCatalog(builtin.header, 'tr', {
  nav: 'Ana',
})
defineCatalog(builtin.search, 'tr', {
  label: 'Ara',
  placeholder: 'Ara',
  clear: 'Aramayı temizle',
})
defineCatalog(builtin.commandMenu, 'tr', {
  label: 'Komut menüsü',
  placeholder: 'Bir komut yazın veya arayın…',
  empty: 'Sonuç bulunamadı',
  back: 'Geri',
  loading: 'Yükleniyor…',
  matches: '{count} eşleşme',
  scopeLabel: 'Kapsam',
  clearScope: 'Kapsamı temizle',
})
defineCatalog(builtin.breadcrumb, 'tr', {
  nav: 'İçerik haritası',
})
defineCatalog(builtin.datePicker, 'tr', {
  placeholder: 'Bir tarih seçin',
  previousMonth: 'Önceki ay',
  nextMonth: 'Sonraki ay',
  clear: 'Tarihi temizle',
  open: 'Takvimi aç',
})
defineCatalog(builtin.combobox, 'tr', {
  placeholder: 'Bir seçenek belirleyin',
  empty: 'Seçenek bulunamadı',
  clear: 'Seçimi temizle',
  loading: 'Seçenekler yükleniyor…',
  create: '“{label}” ekle',
  resultCount: '{count} seçenek mevcut',
})
defineCatalog(builtin.dataTable, 'tr', {
  search: 'Ara',
  empty: 'Veri yok',
  selectAll: 'Tüm satırları seç',
  selectRow: 'Satırı seç',
  itemsSelected: '{count} seçili',
  expandRow: 'Satırı genişlet',
  previousPage: 'Önceki sayfa',
  nextPage: 'Sonraki sayfa',
  columns: 'Sütunlar',
  actions: 'Eylemler',
  noResults: 'Eşleşen satır yok',
  clearFilters: 'Filtreleri temizle',
  filterColumn: 'Filtrele: {column}',
  min: 'Min.',
  max: 'Maks.',
  all: 'Tümü',
  columnMenu: '{column} seçenekleri',
  sortAscending: 'Artan sırala',
  sortDescending: 'Azalan sırala',
  clearSort: 'Sıralamayı temizle',
  moveLeft: 'Sola taşı',
  moveRight: 'Sağa taşı',
  pinStart: 'Başa sabitle',
  pinEnd: 'Sona sabitle',
  unpin: 'Sabitlemeyi kaldır',
  hideColumn: 'Sütunu gizle',
  resizeColumn: 'Yeniden boyutlandır: {column}',
  editCell: 'Düzenle: {column}',
  totals: 'Toplam',
  exportCsv: 'CSV olarak dışa aktar',
})
defineCatalog(builtin.dock, 'tr', {
  nav: 'Ana gezinme',
})
defineCatalog(builtin.steps, 'tr', {
  label: 'Adımlar',
})
defineCatalog(builtin.overflowMenu, 'tr', {
  trigger: 'Diğer eylemler',
})
defineCatalog(builtin.sideNav, 'tr', {
  nav: 'Yan gezinme',
  collapse: 'Gezinmeyi daralt',
  expand: 'Gezinmeyi genişlet',
})
defineCatalog(builtin.spinner, 'tr', {
  label: 'Yükleniyor',
})
defineCatalog(builtin.numberInput, 'tr', {
  increment: 'Artır',
  decrement: 'Azalt',
})
defineCatalog(builtin.tag, 'tr', {
  dismiss: 'Kaldır',
})
defineCatalog(builtin.appShell, 'tr', {
  collapse: 'Gezinmeyi daralt',
  expand: 'Gezinmeyi genişlet',
  dismissError: 'Hatayı kapat',
})
defineCatalog(builtin.charts, 'tr', {
  legendToggle: '{name} serisini göster/gizle',
  noData: 'Veri yok',
  resetZoom: 'Yakınlaştırmayı sıfırla',
  exportPng: 'PNG olarak dışa aktar',
  exportSvg: 'SVG olarak dışa aktar',
  dataView: 'Veri görünümü',
  restore: 'Geri yükle',
})
defineCatalog(builtin.alertDialog, 'tr', {
  confirm: 'Onayla',
  cancel: 'İptal',
})
defineCatalog(builtin.sheet, 'tr', {
  close: 'Paneli kapat',
})
defineCatalog(builtin.bottomSheet, 'tr', {
  close: 'Kapat',
  handle: 'Yeniden boyutlandırmak için sürükleyin',
})
defineCatalog(builtin.actionSheet, 'tr', {
  label: 'Eylemler',
  cancel: 'İptal',
})
defineCatalog(builtin.reorderList, 'tr', {
  handle: 'Yeniden sırala: {name}',
  grabbed: '{name} alındı. Konum {position}/{total}.',
  moved: '{name}, {position}/{total} konumuna taşındı.',
  dropped: '{name}, {position}/{total} konumuna bırakıldı.',
  cancelled: 'Yeniden sıralama iptal edildi. {name} ilk konumuna döndü.',
})
defineCatalog(builtin.infiniteScroll, 'tr', {
  loadMore: 'Daha fazla yükle',
  loading: 'Daha fazlası yükleniyor',
})
defineCatalog(builtin.pullToRefresh, 'tr', {
  pull: 'Yenilemek için çekin',
  release: 'Yenilemek için bırakın',
  refreshing: 'Yenileniyor',
})
defineCatalog(builtin.fileUploader, 'tr', {
  label: 'Dosya yükle',
  drop: 'Dosyaları buraya sürükleyip bırakın veya yüklemek için tıklayın',
  remove: 'Kaldır: {name}',
  uploading: 'Yükleniyor',
  complete: 'Yükleme tamamlandı',
  error: 'Yükleme başarısız oldu',
  status: { one: '{count} dosya: {state}', other: '{count} dosya: {state}' },
})
defineCatalog(builtin.passwordInput, 'tr', {
  reveal: 'Parolayı göster',
  hide: 'Parolayı gizle',
  strengthWeak: 'zayıf',
  strengthFair: 'orta',
  strengthGood: 'iyi',
  strengthStrong: 'güçlü',
  strengthLabel: 'Parola gücü: {level}',
})
defineCatalog(builtin.multiSelect, 'tr', {
  label: 'Seçenekler',
  placeholder: 'Seçenekleri belirleyin',
  selected: '{count} seçili',
  search: 'Seçeneklerde ara',
  noResults: 'Seçenek bulunamadı',
  loading: 'Seçenekler yükleniyor…',
  clear: 'Seçimi temizle',
  remove: 'Kaldır: {label}',
  selectAll: 'Tümünü seç',
  clearAll: 'Tümünü temizle',
  create: '“{label}” ekle',
  selectionChanged: '{count}/{total} seçili',
  maxReached: 'En fazla {max} seçim yapılabilir',
})
defineCatalog(builtin.tagsInput, 'tr', {
  label: 'Etiketler',
  remove: 'Kaldır: {tag}',
  placeholder: 'Etiket ekle…',
})
defineCatalog(builtin.otpInput, 'tr', {
  label: 'Tek kullanımlık kod',
  digit: 'Hane {n}',
})
defineCatalog(builtin.ai, 'tr', {
  generating: 'Oluşturuluyor…',
  done: 'Bitti',
  error: 'Hata',
  send: 'Gönder',
  placeholder: 'Bir mesaj yazın…',
  you: 'Siz',
  assistant: 'Asistan',
})
defineCatalog(builtin.shellHeader, 'tr', {
  skipToContent: 'Ana içeriğe atla',
  nav: 'Ana',
  openMenu: 'Gezinmeyi aç',
  closeMenu: 'Gezinmeyi kapat',
})
defineCatalog(builtin.headerPanel, 'tr', {
  close: 'Paneli kapat',
})
defineCatalog(builtin.switcher, 'tr', {
  label: 'Uygulama değiştir',
})
defineCatalog(builtin.copyButton, 'tr', {
  copy: 'Kopyala',
  copied: 'Kopyalandı',
})
defineCatalog(builtin.skipNav, 'tr', {
  label: 'İçeriğe atla',
})
defineCatalog(builtin.form, 'tr', {
  required: 'Zorunlu',
  invalid: 'Geçersiz değer',
})
defineCatalog(builtin.label, 'tr', {
  required: 'Zorunlu',
})
defineCatalog(builtin.inlineLoading, 'tr', {
  active: 'Yükleniyor',
  finished: 'Yüklendi',
  error: 'Hata',
})
defineCatalog(builtin.notification, 'tr', {
  dismiss: 'Kapat',
})
defineCatalog(builtin.treeView, 'tr', {
  loading: 'Yükleniyor…',
  expand: 'Genişlet',
  collapse: 'Daralt',
})
defineCatalog(builtin.carousel, 'tr', {
  region: 'Karusel',
  previous: 'Önceki slayt',
  next: 'Sonraki slayt',
  slide: '{n}/{total}',
  goTo: '{n}. slayda git',
  choose: 'Görüntülenecek slaydı seçin',
  play: 'Otomatik slayt gösterisini başlat',
  pause: 'Otomatik slayt gösterisini durdur',
})
defineCatalog(builtin.calendar, 'tr', {
  previousMonth: 'Önceki ay',
  nextMonth: 'Sonraki ay',
  today: 'Bugün',
  weekNumber: 'Hafta',
})
defineCatalog(builtin.colorPicker, 'tr', {
  hue: 'Ton',
  alpha: 'Opaklık',
  colorArea: 'Doygunluk ve parlaklık',
  saturation: 'Doygunluk',
  brightness: 'Parlaklık',
  eyedropper: 'Ekrandan renk seç',
  presets: 'Hazır renkler',
  hex: 'Renk değeri',
  value: 'Seçili renk {color}',
})
defineCatalog(builtin.drawer, 'tr', {
  close: 'Kapat',
})
defineCatalog(builtin.menuButton, 'tr', {
  open: 'Menüyü aç',
})
defineCatalog(builtin.resizable, 'tr', {
  handle: 'Panelleri yeniden boyutlandır',
})
defineCatalog(builtin.codeSnippet, 'tr', {
  copy: 'Kodu kopyala',
  copied: 'Kopyalandı',
})
defineCatalog(builtin.dateRangePicker, 'tr', {
  label: 'Tarih aralığı',
  placeholder: 'Bir tarih aralığı seçin',
  start: 'Başlangıç tarihi',
  end: 'Bitiş tarihi',
  apply: 'Uygula',
  clear: 'Temizle',
})
defineCatalog(builtin.toggletip, 'tr', {
  label: 'Daha fazla bilgi',
})
defineCatalog(builtin.toc, 'tr', {
  nav: 'Bu sayfada',
})
defineCatalog(builtin.avatarGroup, 'tr', {
  more: '{count} kişi daha',
})
defineCatalog(builtin.comparison, 'tr', {
  label: 'Karşılaştırma kaydırıcısı',
})
defineCatalog(builtin.qrCode, 'tr', {
  label: 'QR kodu',
})
defineCatalog(builtin.flow, 'tr', {
  zoomIn: 'Yakınlaştır',
  zoomOut: 'Uzaklaştır',
  fitView: 'Görünüme sığdır',
  minimap: 'Mini harita',
  play: 'Oynat',
  pause: 'Duraklat',
  next: 'Sonraki adım',
  previous: 'Önceki adım',
  restart: 'Yeniden başlat',
  step: 'Adım {current}/{total}',
})
defineCatalog(builtin.logViewer, 'tr', {
  label: 'Günlük çıktısı',
  search: 'Günlükte ara',
  follow: 'Takip ediliyor',
  paused: 'En yeniye git',
  copy: 'Kopyala',
  copied: 'Kopyalandı',
  empty: 'Günlük çıktısı yok',
  matches: '{count} eşleşme',
  lines: '{count} satır',
})
defineCatalog(builtin.editor, 'tr', {
  label: 'Kod düzenleyici',
  code: 'Kod',
  find: 'Bul',
  replace: 'Değiştir',
  findPlaceholder: 'Bul',
  replacePlaceholder: 'Şununla değiştir',
  next: 'Sonraki eşleşme',
  previous: 'Önceki eşleşme',
  replaceOne: 'Değiştir',
  replaceAll: 'Tümünü değiştir',
  close: 'Kapat',
  matchCase: 'Büyük/küçük harf eşleştir',
  toggleReplace: 'Değiştirmeyi aç/kapat',
  noMatches: 'Sonuç yok',
  findCount: '{current}/{total}',
  commandMenu: 'Komut menüsü',
  commandMenuEmpty: 'Komut yok',
})
