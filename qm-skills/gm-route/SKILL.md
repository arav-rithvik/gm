---
name: gm-route
description: Route every GBrain task request through GM (the team's own routing model) and turn user corrections into training data. Use whenever a user asks GBrain to do something (a task, not small talk), and whenever a user reacts 👎 to, or corrects, a message that shows a "GM →" route line.
---

# gm-route: GM picks the GBrain skill, the team corrects it, GM learns overnight

GM is a small open model trained on River to pick which GBrain skill handles a request,
with no resolver text in its prompt. This skill connects it to QM. The GM service runs
on the host at `$GM_BRIDGE_URL` (default `http://host.docker.internal:5173`).

## 1. Route a request

When a user asks GBrain to do something, first ask GM which skill should handle it:

```bash
curl -s -X POST "${GM_BRIDGE_URL:-http://host.docker.internal:5173}/api/route" \
  -H 'content-type: application/json' \
  -d "$(jq -n --arg t "<the user's request, verbatim>" '{text:$t}')"
```

It returns `{"skill": "<slug>", "ms": <latency>, "mock": false}`.

Start your reply with exactly one route line, then continue normally:

```
GM → `<skill>` · <ms> ms
```

If `mock` is true or the call fails, write `GM → not connected` and carry on. Never
invent a skill for GM.

## 2. Capture corrections

A correction is any of:

- the user reacts 👎 (`-1`, `thumbsdown`) to your message that has a `GM →` line
- the user replies that the route was wrong ("no, that's meeting-prep", "should be briefing")

Then log it. `prompt` is the original request, `gm_answer` is the skill GM picked,
`correct_answer` is the skill the user wants. If GM was not connected, send `gm_answer` as an empty string. If they reacted 👎 without naming the
right skill, ask once: "Which skill should that have gone to?" and log after they answer.

```bash
curl -s -X POST "${GM_BRIDGE_URL:-http://host.docker.internal:5173}/api/correct" \
  -H 'content-type: application/json' \
  -d "$(jq -n --arg p "<original request>" --arg g "<gm skill>" --arg c "<correct skill>" --arg b "<user's name>" \
        '{prompt:$p, gm_answer:$g, correct_answer:$c, by:$b}')"
```

Reply in one line: `Logged for review. Once approved, GM trains on it tonight.`

A 👍 needs no action.

## Rules

- Corrections go to a **pending** queue. A human approves them before they become
  training data. Never approve on the user's behalf.
- Log only what the user actually said. Never guess the correct skill.
- One route line per reply. Keep it at the very top so the team can see what GM chose.
