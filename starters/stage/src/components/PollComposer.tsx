import { useSignalState } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Button, IconButton, Input } from '@cascivo/react'
import { Plus, X } from '@cascivo/icons'
import { LIMITS } from '../model'
import { createPoll } from '../actions'
import { msg } from '../i18n'
import { useRun } from './useRun'
import styles from './PollComposer.module.css'

export function PollComposer({ code }: { code: string }) {
  const [question, setQuestion] = useSignalState('')
  const [options, setOptions] = useSignalState<string[]>(['', ''])
  const [busy, setBusy] = useSignalState(false)
  const run = useRun()

  const filled = options.value.filter((o) => o.trim()).length
  const ready = question.value.trim() !== '' && filled >= LIMITS.minOptions

  return (
    <form
      className={styles['composer']}
      onSubmit={async (event) => {
        event.preventDefault()
        if (!ready || busy.value) return
        setBusy(true)
        const ok = await run(
          () => createPoll(code, question.value, options.value),
          t(msg.pollCreated),
        )
        setBusy(false)
        if (ok) {
          setQuestion('')
          setOptions(['', ''])
        }
      }}
    >
      <Input
        label={t(msg.pollQuestion)}
        placeholder={t(msg.pollQuestionPlaceholder)}
        value={question.value}
        maxLength={LIMITS.pollQuestion}
        onChange={(event) => setQuestion(event.currentTarget.value)}
      />
      <ol className={styles['options']}>
        {options.value.map((option, i) => (
          <li key={i} className={styles['option']}>
            <span className={styles['letter']} aria-hidden="true">
              {String.fromCharCode(65 + i)}
            </span>
            <Input
              ariaLabel={t(msg.option, { count: i + 1 })}
              placeholder={t(msg.option, { count: i + 1 })}
              value={option}
              maxLength={LIMITS.option}
              onChange={(event) => {
                const value = event.currentTarget.value
                setOptions((list) => list.map((o, j) => (j === i ? value : o)))
              }}
            />
            <IconButton
              label={t(msg.removeOption, { count: i + 1 })}
              icon={<X size={16} />}
              size="sm"
              disabled={options.value.length <= LIMITS.minOptions}
              onClick={() => setOptions((list) => list.filter((_, j) => j !== i))}
            />
          </li>
        ))}
      </ol>
      <div className={styles['footer']}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={options.value.length >= LIMITS.maxOptions}
          onClick={() => setOptions((list) => [...list, ''])}
        >
          <Plus size={14} />
          {t(msg.addOption)}
        </Button>
        <Button type="submit" loading={busy.value} disabled={!ready}>
          {t(msg.createPoll)}
        </Button>
      </div>
    </form>
  )
}
