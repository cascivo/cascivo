export interface FormConfig<T extends Record<string, unknown>> {
  initialValues: T
  validate?: (
    values: T,
  ) => Partial<Record<keyof T, string>> | Promise<Partial<Record<keyof T, string>>>
}

export interface FormStore<T extends Record<string, unknown>> {
  field<K extends keyof T>(
    name: K,
  ): {
    value: T[K]
    onChange: (value: T[K]) => void
    onBlur: () => void
    error: string | undefined
  }
  setValue<K extends keyof T>(name: K, value: T[K]): void
  submit(onValid: (values: T) => void | Promise<void>): Promise<void>
  reset(): void
}

export interface FormProps<T extends Record<string, unknown>> {
  form: FormStore<T>
  onValid: (values: T) => void | Promise<void>
  children: import('preact').ComponentChildren
  className?: string
  [key: string]: unknown
}

export declare function createForm<T extends Record<string, unknown>>(
  config: FormConfig<T>,
): FormStore<T>
export declare function useForm<T extends Record<string, unknown>>(
  config: FormConfig<T>,
): FormStore<T>
export declare function Form<T extends Record<string, unknown>>(props: FormProps<T>): JSX.Element
