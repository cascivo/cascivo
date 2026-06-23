import type { FlowEdge } from './types.ts'

export interface StoryStepBase {
  label?: string | undefined
  description?: string | undefined
  /** Override the default per-step duration (ms). */
  duration?: number | undefined
}

/** A step expressed as a node pair — the engine finds the connecting edge. */
export interface StoryStepFromTo extends StoryStepBase {
  from: string
  to: string
}

/** A power-user step that names the edge directly. */
export interface StoryStepEdge extends StoryStepBase {
  edge: string
  reverse?: boolean | undefined
}

export type StoryStep = StoryStepFromTo | StoryStepEdge

export interface ResolvedStep {
  edgeId: string
  direction: 'forward' | 'reverse'
  label?: string | undefined
  description?: string | undefined
  duration?: number | undefined
}

function isEdgeStep(step: StoryStep): step is StoryStepEdge {
  return 'edge' in step
}

/**
 * Resolve one step to an edge id + travel direction. For `{from,to}`, finds the
 * edge connecting the pair in either orientation (so one `A<->B` edge serves
 * both `A→B` and `B→A`). Throws on a step that matches no edge (fail-fast).
 */
export function resolveStep(step: StoryStep, edges: readonly FlowEdge[]): ResolvedStep {
  const common = { label: step.label, description: step.description, duration: step.duration }
  if (isEdgeStep(step)) {
    const edge = edges.find((e) => e.id === step.edge)
    if (!edge) throw new Error(`FlowStory: step references unknown edge "${step.edge}"`)
    return { edgeId: edge.id, direction: step.reverse ? 'reverse' : 'forward', ...common }
  }
  const forward = edges.find((e) => e.source === step.from && e.target === step.to)
  if (forward) return { edgeId: forward.id, direction: 'forward', ...common }
  const reverse = edges.find((e) => e.source === step.to && e.target === step.from)
  if (reverse) return { edgeId: reverse.id, direction: 'reverse', ...common }
  throw new Error(`FlowStory: no edge connects "${step.from}" and "${step.to}"`)
}

/** Resolve a whole script. Pure + deterministic. */
export function resolveScript(
  script: readonly StoryStep[],
  edges: readonly FlowEdge[],
): ResolvedStep[] {
  return script.map((step) => resolveStep(step, edges))
}
