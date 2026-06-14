'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Button, Combobox, Drawer, Input, MultiSelect, Select, useToast } from '@cascivo/react'
import { useForm } from '@cascivo/react'
import { issues, createIssue, updateIssue } from '../store/issues'
import type { IssueStatus } from '../store/issues'
import { USERS, LABELS } from '../data/seed'
import type { IssuePriority } from '../data/seed'
import { msg } from '../i18n'
import styles from './IssueForm.module.css'

interface IssueFormProps {
  open: boolean
  issueId: string | null
  onClose: () => void
}

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Todo' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'in-review', label: 'In Review' },
  { value: 'done', label: 'Done' },
]

const PRIORITY_OPTIONS: { value: IssuePriority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

type FormValues = {
  title: string
  status: IssueStatus
  priority: IssuePriority
  assigneeId: string
  labelIds: string[]
}

export function IssueForm({ open, issueId, onClose }: IssueFormProps) {
  useSignals()
  const { toast } = useToast()

  const existingIssue = issueId ? issues.value.find((i) => i.id === issueId) : null

  const form = useForm<FormValues>({
    initialValues: {
      title: existingIssue?.title ?? '',
      status: existingIssue?.status ?? 'backlog',
      priority: existingIssue?.priority ?? 'medium',
      assigneeId: existingIssue?.assigneeId ?? '',
      labelIds: existingIssue?.labelIds ?? [],
    },
    validate: (values) => {
      const errors: Partial<Record<keyof FormValues, string>> = {}
      if (!values.title.trim()) {
        errors.title = t(msg.formTitleRequired)
      }
      return errors
    },
  })

  // Sync existing issue into form when open state/issueId changes
  const titleField = form.field('title')
  const statusField = form.field('status')
  const priorityField = form.field('priority')
  const assigneeField = form.field('assigneeId')
  const labelIdsField = form.field('labelIds')

  function handleClose() {
    form.reset()
    onClose()
  }

  function handleValid(values: FormValues) {
    if (issueId) {
      updateIssue(issueId, {
        title: values.title,
        status: values.status,
        priority: values.priority,
        assigneeId: values.assigneeId || null,
        labelIds: values.labelIds,
      })
      toast({ title: t(msg.formSaveSuccess), variant: 'success' })
    } else {
      createIssue({
        title: values.title,
        status: values.status,
        priority: values.priority,
        assigneeId: values.assigneeId || null,
        labelIds: values.labelIds,
      })
      toast({ title: t(msg.formCreateSuccess), variant: 'success' })
    }
    handleClose()
  }

  const assigneeOptions = [
    { value: '', label: t(msg.unassigned) },
    ...USERS.map((u) => ({ value: u.id, label: u.name })),
  ]

  const labelOptions = LABELS.map((l) => ({ value: l.id, label: l.name }))

  const drawerTitle = issueId ? t(msg.formTitleEdit) : t(msg.formTitleNew)
  const submitLabel = issueId ? t(msg.formSubmitUpdate) : t(msg.formSubmitCreate)

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose()
      }}
      title={drawerTitle}
      side="end"
      size="28rem"
    >
      <form
        noValidate
        className={styles['body']}
        onSubmit={(e) => {
          e.preventDefault()
          void form.submit(handleValid)
        }}
      >
        <Input
          label={t(msg.formFieldTitle)}
          placeholder={t(msg.formFieldTitlePlaceholder)}
          value={titleField.value}
          onChange={(e) => titleField.onChange(e.currentTarget.value)}
          onBlur={titleField.onBlur}
          {...(form.touched.value.title && titleField.error ? { error: titleField.error } : {})}
          autoFocus
        />

        <Select
          label={t(msg.formFieldStatus)}
          options={STATUS_OPTIONS}
          value={statusField.value}
          onChange={(e) => statusField.onChange(e.currentTarget.value as IssueStatus)}
        />

        <Select
          label={t(msg.formFieldPriority)}
          options={PRIORITY_OPTIONS}
          value={priorityField.value}
          onChange={(e) => priorityField.onChange(e.currentTarget.value as IssuePriority)}
        />

        <Combobox
          label={t(msg.formFieldAssignee)}
          options={assigneeOptions}
          value={assigneeField.value}
          onChange={(v) => assigneeField.onChange(v ?? '')}
          clearable
          searchable={false}
          labels={{ placeholder: t(msg.formFieldAssigneePlaceholder) }}
        />

        <div>
          <div
            style={{
              fontSize: 'var(--cascivo-text-sm)',
              color: 'var(--cascivo-color-foreground-muted)',
              marginBlockEnd: 'var(--cascivo-space-1)',
            }}
          >
            {t(msg.formFieldLabels)}
          </div>
          <MultiSelect
            options={labelOptions}
            value={labelIdsField.value}
            onValueChange={(v) => labelIdsField.onChange(v)}
          />
        </div>

        <div className={styles['actions']}>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.submitting.value}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Drawer>
  )
}
