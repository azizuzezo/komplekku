# Komplekku Agent Instructions

These instructions apply to the entire workspace.

## Required workflow

1. **Always use skills.** Before any response or action, inspect the skills available in the current session. Read `.agents/skills/using-superpowers/SKILL.md` first when it is available, then read and follow every skill that applies to the task. Announce the skill usage to the owner.
2. Before planning, investigating, or editing, read the canonical product specification in `PRD.md` and the current project memory in `Engineering.md`.
3. Inspect the existing implementation and preserve working code and owner changes. Do not recreate a working module without a documented reason.
4. For non-trivial work, create a short plan, work in coherent batches, and verify each meaningful batch with the relevant lint, type-check, tests, build, or focused inspection.
5. Fix or clearly report failures. Never hide a failing check, disable a test merely to make a build green, or claim verification that was not run.
6. Keep development local-first. Do not deploy, publish, push, provision cloud resources, configure production infrastructure, or upload secrets unless the owner explicitly requests that exact external action.
7. Before the final response for **every task**, including read-only investigations and partially completed work, append a dated entry to `Engineering.md`.

## Engineering journal contract

- Treat `Engineering.md` as the durable project handoff and append-only activity journal.
- Record the task objective, work performed, files touched, decisions and assumptions, verification and results, plus follow-ups or blockers.
- Use an absolute timestamp in Asia/Jakarta time (`WIB`, UTC+07:00). Do not use relative dates such as "today."
- Never rewrite or delete an older activity entry. Add a corrective entry if history needs clarification.
- Keep entries factual and concise. Record meaningful actions and outcomes, not noisy raw command output.
- Never record passwords, tokens, private keys, OTP secrets, camera credentials, production personal data, or other sensitive values.
- In multi-agent work, subagents report their actions and findings to the coordinating agent. The coordinator records each contributor in one consolidated entry to avoid concurrent file edits.
- Update the current-state sections when the repository state or an accepted technical decision changes; also append the corresponding historical entry.

## Source of truth

1. The owner's latest explicit instruction controls the current task.
2. `PRD.md` is authoritative for product scope, behavior, design, security, architecture, and local-only constraints.
3. `AGENTS.md` is authoritative for the repository workflow.
4. `Engineering.md` records implemented reality, decisions, verification, and handoff context; it does not silently override the PRD.

If these sources conflict, document the conflict and ask the owner before making an irreversible or scope-changing assumption.
