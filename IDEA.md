# GM: Garry's Model

**GM = Garry's Model. Also: General Manager.**

We took Garry Tan's entire stack (GBrain and GStack) and compiled it into his own open-weight model. GM does the work that GBrain does with Claude, but it is faster and cheaper, and Garry owns it. Every night, GM trains on the day's new skills and corrections, so it wakes up smarter than it went to sleep.

Built by Arav and Rithvik for the YC *Own Your Intelligence* Hackathon (Sep 27, 2026). It uses QM, GBrain, Memorable and River AI.

---

## The one line

> **GBrain optimizes skills in text. GM compiles them into weights.**
> Agent, memory, model: all yours.

---

## The thesis

Garry says to own three things: **your own agent, your own memory, your own models.**

- **Own agent:** QM
- **Own memory:** GBrain and Memorable
- **Own model:** **nobody has built this yet.** That is GM.

Today, Garry's brain runs on rented intelligence. 155,795 pages, 75 skills and 66 cron jobs all run through a frontier model that someone else owns. Every skill is text that gets pasted into the prompt on every call. The resolver alone adds about 13KB to every prompt. The brain gets smarter each night, but the *model* never does.

GM moves Garry's skills from the prompt into the weights. The skills stop being instructions the model reads. They become things the model simply knows how to do.

---

## Why weights, not more context

| | Context (skills as text) | Weights (GM) |
|---|---|---|
| Cost | Paid on **every call, forever** | Paid **once**, at training |
| Speed | Slower. Long prompts on a big model | Faster. Short prompts on an owned model |
| Scale | More skills = bigger prompt | More skills = same prompt |
| Ownership | The brain is rented | **The brain is yours** |

