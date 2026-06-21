import { color, font } from '../theme'

interface EyebrowProps {
  children: React.ReactNode
  tint?: string
  style?: React.CSSProperties
}

/** Small uppercase kicker shown above scene headlines. */
export const Eyebrow: React.FC<EyebrowProps> = ({ children, tint = color.accentBright, style }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: font.sans,
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: '0.32em',
      textTransform: 'uppercase',
      color: tint,
      ...style,
    }}
  >
    <span style={{ width: 36, height: 2, background: tint, borderRadius: 2 }} />
    {children}
  </div>
)
