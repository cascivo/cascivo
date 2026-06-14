import { defineMessages } from '@cascivo/i18n'

export const msg = defineMessages('track', {
  // App
  appTitle: 'Cascade Track',
  mockBanner: 'Demo — data persisted in localStorage',

  // Nav
  navBoard: 'Board',
  navList: 'List',

  // Toolbar
  toolbarNewIssue: 'New issue',
  toolbarFilter: 'Filter by assignee',
  toolbarFilterAll: 'All assignees',
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
})
