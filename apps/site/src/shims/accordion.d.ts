import type { ComponentChildren } from 'preact'

export interface AccordionProps {
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  className?: string
  children?: ComponentChildren
}

export interface AccordionItemProps {
  value: string
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

export interface AccordionTriggerProps {
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

export interface AccordionContentProps {
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

export declare function Accordion(props: AccordionProps): JSX.Element
export declare function AccordionItem(props: AccordionItemProps): JSX.Element
export declare function AccordionTrigger(props: AccordionTriggerProps): JSX.Element
export declare function AccordionContent(props: AccordionContentProps): JSX.Element
