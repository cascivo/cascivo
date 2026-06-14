'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Badge, Button, Drawer, useToast } from '@cascivo/react'
import { persistedSignal } from '@cascivo/storage'
import { api } from '../api'
import type { UserTask } from '../api'
import { msg } from '../i18n'
import styles from './Tasklist.module.css'

const tasksSignal = signal<UserTask[]>([])
const loadingSignal = signal(true)
const claimedIds = persistedSignal<string[]>('flow-claimed', [])

// Drawer state — which task is being completed
const completingTaskId = signal<string | null>(null)
const noteSignal = signal('')
const submittingSignal = signal(false)

function loadTasks() {
  let cancelled = false
  loadingSignal.value = true
  api
    .listTasks()
    .then((data) => {
      if (cancelled) return
      // Merge persisted claims
      const claimed = new Set(claimedIds.value)
      tasksSignal.value = data.map((t) =>
        claimed.has(t.id) && t.assignee === null ? { ...t, assignee: 'current.user' } : t,
      )
      loadingSignal.value = false
    })
    .catch(() => {
      if (cancelled) return
      loadingSignal.value = false
    })
  return () => {
    cancelled = true
  }
}

export function Tasklist() {
  useSignals()
  const { toast } = useToast()

  useSignalEffect(() => loadTasks())

  function handleClaim(task: UserTask) {
    const prev = tasksSignal.value
    // Optimistic update
    tasksSignal.value = prev.map((t) => (t.id === task.id ? { ...t, assignee: 'current.user' } : t))
    claimedIds.value = [...claimedIds.value, task.id]

    api
      .claimTask(task.id)
      .then(() => {
        toast({ title: t(msg.claimSuccess), variant: 'success' })
      })
      .catch(() => {
        // Rollback
        tasksSignal.value = prev
        claimedIds.value = claimedIds.value.filter((id) => id !== task.id)
        toast({ title: t(msg.claimError), variant: 'destructive' })
      })
  }

  function handleOpenComplete(task: UserTask) {
    completingTaskId.value = task.id
    noteSignal.value = ''
  }

  function handleSubmitComplete() {
    const taskId = completingTaskId.value
    if (!taskId) return
    submittingSignal.value = true
    const prev = tasksSignal.value

    api
      .completeTask(taskId, { note: noteSignal.value })
      .then(() => {
        tasksSignal.value = prev.filter((t) => t.id !== taskId)
        claimedIds.value = claimedIds.value.filter((id) => id !== taskId)
        completingTaskId.value = null
        submittingSignal.value = false
        toast({ title: t(msg.completeSuccess), variant: 'success' })
      })
      .catch(() => {
        submittingSignal.value = false
        toast({ title: t(msg.completeError), variant: 'destructive' })
      })
  }

  const tasks = tasksSignal.value
  const completingId = completingTaskId.value

  return (
    <div className={styles['wrapper']}>
      {loadingSignal.value ? (
        <p className={styles['empty']}>{t(msg.loading)}</p>
      ) : tasks.length === 0 ? (
        <p className={styles['empty']}>{t(msg.emptyTasks)}</p>
      ) : (
        <ul className={styles['taskList']}>
          {tasks.map((task) => {
            const isClaimed = task.assignee !== null
            return (
              <li key={task.id} className={styles['taskCard']}>
                <div className={styles['taskInfo']}>
                  <span className={styles['taskName']}>{task.name}</span>
                  <span className={styles['taskMeta']}>
                    {t(msg.colInstance)}: {task.instanceId} &middot; Group: {task.candidateGroup}
                  </span>
                  {task.assignee ? (
                    <Badge variant="secondary">{task.assignee}</Badge>
                  ) : (
                    <Badge variant="outline">{t(msg.unassigned)}</Badge>
                  )}
                </div>
                <div className={styles['taskActions']}>
                  {!isClaimed && (
                    <Button size="sm" variant="secondary" onClick={() => handleClaim(task)}>
                      {t(msg.actionClaim)}
                    </Button>
                  )}
                  {isClaimed && (
                    <Button size="sm" onClick={() => handleOpenComplete(task)}>
                      {t(msg.actionComplete)}
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Drawer
        open={completingId !== null}
        onOpenChange={(open) => {
          if (!open) completingTaskId.value = null
        }}
        title={t(msg.drawerTitle)}
        side="end"
      >
        <div className={styles['drawerBody']}>
          <label className={styles['fieldLabel']}>
            {t(msg.noteLabel)}
            <textarea
              className={styles['noteInput']}
              placeholder={t(msg.notePlaceholder)}
              rows={4}
              value={noteSignal.value}
              onChange={(e) => {
                noteSignal.value = e.currentTarget.value
              }}
            />
          </label>
          <Button onClick={handleSubmitComplete} disabled={submittingSignal.value}>
            {t(msg.submitComplete)}
          </Button>
        </div>
      </Drawer>
    </div>
  )
}
