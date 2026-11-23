# AGENTS.md

Guidance for AI coding agents working in this repository. Explore the code to learn its current shape; this file covers how to work, not where things are.

## Core philosophy

- **Channels and agents are separate.** A channel only moves messages in and out of a platform. An agent only decides what to reply. Neither should know the other's internals, so a new platform or a new agent can be added without touching the other side.
- **Small and boring beats clever.** Prefer a few plain functions over layers of abstraction. Add an abstraction only when a second real use appears.
- **Never lose or double-handle a message.** Delivery order, de-duplication and persistence matter more than speed. When in doubt, choose the behaviour that keeps the conversation correct.
- **Configuration lives outside code.** Secrets and credentials come from the environment; agent behaviour (instructions, skills) comes from editable files, not hard-coded strings.
- **Fail loudly in development, gracefully in production.** A failed model or tool call should be logged and must not crash the process or block other conversations.

## Best practices

- TypeScript is strict. Don't use `any` or non-null assertions to silence the compiler; model the types properly. Third-party types that are genuinely loose are the only exception.
- Keep modules focused and named after what they do. Export small, explicit interfaces.
- Use `async`/`await`, not `.then()` chains. Never leave a promise floating unless it is intentionally fire-and-forget (mark it with `void`).
- Validate external input (tool arguments, model output, platform payloads) at the boundary, e.g. with `zod`.
- Don't log message contents, phone numbers or credentials.
- Don't add a dependency for something a few lines of code can do. Remove dependencies that are no longer used.
- Leave the code formatted and type-correct before finishing:
  ```bash
  pnpm typecheck
  pnpm format
  ```
- Update `README.md` when user-facing setup or behaviour changes.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): message`

- **type**: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `ci`, `build`
- **scope** (optional): the area touched, e.g. `agent`, `channel`, `tool`, `deps`
- **message**: imperative, lowercase, no trailing period, under ~72 characters

```
feat(agent): add messaging queue
fix(channel): skip duplicate message ids
chore(deps): remove unused packages
```

Keep each commit to one logical change. Explain _why_ in the body when it isn't obvious from the message.
