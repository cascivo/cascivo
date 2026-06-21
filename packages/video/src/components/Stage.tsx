import { AbsoluteFill } from 'remotion'
import { font } from '../theme'
import { Background } from './Background'

interface StageProps {
  children: React.ReactNode
  glow?: [string, string]
  grid?: boolean
  /** Centre content (default) or align to the start for asymmetric layouts. */
  align?: 'center' | 'start'
}

/** Per-scene wrapper: shared background plus a padded content column. */
export const Stage: React.FC<StageProps> = ({ children, glow, grid, align = 'center' }) => (
  <AbsoluteFill style={{ fontFamily: font.sans }}>
    <Background {...(glow ? { glow } : {})} {...(grid === undefined ? {} : { grid })} />
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        textAlign: align === 'center' ? 'center' : 'start',
        padding: '120px 150px',
        gap: 36,
      }}
    >
      {children}
    </AbsoluteFill>
  </AbsoluteFill>
)
