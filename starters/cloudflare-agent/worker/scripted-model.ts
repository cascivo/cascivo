import { simulateReadableStream } from 'ai'
import { MockLanguageModelV4 } from 'ai/test'

/**
 * A stand-in for Workers AI during `vite dev`: it answers every message by calling
 * show_view with the view below, then replies with one line of text. It goes through the
 * same tool, validation and streaming as the real model, so the page can be built offline.
 * Production never imports it — worker/assistant.ts reaches it behind `import.meta.env.DEV`.
 */
const VIEW = {
  view: {
    regions: {
      main: [
        {
          component: 'Flex',
          props: { direction: 'vertical', gap: 3 },
          children: [
            {
              component: 'Alert',
              props: { variant: 'info', title: 'Scripted reply' },
              children:
                'vite dev answers from worker/scripted-model.ts. Deploy to talk to Workers AI.',
            },
            {
              component: 'Grid',
              props: { cols: 3, gap: 3 },
              children: [
                {
                  component: 'Card',
                  props: { padding: 'md' },
                  children: [
                    { component: 'Badge', props: { variant: 'success' }, children: 'API healthy' },
                  ],
                },
                {
                  component: 'Card',
                  props: { padding: 'md' },
                  children: [
                    {
                      component: 'Badge',
                      props: { variant: 'warning' },
                      children: '2 jobs queued',
                    },
                  ],
                },
                {
                  component: 'Card',
                  props: { padding: 'md' },
                  children: [{ component: 'Badge', children: '14 users online' }],
                },
              ],
            },
            { component: 'ProgressBar', props: { value: 72, label: 'Sprint progress' } },
          ],
        },
      ],
    },
  },
}

const usage = {
  inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 0, text: 0, reasoning: 0 },
}

export function scriptedModel(): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    doStream: async ({ prompt }) => {
      // After the tool has run, the last prompt message is its result: reply in text.
      if (prompt.at(-1)?.role === 'tool') {
        return {
          stream: simulateReadableStream({
            chunkDelayInMs: 40,
            chunks: [
              { type: 'stream-start', warnings: [] },
              { type: 'text-start', id: 'reply' },
              { type: 'text-delta', id: 'reply', delta: 'Here is the overview ' },
              { type: 'text-delta', id: 'reply', delta: 'you asked for.' },
              { type: 'text-end', id: 'reply' },
              { type: 'finish', usage, finishReason: { unified: 'stop', raw: 'stop' } },
            ],
          }),
        }
      }
      return {
        stream: simulateReadableStream({
          chunkDelayInMs: 40,
          chunks: [
            { type: 'stream-start', warnings: [] },
            {
              type: 'tool-call',
              toolCallId: `call-${prompt.length}`,
              toolName: 'show_view',
              input: JSON.stringify({ title: 'Team overview', view: VIEW }),
            },
            { type: 'finish', usage, finishReason: { unified: 'tool-calls', raw: 'tool_calls' } },
          ],
        }),
      }
    },
  })
}
