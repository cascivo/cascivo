import { useSignalState } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Button, Input, Textarea } from '@cascivo/react'
import { Send } from '@cascivo/icons'
import { LIMITS } from '../model'
import { ask } from '../actions'
import { msg } from '../i18n'
import { useRun } from './useRun'
import styles from './AskForm.module.css'

export function AskForm({ code }: { code: string }) {
  const [text, setText] = useSignalState('')
  const [name, setName] = useSignalState('')
  const [busy, setBusy] = useSignalState(false)
  const run = useRun()

  const left = LIMITS.question - text.value.length
  const empty = text.value.trim().length === 0

  const submit = async () => {
    if (empty || busy.value) return
    setBusy(true)
    const sent = await run(() => ask(code, text.value, name.value.trim() || null), t(msg.asked))
    setBusy(false)
    if (sent) setText('')
  }

  return (
    <form
      className={styles['form']}
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <Textarea
        label={t(msg.askTitle)}
        placeholder={t(msg.askPlaceholder)}
        value={text.value}
        maxLength={LIMITS.question}
        rows={2}
        autosize
        resize="none"
        onChange={(event) => setText(event.currentTarget.value)}
        onKeyDown={(event) => {
          // Cmd/Ctrl+Enter sends, as in every chat box.
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void submit()
        }}
      />
      <div className={styles['row']}>
        <Input
          ariaLabel={t(msg.yourName)}
          placeholder={t(msg.yourName)}
          value={name.value}
          maxLength={LIMITS.author}
          autoComplete="nickname"
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <span className={styles['left']} data-low={left < 30 || undefined}>
          {t(msg.charactersLeft, { count: left })}
        </span>
        <Button type="submit" loading={busy.value} disabled={empty}>
          <Send size={16} />
          {t(msg.ask)}
        </Button>
      </div>
    </form>
  )
}
