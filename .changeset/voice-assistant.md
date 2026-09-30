---
'cascivo': minor
'@cascivo/mcp': minor
---

`cascivo create --framework cloudflare --example voice` scaffolds a `/voice` page: a voice
assistant on the Agents SDK's voice pipeline (`withVoice` from `agents/voice`).

- The Worker runs Workers AI speech to text (Flux, which also detects the end of a turn), a
  text model and text to speech, in one Durable Object per conversation.
- The page drives `VoiceClient` from `agents/voice/client`, which has no React dependency, so
  the example runs on Preact, the default runtime.
- Typed messages work too. A reload shows the conversation so far.
- `vite dev` runs the whole call offline with labelled stand-ins, because Workers AI has no
  local mode. `VITE_REAL_AI=1` uses the real models.
- When the model cannot be reached, the assistant says so aloud instead of staying silent.
- The MCP tool `create_app` accepts `examples: ['voice']`.
