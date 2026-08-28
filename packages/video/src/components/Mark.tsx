import { color } from '../theme'

interface MarkProps {
  size?: number
  /** 0→1 build progress: the square wipes in, then the accent drops into the notch. */
  progress?: number
}

/** The mark on its native 32-unit grid: a filled square with a bite out of the right edge. */
const MARK_PATH = 'M0 0H32V11H11V21H32V32H0Z'

/**
 * The cascivo mark ("the Notch"): one closed path, maximum ink, no interior detail.
 * Reversed variant — the stage is near-black, so the ink is the light text colour and
 * the notch takes the brand accent.
 *
 * The build wipes the square in from the stem outward and only then fills the bite, so
 * the shape reads as solid before it reads as two-colour.
 */
export const Mark: React.FC<MarkProps> = ({ size = 120, progress = 1 }) => {
  const clamp = (n: number) => Math.max(0, Math.min(1, n))
  // The square lands over the first half of the build; the accent fills over the second.
  const body = clamp(progress * 2)
  const accent = clamp(progress * 2 - 1)
  // Spring overshoot would otherwise make the id collide across concurrent instances.
  const clipId = `cascivo-mark-wipe-${size}`

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={32 * body} height={32} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path
          d={MARK_PATH}
          fill={color.text}
          style={{ filter: `drop-shadow(0 6px 22px ${color.accentBright}55)` }}
        />
        <rect x={11} y={11} width={21 * accent} height={10} fill={color.accentBright} />
      </g>
    </svg>
  )
}
