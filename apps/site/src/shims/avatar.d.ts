export interface AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'busy'
  className?: string
  [key: string]: unknown
}

export declare function Avatar(props: AvatarProps): JSX.Element
