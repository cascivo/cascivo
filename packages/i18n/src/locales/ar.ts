import { builtin } from '../builtin'
import { defineCatalog } from '../messages'

defineCatalog(builtin.pagination, 'ar', {
  itemsPerPage: 'عدد العناصر في كل صفحة',
  pageOf: 'الصفحة {page} من {total}',
  range: 'العناصر {start}–{end} من {total}',
  previous: 'الصفحة السابقة',
  next: 'الصفحة التالية',
  nav: 'ترقيم الصفحات',
})
defineCatalog(builtin.toast, 'ar', {
  dismiss: 'تجاهل الإشعار',
  region: 'الإشعارات',
})
defineCatalog(builtin.modal, 'ar', {
  close: 'إغلاق مربع الحوار',
})
defineCatalog(builtin.alert, 'ar', {
  dismiss: 'تجاهل',
})
defineCatalog(builtin.header, 'ar', {
  nav: 'رئيسي',
})
defineCatalog(builtin.search, 'ar', {
  label: 'بحث',
  placeholder: 'بحث',
  clear: 'مسح البحث',
})
defineCatalog(builtin.commandMenu, 'ar', {
  label: 'قائمة الأوامر',
  placeholder: 'اكتب أمرًا أو ابحث…',
  empty: 'لم يتم العثور على نتائج',
  back: 'رجوع',
  loading: 'جارٍ التحميل…',
  matches: 'عدد النتائج المطابقة: {count}',
  scopeLabel: 'النطاق',
  clearScope: 'مسح النطاق',
})
defineCatalog(builtin.breadcrumb, 'ar', {
  nav: 'مسار التنقل',
})
defineCatalog(builtin.datePicker, 'ar', {
  placeholder: 'اختر تاريخًا',
  previousMonth: 'الشهر السابق',
  nextMonth: 'الشهر التالي',
  clear: 'مسح التاريخ',
  open: 'فتح التقويم',
})
defineCatalog(builtin.combobox, 'ar', {
  placeholder: 'اختر خيارًا',
  empty: 'لم يتم العثور على خيارات',
  clear: 'مسح التحديد',
  loading: 'جارٍ تحميل الخيارات…',
  create: 'إضافة ”{label}“',
  resultCount: 'عدد الخيارات المتاحة: {count}',
})
defineCatalog(builtin.dataTable, 'ar', {
  search: 'بحث',
  empty: 'لا توجد بيانات',
  selectAll: 'تحديد كل الصفوف',
  selectRow: 'تحديد الصف',
  itemsSelected: 'المحدد: {count}',
  expandRow: 'توسيع الصف',
  previousPage: 'الصفحة السابقة',
  nextPage: 'الصفحة التالية',
  columns: 'الأعمدة',
  actions: 'الإجراءات',
  noResults: 'لا توجد صفوف مطابقة',
  clearFilters: 'مسح عوامل التصفية',
  filterColumn: 'تصفية {column}',
  min: 'الحد الأدنى',
  max: 'الحد الأقصى',
  all: 'الكل',
  columnMenu: 'خيارات {column}',
  sortAscending: 'فرز تصاعدي',
  sortDescending: 'فرز تنازلي',
  clearSort: 'مسح الفرز',
  moveLeft: 'نقل إلى اليسار',
  moveRight: 'نقل إلى اليمين',
  pinStart: 'تثبيت في البداية',
  pinEnd: 'تثبيت في النهاية',
  unpin: 'إلغاء التثبيت',
  hideColumn: 'إخفاء العمود',
  resizeColumn: 'تغيير حجم {column}',
  editCell: 'تعديل {column}',
  totals: 'الإجمالي',
  exportCsv: 'تصدير CSV',
})
defineCatalog(builtin.dock, 'ar', {
  nav: 'التنقل الرئيسي',
})
defineCatalog(builtin.steps, 'ar', {
  label: 'الخطوات',
})
defineCatalog(builtin.overflowMenu, 'ar', {
  trigger: 'مزيد من الإجراءات',
})
defineCatalog(builtin.sideNav, 'ar', {
  nav: 'التنقل الجانبي',
  collapse: 'طي التنقل',
  expand: 'توسيع التنقل',
})
defineCatalog(builtin.spinner, 'ar', {
  label: 'جارٍ التحميل',
})
defineCatalog(builtin.numberInput, 'ar', {
  increment: 'زيادة',
  decrement: 'إنقاص',
})
defineCatalog(builtin.tag, 'ar', {
  dismiss: 'إزالة',
})
defineCatalog(builtin.appShell, 'ar', {
  collapse: 'طي التنقل',
  expand: 'توسيع التنقل',
  dismissError: 'تجاهل الخطأ',
})
defineCatalog(builtin.charts, 'ar', {
  legendToggle: 'إظهار/إخفاء السلسلة {name}',
  noData: 'لا توجد بيانات',
  resetZoom: 'إعادة تعيين التكبير',
  exportPng: 'تصدير PNG',
  exportSvg: 'تصدير SVG',
  dataView: 'عرض البيانات',
  restore: 'استعادة',
})
defineCatalog(builtin.alertDialog, 'ar', {
  confirm: 'تأكيد',
  cancel: 'إلغاء',
})
defineCatalog(builtin.sheet, 'ar', {
  close: 'إغلاق اللوحة',
})
defineCatalog(builtin.bottomSheet, 'ar', {
  close: 'إغلاق',
  handle: 'اسحب لتغيير الحجم',
})
defineCatalog(builtin.actionSheet, 'ar', {
  label: 'الإجراءات',
  cancel: 'إلغاء',
})
defineCatalog(builtin.reorderList, 'ar', {
  handle: 'إعادة ترتيب {name}',
  grabbed: 'تم التقاط {name}. الموضع {position} من {total}.',
  moved: 'تم نقل {name} إلى الموضع {position} من {total}.',
  dropped: 'تم إفلات {name} في الموضع {position} من {total}.',
  cancelled: 'تم إلغاء إعادة الترتيب. عاد {name} إلى موضعه الأصلي.',
})
defineCatalog(builtin.infiniteScroll, 'ar', {
  loadMore: 'تحميل المزيد',
  loading: 'جارٍ تحميل المزيد',
})
defineCatalog(builtin.pullToRefresh, 'ar', {
  pull: 'اسحب للتحديث',
  release: 'أفلت للتحديث',
  refreshing: 'جارٍ التحديث',
})
defineCatalog(builtin.fileUploader, 'ar', {
  label: 'تحميل الملفات',
  drop: 'اسحب الملفات وأفلتها هنا أو انقر للتحميل',
  remove: 'إزالة {name}',
  uploading: 'جارٍ التحميل',
  complete: 'اكتمل التحميل',
  error: 'فشل التحميل',
  status: {
    zero: 'لا توجد ملفات: {state}',
    one: 'ملف واحد: {state}',
    two: 'ملفان: {state}',
    few: '{count} ملفات: {state}',
    many: '{count} ملفًا: {state}',
    other: '{count} ملف: {state}',
  },
})
defineCatalog(builtin.passwordInput, 'ar', {
  reveal: 'إظهار كلمة المرور',
  hide: 'إخفاء كلمة المرور',
  strengthWeak: 'ضعيفة',
  strengthFair: 'مقبولة',
  strengthGood: 'جيدة',
  strengthStrong: 'قوية',
  strengthLabel: 'قوة كلمة المرور: {level}',
})
defineCatalog(builtin.multiSelect, 'ar', {
  label: 'الخيارات',
  placeholder: 'اختر خيارات',
  selected: 'المحدد: {count}',
  search: 'البحث في الخيارات',
  noResults: 'لم يتم العثور على خيارات',
  loading: 'جارٍ تحميل الخيارات…',
  clear: 'مسح التحديد',
  remove: 'إزالة {label}',
  selectAll: 'تحديد الكل',
  clearAll: 'مسح الكل',
  create: 'إضافة ”{label}“',
  selectionChanged: 'تم تحديد {count} من {total}',
  maxReached: 'الحد الأقصى للتحديد هو {max}',
})
defineCatalog(builtin.tagsInput, 'ar', {
  label: 'العلامات',
  remove: 'إزالة {tag}',
  placeholder: 'إضافة علامة…',
})
defineCatalog(builtin.otpInput, 'ar', {
  label: 'رمز لمرة واحدة',
  digit: 'الرقم {n}',
})
defineCatalog(builtin.ai, 'ar', {
  generating: 'جارٍ الإنشاء…',
  done: 'تم',
  error: 'خطأ',
  send: 'إرسال',
  placeholder: 'اكتب رسالة…',
  you: 'أنت',
  assistant: 'المساعد',
})
defineCatalog(builtin.shellHeader, 'ar', {
  skipToContent: 'التخطي إلى المحتوى الرئيسي',
  nav: 'رئيسي',
  openMenu: 'فتح التنقل',
  closeMenu: 'إغلاق التنقل',
})
defineCatalog(builtin.headerPanel, 'ar', {
  close: 'إغلاق اللوحة',
})
defineCatalog(builtin.switcher, 'ar', {
  label: 'تبديل التطبيق',
})
defineCatalog(builtin.copyButton, 'ar', {
  copy: 'نسخ',
  copied: 'تم النسخ',
})
defineCatalog(builtin.skipNav, 'ar', {
  label: 'التخطي إلى المحتوى',
})
defineCatalog(builtin.form, 'ar', {
  required: 'مطلوب',
  invalid: 'قيمة غير صالحة',
})
defineCatalog(builtin.label, 'ar', {
  required: 'مطلوب',
})
defineCatalog(builtin.inlineLoading, 'ar', {
  active: 'جارٍ التحميل',
  finished: 'تم التحميل',
  error: 'خطأ',
})
defineCatalog(builtin.notification, 'ar', {
  dismiss: 'تجاهل',
})
defineCatalog(builtin.treeView, 'ar', {
  loading: 'جارٍ التحميل…',
  expand: 'توسيع',
  collapse: 'طي',
})
defineCatalog(builtin.carousel, 'ar', {
  region: 'عرض دوّار',
  previous: 'الشريحة السابقة',
  next: 'الشريحة التالية',
  slide: '{n} من {total}',
  goTo: 'الانتقال إلى الشريحة {n}',
  choose: 'اختر الشريحة المراد عرضها',
  play: 'بدء عرض الشرائح التلقائي',
  pause: 'إيقاف عرض الشرائح التلقائي',
})
defineCatalog(builtin.calendar, 'ar', {
  previousMonth: 'الشهر السابق',
  nextMonth: 'الشهر التالي',
  today: 'اليوم',
  weekNumber: 'الأسبوع',
})
defineCatalog(builtin.colorPicker, 'ar', {
  hue: 'تدرج اللون',
  alpha: 'الشفافية',
  colorArea: 'التشبع والسطوع',
  saturation: 'التشبع',
  brightness: 'السطوع',
  eyedropper: 'اختيار لون من الشاشة',
  presets: 'ألوان محددة مسبقًا',
  hex: 'قيمة اللون',
  value: 'اللون المحدد {color}',
})
defineCatalog(builtin.drawer, 'ar', {
  close: 'إغلاق',
})
defineCatalog(builtin.menuButton, 'ar', {
  open: 'فتح القائمة',
})
defineCatalog(builtin.resizable, 'ar', {
  handle: 'تغيير حجم اللوحات',
})
defineCatalog(builtin.codeSnippet, 'ar', {
  copy: 'نسخ الرمز',
  copied: 'تم النسخ',
})
defineCatalog(builtin.dateRangePicker, 'ar', {
  label: 'نطاق التاريخ',
  placeholder: 'اختر نطاق تاريخ',
  start: 'تاريخ البدء',
  end: 'تاريخ الانتهاء',
  apply: 'تطبيق',
  clear: 'مسح',
})
defineCatalog(builtin.toggletip, 'ar', {
  label: 'مزيد من المعلومات',
})
defineCatalog(builtin.toc, 'ar', {
  nav: 'في هذه الصفحة',
})
defineCatalog(builtin.avatarGroup, 'ar', {
  more: '{count} آخرون',
})
defineCatalog(builtin.comparison, 'ar', {
  label: 'شريط تمرير المقارنة',
})
defineCatalog(builtin.qrCode, 'ar', {
  label: 'رمز QR',
})
defineCatalog(builtin.flow, 'ar', {
  zoomIn: 'تكبير',
  zoomOut: 'تصغير',
  fitView: 'ملاءمة العرض',
  minimap: 'خريطة مصغرة',
  play: 'تشغيل',
  pause: 'إيقاف مؤقت',
  next: 'الخطوة التالية',
  previous: 'الخطوة السابقة',
  restart: 'إعادة البدء',
  step: 'الخطوة {current} من {total}',
})
defineCatalog(builtin.logViewer, 'ar', {
  label: 'مخرجات السجل',
  search: 'البحث في السجل',
  follow: 'قيد المتابعة',
  paused: 'الانتقال إلى الأحدث',
  copy: 'نسخ',
  copied: 'تم النسخ',
  empty: 'لا توجد مخرجات في السجل',
  matches: 'عدد النتائج المطابقة: {count}',
  lines: 'عدد الأسطر: {count}',
})
defineCatalog(builtin.editor, 'ar', {
  label: 'محرر الرموز',
  code: 'الرمز',
  find: 'بحث',
  replace: 'استبدال',
  findPlaceholder: 'بحث',
  replacePlaceholder: 'استبدال بـ',
  next: 'التطابق التالي',
  previous: 'التطابق السابق',
  replaceOne: 'استبدال',
  replaceAll: 'استبدال الكل',
  close: 'إغلاق',
  matchCase: 'مطابقة حالة الأحرف',
  toggleReplace: 'تبديل الاستبدال',
  noMatches: 'لا توجد نتائج',
  findCount: '{current} من {total}',
  commandMenu: 'قائمة الأوامر',
  commandMenuEmpty: 'لا توجد أوامر',
})
