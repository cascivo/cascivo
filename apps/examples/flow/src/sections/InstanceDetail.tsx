'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Badge, Tabs, TabsList, TabsTrigger, TabsContent, Timeline, TreeView } from '@cascivo/react'
import type { TimelineItem, TreeNode } from '@cascivo/react'
import { api } from '../api'
import type { ProcessInstance, Incident } from '../api'
import { FlowDiagram } from '../components/FlowDiagram'
import { msg } from '../i18n'
import styles from './InstanceDetail.module.css'

interface InstanceDetailProps {
  instanceId: string
}

const instanceSignal = signal<ProcessInstance | null>(null)
const incidentsSignal = signal<Incident[]>([])
const loadingSignal = signal(true)

function variablesToTree(vars: Record<string, unknown>): TreeNode[] {
  return Object.entries(vars).map(([key, val]) => ({
    id: key,
    label: `${key}: ${String(val)}`,
  }))
}

export function InstanceDetail({ instanceId }: InstanceDetailProps) {
  useSignals()

  useSignalEffect(() => {
    let cancelled = false
    loadingSignal.value = true
    instanceSignal.value = null
    incidentsSignal.value = []

    Promise.all([api.getInstance(instanceId), api.listIncidents(instanceId)])
      .then(([inst, incs]) => {
        if (cancelled) return
        instanceSignal.value = inst ?? null
        incidentsSignal.value = incs
        loadingSignal.value = false
      })
      .catch(() => {
        if (cancelled) return
        loadingSignal.value = false
      })

    return () => {
      cancelled = true
    }
  })

  if (loadingSignal.value) {
    return <p className={styles['loading']}>{t(msg.loading)}</p>
  }

  const instance = instanceSignal.value
  if (!instance) return null

  const timelineItems: TimelineItem[] = instance.history.map((h, i) => ({
    id: `${h.nodeId}-${i}`,
    title: h.nodeId,
    time: new Date(h.timestamp).toLocaleTimeString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    status: i === instance.history.length - 1 ? 'current' : 'complete',
  }))

  const treeItems: TreeNode[] = variablesToTree(instance.variables)
  const incidents = incidentsSignal.value

  return (
    <div className={styles['wrapper']}>
      <div className={styles['header']}>
        <h2 className={styles['title']}>{instance.id}</h2>
        <Badge
          variant={
            instance.status === 'completed'
              ? 'success'
              : instance.status === 'incident'
                ? 'destructive'
                : 'default'
          }
        >
          {instance.status}
        </Badge>
      </div>

      <div className={styles['body']}>
        <Tabs defaultValue="diagram">
          <TabsList>
            <TabsTrigger value="diagram">{t(msg.tabDiagram)}</TabsTrigger>
            <TabsTrigger value="history">{t(msg.tabHistory)}</TabsTrigger>
            <TabsTrigger value="variables">{t(msg.tabVariables)}</TabsTrigger>
            <TabsTrigger value="incidents">{t(msg.tabIncidents)}</TabsTrigger>
          </TabsList>

          <TabsContent value="diagram">
            <FlowDiagram currentNodeId={instance.currentNodeId} />
          </TabsContent>

          <TabsContent value="history">
            {timelineItems.length > 0 ? (
              <Timeline items={timelineItems} />
            ) : (
              <p className={styles['emptyText']}>{t(msg.emptyHistory)}</p>
            )}
          </TabsContent>

          <TabsContent value="variables">
            <TreeView items={treeItems} aria-label="Instance variables" />
          </TabsContent>

          <TabsContent value="incidents">
            {incidents.length > 0 ? (
              <ul className={styles['incidentList']}>
                {incidents.map((inc) => (
                  <li key={inc.id} className={styles['incidentItem']}>
                    <span className={styles['incidentMsg']}>{inc.message}</span>
                    <span className={styles['incidentMeta']}>
                      Step: {inc.nodeId} &middot;{' '}
                      {new Date(inc.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles['emptyText']}>{t(msg.emptyIncidents)}</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
