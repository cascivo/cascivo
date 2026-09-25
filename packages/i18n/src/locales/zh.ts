import { builtin } from '../builtin'
import { defineCatalog } from '../messages'

defineCatalog(builtin.pagination, 'zh', {
  itemsPerPage: '每页项数',
  pageOf: '第 {page} 页，共 {total} 页',
  range: '第 {start}–{end} 项，共 {total} 项',
  previous: '上一页',
  next: '下一页',
  nav: '分页',
})
defineCatalog(builtin.toast, 'zh', {
  dismiss: '关闭通知',
  region: '通知',
})
defineCatalog(builtin.modal, 'zh', {
  close: '关闭对话框',
})
defineCatalog(builtin.alert, 'zh', {
  dismiss: '关闭',
})
defineCatalog(builtin.header, 'zh', {
  nav: '主导航',
})
defineCatalog(builtin.search, 'zh', {
  label: '搜索',
  placeholder: '搜索',
  clear: '清除搜索',
})
defineCatalog(builtin.commandMenu, 'zh', {
  label: '命令菜单',
  placeholder: '输入命令或搜索…',
  empty: '未找到结果',
  back: '返回',
  loading: '正在加载…',
  matches: '{count} 个匹配项',
  scopeLabel: '范围',
  clearScope: '清除范围',
})
defineCatalog(builtin.breadcrumb, 'zh', {
  nav: '面包屑导航',
})
defineCatalog(builtin.datePicker, 'zh', {
  placeholder: '选择日期',
  previousMonth: '上个月',
  nextMonth: '下个月',
  clear: '清除日期',
  open: '打开日历',
})
defineCatalog(builtin.combobox, 'zh', {
  placeholder: '选择一个选项',
  empty: '未找到选项',
  clear: '清除所选内容',
  loading: '正在加载选项…',
  create: '添加“{label}”',
  resultCount: '有 {count} 个可用选项',
})
defineCatalog(builtin.dataTable, 'zh', {
  search: '搜索',
  empty: '暂无数据',
  selectAll: '选择所有行',
  selectRow: '选择行',
  itemsSelected: '已选择 {count} 项',
  expandRow: '展开行',
  previousPage: '上一页',
  nextPage: '下一页',
  columns: '列',
  actions: '操作',
  noResults: '没有匹配的行',
  clearFilters: '清除筛选条件',
  filterColumn: '筛选{column}',
  min: '最小值',
  max: '最大值',
  all: '全部',
  columnMenu: '{column}的选项',
  sortAscending: '升序排序',
  sortDescending: '降序排序',
  clearSort: '清除排序',
  moveLeft: '左移',
  moveRight: '右移',
  pinStart: '固定到开头',
  pinEnd: '固定到末尾',
  unpin: '取消固定',
  hideColumn: '隐藏列',
  resizeColumn: '调整{column}的宽度',
  editCell: '编辑{column}',
  totals: '合计',
  exportCsv: '导出 CSV',
})
defineCatalog(builtin.dock, 'zh', {
  nav: '主导航',
})
defineCatalog(builtin.steps, 'zh', {
  label: '步骤',
})
defineCatalog(builtin.overflowMenu, 'zh', {
  trigger: '更多操作',
})
defineCatalog(builtin.sideNav, 'zh', {
  nav: '侧边导航',
  collapse: '收起导航',
  expand: '展开导航',
})
defineCatalog(builtin.spinner, 'zh', {
  label: '正在加载',
})
defineCatalog(builtin.numberInput, 'zh', {
  increment: '增加',
  decrement: '减少',
})
defineCatalog(builtin.tag, 'zh', {
  dismiss: '移除',
})
defineCatalog(builtin.appShell, 'zh', {
  collapse: '收起导航',
  expand: '展开导航',
  dismissError: '关闭错误',
})
defineCatalog(builtin.charts, 'zh', {
  legendToggle: '切换系列 {name}',
  noData: '暂无数据',
  resetZoom: '重置缩放',
  exportPng: '导出 PNG',
  exportSvg: '导出 SVG',
  dataView: '数据视图',
  restore: '还原',
})
defineCatalog(builtin.alertDialog, 'zh', {
  confirm: '确认',
  cancel: '取消',
})
defineCatalog(builtin.sheet, 'zh', {
  close: '关闭面板',
})
defineCatalog(builtin.bottomSheet, 'zh', {
  close: '关闭',
  handle: '拖动以调整大小',
})
defineCatalog(builtin.actionSheet, 'zh', {
  label: '操作',
  cancel: '取消',
})
defineCatalog(builtin.reorderList, 'zh', {
  handle: '重新排序{name}',
  grabbed: '已拿起{name}。当前位置：第 {position} 个，共 {total} 个。',
  moved: '已将{name}移至第 {position} 个位置，共 {total} 个。',
  dropped: '已将{name}放置在第 {position} 个位置，共 {total} 个。',
  cancelled: '已取消重新排序。{name}已回到原来的位置。',
})
defineCatalog(builtin.infiniteScroll, 'zh', {
  loadMore: '加载更多',
  loading: '正在加载更多',
})
defineCatalog(builtin.pullToRefresh, 'zh', {
  pull: '下拉刷新',
  release: '释放刷新',
  refreshing: '正在刷新',
})
defineCatalog(builtin.fileUploader, 'zh', {
  label: '上传文件',
  drop: '将文件拖放到此处或点击上传',
  remove: '移除{name}',
  uploading: '正在上传',
  complete: '上传完成',
  error: '上传失败',
  status: { other: '{count} 个文件：{state}' },
})
defineCatalog(builtin.passwordInput, 'zh', {
  reveal: '显示密码',
  hide: '隐藏密码',
  strengthWeak: '弱',
  strengthFair: '一般',
  strengthGood: '良好',
  strengthStrong: '强',
  strengthLabel: '密码强度：{level}',
})
defineCatalog(builtin.multiSelect, 'zh', {
  label: '选项',
  placeholder: '选择选项',
  selected: '已选择 {count} 项',
  search: '搜索选项',
  noResults: '未找到选项',
  loading: '正在加载选项…',
  clear: '清除所选内容',
  remove: '移除{label}',
  selectAll: '全选',
  clearAll: '全部清除',
  create: '添加“{label}”',
  selectionChanged: '已选择 {count} 项，共 {total} 项',
  maxReached: '最多可选择 {max} 项',
})
defineCatalog(builtin.tagsInput, 'zh', {
  label: '标签',
  remove: '移除{tag}',
  placeholder: '添加标签…',
})
defineCatalog(builtin.otpInput, 'zh', {
  label: '一次性验证码',
  digit: '第 {n} 位',
})
defineCatalog(builtin.ai, 'zh', {
  generating: '正在生成…',
  done: '完成',
  error: '错误',
  send: '发送',
  placeholder: '输入消息…',
  you: '你',
  assistant: '助手',
})
defineCatalog(builtin.shellHeader, 'zh', {
  skipToContent: '跳至主要内容',
  nav: '主导航',
  openMenu: '打开导航',
  closeMenu: '关闭导航',
})
defineCatalog(builtin.headerPanel, 'zh', {
  close: '关闭面板',
})
defineCatalog(builtin.switcher, 'zh', {
  label: '切换应用',
})
defineCatalog(builtin.copyButton, 'zh', {
  copy: '复制',
  copied: '已复制',
})
defineCatalog(builtin.skipNav, 'zh', {
  label: '跳至内容',
})
defineCatalog(builtin.form, 'zh', {
  required: '必填',
  invalid: '值无效',
})
defineCatalog(builtin.label, 'zh', {
  required: '必填',
})
defineCatalog(builtin.inlineLoading, 'zh', {
  active: '正在加载',
  finished: '已加载',
  error: '错误',
})
defineCatalog(builtin.notification, 'zh', {
  dismiss: '关闭',
})
defineCatalog(builtin.treeView, 'zh', {
  loading: '正在加载…',
  expand: '展开',
  collapse: '收起',
})
defineCatalog(builtin.carousel, 'zh', {
  region: '轮播',
  previous: '上一张幻灯片',
  next: '下一张幻灯片',
  slide: '第 {n} 张，共 {total} 张',
  goTo: '转到第 {n} 张幻灯片',
  choose: '选择要显示的幻灯片',
  play: '开始自动播放幻灯片',
  pause: '停止自动播放幻灯片',
})
defineCatalog(builtin.calendar, 'zh', {
  previousMonth: '上个月',
  nextMonth: '下个月',
  today: '今天',
  weekNumber: '周',
})
defineCatalog(builtin.colorPicker, 'zh', {
  hue: '色相',
  alpha: '不透明度',
  colorArea: '饱和度和亮度',
  saturation: '饱和度',
  brightness: '亮度',
  eyedropper: '从屏幕上拾取颜色',
  presets: '预设颜色',
  hex: '颜色值',
  value: '所选颜色 {color}',
})
defineCatalog(builtin.drawer, 'zh', {
  close: '关闭',
})
defineCatalog(builtin.menuButton, 'zh', {
  open: '打开菜单',
})
defineCatalog(builtin.resizable, 'zh', {
  handle: '调整面板大小',
})
defineCatalog(builtin.codeSnippet, 'zh', {
  copy: '复制代码',
  copied: '已复制',
})
defineCatalog(builtin.dateRangePicker, 'zh', {
  label: '日期范围',
  placeholder: '选择日期范围',
  start: '开始日期',
  end: '结束日期',
  apply: '应用',
  clear: '清除',
})
defineCatalog(builtin.toggletip, 'zh', {
  label: '更多信息',
})
defineCatalog(builtin.toc, 'zh', {
  nav: '本页内容',
})
defineCatalog(builtin.avatarGroup, 'zh', {
  more: '另外 {count} 个',
})
defineCatalog(builtin.comparison, 'zh', {
  label: '对比滑块',
})
defineCatalog(builtin.qrCode, 'zh', {
  label: '二维码',
})
defineCatalog(builtin.flow, 'zh', {
  zoomIn: '放大',
  zoomOut: '缩小',
  fitView: '适合视图',
  minimap: '小地图',
  play: '播放',
  pause: '暂停',
  next: '下一步',
  previous: '上一步',
  restart: '重新开始',
  step: '第 {current} 步，共 {total} 步',
})
defineCatalog(builtin.logViewer, 'zh', {
  label: '日志输出',
  search: '搜索日志',
  follow: '正在跟踪',
  paused: '跳至最新',
  copy: '复制',
  copied: '已复制',
  empty: '无日志输出',
  matches: '{count} 个匹配项',
  lines: '{count} 行',
})
defineCatalog(builtin.editor, 'zh', {
  label: '代码编辑器',
  code: '代码',
  find: '查找',
  replace: '替换',
  findPlaceholder: '查找',
  replacePlaceholder: '替换为',
  next: '下一个匹配项',
  previous: '上一个匹配项',
  replaceOne: '替换',
  replaceAll: '全部替换',
  close: '关闭',
  matchCase: '区分大小写',
  toggleReplace: '切换替换',
  noMatches: '无结果',
  findCount: '第 {current} 个，共 {total} 个',
  commandMenu: '命令菜单',
  commandMenuEmpty: '无命令',
})
