import { type Accessor, createSignal } from 'solid-js'

export type FieldErrors = Readonly<Record<string, string>>

export interface FormHelper {
  /** Per-field messages; feed `errors()[name]` to a control's `error` prop. */
  errors: Accessor<FieldErrors>
  submitting: Accessor<boolean>
  /** `<form onSubmit={form.onSubmit}>`: prevents default, ignores double submits, collects errors. */
  onSubmit: (e: SubmitEvent & { currentTarget: HTMLFormElement }) => void
  setErrors: (errors: FieldErrors) => void
}

/**
 * Form state for an island form. `submit` gets the `FormData`; it may return field errors
 * (e.g. the parsed body of a 422) or throw, which becomes `{ '': message }`. Mirrors
 * `<cv-form>`: one submit in flight, errors cleared at the next submit.
 */
export function createForm(
  submit: (data: FormData) => Promise<FieldErrors | void> | FieldErrors | void,
): FormHelper {
  const [errors, setErrors] = createSignal<FieldErrors>({})
  const [submitting, setSubmitting] = createSignal(false)
  const onSubmit: FormHelper['onSubmit'] = (e) => {
    e.preventDefault()
    if (submitting()) return
    setSubmitting(true)
    setErrors({})
    const data = new FormData(e.currentTarget)
    void (async () => {
      try {
        const out = await submit(data)
        if (out) setErrors(out)
      } catch (err) {
        setErrors({ '': err instanceof Error ? err.message : String(err) })
      } finally {
        setSubmitting(false)
      }
    })()
  }
  return { errors, submitting, onSubmit, setErrors }
}
