import { builtin } from '../builtin'
import { defineCatalog } from '../messages'

defineCatalog(builtin.pagination, 'es', {
  itemsPerPage: 'Elementos por página',
  pageOf: 'Página {page} de {total}',
  range: '{start}–{end} de {total} elementos',
  previous: 'Página anterior',
  next: 'Página siguiente',
  nav: 'Paginación',
})
defineCatalog(builtin.toast, 'es', {
  dismiss: 'Descartar notificación',
  region: 'Notificaciones',
})
defineCatalog(builtin.modal, 'es', {
  close: 'Cerrar cuadro de diálogo',
})
defineCatalog(builtin.alert, 'es', {
  dismiss: 'Descartar',
})
defineCatalog(builtin.header, 'es', {
  nav: 'Navegación principal',
})
defineCatalog(builtin.search, 'es', {
  label: 'Búsqueda',
  placeholder: 'Buscar',
  clear: 'Borrar búsqueda',
})
defineCatalog(builtin.commandMenu, 'es', {
  label: 'Menú de comandos',
  placeholder: 'Escribe un comando o busca…',
  empty: 'No se encontraron resultados',
  back: 'Atrás',
  loading: 'Cargando…',
  matches: '{count} coincidencias',
  scopeLabel: 'Ámbito',
  clearScope: 'Borrar ámbito',
})
defineCatalog(builtin.breadcrumb, 'es', {
  nav: 'Ruta de navegación',
})
defineCatalog(builtin.toc, 'es', {
  nav: 'En esta página',
})
defineCatalog(builtin.datePicker, 'es', {
  placeholder: 'Seleccionar una fecha',
  previousMonth: 'Mes anterior',
  nextMonth: 'Mes siguiente',
  clear: 'Borrar fecha',
  open: 'Abrir calendario',
})
defineCatalog(builtin.combobox, 'es', {
  placeholder: 'Seleccionar una opción',
  empty: 'No se encontraron opciones',
  clear: 'Borrar selección',
  loading: 'Cargando opciones…',
  create: 'Añadir «{label}»',
  resultCount: '{count} opciones disponibles',
})
defineCatalog(builtin.dataTable, 'es', {
  search: 'Buscar',
  empty: 'Sin datos',
  selectAll: 'Seleccionar todas las filas',
  selectRow: 'Seleccionar fila',
  itemsSelected: '{count} seleccionados',
  expandRow: 'Expandir fila',
  previousPage: 'Página anterior',
  nextPage: 'Página siguiente',
  columns: 'Columnas',
  actions: 'Acciones',
  noResults: 'No hay filas coincidentes',
  clearFilters: 'Borrar filtros',
  filterColumn: 'Filtrar {column}',
  min: 'Mín.',
  max: 'Máx.',
  all: 'Todo',
  columnMenu: 'Opciones de {column}',
  sortAscending: 'Orden ascendente',
  sortDescending: 'Orden descendente',
  clearSort: 'Quitar orden',
  moveLeft: 'Mover a la izquierda',
  moveRight: 'Mover a la derecha',
  pinStart: 'Fijar al principio',
  pinEnd: 'Fijar al final',
  unpin: 'Desfijar',
  hideColumn: 'Ocultar columna',
  resizeColumn: 'Cambiar tamaño de {column}',
  editCell: 'Editar {column}',
  totals: 'Total',
  exportCsv: 'Exportar CSV',
})
defineCatalog(builtin.dock, 'es', {
  nav: 'Navegación principal',
})
defineCatalog(builtin.steps, 'es', {
  label: 'Pasos',
})
defineCatalog(builtin.overflowMenu, 'es', {
  trigger: 'Más acciones',
})
defineCatalog(builtin.sideNav, 'es', {
  nav: 'Navegación lateral',
  collapse: 'Contraer navegación',
  expand: 'Expandir navegación',
})
defineCatalog(builtin.spinner, 'es', {
  label: 'Cargando',
})
defineCatalog(builtin.numberInput, 'es', {
  increment: 'Aumentar',
  decrement: 'Disminuir',
})
defineCatalog(builtin.tag, 'es', {
  dismiss: 'Quitar',
})
defineCatalog(builtin.appShell, 'es', {
  collapse: 'Contraer navegación',
  expand: 'Expandir navegación',
  dismissError: 'Descartar error',
})
defineCatalog(builtin.charts, 'es', {
  legendToggle: 'Mostrar u ocultar la serie {name}',
  noData: 'Sin datos',
  resetZoom: 'Restablecer zoom',
  exportPng: 'Exportar PNG',
  exportSvg: 'Exportar SVG',
  dataView: 'Vista de datos',
  restore: 'Restaurar',
})
defineCatalog(builtin.alertDialog, 'es', {
  confirm: 'Confirmar',
  cancel: 'Cancelar',
})
defineCatalog(builtin.sheet, 'es', {
  close: 'Cerrar panel',
})
defineCatalog(builtin.bottomSheet, 'es', {
  close: 'Cerrar',
  handle: 'Arrastrar para cambiar el tamaño',
})
defineCatalog(builtin.actionSheet, 'es', {
  label: 'Acciones',
  cancel: 'Cancelar',
})
defineCatalog(builtin.reorderList, 'es', {
  handle: 'Reordenar {name}',
  grabbed: '{name} seleccionado. Posición {position} de {total}.',
  moved: '{name} movido a la posición {position} de {total}.',
  dropped: '{name} soltado en la posición {position} de {total}.',
  cancelled: 'Reordenación cancelada. {name} ha vuelto a su posición original.',
})
defineCatalog(builtin.infiniteScroll, 'es', {
  loadMore: 'Cargar más',
  loading: 'Cargando más',
})
defineCatalog(builtin.pullToRefresh, 'es', {
  pull: 'Desliza para actualizar',
  release: 'Suelta para actualizar',
  refreshing: 'Actualizando',
})
defineCatalog(builtin.fileUploader, 'es', {
  label: 'Subir archivos',
  drop: 'Arrastra y suelta archivos aquí o haz clic para subirlos',
  remove: 'Quitar {name}',
  uploading: 'Subiendo',
  complete: 'Subida completada',
  error: 'Error al subir',
  status: {
    one: '{count} archivo: {state}',
    many: '{count} archivos: {state}',
    other: '{count} archivos: {state}',
  },
})
defineCatalog(builtin.passwordInput, 'es', {
  reveal: 'Mostrar contraseña',
  hide: 'Ocultar contraseña',
  strengthWeak: 'débil',
  strengthFair: 'aceptable',
  strengthGood: 'buena',
  strengthStrong: 'segura',
  strengthLabel: 'Seguridad de la contraseña: {level}',
})
defineCatalog(builtin.multiSelect, 'es', {
  label: 'Opciones',
  placeholder: 'Seleccionar opciones',
  selected: '{count} seleccionados',
  search: 'Buscar opciones',
  noResults: 'No se encontraron opciones',
  loading: 'Cargando opciones…',
  clear: 'Borrar selección',
  remove: 'Quitar {label}',
  selectAll: 'Seleccionar todo',
  clearAll: 'Borrar todo',
  create: 'Añadir «{label}»',
  selectionChanged: '{count} de {total} seleccionados',
  maxReached: 'Máximo de {max} seleccionados',
})
defineCatalog(builtin.tagsInput, 'es', {
  label: 'Etiquetas',
  remove: 'Quitar {tag}',
  placeholder: 'Añadir etiqueta…',
})
defineCatalog(builtin.otpInput, 'es', {
  label: 'Código de un solo uso',
  digit: 'Dígito {n}',
})
defineCatalog(builtin.ai, 'es', {
  generating: 'Generando…',
  done: 'Listo',
  error: 'Error',
  send: 'Enviar',
  placeholder: 'Escribe un mensaje…',
  you: 'Tú',
  assistant: 'Asistente',
})
defineCatalog(builtin.shellHeader, 'es', {
  skipToContent: 'Saltar al contenido principal',
  nav: 'Navegación principal',
  openMenu: 'Abrir navegación',
  closeMenu: 'Cerrar navegación',
})
defineCatalog(builtin.headerPanel, 'es', {
  close: 'Cerrar panel',
})
defineCatalog(builtin.switcher, 'es', {
  label: 'Cambiar de aplicación',
})
defineCatalog(builtin.copyButton, 'es', {
  copy: 'Copiar',
  copied: 'Copiado',
})
defineCatalog(builtin.skipNav, 'es', {
  label: 'Saltar al contenido',
})
defineCatalog(builtin.form, 'es', {
  required: 'Obligatorio',
  invalid: 'Valor no válido',
})
defineCatalog(builtin.label, 'es', {
  required: 'Obligatorio',
})
defineCatalog(builtin.inlineLoading, 'es', {
  active: 'Cargando',
  finished: 'Cargado',
  error: 'Error',
})
defineCatalog(builtin.notification, 'es', {
  dismiss: 'Descartar',
})
defineCatalog(builtin.treeView, 'es', {
  loading: 'Cargando…',
  expand: 'Expandir',
  collapse: 'Contraer',
})
defineCatalog(builtin.carousel, 'es', {
  region: 'Carrusel',
  previous: 'Diapositiva anterior',
  next: 'Diapositiva siguiente',
  slide: '{n} de {total}',
  goTo: 'Ir a la diapositiva {n}',
  choose: 'Elegir la diapositiva que se mostrará',
  play: 'Iniciar presentación automática',
  pause: 'Detener presentación automática',
})
defineCatalog(builtin.calendar, 'es', {
  previousMonth: 'Mes anterior',
  nextMonth: 'Mes siguiente',
  today: 'Hoy',
  weekNumber: 'Semana',
})
defineCatalog(builtin.colorPicker, 'es', {
  hue: 'Tono',
  alpha: 'Alfa',
  colorArea: 'Saturación y brillo',
  saturation: 'Saturación',
  brightness: 'Brillo',
  eyedropper: 'Seleccionar un color de la pantalla',
  presets: 'Colores predefinidos',
  hex: 'Valor del color',
  value: 'Color seleccionado {color}',
})
defineCatalog(builtin.drawer, 'es', {
  close: 'Cerrar',
})
defineCatalog(builtin.menuButton, 'es', {
  open: 'Abrir menú',
})
defineCatalog(builtin.resizable, 'es', {
  handle: 'Cambiar el tamaño de los paneles',
})
defineCatalog(builtin.codeSnippet, 'es', {
  copy: 'Copiar código',
  copied: 'Copiado',
})
defineCatalog(builtin.dateRangePicker, 'es', {
  label: 'Intervalo de fechas',
  placeholder: 'Seleccionar un intervalo de fechas',
  start: 'Fecha de inicio',
  end: 'Fecha de fin',
  apply: 'Aplicar',
  clear: 'Borrar',
})
defineCatalog(builtin.toggletip, 'es', {
  label: 'Más información',
})
defineCatalog(builtin.avatarGroup, 'es', {
  more: '{count} más',
})
defineCatalog(builtin.comparison, 'es', {
  label: 'Control deslizante de comparación',
})
defineCatalog(builtin.qrCode, 'es', {
  label: 'Código QR',
})
defineCatalog(builtin.flow, 'es', {
  zoomIn: 'Acercar',
  zoomOut: 'Alejar',
  fitView: 'Ajustar a la vista',
  minimap: 'Minimapa',
  play: 'Reproducir',
  pause: 'Pausar',
  next: 'Paso siguiente',
  previous: 'Paso anterior',
  restart: 'Reiniciar',
  step: 'Paso {current} de {total}',
})
defineCatalog(builtin.logViewer, 'es', {
  label: 'Salida del registro',
  search: 'Buscar en el registro',
  follow: 'Siguiendo',
  paused: 'Ir a lo más reciente',
  copy: 'Copiar',
  copied: 'Copiado',
  empty: 'Sin salida de registro',
  matches: '{count} coincidencias',
  lines: '{count} líneas',
})
defineCatalog(builtin.editor, 'es', {
  label: 'Editor de código',
  code: 'Código',
  find: 'Buscar',
  replace: 'Reemplazar',
  findPlaceholder: 'Buscar',
  replacePlaceholder: 'Reemplazar por',
  next: 'Coincidencia siguiente',
  previous: 'Coincidencia anterior',
  replaceOne: 'Reemplazar',
  replaceAll: 'Reemplazar todo',
  close: 'Cerrar',
  matchCase: 'Coincidir mayúsculas y minúsculas',
  toggleReplace: 'Mostrar u ocultar reemplazo',
  noMatches: 'Sin resultados',
  findCount: '{current} de {total}',
  commandMenu: 'Menú de comandos',
  commandMenuEmpty: 'No hay comandos',
})