**Rule:** facts stay in context (GBrain pages, permissions, today's data). **Skills and behavior go into weights.**

---

## What Garry already built, and what GM adds

GBrain already improves itself, but only in **text space**:

| Already in GBrain | What it does | What GM adds |
|---|---|---|
| **Dream cycle** | Cleans and enriches the brain at night | Also **trains the model** at night |
| **`skill-optimizer`** | Rewrites skill *text* to score better | **Compiles** the improved skill into *weights* |
| **`skill-autobench`** | Builds evals from real use; a user correction is the gold signal | Uses those cases as **training data and held-out tests** |
| **`correction-pipeline`** | Traces a correction to its source and fixes the data | Also trains the **behavior** fix into the model |
| **Memorable** | Records how a task was done and replays it as text | Turns proven procedures into **weights** |

GM is the weight-space version of the loop that Garry already runs.

---

## What GM learns (baked into weights)

GM learns **7 behaviors** from GBrain's real files. Everything else stays as text or in the brain.

| # | Behavior | Source in GBrain | What GM learns | Example |
|---|---|---|---|---|
| 1 | **Routing** | `RESOLVER.md` (~2,500 words, loaded on every call) | Request → the right skill, plus the disambiguation rules | "Create a page for John Smith from his GitHub" → `enrich` |
| 2 | **Brain-first habit** | `brain-ops` (Phase 1: brain-first lookup) | Search the brain **before** answering or calling an outside API; pull context before every reply | "What do we know about Stripe?" → `gbrain query` first, not the web |
| 3 | **Filing** | `_brain-filing-rules.md` (~1,400 words), `brain-taxonomist` | Decision protocol, common misfiling mistakes, notability gate | A book summary → the right `media/` folder, not `sources/` |
| 4 | **Page format** | Two-layer pages, `frontmatter-guard` | Compiled truth (summary, State, Open Threads, See Also) above the line, a dated and sourced timeline below, valid YAML frontmatter | Raw meeting notes → a correctly shaped person-page update |
| 5 | **Citations and back-links** | GBrain's "Iron Laws", `citation-fixer`, `brain-link-discipline` | Every fact has a source, every mention links `[[people/slug]]`, every new page is linked back | "CTO of Acme [source: call 2026-09-20]" + back-link |
| 6 | **Enrichment judgment** | `enrich` (tiers, when and when **not** to enrich), `signal-detector` | Which signals matter, how deep to enrich, what to skip | A passing name in an email → a light touch, not a full research run |
| 7 | **Output style** | `_output-rules.md` (no slop, exact phrasing kept, good titles, deterministic links), `briefing` | Garry's writing and briefing style | A daily briefing in the right sections, with no filler |

### Not in weights

| Stays as **text (skills)** | Why |
|---|---|
| Exact commands and flags (`gbrain` CLI, `db-repair`, `migrate`, `gbrain-upgrade`) | They change by version |
| Safety (`data-loss-gate`, `mcp-access`, consent rules) | Must be auditable and enforced |
| New or changing skills | They change faster than one retrain a night |
| Rare setup skills (`setup`, `cold-start`) | Too few examples to train on |
| The voice profile in `draft-in-voice` | The skill reads the profile fresh every time |

| Stays in **the brain** | Why |
|---|---|
| People, companies, deals, meetings, facts, timelines | Facts change, need permissions, and must be deletable |

### What this saves on every call

The always-loaded text (resolver + filing rules + output rules) plus one loaded skill is about **5,500–6,000 words, or roughly 7,000–8,000 tokens**, on every call. GM needs almost none of it. Only a short stub stays for safety rules.

> **GM knows how to route, look up, file, format, cite, enrich and write the Garry way. It does not know *who* anyone is. It asks the brain.**

---

## How it works

### Stage 1: Compile Garry's stack into GM

**Goal:** turn GBrain and GStack into a specialized model.

1. **Collect the stack.** All of Garry's GBrain and GStack skills, their `triggers:`, the resolver, the filing and output rules, and his eval fixtures.
2. **Define the training pairs** for each skill:
   - **Input:** a prompt that would normally trigger the skill: the skill's own triggers plus many new wordings.
   - **Output:** the correct process and result the skill describes, with no skill text in the prompt.
3. **Generate and collect the pairs** at scale.
4. **Fine-tune the best open-weight model available** on River AI.
5. **Result:** GM, a model that knows Garry's stack by heart.

The first skill we compile is the **resolver**, which picks the right skill for a request. GM routes to all 75 skills with **0 bytes of resolver in the prompt**.

### Benchmark

The same prompt, in the same GBrain environment, on Garry's common tasks:

| Model | Setup |
|---|---|
| Claude | + GBrain skills in the prompt |
| GPT | + GBrain skills in the prompt |
| Base open-weight model | + GBrain skills in the prompt (no training) |
| **GM** | **no skill text in the prompt** |

We score all four on **Garry's own evals**. For example, `evals/functional-area-resolver`, where Garry already measured Opus, Sonnet and Haiku on a held-out set. We measure accuracy, latency, cost per task and prompt tokens.

### Stage 2: GM improves itself every night

**Goal:** GM keeps fitting itself to the person or company it works for.

Every night, GM collects new training pairs from three sources and updates its weights.

**1. Corrections from the day**
- **Input:** the prompt the user sent, where the agent's answer did not satisfy them.
- **Output:** the correct way to do it, based on the user's correction.

**2. Memorable workflows**
- **Input:** the task a user asks for, in any wording, with no workflow text in the prompt.
- **Used only when** a machine can check the workflow and a human approved adding it. It scores higher if it is a rule, if it is used across tasks that look different, and if memory missed it.
- **Output:** the correct result, done the way Memorable's saved workflow says. It counts only if it passes that workflow's verifying command.
- **Gate:** after training, GM must also pass held-back rewordings with no regressions, or it **rolls back**.

**3. Skills added or edited**
- **Input:** the prompt that would normally trigger the skill.
- **Output:** the process of solving the problem or doing the task that the skill describes.
- **A skill moves into the weights over time** when it:
  - is used often
  - is triggered by many different wordings
  - describes a behavior, not exact steps
  - is stable since the last training run
- Skills that are new or still changing stay in text until they are stable. A wrong skill never gets burned into the weights.

### Every morning

The new GM goes live only if it beats yesterday's GM on the held-out set. If it does not, GM rolls back.

---

## How GM is used: QM as the harness

GM plugs into **QM** through QM's custom model provider (an OpenAI-compatible endpoint). QM **auto-routes** each task:

```
Task comes in
   │
QM ROUTER
   ├─ Garry's routine skills → GM (fast, cheap, owned)
   │    ingest · enrich · resolve · file · cite · format · triage · brief
   │
   └─ Hard, new, or coding work → frontier model (Claude / GPT)
```

- **GM** runs the high-volume work, including the 66 nightly crons: ingest, enrich, citation fixing, frontmatter checks, taxonomy, signal detection and daily prep.
- **The frontier model** runs deep reasoning and coding.
- Each night, more of the work moves to GM.

---

## Who it is for

1. **Power users who run their own brain**, like Garry. GM is the first one.
2. **Teams on QM.** Every company turns its skills and corrections into its own model.

GM is the demo. The product is the pipeline: **any GBrain in, your own model out.**

```
gm train --brain <any gbrain>
```

---

## Sponsors

| Sponsor | Role in GM |
|---|---|
| **GBrain** | The source: Garry's skills, rules, evals and corrections |
| **GStack** | More of Garry's skills to compile |
| **River AI** | Fine-tunes and serves GM; the weights stay ours |
| **Memorable** | Records verified workflows that become training data every night |
| **QM** | The harness: routing, crons, corrections, and serving GM to the team |

---

## The demo

| Time | On screen |
|---|---|
| 0:00 | **Hook:** "Garry runs 66 crons on rented models every night. His resolver adds ~12KB to every prompt." |
| 0:15 | "We compiled his whole stack into a model he owns. **GM: Garry's Model.**" |
| 0:30 | **Split screen:** the same prompt in the same GBrain, Claude vs GM. Live timers and cost counters. |
| 0:50 | **Scoreboard on Garry's own evals:** Claude, GPT, base model, GM. Accuracy, speed, cost, and prompt tokens (~12KB vs 0). |
| 1:15 | **The night:** Garry corrects GM in QM → Memorable logs it → the night job trains → in the morning GM gets it right, and the regression gate is green. |
| 1:40 | **Owned:** the open weights, downloaded and portable. |
| 1:50 | **Close:** "GBrain optimizes skills in text. GM compiles them into weights. Agent, memory, model: all yours." |

---

## Future customizations

More nightly training sources, each with its own input, output and check:

| Source | Input | Output | Check |
|---|---|---|---|
| **Approvals and rejections** | The task that made the PR or draft (kept if the same pattern shows up in 3+ cases) | Merged as-is = *chosen*; rejected or rewritten = *rejected* | Held-out merges and rejections |
| **Voice and tone** | A writing request, with no style guide (kept with 20+ stable real examples) | A draft in your voice; your final edit is the target | Blind comparison against held-out real messages |
| **Tool habits** | A task that needs a tool call (kept if the habit applies to many steps and broke before) | The correct tool, argument format and ask-permission choice | The call runs and returns a valid result |
| **Formats you always want** | Any request that makes a report, JSON or commit message (kept if the format is stable) | The result in your exact format | Schema or pattern match |
| **Triage and priority** | A bug, ticket or request, with no rule text (kept with 10+ consistent labeled decisions) | The correct priority or owner ("P1", "→ Arav") | Agreement with held-out past decisions |
| **Codebase conventions** | A coding task in that repo (kept if the convention appears in many merged PRs) | Code that follows the convention | Lint, tests, and a match with the merged style |
| **Team vocabulary** | A question that uses a team term, with no definition (kept if the definition is stable) | An answer that uses your definition | A query or test that encodes the definition |

---

## Sources

- [GBrain](https://github.com/garrytan/gbrain): skills, `skill-optimizer`, `skill-autobench`, `correction-pipeline`, `evals/`
- [GStack](https://github.com/garrytan/gstack)
- [QM](https://github.com/yc-software/qm)
- [Garry Tan: "your own agent, your own models, your own memory"](https://x.com/garrytan/status/2096283493764665350)
- [gstack × gbrain Hackathon #1 recap](https://www.compiled.sh/articles/gstax-x-gbrain-hackathon-1)
