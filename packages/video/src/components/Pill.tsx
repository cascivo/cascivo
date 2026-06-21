import { color, font } from '../theme'

interface PillProps {
  children: React.ReactNode
  tint?: string
  style?: React.CSSProperties
}

/** Rounded chip used for feature tags and stat callouts. */
export const Pill: React.FC<PillProps> = ({ children, tint = color.accentBright, style }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 22px',
      borderRadius: 999,
      border: `1px solid ${tint}55`,
      background: `${tint}1a`,
      color: color.text,
      fontFamily: font.sans,
      fontSize: 26,
      fontWeight: 600,
      ...style,
    }}
  >
    {children}
  </span>
)
