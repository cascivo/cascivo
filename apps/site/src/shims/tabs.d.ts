import type { ComponentChildren } from 'preact'

export interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children?: ComponentChildren
}

export interface TabsTriggerProps {
  value: string
  disabled?: boolean
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

export interface TabsContentProps {
  value: string
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

export interface TabsListProps {
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

export declare function Tabs(props: TabsProps): JSX.Element
export declare function TabsList(props: TabsListProps): JSX.Element
export declare function TabsTrigger(props: TabsTriggerProps): JSX.Element
export declare function TabsContent(props: TabsContentProps): JSX.Element
