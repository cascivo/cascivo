import { defineMessages } from '@cascivo/i18n'

export const msg = defineMessages('track', {
  // App
  appTitle: 'Cascade Track',
  mockBanner: 'Demo — data persisted in localStorage',

  // Nav
  navBoard: 'Board',
  navList: 'List',
  navInbox: 'Inbox',
  navMyIssues: 'My Issues',
  navNotifications: 'Notifications',
  navGroupFavorites: 'Favorites',
  navGroupTeams: 'Your teams',
  navTeamName: 'Forum',
  navSubIssues: 'Issues',
  navSubCycles: 'Cycles',
  navSubProjects: 'Projects',
  navSubViews: 'Views',
  navSubPages: 'Pages',
  navSettings: 'Settings',
  notifCount: '3',
  issueTabAll: 'All Issues',
  issueTabActive: 'Active',
  issueTabBacklog: 'Backlog',

  // Toolbar
  toolbarNewIssue: 'New issue',
  toolbarFilter: 'Filter by assignee',
  toolbarFilterAll: 'All assignees',
  toolbarSort: 'Sort',
  viewBoard: 'Board',
  viewList: 'List',

  // Keyboard shortcuts
  shortcutNewIssue: 'Press C to create a new issue',
  shortcutEscape: 'Press Escape to close',

  // Statuses
  statusBacklog: 'Backlog',
  statusTodo: 'Todo',
  statusInProgress: 'In Progress',
  statusInReview: 'In Review',
  statusDone: 'Done',

  // Priorities
  priorityUrgent: 'Urgent',
  priorityHigh: 'High',
  priorityMedium: 'Medium',
  priorityLow: 'Low',

  // Board
  boardNoIssues: 'No issues',
  boardMoveToBacklog: 'Move to Backlog',
  boardMoveToTodo: 'Move to Todo',
  boardMoveToInProgress: 'Move to In Progress',
  boardMoveToInReview: 'Move to In Review',
  boardMoveToDone: 'Move to Done',
  boardEditIssue: 'Edit',
  boardDeleteIssue: 'Delete',

  // List
  listColTitle: 'Title',
  listColStatus: 'Status',
  listColPriority: 'Priority',
  listColAssignee: 'Assignee',
  listColLabels: 'Labels',
  listEmpty: 'No issues found',
  listEditIssue: 'Edit',
  listDeleteIssue: 'Delete',

  // Form (drawer)
  formTitleNew: 'New Issue',
  formTitleEdit: 'Edit Issue',
  formFieldTitle: 'Title',
  formFieldTitlePlaceholder: 'Issue title',
  formFieldStatus: 'Status',
  formFieldPriority: 'Priority',
  formFieldAssignee: 'Assignee',
  formFieldAssigneePlaceholder: 'Unassigned',
  formFieldLabels: 'Labels',
  formSubmitCreate: 'Create issue',
  formSubmitUpdate: 'Save changes',
  formTitleRequired: 'Title is required',
  formSaveSuccess: 'Issue saved',
  formCreateSuccess: 'Issue created',

  // Unassigned
  unassigned: 'Unassigned',

  // Actions
  cancel: 'Cancel',

  // Settings
  settingsTitle: 'Settings',
  settingsTabPreferences: 'Preferences',
  settingsTabWorkspace: 'Workspace',

  // Preferences
  prefSectionGeneral: 'General',
  prefDisplayName: 'Display name',
  prefDisplayNameDesc: 'Your name as displayed across the interface.',
  prefNotifications: 'Send comment on',
  prefNotificationsDesc: 'When someone @mentions you in a comment, send a notification.',
  prefSectionTheme: 'Interface and theme',
  prefFontSize: 'Font size',
  prefFontSizeDesc: 'Set the size of text across the app.',
  prefFontDefault: 'Default',
  prefFontLarge: 'Large',
  prefPointerCursors: 'Use pointer cursors',
  prefPointerCursorsDesc: 'Show pointer cursors for interactive elements.',
  prefThemeLabel: 'Theme',
  prefThemeDesc: 'Customize your interface scale and appearance.',
  prefThemeLight: 'Light',
  prefThemeDark: 'Dark',

  // Workspace
  wsTitle: 'Workspace',
  wsLogo: 'Logo',
  wsLogoDesc: 'Recommended size is 128×128px.',
  wsName: 'Name',
  wsUrl: 'URL',
  wsSectionTimeRegion: 'Time & region',
  wsFirstMonth: 'First month of the fiscal year',
  wsFirstMonthDesc: 'Used when grouping periods by fiscal year, quarter, and quarter.',
  wsMonthJanuary: 'January',
  wsMonthApril: 'April',
  wsMonthJuly: 'July',
  wsMonthOctober: 'October',
  wsRegion: 'Region',
  wsRegionDesc: 'Set when a workspace is available and cannot be changed.',
  wsRegionUS: 'United States',
  wsRegionEU: 'European Union',
  wsRegionAP: 'Asia Pacific',
  wsDangerZone: 'Danger zone',
  wsDeleteWorkspace: 'Delete workspace',
  wsDeleteDesc: 'Permanently delete this workspace and all data.',
  wsDeleteBtn: 'Delete workspace',
  wsDeleteDialogTitle: 'Delete workspace',
  wsDeleteDialogDesc:
    'This action cannot be undone. All issues and data will be permanently deleted.',
  wsDeleteDialogCancel: 'Cancel',
  wsDeleteDialogConfirm: 'Delete',
})
