import type { ComponentChildren } from 'preact'

export interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

export interface CardHeaderProps {
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

export interface CardTitleProps {
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

export interface CardContentProps {
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

export interface CardFooterProps {
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

export declare function Card(props: CardProps): JSX.Element
export declare function CardHeader(props: CardHeaderProps): JSX.Element
export declare function CardTitle(props: CardTitleProps): JSX.Element
export declare function CardContent(props: CardContentProps): JSX.Element
export declare function CardFooter(props: CardFooterProps): JSX.Element
