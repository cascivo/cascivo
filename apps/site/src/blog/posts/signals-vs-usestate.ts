import type { BlogPost } from '../types'

export const post: BlogPost = {
  slug: 'signals-vs-usestate',
  title: 'Signals vs. useState: what actually changes',
  description:
    'cascivo components use signals instead of useState — not as a style preference, but because it changes what re-renders. Here’s what that means in practice, and where the line for "genuine internal state" actually sits.',
  datePublished: '2026-07-07',
  tags: ['signals', 'performance', 'react'],
  blocks: [
    {
      type: 'p',
      text: 'Type into two visually identical forms — one built with cascivo components, one with plain useState — and watch a render counter on each. The useState form re-runs the whole component on every keystroke. The signals form renders once, on mount; after that, typing in a field only updates that field. Same markup, same components. The only thing that changed is the state layer underneath.',
    },
    {
      type: 'p',
      text: 'That demo lives on the performance page, with live numbers read from the actual benchmark run rather than typed into a blog post to go stale — worth playing with directly rather than taking a description of it on faith.',
    },
    { type: 'h2', text: 'Why isolation, not just "fewer renders"' },
    {
      type: 'p',
      text: 'useState schedules a re-render of the component that owns the state, then React diffs its subtree. For a form with ten fields, typing in one still means the component function runs again — React is fast at the diff, but the function still executes, and everything inside it re-evaluates. Signals invert this: a signal write notifies exactly the pieces of the DOM that read that signal’s value. A field component that reads its own signal updates. Its siblings, which never read that signal, don’t re-run at all — not "re-run and bail out early," but never invoked.',
    },
    {
      type: 'p',
      text: 'That’s the whole idea. It’s not a faster useState — it’s a different subscription model, and cascivo components are built on it throughout: useSignal and useComputed for state, useSignalEffect for side effects, never useState, useContext, useEffect, useLayoutEffect, or useReducer.',
    },
    { type: 'h2', text: 'Where the FSM line actually sits' },
    {
      type: 'p',
      text: 'cascivo components also use small state machines (useMachine / createMachine) for genuine internal state — but "genuine" is doing real work in that sentence, and it’s worth being precise about where the line is, because it’s easy to add a machine that never actually does anything.',
    },
    {
      type: 'ul',
      items: [
        'Good: an Input’s idle ↔ focused transition, driven by its own onFocus/onBlur handlers. The component itself decides when to transition — that’s genuine internal state.',
        'Bad: a Button’s idle ↔ loading transition, when loading is a prop the parent passes in. The machine is never driven by anything inside the component — state.value is always idle, and the prop is doing all the actual work. The machine is decoration.',
        'Bad, same shape: a Modal’s closed ↔ open transition, when open is a controlled prop. If a state can only be reached by the parent passing a prop, that state belongs in the parent. The signal already is the state; wrapping it in a machine adds a layer that never transitions on its own.',
      ],
    },
    {
      type: 'p',
      text: 'The test is simple: can the component reach every state in the machine through its own internal logic, or does reaching some states require the parent to hand it a new prop? If it’s the latter, there’s no machine to write — just read the prop.',
    },
    { type: 'h2', text: 'Hover isn’t state — it’s :hover' },
    {
      type: 'p',
      text: 'One more line worth drawing: hover, focus, active, and disabled are visual states, and CSS already has pseudo-classes for exactly this. Tracking :hover in a signal so you can conditionally apply a class is solving a problem CSS solved before JavaScript needed to run at all. data-state attributes are for states CSS pseudo-classes genuinely can’t express — loading, error — not a general-purpose replacement for :hover and :focus-visible.',
    },
    {
      type: 'callout',
      text: 'The pattern underneath all three of these: push state as close to "owned by CSS" or "owned by nothing" as it can honestly go, and only reach for signals — or a machine on top of them — when something has to actually track a value across renders.',
    },
    {
      type: 'links',
      items: [
        {
          text: 'Try the isolated-render demo and see the live benchmark numbers',
          href: '/performance',
        },
        { text: 'Full benchmark methodology and results', href: '/docs/benchmarks' },
        { text: 'Browse components built this way', href: '/docs' },
      ],
    },
  ],
}
