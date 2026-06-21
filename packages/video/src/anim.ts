import { Easing, interpolate, type SpringConfig, spring } from 'remotion'

/** Eased 0→1 ramp that clamps outside its window — the workhorse for reveals. */
export function ramp(frame: number, delay = 0, duration = 18): number {
  return interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
}

/** Fade + rise-up reveal. Returns inline style. */
export function riseIn(frame: number, delay = 0, distance = 26): React.CSSProperties {
  const t = ramp(frame, delay, 20)
  return { opacity: t, transform: `translateY(${(1 - t) * distance}px)` }
}

/** Springy entrance scaled by a config. */
export function pop(frame: number, fps: number, delay = 0, config?: Partial<SpringConfig>): number {
  return spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, mass: 0.7, stiffness: 120, ...config },
  })
}

/** Fade out over the final `duration` frames of a scene. */
export function tailFade(frame: number, sceneFrames: number, duration = 14): number {
  return interpolate(frame, [sceneFrames - duration, sceneFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}
