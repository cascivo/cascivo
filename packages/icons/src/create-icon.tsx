import type { SVGAttributes } from 'react'

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'color'> {
  /** Width and height in pixels. */
  size?: number
  /** Stroke color — defaults to currentColor so icons inherit text color. */
  color?: string
  className?: string
}

/** Build an icon component from SVG path children. 24×24 viewBox, stroked. */
export function createIcon(name: string, children: React.ReactNode) {
  function Icon({ size = 24, color = 'currentColor', ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden={props['aria-label'] ? undefined : true}
        {...props}
      >
        {children}
      </svg>
    )
  }
  Icon.displayName = name
  return Icon
}
