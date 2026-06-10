# Dark Factory

The cascade dark factory generates new components from `factory-backlog.json`.

## How it runs: inside Claude Code, not headless

The original design (a `factory-supervisor.sh` driving headless `claude -p`
agents) is intentionally **not** used here. Two reasons:

1. **No API key.** This project runs on a Claude subscription. Headless
   `claude -p` and the Agent SDK are billed against a
   [separate monthly Agent SDK credit](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
   (effective 2026-06-15), whereas interactive Claude Code draws from the normal
   subscription. Running the factory _interactively_ keeps it on the plan you
   already pay for, with zero key management.
2. **Simplicity.** The session is already an agent that can read/write files,
   run `vp`, commit, and self-heal on test failures. Wrapping a second agent in
   a bash loop adds plumbing (`--resume` session juggling, JSON parsing,
   permission flags) for no benefit at this scale.

## The mechanism

- **State** lives entirely in `factory-backlog.json` (`status`, `milestone`,
  `attempts` per item) plus git history. Any session can resume where the last
  one stopped — including mid-component.
- **The supervisor is a skill:** [`.claude/skills/factory/SKILL.md`](../../.claude/skills/factory/SKILL.md).
  Run `/factory` in any Claude Code session (terminal, IDE, or web) to work the
  queue. It implements the same milestone loop the roadmap describes —
  generate → verify → self-heal (cap 5) → integrate → mark for review — but as
  instructions the session executes directly.
- **Continuous operation:** `/loop 30m /factory` re-polls on an interval; or a
  `Stop` hook can re-prompt while `pending` items remain.

## Queueing components

Append an item to `factory-backlog.json`:

```json
{
  "name": "combobox",
  "category": "inputs",
  "priority": 22,
  "spec": "One-paragraph behavioral spec…",
  "status": "pending",
  "milestone": null,
  "attempts": 0
}
```

or just ask a session: _"queue a Combobox in the factory backlog."_ The next
`/factory` run picks it up.

## Parallel / bulk generation (optional, needs a key or SDK credit)

If you ever want many components generated in parallel rather than one session
working sequentially, the headless path still exists: `claude -p` with
`--permission-mode dontAsk` and an `--allowedTools` whitelist, resumed via
`--session-id` for self-heal. That lands on the Agent SDK credit, not your
interactive limits. The in-session skill remains the default.
