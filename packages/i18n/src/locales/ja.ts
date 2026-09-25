import { builtin } from '../builtin'
import { defineCatalog } from '../messages'

defineCatalog(builtin.pagination, 'ja', {
  itemsPerPage: '1ページあたりの項目数',
  pageOf: '{page} / {total} ページ',
  range: '{total} 件中 {start}–{end} 件',
  previous: '前のページ',
  next: '次のページ',
  nav: 'ページネーション',
})
defineCatalog(builtin.toast, 'ja', {
  dismiss: '通知を閉じる',
  region: '通知',
})
defineCatalog(builtin.modal, 'ja', {
  close: 'ダイアログを閉じる',
})
defineCatalog(builtin.alert, 'ja', {
  dismiss: '閉じる',
})
defineCatalog(builtin.header, 'ja', {
  nav: 'メイン',
})
defineCatalog(builtin.search, 'ja', {
  label: '検索',
  placeholder: '検索',
  clear: '検索をクリア',
})
defineCatalog(builtin.commandMenu, 'ja', {
  label: 'コマンドメニュー',
  placeholder: 'コマンドを入力または検索…',
  empty: '結果が見つかりません',
  back: '戻る',
  loading: '読み込み中…',
  matches: '{count} 件一致',
  scopeLabel: '範囲',
  clearScope: '範囲をクリア',
})
defineCatalog(builtin.breadcrumb, 'ja', {
  nav: 'パンくずリスト',
})
defineCatalog(builtin.datePicker, 'ja', {
  placeholder: '日付を選択',
  previousMonth: '前の月',
  nextMonth: '次の月',
  clear: '日付をクリア',
  open: 'カレンダーを開く',
})
defineCatalog(builtin.combobox, 'ja', {
  placeholder: 'オプションを選択',
  empty: 'オプションが見つかりません',
  clear: '選択をクリア',
  loading: 'オプションを読み込み中…',
  create: '「{label}」を追加',
  resultCount: '{count} 件のオプションがあります',
})
defineCatalog(builtin.dataTable, 'ja', {
  search: '検索',
  empty: 'データがありません',
  selectAll: 'すべての行を選択',
  selectRow: '行を選択',
  itemsSelected: '{count} 件選択済み',
  expandRow: '行を展開',
  previousPage: '前のページ',
  nextPage: '次のページ',
  columns: '列',
  actions: 'アクション',
  noResults: '一致する行がありません',
  clearFilters: 'フィルターをクリア',
  filterColumn: '{column} でフィルター',
  min: '最小',
  max: '最大',
  all: 'すべて',
  columnMenu: '{column} のオプション',
  sortAscending: '昇順で並べ替え',
  sortDescending: '降順で並べ替え',
  clearSort: '並べ替えをクリア',
  moveLeft: '左へ移動',
  moveRight: '右へ移動',
  pinStart: '先頭に固定',
  pinEnd: '末尾に固定',
  unpin: '固定を解除',
  hideColumn: '列を非表示',
  resizeColumn: '{column} のサイズを変更',
  editCell: '{column} を編集',
  totals: '合計',
  exportCsv: 'CSV をエクスポート',
})
defineCatalog(builtin.dock, 'ja', {
  nav: 'メインナビゲーション',
})
defineCatalog(builtin.steps, 'ja', {
  label: 'ステップ',
})
defineCatalog(builtin.overflowMenu, 'ja', {
  trigger: 'その他の操作',
})
defineCatalog(builtin.sideNav, 'ja', {
  nav: 'サイドナビゲーション',
  collapse: 'ナビゲーションを折りたたむ',
  expand: 'ナビゲーションを展開',
})
defineCatalog(builtin.spinner, 'ja', {
  label: '読み込み中',
})
defineCatalog(builtin.numberInput, 'ja', {
  increment: '増やす',
  decrement: '減らす',
})
defineCatalog(builtin.tag, 'ja', {
  dismiss: '削除',
})
defineCatalog(builtin.appShell, 'ja', {
  collapse: 'ナビゲーションを折りたたむ',
  expand: 'ナビゲーションを展開',
  dismissError: 'エラーを閉じる',
})
defineCatalog(builtin.charts, 'ja', {
  legendToggle: '系列 {name} の表示を切り替え',
  noData: 'データがありません',
  resetZoom: 'ズームをリセット',
  exportPng: 'PNG をエクスポート',
  exportSvg: 'SVG をエクスポート',
  dataView: 'データビュー',
  restore: '元に戻す',
})
defineCatalog(builtin.alertDialog, 'ja', {
  confirm: '確認',
  cancel: 'キャンセル',
})
defineCatalog(builtin.sheet, 'ja', {
  close: 'パネルを閉じる',
})
defineCatalog(builtin.bottomSheet, 'ja', {
  close: '閉じる',
  handle: 'ドラッグしてサイズを変更',
})
defineCatalog(builtin.actionSheet, 'ja', {
  label: 'アクション',
  cancel: 'キャンセル',
})
defineCatalog(builtin.reorderList, 'ja', {
  handle: '{name} を並べ替え',
  grabbed: '{name} を持ち上げました。{total} 中 {position} 番目です。',
  moved: '{name} を {total} 中 {position} 番目に移動しました。',
  dropped: '{name} を {total} 中 {position} 番目にドロップしました。',
  cancelled: '並べ替えをキャンセルしました。{name} は元の位置に戻りました。',
})
defineCatalog(builtin.infiniteScroll, 'ja', {
  loadMore: 'さらに読み込む',
  loading: 'さらに読み込み中',
})
defineCatalog(builtin.pullToRefresh, 'ja', {
  pull: '引っ張って更新',
  release: '指を離して更新',
  refreshing: '更新中',
})
defineCatalog(builtin.fileUploader, 'ja', {
  label: 'ファイルをアップロード',
  drop: 'ここにファイルをドラッグ＆ドロップするか、クリックしてアップロード',
  remove: '{name} を削除',
  uploading: 'アップロード中',
  complete: 'アップロード完了',
  error: 'アップロードに失敗しました',
  status: { other: '{count} 個のファイル: {state}' },
})
defineCatalog(builtin.passwordInput, 'ja', {
  reveal: 'パスワードを表示',
  hide: 'パスワードを非表示',
  strengthWeak: '弱い',
  strengthFair: '普通',
  strengthGood: '良い',
  strengthStrong: '強い',
  strengthLabel: 'パスワードの強度: {level}',
})
defineCatalog(builtin.multiSelect, 'ja', {
  label: 'オプション',
  placeholder: 'オプションを選択',
  selected: '{count} 件選択済み',
  search: 'オプションを検索',
  noResults: 'オプションが見つかりません',
  loading: 'オプションを読み込み中…',
  clear: '選択をクリア',
  remove: '{label} を削除',
  selectAll: 'すべて選択',
  clearAll: 'すべてクリア',
  create: '「{label}」を追加',
  selectionChanged: '{total} 件中 {count} 件選択済み',
  maxReached: '最大 {max} 件まで選択できます',
})
defineCatalog(builtin.tagsInput, 'ja', {
  label: 'タグ',
  remove: '{tag} を削除',
  placeholder: 'タグを追加…',
})
defineCatalog(builtin.otpInput, 'ja', {
  label: 'ワンタイムコード',
  digit: '{n} 桁目',
})
defineCatalog(builtin.ai, 'ja', {
  generating: '生成中…',
  done: '完了',
  error: 'エラー',
  send: '送信',
  placeholder: 'メッセージを入力…',
  you: 'あなた',
  assistant: 'アシスタント',
})
defineCatalog(builtin.shellHeader, 'ja', {
  skipToContent: 'メインコンテンツへスキップ',
  nav: 'メイン',
  openMenu: 'ナビゲーションを開く',
  closeMenu: 'ナビゲーションを閉じる',
})
defineCatalog(builtin.headerPanel, 'ja', {
  close: 'パネルを閉じる',
})
defineCatalog(builtin.switcher, 'ja', {
  label: 'アプリケーションを切り替え',
})
defineCatalog(builtin.copyButton, 'ja', {
  copy: 'コピー',
  copied: 'コピーしました',
})
defineCatalog(builtin.skipNav, 'ja', {
  label: 'コンテンツへスキップ',
})
defineCatalog(builtin.form, 'ja', {
  required: '必須',
  invalid: '無効な値です',
})
defineCatalog(builtin.label, 'ja', {
  required: '必須',
})
defineCatalog(builtin.inlineLoading, 'ja', {
  active: '読み込み中',
  finished: '読み込み完了',
  error: 'エラー',
})
defineCatalog(builtin.notification, 'ja', {
  dismiss: '閉じる',
})
defineCatalog(builtin.treeView, 'ja', {
  loading: '読み込み中…',
  expand: '展開',
  collapse: '折りたたむ',
})
defineCatalog(builtin.carousel, 'ja', {
  region: 'カルーセル',
  previous: '前のスライド',
  next: '次のスライド',
  slide: '{n} / {total}',
  goTo: 'スライド {n} へ移動',
  choose: '表示するスライドを選択',
  play: 'スライドショーの自動再生を開始',
  pause: 'スライドショーの自動再生を停止',
})
defineCatalog(builtin.calendar, 'ja', {
  previousMonth: '前の月',
  nextMonth: '次の月',
  today: '今日',
  weekNumber: '週',
})
defineCatalog(builtin.colorPicker, 'ja', {
  hue: '色相',
  alpha: '不透明度',
  colorArea: '彩度と明度',
  saturation: '彩度',
  brightness: '明度',
  eyedropper: '画面から色を選択',
  presets: 'プリセットカラー',
  hex: 'カラー値',
  value: '選択した色 {color}',
})
defineCatalog(builtin.drawer, 'ja', {
  close: '閉じる',
})
defineCatalog(builtin.menuButton, 'ja', {
  open: 'メニューを開く',
})
defineCatalog(builtin.resizable, 'ja', {
  handle: 'パネルのサイズを変更',
})
defineCatalog(builtin.codeSnippet, 'ja', {
  copy: 'コードをコピー',
  copied: 'コピーしました',
})
defineCatalog(builtin.dateRangePicker, 'ja', {
  label: '期間',
  placeholder: '期間を選択',
  start: '開始日',
  end: '終了日',
  apply: '適用',
  clear: 'クリア',
})
defineCatalog(builtin.toggletip, 'ja', {
  label: '詳細情報',
})
defineCatalog(builtin.toc, 'ja', {
  nav: 'このページの内容',
})
defineCatalog(builtin.avatarGroup, 'ja', {
  more: '他 {count} 人',
})
defineCatalog(builtin.comparison, 'ja', {
  label: '比較スライダー',
})
defineCatalog(builtin.qrCode, 'ja', {
  label: 'QR コード',
})
defineCatalog(builtin.flow, 'ja', {
  zoomIn: '拡大',
  zoomOut: '縮小',
  fitView: '全体を表示',
  minimap: 'ミニマップ',
  play: '再生',
  pause: '一時停止',
  next: '次のステップ',
  previous: '前のステップ',
  restart: '最初から',
  step: 'ステップ {current} / {total}',
})
defineCatalog(builtin.logViewer, 'ja', {
  label: 'ログ出力',
  search: 'ログを検索',
  follow: '追跡中',
  paused: '最新へ移動',
  copy: 'コピー',
  copied: 'コピーしました',
  empty: 'ログ出力がありません',
  matches: '{count} 件一致',
  lines: '{count} 行',
})
defineCatalog(builtin.editor, 'ja', {
  label: 'コードエディター',
  code: 'コード',
  find: '検索',
  replace: '置換',
  findPlaceholder: '検索',
  replacePlaceholder: '置換後の文字列',
  next: '次の一致',
  previous: '前の一致',
  replaceOne: '置換',
  replaceAll: 'すべて置換',
  close: '閉じる',
  matchCase: '大文字と小文字を区別',
  toggleReplace: '置換の切り替え',
  noMatches: '結果なし',
  findCount: '{current} / {total}',
  commandMenu: 'コマンドメニュー',
  commandMenuEmpty: 'コマンドがありません',
})
