import type { Job, JobState } from './jobs'
import { writeRoom } from './sync-server'
import type { RoomNamespace } from './sync-server'
import type { Json } from './sync-protocol'

/**
 * `@cascivo/app/jobs-server` — how whatever runs a job reports on it.
 *
 * Each call replaces the job's state in its room, and every browser watching it updates.
 * In a Workflow, report **inside** `step.do(...)`: a Workflow replays `run()` from the top
 * after every sleep or retry, skipping finished steps, so a report outside a step would run
 * again and move the progress backwards.
 */
export interface JobReporter<O> {
  queued(): Promise<void>
  /** Starts step `index` (0-based), optionally with a line of detail. */
  step(index: number, message?: string): Promise<void>
  /** Reports how far the current step is, 0–1. */
  progress(index: number, fraction: number, message?: string): Promise<void>
  done(output: O): Promise<void>
  /** Marks the job failed at `step` (default: the last step this reporter reported). */
  fail(error: unknown, step?: number): Promise<void>
}

export function jobReporter<O, Id>(
  job: Job<O>,
  rooms: RoomNamespace<Id>,
  id: string,
): JobReporter<O> {
  const room = job.roomName(id)
  let last: JobState<O> = job.initial
  const report = (state: JobState<O>) => {
    last = state
    // A JSON round trip: the output must survive the network as JSON, and this is where a
    // value that would not (a Date, a Map) turns into what the browser will actually get.
    const json: Json = JSON.parse(JSON.stringify(state))
    return writeRoom(rooms, room, 'state', json)
  }
  const checkStep = (index: number) => {
    if (!Number.isInteger(index) || index < 0 || index >= job.steps.length) {
      throw new Error(`Step ${index} is out of range: this job has ${job.steps.length} steps`)
    }
  }
  return {
    queued: () => report(job.initial),
    step(index, message) {
      checkStep(index)
      return report({ ...job.initial, status: 'running', step: index, message: message ?? null })
    },
    progress(index, fraction, message) {
      checkStep(index)
      const clamped = Math.min(1, Math.max(0, fraction))
      return report({
        ...job.initial,
        status: 'running',
        step: index,
        progress: clamped,
        message: message ?? null,
      })
    },
    done(output) {
      return report({ ...job.initial, status: 'done', step: job.steps.length - 1, output })
    },
    fail(error, step = last.step) {
      checkStep(step)
      return report({
        ...job.initial,
        status: 'failed',
        step,
        error: error instanceof Error ? error.message : String(error),
      })
    },
  }
}
