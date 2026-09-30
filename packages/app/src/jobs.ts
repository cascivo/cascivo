import { computed } from '@cascivo/core'
import type { ReadonlySignal } from '@cascivo/core'
import { connectRoom } from './sync'
import type { Parser, RoomOptions, RoomStatus } from './sync'

/**
 * `@cascivo/app/jobs` — background work with live progress.
 *
 * A job's progress is a read-only room: whatever runs the job (a Workflow, a Queue consumer,
 * `ctx.waitUntil`) reports into it with `jobReporter` from `@cascivo/app/jobs-server`, and
 * the browser watches it with `watchJob`. Progress is stored by the room, so a reload, a
 * second tab or another device picks the job up where it is.
 *
 * ```ts
 * // shared by both sides
 * export const importJob = defineJob({ steps: ['Read', 'Check', 'Import'], output: parseSummary })
 * // browser
 * const job = watchJob(importJob, `/api/jobs/${id}`)
 * job.state.value // { status: 'running', step: 1, progress: 0.4, message: 'Checked 40 of 100' … }
 * ```
 */

export type JobStatus = 'queued' | 'running' | 'done' | 'failed'

export interface JobState<O> {
  status: JobStatus
  /** Index of the current step in the job's `steps`. */
  step: number
  /** How far the current step is, 0–1, when the runner reports it. */
  progress: number | null
  /** A short line for the current step, e.g. "Imported 40 of 100". */
  message: string | null
  /** The result, once `status` is `done`. */
  output: O | null
  /** Why it stopped, once `status` is `failed`. */
  error: string | null
}

export interface Job<O> {
  /** The step labels, in order. */
  readonly steps: readonly string[]
  /** The state before the runner has reported anything. */
  readonly initial: JobState<O>
  /** Checks a state that crossed the network; the output goes through the job's parser. */
  parseState(raw: unknown): JobState<O>
  /** The room a job's progress lives in. */
  roomName(id: string): string
}

const JOB_ID = /^[\w-]{1,60}$/
const STATUSES: readonly string[] = ['queued', 'running', 'done', 'failed']

/** Declares a job: its steps, and the parser for what it produces. */
export function defineJob<O>(definition: { steps: readonly string[]; output: Parser<O> }): Job<O> {
  const { steps, output } = definition
  if (steps.length === 0) throw new Error('A job needs at least one step')
  const initial: JobState<O> = {
    status: 'queued',
    step: 0,
    progress: null,
    message: null,
    output: null,
    error: null,
  }
  return {
    steps,
    initial,
    parseState(raw) {
      if (typeof raw !== 'object' || raw === null) throw new Error('A job state is an object')
      const r = raw as Record<string, unknown>
      if (typeof r['status'] !== 'string' || !STATUSES.includes(r['status'])) {
        throw new Error('Unknown job status')
      }
      const step = r['step']
      if (typeof step !== 'number' || !Number.isInteger(step) || step < 0 || step >= steps.length) {
        throw new Error('Job step out of range')
      }
      const progress = r['progress']
      const message = r['message']
      const error = r['error']
      return {
        // Checked against STATUSES above.
        status: r['status'] as JobStatus,
        step,
        progress: typeof progress === 'number' && progress >= 0 && progress <= 1 ? progress : null,
        message: typeof message === 'string' ? message : null,
        output: r['status'] === 'done' ? output(r['output']) : null,
        error: typeof error === 'string' ? error : null,
      }
    },
    roomName(id) {
      if (!JOB_ID.test(id)) throw new Error(`Job ids are 1–60 letters, digits, _ or -: "${id}"`)
      return `job-${id}`
    },
  }
}

export interface WatchedJob<O> {
  /** The job's state: `initial` until the runner reports, then live. */
  readonly state: ReadonlySignal<JobState<O>>
  /** The connection to the job's room. */
  readonly connection: ReadonlySignal<RoomStatus>
  /** Stops watching. */
  close(): void
}

/**
 * Watches a job through its room. `url` is where your Worker forwards the WebSocket for this
 * job — to `roomResponse(request, env.ROOMS, job.roomName(id), { readOnly: true })`.
 */
export function watchJob<O>(
  job: Job<O>,
  url: string,
  options: Pick<RoomOptions, 'WebSocket'> = {},
): WatchedJob<O> {
  const room = connectRoom(url, options)
  const shared = room.signal('state', job.initial, job.parseState)
  return {
    state: computed(() => shared.value),
    connection: room.status,
    close: () => room.close(),
  }
}
