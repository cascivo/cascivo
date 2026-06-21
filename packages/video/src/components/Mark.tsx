import { color } from '../theme'

interface MarkProps {
  size?: number
  /** 0→1 build progress for the cascading layers. */
  progress?: number
}

/**
 * The cascivo mark: three offset rounded bars cascading down — a nod to the CSS
 * cascade and `@layer` that the system is built on.
 */
export const Mark: React.FC<MarkProps> = ({ size = 120, progress = 1 }) => {
  const layers = [
    { w: 0.92, x: 0, tint: color.accentBright },
    { w: 0.72, x: 0.16, tint: color.accent },
    { w: 0.52, x: 0.32, tint: color.ai },
  ]
  const bar = size * 0.2
  const gap = size * 0.12

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden>
      {layers.map((layer, i) => {
        const reveal = Math.max(0, Math.min(1, progress * layers.length - i))
        const y = i * (bar + gap) + size * 0.1
        return (
          <rect
            key={layer.tint}
            x={layer.x * size}
            y={y}
            width={layer.w * size * reveal}
            height={bar}
            rx={bar / 2}
            fill={layer.tint}
            opacity={reveal}
            style={{ filter: `drop-shadow(0 6px 22px ${layer.tint}66)` }}
          />
        )
      })}
    </svg>
  )
}
