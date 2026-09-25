import { builtin } from '../builtin'
import { defineCatalog } from '../messages'

defineCatalog(builtin.pagination, 'ko', {
  itemsPerPage: '페이지당 항목 수',
  pageOf: '{total}페이지 중 {page}페이지',
  range: '전체 {total}개 중 {start}–{end}',
  previous: '이전 페이지',
  next: '다음 페이지',
  nav: '페이지 매기기',
})
defineCatalog(builtin.toast, 'ko', {
  dismiss: '알림 닫기',
  region: '알림',
})
defineCatalog(builtin.modal, 'ko', {
  close: '대화상자 닫기',
})
defineCatalog(builtin.alert, 'ko', {
  dismiss: '닫기',
})
defineCatalog(builtin.header, 'ko', {
  nav: '기본',
})
defineCatalog(builtin.search, 'ko', {
  label: '검색',
  placeholder: '검색',
  clear: '검색어 지우기',
})
defineCatalog(builtin.commandMenu, 'ko', {
  label: '명령 메뉴',
  placeholder: '명령을 입력하거나 검색…',
  empty: '결과 없음',
  back: '뒤로',
  loading: '로드 중…',
  matches: '일치 항목 {count}개',
  scopeLabel: '범위',
  clearScope: '범위 지우기',
})
defineCatalog(builtin.breadcrumb, 'ko', {
  nav: '탐색 경로',
})
defineCatalog(builtin.datePicker, 'ko', {
  placeholder: '날짜 선택',
  previousMonth: '이전 달',
  nextMonth: '다음 달',
  clear: '날짜 지우기',
  open: '달력 열기',
})
defineCatalog(builtin.combobox, 'ko', {
  placeholder: '옵션 선택',
  empty: '옵션 없음',
  clear: '선택 지우기',
  loading: '옵션 로드 중…',
  create: '“{label}” 추가',
  resultCount: '사용 가능한 옵션 {count}개',
})
defineCatalog(builtin.dataTable, 'ko', {
  search: '검색',
  empty: '데이터 없음',
  selectAll: '모든 행 선택',
  selectRow: '행 선택',
  itemsSelected: '{count}개 선택됨',
  expandRow: '행 펼치기',
  previousPage: '이전 페이지',
  nextPage: '다음 페이지',
  columns: '열',
  actions: '작업',
  noResults: '일치하는 행 없음',
  clearFilters: '필터 지우기',
  filterColumn: '{column} 필터',
  min: '최소',
  max: '최대',
  all: '전체',
  columnMenu: '{column} 옵션',
  sortAscending: '오름차순 정렬',
  sortDescending: '내림차순 정렬',
  clearSort: '정렬 지우기',
  moveLeft: '왼쪽으로 이동',
  moveRight: '오른쪽으로 이동',
  pinStart: '시작 부분에 고정',
  pinEnd: '끝 부분에 고정',
  unpin: '고정 해제',
  hideColumn: '열 숨기기',
  resizeColumn: '{column} 크기 조정',
  editCell: '{column} 편집',
  totals: '합계',
  exportCsv: 'CSV 내보내기',
})
defineCatalog(builtin.dock, 'ko', {
  nav: '기본 탐색',
})
defineCatalog(builtin.steps, 'ko', {
  label: '단계',
})
defineCatalog(builtin.overflowMenu, 'ko', {
  trigger: '추가 작업',
})
defineCatalog(builtin.sideNav, 'ko', {
  nav: '측면 탐색',
  collapse: '탐색 접기',
  expand: '탐색 펼치기',
})
defineCatalog(builtin.spinner, 'ko', {
  label: '로드 중',
})
defineCatalog(builtin.numberInput, 'ko', {
  increment: '증가',
  decrement: '감소',
})
defineCatalog(builtin.tag, 'ko', {
  dismiss: '제거',
})
defineCatalog(builtin.appShell, 'ko', {
  collapse: '탐색 접기',
  expand: '탐색 펼치기',
  dismissError: '오류 닫기',
})
defineCatalog(builtin.charts, 'ko', {
  legendToggle: '{name} 계열 표시/숨기기',
  noData: '데이터 없음',
  resetZoom: '확대/축소 재설정',
  exportPng: 'PNG 내보내기',
  exportSvg: 'SVG 내보내기',
  dataView: '데이터 보기',
  restore: '복원',
})
defineCatalog(builtin.alertDialog, 'ko', {
  confirm: '확인',
  cancel: '취소',
})
defineCatalog(builtin.sheet, 'ko', {
  close: '패널 닫기',
})
defineCatalog(builtin.bottomSheet, 'ko', {
  close: '닫기',
  handle: '드래그하여 크기 조정',
})
defineCatalog(builtin.actionSheet, 'ko', {
  label: '작업',
  cancel: '취소',
})
defineCatalog(builtin.reorderList, 'ko', {
  handle: '{name} 순서 변경',
  grabbed: '{name} 항목을 잡았습니다. {total}개 중 {position}번째 위치입니다.',
  moved: '{name} 항목을 {total}개 중 {position}번째 위치로 이동했습니다.',
  dropped: '{name} 항목을 {total}개 중 {position}번째 위치에 놓았습니다.',
  cancelled: '순서 변경이 취소되었습니다. {name} 항목이 원래 위치로 돌아갔습니다.',
})
defineCatalog(builtin.infiniteScroll, 'ko', {
  loadMore: '더 불러오기',
  loading: '더 불러오는 중',
})
defineCatalog(builtin.pullToRefresh, 'ko', {
  pull: '당겨서 새로 고침',
  release: '놓아서 새로 고침',
  refreshing: '새로 고치는 중',
})
defineCatalog(builtin.fileUploader, 'ko', {
  label: '파일 업로드',
  drop: '여기로 파일을 끌어다 놓거나 클릭하여 업로드',
  remove: '{name} 제거',
  uploading: '업로드 중',
  complete: '업로드 완료',
  error: '업로드 실패',
  status: { other: '파일 {count}개: {state}' },
})
defineCatalog(builtin.passwordInput, 'ko', {
  reveal: '비밀번호 표시',
  hide: '비밀번호 숨기기',
  strengthWeak: '약함',
  strengthFair: '보통',
  strengthGood: '좋음',
  strengthStrong: '강함',
  strengthLabel: '비밀번호 강도: {level}',
})
defineCatalog(builtin.multiSelect, 'ko', {
  label: '옵션',
  placeholder: '옵션 선택',
  selected: '{count}개 선택됨',
  search: '옵션 검색',
  noResults: '옵션 없음',
  loading: '옵션 로드 중…',
  clear: '선택 지우기',
  remove: '{label} 제거',
  selectAll: '모두 선택',
  clearAll: '모두 지우기',
  create: '“{label}” 추가',
  selectionChanged: '{total}개 중 {count}개 선택됨',
  maxReached: '최대 {max}개까지 선택 가능',
})
defineCatalog(builtin.tagsInput, 'ko', {
  label: '태그',
  remove: '{tag} 제거',
  placeholder: '태그 추가…',
})
defineCatalog(builtin.otpInput, 'ko', {
  label: '일회용 코드',
  digit: '{n}번째 자리',
})
defineCatalog(builtin.ai, 'ko', {
  generating: '생성 중…',
  done: '완료',
  error: '오류',
  send: '보내기',
  placeholder: '메시지 입력…',
  you: '나',
  assistant: '어시스턴트',
})
defineCatalog(builtin.shellHeader, 'ko', {
  skipToContent: '본문으로 건너뛰기',
  nav: '기본',
  openMenu: '탐색 열기',
  closeMenu: '탐색 닫기',
})
defineCatalog(builtin.headerPanel, 'ko', {
  close: '패널 닫기',
})
defineCatalog(builtin.switcher, 'ko', {
  label: '애플리케이션 전환',
})
defineCatalog(builtin.copyButton, 'ko', {
  copy: '복사',
  copied: '복사됨',
})
defineCatalog(builtin.skipNav, 'ko', {
  label: '콘텐츠로 건너뛰기',
})
defineCatalog(builtin.form, 'ko', {
  required: '필수',
  invalid: '잘못된 값',
})
defineCatalog(builtin.label, 'ko', {
  required: '필수',
})
defineCatalog(builtin.inlineLoading, 'ko', {
  active: '로드 중',
  finished: '로드됨',
  error: '오류',
})
defineCatalog(builtin.notification, 'ko', {
  dismiss: '닫기',
})
defineCatalog(builtin.treeView, 'ko', {
  loading: '로드 중…',
  expand: '펼치기',
  collapse: '접기',
})
defineCatalog(builtin.carousel, 'ko', {
  region: '캐러셀',
  previous: '이전 슬라이드',
  next: '다음 슬라이드',
  slide: '{total}개 중 {n}번째',
  goTo: '{n}번 슬라이드로 이동',
  choose: '표시할 슬라이드 선택',
  play: '슬라이드 자동 재생 시작',
  pause: '슬라이드 자동 재생 중지',
})
defineCatalog(builtin.calendar, 'ko', {
  previousMonth: '이전 달',
  nextMonth: '다음 달',
  today: '오늘',
  weekNumber: '주',
})
defineCatalog(builtin.colorPicker, 'ko', {
  hue: '색조',
  alpha: '불투명도',
  colorArea: '채도 및 밝기',
  saturation: '채도',
  brightness: '밝기',
  eyedropper: '화면에서 색상 선택',
  presets: '사전 설정 색상',
  hex: '색상 값',
  value: '선택한 색상 {color}',
})
defineCatalog(builtin.drawer, 'ko', {
  close: '닫기',
})
defineCatalog(builtin.menuButton, 'ko', {
  open: '메뉴 열기',
})
defineCatalog(builtin.resizable, 'ko', {
  handle: '패널 크기 조정',
})
defineCatalog(builtin.codeSnippet, 'ko', {
  copy: '코드 복사',
  copied: '복사됨',
})
defineCatalog(builtin.dateRangePicker, 'ko', {
  label: '날짜 범위',
  placeholder: '날짜 범위 선택',
  start: '시작 날짜',
  end: '종료 날짜',
  apply: '적용',
  clear: '지우기',
})
defineCatalog(builtin.toggletip, 'ko', {
  label: '추가 정보',
})
defineCatalog(builtin.toc, 'ko', {
  nav: '이 페이지의 내용',
})
defineCatalog(builtin.avatarGroup, 'ko', {
  more: '외 {count}명',
})
defineCatalog(builtin.comparison, 'ko', {
  label: '비교 슬라이더',
})
defineCatalog(builtin.qrCode, 'ko', {
  label: 'QR 코드',
})
defineCatalog(builtin.flow, 'ko', {
  zoomIn: '확대',
  zoomOut: '축소',
  fitView: '화면에 맞추기',
  minimap: '미니맵',
  play: '재생',
  pause: '일시 정지',
  next: '다음 단계',
  previous: '이전 단계',
  restart: '다시 시작',
  step: '{total}단계 중 {current}단계',
})
defineCatalog(builtin.logViewer, 'ko', {
  label: '로그 출력',
  search: '로그 검색',
  follow: '따라가는 중',
  paused: '최신 항목으로 이동',
  copy: '복사',
  copied: '복사됨',
  empty: '로그 출력 없음',
  matches: '일치 항목 {count}개',
  lines: '{count}줄',
})
defineCatalog(builtin.editor, 'ko', {
  label: '코드 편집기',
  code: '코드',
  find: '찾기',
  replace: '바꾸기',
  findPlaceholder: '찾기',
  replacePlaceholder: '바꿀 내용',
  next: '다음 일치 항목',
  previous: '이전 일치 항목',
  replaceOne: '바꾸기',
  replaceAll: '모두 바꾸기',
  close: '닫기',
  matchCase: '대/소문자 구분',
  toggleReplace: '바꾸기 전환',
  noMatches: '결과 없음',
  findCount: '{total}개 중 {current}번째',
  commandMenu: '명령 메뉴',
  commandMenuEmpty: '명령 없음',
})
