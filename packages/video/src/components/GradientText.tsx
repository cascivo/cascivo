import { gradient } from '../theme'

interface GradientTextProps {
  children: React.ReactNode
  variant?: keyof typeof gradient
  style?: React.CSSProperties
}

/** Headline text painted with a brand gradient. */
export const GradientText: React.FC<GradientTextProps> = ({
  children,
  variant = 'brand',
  style,
}) => (
  <span
    style={{
      backgroundImage: gradient[variant],
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      ...style,
    }}
  >
    {children}
  </span>
)
