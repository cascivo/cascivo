import { builtin } from '../builtin'
import { defineCatalog } from '../messages'

defineCatalog(builtin.pagination, 'pt', {
  itemsPerPage: 'Itens por página',
  pageOf: 'Página {page} de {total}',
  range: '{start}–{end} de {total} itens',
  previous: 'Página anterior',
  next: 'Próxima página',
  nav: 'Paginação',
})
defineCatalog(builtin.toast, 'pt', {
  dismiss: 'Dispensar notificação',
  region: 'Notificações',
})
defineCatalog(builtin.modal, 'pt', {
  close: 'Fechar caixa de diálogo',
})
defineCatalog(builtin.alert, 'pt', {
  dismiss: 'Dispensar',
})
defineCatalog(builtin.header, 'pt', {
  nav: 'Principal',
})
defineCatalog(builtin.search, 'pt', {
  label: 'Pesquisar',
  placeholder: 'Pesquisar',
  clear: 'Limpar pesquisa',
})
defineCatalog(builtin.commandMenu, 'pt', {
  label: 'Menu de comandos',
  placeholder: 'Digite um comando ou pesquise…',
  empty: 'Nenhum resultado encontrado',
  back: 'Voltar',
  loading: 'Carregando…',
  matches: '{count} resultados',
  scopeLabel: 'Escopo',
  clearScope: 'Limpar escopo',
})
defineCatalog(builtin.breadcrumb, 'pt', {
  nav: 'Trilha de navegação',
})
defineCatalog(builtin.toc, 'pt', {
  nav: 'Nesta página',
})
defineCatalog(builtin.datePicker, 'pt', {
  placeholder: 'Selecione uma data',
  previousMonth: 'Mês anterior',
  nextMonth: 'Próximo mês',
  clear: 'Limpar data',
  open: 'Abrir calendário',
})
defineCatalog(builtin.combobox, 'pt', {
  placeholder: 'Selecione uma opção',
  empty: 'Nenhuma opção encontrada',
  clear: 'Limpar seleção',
  loading: 'Carregando opções…',
  create: 'Adicionar “{label}”',
  resultCount: '{count} opções disponíveis',
})
defineCatalog(builtin.dataTable, 'pt', {
  search: 'Pesquisar',
  empty: 'Nenhum dado',
  selectAll: 'Selecionar todas as linhas',
  selectRow: 'Selecionar linha',
  itemsSelected: '{count} selecionados',
  expandRow: 'Expandir linha',
  previousPage: 'Página anterior',
  nextPage: 'Próxima página',
  columns: 'Colunas',
  actions: 'Ações',
  noResults: 'Nenhuma linha correspondente',
  clearFilters: 'Limpar filtros',
  filterColumn: 'Filtrar {column}',
  min: 'Mín.',
  max: 'Máx.',
  all: 'Todos',
  columnMenu: 'Opções de {column}',
  sortAscending: 'Classificar em ordem crescente',
  sortDescending: 'Classificar em ordem decrescente',
  clearSort: 'Limpar classificação',
  moveLeft: 'Mover para a esquerda',
  moveRight: 'Mover para a direita',
  pinStart: 'Fixar no início',
  pinEnd: 'Fixar no final',
  unpin: 'Desafixar',
  hideColumn: 'Ocultar coluna',
  resizeColumn: 'Redimensionar {column}',
  editCell: 'Editar {column}',
  totals: 'Total',
  exportCsv: 'Exportar CSV',
})
defineCatalog(builtin.dock, 'pt', {
  nav: 'Navegação principal',
})
defineCatalog(builtin.steps, 'pt', {
  label: 'Etapas',
})
defineCatalog(builtin.overflowMenu, 'pt', {
  trigger: 'Mais ações',
})
defineCatalog(builtin.sideNav, 'pt', {
  nav: 'Navegação lateral',
  collapse: 'Recolher navegação',
  expand: 'Expandir navegação',
})
defineCatalog(builtin.spinner, 'pt', {
  label: 'Carregando',
})
defineCatalog(builtin.numberInput, 'pt', {
  increment: 'Aumentar',
  decrement: 'Diminuir',
})
defineCatalog(builtin.tag, 'pt', {
  dismiss: 'Remover',
})
defineCatalog(builtin.appShell, 'pt', {
  collapse: 'Recolher navegação',
  expand: 'Expandir navegação',
  dismissError: 'Dispensar erro',
})
defineCatalog(builtin.charts, 'pt', {
  legendToggle: 'Alternar série {name}',
  noData: 'Nenhum dado',
  resetZoom: 'Redefinir zoom',
  exportPng: 'Exportar PNG',
  exportSvg: 'Exportar SVG',
  dataView: 'Visualização de dados',
  restore: 'Restaurar',
})
defineCatalog(builtin.alertDialog, 'pt', {
  confirm: 'Confirmar',
  cancel: 'Cancelar',
})
defineCatalog(builtin.sheet, 'pt', {
  close: 'Fechar painel',
})
defineCatalog(builtin.bottomSheet, 'pt', {
  close: 'Fechar',
  handle: 'Arraste para redimensionar',
})
defineCatalog(builtin.actionSheet, 'pt', {
  label: 'Ações',
  cancel: 'Cancelar',
})
defineCatalog(builtin.reorderList, 'pt', {
  handle: 'Reordenar {name}',
  grabbed: '{name} selecionado. Posição {position} de {total}.',
  moved: '{name} movido para a posição {position} de {total}.',
  dropped: '{name} solto na posição {position} de {total}.',
  cancelled: 'Reordenação cancelada. {name} voltou à posição original.',
})
defineCatalog(builtin.infiniteScroll, 'pt', {
  loadMore: 'Carregar mais',
  loading: 'Carregando mais',
})
defineCatalog(builtin.pullToRefresh, 'pt', {
  pull: 'Puxe para atualizar',
  release: 'Solte para atualizar',
  refreshing: 'Atualizando',
})
defineCatalog(builtin.fileUploader, 'pt', {
  label: 'Enviar arquivos',
  drop: 'Arraste e solte arquivos aqui ou clique para enviar',
  remove: 'Remover {name}',
  uploading: 'Enviando',
  complete: 'Envio concluído',
  error: 'Falha no envio',
  status: {
    one: '{count} arquivo: {state}',
    many: '{count} de arquivos: {state}',
    other: '{count} arquivos: {state}',
  },
})
defineCatalog(builtin.passwordInput, 'pt', {
  reveal: 'Mostrar senha',
  hide: 'Ocultar senha',
  strengthWeak: 'fraca',
  strengthFair: 'razoável',
  strengthGood: 'boa',
  strengthStrong: 'forte',
  strengthLabel: 'Força da senha: {level}',
})
defineCatalog(builtin.multiSelect, 'pt', {
  label: 'Opções',
  placeholder: 'Selecione opções',
  selected: '{count} selecionados',
  search: 'Pesquisar opções',
  noResults: 'Nenhuma opção encontrada',
  loading: 'Carregando opções…',
  clear: 'Limpar seleção',
  remove: 'Remover {label}',
  selectAll: 'Selecionar tudo',
  clearAll: 'Limpar tudo',
  create: 'Adicionar “{label}”',
  selectionChanged: '{count} de {total} selecionados',
  maxReached: 'Máximo de {max} selecionados',
})
defineCatalog(builtin.tagsInput, 'pt', {
  label: 'Tags',
  remove: 'Remover {tag}',
  placeholder: 'Adicionar tag…',
})
defineCatalog(builtin.otpInput, 'pt', {
  label: 'Código de uso único',
  digit: 'Dígito {n}',
})
defineCatalog(builtin.ai, 'pt', {
  generating: 'Gerando…',
  done: 'Concluído',
  error: 'Erro',
  send: 'Enviar',
  placeholder: 'Digite uma mensagem…',
  you: 'Você',
  assistant: 'Assistente',
})
defineCatalog(builtin.shellHeader, 'pt', {
  skipToContent: 'Pular para o conteúdo principal',
  nav: 'Principal',
  openMenu: 'Abrir navegação',
  closeMenu: 'Fechar navegação',
})
defineCatalog(builtin.headerPanel, 'pt', {
  close: 'Fechar painel',
})
defineCatalog(builtin.switcher, 'pt', {
  label: 'Alternar aplicativo',
})
defineCatalog(builtin.copyButton, 'pt', {
  copy: 'Copiar',
  copied: 'Copiado',
})
defineCatalog(builtin.skipNav, 'pt', {
  label: 'Pular para o conteúdo',
})
defineCatalog(builtin.form, 'pt', {
  required: 'Obrigatório',
  invalid: 'Valor inválido',
})
defineCatalog(builtin.label, 'pt', {
  required: 'Obrigatório',
})
defineCatalog(builtin.inlineLoading, 'pt', {
  active: 'Carregando',
  finished: 'Carregado',
  error: 'Erro',
})
defineCatalog(builtin.notification, 'pt', {
  dismiss: 'Dispensar',
})
defineCatalog(builtin.treeView, 'pt', {
  loading: 'Carregando…',
  expand: 'Expandir',
  collapse: 'Recolher',
})
defineCatalog(builtin.carousel, 'pt', {
  region: 'Carrossel',
  previous: 'Slide anterior',
  next: 'Próximo slide',
  slide: '{n} de {total}',
  goTo: 'Ir para o slide {n}',
  choose: 'Escolha o slide a exibir',
  play: 'Iniciar apresentação automática',
  pause: 'Parar apresentação automática',
})
defineCatalog(builtin.calendar, 'pt', {
  previousMonth: 'Mês anterior',
  nextMonth: 'Próximo mês',
  today: 'Hoje',
  weekNumber: 'Semana',
})
defineCatalog(builtin.colorPicker, 'pt', {
  hue: 'Matiz',
  alpha: 'Alfa',
  colorArea: 'Saturação e brilho',
  saturation: 'Saturação',
  brightness: 'Brilho',
  eyedropper: 'Escolher uma cor da tela',
  presets: 'Cores predefinidas',
  hex: 'Valor da cor',
  value: 'Cor selecionada {color}',
})
defineCatalog(builtin.drawer, 'pt', {
  close: 'Fechar',
})
defineCatalog(builtin.menuButton, 'pt', {
  open: 'Abrir menu',
})
defineCatalog(builtin.resizable, 'pt', {
  handle: 'Redimensionar painéis',
})
defineCatalog(builtin.codeSnippet, 'pt', {
  copy: 'Copiar código',
  copied: 'Copiado',
})
defineCatalog(builtin.dateRangePicker, 'pt', {
  label: 'Período',
  placeholder: 'Selecione um período',
  start: 'Data de início',
  end: 'Data de término',
  apply: 'Aplicar',
  clear: 'Limpar',
})
defineCatalog(builtin.toggletip, 'pt', {
  label: 'Mais informações',
})
defineCatalog(builtin.avatarGroup, 'pt', {
  more: 'Mais {count}',
})
defineCatalog(builtin.comparison, 'pt', {
  label: 'Controle deslizante de comparação',
})
defineCatalog(builtin.qrCode, 'pt', {
  label: 'Código QR',
})
defineCatalog(builtin.flow, 'pt', {
  zoomIn: 'Ampliar',
  zoomOut: 'Reduzir',
  fitView: 'Ajustar à tela',
  minimap: 'Minimapa',
  play: 'Reproduzir',
  pause: 'Pausar',
  next: 'Próxima etapa',
  previous: 'Etapa anterior',
  restart: 'Reiniciar',
  step: 'Etapa {current} de {total}',
})
defineCatalog(builtin.logViewer, 'pt', {
  label: 'Saída do log',
  search: 'Pesquisar no log',
  follow: 'Acompanhando',
  paused: 'Ir para o mais recente',
  copy: 'Copiar',
  copied: 'Copiado',
  empty: 'Nenhuma saída de log',
  matches: '{count} resultados',
  lines: '{count} linhas',
})
defineCatalog(builtin.editor, 'pt', {
  label: 'Editor de código',
  code: 'Código',
  find: 'Localizar',
  replace: 'Substituir',
  findPlaceholder: 'Localizar',
  replacePlaceholder: 'Substituir por',
  next: 'Próximo resultado',
  previous: 'Resultado anterior',
  replaceOne: 'Substituir',
  replaceAll: 'Substituir tudo',
  close: 'Fechar',
  matchCase: 'Diferenciar maiúsculas e minúsculas',
  toggleReplace: 'Alternar substituição',
  noMatches: 'Nenhum resultado',
  findCount: '{current} de {total}',
  commandMenu: 'Menu de comandos',
  commandMenuEmpty: 'Nenhum comando',
})
